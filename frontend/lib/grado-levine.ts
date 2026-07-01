export const GRADOS_DESCRIPCION: Record<string, string> = {
  AUSENTE: "Ausencia del soplo cardíaco",
  "I /VI": "Si es apenas audible y no se escuchó/presentó o no fue registrado en todas las ubicaciones de auscultación.",
  "II /VI": "Si es suave, pero fácilmente audible en todas las ubicaciones de auscultación.",
  "III /VI": "Si es moderadamente intenso o intenso.",
}

const MAPEO_CATEGORIA_A_GRADO: Record<string, string> = {
  Normal: "AUSENTE",
  "Ligeramente audible": "I /VI",
  Audible: "III /VI",
}

export function resolveGradoLevine(
  gradoLevine?: string | null,
  fallback?: string | null,
): string {
  for (const valor of [gradoLevine, fallback]) {
    if (!valor) continue
    if (GRADOS_DESCRIPCION[valor]) return valor
    if (MAPEO_CATEGORIA_A_GRADO[valor]) return MAPEO_CATEGORIA_A_GRADO[valor]
  }
  return "AUSENTE"
}

export function resolveDescripcionGrado(
  grado: string,
  descripcionGrado?: string | null,
): string {
  return descripcionGrado ?? GRADOS_DESCRIPCION[grado] ?? "—"
}

export const GRADO_ESTILOS: Record<string, { badge: string; banner?: string }> = {
  AUSENTE: { badge: "bg-green-100 text-green-800 border-green-300", banner: "bg-green-50 border-green-200" },
  "I /VI": { badge: "bg-yellow-100 text-yellow-800 border-yellow-300", banner: "bg-yellow-50 border-yellow-200" },
  "II /VI": { badge: "bg-amber-100 text-amber-800 border-amber-300", banner: "bg-amber-50 border-amber-200" },
  "III /VI": { badge: "bg-red-100 text-red-800 border-red-300", banner: "bg-red-50 border-red-200" },
}
