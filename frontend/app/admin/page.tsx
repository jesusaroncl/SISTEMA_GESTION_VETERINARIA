"use client"

import type React from "react"
import { useCallback, useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AlertCircle, CheckCircle2, Clock, LogOut, Mail, UserMinus, X } from "lucide-react"
import { ClinicSwitcher } from "@/components/clinic-switcher"
import { ROLE_LABELS, clearSession, type UserRole } from "@/lib/session"

interface TeamMember {
  id: number
  username: string
  email: string | null
  role: UserRole
}

interface Invitation {
  id: number
  email: string
  role: UserRole
  expiresAt: string
}

export default function AdminPage() {
  const router = useRouter()
  const [username, setUsername] = useState("")
  const [members, setMembers] = useState<TeamMember[]>([])
  const [invitations, setInvitations] = useState<Invitation[]>([])
  const [form, setForm] = useState({ email: "", role: "veterinario" })
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const [loading, setLoading] = useState(false)

  const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL
  const inputClass = "border-gray-300 focus:border-[#1793a5] focus:ring-[#1793a5]"

  const authHeaders = () => ({
    "Content-Type": "application/json",
    Authorization: `Bearer ${localStorage.getItem("access_token")}`,
  })

  const loadTeam = useCallback(async () => {
    const [membersRes, invitationsRes] = await Promise.all([
      fetch(`${API_BASE_URL}/api/users`, { headers: authHeaders() }),
      fetch(`${API_BASE_URL}/api/invitations`, { headers: authHeaders() }),
    ])
    if (membersRes.status === 401) {
      clearSession()
      router.push("/")
      return
    }
    if (membersRes.ok) setMembers(await membersRes.json())
    if (invitationsRes.ok) setInvitations(await invitationsRes.json())
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [API_BASE_URL, router])

  useEffect(() => {
    if (localStorage.getItem("userRole") !== "administrador") {
      router.push("/")
      return
    }
    setUsername(localStorage.getItem("username") || "")
    loadTeam()
  }, [router, loadTeam])

  const handleLogout = () => {
    clearSession()
    router.push("/")
  }

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setSuccess("")
    setLoading(true)
    try {
      const response = await fetch(`${API_BASE_URL}/api/invitations`, {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify(form),
      })
      const data = await response.json()
      if (!response.ok) return setError(data.msg || "No se pudo enviar la invitación")
      setSuccess(data.msg)
      setForm({ email: "", role: form.role })
      loadTeam()
    } catch {
      setError("No se pudo conectar con el servidor.")
    } finally {
      setLoading(false)
    }
  }

  const handleRevoke = async (inv: Invitation) => {
    if (!confirm(`¿Cancelar la invitación a ${inv.email}?`)) return
    setError("")
    setSuccess("")
    const response = await fetch(`${API_BASE_URL}/api/invitations/${inv.id}`, { method: "DELETE", headers: authHeaders() })
    if (!response.ok) {
      const data = await response.json()
      return setError(data.msg || "No se pudo cancelar la invitación")
    }
    loadTeam()
  }

  const handleRemove = async (member: TeamMember) => {
    if (!confirm(`¿Quitar a ${member.username} de la clínica? Perderá el acceso a los datos de esta clínica.`)) return
    setError("")
    setSuccess("")
    const response = await fetch(`${API_BASE_URL}/api/users/${member.id}`, { method: "DELETE", headers: authHeaders() })
    if (!response.ok) {
      const data = await response.json()
      return setError(data.msg || "No se pudo quitar al integrante")
    }
    loadTeam()
  }

  return (
    <main className="min-h-screen bg-background">
      <div className="border-b bg-[#1793a5] shadow-lg">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white">PROYECTO</h1>
            <p className="text-sm text-white/80">Administración · {username}</p>
          </div>
          <div className="flex items-center gap-2">
            <ClinicSwitcher />
            <Button variant="ghost" onClick={handleLogout} className="gap-2 text-white hover:bg-white/20 hover:text-white">
              <LogOut className="h-4 w-4" />
              Cerrar Sesión
            </Button>
          </div>
        </div>
      </div>

      <div className="container mx-auto py-8 px-4 grid gap-6 lg:grid-cols-[360px_1fr]">
        <Card className="h-fit">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-[#1793a5]">
              <Mail className="h-5 w-5" />
              Invitar integrante
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleInvite} className="space-y-4">
              {error && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}
              {success && (
                <Alert className="border-green-200 bg-green-50 text-green-800">
                  <CheckCircle2 className="h-4 w-4" />
                  <AlertDescription>{success}</AlertDescription>
                </Alert>
              )}
              <div className="space-y-2">
                <Label htmlFor="role">Rol</Label>
                <select
                  id="role"
                  value={form.role}
                  onChange={(e) => setForm({ ...form, role: e.target.value })}
                  className="w-full h-9 rounded-md border border-gray-300 bg-transparent px-3 text-sm"
                >
                  <option value="veterinario">Veterinario</option>
                  <option value="asistente">Asistente administrativo</option>
                </select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="invite-email">Correo</Label>
                <Input
                  id="invite-email"
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  required
                  maxLength={120}
                  placeholder="correo@ejemplo.com"
                  className={inputClass}
                />
              </div>
              <p className="text-xs text-muted-foreground">
                Le llegará un enlace para unirse a la clínica, válido por 7 días. Si ya tiene una cuenta, solo confirmará
                con su contraseña.
              </p>
              <Button type="submit" disabled={loading} className="w-full bg-[#1793a5] hover:bg-[#136d7a] text-white">
                {loading ? "Enviando..." : "Enviar invitación"}
              </Button>
            </form>
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-[#1793a5]">Equipo de la clínica</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="divide-y">
                {members.map((m) => (
                  <div key={m.id} className="flex items-center justify-between py-3">
                    <div>
                      <p className="font-medium">{m.username}</p>
                      <p className="text-sm text-muted-foreground">
                        {m.email || "Sin correo"} · {ROLE_LABELS[m.role]}
                      </p>
                    </div>
                    {m.role !== "administrador" && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRemove(m)}
                        className="gap-2 text-red-600 hover:text-red-700"
                      >
                        <UserMinus className="h-4 w-4" />
                        Quitar
                      </Button>
                    )}
                  </div>
                ))}
                {members.length === 0 && <p className="py-3 text-sm text-muted-foreground">Sin integrantes.</p>}
              </div>
            </CardContent>
          </Card>

          {invitations.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-[#1793a5]">
                  <Clock className="h-5 w-5" />
                  Invitaciones pendientes
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="divide-y">
                  {invitations.map((inv) => (
                    <div key={inv.id} className="flex items-center justify-between py-3">
                      <div>
                        <p className="font-medium">{inv.email}</p>
                        <p className="text-sm text-muted-foreground">
                          {ROLE_LABELS[inv.role]} · vence el {new Date(inv.expiresAt).toLocaleDateString("es-PE")}
                        </p>
                      </div>
                      <Button variant="ghost" size="icon" onClick={() => handleRevoke(inv)} aria-label={`Cancelar invitación a ${inv.email}`}>
                        <X className="h-4 w-4 text-red-600" />
                      </Button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </main>
  )
}
