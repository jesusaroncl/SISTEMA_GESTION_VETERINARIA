"use client"

import type React from "react"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ArrowLeft, Upload, Stethoscope } from "lucide-react"
import type { UploadedData } from "@/lib/types"

const TIPOS_EVALUACION = [
  { value: "soplo_cardiaco", label: "Soplo Cardíaco" },
]

const PUNTO_MAP: Record<string, string> = {
  PV:  "PV - Válvula Pulmonar",
  TV:  "TV - Válvula Tricúspide",
  AV:  "AV - Válvula Aórtica",
  MV:  "MV - Válvula Mitral",
  PHC: "Phc - Otro lugar de auscultación",
}

function detectPunto(filename: string): string {
  const nameWithoutExt = filename.replace(/\.[^.]+$/, "")
  const upper = nameWithoutExt.toUpperCase()
  for (const [suffix, label] of Object.entries(PUNTO_MAP)) {
    if (
      upper === suffix ||
      upper.endsWith("_" + suffix) ||
      upper.endsWith("-" + suffix) ||
      upper.endsWith(" " + suffix) ||
      upper.endsWith(suffix)
    ) {
      return label
    }
  }
  return ""
}

type DataUploadFormProps = {
  onBack: () => void
  onProcess: (data: UploadedData) => void
}

export function DataUploadForm({ onBack, onProcess }: DataUploadFormProps) {
  const [tipoEvaluacion, setTipoEvaluacion] = useState<string>("")
  const [soploCardiaco, setSoploCardiaco] = useState<File | null>(null)
  const [puntoAuscultacion, setPuntoAuscultacion] = useState<string>("")

  const handleFileChange = (file: File | null) => {
    setSoploCardiaco(file)
    setPuntoAuscultacion(file ? detectPunto(file.name) : "")
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!tipoEvaluacion) {
      alert("Por favor, seleccione el tipo de evaluación")
      return
    }
    if (!soploCardiaco) {
      alert("Por favor, suba el archivo de audio")
      return
    }
    onProcess({ soploCardiaco, puntoAuscultacion: puntoAuscultacion || undefined })
  }

  return (
    <Card className="max-w-2xl mx-auto bg-[#d0e8ed] border-[#1793a5]">
      <CardHeader>
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={onBack}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <CardTitle className="text-2xl font-bold text-[#1793a5]">Nueva Evaluación</CardTitle>
        </div>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">

          {/* Paso 1: Tipo de evaluación */}
          <div className="space-y-2">
            <Label htmlFor="tipo-evaluacion" className="text-base font-semibold">
              Tipo de evaluación
            </Label>
            <Select value={tipoEvaluacion} onValueChange={setTipoEvaluacion}>
              <SelectTrigger id="tipo-evaluacion" className="bg-white">
                <SelectValue placeholder="Seleccione el tipo de evaluación..." />
              </SelectTrigger>
              <SelectContent>
                {TIPOS_EVALUACION.map((tipo) => (
                  <SelectItem key={tipo.value} value={tipo.value}>
                    <div className="flex items-center gap-2">
                      <Stethoscope className="h-4 w-4 text-[#1793a5]" />
                      {tipo.label}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Paso 2: Subida de audio (visible solo cuando se seleccionó un tipo) */}
          {tipoEvaluacion && (
            <div className="space-y-2 border-t border-[#1793a5]/20 pt-4">
              <Label htmlFor="soplo" className="text-base font-semibold">
                Archivo de audio — {TIPOS_EVALUACION.find(t => t.value === tipoEvaluacion)?.label}
              </Label>
              <div className="flex flex-col gap-2">
                <Input
                  id="soplo"
                  type="file"
                  accept="audio/wav, audio/mpeg, .wav, .mp3"
                  onChange={(e) => handleFileChange(e.target.files?.[0] || null)}
                  className="bg-white"
                />
                {soploCardiaco && (
                  <div className="flex items-center gap-2 text-sm text-[#1793a5] font-medium">
                    <Upload className="h-4 w-4" />
                    {soploCardiaco.name}
                  </div>
                )}
                {soploCardiaco && (
                  <div className="space-y-1 pt-1">
                    <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                      Punto de Auscultación
                    </Label>
                    <div className={`border rounded-md px-3 py-2 text-sm font-medium ${puntoAuscultacion ? "bg-blue-50 border-[#1793a5] text-[#1793a5]" : "bg-gray-100 text-muted-foreground"}`}>
                      {puntoAuscultacion || "No identificado (sufijo no reconocido)"}
                    </div>
                  </div>
                )}
              </div>
              <p className="text-xs text-muted-foreground">Formatos aceptados: WAV, MP3</p>
            </div>
          )}

          <div className="flex gap-4 pt-2">
            <Button
              type="button"
              variant="destructive"
              onClick={onBack}
              className="flex-1 bg-red-600 hover:bg-red-700 text-white"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={!tipoEvaluacion || !soploCardiaco}
              className="flex-1 bg-[#1793a5] hover:bg-[#126e80] text-white disabled:opacity-50"
            >
              Procesar Audio
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}