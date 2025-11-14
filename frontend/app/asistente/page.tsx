"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { OwnersTable } from "@/components/owners-table"
import { OwnerForm } from "@/components/owner-form"
import { DogsView } from "@/components/dogs-view"
import { Button } from "@/components/ui/button"
import { LogOut, Home } from "lucide-react"
import type { Owner } from "@/lib/types"



export default function AsistentePage() {
  const router = useRouter()
  const [view, setView] = useState<"owners" | "owner-form" | "dogs">("owners")
  const [selectedOwner, setSelectedOwner] = useState<Owner | null>(null)
  const [editingOwner, setEditingOwner] = useState<Owner | null>(null)
  const [username, setUsername] = useState("")

  useEffect(() => {
    const userRole = localStorage.getItem("userRole")
    const storedUsername = localStorage.getItem("username")

    if (!userRole || userRole !== "asistente") {
      router.push("/")
      return
    }

    setUsername(storedUsername || "")
  }, [router])

  const handleLogout = () => {
    localStorage.removeItem("userRole")
    localStorage.removeItem("username")
    router.push("/")
  }

  const handleGoHome = () => {
    setSelectedOwner(null)
    setEditingOwner(null)
    setView("owners")
  }

  const handleNewOwner = () => {
    setEditingOwner(null)
    setView("owner-form")
  }

  const handleEditOwner = (owner: Owner) => {
    setEditingOwner(owner)
    setView("owner-form")
  }

  const handleViewDogs = (owner: Owner) => {
    setSelectedOwner(owner)
    setView("dogs")
  }

  const handleBackToOwners = () => {
    setSelectedOwner(null)
    setEditingOwner(null)
    setView("owners")
  }

  return (
    <main className="min-h-screen bg-background">
      <div className="border-b bg-[#1793a5] shadow-lg">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-8">
            <h1 className="text-2xl font-bold text-white">PROYECTO</h1>
          </div>
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              onClick={handleGoHome}
              className="gap-2 text-white hover:bg-white/20 hover:text-white"
            >
              <Home className="h-4 w-4" />
              Inicio
            </Button>
            <Button
              variant="ghost"
              onClick={handleLogout}
              className="gap-2 text-white hover:bg-white/20 hover:text-white"
            >
              <LogOut className="h-4 w-4" />
              Cerrar Sesión
            </Button>
          </div>
        </div>
      </div>

      <div className="container mx-auto py-8 px-4">
        {view === "owners" && (
          <OwnersTable onNewOwner={handleNewOwner} onEditOwner={handleEditOwner} onViewDogs={handleViewDogs} />
        )}

        {view === "owner-form" && (
          <OwnerForm owner={editingOwner} onBack={handleBackToOwners} onSave={handleBackToOwners} />
        )}

        {view === "dogs" && selectedOwner && <DogsView owner={selectedOwner} onBack={handleBackToOwners} />}
      </div>
    </main>
  )
}
