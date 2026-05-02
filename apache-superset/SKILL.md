---
name: apache-superset
description: >
  Apache Superset implementation and operations skill. Covers deployment (Docker, Kubernetes, bare metal),
  database connections, chart and dashboard creation, semantic layer configuration, RBAC and row-level
  security, embedding, custom visualizations, performance tuning, and production operations. Use this
  skill whenever deploying Superset, configuring Superset data sources, building Superset dashboards,
  setting up Superset security/RBAC, embedding Superset charts, troubleshooting Superset performance,
  or migrating to Superset from Power BI or other BI tools. Also triggers on: superset, apache superset,
  superset docker, superset kubernetes, superset embed, superset chart, superset dashboard, superset
  RBAC, superset row level security, superset API, superset celery, superset redis, superset caching,
  open source BI deployment, or any request to build a self-hosted business intelligence platform.
license: MIT
homepage: https://skills.2nth.ai/apache-superset
repository: https://github.com/imbilawork/2nth-skills
metadata:
  author: Craig Leppan
  version: 1.0.0
  categories:
    - bi
    - data-engineering
    - devops
  requires:
    - bi-datawarehouse
---

# Apache Superset Implementation Skill

This skill provides production-grade guidance for deploying, configuring, and operating Apache Superset as your primary BI platform.

## When to Use This Skill

- Deploying Superset for the first time (Docker, K8s, or bare metal)
- Connecting Superset to data warehouses (Postgres, ClickHouse, Snowflake, BigQuery)
- Building charts and dashboards
- Configuring RBAC, row-level security, and multi-tenancy
- Embedding Superset dashboards in external applications
- Performance tuning and caching
- Migrating from Power BI, Metabase, or other BI tools

## Architecture Overview

```
┌──────────────────────────────────────────────────────────┐
│                    CLIENTS                                │
│  Browser │ Embedded iFrame │ API Consumers               │
└──────┬───────────────────────────────────────────────────┘
       │
       ▼
┌──────────────────────────────────────────────────────────┐
│              SUPERSET APPLICATION                         │
│                                                           │
│  ┌──────────┐  ┌──────────┐  ┌────────────────────┐     │
│  │ Web      │  │ Celery   │  │ Celery Beat        │     │
│  │ Server   │  │ Workers  │  │ (Scheduler)        │     │
│  │ (Gunicorn│  │ (Async   │  │                    │     │
│  │  /uWSGI) │  │  queries,│  │ Scheduled reports, │     │
│  │          │  │  alerts, │  │ cache warming,     │     │
│  │          │  │  reports)│  │ alert checks       │     │
│  └────┬─────┘  └────┬─────┘  └────────────────────┘     │
│       │              │                                    │
│  ┌────┴──────────────┴───────────────────────────┐       │
│  │              METADATA DB                       │       │
│  │  PostgreSQL (dashboards, charts, users, RBAC)  │       │
│  └────────────────────────────────────────────────┘       │
│       │                                                   │
│  ┌────┴───────────────────────────────────────────┐      │
│  │              CACHE LAYER                        │      │
│  │  Redis (query results, thumbnails, sessions)    │      │
│  └─────────────────────────────────────────────────┘     │
└──────────────────────────────────────────────────────────┘
       │
       ▼
┌──────────────────────────────────────────────────────────┐
│              DATA SOURCES                                 │
│  PostgreSQL │ ClickHouse │ Snowflake │ BigQuery │ etc.   │
│  (Your data warehouse — Superset reads only)             │
└──────────────────────────────────────────────────────────┘
```

### Key Components

| Component | Purpose | Required? |
|---|---|---|
| **Web Server** | Serves UI, handles API requests | Yes |
| **Metadata DB** | Stores Superset config, dashboards, users | Yes (PostgreSQL recommended) |
| **Redis** | Caching, Celery broker, session store | Yes for production |
| **Celery Workers** | Async queries, scheduled reports, alerts | Yes for production |
| **Celery Beat** | Scheduled task runner | Yes if using alerts/reports |

## Deployment

→ **Read `references/deployment.md`** for complete Docker Compose, Kubernetes Helm, and bare-metal deployment guides with production-hardened configurations.

### Quick Start (Docker Compose — Development)

