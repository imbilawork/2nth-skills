# ETL/ELT Patterns Reference

## Table of Contents
1. [ELT Architecture (Recommended Default)](#elt)
2. [Pipeline Design Principles](#principles)
3. [Change Data Capture (CDC)](#cdc)
4. [dbt Project Structure](#dbt)
5. [Orchestration Patterns](#orchestration)
6. [Error Handling & Recovery](#errors)

---

## ELT Architecture (Recommended Default) {#elt}

### Why ELT over ETL for Modern Stacks

Modern columnar warehouses (ClickHouse, Snowflake, BigQuery, Postgres with columnar extensions) have cheap, scalable compute. This makes it more efficient to:

1. **Extract** data from sources as-is
2. **Load** raw data into the warehouse (bronze layer)
3. **Transform** inside the warehouse using SQL (silver → gold)

This eliminates the need for a separate ETL server and keeps all transformation logic in version-controlled SQL.

### The Medallion Architecture

```
Bronze (Raw)           Silver (Cleaned)        Gold (Business-Ready)
─────────────          ─────────────────       ─────────────────────
Source replica         Typed, deduplicated      Star schema facts/dims
Append-only            Conformed naming         Business metrics
Full fidelity          Null handling            Aggregates
Audit trail            Joins resolved           Dashboard-ready
                       Tests passing
```

**dbt layer mapping:**
- Bronze → `staging/` models (1:1 with source tables, light cleaning)
- Silver → `intermediate/` models (joins, business logic, dedup)
- Gold → `marts/` models (fact and dimension tables)

---

## Pipeline Design Principles {#principles}

### 1. Idempotency

Every pipeline run must produce the same result regardless of how many times it executes:

```sql
-- BAD: Appends duplicates on re-run
INSERT INTO fct_orders SELECT * FROM stg_orders;

-- GOOD: Merge/upsert pattern
MERGE INTO fct_orders AS target
USING stg_orders AS source
ON target.order_id = source.order_id
WHEN MATCHED THEN UPDATE SET ...
WHEN NOT MATCHED THEN INSERT ...;

-- GOOD: Delete-insert pattern (simpler)
DELETE FROM fct_orders WHERE order_date = '{{ ds }}';
INSERT INTO fct_orders SELECT * FROM stg_orders WHERE order_date = '{{ ds }}';
```

### 2. Incremental Processing

Don't reload everything every time:

```sql
-- dbt incremental model
{{ config(materialized='incremental', unique_key='order_id') }}

SELECT * FROM {{ ref('stg_orders') }}
{% if is_incremental() %}
WHERE updated_at > (SELECT MAX(updated_at) FROM {{ this }})
{% endif %}
```

### 3. Schema Evolution

Plan for source schema changes:

- Use `SELECT *` sparingly — explicit column lists catch breaking changes
- Add `_loaded_at` timestamp to every raw table
- Use `dbt source freshness` to detect stale sources
- Contract testing: define expected schema in YAML, fail on drift

### 4. Data Contracts

```yaml
# dbt source definition with contract
sources:
  - name: erp
    database: raw
    freshness:
      warn_after: {count: 12, period: hour}
      error_after: {count: 24, period: hour}
    tables:
      - name: sales_orders
        columns:
          - name: order_id
            tests: [not_null, unique]
          - name: order_date
            tests: [not_null]
          - name: total_amount
            tests:
              - not_null
              - dbt_expectations.expect_column_values_to_be_between:
                  min_value: 0
                  max_value: 10000000
```

---

## Change Data Capture (CDC) {#cdc}

### When to Use CDC

- Source tables >1M rows where full reload is too slow
- Need near-real-time data (< 1 hour latency)
- Must track deletes (full loads miss deleted source rows)

### CDC Methods

| Method | Mechanism | Latency | Complexity |
|---|---|---|---|
| **Timestamp-based** | Filter on `updated_at` column | Minutes–hours | Low |
| **Log-based (Debezium)** | Read database transaction log | Seconds | Medium |
| **Trigger-based** | DB triggers write to change table | Seconds | High (fragile) |
| **Diff-based** | Compare full snapshots | Hours | Low but expensive |

### Recommended: Debezium for Log-Based CDC

```yaml
# Debezium connector config (PostgreSQL)
{
  "connector.class": "io.debezium.connector.postgresql.PostgresConnector",
  "database.hostname": "erp-db.internal",
  "database.port": "5432",
  "database.user": "cdc_reader",
  "database.dbname": "erp",
  "table.include.list": "public.sales_orders,public.customers",
  "topic.prefix": "erp",
  "plugin.name": "pgoutput",
  "slot.name": "debezium_slot",
  "publication.name": "cdc_publication"
}
```

### Handling CDC Events in the Warehouse

```sql
-- CDC events have an operation type: c=create, u=update, d=delete
-- Apply to target using merge
MERGE INTO dim_customer AS target
USING (
    SELECT *, ROW_NUMBER() OVER (
        PARTITION BY customer_id ORDER BY _cdc_timestamp DESC
    ) AS rn
    FROM raw.cdc_customers
    WHERE _cdc_timestamp > '{{ last_run }}'
) AS source
ON target.customer_id = source.customer_id AND source.rn = 1
WHEN MATCHED AND source._cdc_operation = 'd' THEN DELETE
WHEN MATCHED THEN UPDATE SET ...
WHEN NOT MATCHED AND source._cdc_operation != 'd' THEN INSERT ...;
```

---

## dbt Project Structure {#dbt}

### Recommended Directory Layout

```
dbt_project/
├── dbt_project.yml
├── packages.yml                # dbt-utils, dbt-expectations, elementary
├── profiles.yml                # connection config (not committed)
├── models/
│   ├── staging/                # Bronze → Silver (1:1 with sources)
│   │   ├── erp/
│   │   │   ├── _erp__sources.yml
│   │   │   ├── _erp__models.yml
│   │   │   ├── stg_erp__sales_orders.sql
│   │   │   └── stg_erp__customers.sql
│   │   └── crm/
│   │       ├── _crm__sources.yml
│   │       └── stg_crm__contacts.sql
│   ├── intermediate/           # Silver (joins, business logic)
│   │   ├── int_orders_enriched.sql
│   │   └── int_customer_360.sql
│   └── marts/                  # Gold (facts + dimensions)
│       ├── core/
│       │   ├── dim_customer.sql
│       │   ├── dim_product.sql
│       │   ├── dim_date.sql
│       │   └── fct_orders.sql
│       └── finance/
│           ├── fct_revenue_daily.sql
│           └── fct_accounts_receivable.sql
├── snapshots/                  # SCD Type 2
│   └── snap_customer.sql
├── tests/                      # Custom singular tests
│   └── assert_revenue_not_negative.sql
├── macros/                     # Reusable SQL macros
│   ├── generate_surrogate_key.sql
│   └── cents_to_rands.sql
└── seeds/                      # Static reference data (CSV)
    ├── country_codes.csv
    └── sa_public_holidays.csv
```

### Key dbt_project.yml Settings

```yaml
name: 'company_warehouse'
version: '1.0.0'

models:
  company_warehouse:
    staging:
      +materialized: view
      +schema: staging
    intermediate:
      +materialized: ephemeral   # or view
    marts:
      +materialized: table       # or incremental for large tables
      +schema: marts

vars:
  currency: 'ZAR'
  fiscal_year_start_month: 3    # March for SA fiscal year
```

---

## Orchestration Patterns {#orchestration}

### Tool Comparison

| Tool | Best For | Complexity | Open Source |
|---|---|---|---|
| **Dagster** | Modern data teams, asset-centric | Medium | Yes |
| **Airflow** | Established teams, complex DAGs | High | Yes |
| **Prefect** | Python-heavy teams, simple workflows | Low-Medium | Yes |
| **cron + dbt** | Simple daily batch | Very low | Yes |

### Dagster Example (Recommended for New Projects)

```python
from dagster import asset, Definitions
from dagster_dbt import DbtCliResource, dbt_assets

@asset
def raw_sales_orders():
    """Extract from ERP and load to raw schema."""
    # Airbyte sync or custom extraction
    pass

@dbt_assets(manifest=dbt_manifest_path)
def dbt_models(context, dbt: DbtCliResource):
    yield from dbt.cli(["build"], context=context).stream()

defs = Definitions(
    assets=[raw_sales_orders, dbt_models],
    resources={"dbt": DbtCliResource(project_dir="path/to/dbt")}
)
```

---

## Error Handling & Recovery {#errors}

### Pipeline Failure Response Matrix

| Failure Type | Detection | Response | Recovery |
|---|---|---|---|
| Source unavailable | Connection timeout | Retry 3x with backoff, then alert | Re-run after source recovers |
| Schema change | dbt test failure | Halt pipeline, alert data engineer | Update staging model, backfill |
| Data quality issue | dbt test / GE check | Quarantine bad rows, continue | Fix source or add cleaning logic |
| Duplicate data | Unique key violation | Dedup in staging layer | Ensure idempotent loads |
| Late-arriving data | Freshness check | Process in next run | Incremental models handle this |

### Alerting Channels

Configure alerts to fire on:
- Pipeline failure (orchestrator-level)
- Source freshness violation (dbt source freshness)
- Test failure (dbt test)
- Row count anomaly (>30% deviation from trailing average)
- Schema drift detected

Route to: Slack channel, email, PagerDuty — based on severity.
