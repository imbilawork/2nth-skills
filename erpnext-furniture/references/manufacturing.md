# ERPNext Furniture — Manufacturing Workflows

## End-to-End Flow

```
1. Sales Order received (SO-00789: 30x Dining Tables for Weylandts)
2. Work Order created from SO (WO-00045)
3. BOM exploded → raw materials calculated
4. Stock checked → shortages trigger Purchase Orders
5. Materials issued to WIP warehouse (Stock Entry: Material Transfer)
6. Job Cards created per operation (Cut → Join → Sand → Finish → Assemble)
7. Each Job Card tracked at Workstation (time, qty, status)
8. Finished goods manufactured (Stock Entry: Manufacture)
9. Quality Inspection at QC station
10. Delivery Note → Sales Invoice → Payment
```

## Setting Up a Furniture BOM

### Example: NoHa Dining Table 8-Seater

```json
{
  "item": "NOHA-DINING-TABLE-8",
  "quantity": 1,
  "items": [
    {"item_code": "RM-OAK-25MM", "qty": 24, "uom": "Board Foot", "rate": 85},
    {"item_code": "RM-OAK-VENEER", "qty": 2.4, "uom": "Square Meter", "rate": 320},
    {"item_code": "HW-BOLT-M8X60", "qty": 16, "uom": "Nos", "rate": 4.50},
    {"item_code": "HW-BRACKET-L", "qty": 8, "uom": "Nos", "rate": 18},
    {"item_code": "FN-DANISH-OIL", "qty": 0.8, "uom": "Litre", "rate": 180},
    {"item_code": "FN-SANDPAPER-P180", "qty": 4, "uom": "Sheet", "rate": 12},
    {"item_code": "FN-SANDPAPER-P320", "qty": 4, "uom": "Sheet", "rate": 14}
  ],
  "operations": [
    {"operation": "CNC Cutting", "workstation": "CNC-01", "time_in_mins": 45},
    {"operation": "Machining", "workstation": "CNC-01", "time_in_mins": 30},
    {"operation": "Joining", "workstation": "ASSEMBLY-A", "time_in_mins": 60},
    {"operation": "Sanding", "workstation": "SAND-01", "time_in_mins": 25},
    {"operation": "Finishing", "workstation": "SPRAY-01", "time_in_mins": 40},
    {"operation": "Final Assembly", "workstation": "ASSEMBLY-B", "time_in_mins": 30},
    {"operation": "Quality Check", "workstation": "QC-STATION", "time_in_mins": 15}
  ]
}
```

### Creating a BOM via API

```bash
curl -X POST https://site.example.com/api/resource/BOM \
  -H "Authorization: token api_key:api_secret" \
  -H "Content-Type: application/json" \
  -d '{
    "item": "NOHA-DINING-TABLE-8",
    "quantity": 1,
    "is_active": 1,
    "is_default": 1,
    "items": [
      {"item_code": "RM-OAK-25MM", "qty": 24, "uom": "Board Foot"},
      {"item_code": "HW-BOLT-M8X60", "qty": 16, "uom": "Nos"}
    ],
    "with_operations": 1,
    "operations": [
      {"operation": "CNC Cutting", "workstation": "CNC-01", "time_in_mins": 45}
    ]
  }'
```

## Work Order Lifecycle

### Create from Sales Order

```
POST /api/method/erpnext.selling.doctype.sales_order.sales_order.make_work_order

{"sales_order": "SO-00789"}
```

### Start production (transfer materials)

```
POST /api/method/erpnext.manufacturing.doctype.work_order.work_order.make_stock_entry

{"work_order": "WO-00045", "purpose": "Material Transfer for Manufacture", "qty": 30}
```

### Complete production (manufacture)

```
POST /api/method/erpnext.manufacturing.doctype.work_order.work_order.make_stock_entry

{"work_order": "WO-00045", "purpose": "Manufacture", "qty": 30}
```

## Workstation Setup for Furniture

| Workstation | Type | Capacity | Products |
|-------------|------|----------|----------|
| CNC-01 | CNC Router | 8 hrs/day | All timber cutting & machining |
| CNC-02 | CNC Router | 8 hrs/day | Overflow & panel goods |
| SAW-01 | Panel Saw | 8 hrs/day | Sheet goods, rough cuts |
| ASSEMBLY-A | Assembly Bench (x4) | 32 hrs/day | Joining & sub-assembly |
| ASSEMBLY-B | Final Assembly (x2) | 16 hrs/day | Final product assembly |
| SAND-01 | Sanding Station (x3) | 24 hrs/day | All sanding operations |
| SPRAY-01 | Spray Booth | 8 hrs/day | Lacquer, stain, paint |
| OIL-01 | Oil Finishing Station | 8 hrs/day | Danish oil, wax |
| UPHOL-01 | Upholstery Bench (x2) | 16 hrs/day | Seats, cushions |
| QC-STATION | Inspection Area | 8 hrs/day | All QC |
| PACK-01 | Packing Station | 8 hrs/day | Packaging & labelling |

## Quality Inspection Template

For furniture, typical QC parameters:

```json
{
  "item_code": "NOHA-DINING-CHAIR",
  "inspection_type": "In Process",
  "readings": [
    {"specification": "Seat Height", "min_value": 448, "max_value": 452, "reading_1": 450},
    {"specification": "Joint Strength (kg)", "min_value": 80, "max_value": null, "reading_1": 95},
    {"specification": "Surface Finish (Ra)", "min_value": null, "max_value": 1.6, "reading_1": 1.2},
    {"specification": "Color Match (%)", "min_value": 95, "max_value": 100, "reading_1": 98},
    {"specification": "Weight (kg)", "min_value": 4.8, "max_value": 5.2, "reading_1": 5.0}
  ]
}
```

## Warehouse Structure

```
All Warehouses
  ├── Raw Materials Store
  │   ├── Timber Bay
  │   ├── Hardware Store
  │   ├── Finish & Adhesive
  │   └── Fabric & Foam
  ├── Work In Progress
  │   ├── CNC Area
  │   ├── Assembly Area
  │   └── Finishing Area
  ├── Finished Goods
  │   ├── Ready to Ship
  │   └── Showroom
  └── Rejected / Returns
```

## Production Planning

### Check material availability for a work order

```
POST /api/method/erpnext.manufacturing.doctype.work_order.work_order.check_if_scrap_warehouse_mandatory

# Or manually: explode BOM, then check stock for each item
POST /api/method/erpnext.manufacturing.doctype.bom.bom.get_bom_items
{"bom": "BOM-NOHA-DINING-TABLE-001", "qty": 30, "fetch_exploded": 1}

# Then for each item:
POST /api/method/erpnext.stock.utils.get_stock_balance
{"item_code": "RM-OAK-25MM", "warehouse": "Raw Materials Store"}
```

### Capacity planning

```
GET /api/resource/Job Card?filters=[["workstation","=","CNC-01"],["status","in",["Open","Work In Progress"]]]&fields=["name","operation","for_quantity","time_required"]
```

Sum `time_required` to see load on each workstation.
