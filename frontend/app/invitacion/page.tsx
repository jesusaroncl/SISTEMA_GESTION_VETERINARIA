"use client"

import type React from "react"
import { Suspense, useEffect, useState } from "react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AlertCircle, MailOpen } from "lucide-react"
import { ROLE_LABELS, saveSession, type UserRole } from "@/lib/session"

type InvitationInfo = { clinicName: string; role: UserRole; email: string; hasAccount: boolean }

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL
const inputClass = "border-gray-300 focus:border-[#1793a5] focus:ring-[#1793a5]"

function InvitacionContent() {
  const router = useRouter()
  const token = useSearchParams().get("token") || ""
  const [info, setInfo] = useState<InvitationInfo | null>(null)
  const [loadError, setLoadError] = useState("")
  const [form, setForm] = useState({ username: "", password: "", confirm: "" })
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!token) {
      setLoadError("El enlace de invitación no es válido.")
      return
    }
    fetch(`${API_BASE_URL}/auth/invitations/${encodeURIComponent(token)}`)
      .then(async (r) => {
        const data = await r.json()
        if (!r.ok) setLoadError(data.msg || "La invitación no es válida o ya expiró")
        else setInfo(data)
      })
      .catch(() => setLoadError("No se pudo conectar con el servidor."))
  }, [token])

  const update = (field: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((prev) => ({ ...prev, [field]: e.target.value }))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!info) return
    setError("")
    if (!info.hasAccount) {
      if (form.password.length < 6) return setError("La contraseña debe tener al menos 6 caracteres")
      if (form.password !== form.confirm) return setError("Las contraseñas no coinciden")
    }

    setLoading(true)
    try {
      const body = info.hasAccount ? { password: form.password } : { username: form.username, password: form.password }
      const response = await fetch(`${API_BASE_URL}/auth/invitations/${encodeURIComponent(token)}/accept`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      })
      const data = await response.json()
      if (!response.ok) return setError(data.msg || "No se pudo aceptar la invitación")
      // Entra directamente a la clínica que lo invitó
      router.push(saveSession(data))
    } catch {
      setError("No se pudo conectar con el servidor.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card className="w-full max-w-md shadow-2xl border-0">
      <CardHeader className="space-y-4 text-center pb-6">
        <div className="flex justify-center mb-2">
          <div className="w-20 h-20 rounded-full bg-gradient-to-br from-[#1793a5] to-[#7ececa] flex items-center justify-center shadow-lg">
            <MailOpen className="w-10 h-10 text-white" strokeWidth={2.5} />
          </div>
        </div>
        <CardTitle className="text-2xl font-bold text-[#1793a5]">Invitación</CardTitle>
        {info && (
          <CardDescription className="text-base text-gray-600">
            <span className="font-semibold text-gray-800">{info.clinicName}</span> te invitó a unirte como{" "}
            <span className="font-semibold text-gray-800">{ROLE_LABELS[info.role].toLowerCase()}</span>.
          </CardDescription>
        )}
      </CardHeader>
      <CardContent>
        {loadError ? (
          <div className="space-y-4">
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{loadError}</AlertDescription>
            </Alert>
            <p className="text-center text-sm text-gray-600">
              Pide al administrador de la clínica que te envíe una nueva invitación.
            </p>
            <Link href="/" className="block text-center text-sm text-[#1793a5] hover:underline">
              Ir al inicio de sesión
            </Link>
          </div>
        ) : !info ? (
          <p className="text-center text-gray-500">Cargando invitación...</p>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            <div className="space-y-2">
              <Label htmlFor="email">Correo</Label>
              <Input id="email" value={info.email} readOnly className="bg-gray-100 cursor-not-allowed" />
            </div>

            {info.hasAccount ? (
              <>
                <p className="text-sm text-gray-600">
                  Ya tienes una cuenta con este correo. Confirma con tu contraseña para agregar esta clínica a tu cuenta.
                </p>
                <div className="space-y-2">
                  <Label htmlFor="password">Contraseña</Label>
                  <Input id="password" type="password" value={form.password} onChange={update("password")} required className={inputClass} />
                </div>
                <div className="text-right -mt-2">
                  <Link href="/forgot-password" className="text-sm text-[#1793a5] hover:underline">
                    ¿Olvidaste tu contraseña?
                  </Link>
                </div>
              </>
            ) : (
              <>
                <p className="text-sm text-gray-600">Crea tu cuenta para empezar.</p>
                <div className="space-y-2">
                  <Label htmlFor="username">Nombre de usuario</Label>
                  <Input id="username" value={form.username} onChange={update("username")} required maxLength={64} className={inputClass} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password">Contraseña</Label>
                  <Input id="password" type="password" value={form.password} onChange={update("password")} required className={inputClass} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirm">Confirmar contraseña</Label>
                  <Input id="confirm" type="password" value={form.confirm} onChange={update("confirm")} required className={inputClass} />
                </div>
              </>
            )}

            <Button type="submit" disabled={loading} className="w-full bg-[#1793a5] hover:bg-[#136d7a] text-white" size="lg">
              {loading ? "Procesando..." : info.hasAccount ? "Unirme a la clínica" : "Crear cuenta y unirme"}
            </Button>
          </form>
        )}
      </CardContent>
    </Card>
  )
}

export default function InvitacionPage() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-[#d0e8ed] via-[#7ececa] to-[#1793a5] flex items-center justify-center p-4">
      <Suspense fallback={<p className="text-white">Cargando...</p>}>
        <InvitacionContent />
      </Suspense>
    </main>
  )
}
