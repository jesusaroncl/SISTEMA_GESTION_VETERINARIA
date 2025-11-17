"use client"

import { useState, useMemo, useEffect, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Search, Plus, Edit, Trash2, FileText } from "lucide-react"
import type { Dog } from "@/lib/types"

const API_BASE_URL = "http://127.0.0.1:5000"

type DogsTableProps = {
  ownerId: string
  role: "asistente" | "veterinario"
  // Callbacks opcionales según el rol
  onNewDog?: () => void
  onEditDog?: (dog: Dog) => void
  onViewEvaluations?: (dog: Dog) => void
}

export function DogsTable({ 
  ownerId, 
  role, 
  onNewDog, 
  onEditDog, 
  onViewEvaluations 
}: DogsTableProps) {
  
  // Estado para los perros, carga y error
  const [dogs, setDogs] = useState<Dog[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  const [searchTerm, setSearchTerm] = useState("")
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 10

  const getAuthToken = () => {
    return typeof window !== "undefined" ? localStorage.getItem("access_token") : null
  }

  // Cargar perros del propietario
  const fetchDogs = useCallback(async () => {
    setLoading(true)
    setError(null)
    const token = getAuthToken()
    if (!token) {
        setError("Error de autenticación");
        setLoading(false);
        return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/api/owners/${ownerId}/dogs`, {
        headers: { "Authorization": `Bearer ${token}` }
      })
      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.msg || "Fallo al cargar los perros.");
      }
      const data = await response.json()
      setDogs(data as Dog[])
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error desconocido");
    } finally {
      setLoading(false)
    }
  }, [ownerId])

  useEffect(() => {
    fetchDogs()
  }, [fetchDogs])

  // Calcular edad
  const calculateAge = (birthDate: string) => {
    if (!birthDate) return "N/A";
    const today = new Date()
    const birth = new Date(birthDate)
    let age = today.getFullYear() - birth.getFullYear()
    const monthDiff = today.getMonth() - birth.getMonth()
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--
    }
    return age < 0 ? 0 : age
  }

  const filteredDogs = useMemo(() => {
    return dogs.filter(
      (dog) =>
        dog.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
        dog.raza.toLowerCase().includes(searchTerm.toLowerCase()),
    )
  }, [dogs, searchTerm])

  const totalPages = Math.ceil(filteredDogs.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const paginatedDogs = filteredDogs.slice(startIndex, startIndex + itemsPerPage)

  // Eliminar (solo para asistente)
  const handleDelete = async (id: string) => {
    if (confirm("¿Está seguro de eliminar este perro?")) {
      const token = getAuthToken()
      if (!token) {
          alert("Error de autenticación");
          return;
      }
      try {
        const response = await fetch(`${API_BASE_URL}/api/dogs/${id}`, {
            method: "DELETE",
            headers: { "Authorization": `Bearer ${token}` }
        });
        if (!response.ok) {
          const data = await response.json();
          throw new Error(data.msg || "Error al eliminar");
        }
        
        fetchDogs(); // Recargar la lista
      } catch (e) {
        alert(e instanceof Error ? e.message : "Error al eliminar el perro.");
      }
    }
  }

  // Renderizado
  if (loading) return <p className="text-center py-8">Cargando perros...</p>
  if (error) return <p className="text-center py-8 text-destructive">Error: {error}</p>

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por nombre o raza..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value)
              setCurrentPage(1)
            }}
            className="pl-10"
          />
        </div>
        
        {/* --- Renderizado Condicional del Botón "Nuevo" --- */}
        {role === 'asistente' && (
            <Button onClick={onNewDog} className="gap-2">
                <Plus className="h-4 w-4" />
                Nuevo Registro
            </Button>
        )}
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nombre</TableHead>
              <TableHead>Especie</TableHead>
              <TableHead>Raza</TableHead>
              <TableHead>Edad</TableHead>
              <TableHead>Sexo</TableHead>
              
              {/* --- Renderizado Condicional de Cabeceras --- */}
              {role === 'asistente' ? (
                <>
                  <TableHead className="text-center">Editar</TableHead>
                  <TableHead className="text-center">Eliminar</TableHead>
                </>
              ) : (
                <TableHead className="text-center">Evaluaciones</TableHead>
              )}
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedDogs.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                  No se encontraron perros registrados
                </TableCell>
              </TableRow>
            ) : (
              paginatedDogs.map((dog) => (
                <TableRow key={dog.id}>
                  <TableCell className="font-medium">{dog.nombre}</TableCell>
                  <TableCell>{dog.especie}</TableCell>
                  <TableCell>{dog.raza}</TableCell>
                  <TableCell>{calculateAge(dog.fechaNacimiento)} años</TableCell>
                  <TableCell>{dog.sexo}</TableCell>
                  
                  {/* --- Renderizado Condicional de Botones --- */}
                  {role === 'asistente' ? (
                    <>
                      <TableCell className="text-center">
                        <Button variant="ghost" size="icon" onClick={() => onEditDog?.(dog)} className="h-8 w-8">
                          <Edit className="h-4 w-4" />
                        </Button>
                      </TableCell>
                      <TableCell className="text-center">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDelete(dog.id)}
                          className="h-8 w-8 text-destructive hover:text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </>
                  ) : (
                    <TableCell className="text-center">
                      <Button variant="ghost" size="icon" onClick={() => onViewEvaluations?.(dog)} className="h-8 w-8">
                        <FileText className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  )}

                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* --- Paginación (se mantiene igual) --- */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Mostrando {startIndex + 1} a {Math.min(startIndex + itemsPerPage, filteredDogs.length)} de{" "}
            {filteredDogs.length} registros
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
    </div>
  )
}