---
name: bi-datawarehouse
description: >
  Business Intelligence and Data Warehousing architecture skill covering modern data stack design,
  dimensional modeling, ETL/ELT patterns, semantic layers, and BI platform selection. Use this skill
  whenever building analytics infrastructure, designing data warehouses, implementing star/snowflake
  schemas, planning data pipelines, selecting BI tools, or architecting reporting solutions. Also
  triggers on: data warehouse, data lake, lakehouse, medallion architecture, dimensional model,
  fact table, dimension table, slowly changing dimensions, ETL, ELT, dbt, data pipeline, OLAP,
  semantic layer, data mart, data catalog, data governance, analytics engineering, reporting
  architecture, dashboard design, KPI framework, or any request involving structured analytics
  and business reporting infrastructure.
license: MIT
homepage: https://skills.2nth.ai/bi-datawarehouse
repository: https://github.com/imbilawork/2nth-skills
metadata:
  author: Craig Leppan
  version: 1.0.0
  categories:
    - bi
    - data-engineering
    - architecture
  requires: []
---

# BI & Data Warehousing Architecture Skill

This skill provides production-grade guidance for designing, building, and operating business intelligence and data warehousing infrastructure using modern open-source and commercial tooling.

## When to Use This Skill

- Designing a new data warehouse or analytics platform
- Choosing between data warehouse, data lake, or lakehouse architectures
- Implementing dimensional models (star schema, snowflake schema)
- Building ETL/ELT data pipelines
- Selecting and integrating BI/reporting tools
- Establishing data governance and quality frameworks
- Planning migration from legacy BI to modern data stack

## Architecture Decision Framework

Before implementation, answer these five questions:

1. **Data Volume & Velocity** — How much data, how fast does it arrive?
2. **Query Patterns** — Ad-hoc exploration vs. fixed dashboards vs. embedded analytics?
3. **Team Capability** — SQL-literate analysts? Dedicated data engineers? Self-service business users?
4. **Latency Requirements** — Real-time, near-real-time, or batch is fine?
5. **Budget Constraints** — Cloud-managed vs. self-hosted? Per-seat licensing tolerance?

## Modern Data Stack Reference Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        DATA SOURCES                             │
│  ERP │ CRM │ APIs │ Files │ IoT │ Events │ SaaS Apps           │
└──────┬──────────────────────────────────────────────────────────┘
       │
       ▼
┌─────────────────────────────────────────────────────────────────┐
│                    INGESTION LAYER                               │
│  Airbyte │ Fivetran │ Singer │ Debezium (CDC) │ Custom ETL     │
└──────┬──────────────────────────────────────────────────────────┘
       │
       ▼
┌─────────────────────────────────────────────────────────────────┐
│                    STORAGE LAYER                                 │
│                                                                  │
│  ┌─────────────┐  ┌──────────────┐  ┌────────────────────┐     │
│  │  Data Lake   │  │  Data        │  │  Lakehouse         │     │
│  │  (S3/GCS/    │  │  Warehouse   │  │  (Delta/Iceberg/   │     │
│  │   MinIO)     │  │  (Postgres/  │  │   Hudi on object   │     │
│  │              │  │   ClickHouse/│  │   storage)         │     │
│  │  Raw files,  │  │   Snowflake/ │  │                    │     │
│  │  unstructured│  │   BigQuery)  │  │  Best of both      │     │
│  └─────────────┘  └──────────────┘  └────────────────────┘     │
└──────┬──────────────────────────────────────────────────────────┘
       │
       ▼
┌─────────────────────────────────────────────────────────────────┐
│                  TRANSFORMATION LAYER                            │
│  dbt │ SQLMesh │ Stored Procedures │ Spark │ Python scripts    │
│                                                                  │
│  Medallion Pattern:  Bronze → Silver → Gold                     │
│  (raw)         (cleaned/conformed)  (business-ready)            │
└──────┬──────────────────────────────────────────────────────────┘
       │
       ▼
┌─────────────────────────────────────────────────────────────────┐
│                   SEMANTIC / METRICS LAYER                       │
│  dbt Metrics │ Cube.dev │ MetricFlow │ LookML │ Power BI Model │
│                                                                  │
│  Single source of truth for business definitions                │
└──────┬──────────────────────────────────────────────────────────┘
       │
       ▼
┌─────────────────────────────────────────────────────────────────┐
│                  CONSUMPTION / BI LAYER                          │
│  Apache Superset │ Metabase │ Lightdash │ Grafana │ Power BI   │
│  Embedded analytics │ APIs │ Notebooks │ AI/LLM interfaces     │
└─────────────────────────────────────────────────────────────────┘
       │
       ▼
