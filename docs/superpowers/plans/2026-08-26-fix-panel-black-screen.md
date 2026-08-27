# Fix Panel PWA Black Screen

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fix the black screen users see when opening the panel PWA on mobile devices.

**Architecture:** Two root causes: (1) RSC streaming responses return 500 for `/panel` and `/panel/cabanas`, and (2) the Next.js 500 error page renders near-black (`#0a0a0a`) when the user has `prefers-color-scheme: dark`. The fix adds proper error boundaries with light-themed fallbacks and a PWA version-check mechanism to force stale PWA updates.

**Tech Stack:** Next.js 15, Serwist 9.5.12 (PWA), Tailwind CSS v4, React Server Components

**Spec:** N/A (bug fix — investigation-based)

## Global Constraints

- Production URL: `https://dupez.uk` (public) / `https://panel.dupez.uk` (panel)
- Vercel project: `jorge-dlp-s-projects/caba-a-sierra`, auto-deploy from `main`
- Shell: `PATH="/usr/local/bin:$PATH"` for all node/pnpm commands
- PWA stack: `@serwist/turbopack` v9.5.12 + `serwist` v9.5.12
- Service worker: `app/sw.ts` → `/serwist/sw.js` (currently `defaultCache = NetworkOnly`)
- Manifest: `app/manifest.webmanifest/route.ts` (dynamic, detects `panel.*` host)
- CSS: Tailwind v4 with `@custom-variant dark (&:is(.dark *))` — dark mode is CLASS-based only, never auto-applied via `prefers-color-scheme`
- The root layout sets `colorScheme: 'light'` in viewport metadata

---

## Root Cause Analysis

1. **RSC 500 errors**: When navigating client-side to `/panel` or `/panel/cabanas`, the React Server Component streaming response (content-type `text/x-component`) returns HTTP 500. The initial HTML page-load (SSR) returns 200 and renders correctly, but client-side navigation (which uses RSC) fails. In PWA standalone mode, navigation is more likely to use client-side routing, hitting the 500.

2. **Next.js error page is BLACK in dark mode**: The 500 error page uses `@media (prefers-color-scheme: dark)` → `--next-error-bg: #0a0a0a`. On phones with dark mode enabled, the entire error page appears as a black screen — matching the user's report exactly.

3. **Stale PWA cache**: The user may have an older PWA installation. The `defaultCache` is `NetworkOnly` (no caching), so the service worker itself doesn't cause stale content. But the browser cache or old SW registration could.

## Fix Strategy

- **Task 1**: Add `app/panel/error.tsx` error boundary with a light-themed user-friendly error page (prevents the black Next.js default error page)
- **Task 2**: Investigate and fix the RSC 500 errors on `/panel` and `/panel/cabanas`
- **Task 3**: Add a PWA version-check mechanism that detects stale installations and forces update
- **Task 4**: Verify all fixes in production via Playwright

---

### Task 1: Add Panel Error Boundary

**Why:** When the RSC returns 500, Next.js shows its default error page which is black in dark mode. A custom `error.tsx` in the panel directory will catch this and show a branded, light-themed error page instead.

**Files:**
- Create: `app/panel/error.tsx`

**Steps:**

- [ ] **Step 1: Create the error boundary component**

