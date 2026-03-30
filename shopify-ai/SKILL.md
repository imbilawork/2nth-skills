---
name: shopify-ai
description: |
  Shopify AI integration expert. Use this skill when:
  (1) querying Shopify Admin API — products, orders, customers, inventory, collections,
  (2) building AI-powered e-commerce tools — product descriptions, SEO, merchandising,
  (3) automating Shopify operations — order management, fulfillment, customer service,
  (4) connecting Shopify via MCP to give human roles their AI partner,
  (5) building Storefront API integrations for headless commerce,
  (6) analyzing Shopify data for marketing, growth, and operational insights.
license: MIT
compatibility: Any HTTP client, Node.js, Python, or Cloudflare Workers
homepage: https://2nth-skills.pages.dev/skills/shopify-ai.html
repository: https://github.com/imbilawork/2nth-skills
metadata:
  author: 2nth.ai
  version: "1.0.0"
  categories: "E-Commerce, Shopify, AI, Retail"
allowed-tools: Bash(curl:*) Bash(npx:*) Read Write Edit Glob Grep
---

# Shopify AI Integration

Shopify exposes two APIs: the **Admin API** (REST + GraphQL) for store management, and the **Storefront API** (GraphQL) for customer-facing experiences. Both are powerful foundations for AI augmentation.

Docs: https://shopify.dev/docs/api

## The 2nth Model: One Person + One AI

Every Shopify role has an AI partner that makes them extraordinary:

| Role | The Human Decides | The AI Enables |
|------|-------------------|----------------|
| **Store Owner** | Strategy, pricing, brand direction | Revenue dashboards, trend analysis, competitor monitoring |
| **Merchandiser** | Collection curation, product selection | Auto-tagging, SEO optimization, inventory-aware recommendations |
| **Content Creator** | Brand voice, creative direction | Draft product descriptions, blog posts, alt text, meta tags |
| **Customer Service** | Escalations, refunds, relationship calls | Order lookup, FAQ answers, draft responses, sentiment analysis |
| **Marketing Manager** | Campaign strategy, budget allocation | Audience segmentation, A/B copy, performance reporting |
| **Operations/Fulfillment** | Exception handling, carrier selection | Order routing, stock alerts, fulfillment tracking, fraud flags |

## Authentication

### Admin API (Private App / Custom App)
```
X-Shopify-Access-Token: shpat_xxxxx
```

### Storefront API
```
X-Shopify-Storefront-Access-Token: xxxxx
```

### Admin API Base URL
```
https://{store}.myshopify.com/admin/api/2024-10/{resource}.json   # REST
https://{store}.myshopify.com/admin/api/2024-10/graphql.json      # GraphQL
```

## Admin API — Key Resources

### Products
```
GET /admin/api/2024-10/products.json?limit=50&status=active
GET /admin/api/2024-10/products/{id}.json
POST /admin/api/2024-10/products.json
PUT /admin/api/2024-10/products/{id}.json
```

### Orders
```
GET /admin/api/2024-10/orders.json?status=open&limit=50
GET /admin/api/2024-10/orders/{id}.json
POST /admin/api/2024-10/orders/{id}/fulfillments.json
```

### Customers
```
GET /admin/api/2024-10/customers.json?limit=50
GET /admin/api/2024-10/customers/search.json?query=email:user@example.com
```

### Inventory
```
GET /admin/api/2024-10/inventory_levels.json?location_ids=1234
POST /admin/api/2024-10/inventory_levels/set.json
```

### Collections
```
GET /admin/api/2024-10/custom_collections.json
GET /admin/api/2024-10/smart_collections.json
POST /admin/api/2024-10/custom_collections.json
```

## Admin GraphQL API

More powerful than REST — supports bulk operations, metafields, and complex queries:

```graphql
{
  products(first: 10, query: "status:active") {
    edges {
      node {
        id
        title
        description
        variants(first: 5) {
          edges {
            node {
              price
              inventoryQuantity
              sku
            }
          }
        }
        images(first: 1) {
          edges {
            node { url altText }
          }
        }
        seo { title description }
        tags
      }
    }
  }
}
```

