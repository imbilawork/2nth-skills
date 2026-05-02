# Open Design vs Claude Design — Honest Comparison

## TL;DR decision

| You want… | Pick |
|---|---|
| Canva export, non-technical collaborators, slide-deck-heavy workflows | **Claude Design** |
| Web capture from a live site, refine-with-sliders UX | **Claude Design** |
| Design system reading from your codebase (auto-onboarding) | **Claude Design** |
| Closed-loop handoff to Claude Code with an Anthropic-blessed bundle | **Claude Design** |
| Free, Apache-2.0, no second subscription | **Open Design** |
| Local-first, BYOK, data sovereignty, POPIA-friendly | **Open Design** |
| Self-hosted on Hetzner / Cloudflare / a Vercel free tier | **Open Design** |
| Swap underlying model (DeepSeek, Groq, Ollama, vLLM) | **Open Design** |
| Live in your CLI; design lands in the same workspace as code | **Open Design** |
| Survives load-shedding | **Open Design** (with local Ollama) |

## Side-by-side

| Dimension | Claude Design | Open Design |
|---|---|---|
| **Released** | 2026-04-17 | 2026-04-28 |
| **License** | Proprietary, Anthropic Labs | Apache-2.0 (`skills/guizang-ppt/` retains MIT) |
| **Model** | Opus 4.7 (vendor-locked) | Whatever your CLI runs, or BYOK |
| **Hosting** | Anthropic-cloud only, `claude.ai/design` | Local-first; Vercel/Hetzner/Cloudflare deployable |
| **Distribution** | Web app, gated by Pro/Max/Team/Enterprise | `git clone` + `pnpm dev`, plus an Electron sibling (`open-codesign`) |
| **Pricing** | Bundled in Pro ($20), Max ($100/$200), Team, Enterprise | Free; you pay your CLI's API spend |
| **CLIs supported** | Claude Code only (handoff bundle) | 7 auto-detected: Claude Code, Codex, Cursor Agent, Gemini CLI, OpenCode, Qwen Code, Copilot CLI |
| **Skills** | Anthropic-curated, opaque | 19 in-repo, Apache-2.0, fork-and-author |
| **Design Systems** | Built from your codebase + design files at onboarding | 71 included (Linear, Stripe, Vercel, Tesla, …) + author your own `DESIGN.md` |
| **Self-critique** | Vendor-managed | 5-dimensional rubric in `src/prompts/discovery.ts`, sourced from `alchaincyf/huashu-design` |
| **Export** | URL, PDF, PPTX, Canva, HTML | HTML, PDF, PPTX, ZIP, Markdown |
| **Web capture** (grab elements from a live site) | Yes | No (use `WebFetch` from the agent side) |
| **Inline element comments / sliders** | Yes (refined UX) | Yes (open-codesign-style; OD borrows the pattern) |
| **Design-system auto-build from codebase** | Yes | No (manual `DESIGN.md` authoring) |
| **Handoff to coding tool** | Bundle → Claude Code, single-shot | The CLI **is** the tool; design lives in the same workspace |
| **Audit logs / admin reporting** | Roadmap (early) | None (run-it-yourself) |
| **Data residency** | US (Anthropic) | Wherever you put it |
| **Offline mode** | No | Yes, with local Ollama |
| **Maturity** | Research preview, large user base, Anthropic backing | 3 commits, ~80 stars, brand new, but architecturally complete |

## Where Claude Design is genuinely stronger

- **Web capture**: pulling elements directly from a live site is a real workflow win, especially for "make this look like our actual product." OD has nothing equivalent yet.
- **Design system from codebase**: Anthropic's onboarding reads your repo and builds a coherent system. OD requires manual `DESIGN.md` authoring (or import from `awesome-design-md`).
- **Refinement UX**: Sliders and inline comments are polished in Claude Design. OD's equivalent is younger.
- **Canva handoff**: Real value for marketing teams that already live in Canva.
- **Vendor accountability**: When Claude Design ships an update, an SLA-bound company is behind it.

## Where Open Design is genuinely stronger

- **Cost**: Free. The end. For SA teams with FX exposure, this matters disproportionately.
- **Sovereignty**: BYOK + local-first is a real POPIA / GDPR / sectoral-regulator advantage.
- **Lock-in**: Swap models without changing tools. Switch CLIs without changing skills.
- **Workflow integration**: The agent's filesystem **is** the project. There's no "now port this to code" step — the artifact is already code.
- **Forkability**: Skills, Design Systems, the daemon itself — fork everything.
- **Continuity**: No vendor can deprecate it.

## Where neither shines

- **Late-stage design**: both produce first-draft work. Neither replaces a senior designer for production polish.
- **Brand consistency at scale across many artifacts**: requires manual review either way.
- **Animation depth**: both produce shallow CSS animations. For motion graphics, hand off to Rive or After Effects.

## Hybrid pattern (what most SA teams actually want)

Use Claude Design for the **first 30 minutes** of exploration with non-technical stakeholders — the slider UX is genuinely faster for "what if it were warmer / what if the typography were heavier" conversations. Then export to HTML, drop into the Open Design workspace, and iterate to ship from there.

This costs you a Claude Pro seat for the design lead (R380/mo) and zero ZAR for the rest of the team's OD usage.

## Things to verify before quoting comparisons in client work

The Open Design ecosystem is moving weekly:

1. **Refresh the README**: skills count and design-systems count changes regularly.
2. **Re-fetch `src/prompts/discovery.ts`**: the 5-dimensional critique dimensions and threshold are not yet locked.
3. **Check `open-codesign` sibling project**: the v0.2 release with the agent-loop architecture lands "in about a week" per its README — when it ships, the comparison shifts again.
4. **Anthropic's Claude Design roadmap**: integrations API, MCP support, and audit logs are publicly committed. When they ship, the sovereignty gap narrows for some workloads.

Validation date for this skill: **2026-05-01**. Re-validate before any pitch deck or client deliverable that compares the two.
