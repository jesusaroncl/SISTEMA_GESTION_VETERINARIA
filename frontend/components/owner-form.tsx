"use client"

import type React from "react"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ArrowLeft, Save } from "lucide-react"
import type { Owner } from "@/lib/types"

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL

type OwnerFormProps = {
  owner: Owner | null
  onBack: () => void
  onSave: () => void
}

export function OwnerForm({ owner, onBack, onSave }: OwnerFormProps) {
  const [formData, setFormData] = useState({
    nombres: owner?.nombres || "",
    apellidos: owner?.apellidos || "",
    dni: owner?.dni || "",
    celular: owner?.celular || "",
    correo: owner?.correo || "",
    direccion: owner?.direccion || "",
    sexo: owner?.sexo || "Masculino",
    fechaNacimiento: owner?.fechaNacimiento ? owner.fechaNacimiento.split("T")[0] : "", // Formato YYYY-MM-DD
  })

  // Función para obtener el token del localStorage
  const getAuthToken = () => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("access_token")
    }
    return null
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    const token = getAuthToken()
    if (!token) {
        alert("Error de autenticación. Por favor, inicie sesión de nuevo.")
        return
    }

    const isEditing = !!owner // Determina si estamos editando o creando
    const url = isEditing 
        ? `${API_BASE_URL}/api/owners/${owner.id}` 
        : `${API_BASE_URL}/api/owners`
    const method = isEditing ? "PUT" : "POST"

    try {
        const response = await fetch(url, {
            method: method,
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${token}`,
            },
            body: JSON.stringify(formData),
        })

        const data = await response.json()

        if (!response.ok) {
            alert(data.msg || `Error al ${isEditing ? 'actualizar' : 'crear'} el propietario.`)
            return
        }

        alert(`Propietario ${isEditing ? 'actualizado' : 'creado'} con éxito!`)
        onSave() // Regresa a la tabla (y la tabla se recargará)
    } catch (e) {
        alert("Error de conexión con el servidor.")
    }
  }


  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  return (
    <Card className="max-w-3xl mx-auto bg-[#d0e8ed] border-[#1793a5]">
      <CardHeader>
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={onBack}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <CardTitle className="text-2xl font-bold text-[#1793a5]">
            {owner ? "Editar Propietario" : "Nuevo Propietario"}
          </CardTitle>
        </div>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="nombres">Nombres *</Label>
              <Input
                id="nombres"
                value={formData.nombres}
                onChange={(e) => handleChange("nombres", e.target.value)}
                required
                placeholder="Ingrese los nombres"
                className="bg-white"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="apellidos">Apellidos *</Label>
              <Input
                id="apellidos"
                value={formData.apellidos}
                onChange={(e) => handleChange("apellidos", e.target.value)}
                required
                placeholder="Ingrese los apellidos"
                className="bg-white"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="dni">DNI *</Label>
              <Input
                id="dni"
                value={formData.dni}
                onChange={(e) => handleChange("dni", e.target.value)}
                required
                maxLength={8}
                placeholder="12345678"
                className="bg-white"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="celular">Celular</Label>
              <Input
                id="celular"
                value={formData.celular}
                onChange={(e) => handleChange("celular", e.target.value)}
                maxLength={9}
                placeholder="987654321"
                className="bg-white"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="correo">Correo Electrónico *</Label>
              <Input
                id="correo"
                type="email"
                value={formData.correo}
                onChange={(e) => handleChange("correo", e.target.value)}
                required
                placeholder="ejemplo@email.com"
                className="bg-white"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="fechaNacimiento">Fecha de Nacimiento</Label>
              <Input
                id="fechaNacimiento"
                type="date"
                value={formData.fechaNacimiento}
                onChange={(e) => handleChange("fechaNacimiento", e.target.value)}
                className="bg-white"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="sexo">Sexo</Label>
              <Select value={formData.sexo} onValueChange={(value) => handleChange("sexo", value)}>
                <SelectTrigger id="sexo" className="bg-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Masculino">Masculino</SelectItem>
                  <SelectItem value="Femenino">Femenino</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="direccion">Dirección</Label>
              <Input
                id="direccion"
                value={formData.direccion}
                onChange={(e) => handleChange("direccion", e.target.value)}
                placeholder="Ingrese la dirección completa"
                className="bg-white"
              />
            </div>
          </div>

          <div className="flex gap-3 justify-end pt-4">
            <Button
              type="button"
              variant="destructive"
              onClick={onBack}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              Cancelar
            </Button>
            <Button type="submit" className="gap-2 bg-[#7ececa] hover:bg-[#5eb5b0] text-white">
              <Save className="h-4 w-4" />
              Guardar
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}