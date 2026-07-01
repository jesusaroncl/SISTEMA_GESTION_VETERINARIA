/** Parsea "YYYY-MM-DD" como fecha local (evita desfases por UTC en JS). */
export function parseLocalDate(dateStr: string): Date {
  const [year, month, day] = dateStr.split("T")[0].split("-").map(Number)
  return new Date(year, month - 1, day)
}

/** Edad en años completos en una fecha de referencia (por defecto hoy). */
export function calculateAgeAtDate(
  birthDateStr: string | null | undefined,
  referenceDateStr?: string | null,
): number | null {
  if (!birthDateStr) return null

  const birth = parseLocalDate(birthDateStr)
  const reference = referenceDateStr ? parseLocalDate(referenceDateStr) : new Date()

  if (Number.isNaN(birth.getTime()) || Number.isNaN(reference.getTime())) return null

  let age = reference.getFullYear() - birth.getFullYear()
  const monthDiff = reference.getMonth() - birth.getMonth()
  if (monthDiff < 0 || (monthDiff === 0 && reference.getDate() < birth.getDate())) {
    age--
  }
  return age < 0 ? 0 : age
}

export function formatDateDDMMYYYY(dateStr: string): string {
  const d = parseLocalDate(dateStr)
  const day = String(d.getDate()).padStart(2, "0")
  const month = String(d.getMonth() + 1).padStart(2, "0")
  const year = d.getFullYear()
  return `${day}/${month}/${year}`
}
