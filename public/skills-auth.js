/**
 * 2nth Skills Hub — shared auth + tracking module
 *
 * Integrates skills.2nth.ai / skills-hub.2nth.ai with the 2nth beta platform:
 * - Loads session via cross-domain cookie (Domain=.2nth.ai)
 * - Injects auth bar into #auth-nav-slot
 * - Exposes window.__2nth_user and window.trackSkill()
 * - Handles membership tier gate display
 *
 * Usage: <script src="/skills-auth.js"></script> at end of body.
 */

(function () {
  const API = 'https://beta.2nth.ai';

  const PLAN_ORDER = { explorer: 0, starter: 1, designer: 2, builder: 3 };

  // ── Session load ────────────────────────────────────────────────────────────
  async function loadSession() {
    try {
      const res = await fetch(`${API}/api/auth/session`, { credentials: 'include' });
      const { user } = await res.json();
      window.__2nth_user = user ?? null;
    } catch {
      window.__2nth_user = null;
    }
    return window.__2nth_user;
  }

  // ── Auth bar injection ──────────────────────────────────────────────────────
  function injectAuthBar(user) {
    const slot = document.getElementById('auth-nav-slot');
    if (!slot) return;

    if (!user) {
      slot.innerHTML = `<a href="https://beta.2nth.ai/join.html" style="font-family:'JetBrains Mono',monospace;font-size:10px;letter-spacing:1px;text-transform:uppercase;background:#06b6d4;color:#0a0a0a;padding:5px 12px;border-radius:3px;font-weight:700;text-decoration:none">SIGN IN</a>`;
      return;
    }

    const initials = user.email.slice(0, 2).toUpperCase();
    const balFmt = user.token_balance >= 1_000_000
      ? (user.token_balance / 1_000_000).toFixed(1) + 'M'
      : user.token_balance >= 1000
        ? Math.round(user.token_balance / 1000) + 'K'
        : user.token_balance.toString();

    slot.innerHTML = `
      <div style="display:flex;align-items:center;gap:8px;position:relative">
        <span style="font-family:'JetBrains Mono',monospace;font-size:10px;color:#06b6d4;letter-spacing:.5px" title="${user.token_balance.toLocaleString()} tokens">${balFmt}</span>
        <span id="skills-plan-badge" style="font-family:'JetBrains Mono',monospace;font-size:9px;letter-spacing:1px;padding:2px 7px;border-radius:3px;border:1px solid">${user.plan.toUpperCase()}</span>
        <div id="skills-avatar" onclick="window.__toggleSkillsMenu()" style="width:30px;height:30px;border-radius:50%;background:rgba(6,182,212,.15);border:1px solid rgba(6,182,212,.3);display:flex;align-items:center;justify-content:center;font-family:'JetBrains Mono',monospace;font-size:11px;font-weight:700;color:#06b6d4;cursor:pointer">${initials}</div>
        <div id="skills-menu" style="display:none;position:absolute;top:38px;right:0;background:#1c1c1e;border:1px solid hsla(0,0%,100%,.1);border-radius:8px;padding:6px;min-width:180px;z-index:100">
          <div style="padding:8px 10px;font-size:11px;color:#71717a;border-bottom:1px solid hsla(0,0%,100%,.06);margin-bottom:4px;font-family:'JetBrains Mono',monospace;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${user.email}</div>
          <a href="https://beta.2nth.ai" style="display:block;padding:7px 10px;font-size:12px;color:#fafafa;text-decoration:none;border-radius:4px;transition:background .1s" onmouseover="this.style.background='#27272a'" onmouseout="this.style.background='none'">Dashboard</a>
          <a href="https://beta.2nth.ai/projects.html" style="display:block;padding:7px 10px;font-size:12px;color:#fafafa;text-decoration:none;border-radius:4px;transition:background .1s" onmouseover="this.style.background='#27272a'" onmouseout="this.style.background='none'">Projects</a>
          <a href="https://beta.2nth.ai/bill.html" style="display:block;padding:7px 10px;font-size:12px;color:#fafafa;text-decoration:none;border-radius:4px;transition:background .1s" onmouseover="this.style.background='#27272a'" onmouseout="this.style.background='none'">Upgrade plan</a>
          <div style="border-top:1px solid hsla(0,0%,100%,.06);margin-top:4px;padding-top:4px">
            <button onclick="window.__2nth_logout()" style="width:100%;text-align:left;background:none;border:none;cursor:pointer;color:#ef4444;padding:7px 10px;font-size:12px;border-radius:4px;font-family:'Barlow',sans-serif;transition:background .1s" onmouseover="this.style.background='#27272a'" onmouseout="this.style.background='none'">Sign out</button>
          </div>
        </div>
      </div>
    `;

    // Style plan badge
    const badge = document.getElementById('skills-plan-badge');
    if (badge) {
      const colors = {
        explorer: { bg: 'rgba(161,161,170,.1)', color: '#71717a', border: 'hsla(0,0%,100%,.08)' },
        starter:  { bg: 'rgba(16,185,129,.1)',  color: '#10b981', border: 'rgba(16,185,129,.25)' },
        designer: { bg: 'rgba(99,102,241,.1)',   color: '#818cf8', border: 'rgba(99,102,241,.25)' },
        builder:  { bg: 'rgba(245,158,11,.1)',   color: '#f59e0b', border: 'rgba(245,158,11,.25)' },
      };
      const c = colors[user.plan] ?? colors.explorer;
      badge.style.background = c.bg;
      badge.style.color = c.color;
      badge.style.borderColor = c.border;
    }

    document.addEventListener('click', e => {
      if (!e.target.closest('#skills-avatar') && !e.target.closest('#skills-menu')) {
        const menu = document.getElementById('skills-menu');
        if (menu) menu.style.display = 'none';
      }
    });
  }

  window.__toggleSkillsMenu = function () {
    const menu = document.getElementById('skills-menu');
    if (menu) menu.style.display = menu.style.display === 'none' ? 'block' : 'none';
  };

  window.__2nth_logout = async function () {
    await fetch(`${API}/api/auth/logout`, { method: 'POST', credentials: 'include' });
    window.__2nth_user = null;
    location.href = `${API}/join.html`;
  };

  // ── Tier gate ────────────────────────────────────────────────────────────────
  function applyTierGates() {
    const user = window.__2nth_user;
    const userTierLevel = PLAN_ORDER[user?.plan ?? 'explorer'] ?? 0;

    document.querySelectorAll('[data-tier]').forEach(el => {
      const required = el.getAttribute('data-tier');
      const requiredLevel = PLAN_ORDER[required] ?? 1;

      if (userTierLevel >= requiredLevel) return; // Access granted

      // Wrap in gate overlay
      el.style.position = 'relative';
      el.style.overflow = 'hidden';

      const gate = document.createElement('div');
      gate.className = 'tier-gate-overlay';
      gate.innerHTML = `
        <div style="text-align:center">
          <div style="font-family:'JetBrains Mono',monospace;font-size:10px;letter-spacing:1.5px;text-transform:uppercase;color:#f59e0b;margin-bottom:6px">${required.toUpperCase()}+ REQUIRED</div>
          <div style="font-size:13px;color:#a1a1aa;margin-bottom:12px;line-height:1.5">Unlock this skill on the ${required} plan</div>
          <a href="https://beta.2nth.ai/bill.html" onclick="trackSkill('skill_upgrade_prompted','${el.getAttribute('data-skill-name') ?? 'unknown'}',{required_tier:'${required}'})" style="font-family:'JetBrains Mono',monospace;font-size:10px;letter-spacing:1px;background:#06b6d4;color:#0a0a0a;padding:6px 16px;border-radius:3px;font-weight:700;text-decoration:none;display:inline-block">UPGRADE →</a>
        </div>
      `;
      gate.style.cssText = 'position:absolute;inset:0;background:rgba(10,10,10,.88);backdrop-filter:blur(3px);display:flex;align-items:center;justify-content:center;z-index:5;border-radius:inherit';
      el.appendChild(gate);
    });
  }

  // ── Skill tracking ───────────────────────────────────────────────────────────
  window.trackSkill = function (event, skillName, metadata = {}) {
    // Fire and forget — don't await
    fetch(`${API}/api/track/skill`, {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ event, skill_name: skillName, metadata }),
    }).catch(() => {}); // Silent fail
  };

  // ── Install command copy tracking ────────────────────────────────────────────
  function attachInstallTracking() {
    document.querySelectorAll('[data-skill-install]').forEach(el => {
      el.addEventListener('click', () => {
        const skillName = el.getAttribute('data-skill-name') ?? el.textContent?.trim() ?? 'unknown';
        trackSkill('skill_install_copied', skillName);
        // Copy to clipboard
        const cmd = el.textContent?.trim() ?? '';
        if (cmd) navigator.clipboard?.writeText(`npx @2nth/skills install ${cmd}`).catch(() => {});
      });
    });
  }

  // ── Catalog visited tracking ─────────────────────────────────────────────────
  function trackCatalogVisit() {
    trackSkill('skill_catalog_visited', 'catalog', {
      page: location.pathname,
      referrer: document.referrer || null,
    });
  }

  // ── Init ─────────────────────────────────────────────────────────────────────
  async function init() {
    const user = await loadSession();
    injectAuthBar(user);
    applyTierGates();
    attachInstallTracking();
    trackCatalogVisit();

    // Expose tier check helper for inline use
    window.__2nth_canAccess = function (requiredTier) {
      const userLevel = PLAN_ORDER[window.__2nth_user?.plan ?? 'explorer'] ?? 0;
      return userLevel >= (PLAN_ORDER[requiredTier] ?? 1);
    };
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
