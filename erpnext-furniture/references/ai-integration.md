# ERPNext Furniture — AI Integration Patterns

## Architecture

```
User Question → LLM generates API call → Execute on ERPNext → LLM analyzes → Report
```

ERPNext's REST API is simpler than GraphQL — the LLM generates URL + filters directly.

## Cloudflare Worker Proxy

```javascript
export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (url.pathname.startsWith('/api/erp/')) {
      return proxyERPNext(request, env);
    }
    if (url.pathname === '/api/ai/query') {
      return handleAIQuery(request, env);
    }

    return env.ASSETS.fetch(request);
  }
};

async function proxyERPNext(request, env) {
  const url = new URL(request.url);
  const erpPath = url.pathname.replace('/api/erp/', '/api/');
  const erpUrl = `${env.ERPNEXT_URL}${erpPath}${url.search}`;

  const response = await fetch(erpUrl, {
    method: request.method,
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `token ${env.ERPNEXT_API_KEY}:${env.ERPNEXT_API_SECRET}`,
    },
    body: request.method !== 'GET' ? await request.text() : undefined,
  });

  return new Response(response.body, {
    status: response.status,
    headers: { 'Content-Type': 'application/json' },
  });
}
```

## Natural Language System Prompt

```
You are an ERPNext API expert for a furniture manufacturing company.
Given a natural language question, generate the appropriate ERPNext
API call.

API base: GET /api/resource/<DocType>?filters=...&fields=...
RPC: POST /api/method/<dotted.path>

Key doctypes:
- Item (products & materials, item_group: Finished Goods / Raw Material / Hardware)
- BOM (Bill of Materials, has items[] and operations[])
- Work Order (production, status: Not Started / In Process / Completed)
- Job Card (per-operation tracking)
- Stock Ledger Entry / Bin (inventory)
- Sales Order / Sales Invoice (selling)
- Purchase Order / Purchase Invoice (buying)
- Quality Inspection (QC)

Filters are JSON arrays: [field, operator, value]
Always include docstatus=1 for submitted documents.
Use limit_page_length for pagination (default 20).

Respond with the HTTP method, URL path, and body (if POST).
```

## AI Analysis Prompt

```
You are a manufacturing operations analyst for NoHa Furniture,
a premium furniture manufacturer. Analyze this ERPNext data and
provide concise, actionable insights.

Context:
- Products: dining tables, chairs, lounge furniture, storage, beds
- Materials: hardwood (oak, ash, walnut), hardware, finish, fabric
- Currency: ZAR (South African Rand)
- Operations: CNC cutting, joining, sanding, finishing, assembly

Focus on:
- Production bottlenecks and schedule risks
- Material shortages that could stop production
- Sales trends and customer patterns
- Quality issues and their root causes
- Cost variances and margin impact

Keep it concise. Bullet points over paragraphs.
```

## Full AI Query Handler

```javascript
async function handleAIQuery(request, env) {
  const { question } = await request.json();

  // Step 1: Generate API call
  const apiGen = await env.AI.run('@cf/meta/llama-3.1-8b-instruct', {
    messages: [
      { role: 'system', content: SYSTEM_PROMPT },
      { role: 'user', content: question }
    ]
  });

  // Step 2: Parse and execute
  const apiCall = parseAPICall(apiGen.response);
  const erpResponse = await fetch(
    `${env.ERPNEXT_URL}${apiCall.path}`,
    {
      method: apiCall.method,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `token ${env.ERPNEXT_API_KEY}:${env.ERPNEXT_API_SECRET}`,
      },
      body: apiCall.body ? JSON.stringify(apiCall.body) : undefined,
    }
  );
  const data = await erpResponse.json();

  // Step 3: Analyze
  const analysis = await env.AI.run('@cf/meta/llama-3.1-8b-instruct', {
    messages: [
      { role: 'system', content: ANALYSIS_PROMPT },
      { role: 'user', content: `Question: ${question}\n\nData:\n${JSON.stringify(data)}` }
    ]
  });

  return Response.json({
    question,
    apiCall: apiGen.response,
    rawData: data,
    analysis: analysis.response,
  });
}
```

## Wrangler Configuration

```toml
name = "noha-erp-ai"
compatibility_date = "2026-03-01"
compatibility_flags = ["nodejs_compat"]
pages_build_output_dir = "./public"

[ai]
binding = "AI"

[vars]
ERPNEXT_URL = "https://noha.erpnext.com"
ERPNEXT_API_KEY = "key_from_env"

# Store secret separately:
# npx wrangler secret put ERPNEXT_API_SECRET
```

## Example AI Conversations

**User:** "Do we have enough oak to make 30 dining tables?"

**AI generates:**
```
POST /api/method/erpnext.manufacturing.doctype.bom.bom.get_bom_items
{"bom": "BOM-NOHA-DINING-TABLE-001", "qty": 30, "fetch_exploded": 1}
```
Then:
```
POST /api/method/erpnext.stock.utils.get_stock_balance
{"item_code": "RM-OAK-25MM", "warehouse": "Raw Materials Store"}
```

**AI response:** "You need 720 board feet of Oak 25mm for 30 tables. Current stock: 280 bf. Shortfall: 440 bf. PO recommended — lead time from TimberCo is 8 days."

---

**User:** "What's running on the CNC today?"

**AI generates:**
```
GET /api/resource/Job Card?filters=[["workstation","=","CNC-01"],["status","in",["Open","Work In Progress"]],["expected_start_date","=","2026-03-30"]]&fields=["name","operation","work_order","for_quantity","status","time_required"]
```

**AI response:** "CNC-01 has 3 jobs today: 45 min cutting for WO-00045 (Dining Tables), 30 min machining for WO-00042 (Bookshelves), and 20 min for WO-00048 (Side Tables). Total load: 95 min / 480 min capacity (20%). Machine is available for additional scheduling."