```bash
git clone https://github.com/apache/superset.git
cd superset
docker compose -f docker-compose-non-dev.yml up -d
```

Access at `http://localhost:8088` — default login: `admin` / `admin`.

### Production Deployment Summary

**Docker Compose (small teams, <50 users):**
- Use the production compose file from `references/deployment.md`
- External PostgreSQL for metadata DB
- External Redis for caching
- Reverse proxy (Nginx/Caddy) with TLS
- Persistent volumes for config

**Kubernetes (scale, HA, >50 users):**
- Official Helm chart: `helm repo add superset https://apache.github.io/superset`
- Configure: metadata DB (external RDS/CloudSQL), Redis, Celery worker count
- HPA on web server pods
- Ingress with TLS termination

## Configuration

### Essential `superset_config.py`

```python
import os
from datetime import timedelta

# --- Core ---
SECRET_KEY = os.environ.get('SUPERSET_SECRET_KEY')  # MUST be set in production
SQLALCHEMY_DATABASE_URI = os.environ.get('SUPERSET_META_DB_URI',
    'postgresql://superset:superset@postgres:5432/superset')

# --- Feature Flags ---
FEATURE_FLAGS = {
    'DASHBOARD_NATIVE_FILTERS': True,
    'DASHBOARD_CROSS_FILTERS': True,
    'ENABLE_TEMPLATE_PROCESSING': True,
    'ALERT_REPORTS': True,
    'EMBEDDED_SUPERSET': True,
    'ESTIMATE_QUERY_COST': True,
    'GLOBAL_ASYNC_QUERIES': True,
}

# --- Caching ---
CACHE_CONFIG = {
    'CACHE_TYPE': 'redis',
    'CACHE_DEFAULT_TIMEOUT': 60 * 60 * 24,  # 24 hours
    'CACHE_KEY_PREFIX': 'superset_',
    'CACHE_REDIS_URL': os.environ.get('REDIS_URL', 'redis://redis:6379/0'),
}

DATA_CACHE_CONFIG = {
    'CACHE_TYPE': 'redis',
    'CACHE_DEFAULT_TIMEOUT': 60 * 60 * 24,
    'CACHE_KEY_PREFIX': 'superset_data_',
    'CACHE_REDIS_URL': os.environ.get('REDIS_URL', 'redis://redis:6379/1'),
}

FILTER_STATE_CACHE_CONFIG = {
    'CACHE_TYPE': 'redis',
    'CACHE_DEFAULT_TIMEOUT': 60 * 60 * 24,
    'CACHE_KEY_PREFIX': 'superset_filter_',
    'CACHE_REDIS_URL': os.environ.get('REDIS_URL', 'redis://redis:6379/2'),
}

# --- Celery ---
class CeleryConfig:
    broker_url = os.environ.get('REDIS_URL', 'redis://redis:6379/3')
    result_backend = os.environ.get('REDIS_URL', 'redis://redis:6379/4')
    task_annotations = {
        'sql_lab.get_sql_results': {'rate_limit': '100/s'},
    }

CELERY_CONFIG = CeleryConfig

# --- Query Limits ---
ROW_LIMIT = 50000
SQL_MAX_ROW = 100000
SQLLAB_TIMEOUT = 300
SUPERSET_WEBSERVER_TIMEOUT = 300

# --- Security ---
WTF_CSRF_ENABLED = True
SESSION_COOKIE_HTTPONLY = True
SESSION_COOKIE_SECURE = True  # Enable with HTTPS
TALISMAN_ENABLED = True

# --- Async Queries ---
GLOBAL_ASYNC_QUERIES_JWT_SECRET = os.environ.get('ASYNC_JWT_SECRET')
```

## Connecting Data Sources

### Database Connection Strings

| Database | SQLAlchemy URI Pattern |
|---|---|
| **PostgreSQL** | `postgresql://user:pass@host:5432/dbname` |
| **ClickHouse** | `clickhousedb://user:pass@host:8123/dbname` |
| **Snowflake** | `snowflake://user:pass@account/dbname/schema?warehouse=WH&role=ROLE` |
| **BigQuery** | `bigquery://project` (uses service account JSON) |
| **MySQL** | `mysql://user:pass@host:3306/dbname` |
| **DuckDB** | `duckdb:///path/to/file.duckdb` |
| **Trino/Presto** | `trino://user@host:8080/catalog/schema` |

