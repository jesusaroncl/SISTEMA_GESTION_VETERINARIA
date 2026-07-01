"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { CheckCircle2, AlertTriangle, AlertCircle, CalendarDays, Hash, FileText } from "lucide-react"
import type { Evaluation } from "@/lib/types"
import { GRADO_ESTILOS, resolveDescripcionGrado, resolveGradoLevine } from "@/lib/grado-levine"

type EvaluationResultProps = {
  evaluation: Evaluation
  onFinish: () => void
}

const GRADO_ICONOS: Record<string, React.ReactNode> = {
  AUSENTE: <CheckCircle2 className="h-6 w-6 text-green-600" />,
  "I /VI": <AlertCircle className="h-6 w-6 text-yellow-600" />,
  "II /VI": <AlertCircle className="h-6 w-6 text-amber-600" />,
  "III /VI": <AlertTriangle className="h-6 w-6 text-red-600" />,
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
  const grado = resolveGradoLevine(evaluation.gradoLevine, evaluation.resultado)
  const descripcion = resolveDescripcionGrado(grado, evaluation.descripcionGrado)
  const estilos = GRADO_ESTILOS[grado] ?? GRADO_ESTILOS["AUSENTE"]
  const icono = GRADO_ICONOS[grado] ?? GRADO_ICONOS["AUSENTE"]

  return (
    <Card className="max-w-3xl mx-auto border-[#1793a5]/30 shadow-sm">
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

        <div className={`rounded-lg border px-5 py-4 space-y-3 ${estilos.banner}`}>
          <div className="flex items-start gap-4">
            {icono}
            <div className="flex-1 space-y-2">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-1">
                  Resultado
                </p>
                <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-bold border font-mono ${estilos.badge}`}>
                  {grado}
                </span>
              </div>
              <p className="text-sm leading-relaxed text-foreground">
                {descripcion}
              </p>
            </div>
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            <FileText className="h-3.5 w-3.5" />
            Comentarios clínicos
          </div>
          <div className="bg-gray-50 border rounded-lg px-4 py-3">
            <p className="text-sm leading-relaxed text-foreground">{evaluation.comentarios}</p>
          </div>
        </div>

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
