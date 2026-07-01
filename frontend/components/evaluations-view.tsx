// frontend/components/evaluations-view.tsx

"use client"

import { useState, useEffect, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { ArrowLeft, Plus } from "lucide-react"
import type { Evaluation, Dog } from "@/lib/types"
import { resolveDescripcionGrado, resolveGradoLevine } from "@/lib/grado-levine"
import { calculateAgeAtDate, formatDateDDMMYYYY } from "@/lib/date-utils"

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


  const getEdadAtEvaluation = (evaluation: Evaluation) => {
    if (evaluation.edadAtEvaluation != null) return evaluation.edadAtEvaluation
    return calculateAgeAtDate(dog.fechaNacimiento, evaluation.fecha)
  }

  const formatIdCorto = (id: string) => id.replace(/-/g, "").substring(0, 8).toUpperCase()

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
            <div className="rounded-md border border-[#1793a5]/30 overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent border-0">
                    <TableHead className="bg-[#1793a5] text-white font-bold uppercase text-xs tracking-wide whitespace-nowrap w-28 border-r border-white/20">
                      ID
                    </TableHead>
                    <TableHead className="bg-[#1793a5] text-white font-bold uppercase text-xs tracking-wide whitespace-nowrap w-32 border-r border-white/20">
                      Fecha
                    </TableHead>
                    <TableHead className="bg-[#1793a5] text-white font-bold uppercase text-xs tracking-wide whitespace-nowrap w-44 border-r border-white/20">
                      Tipo de Evaluación
                    </TableHead>
                    <TableHead className="bg-[#1793a5] text-white font-bold uppercase text-xs tracking-wide">
                      Resultado
                    </TableHead>
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
                    paginatedEvaluations.map((evaluation) => {
                      const edad = getEdadAtEvaluation(evaluation)
                      const grado = resolveGradoLevine(evaluation.gradoLevine, evaluation.resultado)
                      const descripcion = resolveDescripcionGrado(grado, evaluation.descripcionGrado).toLowerCase()
                      const edadTexto = edad !== null ? `${edad} años` : "edad desconocida"

                      return (
                        <TableRow key={evaluation.id} className="bg-white hover:bg-gray-50">
                          <TableCell className="font-mono text-sm font-medium text-foreground whitespace-nowrap">
                            {formatIdCorto(evaluation.id)}
                          </TableCell>
                          <TableCell className="whitespace-nowrap text-sm">
                            {formatDateDDMMYYYY(evaluation.fecha)}
                          </TableCell>
                          <TableCell className="whitespace-nowrap text-sm font-medium uppercase">
                            Soplo Cardíaco
                          </TableCell>
                          <TableCell className="whitespace-normal min-w-[320px]">
                            <p className="text-sm leading-relaxed text-foreground">
                              Paciente veterinario de{" "}
                              <span className="font-semibold text-red-600">{edadTexto}</span>
                              {" "}con el grado Levine{" "}
                              <span className="font-semibold text-red-600">{grado}</span>
                              {" "}que tiene como descripción{" "}
                              <span className="font-semibold text-red-600">{descripcion}</span>
                            </p>
                          </TableCell>
                        </TableRow>
                      )
                    })
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