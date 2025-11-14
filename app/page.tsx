"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AlertCircle, Stethoscope } from "lucide-react"

export default function LoginPage() {
  const router = useRouter()
  const [role, setRole] = useState<"asistente" | "veterinario">("asistente")
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault()

    if (username !== "admin" || password !== "admin") {
      setError("Usuario o contraseña incorrectos")
      return
    }

    setError("")

    if (typeof window !== "undefined") {
      localStorage.setItem("userRole", role)
      localStorage.setItem("username", username)
    }

    if (role === "asistente") {
      router.push("/asistente")
    } else {
      router.push("/veterinario")
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

            <div className="space-y-3">
              <Label>Tipo de Usuario</Label>
              <RadioGroup value={role} onValueChange={(value) => setRole(value as "asistente" | "veterinario")}>
                <div className="flex items-center space-x-2 p-3 border rounded-lg hover:bg-[#d0e8ed] transition-colors border-gray-300">
                  <RadioGroupItem value="asistente" id="asistente" className="border-[#1793a5] text-[#1793a5]" />
                  <Label htmlFor="asistente" className="flex-1 cursor-pointer font-normal">
                    Asistente administrativo
                  </Label>
                </div>
                <div className="flex items-center space-x-2 p-3 border rounded-lg hover:bg-[#d0e8ed] transition-colors border-gray-300">
                  <RadioGroupItem value="veterinario" id="veterinario" className="border-[#1793a5] text-[#1793a5]" />
                  <Label htmlFor="veterinario" className="flex-1 cursor-pointer font-normal">
                    Veterinario
                  </Label>
                </div>
              </RadioGroup>
            </div>

            <Button type="submit" className="w-full bg-[#1793a5] hover:bg-[#136d7a] text-white" size="lg">
              Iniciar Sesión
            </Button>
          </form>
        </CardContent>
      </Card>
    </main>
  )
}
