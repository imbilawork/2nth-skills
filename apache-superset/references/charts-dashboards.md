# Charts & Dashboards Reference

## Table of Contents
1. [Dataset Configuration](#datasets)
2. [Chart Type Selection Guide](#chart-types)
3. [Dashboard Layout Patterns](#layouts)
4. [Native Filters](#filters)
5. [Jinja Templating](#jinja)
6. [Calculated Columns & Metrics](#calculations)

---

## Dataset Configuration {#datasets}

### Physical vs Virtual Datasets

| Type | Definition | Use When |
|---|---|---|
| **Physical** | Points directly to a table/view | Simple, direct table access |
| **Virtual** | Based on a SQL query | Need joins, CTEs, or pre-aggregation |

**Best practice**: Point physical datasets at your dbt mart layer (`fct_*` and `dim_*` tables). Use virtual datasets when you need to join fact + dimension for a specific chart.

### Dataset Settings to Configure

- **Temporal column**: Set the default time column for time-series charts
- **Main datetime column**: Required for time-range filtering
- **Cache timeout**: Override per-dataset (use 0 for real-time tables)
- **Schema**: Restrict to `marts` schema
- **Columns**: Add verbose names, descriptions, and mark as temporal/filterable/groupable

---

## Chart Type Selection Guide {#chart-types}

### KPI & Summary

| Need | Chart Type | Notes |
|---|---|---|
| Single hero metric | **Big Number** | Current value + optional subtitle |
| Metric + trend | **Big Number with Trendline** | Shows direction over selected period |
| Multiple KPIs in a row | Multiple Big Numbers in a dashboard row | 3–5 per row maximum |

### Trends & Time-Series

| Need | Chart Type | Notes |
|---|---|---|
| Single metric over time | **Time-series Line** | Smooth or stepped |
| Compare periods | **Time-series Bar** | Stack or group for breakdown |
| Dual-axis comparison | **Mixed Chart** | Bar + line on same chart |
| Cumulative trend | **Time-series Line** with `cumsum` post-processing | Running totals |
| Forecasting | **Prophet** (if enabled) | Basic time-series forecasting |

### Distribution & Composition

| Need | Chart Type | Notes |
|---|---|---|
| Part of whole (few categories) | **Pie / Donut** | Max 6 slices; use bar chart for more |
| Part of whole over time | **Area Chart (stacked)** | Shows composition shift |
| Category comparison | **Bar Chart (horizontal)** | Better than vertical for long labels |
| Treemap breakdown | **Treemap** | Hierarchical part-of-whole |

### Comparison & Ranking

| Need | Chart Type | Notes |
|---|---|---|
| Ranked comparison | **Bar Chart (sorted)** | Horizontal, sorted by value |
| Before/after or budget vs actual | **Waterfall** | Variance analysis |
| Correlation | **Scatter Plot** | Two numeric dimensions |
| Heatmap/matrix | **Heatmap** | Two categories + 1 metric |

### Data Exploration

| Need | Chart Type | Notes |
|---|---|---|
| Detailed records | **Table** | Pagination, search, conditional formatting |
| Cross-tabulation | **Pivot Table** | Rows × columns × values |
| SQL exploration | **SQL Lab** | Direct query interface |

### Geographic

| Need | Chart Type | Notes |
|---|---|---|
| Country/region level | **World Map** or **Country Map** | ISO codes required |
| Point locations | **deck.gl Scatter** | Lat/lng columns |
| Cluster density | **deck.gl Heatmap** | High-volume point data |

---

## Dashboard Layout Patterns {#layouts}

### Executive Summary Dashboard

```
┌──────────────────────────────────────────────────────────┐
│  FILTERS (native filter bar — left sidebar)              │
├──────────────────────────────────────────────────────────┤
│                                                          │
│  ┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐           │
│  │Revenue │ │Orders  │ │Avg     │ │Margin  │           │
│  │R4.2M   │ │12,450  │ │Order   │ │32.4%   │           │
│  │▲ 12%   │ │▲ 8%    │ │R337    │ │▲ 1.2pp │           │
│  └────────┘ └────────┘ └────────┘ └────────┘           │
│                                                          │
│  ┌─────────────────────────────────────────────┐        │
│  │  Revenue Trend (Time-series Line)           │        │
│  │  ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~   │        │
│  └─────────────────────────────────────────────┘        │
│                                                          │
│  ┌────────────────────┐  ┌──────────────────────┐       │
│  │ Revenue by Region  │  │ Top Products         │       │
│  │ (Horizontal Bar)   │  │ (Table, sorted)      │       │
│  └────────────────────┘  └──────────────────────┘       │
└──────────────────────────────────────────────────────────┘
```

### Operational Dashboard

```
Tab: Overview │ Tab: Detail │ Tab: Alerts

[Overview Tab]
┌──────────────────────────────────────────────────────────┐
│  Status indicators (Big Numbers — green/amber/red)       │
├──────────────────────────────────────────────────────────┤
│  ┌─────────────────────────────────────────────┐        │
│  │  Pipeline Status (Mixed Chart — bar + line) │        │
│  └─────────────────────────────────────────────┘        │
│  ┌─────────────────────────────────────────────┐        │
│  │  Recent Activity (Table — last 50 events)   │        │
│  └─────────────────────────────────────────────┘        │
└──────────────────────────────────────────────────────────┘
```

### Design Rules

1. **Maximum 12–15 charts per dashboard** — more causes slow loading
2. **Use tabs** to organize by audience or topic
3. **Consistent time range** — use dashboard-level time filter, not per-chart
4. **Left-to-right, top-to-bottom** information hierarchy (summary → detail)
5. **Markdown cards** for section headers and context notes
6. **Colour consistency** — same entity = same colour across all charts

---

## Native Filters {#filters}

### Filter Types

| Filter | Widget | Use Case |
|---|---|---|
| **Value** | Dropdown/multi-select | Filter by category (region, product, status) |
| **Range** | Slider | Numeric range filtering |
| **Time Range** | Date picker | Dashboard-wide date filtering |
| **Time Column** | Dropdown | Switch between date columns |
| **Time Grain** | Dropdown | Day/week/month granularity |

### Cross-Filtering

Enable in Feature Flags: `DASHBOARD_CROSS_FILTERS: True`

Clicking a bar/slice in one chart filters all other charts on the dashboard. Configure per-chart which dimensions participate in cross-filtering.

### Filter Configuration Best Practices

- Set **default values** for all filters (don't show empty dashboards)
- Use **filter dependencies** (selecting a country filters the city dropdown)
- **Pre-filter** large dropdowns by adding a WHERE clause to the filter dataset
- Mark filters as **required** to prevent accidental full-table scans

---

## Jinja Templating {#jinja}

Enable: `ENABLE_TEMPLATE_PROCESSING: True` in Feature Flags.

### Available Variables in SQL

```sql
-- Current user
SELECT * FROM fct_orders WHERE owner = '{{ current_username() }}'

-- User ID
SELECT * FROM fct_orders WHERE user_id = {{ current_user_id() }}

-- Time range from dashboard filter
SELECT * FROM fct_orders
WHERE order_date >= '{{ from_dttm }}'
  AND order_date < '{{ to_dttm }}'

-- URL parameters (for embedding with context)
SELECT * FROM fct_orders
WHERE customer_id = '{{ url_param("customer_id") }}'

-- Custom filter values
SELECT * FROM fct_orders
WHERE region IN ({{ filter_values('region', 'default_value') | join(',') }})
```

### Jinja for Dynamic Datasets

```sql
-- Virtual dataset with dynamic grain
SELECT
    DATE_TRUNC('{{ url_param("grain", "month") }}', order_date) AS period,
    SUM(revenue) AS total_revenue
FROM fct_orders
WHERE order_date BETWEEN '{{ from_dttm }}' AND '{{ to_dttm }}'
GROUP BY 1
```

---

## Calculated Columns & Metrics {#calculations}

### Custom SQL Metrics (in Chart → Metrics)

```sql
-- Year-over-year growth
(SUM(revenue) - LAG(SUM(revenue)) OVER (ORDER BY date_trunc('month', order_date)))
/ NULLIF(LAG(SUM(revenue)) OVER (ORDER BY date_trunc('month', order_date)), 0)

-- Margin percentage
SUM(gross_profit) / NULLIF(SUM(revenue), 0) * 100

-- Moving average (7-day)
AVG(SUM(revenue)) OVER (ORDER BY order_date ROWS BETWEEN 6 PRECEDING AND CURRENT ROW)
```

### Calculated Columns (in Dataset → Columns)

```sql
-- Revenue tier
CASE
    WHEN revenue >= 10000 THEN 'Enterprise'
    WHEN revenue >= 1000 THEN 'Mid-Market'
    ELSE 'SMB'
END

-- ZAR formatting (SA context)
'R ' || TO_CHAR(amount, 'FM999,999,999.00')
```

### Best Practice: Define Metrics in dbt, Not Superset

Keep business logic in the transformation layer:

```sql
-- dbt model: fct_orders.sql
SELECT
    order_id,
    order_date,
    revenue,
    cost,
    revenue - cost AS gross_profit,
    (revenue - cost) / NULLIF(revenue, 0) AS gross_margin_pct,
    -- Pre-compute common aggregation-ready columns
    1 AS order_count  -- SUM(order_count) in Superset = COUNT(orders)
FROM {{ ref('int_orders_enriched') }}
```

Then in Superset, metrics are simple `SUM(revenue)`, `SUM(gross_profit)`, `AVG(gross_margin_pct)` — no business logic leaking into the BI layer.
