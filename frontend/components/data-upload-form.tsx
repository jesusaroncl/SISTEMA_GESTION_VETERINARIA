"use client"

import type React from "react"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { ArrowLeft, Upload } from "lucide-react"
import type { UploadedData } from "@/lib/types"

type DataUploadFormProps = {
  onBack: () => void
  onProcess: (data: UploadedData) => void
}

export function DataUploadForm({ onBack, onProcess }: DataUploadFormProps) {
  const [soploCardiaco, setSoploCardiaco] = useState<File | null>(null)
  // const [radiografia, setRadiografia] = useState<File | null>(null) // <-- ELIMINAR

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!soploCardiaco) { // <-- ACTUALIZAR VALIDACIÓN
      alert("Por favor, suba el archivo de audio")
      return
    }
    // Solo pasamos el soplo cardiaco
    onProcess({ soploCardiaco }) 
  }

  return (
    <Card className="max-w-2xl mx-auto bg-[#d0e8ed] border-[#1793a5]">
      <CardHeader>
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={onBack}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <CardTitle className="text-2xl font-bold text-[#1793a5]">Carga de audio para la nueva evaluación</CardTitle>
        </div>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="soplo">Soplo Cardiaco (Audio)</Label>
            <div className="flex items-center gap-4">
              <Input
                id="soplo"
                type="file"
                // <-- ACTUALIZAR FORMATOS
                accept="audio/wav, audio/mpeg, .wav, .mp3" 
                onChange={(e) => setSoploCardiaco(e.target.files?.[0] || null)}
                className="flex-1 bg-white"
              />
              {soploCardiaco && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Upload className="h-4 w-4" />
                  {soploCardiaco.name}
                </div>
              )}
            </div>
            <p className="text-xs text-muted-foreground">Formatos aceptados: WAV, MP3</p>
          </div>

          <div className="flex gap-4 pt-4">
            <Button
              type="button"
              variant="destructive"
              onClick={onBack}
              className="flex-1 bg-red-600 hover:bg-red-700 text-white"
            >
              Cancelar
            </Button>
            <Button type="submit" className="flex-1 bg-[#7ececa] hover:bg-[#5eb5b0] text-white">
              Procesar Audio
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}