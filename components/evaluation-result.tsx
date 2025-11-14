"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { CheckCircle2 } from "lucide-react"
import type { Evaluation } from "@/lib/types"

type EvaluationResultProps = {
  evaluation: Evaluation
  onFinish: () => void
}

export function EvaluationResult({ evaluation, onFinish }: EvaluationResultProps) {
  return (
    <Card className="max-w-2xl mx-auto">
      <CardHeader>
        <div className="flex items-center gap-4">
          <CheckCircle2 className="h-8 w-8 text-green-600" />
          <CardTitle className="text-2xl font-bold">Resultado de la Evaluación</CardTitle>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          <div className="space-y-2">
            <Label className="text-muted-foreground">ID de Evaluación</Label>
            <p className="text-lg font-semibold">{evaluation.id}</p>
          </div>

          <div className="space-y-2">
            <Label className="text-muted-foreground">Fecha de Evaluación</Label>
            <p className="text-lg">
              {new Date(evaluation.fecha).toLocaleDateString("es-ES", {
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </p>
          </div>

          <div className="space-y-2">
            <Label className="text-muted-foreground">Resultado</Label>
            <div>
              <span
                className={`inline-flex items-center px-4 py-2 rounded-lg text-base font-semibold ${
                  evaluation.resultado === "Normal"
                    ? "bg-green-100 text-green-800"
                    : evaluation.resultado === "Riesgo Moderado"
                      ? "bg-yellow-100 text-yellow-800"
                      : "bg-red-100 text-red-800"
                }`}
              >
                {evaluation.resultado}
              </span>
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-muted-foreground">Comentarios</Label>
            <div className="p-4 bg-muted rounded-lg">
              <p className="text-base leading-relaxed">{evaluation.comentarios}</p>
            </div>
          </div>

          <div className="pt-4">
            <Button onClick={onFinish} className="w-full" size="lg">
              Finalizar
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
