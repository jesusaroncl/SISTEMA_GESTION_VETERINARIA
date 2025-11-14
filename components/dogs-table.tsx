"use client"

import { useState, useMemo } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Search, Plus, Edit, Trash2 } from "lucide-react"
import type { Dog } from "@/lib/types"

// Datos de ejemplo
const mockDogs: Dog[] = [
  {
    id: "1",
    ownerId: "1",
    nombre: "Max",
    raza: "Labrador",
    fechaNacimiento: "2020-03-15",
    sexo: "Macho",
    estado: "Vivo",
  },
  {
    id: "2",
    ownerId: "1",
    nombre: "Luna",
    raza: "Golden Retriever",
    fechaNacimiento: "2019-07-22",
    sexo: "Hembra",
    estado: "Vivo",
  },
  {
    id: "3",
    ownerId: "2",
    nombre: "Rocky",
    raza: "Pastor Alemán",
    fechaNacimiento: "2018-11-10",
    sexo: "Macho",
    estado: "Vivo",
  },
]

type DogsTableProps = {
  ownerId: string
  onNewDog: () => void
  onEditDog: (dog: Dog) => void
}

export function DogsTable({ ownerId, onNewDog, onEditDog }: DogsTableProps) {
  const [dogs] = useState<Dog[]>(mockDogs.filter((dog) => dog.ownerId === ownerId))
  const [searchTerm, setSearchTerm] = useState("")
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 10

  const calculateAge = (birthDate: string) => {
    const today = new Date()
    const birth = new Date(birthDate)
    let age = today.getFullYear() - birth.getFullYear()
    const monthDiff = today.getMonth() - birth.getMonth()
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--
    }
    return age
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

  const handleDelete = (id: string) => {
    if (confirm("¿Está seguro de eliminar este perro?")) {
      console.log("Eliminar perro:", id)
    }
  }

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
        <Button onClick={onNewDog} className="gap-2">
          <Plus className="h-4 w-4" />
          Nuevo Registro
        </Button>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nombre</TableHead>
              <TableHead>Raza</TableHead>
              <TableHead>Edad</TableHead>
              <TableHead>Sexo</TableHead>
              <TableHead className="text-center">Editar</TableHead>
              <TableHead className="text-center">Eliminar</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedDogs.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                  No se encontraron perros registrados
                </TableCell>
              </TableRow>
            ) : (
              paginatedDogs.map((dog) => (
                <TableRow key={dog.id}>
                  <TableCell className="font-medium">{dog.nombre}</TableCell>
                  <TableCell>{dog.raza}</TableCell>
                  <TableCell>{calculateAge(dog.fechaNacimiento)} años</TableCell>
                  <TableCell>{dog.sexo}</TableCell>
                  <TableCell className="text-center">
                    <Button variant="ghost" size="icon" onClick={() => onEditDog(dog)} className="h-8 w-8">
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
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

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
