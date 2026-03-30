# ERPNext Furniture — API Query Reference

## Items

### All finished furniture
```
GET /api/resource/Item?filters=[["item_group","=","Finished Goods"]]&fields=["name","item_name","item_group","standard_rate","stock_uom","has_variants","description"]&limit_page_length=100
```

### Raw materials — timber only
```
GET /api/resource/Item?filters=[["item_group","=","Timber"]]&fields=["name","item_name","stock_uom","safety_stock","last_purchase_rate"]&limit_page_length=100
```

### Item variants (e.g. all versions of a chair)
```
GET /api/resource/Item?filters=[["variant_of","=","NOHA-DINING-CHAIR"]]&fields=["name","item_name","description","standard_rate"]
```

### Items below reorder level
```
POST /api/method/frappe.client.get_list
Content-Type: application/json

{"doctype":"Bin","filters":[["projected_qty","<",0]],"fields":["item_code","warehouse","actual_qty","reserved_qty","projected_qty"],"limit_page_length":100}
```

## Bill of Materials

### Default BOM for a product
```
GET /api/resource/BOM?filters=[["item","=","NOHA-DINING-TABLE"],["is_active","=",1],["is_default","=",1]]&fields=["*"]
```

### All active BOMs
```
GET /api/resource/BOM?filters=[["is_active","=",1],["docstatus","=",1]]&fields=["name","item","quantity","total_cost","operating_cost","raw_material_cost"]&order_by=item asc
```

### BOM explosion (all raw materials for a quantity)
```
POST /api/method/erpnext.manufacturing.doctype.bom.bom.get_bom_items
Content-Type: application/json

{"bom":"BOM-NOHA-DINING-TABLE-001","qty":30,"fetch_exploded":1}
```

### BOM cost breakdown
```
GET /api/resource/BOM/BOM-NOHA-DINING-TABLE-001?fields=["raw_material_cost","operating_cost","total_cost","items","operations"]
```

## Work Orders

### Active work orders
```
GET /api/resource/Work Order?filters=[["status","in",["Not Started","In Process"]],["docstatus","=",1]]&fields=["name","production_item","qty","produced_qty","material_transferred_for_manufacturing","status","planned_start_date","expected_delivery_date","sales_order"]&order_by=planned_start_date asc
```

### Work orders for a specific product
```
GET /api/resource/Work Order?filters=[["production_item","=","NOHA-DINING-CHAIR"],["docstatus","=",1]]&fields=["name","qty","produced_qty","status","planned_start_date"]
```

### Job cards for a work order
```
GET /api/resource/Job Card?filters=[["work_order","=","WO-00045"]]&fields=["name","operation","workstation","status","time_logs"]&order_by=sequence_id asc
```

### Create work order from sales order
```
POST /api/method/erpnext.selling.doctype.sales_order.sales_order.make_work_order
Content-Type: application/json

{"sales_order":"SO-00789","items":[{"item_code":"NOHA-DINING-TABLE","qty":10,"bom":"BOM-NOHA-DINING-TABLE-001"}]}
```

## Stock / Inventory

### Stock balance for an item across all warehouses
```
POST /api/method/erpnext.stock.utils.get_stock_balance
Content-Type: application/json

{"item_code":"RM-OAK-25MM","warehouse":"Raw Materials Store"}
```

### All stock in a warehouse
```
GET /api/resource/Bin?filters=[["warehouse","=","Raw Materials Store"],["actual_qty",">",0]]&fields=["item_code","actual_qty","reserved_qty","projected_qty","valuation_rate"]&limit_page_length=500
```

### Stock ledger entries (movements)
```
GET /api/resource/Stock Ledger Entry?filters=[["item_code","=","RM-OAK-25MM"],["posting_date",">=","2026-03-01"]]&fields=["posting_date","voucher_type","voucher_no","actual_qty","qty_after_transaction","warehouse"]&order_by=posting_date desc
```

### Material transfer for manufacturing
```
POST /api/method/erpnext.manufacturing.doctype.work_order.work_order.make_stock_entry
Content-Type: application/json

{"work_order":"WO-00045","purpose":"Material Transfer for Manufacture","qty":30}
```

## Sales

### Recent sales orders
```
GET /api/resource/Sales Order?filters=[["docstatus","=",1],["transaction_date",">=","2026-03-01"]]&fields=["name","customer","grand_total","status","delivery_date","per_delivered","per_billed"]&order_by=transaction_date desc
```

### Sales order items
```
GET /api/resource/Sales Order Item?filters=[["parent","=","SO-00789"]]&fields=["item_code","item_name","qty","rate","amount","delivery_date"]
```

### Revenue by customer (this quarter)
```
POST /api/method/frappe.client.get_list
Content-Type: application/json

{"doctype":"Sales Invoice","filters":[["docstatus","=",1],["posting_date","between",["2026-01-01","2026-03-31"]]],"fields":["customer","sum(grand_total) as revenue"],"group_by":"customer","order_by":"revenue desc","limit_page_length":20}
```

### Revenue by item group
```
POST /api/method/frappe.client.get_list
Content-Type: application/json

{"doctype":"Sales Invoice Item","filters":[["docstatus","=",1],["posting_date","between",["2026-01-01","2026-03-31"]]],"fields":["item_group","sum(amount) as revenue"],"group_by":"item_group","order_by":"revenue desc"}
```

## Purchasing

### Open purchase orders
```
GET /api/resource/Purchase Order?filters=[["docstatus","=",1],["status","in",["To Receive and Bill","To Receive"]]]&fields=["name","supplier","grand_total","status","transaction_date","items"]&order_by=transaction_date desc
```

### Supplier-wise spending
```
POST /api/method/frappe.client.get_list
Content-Type: application/json

{"doctype":"Purchase Invoice","filters":[["docstatus","=",1],["posting_date",">=","2026-01-01"]],"fields":["supplier","sum(grand_total) as total"],"group_by":"supplier","order_by":"total desc"}
```

## Quality

### Recent inspections
```
GET /api/resource/Quality Inspection?filters=[["docstatus","=",1]]&fields=["name","inspection_type","reference_type","reference_name","item_code","status","readings"]&order_by=creation desc&limit_page_length=20
```

### Failed inspections
```
GET /api/resource/Quality Inspection?filters=[["status","=","Rejected"],["docstatus","=",1]]&fields=["name","item_code","reference_name","readings"]
```

## Reporting via Report API

```
GET /api/method/frappe.client.get_count?doctype=Work Order&filters=[["status","=","In Process"]]
```

```
POST /api/method/frappe.client.get_list
Content-Type: application/json

{"doctype":"Work Order","filters":[["status","in",["Not Started","In Process"]]],"fields":["status","count(name) as count"],"group_by":"status"}
```
