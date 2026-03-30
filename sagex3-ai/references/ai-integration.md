# Sage X3 — AI Integration Patterns

## Architecture

```
User Question → LLM generates GraphQL → Execute on Sage X3 → LLM analyzes results → Report
```

Use a Cloudflare Worker as proxy to:
1. Avoid CORS issues
2. Secure credentials at the edge
3. Run AI analysis via Workers AI

## Cloudflare Worker Proxy

```javascript
export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (url.pathname === '/api/graphql') {
      return handleGraphQL(request, env);
    }
    if (url.pathname === '/api/ai/query') {
      return handleAIQuery(request, env);
    }

    return env.ASSETS.fetch(request);
  }
};

async function handleGraphQL(request, env) {
  const { query, variables } = await request.json();
  const credentials = btoa(`${env.SAGE_X3_USERNAME}:${env.SAGE_X3_PASSWORD}`);

  const response = await fetch(env.SAGE_X3_ENDPOINT, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Basic ${credentials}`,
    },
    body: JSON.stringify({ query, variables }),
  });

  return new Response(response.body, {
    status: response.status,
    headers: { 'Content-Type': 'application/json' },
  });
}
```

## Natural Language to GraphQL

### System Prompt

```
You are a Sage X3 GraphQL expert. Given a natural language question
about business data, generate the appropriate GraphQL query for the
Sage X3 API.

The API uses Relay pagination (edges/node pattern) with these domains:
- x3MasterData: customer, supplier, product, stockSite
- x3Sales: salesOrder, salesInvoice, salesDelivery
- x3Purchasing: purchaseOrder, purchaseReceipt
- x3Stock: stockChange, stockCount
- x3Accounting: journalEntry, generalLedger

Rules:
- Always include `first` parameter for pagination
- All fields are inside node.code, not node directly
- Use OData filter syntax for filtering
- Dates are ISO 8601: '2026-01-01'

Respond with ONLY the GraphQL query, no explanation.
```

### AI Analysis Prompt

```
You are a business intelligence analyst. Analyze this Sage X3 ERP
data and provide concise, actionable insights.

- Use the local currency (check currency.code in the data)
- Highlight risks and opportunities
- Recommend specific actions
- Keep it concise — bullet points over paragraphs
```

## Full AI Query Handler

```javascript
async function handleAIQuery(request, env) {
  const { question } = await request.json();

  // Step 1: Generate GraphQL
  const queryGen = await env.AI.run('@cf/meta/llama-3.1-8b-instruct', {
    messages: [
      { role: 'system', content: SYSTEM_PROMPT },
      { role: 'user', content: question }
    ]
  });

  // Step 2: Execute against Sage X3
  const credentials = btoa(`${env.SAGE_X3_USERNAME}:${env.SAGE_X3_PASSWORD}`);
  const sageResponse = await fetch(env.SAGE_X3_ENDPOINT, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Basic ${credentials}`,
    },
    body: JSON.stringify({ query: queryGen.response }),
  });
  const sageData = await sageResponse.json();

  // Step 3: Analyze with AI
  const analysis = await env.AI.run('@cf/meta/llama-3.1-8b-instruct', {
    messages: [
      { role: 'system', content: ANALYSIS_PROMPT },
      { role: 'user', content: `Question: ${question}\n\nData:\n${JSON.stringify(sageData)}` }
    ]
  });

  return Response.json({
    question,
    graphqlQuery: queryGen.response,
    rawData: sageData,
    analysis: analysis.response,
  });
}
```

## Wrangler Configuration

```toml
name = "sage-x3-proxy"
compatibility_date = "2026-03-01"
compatibility_flags = ["nodejs_compat"]
pages_build_output_dir = "./public"

[ai]
binding = "AI"

[vars]
SAGE_X3_ENDPOINT = "https://host:port/folder/api"
SAGE_X3_USERNAME = "USERNAME"

# Store password as secret:
# npx wrangler secret put SAGE_X3_PASSWORD
```
