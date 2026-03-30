# Shopify AI — API Query Reference

## Products

### List active products
```
GET /admin/api/2024-10/products.json?status=active&limit=50
```

### Search products by title
```
GET /admin/api/2024-10/products.json?title=Sossus
```

### Product with variants and images (GraphQL)
```graphql
{
  products(first: 20, query: "status:active") {
    edges {
      node {
        id title handle description vendor productType tags status
        variants(first: 10) {
          edges {
            node {
              id title price compareAtPrice sku inventoryQuantity
              selectedOptions { name value }
            }
          }
        }
        images(first: 5) {
          edges { node { url altText width height } }
        }
        seo { title description }
        metafields(first: 10) {
          edges { node { namespace key value type } }
        }
      }
    }
    pageInfo { hasNextPage endCursor }
  }
}
```

### Products by collection
```graphql
{
  collection(id: "gid://shopify/Collection/12345") {
    title
    products(first: 50) {
      edges {
        node { id title variants(first: 1) { edges { node { price } } } }
      }
    }
  }
}
```

### Update product SEO
```graphql
mutation {
  productUpdate(input: {
    id: "gid://shopify/Product/12345"
    seo: {
      title: "Sossus Dining Table — Solid Hardwood | NoHa"
      description: "Sculptural 8-seater dining table with organic edges. Handcrafted in South Africa."
    }
    tags: ["dining", "hardwood", "8-seater", "organic", "handcrafted"]
  }) {
    product { id seo { title description } tags }
    userErrors { field message }
  }
}
```

## Orders

### Recent orders
```
GET /admin/api/2024-10/orders.json?status=open&limit=50&order=created_at+desc
```

### Unfulfilled orders (GraphQL)
```graphql
{
  orders(first: 30, query: "fulfillment_status:unfulfilled") {
    edges {
      node {
        id name createdAt
        totalPriceSet { shopMoney { amount currencyCode } }
        customer { firstName lastName email phone }
        lineItems(first: 10) {
          edges { node { title quantity sku variant { sku inventoryQuantity } } }
        }
        shippingAddress { address1 city province zip country }
        fulfillmentOrders(first: 5) {
          edges { node { id status } }
        }
      }
    }
  }
}
```

### Order by name (e.g. #1042)
```graphql
{
  orders(first: 1, query: "name:#1042") {
    edges {
      node {
        id name financialStatus fulfillmentStatus
        totalPriceSet { shopMoney { amount } }
        customer { firstName lastName email }
        lineItems(first: 10) { edges { node { title quantity } } }
        fulfillments { trackingInfo { number url company } status }
      }
    }
  }
}
```

## Customers

### Search by email
```
GET /admin/api/2024-10/customers/search.json?query=email:jane@example.com
```

### High-value customers (GraphQL)
```graphql
{
  customers(first: 20, query: "orders_count:>3", sortKey: TOTAL_SPENT, reverse: true) {
    edges {
      node {
        id firstName lastName email
        ordersCount totalSpent
        tags
        lastOrder { id name createdAt }
        addresses(first: 1) { city province country }
      }
    }
  }
}
```

### Tag a customer segment
```graphql
mutation {
  tagsAdd(id: "gid://shopify/Customer/12345", tags: ["VIP", "repeat-buyer"]) {
    node { ... on Customer { id tags } }
    userErrors { field message }
  }
}
```

## Inventory

### Stock levels at a location
```
GET /admin/api/2024-10/inventory_levels.json?location_ids=12345&limit=250
```

### Adjust inventory
```graphql
mutation {
  inventoryAdjustQuantities(input: {
    reason: "correction"
    name: "available"
    changes: [{
      delta: -5
      inventoryItemId: "gid://shopify/InventoryItem/12345"
      locationId: "gid://shopify/Location/12345"
    }]
  }) {
    inventoryAdjustmentGroup { reason changes { name delta } }
    userErrors { field message }
  }
}
```

## Collections

### List all collections
```graphql
{
  collections(first: 50) {
    edges {
      node {
        id title handle
        productsCount
        image { url altText }
        seo { title description }
      }
    }
  }
}
```

### Add product to collection
```graphql
mutation {
  collectionAddProducts(id: "gid://shopify/Collection/12345", productIds: ["gid://shopify/Product/67890"]) {
    collection { id title productsCount }
    userErrors { field message }
  }
}
```

## Analytics / Reports

### Sales by product (via orders)
```graphql
{
  orders(first: 250, query: "created_at:>2026-01-01 financial_status:paid") {
    edges {
      node {
        lineItems(first: 20) {
          edges {
            node {
              title
              quantity
              originalTotalSet { shopMoney { amount } }
              product { id productType }
            }
          }
        }
      }
    }
  }
}
```

### Abandoned checkouts
```
GET /admin/api/2024-10/checkouts.json?limit=50&created_at_min=2026-03-01
```

## Bulk Operations

For datasets >250 items:
```graphql
mutation {
  bulkOperationRunQuery(query: """
    {
      products {
        edges {
          node {
            id title handle
            variants { edges { node { sku price inventoryQuantity } } }
          }
        }
      }
    }
  """) {
    bulkOperation { id status }
    userErrors { field message }
  }
}
```

Poll for completion, then download the JSONL file from the returned URL.
