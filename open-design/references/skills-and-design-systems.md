# Open Design — Skills & Design Systems

## Picking a Skill

Skills live under `skills/<name>/` and follow the Claude Code `SKILL.md` convention with an extended `od:` frontmatter (`mode`, `platform`, `scenario`, `preview`, `design_system`).

### By output surface

| User says… | Skill |
|---|---|
| "Landing page", "marketing site", "hero section" | `saas-landing` or `web-prototype` |
| "Dashboard", "admin panel", "internal tool" | `dashboard` |
| "Pricing page" | `web-prototype` (use the `pricing` direction) |
| "Mobile app", "iOS screens", "Android prototype" | `mobile-app` or `mobile-onboarding` |
| "Pitch deck", "investor deck", "magazine slides" | `guizang-ppt` |
| "Onboarding email", "marketing email", "newsletter" | `email-marketing` |
| "Social carousel", "Instagram slides", "LinkedIn carousel" | `social-carousel` |
| "Animated explainer", "looping motion frame" | `motion-frames` or `sprite-animation` |
| "Dating app screens" | `dating-web` |
| "Gamified app", "habit tracker", "quest UI" | `gamified-app` |
| "E-guide", "lead magnet PDF" | `digital-eguide` |

### By document/work-product

| Output | Skill |
|---|---|
| Product spec | `pm-spec` |
| Engineering runbook | `eng-runbook` |
| Finance / management report | `finance-report` |
| HR onboarding pack | `hr-onboarding` |
| Invoice | `invoice` |
| Kanban board snapshot | `kanban-board` |
| Team OKRs | `team-okrs` |
| Weekly update | `weekly-update` |
| Meeting notes | `meeting-notes` |

## Picking a Design System

Each Design System is a `DESIGN.md` covering color, typography, spacing, layout, components, motion, voice, brand identity, and anti-patterns. **Open Design injects the active Design System into the agent's prompt stack for every artifact** — so the system you pick is the single biggest visual lever.

### When the user has no brand

OD shows the **Direction Picker**: 5 curated visual schools, each with a deterministic OKLch palette + font stack:

1. **Editorial Monocle** — magazine-style, editorial typography, restrained palette.
2. **Modern Minimal** — Linear/Vercel/Notion school. Whites, soft grays, accent.
3. **Tech Utility** — Cursor/Supabase/Stripe school. High contrast, mono accents.
4. **Brutalist** — heavy weights, harsh contrast, deliberate ugliness.
5. **Soft Warm** — warm-editorial, lifestyle creator aesthetic.

One radio click → deterministic palette + font stack, **no model freestyle**. This is the anti-slop lever; respect it.

### When the user has a brand

Pick the matching product system from the 71 included. If your client's brand isn't in the catalog, contribute a `DESIGN.md` upstream (the format is documented in the repo's `CONTRIBUTING.md`) or fork into your own private design-systems folder.

## Frontmatter conventions

Every Skill `SKILL.md` declares:

```yaml
---
name: saas-landing
description: …
od:
  mode: prototype | deck | template
  platform: web | mobile | print
  scenario: marketing | internal-tool | onboarding | …
  preview: iframe | pdf | pptx
  design_system: default   # the fallback if user picks none
---
```

The daemon reads these fields, packs them into the agent's system prompt, and the agent reads the `assets/` and any `references/` files from the skill folder before writing code.

## Authoring a new Skill

Minimum viable Skill:

```
skills/my-new-skill/
├── SKILL.md
├── example.html      # the agent's "north star" output
└── assets/
    └── frames/...    # any shared device chrome, headers, etc.
```

Three rules:

1. **Ship a real `example.html`.** This is the agent's anchor; without it, output drifts.
2. **Pick one default Design System** in `od.design_system`. Don't leave it blank.
3. **Write the `description` for triggering.** Same discipline as 2nth catalog skills — verbose, keyword-rich, with synonyms. Include negative phrasing ("don't use this skill when…") if the surface overlaps with another.

## Authoring a new Design System

```
design-systems/my-brand/
└── DESIGN.md
```

The `DESIGN.md` covers, in this order: brand voice, color tokens (OKLch preferred), typography stack, spacing scale, layout grid, component library, motion principles, copy voice, anti-patterns. The repo's `awesome-design-md` import path is the reference shape; clone an existing system (e.g. `design-systems/linear-app/DESIGN.md`) as a starter.
