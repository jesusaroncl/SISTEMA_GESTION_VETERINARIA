"use client"

import { useState, useMemo, useEffect, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Search, Plus, Edit, Trash2, Eye } from "lucide-react"
import type { Owner } from "@/lib/types"

// Definir la URL base de tu backend Flask
// Asegúrate de crear este archivo: /frontend/.env.local
// con el contenido: NEXT_PUBLIC_API_BASE_URL="http://127.0.0.1:5000"
const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://127.0.0.1:5000"

type OwnersTableProps = {
  role: "asistente" | "veterinario"
  onNewOwner: () => void
  onEditOwner: (owner: Owner) => void
  onViewDogs: (owner: Owner) => void
}

export function OwnersTable({ role, onNewOwner, onEditOwner, onViewDogs }: OwnersTableProps) {
  // Inicializar con un array vacío
  const [owners, setOwners] = useState<Owner[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 10

  // Función para obtener el token del localStorage
  const getAuthToken = () => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("access_token")
    }
    return null
  }

  // Función para cargar los propietarios
  const fetchOwners = useCallback(async () => {
    setLoading(true)
    setError(null)
    const token = getAuthToken()

    if (!token) {
      setError("Error de autenticación: Token no encontrado.")
      setLoading(false)
      return
    }

    try {
      const response = await fetch(`${API_BASE_URL}/api/owners`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.msg || "Fallo al cargar los propietarios.")
        setOwners([])
        return
      }

      setOwners(data as Owner[])
    } catch (err) {
      setError("Error de conexión con el servidor.")
    } finally {
      setLoading(false)
    }
  }, []) // Dependencias vacías, solo se crea una vez

  // Ejecutar la carga al montar el componente
  useEffect(() => {
    fetchOwners()
  }, [fetchOwners])


  // Función de eliminación
  const handleDelete = async (id: string) => {
    if (confirm("¿Está seguro de eliminar este propietario?")) {
      const token = getAuthToken()
      if (!token) return

      try {
        const response = await fetch(`${API_BASE_URL}/api/owners/${id}`, {
          method: "DELETE",
          headers: {
            "Authorization": `Bearer ${token}`,
          },
        })

        if (!response.ok) {
          const data = await response.json()
          alert(data.msg || "Error al eliminar el propietario.")
          return
        }

        // Éxito: Recargar la lista de propietarios
        fetchOwners()
      } catch (e) {
        alert("Error de conexión al eliminar.")
      }
    }
  }


  const filteredOwners = useMemo(() => {
    return owners.filter(
      (owner) =>
        owner.nombres.toLowerCase().includes(searchTerm.toLowerCase()) ||
        owner.apellidos.toLowerCase().includes(searchTerm.toLowerCase()) ||
        owner.dni.includes(searchTerm) ||
        (owner.celular && owner.celular.includes(searchTerm)),
    )
  }, [owners, searchTerm])

  const totalPages = Math.ceil(filteredOwners.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const paginatedOwners = filteredOwners.slice(startIndex, startIndex + itemsPerPage)

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-2xl font-bold">Propietarios Registrados</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col gap-4 mb-6 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por nombre, apellido, DNI o celular..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value)
                setCurrentPage(1)
              }}
              className="pl-10"
            />
          </div>
          
          {/* --- RENDERIZADO CONDICIONAL: Botón Nuevo Registro --- */}
          {role === 'asistente' && (
            <Button onClick={onNewOwner} className="gap-2">
              <Plus className="h-4 w-4" />
              Nuevo Registro
            </Button>
          )}
        </div>

        {loading && <p className="text-center py-8">Cargando propietarios...</p>}
        {error && <p className="text-center py-8 text-destructive">Error: {error}</p>}

        {!loading && !error && (
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nombres</TableHead>
                  <TableHead>Apellidos</TableHead>
                  <TableHead>DNI</TableHead>
                  <TableHead>Celular</TableHead>
                  
                  {/* --- RENDERIZADO CONDICIONAL: Cabeceras --- */}
                  {role === 'asistente' && (
                    <>
                      <TableHead className="text-center">Editar</TableHead>
                      <TableHead className="text-center">Eliminar</TableHead>
                    </>
                  )}
                  
                  <TableHead className="text-center">Perros</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedOwners.length === 0 ? (
                  <TableRow>
                    {/* Ajustar colSpan dinámicamente */}
                    <TableCell colSpan={role === 'asistente' ? 7 : 5} className="text-center text-muted-foreground py-8">
                      No se encontraron propietarios
                    </TableCell>
                  </TableRow>
                ) : (
                  paginatedOwners.map((owner) => (
                    <TableRow key={owner.id}>
                      <TableCell className="font-medium">{owner.nombres}</TableCell>
                      <TableCell>{owner.apellidos}</TableCell>
                      <TableCell>{owner.dni}</TableCell>
                      <TableCell>{owner.celular}</TableCell>

                      {/* --- RENDERIZADO CONDICIONAL: Botones Editar/Eliminar --- */}
                      {role === 'asistente' && (
                        <>
                          <TableCell className="text-center">
                            <Button variant="ghost" size="icon" onClick={() => onEditOwner(owner)} className="h-8 w-8">
                              <Edit className="h-4 w-4" />
                            </Button>
                          </TableCell>
                          <TableCell className="text-center">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleDelete(owner.id)}
                              className="h-8 w-8 text-destructive hover:text-destructive"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </>
                      )}
                      
                      {/* Botón "Ver Perros" siempre visible */}
                      <TableCell className="text-center">
                        <Button variant="ghost" size="icon" onClick={() => onViewDogs(owner)} className="h-8 w-8">
                          <Eye className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        )}

        {totalPages > 1 && (
          <div className="flex items-center justify-between mt-4">
            <p className="text-sm text-muted-foreground">
              Mostrando {startIndex + 1} a {Math.min(startIndex + itemsPerPage, filteredOwners.length)} de{" "}
              {filteredOwners.length} registros
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