# Superset Deployment Reference

## Table of Contents
1. [Docker Compose (Production)](#docker-compose)
2. [Kubernetes Helm](#kubernetes)
3. [Bare Metal](#bare-metal)
4. [Reverse Proxy & TLS](#reverse-proxy)
5. [Upgrades & Backups](#upgrades)

---

## Docker Compose (Production) {#docker-compose}

### Prerequisites

- Docker Engine 24+ and Docker Compose v2
- External PostgreSQL 14+ (metadata DB)
- External Redis 7+
- Domain name with TLS certificate

### Production docker-compose.yml

```yaml
version: '3.8'

x-superset-common: &superset-common
  image: apache/superset:3.1.0    # Pin version — never use :latest in production
  env_file: .env
  volumes:
    - ./superset_config.py:/app/pythonpath/superset_config.py:ro
    - ./superset_home:/app/superset_home
  depends_on:
    redis:
      condition: service_healthy
  restart: unless-stopped

services:
  superset-web:
    <<: *superset-common
    container_name: superset-web
    command: >
      /bin/bash -c "
        superset db upgrade &&
        superset init &&
        gunicorn
          --bind 0.0.0.0:8088
          --workers 4
          --worker-class gevent
          --timeout 300
          --limit-request-line 0
          --limit-request-field_size 0
          'superset.app:create_app()'
      "
    ports:
      - "127.0.0.1:8088:8088"   # Bind to localhost only — proxy handles external
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:8088/health"]
      interval: 30s
      timeout: 10s
      retries: 5

  superset-worker:
    <<: *superset-common
    container_name: superset-worker
    command: >
      celery --app=superset.tasks.celery_app:app worker
        --pool=prefork
        --concurrency=4
        --max-tasks-per-child=128
        -Ofair
        --loglevel=INFO
    healthcheck:
      test: ["CMD", "celery", "--app=superset.tasks.celery_app:app", "inspect", "ping"]
      interval: 60s
      timeout: 10s
      retries: 3

  superset-worker-beat:
    <<: *superset-common
    container_name: superset-worker-beat
    command: >
      celery --app=superset.tasks.celery_app:app beat
        --pidfile /tmp/celerybeat.pid
        --schedule /tmp/celerybeat-schedule
        --loglevel=INFO

  redis:
    image: redis:7-alpine
    container_name: superset-redis
    command: redis-server --maxmemory 512mb --maxmemory-policy allkeys-lru
    volumes:
      - redis_data:/data
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 10s
      timeout: 5s
      retries: 5
    restart: unless-stopped

volumes:
  redis_data:
  superset_home:
```

### Environment File (.env)

```bash
# Core
SUPERSET_SECRET_KEY=<generate with: openssl rand -base64 42>
SUPERSET_META_DB_URI=postgresql://superset:STRONG_PASSWORD@db-host:5432/superset
REDIS_URL=redis://redis:6379/0

# Async
ASYNC_JWT_SECRET=<generate with: openssl rand -base64 42>

# Mapbox (optional, for map charts)
MAPBOX_API_KEY=pk.xxxxxxxxxx

# SMTP for alerts/reports
SMTP_HOST=smtp.example.com
SMTP_PORT=587
SMTP_USER=alerts@example.com
SMTP_PASSWORD=xxxx
SMTP_MAIL_FROM=alerts@example.com
```

### Custom Docker Image (Adding Database Drivers)

```dockerfile
FROM apache/superset:3.1.0

USER root

RUN pip install --no-cache-dir \
    clickhouse-connect \
    snowflake-sqlalchemy \
    duckdb-engine \
    psycopg2-binary

USER superset
```

Build: `docker build -t myorg/superset:3.1.0-custom .`

### First-Time Initialization

```bash
# After first docker compose up:
docker exec -it superset-web bash

# Create admin user
superset fab create-admin \
    --username admin \
    --firstname Admin \
    --lastname User \
    --email admin@example.com \
    --password STRONG_PASSWORD

# Initialize default roles and permissions
superset init
```

---

## Kubernetes Helm {#kubernetes}

### Install

```bash
helm repo add superset https://apache.github.io/superset
helm repo update

helm install superset superset/superset \
  --namespace superset \
  --create-namespace \
  -f values-production.yaml
```

### Key values-production.yaml Overrides

```yaml
# External metadata database
supersetNode:
  connections:
    db_host: "rds-superset.xxxxx.eu-west-1.rds.amazonaws.com"
    db_port: "5432"
    db_user: "superset"
    db_pass: "STRONG_PASSWORD"
    db_name: "superset"

# Replicas
replicaCount: 3

# Resources
resources:
  requests:
    cpu: "500m"
    memory: "1Gi"
  limits:
    cpu: "2000m"
    memory: "4Gi"

# Celery workers
supersetWorker:
  replicaCount: 4
  resources:
    requests:
      cpu: "500m"
      memory: "1Gi"

# Redis (external recommended for production)
redis:
  enabled: false
externalRedis:
  host: "redis-cluster.xxxxx.cache.amazonaws.com"
  port: 6379

# Ingress
ingress:
  enabled: true
  annotations:
    kubernetes.io/ingress.class: nginx
    cert-manager.io/cluster-issuer: letsencrypt-prod
  hosts:
    - host: superset.yourcompany.com
      paths:
        - path: /
          pathType: Prefix
  tls:
    - secretName: superset-tls
      hosts:
        - superset.yourcompany.com

# Config overrides
configOverrides:
  secret_key: |
    SECRET_KEY = os.environ.get('SUPERSET_SECRET_KEY')
  feature_flags: |
    FEATURE_FLAGS = {
        'DASHBOARD_NATIVE_FILTERS': True,
        'DASHBOARD_CROSS_FILTERS': True,
        'EMBEDDED_SUPERSET': True,
        'ALERT_REPORTS': True,
    }

# Init job (runs db upgrade + init)
init:
  adminUser:
    username: admin
    password: STRONG_PASSWORD
    email: admin@example.com
```

---

## Bare Metal {#bare-metal}

For environments where containers aren't available:

```bash
# System dependencies (Ubuntu 24.04)
sudo apt update && sudo apt install -y \
    build-essential libssl-dev libffi-dev \
    python3.11 python3.11-venv python3.11-dev \
    libsasl2-dev libldap2-dev \
    redis-server

# Create virtualenv
python3.11 -m venv /opt/superset/venv
source /opt/superset/venv/bin/activate

# Install Superset + drivers
pip install apache-superset==3.1.0 \
    psycopg2-binary \
    gevent \
    redis

# Configure
export SUPERSET_CONFIG_PATH=/opt/superset/superset_config.py

# Initialize
superset db upgrade
superset fab create-admin --username admin --password STRONG_PASSWORD ...
superset init

# Run with systemd (create service files for web, worker, beat)
gunicorn --bind 0.0.0.0:8088 --workers 4 --worker-class gevent \
    --timeout 300 'superset.app:create_app()'
```

---

## Reverse Proxy & TLS {#reverse-proxy}

### Caddy (Simplest — Auto TLS)

```
superset.yourcompany.com {
    reverse_proxy localhost:8088
}
```

### Nginx

```nginx
server {
    listen 443 ssl http2;
    server_name superset.yourcompany.com;

    ssl_certificate     /etc/letsencrypt/live/superset.yourcompany.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/superset.yourcompany.com/privkey.pem;

    client_max_body_size 100M;

    location / {
        proxy_pass http://127.0.0.1:8088;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;

        # WebSocket support (for async queries)
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_read_timeout 300s;
    }
}
```

Add to `superset_config.py`:
```python
ENABLE_PROXY_FIX = True
PROXY_FIX_CONFIG = {"x_for": 1, "x_proto": 1, "x_host": 1}
```

---

## Upgrades & Backups {#upgrades}

### Backup Strategy

```bash
# Metadata DB backup (run daily via cron)
pg_dump -h db-host -U superset -d superset | gzip > \
    /backups/superset-meta-$(date +%Y%m%d).sql.gz

# Keep 30 days
find /backups -name "superset-meta-*.sql.gz" -mtime +30 -delete
```

### Upgrade Process

1. **Read release notes** — check for breaking changes
2. **Backup metadata DB**
3. **Test in staging** with production data copy
4. **Update image tag** in compose/helm
5. **Run `superset db upgrade`** (handled automatically in Docker entrypoint)
6. **Run `superset init`** to sync permissions
7. **Verify** dashboards, charts, and connections work
8. **Monitor** logs for deprecation warnings

Pin your Superset version. Never auto-upgrade in production.