### Required Python Packages by Database

```bash
# Install in your Superset environment / Docker image
pip install psycopg2-binary          # PostgreSQL
pip install clickhouse-connect       # ClickHouse
pip install snowflake-sqlalchemy     # Snowflake
pip install pybigquery               # BigQuery
pip install mysqlclient              # MySQL
pip install duckdb-engine            # DuckDB
pip install trino                    # Trino
```

### Connection Best Practices

1. **Read-only credentials** — Superset should never have write access to your warehouse
2. **Connection pooling** — Set `pool_size` and `max_overflow` in Advanced settings
3. **Schema allow-list** — Restrict visible schemas to `marts` layer only
4. **Cost estimation** — Enable `ESTIMATE_QUERY_COST` to warn users about expensive queries
5. **Async queries** — Enable for any database where queries may exceed 10 seconds

## Building Charts & Dashboards

→ **Read `references/charts-dashboards.md`** for detailed chart type selection guide, dashboard layout patterns, filter configuration, and cross-filtering setup.

### Chart Creation Workflow

1. **Dataset** → Create/select a dataset (points to a table or SQL query in your warehouse)
2. **Chart type** → Select visualization type
3. **Configure** → Set metrics, dimensions, filters, formatting
4. **Save** → Save to a dashboard

### Most-Used Chart Types

| Chart Type | Best For |
|---|---|
| **Table** | Detailed data exploration, drill-down |
| **Big Number** | KPI hero metrics |
| **Big Number with Trendline** | KPI + direction indicator |
| **Time-series Line** | Trends over time |
| **Time-series Bar** | Period comparisons |
| **Pie / Donut** | Part-of-whole (max 6 segments) |
| **Pivot Table** | Cross-tabulation analysis |
| **Mixed Chart** | Dual-axis (bar + line) |
| **World Map** | Geographic distribution |
| **Funnel** | Conversion pipelines |
| **Waterfall** | Variance analysis |
| **Heatmap** | Correlation / density |

### Dashboard Layout Best Practices

- **Top row**: KPI hero numbers (Big Number charts)
- **Second row**: Trend lines / time-series for key metrics
- **Lower rows**: Breakdowns, comparisons, detail tables
- **Filters**: Use native filter bar (left sidebar) not filter boxes
- **Max charts per dashboard**: 12–15 for performance
- **Tab sets**: Use tabs for different audiences viewing the same dashboard

## Security & RBAC

→ **Read `references/security-rbac.md`** for complete RBAC configuration, row-level security, OAuth/SAML setup, and multi-tenancy patterns.

### Role Hierarchy

```
Admin
  └── Alpha (full data access, can create charts/dashboards)
        └── Gamma (view-only access to granted dashboards)
              └── Public (no login required — use for embedding)
```

### Row-Level Security (RLS)

RLS filters data per-user without separate views:

```
Settings → Row Level Security → Add Rule

Rule:    region_filter
Tables:  fct_orders, fct_revenue
Clause:  region = '{{ current_user.region }}'  
Roles:   [Regional_Manager]
```

This appends `WHERE region = '<user's region>'` to every query on those tables.

### Recommended Role Setup

| Role | Access | Use Case |
|---|---|---|
| `Admin` | Everything | Platform admins only |
| `Data_Engineer` | SQL Lab + all databases | Data team |
| `Analyst` | SQL Lab (read-only) + create charts | Analytics team |
| `Dashboard_Viewer` | View specific dashboards only | Business users |
| `Embedded_User` | Specific embedded dashboards | External/app users |

## Embedding

### Guest Token Embedding (Recommended)

```python
# Backend: Generate guest token via Superset API
import requests

# 1. Login to get access token
auth = requests.post(f'{SUPERSET_URL}/api/v1/security/login', json={
    'username': 'embed_service_account',
    'password': EMBED_PASSWORD,
    'provider': 'db',
})
access_token = auth.json()['access_token']

# 2. Get CSRF token
csrf = requests.get(f'{SUPERSET_URL}/api/v1/security/csrf_token/',
    headers={'Authorization': f'Bearer {access_token}'})
csrf_token = csrf.json()['result']

# 3. Generate guest token with RLS
guest = requests.post(f'{SUPERSET_URL}/api/v1/security/guest_token/',
    headers={
        'Authorization': f'Bearer {access_token}',
        'X-CSRFToken': csrf_token,
    },
    json={
        'user': {'username': 'customer_123', 'first_name': 'Customer', 'last_name': '123'},
        'resources': [{'type': 'dashboard', 'id': 'dashboard-uuid-here'}],
        'rls': [{'clause': "customer_id = 'CUST-123'"}],
    })
guest_token = guest.json()['token']
```

