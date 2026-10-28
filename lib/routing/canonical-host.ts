export function canonicalWwwRedirect(host: string, pathname: string, search: string) {
  const normalizedHost = host.toLowerCase().split(":")[0]
  if (normalizedHost !== "www.dupez.uk") return null
  return `https://dupez.uk${pathname}${search}`
}
