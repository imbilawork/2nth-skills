---
name: erpnext-furniture
description: |
  ERPNext integration expert for furniture manufacturing. Use this skill when:
  (1) querying ERPNext doctypes — Items, BOMs, Work Orders, Stock, Sales/Purchase,
  (2) building or managing Bills of Materials for furniture products,
  (3) scheduling and tracking production work orders,
  (4) managing raw material inventory (timber, hardware, fabric, finish),
  (5) building AI-powered reporting dashboards against ERPNext,
  (6) integrating ERPNext with external systems via its REST/RPC API.
license: MIT
compatibility: Any HTTP client, Python, or Cloudflare Workers
homepage: https://2nth-skills.pages.dev/skills/erpnext-furniture.html
repository: https://github.com/imbilawork/2nth-skills
metadata:
  author: 2nth.ai
  version: "1.0.0"
  categories: "ERP, Manufacturing, REST API, Furniture"
allowed-tools: Bash(curl:*) Bash(npx:*) Bash(python*) Read Write Edit Glob Grep
---

# ERPNext — Furniture Manufacturing Integration

ERPNext is an open-source ERP built on the Frappe framework. It exposes a comprehensive **REST API** for every doctype, plus an **RPC API** for server-side methods. This skill is tailored for furniture manufacturing workflows.

Docs: https://frappeframework.com/docs/user/en/api

## Authentication

### API Key + Secret (recommended for integrations)

```
Authorization: token api_key:api_secret
```

### Basic Auth

```
Authorization: Basic base64(user:password)
```

### Session (cookie-based)

```bash
curl -X POST https://site.example.com/api/method/login \
  -d 'usr=user@example.com&pwd=password'
# Use returned cookies for subsequent requests
```

**Never hardcode credentials.** Use environment variables or secrets.

## API Patterns

### Base URL

```
https://<site>/api/resource/<DocType>
https://<site>/api/method/<dotted.path>
```

### List records

```
GET /api/resource/Item?filters=[["item_group","=","Finished Goods"]]&fields=["name","item_name","item_group","stock_uom"]&limit_page_length=50&order_by=item_name asc
```

### Get single record

```
GET /api/resource/Item/NOHA-DINING-TABLE
```

### Create record

```
POST /api/resource/Item
Content-Type: application/json

{"item_code":"NOHA-SIDE-TABLE","item_name":"NoHa Side Table","item_group":"Finished Goods","stock_uom":"Nos"}
```

### Update record

```
PUT /api/resource/Item/NOHA-SIDE-TABLE
Content-Type: application/json

{"description":"Solid walnut side table, 500x500x550mm"}
```

### Filters

Filters are JSON arrays: `[field, operator, value]`

| Operator | Meaning | Example |
|----------|---------|---------|
| `=` | Equals | `["item_group","=","Raw Material"]` |
| `!=` | Not equals | `["status","!=","Cancelled"]` |
| `>`, `>=`, `<`, `<=` | Comparison | `["qty",">",0]` |
| `like` | Wildcard match | `["item_name","like","%Oak%"]` |
| `in` | In list | `["status","in",["Open","In Process"]]` |
| `between` | Range | `["posting_date","between",["2026-01-01","2026-03-31"]]` |

Multiple filters: `[["item_group","=","Raw Material"],["stock_uom","=","Board Foot"]]`

## Furniture Manufacturing Doctypes

### Product Structure

```
Item                      — Products, raw materials, sub-assemblies
  ├── item_group          — Finished Goods, Raw Material, Sub Assembly, Hardware
  ├── stock_uom           — Nos, Board Foot, m², Kg, Litre, Sheet
  ├── has_variants        — Template items (e.g. Chair → Chair-Ash, Chair-Oak)
  └── variant_of          — Links variant to template

BOM (Bill of Materials)    — Recipe for manufacturing a product
  ├── item                — What we're making
  ├── quantity            — Batch size
  ├── items[]             — Raw materials and sub-assemblies
  │   ├── item_code
  │   ├── qty
  │   ├── uom
  │   └── rate
  ├── operations[]        — Manufacturing steps
  │   ├── operation       — Cutting, Joining, Sanding, Finishing, Assembly
  │   ├── workstation     — CNC Router, Assembly Bench, Spray Booth
  │   └── time_in_mins
  └── routing             — Linked routing document
```

### Manufacturing Flow

```
Sales Order
  → Work Order (from BOM)
    → Job Card (per operation)
      → Stock Entry (material transfer)
      → Stock Entry (manufacture — finished goods in)
    → Quality Inspection
  → Delivery Note
  → Sales Invoice
```

### Key Doctypes for Furniture

| Doctype | Purpose | Furniture Context |
|---------|---------|-------------------|
| `Item` | Products & materials | Finished furniture, timber, hardware, fabric |
| `BOM` | Bill of Materials | Recipe: 4 legs + 1 top + 8 screws = Table |
| `Work Order` | Production order | "Make 30 Dining Tables" |
| `Job Card` | Per-operation tracking | CNC cutting, assembly, finishing |
| `Workstation` | Machine/station | CNC Router, Spray Booth, Assembly Line |
| `Operation` | Manufacturing step | Cutting, Joining, Sanding, Lacquering |
| `Stock Entry` | Inventory movements | Material issue, manufacture, transfer |
| `Quality Inspection` | QC checks | Surface finish, dimensions, joint strength |
| `Sales Order` | Customer orders | Retailer and custom orders |
| `Purchase Order` | Supplier orders | Timber, hardware, finish supplies |
| `Warehouse` | Storage locations | Raw Materials Store, WIP, Finished Goods |

## Common Queries

### List all finished furniture products

