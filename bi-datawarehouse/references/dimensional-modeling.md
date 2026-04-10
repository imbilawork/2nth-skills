# Dimensional Modeling Reference

## Table of Contents
1. [Star Schema Fundamentals](#star-schema)
2. [Fact Table Patterns](#fact-tables)
3. [Dimension Table Patterns](#dimension-tables)
4. [Slowly Changing Dimensions](#scds)
5. [Advanced Patterns](#advanced)
6. [Naming Conventions](#naming)

---

## Star Schema Fundamentals {#star-schema}

### The Four-Step Design Process (Kimball Method)

1. **Select the business process** — What activity are we measuring? (orders, shipments, web visits)
2. **Declare the grain** — What does one row represent? (one order line, one daily snapshot, one event)
3. **Identify the dimensions** — Who, what, where, when, why, how?
4. **Identify the facts** — What are we measuring? (amount, quantity, duration)

### Grain Rules

- The grain must be declared before any other design decision
- Every fact in the table must be true at the declared grain
- If a fact doesn't match the grain, it belongs in a different fact table
- When in doubt, choose the most atomic grain — you can always aggregate up

### Star vs. Snowflake

| Aspect | Star Schema | Snowflake Schema |
|---|---|---|
| Dimension normalization | Denormalized (flat) | Normalized (hierarchies in separate tables) |
| Query performance | Faster (fewer joins) | Slower (more joins) |
| Storage | More redundant | Less redundant |
| Ease of use | Simpler for analysts | More complex |
| **Recommendation** | **Default choice** | Only when dimension is very large (>10M rows) with deeply nested hierarchy |

---

## Fact Table Patterns {#fact-tables}

### Three Types of Fact Tables

#### 1. Transaction Fact Tables
- One row per event/transaction at the most atomic grain
- Sparse — rows only exist when events occur
- Example: `fct_orders` — one row per order line item

```sql
CREATE TABLE fct_orders (
    order_key           BIGINT PRIMARY KEY,  -- surrogate
    date_key            INT NOT NULL REFERENCES dim_date(date_key),
    customer_key        INT NOT NULL REFERENCES dim_customer(customer_key),
    product_key         INT NOT NULL REFERENCES dim_product(product_key),
    store_key           INT NOT NULL REFERENCES dim_store(store_key),
    order_number        VARCHAR(50),          -- degenerate dimension
    quantity            INT,
    unit_price          DECIMAL(12,2),
    discount_amount     DECIMAL(12,2),
    net_amount          DECIMAL(12,2),
    tax_amount          DECIMAL(12,2),
    gross_amount        DECIMAL(12,2)
);
```

#### 2. Periodic Snapshot Fact Tables
- One row per entity per time period
- Dense — rows exist for every period even with no activity
- Example: `fct_account_balance_daily` — one row per account per day

```sql
CREATE TABLE fct_account_balance_daily (
    date_key            INT NOT NULL,
    account_key         INT NOT NULL,
    opening_balance     DECIMAL(15,2),
    deposits            DECIMAL(15,2),
    withdrawals         DECIMAL(15,2),
    closing_balance     DECIMAL(15,2),        -- semi-additive (don't sum across time)
    transaction_count   INT,
    PRIMARY KEY (date_key, account_key)
);
```

#### 3. Accumulating Snapshot Fact Tables
- One row per entity lifetime — updated as milestones occur
- Multiple date keys tracking pipeline stages
- Example: `fct_order_fulfillment` — one row per order, updated through lifecycle

```sql
CREATE TABLE fct_order_fulfillment (
    order_key               BIGINT PRIMARY KEY,
    order_date_key          INT,
    payment_date_key        INT,      -- NULL until paid
    ship_date_key           INT,      -- NULL until shipped
    delivery_date_key       INT,      -- NULL until delivered
    customer_key            INT,
    order_to_payment_days   INT,      -- computed lag
    payment_to_ship_days    INT,
    ship_to_delivery_days   INT,
    order_amount            DECIMAL(12,2)
);
```

### Fact Table Measures

| Type | Description | Can SUM across all dimensions? | Example |
|---|---|---|---|
| **Additive** | Fully summable | Yes | Revenue, quantity, cost |
| **Semi-additive** | Summable across some dimensions, not time | No (average/latest across time) | Account balance, inventory level |
| **Non-additive** | Cannot be summed | No | Unit price, ratio, percentage |

---

## Dimension Table Patterns {#dimension-tables}

### Date Dimension (Required for Every Warehouse)

```sql
CREATE TABLE dim_date (
    date_key            INT PRIMARY KEY,       -- YYYYMMDD format
    full_date           DATE NOT NULL,
    day_of_week         SMALLINT,              -- 1=Monday, 7=Sunday
    day_name            VARCHAR(10),
    day_of_month        SMALLINT,
    day_of_year         SMALLINT,
    week_of_year        SMALLINT,
    iso_week            SMALLINT,
    month_number        SMALLINT,
    month_name          VARCHAR(10),
    month_short         VARCHAR(3),
    quarter_number      SMALLINT,
    quarter_name        VARCHAR(2),            -- Q1, Q2, Q3, Q4
    year_number         INT,
    year_month           VARCHAR(7),           -- 2025-01
    fiscal_year         INT,                   -- Adjust to org fiscal calendar
    fiscal_quarter      SMALLINT,
    fiscal_month        SMALLINT,
    is_weekend          BOOLEAN,
    is_public_holiday   BOOLEAN,
    holiday_name        VARCHAR(100),
    -- SA-specific
    is_sa_public_holiday BOOLEAN,
    sa_holiday_name     VARCHAR(100)
);
```

**Pre-populate** 10 years forward and 10 years back. Generate with a script, not manual entry.

### Junk Dimensions

Combine low-cardinality flags and indicators into a single dimension rather than polluting the fact table:

```sql
-- Instead of 5 flag columns on the fact table:
CREATE TABLE dim_order_flags (
    order_flag_key      INT PRIMARY KEY,
    is_online           BOOLEAN,
    is_gift             BOOLEAN,
    is_rush             BOOLEAN,
    payment_method      VARCHAR(20),   -- card, eft, cash, mobile
    fulfilment_type     VARCHAR(20)    -- delivery, collect, in-store
);
```

### Role-Playing Dimensions

Same dimension used multiple times in one fact table with different meanings:

```sql
-- fct_shipments references dim_date three times
SELECT
    od.full_date AS order_date,
    sd.full_date AS ship_date,
    dd.full_date AS delivery_date
FROM fct_shipments f
JOIN dim_date od ON f.order_date_key = od.date_key
JOIN dim_date sd ON f.ship_date_key = sd.date_key
JOIN dim_date dd ON f.delivery_date_key = dd.date_key;
```

Create views for role-playing dimensions: `dim_order_date`, `dim_ship_date`, `dim_delivery_date`.

---

## Slowly Changing Dimensions {#scds}

| SCD Type | Strategy | Use When |
|---|---|---|
| **Type 0** | Never change | Fixed attributes (date of birth, original registration) |
| **Type 1** | Overwrite | History not needed (fixing typos, non-critical attributes) |
| **Type 2** | Add new row with version tracking | Full history required (customer address, employee department) |
| **Type 3** | Add previous-value column | Only need current + one prior value |
| **Type 6** | Hybrid (1+2+3) | Need both current and historical in same row |

### Type 2 Implementation Pattern

```sql
CREATE TABLE dim_customer (
    customer_key        INT PRIMARY KEY,          -- surrogate key
    customer_id         VARCHAR(50) NOT NULL,      -- natural key
    customer_name       VARCHAR(200),
    email               VARCHAR(200),
    city                VARCHAR(100),
    province            VARCHAR(100),
    country             VARCHAR(100),
    customer_segment    VARCHAR(50),
    -- SCD Type 2 tracking columns
    effective_from      DATE NOT NULL,
    effective_to        DATE,                      -- NULL = current
    is_current          BOOLEAN DEFAULT TRUE,
    row_hash            VARCHAR(64)                -- SHA-256 of tracked columns
);

-- Finding current record
SELECT * FROM dim_customer WHERE customer_id = 'CUST-001' AND is_current = TRUE;

-- Point-in-time lookup
SELECT * FROM dim_customer 
WHERE customer_id = 'CUST-001' 
  AND '2025-03-15' BETWEEN effective_from AND COALESCE(effective_to, '9999-12-31');
```

### dbt Snapshots for SCD Type 2

```yaml
# models/snapshots/snap_customer.sql
{% snapshot snap_customer %}
{{
    config(
      target_schema='snapshots',
      unique_key='customer_id',
      strategy='check',
      check_cols=['customer_name', 'city', 'province', 'customer_segment'],
    )
}}
SELECT * FROM {{ source('crm', 'customers') }}
{% endsnapshot %}
```

---

## Advanced Patterns {#advanced}

### Bridge Tables (Many-to-Many)

When a fact has a many-to-many relationship with a dimension (e.g., a patient has multiple diagnoses):

```sql
CREATE TABLE bridge_patient_diagnosis (
    patient_key         INT,
    diagnosis_key       INT,
    diagnosis_rank      SMALLINT,     -- primary=1, secondary=2, etc.
    weighting_factor    DECIMAL(5,4), -- for proportional allocation
    PRIMARY KEY (patient_key, diagnosis_key)
);
```

### Aggregate/Summary Tables

Pre-aggregate for dashboards that query frequently at coarse grain:

```sql
-- Materialized view or dbt model
CREATE TABLE agg_sales_monthly AS
SELECT
    d.year_month,
    p.product_category,
    s.store_region,
    SUM(f.gross_amount) AS total_revenue,
    COUNT(*) AS transaction_count,
    COUNT(DISTINCT f.customer_key) AS unique_customers
FROM fct_orders f
JOIN dim_date d ON f.date_key = d.date_key
JOIN dim_product p ON f.product_key = p.product_key
JOIN dim_store s ON f.store_key = s.store_key
GROUP BY d.year_month, p.product_category, s.store_region;
```

---

## Naming Conventions {#naming}

| Object | Convention | Example |
|---|---|---|
| Fact table | `fct_<business_process>` | `fct_orders`, `fct_web_sessions` |
| Dimension table | `dim_<entity>` | `dim_customer`, `dim_product` |
| Staging model (dbt) | `stg_<source>__<table>` | `stg_erp__sales_orders` |
| Intermediate model | `int_<description>` | `int_orders_joined` |
| Mart model | `fct_` or `dim_` prefix | `fct_daily_revenue` |
| Surrogate key | `<table>_key` | `customer_key`, `product_key` |
| Natural key | `<table>_id` | `customer_id`, `product_id` |
| Date foreign key | `<role>_date_key` | `order_date_key`, `ship_date_key` |
| Boolean | `is_<state>` or `has_<feature>` | `is_active`, `has_subscription` |
| Amount/money | `<noun>_amount` | `discount_amount`, `tax_amount` |
| Count measure | `<noun>_count` | `line_item_count` |
| Snapshot table | `snap_<entity>` | `snap_customer` |
| Aggregate table | `agg_<grain>_<entity>` | `agg_monthly_sales` |
