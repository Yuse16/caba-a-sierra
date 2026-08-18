import { withSerwist } from "@serwist/turbopack"

const isDevelopment = process.env.NODE_ENV === "development"

function getSupabaseConnectSources() {
  const configuredUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim()
  if (!configuredUrl) return []

  try {
    const url = new URL(configuredUrl)
    const websocketProtocol = url.protocol === "https:" ? "wss:" : "ws:"
    return [url.origin, `${websocketProtocol}//${url.host}`]
  } catch {
    return []
  }
}

function getSupabaseImagePatterns() {
  const configuredUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim()
  if (!configuredUrl) return []
  try {
    const url = new URL(configuredUrl)
    return [{ protocol: url.protocol.replace(":", ""), hostname: url.hostname, port: url.port, pathname: "/storage/v1/object/public/**" }]
  } catch {
    return []
  }
}

function allowLocalSupabaseImages() {
  if (!isDevelopment) return false
  try {
    const hostname = new URL(process.env.NEXT_PUBLIC_SUPABASE_URL ?? "").hostname
    return hostname === "127.0.0.1" || hostname === "localhost"
  } catch {
    return false
  }
}

function contentSecurityPolicy() {
  const connectSources = [
    "'self'",
    ...getSupabaseConnectSources(),
    "https://*.vercel-insights.com",
    ...(isDevelopment ? ["http:", "https:", "ws:", "wss:"] : []),
  ]

  return [
    "default-src 'self'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'",
    "frame-src 'none'",
    "object-src 'none'",
    `script-src 'self' 'unsafe-inline' https://va.vercel-scripts.com${isDevelopment ? " 'unsafe-eval'" : ""}`,
    "script-src-attr 'none'",
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: blob: https:",
    "font-src 'self' data:",
    `connect-src ${connectSources.join(" ")}`,
    "media-src 'self' data: blob: https:",
    "worker-src 'self' blob:",
    "manifest-src 'self'",
    ...(!isDevelopment ? ["upgrade-insecure-requests"] : []),
  ].join("; ")
}

const nextConfig = {
  poweredByHeader: false,
  experimental: {
    serverActions: { bodySizeLimit: "8mb" },
  },
  turbopack: {
    root: process.cwd(),
  },
  images: {
    remotePatterns: getSupabaseImagePatterns(),
    dangerouslyAllowLocalIP: allowLocalSupabaseImages(),
  },
  async headers() {
    const securityHeaders = [
      { key: "Content-Security-Policy", value: contentSecurityPolicy() },
      { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
      { key: "Origin-Agent-Cluster", value: "?1" },
      { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), payment=()" },
      { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
      ...(!isDevelopment ? [{ key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" }] : []),
      { key: "X-Content-Type-Options", value: "nosniff" },
      { key: "X-Frame-Options", value: "DENY" },
    ]

    return [
      { source: "/:path*", headers: securityHeaders },
      { source: "/panel/:path*", headers: [{ key: "Cache-Control", value: "private, no-store, max-age=0" }] },
      { source: "/login", headers: [{ key: "Cache-Control", value: "private, no-store, max-age=0" }] },
      { source: "/recuperar-contrasena", headers: [{ key: "Cache-Control", value: "private, no-store, max-age=0" }] },
      { source: "/actualizar-contrasena", headers: [{ key: "Cache-Control", value: "private, no-store, max-age=0" }] },
    ]
  },
}

export default withSerwist(nextConfig)
