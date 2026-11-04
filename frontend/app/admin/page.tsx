"use client"

import type React from "react"
import { useCallback, useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AlertCircle, LogOut, Trash2, UserPlus } from "lucide-react"

interface TeamUser {
  id: number
  username: string
  email: string | null
  role: "administrador" | "asistente" | "veterinario"
}

const ROLE_LABELS: Record<TeamUser["role"], string> = {
  administrador: "Administrador",
  asistente: "Asistente administrativo",
  veterinario: "Veterinario",
}

export default function AdminPage() {
  const router = useRouter()
  const [clinicName, setClinicName] = useState("")
  const [username, setUsername] = useState("")
  const [users, setUsers] = useState<TeamUser[]>([])
  const [form, setForm] = useState({ username: "", email: "", password: "", role: "veterinario" })
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL
  const inputClass = "border-gray-300 focus:border-[#1793a5] focus:ring-[#1793a5]"

  const authHeaders = () => ({
    "Content-Type": "application/json",
    Authorization: `Bearer ${localStorage.getItem("access_token")}`,
  })

  const loadUsers = useCallback(async () => {
    const response = await fetch(`${API_BASE_URL}/api/users`, { headers: authHeaders() })
    if (response.ok) setUsers(await response.json())
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [API_BASE_URL])

  useEffect(() => {
    if (localStorage.getItem("userRole") !== "administrador") {
      router.push("/")
      return
    }
    setClinicName(localStorage.getItem("clinicName") || "")
    setUsername(localStorage.getItem("username") || "")
    loadUsers()
  }, [router, loadUsers])

  const handleLogout = () => {
    ;["userRole", "username", "clinicName", "access_token"].forEach((k) => localStorage.removeItem(k))
    router.push("/")
  }

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setLoading(true)
    try {
      const response = await fetch(`${API_BASE_URL}/api/users`, {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify(form),
      })
      const data = await response.json()
      if (!response.ok) return setError(data.msg || "No se pudo crear el usuario")
      setForm({ username: "", email: "", password: "", role: form.role })
      loadUsers()
    } catch {
      setError("No se pudo conectar con el servidor.")
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (user: TeamUser) => {
    if (!confirm(`¿Eliminar al usuario ${user.username}?`)) return
    setError("")
    const response = await fetch(`${API_BASE_URL}/api/users/${user.id}`, { method: "DELETE", headers: authHeaders() })
    if (!response.ok) {
      const data = await response.json()
      return setError(data.msg || "No se pudo eliminar el usuario")
    }
    loadUsers()
  }

  return (
    <main className="min-h-screen bg-background">
      <div className="border-b bg-[#1793a5] shadow-lg">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white">{clinicName || "PROYECTO"}</h1>
            <p className="text-sm text-white/80">Administración · {username}</p>
          </div>
          <Button variant="ghost" onClick={handleLogout} className="gap-2 text-white hover:bg-white/20 hover:text-white">
            <LogOut className="h-4 w-4" />
            Cerrar Sesión
          </Button>
        </div>
      </div>

      <div className="container mx-auto py-8 px-4 grid gap-6 lg:grid-cols-[360px_1fr]">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-[#1793a5]">
              <UserPlus className="h-5 w-5" />
              Nuevo integrante
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleCreate} className="space-y-4">
              {error && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
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
                <Label htmlFor="new-username">Usuario</Label>
                <Input id="new-username" value={form.username} onChange={(e) => setForm({ ...form, username: e.target.value })} required className={inputClass} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="new-email">Correo</Label>
                <Input id="new-email" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required className={inputClass} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="new-password">Contraseña inicial</Label>
                <Input id="new-password" type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} required className={inputClass} />
              </div>
              <Button type="submit" disabled={loading} className="w-full bg-[#1793a5] hover:bg-[#136d7a] text-white">
                {loading ? "Creando..." : "Crear usuario"}
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-[#1793a5]">Equipo de la clínica</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="divide-y">
              {users.map((u) => (
                <div key={u.id} className="flex items-center justify-between py-3">
                  <div>
                    <p className="font-medium">{u.username}</p>
                    <p className="text-sm text-muted-foreground">
                      {u.email || "Sin correo"} · {ROLE_LABELS[u.role]}
                    </p>
                  </div>
                  {u.role !== "administrador" && (
                    <Button variant="ghost" size="icon" onClick={() => handleDelete(u)} aria-label={`Eliminar ${u.username}`}>
                      <Trash2 className="h-4 w-4 text-red-600" />
                    </Button>
                  )}
                </div>
              ))}
              {users.length === 0 && <p className="py-3 text-sm text-muted-foreground">Sin integrantes.</p>}
            </div>
          </CardContent>
        </Card>
      </div>
    </main>
  )
}
