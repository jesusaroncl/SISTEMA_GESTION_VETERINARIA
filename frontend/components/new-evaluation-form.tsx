"use client"

import type React from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft } from "lucide-react"
import type { EvaluationData } from "@/lib/types"

type NewEvaluationFormProps = {
  data: EvaluationData
  onBack: () => void
  onEvaluate: (data: EvaluationData) => void
}

// Filas de la tabla de clasificación — igual a TABLE I de la referencia clínica
type FilaClasificacion = {
  categoria: string
  rowspanCategoria: number   // cuántas filas ocupa la celda de categoría
  grado: string
  descripcion: string
  mlKey: string              // a qué resultado ML corresponde esta fila
}

const TABLA_CLASIFICACION: FilaClasificacion[] = [
  {
    categoria: "Normal",
    rowspanCategoria: 1,
    grado: "NaN",
    descripcion: "Ausencia del soplo cardíaco",
    mlKey: "Normal",
  },
  {
    categoria: "Ligeramente audible",
    rowspanCategoria: 2,
    grado: "I",
    descripcion: "El soplo más tenue que puede escucharse con certeza",
    mlKey: "Ligeramente audible",
  },
  {
    categoria: "",          // celda fusionada con la fila anterior
    rowspanCategoria: 0,
    grado: "II",
    descripcion: "Soplo leve",
    mlKey: "Ligeramente audible",
  },
  {
    categoria: "Audible",
    rowspanCategoria: 1,
    grado: "III",
    descripcion: "Soplo con intensidad moderada",
    mlKey: "Audible",
  },
]

const RESULTADO_ESTILOS: Record<string, { header: string; row: string; badge: string }> = {
  "Normal":               { header: "bg-green-100 text-green-800",  row: "bg-green-50 border-l-4 border-green-500",   badge: "bg-green-100 text-green-800 border-green-300" },
  "Ligeramente audible":  { header: "bg-yellow-100 text-yellow-800",row: "bg-yellow-50 border-l-4 border-yellow-500", badge: "bg-yellow-100 text-yellow-800 border-yellow-300" },
  "Audible":              { header: "bg-red-100 text-red-800",      row: "bg-red-50 border-l-4 border-red-500",       badge: "bg-red-100 text-red-800 border-red-300" },
}

export function NewEvaluationForm({ data, onBack, onEvaluate }: NewEvaluationFormProps) {
  const estilos = RESULTADO_ESTILOS[data.soploCardiaco] ?? RESULTADO_ESTILOS["Normal"]

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onEvaluate({
      ...data,
      esRiesgo: data.soploCardiaco !== "Normal",
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

          {/* Datos del paciente — solo lectura */}
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
                {data.edad}
              </div>
            </div>
          </div>

          {/* Tipo de evaluación + resultado destacado */}
          <div className="flex items-center justify-between bg-white border rounded-lg px-4 py-3">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <span className="font-medium text-foreground">Tipo de evaluación:</span>
              <Badge variant="outline" className="border-[#1793a5] text-[#1793a5]">Soplo Cardíaco</Badge>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <span className="font-medium text-muted-foreground">Resultado Machine Learning:</span>
              <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold border ${estilos.badge}`}>
                {data.soploCardiaco}
              </span>
            </div>
          </div>

          {/* Tabla de clasificación del soplo cardíaco */}
          <div className="space-y-2">
            <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Sistema de clasificación del soplo cardíaco
            </Label>
            <div className="rounded-lg border border-[#1793a5]/30 overflow-hidden bg-white">
              <table className="w-full text-sm border-collapse">
                <thead>
                  <tr className="bg-[#1793a5] text-white">
                    <th className="px-4 py-2.5 text-left font-semibold border-r border-[#1793a5]/40 w-1/4">
                      Categoría
                    </th>
                    <th className="px-4 py-2.5 text-center font-semibold border-r border-[#1793a5]/40 w-1/6">
                      Grado Levine
                    </th>
                    <th className="px-4 py-2.5 text-left font-semibold">
                      Descripción
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {TABLA_CLASIFICACION.map((fila, idx) => {
                    const esDetectado = fila.mlKey === data.soploCardiaco
                    const claseBase = esDetectado
                      ? estilos.row
                      : idx % 2 === 0 ? "bg-white" : "bg-gray-50"

                    return (
                      <tr key={idx} className={`${claseBase} border-t border-gray-200`}>
                        {/* Celda de categoría con rowspan simulado */}
                        {fila.rowspanCategoria !== 0 && (
                          <td
                            rowSpan={fila.rowspanCategoria}
                            className={`px-4 py-2.5 font-medium border-r border-gray-200 align-middle ${
                              esDetectado ? "font-bold" : ""
                            }`}
                          >
                            {fila.categoria}
                            {esDetectado && (
                              <span className="ml-1 text-xs align-middle">◀</span>
                            )}
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
            <p className="text-xs text-muted-foreground">
              La fila resaltada indica la clasificación detectada por la IA para este paciente.
            </p>
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
