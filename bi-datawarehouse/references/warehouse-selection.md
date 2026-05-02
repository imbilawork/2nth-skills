# Data Warehouse Selection Guide

## Table of Contents
1. [Decision Matrix](#decision-matrix)
2. [Open Source Options (Detailed)](#open-source)
3. [Cloud Managed Options](#cloud)
4. [Sizing & Cost Estimation](#sizing)
5. [Migration Paths](#migration)

---

## Decision Matrix {#decision-matrix}

### Start Here: What's Your Profile?

| If you are... | Recommended Warehouse | Why |
|---|---|---|
| Startup, <50GB, small team, budget-constrained | **PostgreSQL** | Free, familiar, good enough for most SMB analytics |
| Growing company, 50–500GB, need speed | **ClickHouse** | Column-store performance, free, handles billions of rows |
| Data team prototyping / CI testing | **DuckDB** | In-process, zero setup, reads Parquet/CSV directly |
| Enterprise, multi-team, data sharing needed | **Snowflake** | Governance, scaling, ecosystem |
| Google ecosystem, serverless preferred | **BigQuery** | Zero ops, pay-per-query |
| ML + Analytics unified platform | **Databricks** | Lakehouse, Spark, MLflow integration |
| Real-time analytics, high concurrency | **Apache Doris / StarRocks** | Sub-second OLAP queries, MySQL protocol |

---

## Open Source Options (Detailed) {#open-source}

### PostgreSQL (+ Extensions)

**Best for**: SMB warehouses under 500GB, teams already on Postgres.

Strengths:
- Universal SQL compatibility
- Rich extension ecosystem: `pg_partman` (partitioning), `TimescaleDB` (time-series), `Citus` (distributed), `pg_analytics` / `DuckDB fdw` (columnar queries)
- Mature tooling, massive community
- ACID compliant

Limitations:
- Row-store by default — analytical queries on large tables are slower than columnar
- Scaling beyond single node requires Citus or careful partitioning
- Vacuum management at scale

**Production config tips:**
```
shared_buffers = 25% of RAM
effective_cache_size = 75% of RAM
work_mem = 256MB  # for analytical queries
max_parallel_workers_per_gather = 4
```

### ClickHouse

**Best for**: High-volume analytics, event data, time-series, log analytics.

Strengths:
- Columnar storage with extreme compression (often 10:1)
- Handles billions of rows on modest hardware
- Sub-second query response on aggregations
- Built-in materialized views for real-time aggregation
- S3/GCS integration for data lake queries

Limitations:
- Not designed for frequent updates/deletes (mutations are async)
- No traditional transactions
- JOINs less efficient than single-table scans (design around this)
- Smaller BI tool ecosystem than Postgres (but Superset supports it well)

**When to choose ClickHouse over Postgres:**
- Event/log data >100M rows
- Need sub-second dashboard response at scale
- Write-heavy, read-heavy analytical workload
- Time-series or IoT data

### DuckDB

**Best for**: Local analytics, CI/CD testing, prototyping, embedded analytics.

Strengths:
- In-process (no server needed)
- Reads Parquet, CSV, JSON directly from S3/local filesystem
- Full SQL support including window functions, CTEs
- Incredible single-machine performance for analytics
- Python, R, Node.js, WASM bindings

Limitations:
- Single machine only — no distributed queries
- Not designed for concurrent multi-user access
- No built-in access control

**Use cases in the BI stack:**
- dbt development: `dbt-duckdb` adapter for fast local iteration
- Data quality checks in CI pipelines
- Analyst sandbox for ad-hoc exploration
- Embedded analytics in applications

### Apache Doris / StarRocks

**Best for**: Real-time analytics with high query concurrency.

Strengths:
- MySQL protocol compatible (works with any MySQL client/BI tool)
- Sub-second queries on large datasets
- Real-time data ingestion
- Materialized views, rollup tables
- Good for customer-facing embedded analytics

Limitations:
- Smaller community than ClickHouse
- More operational complexity (FE + BE nodes)
- Less mature ecosystem

---

## Cloud Managed Options {#cloud}

### Comparison Table

| Feature | Snowflake | BigQuery | Databricks | Redshift |
|---|---|---|---|---|
| **Pricing model** | Per-second compute | Per-byte scanned | Per-DBU | Per-node-hour |
| **Scaling** | Auto (virtual warehouses) | Serverless | Auto-scaling clusters | Manual resize |
| **Storage format** | Proprietary | Proprietary | Delta Lake (open) | Proprietary |
| **Data sharing** | Native | Analytics Hub | Delta Sharing | Limited |
| **ML integration** | Snowpark | Vertex AI | MLflow native | SageMaker |
| **Semi-structured** | VARIANT type | STRUCT/ARRAY | JSON native | SUPER type |
| **Time travel** | Up to 90 days | 7 days | Unlimited (Delta) | N/A |
| **Typical monthly cost (1TB)** | R15k–R50k | R8k–R30k | R20k–R60k | R15k–R40k |

*ZAR estimates assume moderate query workload. Actual costs vary significantly with usage patterns.*

### Cost Control Tips

1. **Snowflake**: Auto-suspend warehouses after 1–5 minutes. Use `XSMALL` for dbt, `MEDIUM` for dashboards.
2. **BigQuery**: Use partitioned + clustered tables. Set per-user query byte limits.
3. **Databricks**: Use spot instances for batch jobs. Photon engine for SQL workloads.

---

## Sizing & Cost Estimation {#sizing}

### Data Volume Estimation

```
Annual data growth = Daily new rows × Average row size × 365
Compressed storage  = Raw size × Compression ratio

Typical compression ratios:
  PostgreSQL:      1:1 to 1:3
  ClickHouse:      1:5 to 1:15
  Parquet on S3:   1:5 to 1:10
  Snowflake:       1:3 to 1:8
```

### Hardware Sizing (Self-Hosted)

| Data Volume | PostgreSQL | ClickHouse |
|---|---|---|
| <10 GB | 4 CPU, 16GB RAM, SSD | Overkill — use Postgres |
| 10–100 GB | 8 CPU, 32GB RAM, SSD | 4 CPU, 16GB RAM, SSD |
| 100GB–1TB | 16 CPU, 64GB RAM, NVMe | 8 CPU, 32GB RAM, NVMe |
| 1–10 TB | Citus cluster or migrate | 3-node cluster, 16 CPU/64GB each |
| >10 TB | Not recommended | Large cluster or cloud managed |

### SA-Specific Infrastructure Considerations

- **Load shedding**: Self-hosted warehouses need UPS + auto-recovery scripts. Cloud managed (AWS Cape Town `af-south-1` or Azure South Africa North) avoids this.
- **Network latency**: SA → EU/US data centers add 150–300ms. For interactive dashboards, keep warehouse in-region.
- **Data sovereignty**: POPIA may require data to remain in SA. Verify cloud region support.
- **Cost in ZAR**: Weak rand makes cloud spend significant. Self-hosted ClickHouse on Hetzner SA or local hosting can be 3–5x cheaper for stable workloads.

---

## Migration Paths {#migration}

### From Excel/Spreadsheets to Warehouse

1. Export CSV/XLSX files
2. Load into staging schema via `COPY` or Airbyte file source
3. Build dbt staging models to clean and type the data
4. Model into star schema
5. Connect BI tool to marts layer
6. Gradually replace spreadsheet workflows with dashboards

### From Legacy BI (SSRS, Crystal Reports, Access)

1. Inventory all existing reports — document data sources, business rules, consumers
2. Identify the 20% of reports that serve 80% of users — migrate these first
3. Replicate source data into modern warehouse
4. Rebuild business logic as dbt models (this documents what was previously tribal knowledge)
5. Recreate dashboards in Superset/Metabase
6. Run parallel for 1–2 months before decommissioning legacy

### From Power BI to Open Source

1. Export DAX measures and document semantic model
2. Translate DAX to SQL (most measures map directly)
3. Build equivalent dbt metrics or Cube.dev semantic layer
4. Recreate visuals in Superset (most Power BI chart types have equivalents)
5. Map Power BI Row-Level Security to Superset RBAC + row-level filters