```
GET /api/resource/Item?filters=[["item_group","=","Finished Goods"]]&fields=["name","item_name","description","standard_rate","stock_uom","has_variants"]&limit_page_length=100
```

### Get BOM for a product

```
GET /api/resource/BOM?filters=[["item","=","NOHA-DINING-TABLE"],["is_active","=",1],["is_default","=",1]]&fields=["name","item","quantity","total_cost","items","operations"]
```

### Active work orders

```
GET /api/resource/Work Order?filters=[["status","in",["Not Started","In Process"]]]&fields=["name","production_item","qty","produced_qty","status","planned_start_date","expected_delivery_date"]&order_by=planned_start_date asc
```

### Stock levels by warehouse

```
GET /api/resource/Bin?filters=[["warehouse","=","Raw Materials Store"]]&fields=["item_code","warehouse","actual_qty","reserved_qty","projected_qty"]&limit_page_length=500
```

### Recent sales orders

```
GET /api/resource/Sales Order?filters=[["docstatus","=",1],["transaction_date",">=","2026-03-01"]]&fields=["name","customer","grand_total","status","delivery_date","items"]&order_by=transaction_date desc&limit_page_length=50
```

### Quality inspections

```
GET /api/resource/Quality Inspection?filters=[["inspection_type","=","In Process"]]&fields=["name","item_code","reference_name","status","readings"]&order_by=creation desc
```

## RPC Methods

ERPNext exposes server-side methods via RPC:

```
POST /api/method/erpnext.manufacturing.doctype.work_order.work_order.make_stock_entry
Content-Type: application/json

{"work_order":"WO-00045","purpose":"Material Transfer for Manufacture","qty":30}
```

### Useful RPC methods

| Method | Purpose |
|--------|---------|
| `frappe.client.get_count` | Count documents matching filters |
| `frappe.client.get_list` | List with server-side aggregation |
| `erpnext.stock.utils.get_stock_balance` | Real-time stock balance |
| `erpnext.manufacturing.doctype.bom.bom.get_bom_items` | Explode BOM |
| `erpnext.manufacturing.doctype.work_order.work_order.make_stock_entry` | Create stock entry from WO |
| `erpnext.selling.doctype.sales_order.sales_order.make_work_order` | Create WO from SO |

### Get stock balance

```
POST /api/method/erpnext.stock.utils.get_stock_balance
Content-Type: application/json

{"item_code":"RM-OAK-25MM","warehouse":"Raw Materials Store"}
```

### Explode BOM (get all raw materials)

```
POST /api/method/erpnext.manufacturing.doctype.bom.bom.get_bom_items
Content-Type: application/json

{"bom":"BOM-NOHA-DINING-TABLE-001","qty":30,"fetch_exploded":1}
```

## Furniture-Specific Patterns

### Item Groups (typical setup)

```
All Item Groups
  ├── Finished Goods
  │   ├── Dining
  │   ├── Lounge
  │   ├── Bedroom
  │   ├── Storage
  │   └── Custom
  ├── Raw Material
  │   ├── Timber
  │   ├── Board & Panel
  │   ├── Fabric & Foam
  │   ├── Finish & Adhesive
  │   └── Hardware
  ├── Sub Assembly
  │   ├── Frames
  │   ├── Tops & Surfaces
  │   └── Upholstered Parts
  └── Consumable
      ├── Sandpaper
      ├── PPE
      └── Packaging
```

### Operations (typical routing)

```
1. Cutting       → CNC Router / Panel Saw      → 15-45 min
2. Machining     → CNC Router / Mortiser       → 10-30 min
3. Joining       → Assembly Bench              → 20-60 min
4. Sanding       → Sanding Station             → 15-30 min
5. Finishing     → Spray Booth / Oil Station   → 20-45 min
6. Upholstery    → Upholstery Bench            → 30-60 min (if applicable)
7. Assembly      → Final Assembly              → 15-45 min
8. QC            → Inspection Station          → 10-20 min
9. Packaging     → Packing Station             → 10-15 min
```

### UOM mapping

| Material Type | UOM | ERPNext stock_uom |
|---------------|-----|-------------------|
| Hardwood lumber | Board Foot | Board Foot |
| Sheet goods (plywood, MDF) | Sheet / m² | Sheet |
| Veneer | m² | Square Meter |
| Hardware (screws, pulls) | Each | Nos |
| Fabric | Linear Meter | Meter |
| Foam | Sheet | Sheet |
| Finish (oil, lacquer) | Litre | Litre |
| Adhesive | Litre | Litre |
| Finished furniture | Each | Nos |

## Common Gotchas

- **Docstatus matters**: 0=Draft, 1=Submitted, 2=Cancelled. Most queries need `["docstatus","=",1]`
- **Child tables**: BOM items, SO items are child tables — fetch via parent or `fields=["items.item_code","items.qty"]`
- **Rate limits**: Frappe defaults to 5 requests/second for API keys
- **Pagination**: Default `limit_page_length=20`. Set explicitly or use `limit_page_length=0` for all (careful with large datasets)
- **Field names**: Use `frappe.client.get_list` with `as_dict=1` for cleaner output
- **Naming series**: Items can use custom naming — always use `name` (ID) not `item_name` for lookups
- **BOM versioning**: Multiple BOMs per item — filter for `is_active=1` and `is_default=1`
- **Stock Entry types**: "Material Issue", "Material Receipt", "Material Transfer for Manufacture", "Manufacture"

## See Also

- [Full reference: API queries](references/queries.md)
- [Full reference: Manufacturing workflows](references/manufacturing.md)
- [Full reference: AI integration](references/ai-integration.md)
