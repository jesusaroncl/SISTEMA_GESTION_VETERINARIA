"use client"

import type React from "react"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import Link from "next/link"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AlertCircle, Building2, ChevronRight, Stethoscope } from "lucide-react"
import { ROLE_LABELS, saveSession, type ClinicOption } from "@/lib/session"

export default function LoginPage() {
  const router = useRouter()
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  // Si la cuenta pertenece a varias clínicas, se elige con cuál trabajar
  const [clinicChoice, setClinicChoice] = useState<{ selectToken: string; clinics: ClinicOption[] } | null>(null)

  const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("") // Limpiar errores previos

    try {
      const response = await fetch(`${API_BASE_URL}/auth/login`, { // Usar la URL del backend
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ username, password }),
      })

      const data = await response.json()

      if (!response.ok) {
        // Manejar errores de credenciales inválidas (401) o de servidor
        setError(data.msg || "Error desconocido al intentar iniciar sesión")
        return
      }

      if (data.selectClinic) {
        setClinicChoice({ selectToken: data.selectToken, clinics: data.clinics })
        return
      }

      // Login exitoso: guardar sesión y redirigir según el rol
      router.push(saveSession(data))
    } catch (error) {
      setError("No se pudo conectar con el servidor de autenticación.")
      console.error("Login API Error:", error)
    }
  }

  const handleSelectClinic = async (clinicId: number) => {
    if (!clinicChoice) return
    setError("")
    try {
      const response = await fetch(`${API_BASE_URL}/auth/select-clinic`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ selectToken: clinicChoice.selectToken, clinicId }),
      })
      const data = await response.json()
      if (!response.ok) {
        setClinicChoice(null)
        setError(data.msg || "No se pudo seleccionar la clínica")
        return
      }
      router.push(saveSession(data))
    } catch {
      setError("No se pudo conectar con el servidor de autenticación.")
    }
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-[#d0e8ed] via-[#7ececa] to-[#1793a5] flex items-center justify-center p-4">
      <Card className="w-full max-w-md shadow-2xl border-0">
        <CardHeader className="space-y-4 text-center pb-8">
          <div className="flex justify-center mb-2">
            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-[#1793a5] to-[#7ececa] flex items-center justify-center shadow-lg">
              <Stethoscope className="w-10 h-10 text-white" strokeWidth={2.5} />
            </div>
          </div>
          <CardTitle className="text-3xl font-bold text-[#1793a5]">PROYECTO</CardTitle>
          <CardDescription className="text-base text-gray-600">Sistema de Gestión Veterinaria</CardDescription>
        </CardHeader>
        <CardContent>
          {clinicChoice ? (
            <div className="space-y-4">
              <p className="text-center font-medium text-gray-700">¿Con qué clínica quieres trabajar?</p>
              <div className="space-y-2">
                {clinicChoice.clinics.map((c) => (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => handleSelectClinic(c.id)}
                    className="w-full flex items-center gap-3 rounded-lg border border-gray-200 p-3 text-left hover:border-[#1793a5] hover:bg-[#d0e8ed]/40 transition-colors"
                  >
                    <Building2 className="h-5 w-5 text-[#1793a5]" />
                    <div className="flex-1">
                      <p className="font-medium">{c.nombre}</p>
                      <p className="text-sm text-gray-500">{ROLE_LABELS[c.role]}</p>
                    </div>
                    <ChevronRight className="h-4 w-4 text-gray-400" />
                  </button>
                ))}
              </div>
              <Button variant="ghost" className="w-full" onClick={() => setClinicChoice(null)}>
                Volver
              </Button>
            </div>
          ) : (
          <form onSubmit={handleLogin} className="space-y-6">
            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <div className="space-y-2">
              <Label htmlFor="username">Usuario</Label>
              <Input
                id="username"
                type="text"
                placeholder="Ingrese su usuario"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                className="border-gray-300 focus:border-[#1793a5] focus:ring-[#1793a5]"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Contraseña</Label>
              <Input
                id="password"
                type="password"
                placeholder="Ingrese su contraseña"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="border-gray-300 focus:border-[#1793a5] focus:ring-[#1793a5]"
              />
            </div>

            <div className="text-right -mt-3">
              <Link href="/forgot-password" className="text-sm text-[#1793a5] hover:underline">
                ¿Olvidaste tu contraseña?
              </Link>
            </div>

            <Button type="submit" className="w-full bg-[#1793a5] hover:bg-[#136d7a] text-white" size="lg">
              Iniciar Sesión
            </Button>

            <p className="text-center text-sm text-gray-600">
              ¿Tu clínica aún no está registrada?{" "}
              <Link href="/registro" className="text-[#1793a5] font-medium hover:underline">
                Registrar clínica
              </Link>
            </p>
          </form>
          )}
        </CardContent>
      </Card>
    </main>
  )
}