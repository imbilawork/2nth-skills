# Open Design — Installation & Configuration

## Prerequisites

- Node.js ≥ 20 LTS, pnpm ≥ 9 (the repo's lockfile is `pnpm-lock.yaml`).
- One of: Claude Code, Codex CLI, Cursor Agent, Gemini CLI, OpenCode, Qwen Code, or GitHub Copilot CLI on `PATH`. **Or** an OpenAI-compatible API key for the BYOK fallback.
- A modern Chromium-based browser for the sandboxed-iframe preview.

## Quickstart

```bash
git clone https://github.com/nexu-io/open-design
cd open-design
pnpm install
pnpm dev
```

The daemon starts on first run, scans `PATH`, and binds to a local socket under `/tmp/open-design/ipc/<namespace>/<app>.sock`. The Vite dev server opens at `http://localhost:5173`.

## Daemon boot order

1. Daemon scans `PATH` for supported CLIs.
2. Picks the **first match** in this priority: Claude Code → Codex CLI → Cursor Agent → Gemini CLI → OpenCode → Qwen Code → Copilot CLI.
3. If none found, daemon enters **BYOK proxy mode** and the UI surfaces the proxy config form.
4. Daemon registers a typed 5-field stamp (`app · mode · namespace · ipc · source`) so the desktop and web clients can find it.

To force a specific adapter, set:

```bash
OD_FORCE_AGENT=codex pnpm dev   # or claude-code, cursor-agent, gemini-cli, opencode, qwen-code, copilot-cli
```

## BYOK proxy configuration

The OpenAI-compatible proxy lives at `/api/proxy/stream`. Paste:

- `baseUrl` — e.g. `https://api.deepseek.com/v1`, `https://api.groq.com/openai/v1`, `https://openrouter.ai/api/v1`, your self-hosted vLLM URL.
- `apiKey` — vendor key, never logged, stored in `~/.config/open-design/config.toml` (mode 0600).
- `model` — vendor model ID.

The daemon edge **blocks SSRF** to loopback, link-local, and RFC1918 addresses. To allow a self-hosted vLLM on a LAN, set:

```bash
OD_PROXY_ALLOW_PRIVATE=1 pnpm dev
```

…with the security trade-off understood.

## Anthropic API fallback (no CLI)

If the user has an Anthropic API key but no Claude Code:

```bash
ANTHROPIC_API_KEY=sk-ant-... pnpm dev
```

The daemon uses the Anthropic API directly (via the OpenAI-compatible shim). Use `claude-opus-4-7` for design parity with Claude Design; `claude-sonnet-4-6` for cheaper iteration.

## Windows-specific: long-prompt spawn

Adapters that hit the 32 KB `CreateProcess` argv limit on Windows (Codex, Gemini, OpenCode, Cursor Agent, Qwen) **route through stdin** automatically. Claude Code and Copilot keep `-p`. When stdin overflows too, the daemon falls back to a **temp prompt file**.

**Don't truncate prompts to "fix" this** — the daemon's fallback chain is deliberate. If you see prompt truncation in output, check `OD_LOG_LEVEL=debug` for the actual spawn path.

## Namespace isolation

Running multiple OD instances against the same data directory will corrupt the SQLite. Always namespace:

```bash
OD_DATA_DIR=~/.od-prod  pnpm dev --namespace prod
OD_DATA_DIR=~/.od-test  pnpm dev --namespace test
OD_DATA_DIR=~/.od-beta  pnpm dev --namespace beta
```

This gives each profile its own `.od/`-style tree (sessions, history, SQLite, exports).

## Vercel / single-process production

For a hosted deployment (Vercel, Cloudflare Pages with Workers, Hetzner VPS):

```bash
pnpm build
npm start    # single-process prod
```

On Hetzner SA-friendly hosting, the daemon binds locally and the web app proxies to it. Vercel deploys are stateless — sessions live in the user's browser + the configured BYOK provider, not on the server.

## Verifying the install

```bash
pnpm tools-dev inspect daemon status
pnpm tools-dev inspect desktop status   # if running the Electron shell
```

Both should report `app=open-design mode=dev namespace=default ipc=/tmp/open-design/ipc/default/od.sock source=local`.
