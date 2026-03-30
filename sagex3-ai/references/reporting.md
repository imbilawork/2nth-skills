# Sage X3 — Reporting Patterns

Sage X3 GraphQL does not support aggregation. Fetch raw data and aggregate client-side.

## Revenue by Customer

```graphql
query RevenueReport {
  x3Sales {
    salesOrder {
      query(first: 1000, filter: "orderDate ge '2026-01-01'") {
        edges {
          node {
            code {
              customer { code companyName1 }
              totalAmount
              currency { code }
              orderDate
              status
            }
          }
        }
      }
    }
  }
}
```

Aggregate: group by `customer.code`, sum `totalAmount`.

## Aged Debtors

```graphql
query AgedDebtors {
  x3Sales {
    salesInvoice {
      query(first: 500, filter: "outstandingAmount gt 0") {
        edges {
          node {
            code {
              invoiceNumber
              invoiceDate
              dueDate
              customer { code companyName1 }
              totalAmount
              outstandingAmount
              currency { code }
            }
          }
        }
      }
    }
  }
}
```

Age buckets: calculate days between today and `dueDate`. Group into Current, 30d, 60d, 90d+.

## Inventory Alerts

Fetch stock levels, then filter where `quantityOnHand < reorderPoint`:

```graphql
query StockAlerts {
  x3Stock {
    stockChange {
      query(first: 500) {
        edges {
          node {
            code {
              product { code localizedDescription1 }
              stockSite { code localizedDescription }
              quantityOnHand
              reorderPoint
              quantityAvailable
            }
          }
        }
      }
    }
  }
}
```

## Sales Trend

Fetch orders over a period, group by month:

```graphql
query SalesTrend {
  x3Sales {
    salesOrder {
      query(first: 1000, filter: "orderDate ge '2025-04-01'") {
        edges {
          node {
            code {
              orderDate
              totalAmount
              currency { code }
            }
          }
        }
      }
    }
  }
}
```

Parse `orderDate`, group by `YYYY-MM`, sum `totalAmount` per bucket.

## Top Products

```graphql
query ProductSales {
  x3Sales {
    salesOrder {
      query(first: 500, filter: "orderDate ge '2026-01-01'") {
        edges {
          node {
            code {
              lines {
                product { code localizedDescription1 }
                quantity
                lineAmount
              }
            }
          }
        }
      }
    }
  }
}
```

Flatten all `lines`, group by `product.code`, sum `quantity` and `lineAmount`.

## Order Status Pipeline

Fetch all open orders and group by `status`:

```graphql
query OrderPipeline {
  x3Sales {
    salesOrder {
      query(first: 500, filter: "status ne 'Completed'") {
        edges {
          node {
            code {
              orderNumber
              status
              totalAmount
              customer { companyName1 }
            }
          }
        }
      }
    }
  }
}
```

Count by status: Processing, Shipped, Pending Payment, Overdue, etc.
