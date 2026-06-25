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
    tipoDocumento: owner?.tipoDocumento || "DNI",
    dni: owner?.dni || "",
    celular: owner?.celular || "",
    correo: owner?.correo || "",
    direccion: owner?.direccion || "",
    sexo: owner?.sexo || "Masculino",
    fechaNacimiento: owner?.fechaNacimiento ? owner.fechaNacimiento.split("T")[0] : "",
    ubigeo: owner?.ubigeo || "",
    departamento: owner?.departamento || "",
    provincia: owner?.provincia || "",
    distrito: owner?.distrito || "",
  })

  const maxLengthDoc = formData.tipoDocumento === "DNI" ? 8 : 12

  // Función para obtener el token del localStorage
  const getAuthToken = () => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("access_token")
    }
    return null
  }

  const handleUbigeoChange = async (value: string) => {
    // Only allow digits
    const digits = value.replace(/\D/g, "").slice(0, 6)
    handleChange("ubigeo", digits)

    if (digits.length === 6) {
      const token = getAuthToken()
      if (!token) return
      try {
        const res = await fetch(`${API_BASE_URL}/api/ubigeo/${digits}`, {
          headers: { Authorization: `Bearer ${token}` },
        })
        if (res.ok) {
          const data = await res.json()
          setFormData((prev) => ({
            ...prev,
            ubigeo: digits,
            departamento: data.departamento,
            provincia: data.provincia,
            distrito: data.distrito,
          }))
        } else {
          setFormData((prev) => ({
            ...prev,
            ubigeo: digits,
            departamento: "",
            provincia: "",
            distrito: "",
          }))
        }
      } catch {
        // ignore network errors for auto-complete
      }
    } else {
      setFormData((prev) => ({
        ...prev,
        ubigeo: digits,
        departamento: "",
        provincia: "",
        distrito: "",
      }))
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!confirm("¿Estás seguro que deseas guardar?")) return

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
          <Button variant="ghost" size="icon" onClick={() => { if (confirm("¿Estás seguro que deseas cancelar?")) onBack() }}>
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
              <Label htmlFor="tipoDocumento">Tipo de Documento *</Label>
              <Select
                value={formData.tipoDocumento}
                onValueChange={(value) => {
                  handleChange("tipoDocumento", value)
                  handleChange("dni", "")
                }}
              >
                <SelectTrigger id="tipoDocumento" className="bg-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="DNI">DNI</SelectItem>
                  <SelectItem value="Carnet de extranjería">Carnet de extranjería</SelectItem>
                  <SelectItem value="Pasaporte">Pasaporte</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="dni">Número de Documento *</Label>
              <Input
                id="dni"
                value={formData.dni}
                onChange={(e) => handleChange("dni", e.target.value)}
                required
                maxLength={maxLengthDoc}
                placeholder={formData.tipoDocumento === "DNI" ? "12345678" : "Número de documento"}
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

            <div className="space-y-2">
              <Label htmlFor="ubigeo">Ubigeo</Label>
              <Input
                id="ubigeo"
                value={formData.ubigeo}
                onChange={(e) => handleUbigeoChange(e.target.value)}
                maxLength={6}
                placeholder="Ej: 150101"
                className="bg-white"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="departamento">Departamento</Label>
              <Input
                id="departamento"
                value={formData.departamento}
                readOnly
                placeholder="Se completa automáticamente"
                className="bg-gray-100 cursor-not-allowed"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="provincia">Provincia</Label>
              <Input
                id="provincia"
                value={formData.provincia}
                readOnly
                placeholder="Se completa automáticamente"
                className="bg-gray-100 cursor-not-allowed"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="distrito">Distrito</Label>
              <Input
                id="distrito"
                value={formData.distrito}
                readOnly
                placeholder="Se completa automáticamente"
                className="bg-gray-100 cursor-not-allowed"
              />
            </div>
          </div>

          <div className="flex gap-3 justify-end pt-4">
            <Button
              type="button"
              variant="destructive"
              onClick={() => { if (confirm("¿Estás seguro que deseas cancelar?")) onBack() }}
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