```javascript
// Frontend: Embed using Superset Embedded SDK
import { embedDashboard } from '@superset-ui/embedded-sdk';

embedDashboard({
  id: 'dashboard-uuid-here',
  supersetDomain: 'https://superset.yourapp.com',
  mountPoint: document.getElementById('superset-container'),
  fetchGuestToken: () => fetch('/api/superset-token').then(r => r.json()).then(d => d.token),
  dashboardUiConfig: {
    hideTitle: true,
    hideChartControls: true,
    hideTab: false,
    filters: { visible: true, expanded: false },
  },
});
```

## Performance Tuning

→ **Read `references/performance.md`** for detailed cache configuration, query optimization, and scaling strategies.

### Quick Wins

1. **Enable query caching** — Set `DATA_CACHE_CONFIG` timeout to match your data refresh frequency
2. **Cache warming** — Schedule `superset cache-warmup` via Celery Beat for key dashboards
3. **Async queries** — Enable `GLOBAL_ASYNC_QUERIES` for slow dashboards
4. **Limit row counts** — Set `ROW_LIMIT` sensibly (50k default is fine for most charts)
5. **Materialized views** — Pre-aggregate in the warehouse, not in Superset SQL
6. **Virtual datasets** — Use SQL-based virtual datasets with pre-joined/aggregated queries
7. **Dashboard filter optimization** — Ensure filter columns are indexed in the warehouse

### Scaling Strategy

| Users | Infrastructure | Notes |
|---|---|---|
| <20 | Single Docker Compose | 4 CPU, 8GB RAM |
| 20–100 | Docker Compose + external DB/Redis | 8 CPU, 16GB RAM; 2 Celery workers |
| 100–500 | Kubernetes, 3+ web pods, 4+ workers | HPA on web and worker pods |
| 500+ | K8s + CDN + read replicas on metadata DB | Consider Superset-as-a-Service (Preset.io) |

## API Reference

Superset has a full REST API at `/api/v1/`. Key endpoints:

| Endpoint | Use |
|---|---|
| `POST /security/login` | Get access token |
| `GET /dashboard/` | List dashboards |
| `GET /chart/` | List charts |
| `POST /chart/data` | Execute chart query programmatically |
| `GET /dataset/` | List datasets |
| `POST /security/guest_token/` | Generate embed token |
| `GET /database/` | List database connections |

Full Swagger docs at `https://your-superset/swagger/v1`.

## Implementation Checklist

- [ ] Deployment method chosen (Docker Compose / K8s / bare metal)
- [ ] `SECRET_KEY` generated and stored securely
- [ ] Metadata database provisioned (PostgreSQL)
- [ ] Redis provisioned
- [ ] Celery workers configured
- [ ] TLS/HTTPS configured via reverse proxy
- [ ] Warehouse database connection(s) added (read-only credentials)
- [ ] Schemas restricted to marts layer
- [ ] RBAC roles created and assigned
- [ ] Row-level security rules configured (if multi-tenant)
- [ ] Feature flags reviewed and enabled
- [ ] Cache configuration tuned to data refresh frequency
- [ ] First dashboard created and validated
- [ ] Embedding configured (if required)
- [ ] Alerting/scheduled reports configured (if required)
- [ ] Backup strategy for metadata DB documented
- [ ] Upgrade path documented (pin Superset version, test upgrades in staging)

## Reference Files

| File | When to Read |
|---|---|
| `references/deployment.md` | Docker Compose, Kubernetes, and bare-metal production configs |
| `references/charts-dashboards.md` | Chart type guide, dashboard layout patterns, filter config |
| `references/security-rbac.md` | RBAC setup, row-level security, OAuth/SAML, multi-tenancy |
| `references/performance.md` | Caching, query optimization, scaling strategies |