```tsx
// app/panel/error.tsx
"use client"

import { useEffect } from "react"

export default function PanelError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error("Panel error:", error)
  }, [error])

  return (
    <div className="flex min-h-dvh items-center justify-center bg-background p-6">
      <div className="w-full max-w-sm text-center">
        <div className="mx-auto mb-4 flex size-12 items-center justify-center rounded-full bg-destructive/10">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-destructive">
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
        </div>
        <h1 className="text-lg font-semibold text-foreground">Algo salió mal</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Ocurrió un error al cargar el panel. Por favor intenta de nuevo.
        </p>
        <button
          onClick={() => reset()}
          className="mt-6 inline-flex h-10 items-center justify-center rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground hover:bg-primary/90"
        >
          Intentar de nuevo
        </button>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Verify the file exists and has correct imports**

Run: `ls -la app/panel/error.tsx`

- [ ] **Step 3: Commit**

```bash
git add app/panel/error.tsx
git commit -m "fix(panel): add light-themed error boundary for PWA black screen"
```

---

### Task 2: Investigate and Fix RSC 500 Errors

**Why:** The RSC streaming responses for `/panel` and `/panel/cabanas` return HTTP 500. This is the underlying trigger for the black screen. While the HTML SSR response succeeds (200), the RSC response (used for client-side navigation) fails.

**Context from investigation:**
- `/panel/promociones` returns RSC 200 ✓
- `/panel` returns RSC 500 ✗  
- `/panel/cabanas` returns RSC 500 ✗
- `/panel/cabanas/nueva` returns RSC 200 ✓
- All Supabase queries work fine with both `service_role` and user session
- `requirePanelSession()` works (layout renders, login redirect works)
- The 500 has no digest — it's a full HTML error page served as `text/x-component`

**Key difference:** Pages that go through `getAdminPanelData()` (dashboard) and pages that import from `@/components/panel/cabins-list.tsx` fail. Pages that import from `@/components/panel/promotions-list.tsx` succeed. Both `CabinsList` and `PromotionsList` are `"use client"` components.

**Files:**
- Read: `app/panel/page.tsx`
- Read: `app/panel/cabanas/page.tsx`
- Read: `lib/admin-panel-data.server.ts`
- Read: `lib/admin-cabins/repository.server.ts`
- Possibly modify: any file that causes the 500

**Steps:**

- [ ] **Step 1: Build locally and check for TypeScript/compilation errors**

```bash
PATH="/usr/local/bin:$PATH" pnpm build 2>&1 | tail -50
```

Check if there are any build errors related to panel pages.

- [ ] **Step 2: Test the dev server for more detailed error messages**

Start the dev server locally and navigate to `/panel` while logged in. Check the server console for the actual error stack trace. The production build might strip useful error info.

```bash
PATH="/usr/local/bin:$PATH" pnpm dev
```

Then in another terminal, use curl or a browser to check the error.

- [ ] **Step 3: Fix the identified issue**

The most likely causes (in order of probability):
1. An import chain issue — one of the modules imported by `CabinsList` or `AdminPanel` has a side-effect that fails during RSC serialization
2. A missing module or type error that only manifests in the RSC streaming context
3. An async component issue in the server component tree

- [ ] **Step 4: Commit the fix**

```bash
git add -A
git commit -m "fix(panel): resolve RSC 500 errors on dashboard and cabins pages"
```

---

### Task 3: Add PWA Version Check and Forced Update

**Why:** Even after deploying fixes, users with an old PWA installation will keep seeing the old (broken) version. We need a mechanism to detect stale PWAs and force them to update.

**Files:**
- Modify: `app/manifest.webmanifest/route.ts`
- Create: `components/pwa-version-check.tsx`
- Modify: `app/panel/layout.tsx` (or `app/layout.tsx`)

**Steps:**

- [ ] **Step 1: Add a version endpoint**

Modify `app/manifest.webmanifest/route.ts` to include a `version` field in the manifest, using the git commit SHA or build timestamp:

```ts
const buildVersion = process.env.VERCEL_GIT_COMMIT_SHA?.slice(0, 7) ?? process.env.NODE_ENV ?? "dev"
```

Add `version: buildVersion` to both manifest objects.

- [ ] **Step 2: Create a client-side version check component**

```tsx
// components/pwa-version-check.tsx
"use client"

import { useEffect, useRef } from "react"

const CHECK_INTERVAL_MS = 60 * 60 * 1000 // 1 hour

