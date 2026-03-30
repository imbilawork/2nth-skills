# Shopify AI — Integration Architecture

## Architecture

```
User (Role) → AI Client (Claude) → MCP Server → Shopify Admin API
                                  ↘ Workers AI (content generation, analysis)
```

## Cloudflare Worker as MCP Server

```javascript
export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (url.pathname === '/api/shopify') return proxyShopify(request, env);
    if (url.pathname === '/api/ai/content') return generateContent(request, env);
    if (url.pathname === '/api/ai/analyze') return analyzeData(request, env);

    return env.ASSETS.fetch(request);
  }
};

async function proxyShopify(request, env) {
  const { endpoint, method, body } = await request.json();
  const shopUrl = `https://${env.SHOPIFY_STORE}.myshopify.com/admin/api/2024-10/${endpoint}`;

  const response = await fetch(shopUrl, {
    method: method || 'GET',
    headers: {
      'Content-Type': 'application/json',
      'X-Shopify-Access-Token': env.SHOPIFY_ACCESS_TOKEN,
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  return new Response(response.body, {
    status: response.status,
    headers: { 'Content-Type': 'application/json' },
  });
}

async function proxyGraphQL(query, variables, env) {
  const response = await fetch(
    `https://${env.SHOPIFY_STORE}.myshopify.com/admin/api/2024-10/graphql.json`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Shopify-Access-Token': env.SHOPIFY_ACCESS_TOKEN,
      },
      body: JSON.stringify({ query, variables }),
    }
  );
  return response.json();
}
```

## Content Generation with Workers AI

```javascript
async function generateContent(request, env) {
  const { type, product } = await request.json();

  const prompts = {
    description: `Write a product description for "${product.title}".
      Brand: luxury South African furniture. Voice: sophisticated, nature-inspired.
      Include: ${product.tags?.join(', ')}.
      Materials: ${product.body_html ? 'extract from existing' : 'infer from title'}.
      Keep under 150 words. Lead with emotion, end with specs.`,

    seo_title: `Write an SEO meta title for "${product.title}" by NoHa.
      Max 60 characters. Include primary keyword and brand.`,

    seo_description: `Write an SEO meta description for "${product.title}".
      Max 155 characters. Include a call to action.`,

    alt_text: `Write alt text for a product image of "${product.title}".
      Describe what's visible. Max 125 characters. Be specific.`,

    email_copy: `Write a short email feature block for "${product.title}"
      priced at ${product.variants?.[0]?.price}.
      2-3 sentences. Include a CTA. Brand voice: understated luxury.`,
  };

  const result = await env.AI.run('@cf/meta/llama-3.1-8b-instruct', {
    messages: [
      { role: 'system', content: 'You are a luxury e-commerce copywriter. Be concise and compelling.' },
      { role: 'user', content: prompts[type] || prompts.description }
    ]
  });

  return Response.json({ content: result.response, type });
}
```

## Data Analysis with Workers AI

```javascript
async function analyzeData(request, env) {
  const { question, role } = await request.json();

  // Role-specific system prompts
  const rolePrompts = {
    owner: 'You are a business analyst for a luxury e-commerce store. Focus on revenue, growth, and strategic insights. Currency: ZAR.',
    merchandiser: 'You are an e-commerce merchandising expert. Focus on product performance, SEO, and collection optimization.',
    marketing: 'You are a digital marketing analyst. Focus on customer segments, campaign performance, and growth opportunities.',
    support: 'You are a customer service supervisor. Focus on order status, resolution speed, and customer satisfaction.',
    operations: 'You are a fulfillment operations analyst. Focus on shipping speed, inventory accuracy, and exception handling.',
  };

  // Step 1: Determine which Shopify data to fetch
  const queryPlan = await env.AI.run('@cf/meta/llama-3.1-8b-instruct', {
    messages: [
      { role: 'system', content: `Given a question about a Shopify store, determine which API endpoint(s) to query. Respond with JSON: {"endpoints": [{"type": "graphql"|"rest", "query": "..."}]}` },
      { role: 'user', content: question }
    ]
  });

  // Step 2: Execute queries
  // (parse queryPlan.response, execute against Shopify)

  // Step 3: Analyze results
  const analysis = await env.AI.run('@cf/meta/llama-3.1-8b-instruct', {
    messages: [
      { role: 'system', content: rolePrompts[role] || rolePrompts.owner },
      { role: 'user', content: `Question: ${question}\n\nData: ${JSON.stringify(shopifyData)}` }
    ]
  });

  return Response.json({ analysis: analysis.response });
}
```

## Webhook Handler for Real-Time AI

```javascript
async function handleWebhook(request, env) {
  const topic = request.headers.get('X-Shopify-Topic');
  const data = await request.json();

  switch (topic) {
    case 'orders/create':
      // Check for fraud signals
      // Update inventory forecasts
      // Notify operations if high-value
      break;

    case 'inventory_levels/update':
      // Check against reorder points
      // Alert merchandiser if bestseller running low
      break;

    case 'refunds/create':
      // Log reason, check for patterns
      // Alert owner if refund rate exceeds threshold
      break;
  }
}
```

## Wrangler Configuration

```toml
name = "noha-shopify-ai"
compatibility_date = "2026-03-01"
compatibility_flags = ["nodejs_compat"]
pages_build_output_dir = "./public"

[ai]
binding = "AI"

[vars]
SHOPIFY_STORE = "noha-furniture"

# Secrets:
# npx wrangler secret put SHOPIFY_ACCESS_TOKEN
```

## MCP Tool Registration

```javascript
const tools = {
  // Owner
  get_revenue_dashboard: {
    description: 'Get revenue, orders, AOV for a date range',
    input: { period: 'string (today|week|month|quarter|year)' },
    handler: async (input, env) => {
      const data = await proxyGraphQL(`{
        orders(first: 250, query: "created_at:>${periodToDate(input.period)} financial_status:paid") {
          edges { node { totalPriceSet { shopMoney { amount } } createdAt } }
        }
      }`, {}, env);
      return aggregateRevenue(data);
    }
  },

  // Merchandiser
  get_seo_audit: {
    description: 'Audit all products for SEO issues',
    handler: async (input, env) => {
      const products = await proxyGraphQL(`{
        products(first: 250) {
          edges { node { id title seo { title description } images(first:1) { edges { node { altText } } } } }
        }
      }`, {}, env);
      return findSEOIssues(products);
    }
  },

  // Content
  generate_product_copy: {
    description: 'Generate product description, SEO, and alt text',
    input: { productId: 'string' },
    handler: async (input, env) => {
      const product = await getProduct(input.productId, env);
      const copy = await generateContent({ type: 'description', product }, env);
      const seo = await generateContent({ type: 'seo_description', product }, env);
      return { description: copy, seo_description: seo };
    }
  },

  // Support
  search_orders: {
    description: 'Find an order by number, email, or customer name',
    input: { query: 'string' },
    handler: async (input, env) => {
      return proxyGraphQL(`{
        orders(first: 5, query: "${input.query}") {
          edges { node { id name financialStatus fulfillmentStatus customer { firstName lastName email } totalPriceSet { shopMoney { amount } } } }
        }
      }`, {}, env);
    }
  },
};
```
