"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { CheckCircle2, AlertTriangle, AlertCircle, CalendarDays, Hash, Stethoscope, FileText } from "lucide-react"
import type { Evaluation } from "@/lib/types"

type EvaluationResultProps = {
  evaluation: Evaluation
  onFinish: () => void
}

type FilaTabla = {
  categoria: string
  rowspan: number
  grado: string
  descripcion: string
  resultadoKey: string
}

const TABLA_CLASIFICACION: FilaTabla[] = [
  { categoria: "Normal",               rowspan: 1, grado: "NaN", descripcion: "Ausencia del soplo cardíaco",                                         resultadoKey: "Normal" },
  { categoria: "Ligeramente audible",  rowspan: 2, grado: "I",   descripcion: "El soplo más tenue que puede escucharse con certeza",                  resultadoKey: "Ligeramente audible" },
  { categoria: "",                     rowspan: 0, grado: "II",  descripcion: "Soplo leve",                                                           resultadoKey: "Ligeramente audible" },
  { categoria: "Audible",              rowspan: 1, grado: "III", descripcion: "Soplo con intensidad moderada",                                        resultadoKey: "Audible" },
]

const ESTILOS: Record<string, { banner: string; badge: string; row: string; icon: React.ReactNode }> = {
  "Normal": {
    banner: "bg-green-50 border-green-200",
    badge:  "bg-green-100 text-green-800 border-green-300",
    row:    "bg-green-50 border-l-4 border-green-500",
    icon:   <CheckCircle2 className="h-6 w-6 text-green-600" />,
  },
  "Ligeramente audible": {
    banner: "bg-yellow-50 border-yellow-200",
    badge:  "bg-yellow-100 text-yellow-800 border-yellow-300",
    row:    "bg-yellow-50 border-l-4 border-yellow-500",
    icon:   <AlertCircle className="h-6 w-6 text-yellow-600" />,
  },
  "Audible": {
    banner: "bg-red-50 border-red-200",
    badge:  "bg-red-100 text-red-800 border-red-300",
    row:    "bg-red-50 border-l-4 border-red-500",
    icon:   <AlertTriangle className="h-6 w-6 text-red-600" />,
  },
}

function Campo({ icono, etiqueta, valor }: { icono: React.ReactNode; etiqueta: string; valor: React.ReactNode }) {
  return (
    <div className="flex items-start gap-3">
      <div className="mt-0.5 text-[#1793a5] shrink-0">{icono}</div>
      <div>
        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{etiqueta}</p>
        <div className="text-sm font-medium mt-0.5">{valor}</div>
      </div>
    </div>
  )
}

export function EvaluationResult({ evaluation, onFinish }: EvaluationResultProps) {
  const estilos = ESTILOS[evaluation.resultado] ?? ESTILOS["Normal"]

  return (
    <Card className="max-w-3xl mx-auto border-[#1793a5]/30 shadow-sm">
      {/* Encabezado */}
      <CardHeader className="bg-[#1793a5] rounded-t-lg px-6 py-5">
        <div className="flex items-center gap-3">
          <CheckCircle2 className="h-7 w-7 text-white shrink-0" />
          <div>
            <h2 className="text-xl font-bold text-white">Evaluación registrada exitosamente</h2>
            <p className="text-sm text-white/80 mt-0.5">
              {new Date(evaluation.fecha).toLocaleDateString("es-ES", { year: "numeric", month: "long", day: "numeric" })}
            </p>
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-6 space-y-6">

        {/* Metadatos */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pb-4 border-b">
          <Campo
            icono={<Hash className="h-4 w-4" />}
            etiqueta="ID de evaluación"
            valor={<span className="font-mono text-xs break-all">{evaluation.id}</span>}
          />
          <Campo
            icono={<CalendarDays className="h-4 w-4" />}
            etiqueta="Fecha de evaluación"
            valor={new Date(evaluation.fecha).toLocaleDateString("es-ES", { year: "numeric", month: "long", day: "numeric" })}
          />
        </div>

        {/* Banner de resultado */}
        <div className={`flex items-center gap-4 rounded-lg border px-5 py-4 ${estilos.banner}`}>
          {estilos.icon}
          <div className="flex-1">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-1">
              Resultado Machine Learning
            </p>
            <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-bold border ${estilos.badge}`}>
              {evaluation.resultado}
            </span>
          </div>
          {evaluation.gradoLevine && (
            <div className="text-right">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-1">Grado Levine</p>
              <span className="text-lg font-bold font-mono text-foreground">{evaluation.gradoLevine}</span>
            </div>
          )}
        </div>

        {/* Tabla de clasificación */}
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            <Stethoscope className="h-3.5 w-3.5" />
            Sistema de clasificación del soplo cardíaco
          </div>
          <div className="rounded-lg border border-[#1793a5]/30 overflow-hidden">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="bg-[#1793a5] text-white">
                  <th className="px-4 py-2.5 text-left font-semibold border-r border-white/20 w-1/4">Categoría</th>
                  <th className="px-4 py-2.5 text-center font-semibold border-r border-white/20 w-1/6">Grado Levine</th>
                  <th className="px-4 py-2.5 text-left font-semibold">Descripción</th>
                </tr>
              </thead>
              <tbody>
                {TABLA_CLASIFICACION.map((fila, idx) => {
                  const esDetectado = fila.resultadoKey === evaluation.resultado
                  const claseBase = esDetectado ? estilos.row : idx % 2 === 0 ? "bg-white" : "bg-gray-50"
                  return (
                    <tr key={idx} className={`${claseBase} border-t border-gray-200`}>
                      {fila.rowspan !== 0 && (
                        <td
                          rowSpan={fila.rowspan}
                          className={`px-4 py-2.5 border-r border-gray-200 align-middle ${esDetectado ? "font-bold" : "font-medium"}`}
                        >
                          {fila.categoria}
                          {esDetectado && <span className="ml-1 text-xs">◀</span>}
                        </td>
                      )}
                      <td className={`px-4 py-2.5 text-center border-r border-gray-200 font-mono ${esDetectado ? "font-bold" : ""}`}>
                        {fila.grado}
                      </td>
                      <td className={`px-4 py-2.5 ${esDetectado ? "font-medium" : ""}`}>
                        {fila.descripcion}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Comentarios clínicos */}
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            <FileText className="h-3.5 w-3.5" />
            Comentarios clínicos
          </div>
          <div className="bg-gray-50 border rounded-lg px-4 py-3">
            <p className="text-sm leading-relaxed text-foreground">{evaluation.comentarios}</p>
          </div>
        </div>

        {/* Tipo de evaluación */}
        <div className="flex items-center gap-2 text-sm text-muted-foreground border-t pt-4">
          <span>Tipo de evaluación:</span>
          <Badge variant="outline" className="border-[#1793a5] text-[#1793a5]">Soplo Cardíaco</Badge>
        </div>

        <Button
          onClick={onFinish}
          className="w-full bg-[#1793a5] hover:bg-[#126e80] text-white"
          size="lg"
        >
          Finalizar
        </Button>

      </CardContent>
    </Card>
  )
}
