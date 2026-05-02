---
name: open-design
description: Install, configure, and use Open Design — the open-source, Apache-2.0, local-first alternative to Anthropic's Claude Design (Anthropic Labs, released 2026-04-17, Opus 4.7). Open Design ships zero models. A local Node daemon auto-detects whichever coding-agent CLI you have on PATH (Claude Code, Codex CLI, Cursor Agent, Gemini CLI, OpenCode, Qwen Code, GitHub Copilot CLI) and turns it into a design engine driven by 19 composable Skills (web-prototype, saas-landing, dashboard, mobile-app, deck, gamified-app, social-carousel, magazine-poster, dating-web, sprite-animation, motion-frames, PM spec, eng runbook, finance report, HR onboarding, invoice, kanban, OKRs, weekly-update, meeting-notes) and 71 brand-grade Design Systems (Linear, Stripe, Vercel, Airbnb, Tesla, Notion, Anthropic, Apple, Cursor, Supabase, Figma, Spotify, Nike, Coinbase, Revolut, …). Includes an OpenAI-compatible BYOK proxy fallback for users with no CLI installed. Outputs sandboxed-iframe previews and exports HTML, PDF, PPTX, ZIP, Markdown. Runs a 5-dimensional self-critique on every artifact before emitting it. Use this skill whenever a developer asks about Open Design, Claude Design alternatives, open-source design tooling, self-hosted AI design, local-first design agents, BYOK design generation, agent-as-design-engine workflows, avoiding Claude Pro/Max subscriptions for design work, POPIA-friendly design tools, design tools that survive load-shedding, prompt-to-prototype without vendor lock-in, anti-AI-slop design harnesses, sandboxed-iframe artifact previews, prompt-to-PPTX/PDF/HTML pipelines, or comparisons of Claude Design vs open-source clones in ZAR pricing terms. Triggers on phrases like "Open Design", "Claude Design alternative", "open-source design tool", "self-hosted AI design", "local-first design", "BYOK design", "design without lock-in", "CLI as design engine", "no-subscription design AI", "POPIA design tool", "anti-slop harness", "agent design loop", "prompt to prototype", "5-dimensional critique", and "agent already on my laptop".
requires:
related: frontend-design, design/material-design-3, sa-construction-compliance
od:
  category: design
  scope: open-source-tooling
  sa_first: true
  upstream: https://github.com/nexu-io/open-design
  upstream_license: Apache-2.0
  validated_at: 2026-05-01
---

# Open Design

> Open-source, Apache-2.0, local-first alternative to Anthropic's Claude Design. Your existing coding-agent CLI becomes the design engine. No subscription. No cloud lock-in. Data stays on your laptop.

Open Design (**OD**, repo: `nexu-io/open-design`) is a web app + local Node daemon that turns any installed coding-agent CLI into a design engine for prototypes, decks, dashboards, mobile screens, marketing pages, and document templates. The daemon auto-detects Claude Code, Codex CLI, Cursor Agent, Gemini CLI, OpenCode, Qwen Code, or GitHub Copilot CLI on `PATH` and routes design work through whichever it finds. Users with no CLI fall back to the bundled OpenAI-compatible BYOK proxy.

OD was first published 2026-04-28, eleven days after Anthropic's Claude Design launch. It is young (3 commits, ~80 stars at validation time) but the architecture is sound and end-to-end working.

---

## When to use this skill

Use this skill when a developer or team is:

- Evaluating Open Design vs Claude Design and needs a grounded comparison.
- Trying to install or run OD locally (`pnpm dev`, daemon, sandboxed preview).
- Picking a Skill + Design System combo for a brief.
- Wiring OD's BYOK proxy to a non-Anthropic provider (DeepSeek, Groq, OpenRouter, self-hosted vLLM).
- Asking why Open Design is a better fit for **South African** workflows than Claude Design (POPIA, ZAR cost, load-shedding resilience).
- Building or contributing a new OD Skill or Design System.

If the request is generic ("design me a landing page"), this skill is **not** the right entry point — point them at `frontend-design` instead.

---

