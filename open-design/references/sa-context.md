# Open Design — South African Context

Open Design is materially better-fitted to South African design workflows than Claude Design on three axes: data protection (POPIA), cost (ZAR/USD FX exposure), and operational continuity (load-shedding).

## POPIA mapping

The Protection of Personal Information Act 4 of 2013 governs how South African organisations process personal information.

Two Conditions are directly relevant when designing client-facing assets that contain personal data — pitch decks with team headshots, dashboards with customer names, onboarding emails with leads:

### Condition 4 — Further Processing Limitation (s15)

Personal information collected for one purpose may not be further processed in a way "incompatible with the purpose for which it was originally collected" without consent or a statutory basis.

- **Claude Design**: Brief, brand assets, and uploaded customer data flow to Anthropic's US infrastructure for model inference. Anthropic's terms permit the data being used to improve services unless commercial-tier terms apply. This is a **further processing** event the responsible party must justify and (typically) consent.
- **Open Design**: With a local CLI (Claude Code, Codex, Cursor) the brief is processed by the same model the user already pays for under their existing terms — no new processing relationship. With **local Ollama**, the data never leaves the device at all. With BYOK to a SA-hosted vLLM (e.g. on a Hetzner SA Helsinki — wait, **Hetzner has no SA region**; use the closer Frankfurt POP or a local CSP for true in-country processing), processing remains under the responsible party's control.

### Condition 7 — Security Safeguards (s19)

The responsible party must "secure the integrity and confidentiality" of personal information by "appropriate, reasonable technical and organisational measures."

- **Open Design**'s daemon edge **blocks SSRF** to loopback/link-local/RFC1918 by default, credentials are stored at file mode `0600`, and the sandboxed `srcdoc` iframe isolates rendered artifacts. These are the kind of "technical measures" Condition 7 contemplates.
- **Cross-border transfers (s72)**: Claude Design = automatic transfer to the US. Open Design with local Ollama = no transfer. Open Design with a US BYOK provider = same transfer concern as Claude Design, so this advantage requires a SA/EU-hosted model provider to materialise.

### What to put in your DPIA / RoPA

If you're building a Records of Processing Activities entry for an OD-based design workflow:

- **Purpose**: Generation of design artifacts from briefs.
- **Categories of data subjects**: Whoever appears in briefs, brand assets, or sample content.
- **Categories of personal information**: Names, contact details, photos, and any embedded customer data.
- **Recipients**: The model provider(s) configured (named explicitly — Claude Code's terms, the BYOK proxy target, or local-only).
- **Cross-border transfers**: List the provider's processing region.
- **Security safeguards**: Local daemon, sandboxed iframe, BYOK secret storage at `0600`, SSRF guard.

## ZAR cost worked example

Rough costs for a 6-person design team, 2026-Q2:

| Tool | Per-seat USD | Per-seat ZAR @ R19/USD | Annual ZAR (6 seats) | FX risk |
|---|---|---|---|---|
| **Claude Pro** (lowest tier with Claude Design) | $20/mo | R380/mo | **R27,360** | Quarterly USD revaluation |
| **Claude Max 5×** | $100/mo | R1,900/mo | **R136,800** | Quarterly USD revaluation |
| **Claude Max 20×** | $200/mo | R3,800/mo | **R273,600** | Quarterly USD revaluation |
| **Open Design** (Apache-2.0) | $0 | R0 | **R0 + your existing CLI spend** | None for the tool itself |

If the team already pays for Claude Code (most do, in dev), the marginal cost of OD is **R0**. If the team uses local Ollama for design work, the cost is **electricity + the laptop**.

ZAR-spending teams should also remember:

- Claude pricing is set in USD; rand depreciation events (R19 → R20.50, as in 2024-Q4) are unbudgeted increases.
- Annual prepay options reduce FX risk only for the prepay window.
- VAT (15%) on imported digital services applies to Anthropic billing under SARS' digital-services rules.

## Load-shedding playbook

Eskom load-shedding stages 4–6 mean ~2.5–4.5 hours offline per cycle, sometimes back-to-back. UPS coverage of routers + laptops gets you internet for maybe 30–90 minutes; uplink to international peering points has its own resilience profile.

- **Claude Design**: requires uplink + Anthropic availability + Anthropic capacity. A stage-6 evening with a congested international peer = no design work.
- **Open Design + local CLI**: requires uplink only for the model API call. Workable on tethered LTE/5G during outages.
- **Open Design + local Ollama** (e.g. `qwen2.5-coder:32b` on a 32GB MacBook): requires zero internet. Charged laptop + 4 hours of stage-6 = a full design session done.

For Cape Town teams with the cleanest load-shedding patterns, a stage-4 day still allows a normal workday with **either** tool. Stage 6 is where OD's offline path earns its keep.

## Recommended SA stack

For a SA design agency or in-house team standardising on OD:

- **Daytime work**: Claude Code on PATH → OD spawns it → Opus 4.7 for hero artifacts, Sonnet 4.6 for iteration.
- **Load-shedding fallback**: Ollama with `qwen2.5-coder:32b` (or `llama-3.3:70b` if 64GB+) → BYOK proxy points at `http://localhost:11434/v1`.
- **POPIA-sensitive client work**: Force the local-Ollama path; document the choice in the project DPIA.
- **Hosted preview for stakeholders**: Cloudflare Pages deploy of OD's `index.html` (single-process prod build), with the BYOK proxy disabled and previews delivered as static HTML/PDF exports — keeps the artifact pipeline reviewable without exposing keys.
