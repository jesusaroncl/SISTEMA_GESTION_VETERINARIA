"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ArrowLeft } from "lucide-react"
import type { EvaluationData } from "@/lib/types"

type NewEvaluationFormProps = {
  data: EvaluationData
  onBack: () => void
  onEvaluate: (data: EvaluationData) => void
}

export function NewEvaluationForm({ data, onBack, onEvaluate }: NewEvaluationFormProps) {
  const [formData, setFormData] = useState<EvaluationData>(data)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onEvaluate(formData)
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
          <div className="space-y-2">
            <Label htmlFor="raza">Raza</Label>
            <Input
              id="raza"
              value={formData.raza}
              onChange={(e) => setFormData({ ...formData, raza: e.target.value })}
              required
              className="bg-white"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="edad">Edad</Label>
            <Input
              id="edad"
              type="number"
              value={formData.edad}
              onChange={(e) => setFormData({ ...formData, edad: Number.parseInt(e.target.value) })}
              required
              className="bg-white"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="prueba">Prueba médica</Label>
            <Select defaultValue="soplo">
              <SelectTrigger id="prueba" className="bg-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="soplo">Soplo cardiaco</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="soplo">Nivel</Label>
            <Input
              id="soplo"
              value={formData.soploCardiaco}
              onChange={(e) => setFormData({ ...formData, soploCardiaco: e.target.value })}
              required
              className="bg-white"
            />
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
              Evaluar
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
