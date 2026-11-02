function firstHeaderValue(value: string | null) {
  return value?.split(",")[0]?.trim() ?? ""
}

function normalizeOrigin(protocol: string, host: string) {
  const cleanProtocol = protocol.replace(/:$/, "")
  return cleanProtocol && host ? `${cleanProtocol}://${host}` : ""
}

export function allowedRequestOrigins(request: Request) {
  const url = new URL(request.url)
  const forwardedProto = firstHeaderValue(request.headers.get("x-forwarded-proto"))
  const protocol = forwardedProto || url.protocol.replace(/:$/, "")
  const host = firstHeaderValue(request.headers.get("host"))
  const forwardedHost = firstHeaderValue(request.headers.get("x-forwarded-host"))

  return new Set([
    url.origin,
    normalizeOrigin(protocol, host),
    normalizeOrigin(protocol, forwardedHost),
  ].filter(Boolean))
}

export function assertSameOrigin(request: Request) {
  const origin = request.headers.get("origin")?.trim()
  if (!origin || !allowedRequestOrigins(request).has(origin)) {
    throw new Error("La solicitud de carga no tiene un origen válido.")
  }
}
