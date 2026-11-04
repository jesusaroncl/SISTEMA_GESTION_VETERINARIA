"use client"

import { useEffect, useState } from "react"
import { Building2, Check, ChevronDown } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { ROLE_LABELS, saveSession, type ClinicOption } from "@/lib/session"

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL

type ClinicSwitcherProps = {
  /** Se llama antes de cambiar; si devuelve false se cancela (p. ej. formulario sin guardar) */
  beforeSwitch?: () => boolean
}

/** Nombre de la clínica activa; si la persona trabaja en varias, permite cambiar de clínica. */
export function ClinicSwitcher({ beforeSwitch }: ClinicSwitcherProps) {
  const [clinicName, setClinicName] = useState("")
  const [clinics, setClinics] = useState<ClinicOption[]>([])
  const [activeId, setActiveId] = useState<number | null>(null)

  useEffect(() => {
    setClinicName(localStorage.getItem("clinicName") || "")
    if (Number(localStorage.getItem("clinicCount") || "1") < 2) return
    fetch(`${API_BASE_URL}/auth/my-clinics`, {
      headers: { Authorization: `Bearer ${localStorage.getItem("access_token")}` },
    })
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (!data) return
        setClinics(data.clinics)
        setActiveId(data.activeClinicId)
      })
      .catch(() => {})
  }, [])

  const handleSwitch = async (clinic: ClinicOption) => {
    if (clinic.id === activeId) return
    if (beforeSwitch && !beforeSwitch()) return
    try {
      const response = await fetch(`${API_BASE_URL}/auth/switch-clinic`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("access_token")}`,
        },
        body: JSON.stringify({ clinicId: clinic.id }),
      })
      const data = await response.json()
      if (!response.ok) {
        alert(data.msg || "No se pudo cambiar de clínica")
        return
      }
      // Recarga completa: ningún dato de la clínica anterior queda en memoria
      window.location.href = saveSession(data)
    } catch {
      alert("No se pudo conectar con el servidor.")
    }
  }

  if (clinics.length < 2) {
    return clinicName ? (
      <span className="flex items-center gap-2 text-sm text-white/90">
        <Building2 className="h-4 w-4" />
        {clinicName}
      </span>
    ) : null
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="gap-2 text-white hover:bg-white/20 hover:text-white">
          <Building2 className="h-4 w-4" />
          {clinicName}
          <ChevronDown className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-64">
        <DropdownMenuLabel>Cambiar de clínica</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {clinics.map((c) => (
          <DropdownMenuItem key={c.id} onSelect={() => handleSwitch(c)} className="flex items-start gap-2">
            <Check className={`h-4 w-4 mt-0.5 ${c.id === activeId ? "opacity-100" : "opacity-0"}`} />
            <div>
              <p className="font-medium">{c.nombre}</p>
              <p className="text-xs text-muted-foreground">{ROLE_LABELS[c.role]}</p>
            </div>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