## Verified facts (use these numbers — not the LinkedIn-circulated ones)

The product has been over-described on social media. Stick to these:

| Claim | Verified value | Source |
|---|---|---|
| Skills built in | **19** | README (At a glance) |
| Design Systems built in | **71** (2 starters + 69 product systems) | README (At a glance) |
| Coding-agent CLIs auto-detected | **7** (Claude Code, Codex, Cursor Agent, Gemini CLI, OpenCode, Qwen Code, Copilot CLI) | README (Coding agents supported) |
| BYOK fallback | OpenAI-compatible proxy at `/api/proxy/stream` | README (Why this exists) |
| License | Apache-2.0 (top level); `skills/guizang-ppt/` retains its original MIT | LICENSE + README |
| Self-critique | 5-dimensional, sourced from `alchaincyf/huashu-design` | README (Why this exists) |
| Released | 2026-04-28 | Repo creation + commit history |
| Claude Design released | 2026-04-17 (Opus 4.7) | Anthropic Labs announcement |

**Numbers to NOT propagate** (commonly seen in social-media posts):

- ❌ "31 skills, 72 token libraries" — inflated; current shipping numbers are 19/71. The 31 figure mixes prototype + deck + roadmap; the 72 reshuffles the design-system count. The repo's own card image uses 19/71.
- ❌ "Pi / Hermes / Kimi CLIs supported" — present in the Chinese README and roadmap copy but **not** in the main English README's supported list. Treat as roadmap.
- ❌ "1,500+ / 7,100+ GitHub stars" — third-party hype. Direct repo fetch: ~80 stars, 9 forks, 3 commits at validation.
- ❌ "Scores below 3/5 trigger regeneration" — the 5-dimensional critique is real, but the specific numeric threshold and the dimension labels (philosophy / hierarchy / execution / specificity / restraint) need source-checking against `alchaincyf/huashu-design` before quoting them.

---

## Quickstart (3 commands)

```bash
git clone https://github.com/nexu-io/open-design
cd open-design
pnpm install && pnpm dev
```

The daemon starts on first run, scans `PATH` for a supported coding-agent CLI, and the web UI opens at `http://localhost:5173`. If no CLI is found, OD prompts for an OpenAI-compatible `baseUrl` + `apiKey` + `model` to use the BYOK proxy.

For deeper install/config notes — including BYOK proxy setup, namespace isolation, and the Windows-friendly stdin spawn workaround — read **`references/installation.md`**.

---

## What ships in the box

**19 Skills** (folders under `skills/`, each with `SKILL.md` + `assets/` + `example.html`):

- *Prototype mode*: `web-prototype`, `saas-landing`, `dashboard`, `mobile-app`, `gamified-app`, `social-carousel`, `magazine-poster`, `dating-web`, `sprite-animation`, `motion-frames`, `mobile-onboarding`, `email-marketing`, `digital-eguide`
- *Deck mode*: `guizang-ppt` (bundled verbatim from `op7418/guizang-ppt-skill`, MIT preserved)
- *Document templates*: `pm-spec`, `eng-runbook`, `finance-report`, `hr-onboarding`, `invoice`, `kanban-board`, `team-okrs`, `weekly-update`, `meeting-notes`

**71 Design Systems** (each a `DESIGN.md` covering color, typography, spacing, layout, components, motion, voice, brand identity, anti-patterns):

- *Starters*: `default` (Neutral Modern), `warm-editorial` (Warm Editorial)
- *AI / LLM*: claude, cohere, mistral-ai, minimax, together-ai, replicate, runwayml, elevenlabs, ollama, x-ai
- *Dev tools*: cursor, vercel, linear-app, framer, expo, clickhouse, mongodb, supabase, hashicorp, posthog, sentry, warp, webflow, sanity, mintlify, lovable, composio, opencode-ai, voltagent
- *Productivity*: notion, figma, miro, airtable, superhuman, intercom, zapier, cal, clay, raycast
- *Fintech*: stripe, coinbase, binance, kraken, mastercard, revolut, wise
- *E-commerce*: shopify, airbnb, uber, nike, starbucks, pinterest
- *Media / lifestyle*: spotify, playstation, wired, theverge, meta
- *Automotive*: tesla, bmw, ferrari, lamborghini, bugatti, renault
- *Other*: apple, ibm, nvidia, vodafone, resend, spacex