### Orders with fulfillment
```graphql
{
  orders(first: 20, query: "fulfillment_status:unfulfilled") {
    edges {
      node {
        id
        name
        totalPriceSet { shopMoney { amount currencyCode } }
        customer { firstName lastName email }
        lineItems(first: 10) {
          edges {
            node { title quantity variant { sku } }
          }
        }
        shippingAddress { city province country }
      }
    }
  }
}
```

### Customer segments
```graphql
{
  customers(first: 50, query: "orders_count:>5") {
    edges {
      node {
        id
        firstName
        lastName
        email
        ordersCount
        totalSpent
        tags
      }
    }
  }
}
```

## AI-Powered Role Patterns

### Content Creator AI
```
System prompt: You are a product copywriter for a luxury furniture brand.
Write compelling product descriptions that:
- Lead with the emotional benefit, not the feature
- Include material, dimensions, and care in a structured format
- Use sensory language (touch, visual, spatial)
- Keep SEO keywords natural
- Match the brand voice: sophisticated, understated, nature-inspired
```

Then feed: product title, images, tags, existing description → AI generates optimized copy.

### Merchandiser AI
```
1. Fetch all products with low inventory
2. Cross-reference with sales velocity (orders per day)
3. Flag: "Bestseller running low" or "Slow mover overstocked"
4. Suggest collection reordering based on conversion data
5. Auto-generate product tags from description + images
```

### Customer Service AI
```
1. Customer emails with order number
2. AI looks up order via Admin API
3. Returns: order status, tracking, delivery ETA
4. Drafts response for human to review before sending
5. Flags orders that need escalation (late, damaged, high-value)
```

### Marketing AI
```
1. Pull sales data by product, collection, channel
2. Identify top performers and underperformers
3. Generate campaign copy for top products
4. Suggest discount strategies for slow movers
5. Build audience segments from customer purchase history
```

### Operations AI
```
1. Monitor unfulfilled orders by age
2. Check inventory levels against pending orders
3. Flag potential stockouts before they happen
4. Route orders to optimal fulfillment location
5. Detect fraud signals (address mismatch, velocity)
```

## MCP Server Pattern

```javascript
// Tools exposed per role
const ROLE_TOOLS = {
  owner: ['get_revenue_dashboard', 'get_top_products', 'get_customer_growth', 'get_inventory_value'],
  merchandiser: ['list_products', 'update_product', 'manage_collection', 'get_seo_audit', 'auto_tag_products'],
  content: ['get_product', 'update_product_description', 'generate_alt_text', 'update_seo_metadata'],
  support: ['search_orders', 'get_order_status', 'search_customers', 'draft_response', 'create_return'],
  marketing: ['get_sales_report', 'get_customer_segments', 'generate_campaign_copy', 'get_channel_performance'],
  operations: ['list_unfulfilled_orders', 'get_inventory_levels', 'create_fulfillment', 'flag_fraud_risk'],
};
```

## Rate Limits

| Plan | REST | GraphQL |
|------|------|---------|
| Standard | 2 req/sec | 50 points/sec |
| Advanced/Plus | 4 req/sec | 100 points/sec |
| Shopify Plus | 20 req/sec | 1000 points/sec |

GraphQL uses cost-based throttling. Check `extensions.cost` in responses.

## Webhooks

Subscribe to real-time events for AI monitoring:

| Webhook | Use Case |
|---------|----------|
| `orders/create` | Alert operations, update dashboards |
| `orders/fulfilled` | Notify customer service, update tracking |
| `products/update` | Trigger SEO re-audit |
| `inventory_levels/update` | Check reorder points |
| `customers/create` | Welcome sequence, segment assignment |
| `refunds/create` | Alert customer service, flag patterns |

## Common Gotchas

- **API versioning**: Always specify version (e.g., `2024-10`). Deprecated versions return errors
- **Pagination**: REST uses Link headers, GraphQL uses cursor-based `edges/node`
- **Rate limits**: GraphQL is cost-based, not request-based. Complex queries cost more
- **Metafields**: Use GraphQL for metafields — REST support is limited
- **Bulk operations**: For large datasets (>250 items), use GraphQL bulk operations
- **Webhooks vs polling**: Always prefer webhooks for real-time data
- **Currency**: Amounts are strings in REST, use `MoneyV2` in GraphQL

## See Also

- [Full reference: API queries](references/queries.md)
- [Full reference: Role patterns](references/roles.md)
- [Full reference: AI integration](references/ai-integration.md)
