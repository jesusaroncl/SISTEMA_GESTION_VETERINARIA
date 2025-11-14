"use client"

import { useState, useMemo } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Search, Plus, Edit, Trash2, Eye } from "lucide-react"
import type { Owner } from "@/lib/types"

// Datos de ejemplo
const mockOwners: Owner[] = [
  {
    id: "1",
    nombres: "Juan Carlos",
    apellidos: "Pérez García",
    dni: "12345678",
    celular: "987654321",
    correo: "juan.perez@email.com",
    direccion: "Av. Principal 123",
    sexo: "Masculino",
    fechaNacimiento: "1985-05-15",
  },
  {
    id: "2",
    nombres: "María Elena",
    apellidos: "López Rodríguez",
    dni: "87654321",
    celular: "912345678",
    correo: "maria.lopez@email.com",
    direccion: "Jr. Los Olivos 456",
    sexo: "Femenino",
    fechaNacimiento: "1990-08-22",
  },
  {
    id: "3",
    nombres: "Pedro Antonio",
    apellidos: "Sánchez Díaz",
    dni: "45678912",
    celular: "998877665",
    correo: "pedro.sanchez@email.com",
    direccion: "Calle Las Flores 789",
    sexo: "Masculino",
    fechaNacimiento: "1978-12-10",
  },
]

type OwnersTableProps = {
  onNewOwner: () => void
  onEditOwner: (owner: Owner) => void
  onViewDogs: (owner: Owner) => void
}

export function OwnersTable({ onNewOwner, onEditOwner, onViewDogs }: OwnersTableProps) {
  const [owners] = useState<Owner[]>(mockOwners)
  const [searchTerm, setSearchTerm] = useState("")
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 10

  const filteredOwners = useMemo(() => {
    return owners.filter(
      (owner) =>
        owner.nombres.toLowerCase().includes(searchTerm.toLowerCase()) ||
        owner.apellidos.toLowerCase().includes(searchTerm.toLowerCase()) ||
        owner.dni.includes(searchTerm) ||
        owner.celular.includes(searchTerm),
    )
  }, [owners, searchTerm])

  const totalPages = Math.ceil(filteredOwners.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const paginatedOwners = filteredOwners.slice(startIndex, startIndex + itemsPerPage)

  const handleDelete = (id: string) => {
    if (confirm("¿Está seguro de eliminar este propietario?")) {
      console.log("Eliminar propietario:", id)
    }
  }

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
          <Button onClick={onNewOwner} className="gap-2">
            <Plus className="h-4 w-4" />
            Nuevo Registro
          </Button>
        </div>

        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nombres</TableHead>
                <TableHead>Apellidos</TableHead>
                <TableHead>DNI</TableHead>
                <TableHead>Celular</TableHead>
                <TableHead className="text-center">Editar</TableHead>
                <TableHead className="text-center">Eliminar</TableHead>
                <TableHead className="text-center">Perros</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedOwners.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
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
