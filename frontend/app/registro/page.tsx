"use client"

import type React from "react"
import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AlertCircle, CheckCircle2, Building2 } from "lucide-react"

export default function RegistroClinicaPage() {
  const router = useRouter()
  const [form, setForm] = useState({
    clinicName: "",
    ruc: "",
    username: "",
    email: "",
    password: "",
    confirm: "",
  })
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const [loading, setLoading] = useState(false)

  const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL
  const inputClass = "border-gray-300 focus:border-[#1793a5] focus:ring-[#1793a5]"

  const update = (field: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((prev) => ({ ...prev, [field]: e.target.value }))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    if (!/^\d{11}$/.test(form.ruc)) return setError("El RUC debe tener 11 dígitos")
    if (form.password.length < 6) return setError("La contraseña debe tener al menos 6 caracteres")
    if (form.password !== form.confirm) return setError("Las contraseñas no coinciden")

    setLoading(true)
    try {
      const { confirm, ...payload } = form
      const response = await fetch(`${API_BASE_URL}/auth/register-clinic`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })
      const data = await response.json()
      if (!response.ok) return setError(data.msg || "No se pudo registrar la clínica")
      setSuccess(data.msg)
      setTimeout(() => router.push("/"), 2500)
    } catch {
      setError("No se pudo conectar con el servidor.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-[#d0e8ed] via-[#7ececa] to-[#1793a5] flex items-center justify-center p-4">
      <Card className="w-full max-w-md shadow-2xl border-0">
        <CardHeader className="space-y-4 text-center pb-6">
          <div className="flex justify-center mb-2">
            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-[#1793a5] to-[#7ececa] flex items-center justify-center shadow-lg">
              <Building2 className="w-10 h-10 text-white" strokeWidth={2.5} />
            </div>
          </div>
          <CardTitle className="text-2xl font-bold text-[#1793a5]">Registrar clínica</CardTitle>
          <CardDescription className="text-base text-gray-600">
            Crea tu clínica y tu usuario administrador. Después podrás agregar a tus veterinarios y asistentes.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            {success && (
              <Alert>
                <CheckCircle2 className="h-4 w-4" />
                <AlertDescription>{success}</AlertDescription>
              </Alert>
            )}

            <div className="space-y-2">
              <Label htmlFor="clinicName">Nombre de la clínica</Label>
              <Input id="clinicName" value={form.clinicName} onChange={update("clinicName")} required className={inputClass} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="ruc">RUC</Label>
              <Input
                id="ruc"
                inputMode="numeric"
                maxLength={11}
                placeholder="11 dígitos"
                value={form.ruc}
                onChange={(e) => setForm((prev) => ({ ...prev, ruc: e.target.value.replace(/\D/g, "") }))}
                required
                className={inputClass}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="username">Usuario administrador</Label>
              <Input id="username" value={form.username} onChange={update("username")} required className={inputClass} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Correo</Label>
              <Input id="email" type="email" value={form.email} onChange={update("email")} required className={inputClass} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Contraseña</Label>
              <Input id="password" type="password" value={form.password} onChange={update("password")} required className={inputClass} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirm">Confirmar contraseña</Label>
              <Input id="confirm" type="password" value={form.confirm} onChange={update("confirm")} required className={inputClass} />
            </div>

            <Button type="submit" disabled={loading || !!success} className="w-full bg-[#1793a5] hover:bg-[#136d7a] text-white" size="lg">
              {loading ? "Registrando..." : "Registrar clínica"}
            </Button>

            <div className="text-center">
              <Link href="/" className="text-sm text-[#1793a5] hover:underline">
                Volver al inicio de sesión
              </Link>
            </div>
          </form>
        </CardContent>
      </Card>
    </main>
  )
}
