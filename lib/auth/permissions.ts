export type AdminRole = "admin" | "editor"

export type AdminPermission =
  | "catalog.read"
  | "catalog.write"
  | "catalog.publish"
  | "promotions.read"
  | "promotions.write"
  | "promotions.publish"
  | "owners.read_sensitive"
  | "content.delete"
  | "users.manage"
  | "settings.manage"
  | "audit.read"

const rolePermissions: Record<AdminRole, ReadonlySet<AdminPermission>> = {
  admin: new Set([
    "catalog.read", "catalog.write", "catalog.publish", "promotions.read", "promotions.write",
    "promotions.publish", "owners.read_sensitive", "content.delete", "users.manage", "settings.manage", "audit.read",
  ]),
  editor: new Set([
    "catalog.read", "catalog.write", "catalog.publish", "promotions.read", "promotions.write", "promotions.publish",
  ]),
}

export function hasPermission(role: AdminRole, permission: AdminPermission) {
  return rolePermissions[role].has(permission)
}
