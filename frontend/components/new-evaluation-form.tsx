"use client"

import type React from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft } from "lucide-react"
import type { EvaluationData } from "@/lib/types"
import { GRADO_ESTILOS, resolveDescripcionGrado, resolveGradoLevine } from "@/lib/grado-levine"

type NewEvaluationFormProps = {
  data: EvaluationData
  onBack: () => void
  onEvaluate: (data: EvaluationData) => void
}

export function NewEvaluationForm({ data, onBack, onEvaluate }: NewEvaluationFormProps) {
  const grado = resolveGradoLevine(data.gradoLevine)
  const descripcion = resolveDescripcionGrado(grado, data.descripcionGrado)
  const estilos = GRADO_ESTILOS[grado] ?? GRADO_ESTILOS["AUSENTE"]

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onEvaluate({
      ...data,
      gradoLevine: grado,
      descripcionGrado: descripcion,
      esRiesgo: grado !== "AUSENTE",
    })
  }

  return (
    <Card className="max-w-3xl mx-auto bg-[#d0e8ed] border-[#1793a5]">
      <CardHeader>
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={onBack}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <CardTitle className="text-2xl font-bold text-[#1793a5]">Resultados del análisis</CardTitle>
            <p className="text-sm text-muted-foreground mt-1">Revise los resultados antes de confirmar</p>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-5">

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Raza
              </Label>
              <div className="bg-white border rounded-md px-3 py-2 text-sm font-medium">
                {data.raza}
              </div>
            </div>
            <div className="space-y-1">
              <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Edad (años)
              </Label>
              <div className="bg-white border rounded-md px-3 py-2 text-sm font-medium">
                {data.edad != null ? data.edad : "—"}
              </div>
            </div>
          </div>

          <div className="bg-white border rounded-lg px-4 py-3 space-y-3">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <span className="font-medium text-foreground">Tipo de evaluación:</span>
              <Badge variant="outline" className="border-[#1793a5] text-[#1793a5]">Soplo Cardíaco</Badge>
            </div>

            <div className="border-t pt-3 space-y-2">
              <div className="flex items-center justify-between gap-4">
                <span className="text-sm font-medium text-muted-foreground">Resultado:</span>
                <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-bold border font-mono ${estilos.badge}`}>
                  {grado}
                </span>
              </div>
              <p className="text-sm text-foreground leading-relaxed">
                {descripcion}
              </p>
            </div>

            {data.puntoAuscultacion && (
              <div className="flex items-center gap-2 text-sm border-t pt-2">
                <span className="font-medium text-muted-foreground">Punto de Auscultación:</span>
                <span className="font-semibold text-[#1793a5]">{data.puntoAuscultacion}</span>
              </div>
            )}
          </div>

          <div className="flex gap-4 pt-2">
            <Button
              type="button"
              variant="destructive"
              onClick={onBack}
              className="flex-1 bg-red-600 hover:bg-red-700 text-white"
            >
              Cancelar
            </Button>
            <Button type="submit" className="flex-1 bg-[#1793a5] hover:bg-[#126e80] text-white">
              Confirmar y guardar
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