export function PwaVersionCheck() {
  const currentVersion = useRef<string | null>(null)

  useEffect(() => {
    async function check() {
      try {
        const res = await fetch("/manifest.webmanifest", { cache: "no-store" })
        const manifest = await res.json()
        const serverVersion = manifest.version
        if (!serverVersion) return

        if (currentVersion.current && currentVersion.current !== serverVersion) {
          // Version changed — update the service worker and reload
          if ("serviceWorker" in navigator) {
            const reg = await navigator.serviceWorker.getRegistration()
            if (reg) await reg.update()
          }
          window.location.reload()
          return
        }
        currentVersion.current = serverVersion
      } catch {
        // Silently ignore network errors
      }
    }

    check()
    const interval = setInterval(check, CHECK_INTERVAL_MS)
    return () => clearInterval(interval)
  }, [])

  return null
}
```

- [ ] **Step 3: Add the component to the panel layout**

Add `<PwaVersionCheck />` inside the `<PanelSessionProvider>` in `app/panel/layout.tsx`:

```tsx
import { PwaVersionCheck } from "@/components/pwa-version-check"

// In the render:
<PanelSessionProvider session={session}>
  <PwaVersionCheck />
  <CabinsProvider>
    <PromotionsProvider>{children}</PromotionsProvider>
  </CabinsProvider>
</PanelSessionProvider>
```

- [ ] **Step 4: Commit**

```bash
git add app/manifest.webmanifest/route.ts components/pwa-version-check.tsx app/panel/layout.tsx
git commit -m "feat(pwa): add version check to force update stale panel installations"
```

---

### Task 4: Verify Fixes in Production

**Why:** Ensure the panel loads correctly on mobile with dark mode, the error boundary shows a light page on failure, and the PWA version check works.

**Steps:**

- [ ] **Step 1: Wait for Vercel deployment to complete**

```bash
gh run list --limit 3  # or check Vercel dashboard
```

- [ ] **Step 2: Test panel loading with dark mode on mobile viewport**

```bash
PATH="/usr/local/bin:$PATH" node -e "
const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch();
  const ctx = await browser.newContext({ 
    viewport: { width: 390, height: 844 }, 
    colorScheme: 'dark', 
    isMobile: true 
  });
  const page = await ctx.newPage();
  
  // Login
  await page.goto('https://panel.dupez.uk/login', { waitUntil: 'networkidle', timeout: 15000 });
  await page.fill('input[name=\"email\"]', 'admin@dupez.uk');
  await page.fill('input[name=\"password\"]', 'Admin123456!!');
  await page.getByRole('button', { name: /iniciar|entrar|acceder/i }).first().click();
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(3000);
  
  console.log('URL:', page.url());
  console.log('Title:', await page.title());
  
  const bg = await page.evaluate(() => window.getComputedStyle(document.documentElement).backgroundColor);
  console.log('Background:', bg);
  
  // Check for error page
  const bodyText = await page.locator('body').textContent();
  console.log('Has error:', bodyText.includes('This page couldn'));
  console.log('Has dashboard:', bodyText.includes('Dashboard'));
  
  await browser.close();
})().catch(e => console.error('ERROR:', e.message));
"
```

Expected: URL is `/panel`, Title is "Panel DUPEZ — Administración", background is light, body has "Dashboard" text.

- [ ] **Step 3: Test the manifest version endpoint**

```bash
curl -s https://panel.dupez.uk/manifest.webmanifest | python3 -m json.tool | grep version
```

Expected: Shows a version string (git SHA or build env).

- [ ] **Step 4: Test error boundary by temporarily inducing an error**

Verify the error boundary works by checking that `app/panel/error.tsx` exists and renders a light-themed page. In practice, the RSC 500 fix (Task 2) should prevent this from showing, but it's the safety net.

- [ ] **Step 5: User instructions**

After deployment, tell the user to:
1. Open the Panel PWA on their phone
2. If it still shows black, delete the PWA from their home screen
3. Re-install it from `https://panel.dupez.uk` via Safari/Chrome "Add to Home Screen"
