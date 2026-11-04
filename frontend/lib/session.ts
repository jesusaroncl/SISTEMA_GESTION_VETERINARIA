export type UserRole = "administrador" | "asistente" | "veterinario"

export type SessionData = {
  access_token: string
  userRole: UserRole
  username: string
  clinicName: string
  clinicCount?: number
}

export type ClinicOption = { id: number; nombre: string; role: UserRole }

const SESSION_KEYS = ["access_token", "userRole", "username", "clinicName", "clinicCount"]

export const ROLE_LABELS: Record<UserRole, string> = {
  administrador: "Administrador",
  asistente: "Asistente administrativo",
  veterinario: "Veterinario",
}

/** Guarda la sesión de la clínica activa y devuelve la ruta del panel según el rol. */
export function saveSession(data: SessionData): string {
  localStorage.setItem("access_token", data.access_token)
  localStorage.setItem("userRole", data.userRole)
  localStorage.setItem("username", data.username)
  localStorage.setItem("clinicName", data.clinicName || "")
  localStorage.setItem("clinicCount", String(data.clinicCount ?? 1))
  return routeForRole(data.userRole)
}

export function clearSession() {
  SESSION_KEYS.forEach((k) => localStorage.removeItem(k))
}

export function routeForRole(role: UserRole): string {
  if (role === "administrador") return "/admin"
  if (role === "asistente") return "/asistente"
  return "/veterinario"
}