┌─────────────────────────────────────────────────────────────────┐
│                 ORCHESTRATION & OBSERVABILITY                    │
│  Airflow │ Dagster │ Prefect │ Great Expectations │ Monte Carlo │
│  dbt tests │ Data contracts │ Lineage │ Alerting               │
└─────────────────────────────────────────────────────────────────┘
```

## Dimensional Modeling

→ **Read `references/dimensional-modeling.md`** for complete star schema design patterns, slowly changing dimensions (SCD Types 1–6), fact table grain rules, conformed dimensions, and naming conventions.

### Quick Reference

| Concept | Rule |
|---|---|
| **Grain** | Define the grain FIRST — one row = one what? |
| **Fact tables** | Contain measures (numeric, additive). Prefix with `fct_` |
| **Dimension tables** | Contain descriptive attributes. Prefix with `dim_` |
| **Surrogate keys** | Always use integer surrogates, never natural keys as PKs |
| **Date dimension** | Always build a dedicated `dim_date` with fiscal calendar support |
| **Junk dimensions** | Combine low-cardinality flags into a single junk dimension |
| **Degenerate dimensions** | Order numbers, invoice numbers live in the fact table |

## ETL/ELT Pattern Selection

→ **Read `references/etl-elt-patterns.md`** for pipeline architecture patterns, CDC strategies, idempotency rules, and error handling.

### Decision Matrix

| Factor | ETL (Transform before load) | ELT (Load then transform) |
|---|---|---|
| **Best for** | Legacy warehouses, compliance | Cloud warehouses, modern stack |
| **Compute** | Separate ETL server | Warehouse compute |
| **Flexibility** | Lower — schema-on-write | Higher — schema-on-read |
| **Tool examples** | Informatica, Talend, SSIS | dbt, SQLMesh, Spark SQL |
| **Recommendation** | Use when data must be masked/filtered before landing | **Default choice for new builds** |

### dbt as Transformation Standard

For new projects, **dbt (data build tool)** is the recommended transformation layer:

- SQL-based transformations version-controlled in Git
- Built-in testing framework (`not_null`, `unique`, `accepted_values`, `relationships`)
- Documentation auto-generated from YAML
- Incremental models for large datasets
- Package ecosystem (dbt-utils, dbt-expectations, elementary)

## Data Warehouse Selection Guide

→ **Read `references/warehouse-selection.md`** for detailed comparison matrix and sizing guidance.

### Quick Comparison

| Warehouse | Type | Best For | Cost Model |
|---|---|---|---|
| **PostgreSQL + Citus** | Open source | SMB, <500GB, budget-conscious | Free / infra only |
| **ClickHouse** | Open source | High-volume analytics, time-series | Free / infra only |
| **DuckDB** | Embedded | Local analytics, CI/CD testing, prototyping | Free |
| **Apache Doris** | Open source | Real-time analytics, high concurrency | Free / infra only |
| **Snowflake** | Cloud SaaS | Enterprise, multi-cloud, data sharing | Per-compute-second |
| **BigQuery** | Cloud SaaS | Google ecosystem, serverless | Per-query (bytes scanned) |
| **Databricks** | Cloud SaaS | ML + analytics unified, lakehouse | Per-DBU |

### Open Source Recommendation Stack

For cost-effective, self-hosted deployments (especially relevant for SA/emerging market context):

```
Ingestion:    Airbyte (open source)
Storage:      PostgreSQL or ClickHouse
Transform:    dbt Core
Orchestrate:  Dagster or Airflow
BI:           Apache Superset or Metabase
Quality:      dbt tests + Great Expectations
```

## BI Tool Selection

| Tool | License | Strengths | Weaknesses |
|---|---|---|---|
| **Apache Superset** | Apache 2.0 | SQL-native, 40+ viz types, embedding, RBAC | Steeper setup, needs admin |
| **Metabase** | AGPL / Commercial | Dead-simple UX, question builder, self-service | Less powerful for complex analytics |
| **Lightdash** | MIT | dbt-native, metrics-first | Smaller ecosystem |
| **Grafana** | AGPL | Time-series king, alerting | Not designed for business BI |
| **Redash** | BSD | Lightweight, SQL-first | Less actively maintained |

**Recommendation**: Apache Superset for full-featured BI. Metabase if self-service for non-technical users is priority. See the companion `apache-superset` skill for implementation details.

## Data Governance Essentials

### Minimum Viable Governance

Every data warehouse should implement at minimum:

1. **Data Catalog** — Document every table, column, and metric definition
2. **Ownership** — Every dataset has a named owner
3. **Quality Tests** — Automated checks on freshness, completeness, schema
4. **Access Control** — Role-based access, principle of least privilege
5. **Lineage** — Track data flow from source to dashboard
6. **Retention Policy** — Define how long raw/processed data is kept

### Compliance Considerations (SA Context)

- **POPIA** — Personal data must be processed lawfully; data minimisation applies
- **Consent tracking** — Store consent records alongside PII
- **Right to deletion** — Design soft-delete patterns that support POPIA deletion requests
- **Cross-border transfers** — Document any data leaving SA borders

## Anti-Patterns to Avoid

1. **One Big Table (OBT) as warehouse** — Denormalize for BI layer, not storage layer
2. **No testing** — Every model needs at least `not_null` and `unique` tests on keys
3. **Direct source queries from BI** — Always go through transformation layer
4. **Dashboard sprawl** — Establish a dashboard registry; retire unused dashboards quarterly
5. **No semantic layer** — Business users will create conflicting metric definitions
6. **Premature optimization** — Get the model right first, then optimize query performance
7. **Ignoring CDC** — Full table reloads don't scale; implement change data capture early

## Implementation Checklist

- [ ] Architecture decision documented (warehouse, lakehouse, or hybrid)
- [ ] Storage engine selected and provisioned
- [ ] Ingestion tool configured for all sources
- [ ] dbt project initialized with staging/intermediate/mart layer structure
- [ ] Dimensional model designed (ERD reviewed)
- [ ] `dim_date` dimension built with fiscal calendar
- [ ] dbt tests on all primary/foreign keys
- [ ] Orchestration pipeline scheduled
- [ ] BI tool connected to mart layer
- [ ] RBAC configured in warehouse and BI tool
- [ ] Data catalog populated (at minimum: mart-layer tables)
- [ ] Monitoring/alerting on pipeline failures
- [ ] Documentation published for analyst onboarding

## Reference Files

| File | When to Read |
|---|---|
| `references/dimensional-modeling.md` | Designing star schemas, SCDs, fact/dimension tables |
| `references/etl-elt-patterns.md` | Building data pipelines, CDC, idempotency, error handling |
| `references/warehouse-selection.md` | Comparing warehouse engines, sizing, cost modeling |
