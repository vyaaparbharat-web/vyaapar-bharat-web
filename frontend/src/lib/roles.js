export const ADMIN_ROLES = ["admin", "super_admin"];

// Where each kind of account lands after login
export function homeFor(user) {
  if (!user) return "/";
  if (ADMIN_ROLES.includes(user.role)) return "/admin/dashboard";
  if (user.role === "supplier") return "/supplier/dashboard";
  return "/buyer/dashboard";
}
