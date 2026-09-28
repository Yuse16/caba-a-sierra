/// <reference lib="esnext" />
/// <reference lib="webworker" />
import { defaultCache } from "@serwist/turbopack/worker"
import type { PrecacheEntry, SerwistGlobalConfig } from "serwist"
import { NetworkOnly, Serwist } from "serwist"

declare global {
  interface WorkerGlobalScope extends SerwistGlobalConfig {
    __SW_MANIFEST: (PrecacheEntry | string)[] | undefined
  }
}

declare const self: ServiceWorkerGlobalScope

// Only immutable public assets may survive a session. HTML, RSC, auth,
// server actions, APIs and Supabase data always go to the network.
function publicAsset(url: URL) {
  return url.origin === self.location.origin && (
    url.pathname.startsWith("/_next/static/") ||
    /^\/(?:cabins|brand|icons)\/[^?]+\.(?:png|jpe?g|webp|svg|ico|woff2?)$/i.test(url.pathname)
  )
}

self.addEventListener("activate", (event) => {
  event.waitUntil((async () => {
    for (const name of await caches.keys()) {
      const cache = await caches.open(name)
      for (const request of await cache.keys()) {
        if (!publicAsset(new URL(request.url))) await cache.delete(request)
      }
    }
  })())
})

const serwist = new Serwist({
  precacheEntries: self.__SW_MANIFEST?.filter((entry) => publicAsset(new URL(typeof entry === "string" ? entry : entry.url, self.location.origin))),
  skipWaiting: true,
  clientsClaim: true,
  navigationPreload: true,
  runtimeCaching: [
    { matcher: ({ url }) => !publicAsset(url), handler: new NetworkOnly() },
    ...defaultCache,
  ],
})

serwist.addEventListeners()
