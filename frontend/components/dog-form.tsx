"use client"

import type React from "react"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ArrowLeft, Save } from "lucide-react"
import type { Dog } from "@/lib/types"

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL

type DogFormProps = {
  dog: Dog | null
  ownerId: string
  ownerName: string
  onBack: () => void
  onSave: () => void
}

export function DogForm({ dog, ownerId, ownerName, onBack, onSave }: DogFormProps) {
  const [formData, setFormData] = useState({
    especie: dog?.especie || "Canino", // Default 'Canino'
    nombre: dog?.nombre || "",
    raza: dog?.raza || "",
    fechaNacimiento: dog?.fechaNacimiento ? dog.fechaNacimiento.split("T")[0] : "",
    sexo: dog?.sexo || "Macho",
    estado: dog?.estado || "Vivo",
  })

  const getAuthToken = () => {
    return typeof window !== "undefined" ? localStorage.getItem("access_token") : null
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    const token = getAuthToken()
    if (!token) {
      alert("Error de autenticación");
      return;
    }

    const isEditing = !!dog
    const url = isEditing
      ? `${API_BASE_URL}/api/dogs/${dog.id}`                 // PUT (Update)
      : `${API_BASE_URL}/api/owners/${ownerId}/dogs` // POST (Create)
    const method = isEditing ? "PUT" : "POST"

    try {
      const response = await fetch(url, {
        method: method,
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      })

      if (!response.ok) {
        const data = await response.json()
        alert(data.msg || "Error al guardar el perro.")
        return
      }

      onSave() // Vuelve a la tabla (que se recargará)
    } catch (e) {
      alert("Error de conexión al guardar el perro.")
    }
  }

  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  return (
    <Card className="max-w-2xl mx-auto">
      <CardHeader>
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={onBack}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <CardTitle className="text-2xl font-bold">{dog ? "Editar Perro" : "Nuevo Perro"}</CardTitle>
            <p className="text-sm text-muted-foreground mt-1">Propietario: {ownerName}</p>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">

            <div className="space-y-2">
              <Label htmlFor="especie">Especie *</Label>
              <Select value={formData.especie} onValueChange={(value) => handleChange("especie", value)}>
                <SelectTrigger id="especie">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Canino">Canino</SelectItem>
                  <SelectItem value="Felino">Felino</SelectItem>
                  {/* Puedes añadir más especies si lo deseas */}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="nombre">Nombre *</Label>
              <Input
                id="nombre"
                value={formData.nombre}
                onChange={(e) => handleChange("nombre", e.target.value)}
                required
                placeholder="Ingrese el nombre del perro"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="raza">Raza *</Label>
              <Input
                id="raza"
                value={formData.raza}
                onChange={(e) => handleChange("raza", e.target.value)}
                required
                placeholder="Ingrese la raza"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="fechaNacimiento">Fecha de Nacimiento *</Label>
              <Input
                id="fechaNacimiento"
                type="date"
                value={formData.fechaNacimiento}
                onChange={(e) => handleChange("fechaNacimiento", e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="sexo">Sexo *</Label>
              <Select value={formData.sexo} onValueChange={(value) => handleChange("sexo", value)}>
                <SelectTrigger id="sexo">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Macho">Macho</SelectItem>
                  <SelectItem value="Hembra">Hembra</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="estado">Estado *</Label>
              <Select value={formData.estado} onValueChange={(value) => handleChange("estado", value)}>
                <SelectTrigger id="estado">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Vivo">Vivo</SelectItem>
                  <SelectItem value="Muerto">Muerto</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex gap-3 justify-end pt-4">
            <Button type="button" variant="outline" onClick={onBack}>
              Cancelar
            </Button>
            <Button type="submit" className="gap-2">
              <Save className="h-4 w-4" />
              Guardar
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}