# Shopify AI — Human + AI Role Patterns

The 2nth model: every person who works with a Shopify store gets their own AI partner. The AI never makes decisions — it surfaces data, drafts content, and catches things humans miss. The human always has the final say.

## Store Owner + Owner AI

**The human:** Sets strategy, makes pricing decisions, chooses brand direction.

**The AI:**
- Morning dashboard: revenue, orders, top products, stock alerts
- Competitive monitoring: "Competitor X dropped prices 10% on dining tables"
- Trend spotting: "Your scatter cushions are trending 40% up — consider featuring"
- Cash flow: "You have R 180K in unfulfilled orders, R 42K in pending refunds"

**MCP Tools:**
```
get_revenue_dashboard      — Revenue, orders, AOV, conversion by period
get_top_products           — Best sellers by revenue and volume
get_customer_growth        — New vs returning, LTV trends
get_inventory_value        — Stock value by collection/location
get_refund_summary         — Refund rate, reasons, trends
compare_periods            — This month vs last, YoY
```

**Example conversation:**
> Owner: "How are we doing this month?"
> AI: "Revenue R 842K (+14% vs Feb). 234 orders, AOV R 3,600. Your Fusion Floor Lamps are your fastest mover — 38 sold, up 60% MoM. Stock alert: Sossus Dining Table down to 3 units. Top customer: Weylandts with R 120K in orders. One concern: refund rate ticked up to 4.2% from 2.8% — mostly 'item not as described' on the scatter cushions. Want me to pull the specific returns?"

---

## Merchandiser + Merch AI

**The human:** Curates collections, decides what to feature, approves product positioning.

**The AI:**
- Auto-generates product tags from descriptions and images
- Audits SEO: missing alt text, duplicate titles, thin descriptions
- Suggests collection ordering by conversion rate
- Flags products with no sales in 30/60/90 days

**MCP Tools:**
```
list_products              — With filters (collection, status, inventory)
update_product             — Title, description, tags, SEO
manage_collection          — Add/remove products, reorder
get_seo_audit              — Missing meta, alt text, duplicates
auto_tag_products          — AI-generated tags from content
get_slow_movers            — Products with 0 sales in N days
get_conversion_by_product  — Views → cart → purchase funnel
```

**Example conversation:**
> Merchandiser: "Which products need SEO attention?"
> AI: "12 products have issues: 4 missing meta descriptions, 3 have duplicate titles, 5 have images without alt text. Biggest opportunity: your Charred Veldt Coffee Table — 340 views last month but no meta description. Want me to draft SEO copy for these 12? I won't publish anything until you approve."

---

## Content Creator + Content AI

**The human:** Owns the brand voice, makes creative decisions, approves all copy.

**The AI:**
- Drafts product descriptions from specs and images
- Generates alt text for all product images
- Writes meta titles and descriptions for SEO
- Creates blog post drafts around products and collections
- Rewrites copy for different channels (email, social, web)

**MCP Tools:**
```
get_product                — Full product data including images
update_product_description — Set body HTML
update_seo_metadata        — Set meta title + description
generate_alt_text          — AI writes alt text from image analysis
generate_product_copy      — Full description from specs
batch_update_descriptions  — Process multiple products
```

**System prompt pattern:**
```
You are a copywriter for NoHa, a luxury South African furniture brand.
Brand voice: sophisticated, understated, nature-inspired. Never salesy.
Lead with the emotional benefit. Include materials and dimensions.
Use sensory language. Keep under 150 words for product descriptions.
```

**Example conversation:**
> Content: "Write a description for the new Kuba Wall Art"
> AI: "Here's a draft:
>
> A bold graphic statement rooted in Central African textile tradition. The Kuba Wall Art translates the geometric precision of Kuba cloth into a large-scale work that commands any room.
>
> Handcrafted in our studio using mixed media on board. Each piece is unique — slight variations in texture and tone are part of its character.
>
> **Details:** 1200 x 900mm. Mixed media on board. Ready to hang. Indoor only.
>
> Want me to adjust the tone or length? I can also draft the meta description and alt text."

---

## Customer Service + Support AI

