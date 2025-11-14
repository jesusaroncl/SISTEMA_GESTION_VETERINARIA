"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { ArrowLeft, Plus } from "lucide-react"
import type { Evaluation, Dog } from "@/lib/types"

// Datos de ejemplo
const mockEvaluations: Evaluation[] = [
  {
    id: "EV001",
    dogId: "1",
    fecha: "2024-01-15",
    resultado: "Normal",
    comentarios: "Paciente en buen estado general. Sin signos de enfermedad cardiaca.",
  },
  {
    id: "EV002",
    dogId: "1",
    fecha: "2024-03-20",
    resultado: "Riesgo Moderado",
    comentarios: "Se detectó soplo cardiaco leve. Requiere seguimiento en 3 meses.",
  },
  {
    id: "EV003",
    dogId: "2",
    fecha: "2024-02-10",
    resultado: "Normal",
    comentarios: "Evaluación cardiaca sin hallazgos significativos.",
  },
]

type EvaluationsViewProps = {
  dog: Dog
  onBack: () => void
  onNewEvaluation: () => void
}

export function EvaluationsView({ dog, onBack, onNewEvaluation }: EvaluationsViewProps) {
  const [evaluations] = useState<Evaluation[]>(mockEvaluations.filter((ev) => ev.dogId === dog.id))
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 10

  const totalPages = Math.ceil(evaluations.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const paginatedEvaluations = evaluations.slice(startIndex, startIndex + itemsPerPage)

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={onBack}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex-1">
            <CardTitle className="text-2xl font-bold">Evaluaciones de {dog.nombre}</CardTitle>
            <p className="text-sm text-muted-foreground mt-1">
              Raza: {dog.raza} | Sexo: {dog.sexo}
            </p>
          </div>
          <Button onClick={onNewEvaluation} className="gap-2">
            <Plus className="h-4 w-4" />
            Nueva Evaluación
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ID</TableHead>
                <TableHead>Fecha de Evaluación</TableHead>
                <TableHead>Resultado</TableHead>
                <TableHead>Comentarios</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedEvaluations.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center text-muted-foreground py-8">
                    No hay evaluaciones registradas
                  </TableCell>
                </TableRow>
              ) : (
                paginatedEvaluations.map((evaluation) => (
                  <TableRow key={evaluation.id}>
                    <TableCell className="font-medium">{evaluation.id}</TableCell>
                    <TableCell>{new Date(evaluation.fecha).toLocaleDateString("es-ES")}</TableCell>
                    <TableCell>
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          evaluation.resultado === "Normal"
                            ? "bg-green-100 text-green-800"
                            : evaluation.resultado === "Riesgo Moderado"
                              ? "bg-yellow-100 text-yellow-800"
                              : "bg-red-100 text-red-800"
                        }`}
                      >
                        {evaluation.resultado}
                      </span>
                    </TableCell>
                    <TableCell className="max-w-md">{evaluation.comentarios}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        {totalPages > 1 && (
          <div className="flex items-center justify-between mt-4">
            <p className="text-sm text-muted-foreground">
              Mostrando {startIndex + 1} a {Math.min(startIndex + itemsPerPage, evaluations.length)} de{" "}
              {evaluations.length} registros
            </p>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
              >
                Anterior
              </Button>
              <div className="flex items-center gap-1">
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                  <Button
                    key={page}
                    variant={currentPage === page ? "default" : "outline"}
                    size="sm"
                    onClick={() => setCurrentPage(page)}
                    className="w-8"
                  >
                    {page}
                  </Button>
                ))}
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
              >
                Siguiente
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
