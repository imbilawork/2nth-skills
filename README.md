# 2nth.ai Skills

Production-ready AI agent skills for ERP integration, reporting, automation, and data engineering.

**Browse the catalog:** [2nth-skills.pages.dev](https://2nth-skills.pages.dev)

## Install a skill

```bash
npx skills add imbilawork/2nth-skills@<skill-name>
```

Works with Claude Code, Cursor, Windsurf, Cline, and 30+ AI coding agents.

## Available Skills

| Skill | Description | Domain | Status |
|-------|-------------|--------|--------|
| [`sagex3-ai`](./sagex3-ai/) | Sage X3 ERP — GraphQL API, master data, reporting, AI integration | BIZ | Live |
| [`erpnext-furniture`](./erpnext-furniture/) | ERPNext — furniture manufacturing, BOMs, work orders, production, inventory | BIZ | Live |
| [`shopify-ai`](./shopify-ai/) | Shopify — Admin API, 6 role-based AI partners, MCP tools, content generation | BIZ | Live |
| [`twenty-crm-ai`](./public/skills/twenty-crm-ai.html) | Twenty CRM — GraphQL API, webhooks, MCP server, 6 agent patterns, Workers AI | BIZ | Live |
| [`twenty-crm-hosting`](./public/skills/twenty-crm-hosting.html) | Twenty CRM hosting — Railway + Cloudflare R2 + Zero Trust deployment guide | ENG | Live |
| [`cloudflare-containers`](./public/cloudflare/containers.html) | Cloudflare Containers — Docker on Workers + Durable Objects, 14-section deep dive | ENG | Live |
| [`bi-datawarehouse`](./bi-datawarehouse/) | Modern data stack — dimensional modeling, dbt, warehouse selection, semantic layer | DATA | Live |
| [`apache-superset`](./apache-superset/) | Apache Superset — deployment, RBAC, row-level security, embedding, performance | DATA | Live |

## Skill structure

Each skill is a directory at the repo root:

```
skill-name/
├── SKILL.md              # Main skill file (loaded by agents)
└── references/           # Supplementary reference docs
    ├── queries.md
    ├── reporting.md
    └── ai-integration.md
```

The `SKILL.md` frontmatter tells the skills CLI how to index and install:

```yaml
---
name: skill-name
description: |
  When to use this skill...
license: MIT
homepage: https://2nth-skills.pages.dev/skills/...
repository: https://github.com/imbilawork/2nth-skills
metadata:
  author: 2nth.ai
  version: "1.0.0"
  categories: "Category1, Category2"
---
```

## Adding a new skill

1. Create a directory: `my-skill/SKILL.md`
2. Add reference docs in `my-skill/references/` if needed
3. Add an explainer page in `public/skills/my-skill.html`
4. Update the card grid in `public/index.html`
5. Push — the catalog deploys automatically

## License

MIT