For full Skill picking guidance, read **`references/skills-and-design-systems.md`**.

---

## The five-dimensional self-critique

Before emitting an artifact, the agent runs a 5-dimensional self-check sourced from `alchaincyf/huashu-design`. The full prompt lives at `src/prompts/discovery.ts` in the repo. Two things worth knowing:

1. **The dimensions are real**; the exact labels and threshold popularly cited on LinkedIn ("philosophy / hierarchy / execution / specificity / restraint, scores below 3/5 regenerate") are **not yet verified** against the source — fetch `src/prompts/discovery.ts` directly before quoting them.
2. **It's a prompt-stack rubric, not a separate model.** Performance depends entirely on the underlying CLI's instruction-following — strong with Opus 4.7 / Sonnet 4.6 / Codex; weaker with smaller open models.

---

## South African context (first-class concerns)

OD is materially better for SA workflows than Claude Design on three axes. For full notes including a ZAR/USD FX cost worked example and POPIA mapping, read **`references/sa-context.md`**.

- **POPIA Conditions 4 (further processing) & 7 (security safeguards)**: BYOK + local-first means design briefs, brand assets, and intermediate artifacts never leave the device unless the user's chosen model provider requires it. With local Ollama, *nothing* leaves the device. Claude Design routes everything through Anthropic's US infrastructure.
- **ZAR cost**: Claude Design requires Pro (~USD $20/mo) or Max (~USD $100–$200/mo) — at current FX, roughly R380–R3,800/mo per seat with quarterly USD revaluation risk. OD is free under Apache-2.0; you pay only your CLI's API spend (which most teams already pay).
- **Load-shedding resilience**: OD with local Ollama runs through a stage-6 outage on a charged laptop. Claude Design needs uplink + Anthropic availability.

---

## Common pitfalls

- **No CLI on PATH**: OD silently falls back to the BYOK proxy. If the user expected Claude Code to drive it, double-check `which claude-code` resolves before booting.
- **Windows long-prompt argv**: Adapters that hit the 32 KB `CreateProcess` argv limit (Codex, Gemini, OpenCode, Cursor Agent, Qwen) route through stdin; Claude Code and Copilot keep `-p`. The daemon falls back to a temp prompt file when stdin overflows. Don't try to "fix" this by truncating prompts.
- **`OD_DATA_DIR` namespacing**: Running Playwright tests, a beta channel, and the user's real project against the same `OD_DATA_DIR` corrupts the SQLite. Use `--namespace` per profile.
- **`skills/guizang-ppt/` license**: This subdirectory is MIT, not Apache-2.0. Preserve its `LICENSE` and the `op7418` attribution in any fork.
- **The 5-dim critique is prompt-stack, not deterministic**: Don't promise customers regeneration semantics that depend on a specific underlying model.

---

## Comparison to Claude Design

For an honest, evenhanded comparison (when to pick which, where each is genuinely stronger, the handoff story, the Canva-export gap), read **`references/comparison-claude-design.md`**.

Short version: pick **Claude Design** if you need Canva export, you already pay for Pro/Max, your team is non-technical, and the design lives in a slide-deck-to-Canva pipeline. Pick **Open Design** if you live in your CLI, you don't want a second subscription, you have POPIA/data-sovereignty constraints, or you need the artifact to land directly inside a development workflow.

---

## References

- `references/installation.md` — install, daemon boot, BYOK proxy config, Windows spawn notes, namespacing.
- `references/skills-and-design-systems.md` — picking a Skill, picking a Design System, frontmatter conventions, authoring a new one.
- `references/sa-context.md` — POPIA mapping, ZAR cost worked example, load-shedding playbook, local-Ollama setup.
- `references/comparison-claude-design.md` — Claude Design vs Open Design honest comparison + decision tree.
