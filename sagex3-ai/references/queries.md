# Sage X3 GraphQL — Query Reference

## Customer Master Data

```graphql
query Customers {
  x3MasterData {
    customer {
      query(first: 50) {
        edges {
          node {
            code {
              code
              companyName1
              companyName2
              country { code countryName }
              currency { code localizedDescription }
              isCustomer
              isSupplier
              category { code localizedDescription }
              creditLimit
              paymentTerms { code localizedDescription }
              taxCode { code }
              phone
              email
              address {
                addressLine1
                addressLine2
                city
                stateProvince
                postalCode
              }
            }
          }
        }
        pageInfo { hasNextPage endCursor }
      }
    }
  }
}
```

## Supplier Master Data

```graphql
query Suppliers {
  x3MasterData {
    supplier {
      query(first: 50) {
        edges {
          node {
            code {
              code
              companyName1
              country { code countryName }
              currency { code }
              isCustomer
              isSupplier
              paymentTerms { code localizedDescription }
            }
          }
        }
      }
    }
  }
}
```

## Product Catalog

```graphql
query Products {
  x3MasterData {
    product {
      query(first: 100) {
        edges {
          node {
            code {
              code
              localizedDescription1
              productCategory { code localizedDescription }
              salesPrice
              costPrice
              unitOfMeasure { code }
              weight
              status
            }
          }
        }
      }
    }
  }
}
```

## Sales Orders

```graphql
query SalesOrders {
  x3Sales {
    salesOrder {
      query(first: 25) {
        edges {
          node {
            code {
              orderNumber
              orderDate
              customer { code companyName1 }
              currency { code }
              totalAmount
              status
              deliveryDate
              lines {
                lineNumber
                product { code localizedDescription1 }
                quantity
                unitPrice
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

## Sales Invoices

```graphql
query SalesInvoices {
  x3Sales {
    salesInvoice {
      query(first: 50) {
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
              status
            }
          }
        }
      }
    }
  }
}
```

## Stock Levels

```graphql
query StockLevels {
  x3Stock {
    stockChange {
      query(first: 50) {
        edges {
          node {
            code {
              product { code localizedDescription1 }
              stockSite { code localizedDescription }
              quantityOnHand
              quantityAllocated
              quantityAvailable
              reorderPoint
              unitOfMeasure { code }
            }
          }
        }
      }
    }
  }
}
```

## Purchase Orders

```graphql
query PurchaseOrders {
  x3Purchasing {
    purchaseOrder {
      query(first: 25) {
        edges {
          node {
            code {
              orderNumber
              orderDate
              supplier { code companyName1 }
              totalAmount
              status
              lines {
                product { code localizedDescription1 }
                quantity
                unitPrice
              }
            }
          }
        }
      }
    }
  }
}
```

## Schema Introspection

### Top-level domains
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

### Fields on a specific type
```graphql
{
  __type(name: "X3CustomerCode") {
    name
    fields {
      name
      type { name kind ofType { name kind } }
    }
  }
}
```

### Sub-entities in a domain
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
