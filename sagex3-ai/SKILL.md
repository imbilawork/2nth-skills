---
name: sagex3-ai
description: |
  Sage X3 ERP AI integration expert. Use this skill when:
  (1) querying Sage X3 master data — customers, suppliers, products, stock sites,
  (2) building reports from sales orders, purchase orders, invoices, or inventory,
  (3) introspecting or exploring the Sage X3 GraphQL schema,
  (4) integrating Sage X3 with external systems via its GraphQL API,
  (5) building AI-powered reporting dashboards against Sage X3 data,
  (6) deploying Sage X3 integrations to Cloudflare Workers.
license: MIT
compatibility: Any HTTP client, GraphQL client, or Cloudflare Workers
homepage: https://2nth-skills.pages.dev/skills/sagex3-ai-integration.html
repository: https://github.com/imbilawork/2nth-skills
metadata:
  author: 2nth.ai
  version: "1.0.0"
  categories: "ERP, GraphQL, Reporting, AI"
allowed-tools: Bash(curl:*) Bash(npx:*) Read Write Edit Glob Grep
---

# Sage X3 AI Integration

Sage X3 (formerly Sage Enterprise Management) is a mid-market ERP. Modern instances expose a **GraphQL API** via the Syracuse web server using Yoga GraphQL.

Endpoint pattern: `https://<host>:<port>/<folder>/api`

Full documentation: https://2nth-skills.pages.dev/skills/sagex3-ai-integration.html

## Authentication

HTTP Basic Authentication over HTTPS.

```
Authorization: Basic base64(USERNAME:PASSWORD)
```

**Never hardcode credentials.** Use environment variables, `wrangler secret put`, or `.env` files.

## Schema Structure

```
x3MasterData          — Master data
  ├── customer        — Customer business partners
  ├── supplier        — Supplier business partners
  ├── product         — Product catalog
  └── stockSite       — Warehouses / stock sites

x3Sales               — Sales domain
  ├── salesOrder      — Sales orders
  ├── salesInvoice    — Sales invoices
  └── salesDelivery   — Delivery notes

x3Purchasing          — Purchasing domain
  ├── purchaseOrder   — Purchase orders
  └── purchaseReceipt — Goods receipt

x3Stock               — Inventory domain
  ├── stockChange     — Stock movements
  └── stockCount      — Stock counts

x3Accounting          — Financial domain
  ├── journalEntry    — Journal entries
  └── generalLedger   — GL accounts
```

**Important:** Schema varies by installation. Always introspect first.

## Query Pattern

All queries use Relay cursor-based pagination with `edges`/`node`:

```graphql
query {
  x3MasterData {
    customer {
      query(first: 10, after: "cursor_value") {
        edges {
          node {
            code {
              code
              companyName1
              country { code countryName }
              currency { code localizedDescription }
              isCustomer
              isSupplier
            }
          }
        }
        pageInfo {
          hasNextPage
          endCursor
        }
      }
    }
  }
}
```

**Key rule:** All fields live inside `node.code`, not directly on `node`.

## Filtering

OData-style filter strings:

```graphql
query(first: 50, filter: "country.code eq 'ZA' and isCustomer eq true")
query(first: 100, filter: "orderDate ge '2026-01-01'")
```

| Operator | Meaning | Example |
|----------|---------|---------|
| `eq` | Equals | `status eq 'Active'` |
| `ne` | Not equals | `country.code ne 'ZA'` |
| `gt`/`ge`/`lt`/`le` | Comparison | `totalAmount gt 10000` |
| `contains()` | Substring | `contains(companyName1, 'Umbrella')` |
| `and`/`or` | Logical | `isCustomer eq true and isSupplier eq true` |

## Introspection

Always introspect to discover what's available:

```graphql
{
  __schema {
    queryType {
      fields {
        name
        description
        type { name kind ofType { name kind } }
      }
    }
  }
}
```

Discover fields on a specific type:

```graphql
{
  __type(name: "X3MasterDataQuery") {
    fields {
      name
      type { name kind }
    }
  }
}
```

## Common Gotchas

- **Fields under `code`**: Data is at `node.code.fieldName`, not `node.fieldName`
- **Pagination required**: Always pass `first` — omitting returns 0 results
- **CORS blocked**: Browser requests fail; use a server-side proxy
- **No aggregation**: GraphQL has no GROUP BY; aggregate client-side
- **Date format**: ISO 8601 in filters: `'2026-01-01'`
- **Self-signed certs**: Dev instances need `NODE_TLS_REJECT_UNAUTHORIZED=0`
- **Schema varies**: Modules and custom fields differ per install

## See Also

- [Full reference: Query patterns](references/queries.md)
- [Full reference: Reporting patterns](references/reporting.md)
- [Full reference: AI integration](references/ai-integration.md)
