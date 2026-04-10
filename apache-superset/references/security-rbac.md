# Security & RBAC Reference

## Table of Contents
1. [Authentication Setup](#auth)
2. [RBAC Configuration](#rbac)
3. [Row-Level Security](#rls)
4. [Multi-Tenancy Patterns](#multi-tenancy)
5. [API Security](#api)

---

## Authentication Setup {#auth}

### Built-in Database Auth (Default)

Suitable for small teams. Users managed in Superset UI under Settings → Security → Users.

### OAuth 2.0 (Google, Azure AD, GitHub)

```python
# superset_config.py
from flask_appbuilder.security.manager import AUTH_OAUTH

AUTH_TYPE = AUTH_OAUTH

OAUTH_PROVIDERS = [
    {
        'name': 'google',
        'icon': 'fa-google',
        'token_key': 'access_token',
        'remote_app': {
            'client_id': os.environ.get('GOOGLE_OAUTH_CLIENT_ID'),
            'client_secret': os.environ.get('GOOGLE_OAUTH_SECRET'),
            'api_base_url': 'https://www.googleapis.com/oauth2/v2/',
            'client_kwargs': {'scope': 'email profile'},
            'access_token_url': 'https://accounts.google.com/o/oauth2/token',
            'authorize_url': 'https://accounts.google.com/o/oauth2/auth',
            'jwks_uri': 'https://www.googleapis.com/oauth2/v3/certs',
        },
    }
]

# Map OAuth groups to Superset roles
AUTH_ROLES_MAPPING = {
    'data-team@company.com': ['Alpha', 'sql_lab'],
    'analysts@company.com': ['Gamma', 'sql_lab'],
    'executives@company.com': ['Gamma'],
}
AUTH_ROLES_SYNC_AT_LOGIN = True
```

### SAML 2.0 (Enterprise SSO)

```python
from flask_appbuilder.security.manager import AUTH_REMOTE_USER

AUTH_TYPE = AUTH_REMOTE_USER

# With a SAML proxy (e.g., mod_auth_mellon, Keycloak)
# The proxy sets REMOTE_USER header after SAML authentication
```

### LDAP

```python
from flask_appbuilder.security.manager import AUTH_LDAP

AUTH_TYPE = AUTH_LDAP
AUTH_LDAP_SERVER = 'ldap://ldap.company.com'
AUTH_LDAP_USE_TLS = True
AUTH_LDAP_SEARCH = 'ou=users,dc=company,dc=com'
AUTH_LDAP_BIND_USER = 'cn=superset,ou=service,dc=company,dc=com'
AUTH_LDAP_BIND_PASSWORD = os.environ.get('LDAP_BIND_PASSWORD')
AUTH_LDAP_UID_FIELD = 'sAMAccountName'
```

---

## RBAC Configuration {#rbac}

### Built-In Roles

| Role | Capabilities |
|---|---|
| **Admin** | Full access — manage users, roles, databases, all dashboards |
| **Alpha** | Access all data sources, create charts/dashboards, SQL Lab |
| **Gamma** | View only dashboards/charts explicitly granted |
| **sql_lab** | Access SQL Lab (combine with other roles) |
| **Public** | Unauthenticated access (disabled by default) |

### Custom Role Design

```
Create custom roles via Settings → Security → Roles

Recommended custom roles:

1. Dashboard_Viewer
   - can read on Dashboard (specific dashboards only)
   - can read on Chart
   - can explore on Dataset (for filter dropdowns)
   
2. Analyst
   - All Gamma permissions
   - can sql_lab on Database (specific databases)
   - can read on all Datasets in marts schema
   - can write on Chart (create own charts)
   - can write on Dashboard (create own dashboards)

3. Data_Engineer
   - All Alpha permissions
   - can sql_lab on all Databases
   - can manage datasets
   
4. Embed_Service
   - can grant guest token
   - can read on specific embedded dashboards
```

### Granting Dashboard Access to Gamma Users

Gamma users see nothing by default. Grant access by:

1. **Dashboard** → Edit → Set **Owners** and **Roles** that can view
2. Or: Go to Settings → Security → Roles → Edit the role → Add specific dashboard permissions

### Permission Model

Superset permissions follow: `[action] on [resource]`

Common actions: `can read`, `can write`, `can delete`, `can explore`, `can sql_lab`
Common resources: `Dashboard`, `Chart`, `Dataset`, `Database`, `Query`

---

## Row-Level Security {#rls}

### How RLS Works

RLS rules append a `WHERE` clause to every query on specified tables for users in specified roles.

### Creating RLS Rules

Settings → Row Level Security → Add

| Field | Value |
|---|---|
| **Name** | `region_filter` |
| **Filter Type** | Regular (adds WHERE) |
| **Tables** | `fct_orders`, `fct_revenue` |
| **Roles** | `Regional_Manager_East` |
| **Group Key** | `region` (optional — for mutual exclusion) |
| **Clause** | `region = 'Eastern Cape'` |

### Dynamic RLS with Jinja

```sql
-- Clause using current user's email domain
company_domain = '{{ current_username().split("@")[1] }}'

-- Clause using user's custom attribute (set in user profile extra field)
region = '{{ current_user_extra("region", "ALL") }}'

-- Multiple values
region IN ({{ current_user_extra("regions", "'ALL'") }})
```

### RLS for Embedding (Guest Tokens)

When generating guest tokens via API, pass RLS clauses directly:

```python
{
    "rls": [
        {"clause": "customer_id = 'CUST-123'"},
        {"clause": "is_confidential = FALSE"}
    ]
}
```

This is the most secure embedding pattern — the clause is set server-side and cannot be tampered with by the frontend.

### RLS Testing

Always test RLS rules:
1. Log in as a user with the RLS role
2. Open SQL Lab, query the affected table
3. Verify the WHERE clause is applied (check query log)
4. Try to bypass via direct SQL — should still be filtered

---

## Multi-Tenancy Patterns {#multi-tenancy}

### Pattern 1: RLS-Based (Single Database)

All tenants share the same tables with a `tenant_id` column. RLS filters per user.

**Pros**: Simple, single schema, easy maintenance
**Cons**: Noisy-neighbour risk, harder to isolate data

```sql
-- RLS clause
tenant_id = '{{ current_user_extra("tenant_id") }}'
```

### Pattern 2: Schema-Per-Tenant

Each tenant gets their own schema in the warehouse. Superset connects to tenant-specific schemas.

**Pros**: Better isolation, easier data deletion (POPIA)
**Cons**: More Superset datasets to manage

```python
# Dynamic schema selection in virtual dataset
SELECT * FROM {{ url_param('tenant_schema', 'default') }}.fct_orders
```

### Pattern 3: Database-Per-Tenant

Complete isolation — each tenant has their own database connection in Superset.

**Pros**: Full isolation, independent scaling
**Cons**: Complex management, duplicated dashboards

### Recommendation for SA/POPIA Compliance

**Schema-per-tenant** is the best balance — it provides clear data boundaries for POPIA deletion requests while keeping operational complexity manageable.

---

## API Security {#api}

### API Authentication

```python
# All API calls require Bearer token
# 1. Get token
POST /api/v1/security/login
Body: {"username": "api_user", "password": "xxx", "provider": "db"}
Response: {"access_token": "eyJ..."}

# 2. Use token
GET /api/v1/dashboard/
Headers: Authorization: Bearer eyJ...
```

### API Rate Limiting

```python
# superset_config.py
RATELIMIT_ENABLED = True
RATELIMIT_APPLICATION = "50 per second"
AUTH_RATE_LIMITED = True
AUTH_RATE_LIMIT = "5 per second"
```

### CORS Configuration (for Embedding)

```python
ENABLE_CORS = True
CORS_OPTIONS = {
    'supports_credentials': True,
    'allow_headers': ['*'],
    'resources': ['/api/*'],
    'origins': [
        'https://yourapp.com',
        'https://app.yourcompany.com',
    ],
}

# Also for embedding specifically
GUEST_ROLE_NAME = "Public"
GUEST_TOKEN_JWT_SECRET = os.environ.get('GUEST_JWT_SECRET')
GUEST_TOKEN_JWT_EXP_SECONDS = 300  # 5 min — short-lived
```
