export function safePanelRedirect(value: FormDataEntryValue | string | null | undefined) {
  const target = typeof value === "string" ? value.trim() : ""
  if (!target.startsWith("/panel") || target.startsWith("//")) return "/panel"
  try {
    const parsed = new URL(target, "https://local.invalid")
    return parsed.origin === "https://local.invalid" && parsed.pathname.startsWith("/panel")
      ? `${parsed.pathname}${parsed.search}${parsed.hash}`
      : "/panel"
  } catch {
    return "/panel"
  }
}

const authCallbackDestinations = new Set(["/panel", "/actualizar-contrasena"])

export function safeAuthCallbackRedirect(value: string | null | undefined) {
  const target = typeof value === "string" ? value.trim() : ""
  if (!target.startsWith("/") || target.startsWith("//")) return "/panel"

  try {
    const parsed = new URL(target, "https://local.invalid")
    if (parsed.origin !== "https://local.invalid" || !authCallbackDestinations.has(parsed.pathname)) return "/panel"
    return `${parsed.pathname}${parsed.search}${parsed.hash}`
  } catch {
    return "/panel"
  }
}
