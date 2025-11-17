// frontend/components/evaluations-view.tsx

"use client"

import { useState, useEffect, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { ArrowLeft, Plus } from "lucide-react"
import type { Evaluation, Dog } from "@/lib/types"

// Definir URL de la API
const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

type EvaluationsViewProps = {
  dog: Dog
  onBack: () => void
  onNewEvaluation: () => void
}

export function EvaluationsView({ dog, onBack, onNewEvaluation }: EvaluationsViewProps) {
  // Estado de carga y datos
  const [evaluations, setEvaluations] = useState<Evaluation[]>([])
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 10

  const getAuthToken = () => {
    return typeof window !== "undefined" ? localStorage.getItem("access_token") : null
  }

  // Función para cargar las evaluaciones
  const fetchEvaluations = useCallback(async () => {
      setLoading(true);
      setError(null);
      const token = getAuthToken();
      if (!token) {
          setError("No autenticado");
          setLoading(false);
          return;
      }
      
      try {
          // Usar la nueva ruta GET
          const response = await fetch(`${API_BASE_URL}/api/dogs/${dog.id}/evaluations`, {
              headers: { "Authorization": `Bearer ${token}` }
          });
          if (!response.ok) {
              const data = await response.json();
              throw new Error(data.msg || "Error al cargar evaluaciones");
          }
          const data = await response.json();
          setEvaluations(data as Evaluation[]);
      } catch (e) {
          setError(e instanceof Error ? e.message : "Error desconocido");
      } finally {
          setLoading(false);
      }
  }, [dog.id]); // Se ejecuta si el ID del perro cambia

  // Cargar datos al montar el componente
  useEffect(() => {
      fetchEvaluations();
  }, [fetchEvaluations]);


  const totalPages = Math.ceil(evaluations.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const paginatedEvaluations = evaluations.slice(startIndex, startIndex + itemsPerPage)

  return (
    <Card>
      <CardHeader>
        {/* --- INICIO: SECCIÓN DE ENCABEZADO --- */}
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={onBack}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex-1">
            <CardTitle className="text-2xl font-bold">Evaluaciones de {dog.nombre}</CardTitle>
            <p className="text-sm text-muted-foreground mt-1">
              Raza: {dog.raza} | Especie: {dog.especie} | Sexo: {dog.sexo}
            </p>
          </div>
          <Button onClick={onNewEvaluation} className="gap-2">
            <Plus className="h-4 w-4" />
            Nueva Evaluación
          </Button>
        </div>
        {/* --- FIN: SECCIÓN DE ENCABEZADO --- */}
      </CardHeader>
      <CardContent>
        
        {/* Manejo de Carga y Error */}
        {loading && (
            <div className="text-center py-8 text-muted-foreground">Cargando historial de evaluaciones...</div>
        )}
        {error && (
            <div className="text-center py-8 text-destructive">Error: {error}</div>
        )}

        {!loading && !error && (
          <>
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
                        {/* Acortar el UUID para visualización */}
                        <TableCell className="font-medium">{evaluation.id.substring(0, 8)}...</TableCell> 
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
                        {/* Usar 'whitespace-pre-wrap' para respetar saltos de línea en comentarios */}
                        <TableCell className="max-w-md whitespace-pre-wrap">{evaluation.comentarios}</TableCell> 
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>

            {/* --- INICIO: SECCIÓN DE PAGINACIÓN --- */}
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
            {/* --- FIN: SECCIÓN DE PAGINACIÓN --- */}
          </>
        )}
      </CardContent>
    </Card>
  )
}