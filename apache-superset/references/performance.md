# Performance & Scaling Reference

## Table of Contents
1. [Cache Architecture](#caching)
2. [Query Optimization](#query-optimization)
3. [Dashboard Performance](#dashboard-perf)
4. [Scaling Strategies](#scaling)
5. [Monitoring](#monitoring)

---

## Cache Architecture {#caching}

### Cache Layers in Superset

| Cache | What It Stores | Config Key | Recommended TTL |
|---|---|---|---|
| **Metadata cache** | UI metadata, permissions | `CACHE_CONFIG` | 24 hours |
| **Data cache** | Query results | `DATA_CACHE_CONFIG` | Match data refresh frequency |
| **Filter state** | Dashboard filter selections | `FILTER_STATE_CACHE_CONFIG` | 24 hours |
| **Thumbnail cache** | Dashboard/chart thumbnails | `THUMBNAIL_CACHE_CONFIG` | 7 days |
| **Explore form data** | Chart configuration state | `EXPLORE_FORM_DATA_CACHE_CONFIG` | 7 days |

### Cache Warming

Pre-populate cache for high-traffic dashboards:

```python
# superset_config.py — schedule via Celery Beat
CELERY_BEAT_SCHEDULE = {
    'cache-warmup-hourly': {
        'task': 'cache-warmup',
        'schedule': crontab(minute=0),  # Every hour
        'kwargs': {
            'strategy_name': 'top_n_dashboards',
            'top_n': 10,
        },
    },
}
```

Or manually:
```bash
superset cache-warmup --strategy top_n_dashboards --top_n 10
```

### Cache Invalidation

- **Time-based**: Set TTL to match your ETL schedule (e.g., TTL=3600 if data refreshes hourly)
- **Manual**: Force refresh via the "Force Refresh" button on any chart
- **API**: `PUT /api/v1/chart/{id}/cache_screenshot` to invalidate specific chart cache

### Redis Memory Sizing

```
Estimate: (avg_query_result_size × cached_queries × 1.5 overhead)

Example:
  500 charts × 500KB avg result × 1.5 = ~375 MB
  Add 50MB for metadata/filter/thumbnail caches
  Total: ~512 MB Redis allocation (set maxmemory accordingly)
```

Use `allkeys-lru` eviction policy so Redis automatically evicts least-recently-used entries.

---

## Query Optimization {#query-optimization}

### Superset Query Pipeline

```
User clicks chart
  → Superset checks data cache (Redis)
    → Cache HIT: return cached result
    → Cache MISS: generate SQL query
      → Send SQL to warehouse
      → Warehouse executes query
      → Result returned to Superset
      → Result cached in Redis
      → Rendered in browser
```

### Optimization Strategies

#### 1. Push Aggregation to the Warehouse

**Bad**: Virtual dataset returns raw rows, Superset aggregates in Python
```sql
-- Virtual dataset (BAD — returns millions of rows)
SELECT * FROM fct_orders
```

**Good**: Pre-aggregate in dbt or materialized view
```sql
-- dbt model: agg_daily_revenue.sql
SELECT
    order_date,
    product_category,
    store_region,
    SUM(revenue) AS total_revenue,
    COUNT(*) AS order_count
FROM {{ ref('fct_orders') }}
GROUP BY 1, 2, 3
```

Point the Superset dataset at the aggregate table.

#### 2. Index Filter Columns

Ensure columns used in Superset filters are indexed in the warehouse:

```sql
-- PostgreSQL
CREATE INDEX idx_fct_orders_date ON fct_orders (order_date);
CREATE INDEX idx_fct_orders_region ON fct_orders (store_region);

-- ClickHouse (order by is the primary index)
CREATE TABLE fct_orders (
    order_date Date,
    store_region LowCardinality(String),
    ...
) ENGINE = MergeTree()
ORDER BY (order_date, store_region);
```

#### 3. Use LIMIT and Pagination

```python
# superset_config.py
ROW_LIMIT = 50000           # Default row limit for charts
SQL_MAX_ROW = 100000        # Max rows SQL Lab can return
SAMPLES_ROW_LIMIT = 1000    # Row limit for dataset sample preview
```

#### 4. Async Queries for Slow Dashboards

```python
GLOBAL_ASYNC_QUERIES = True
GLOBAL_ASYNC_QUERIES_TRANSPORT = "polling"  # or "ws" for WebSocket
GLOBAL_ASYNC_QUERIES_JWT_SECRET = os.environ.get('ASYNC_JWT_SECRET')
GLOBAL_ASYNC_QUERIES_POLLING_DELAY = 500  # ms
```

This moves query execution to Celery workers, freeing the web server and providing a loading spinner instead of a timeout.

---

## Dashboard Performance {#dashboard-perf}

### Performance Checklist

| Check | Target | How to Fix |
|---|---|---|
| Charts per dashboard | ≤15 | Use tabs to split content |
| Chart query time | <5s each | Pre-aggregate, add indexes |
| Total dashboard load | <10s | Enable caching, reduce chart count |
| Filter dropdown items | <1000 per filter | Pre-filter with WHERE clause |
| Table chart rows | <1000 visible | Use pagination |

### Identifying Slow Charts

1. Open dashboard → Browser DevTools → Network tab
2. Look for `/api/v1/chart/data` requests taking >5s
3. Click the chart → "View Query" to see generated SQL
4. Run the SQL in SQL Lab with `EXPLAIN ANALYZE` to find bottlenecks

### Common Performance Killers

1. **Unpartitioned time-series queries** — Always filter by date range
2. **COUNT(DISTINCT) on high-cardinality columns** — Use HyperLogLog approximations where available
3. **JOINs in virtual datasets** — Pre-join in dbt, don't join at query time
4. **Too many dashboard filters** — Each filter generates a separate query
5. **Large result sets rendered in tables** — Use pagination, limit to 100–500 rows

---

## Scaling Strategies {#scaling}

### Horizontal Scaling

```
                    Load Balancer
                   /      |      \
            Web Pod 1  Web Pod 2  Web Pod 3
                   \      |      /
                    Metadata DB (PostgreSQL)
                    Redis Cluster
                   /      |      \
          Worker 1  Worker 2  Worker 3  Worker 4
```

### Component Scaling Guide

| Component | Scale Trigger | Action |
|---|---|---|
| **Web pods** | >80% CPU or >5s avg response | Add pods (HPA) |
| **Celery workers** | Queue depth >100 or alert delays | Add workers |
| **Redis** | Memory >80% | Increase maxmemory or add nodes |
| **Metadata DB** | Connection pool exhaustion | Increase pool_size, add read replicas |

### Kubernetes HPA Configuration

```yaml
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: superset-web
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: superset-web
  minReplicas: 2
  maxReplicas: 8
  metrics:
    - type: Resource
      resource:
        name: cpu
        target:
          type: Utilization
          averageUtilization: 70
    - type: Resource
      resource:
        name: memory
        target:
          type: Utilization
          averageUtilization: 80
```

### Gunicorn Worker Tuning

```python
# Rule of thumb: workers = (2 × CPU cores) + 1
# For 4-core machine:
WEBSERVER_WORKERS = 9

# Use gevent for async I/O (better for dashboard rendering)
WEBSERVER_WORKER_CLASS = "gevent"
WEBSERVER_TIMEOUT = 300
```

---

## Monitoring {#monitoring}

### Health Check Endpoint

```bash
# Built-in health check
curl http://localhost:8088/health
# Returns: "OK" with 200 status
```

### Key Metrics to Monitor

| Metric | Source | Alert Threshold |
|---|---|---|
| Web response time (p95) | Nginx/Caddy logs | >5s |
| Celery queue depth | `celery inspect active` | >100 tasks |
| Redis memory usage | `redis-cli INFO memory` | >80% maxmemory |
| Metadata DB connections | `pg_stat_activity` | >80% max_connections |
| Cache hit rate | Redis `INFO stats` (keyspace_hits / total) | <70% |
| Failed queries | Superset query log table | >5% of total |

### Prometheus + Grafana Setup

```python
# superset_config.py — enable StatsD metrics
STATS_LOGGER = StatsdStatsLogger(host='statsd-host', port=8125, prefix='superset')
```

Then scrape StatsD with Prometheus and build Grafana dashboards for:
- Request rate and latency
- Cache hit/miss ratio
- Query execution times by database
- Active Celery workers and task throughput
- Error rates by endpoint

### Log Aggregation

```python
# superset_config.py — structured JSON logging
LOG_FORMAT = '%(asctime)s:%(levelname)s:%(name)s:%(message)s'
LOG_LEVEL = 'INFO'

# Or use structured logging for ELK/Loki
ADDITIONAL_MODULE_DS_MAP = {
    'superset': 'INFO',
    'sqlalchemy.engine': 'WARNING',
}
```

Ship logs to your centralized logging stack (Loki + Grafana, ELK, CloudWatch).