**The human:** Handles escalations, approves refunds, makes relationship calls.

**The AI:**
- Instant order lookup: status, tracking, delivery ETA
- Drafts email responses for human review
- Identifies repeat issues (same product, same complaint)
- Flags VIP customers who need special attention
- Pre-fills return/exchange forms

**MCP Tools:**
```
search_orders              — By order number, email, name
get_order_status           — Full status with tracking
search_customers           — Lookup by email, phone, name
draft_response             — AI writes reply for review
create_return              — Pre-fill return request
get_customer_history       — Past orders, returns, notes
flag_escalation            — Mark for human attention
```

**Example conversation:**
> Support: "Customer is asking about order #1042"
> AI: "Order #1042: Placed Mar 22, 2 x NoHa Dining Chairs (R 17,990). Status: Shipped via CourierGuy, tracking CG-8891234. Last scan: Johannesburg depot, yesterday 14:32. Expected delivery: tomorrow by 17:00. Customer: Sarah M., returning customer (4th order, R 48K lifetime). Draft response:
>
> 'Hi Sarah, your dining chairs are on their way! They left the Johannesburg depot yesterday and should arrive tomorrow by 5pm. Your tracking number is CG-8891234. Let me know if you need anything else.'
>
> Shall I send this or adjust it?"

---

## Marketing Manager + Marketing AI

**The human:** Decides campaign strategy, approves messaging, allocates budget.

**The AI:**
- Segments customers by behavior (new, returning, lapsed, VIP)
- Generates A/B copy variants for campaigns
- Pulls performance data by channel, product, collection
- Identifies best time to send based on open rate history
- Suggests discount strategies for slow movers

**MCP Tools:**
```
get_sales_report           — Revenue by period, product, collection
get_customer_segments      — Auto-segmented by purchase behavior
generate_campaign_copy     — Email/SMS/social copy variants
get_channel_performance    — Online vs POS vs wholesale
get_discount_impact        — Revenue impact of active discounts
get_abandoned_carts        — Checkout data for recovery campaigns
```

**Example conversation:**
> Marketing: "I need a campaign for the Fusion Floor Lamps"
> AI: "The Fusion range is your fastest-growing category — up 60% MoM. Here are 3 approaches:
>
> **1. Lifestyle:** 'Light that tells a story — The Fusion Range' — targets design-conscious buyers
> **2. Gift angle:** 'The gift they'll never forget — from R 3,995' — targets the gifting segment (28% of your customers)
> **3. Collection:** 'Complete the room — pair any Fusion Lamp with a coffee table, save 10%' — targets upsell
>
> Your best-performing email send time is Tuesday 10am (23% open rate). Want me to draft full email copy for any of these?"

---

## Operations + Ops AI

**The human:** Handles exceptions, selects carriers, manages warehouse team.

**The AI:**
- Monitors unfulfilled orders by age (flags >24h)
- Cross-checks inventory against pending orders
- Routes orders to optimal fulfillment location
- Detects fraud signals (address mismatch, unusual velocity)
- Tracks carrier performance (delivery times, damage rates)

**MCP Tools:**
```
list_unfulfilled_orders    — Sorted by age, flagged if overdue
get_inventory_levels       — By location, with pending allocations
create_fulfillment         — Prepare fulfillment for approval
flag_fraud_risk            — Scoring based on signals
get_carrier_performance    — Delivery time, damage rate by carrier
get_stockout_forecast      — Days until stockout by product
```

**Example conversation:**
> Ops: "What's overdue?"
> AI: "3 orders unfulfilled >24 hours:
>
> - #1039 (R 18,995 Sossus Table) — 28 hours. Reason: oversized item, needs freight carrier. Suggestion: book with DSV, they handle large furniture.
> - #1041 (R 7,990 2x Scatter + Throw) — 26 hours. No issue found — may have been missed. Flag for warehouse.
> - #1044 (R 3,295 Idwala Coffee Table) — 25 hours. Inventory shows 0 at JHB, but 4 at CPT. Suggest inter-warehouse transfer or ship from CPT.
>
> Want me to create fulfillment requests for #1041 and #1044?"
