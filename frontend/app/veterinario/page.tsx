"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { VetOwnersTable } from "@/components/vet-owners-table"
import { VetDogsView } from "@/components/vet-dogs-view"
import { EvaluationsView } from "@/components/evaluations-view"
import { DataUploadForm } from "@/components/data-upload-form"
import { NewEvaluationForm } from "@/components/new-evaluation-form"
import { EvaluationResult } from "@/components/evaluation-result"
import { Button } from "@/components/ui/button"
import { LogOut, Home } from "lucide-react"
import type { Owner, Dog, Evaluation, EvaluationData, UploadedData } from "@/lib/types"


export default function VeterinarioPage() {
  const router = useRouter()
  const [username, setUsername] = useState("")
  const [view, setView] = useState<"owners" | "dogs" | "evaluations" | "upload" | "new-evaluation" | "result">("owners")
  const [selectedOwner, setSelectedOwner] = useState<Owner | null>(null)
  const [selectedDog, setSelectedDog] = useState<Dog | null>(null)
  const [uploadedData, setUploadedData] = useState<UploadedData | null>(null)
  const [evaluationData, setEvaluationData] = useState<EvaluationData | null>(null)
  const [evaluationResult, setEvaluationResult] = useState<Evaluation | null>(null)

  useEffect(() => {
    const userRole = localStorage.getItem("userRole")
    const storedUsername = localStorage.getItem("username")

    if (!userRole || userRole !== "veterinario") {
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
    setSelectedDog(null)
    setUploadedData(null)
    setEvaluationData(null)
    setEvaluationResult(null)
    setView("owners")
  }

  const handleViewDogs = (owner: Owner) => {
    setSelectedOwner(owner)
    setView("dogs")
  }

  const handleViewEvaluations = (dog: Dog) => {
    setSelectedDog(dog)
    setView("evaluations")
  }

  const handleNewEvaluation = () => {
    setView("upload")
  }

  const handleDataUploaded = (data: UploadedData) => {
    setUploadedData(data)
    const mockEvaluationData: EvaluationData = {
      raza: selectedDog?.raza || "",
      edad: selectedDog ? calculateAge(selectedDog.fechaNacimiento) : 0,
      soploCardiaco: "Grado II/VI",
      esRiesgo: false,
      datosResultado: "soplo cardiaco leve, sin signos de insuficiencia cardiaca",
    }
    setEvaluationData(mockEvaluationData)
    setView("new-evaluation")
  }

  const handleEvaluate = (data: EvaluationData) => {
    const mockResult: Evaluation = {
      id: `EV${Date.now()}`,
      dogId: selectedDog?.id || "",
      fecha: new Date().toISOString().split("T")[0],
      resultado: data.esRiesgo ? "Alto Riesgo" : "Riesgo Moderado",
      comentarios: `Paciente de ${data.edad} años, raza ${data.raza}. ${data.soploCardiaco}. ${data.datosResultado}. ${data.esRiesgo ? "Se recomienda seguimiento inmediato." : "Continuar con monitoreo regular."}`,
    }
    setEvaluationResult(mockResult)
    setView("result")
  }

  const handleBackToOwners = () => {
    setSelectedOwner(null)
    setSelectedDog(null)
    setUploadedData(null)
    setEvaluationData(null)
    setEvaluationResult(null)
    setView("owners")
  }

  const handleBackToDogs = () => {
    setSelectedDog(null)
    setUploadedData(null)
    setEvaluationData(null)
    setEvaluationResult(null)
    setView("dogs")
  }

  const handleBackToEvaluations = () => {
    setUploadedData(null)
    setEvaluationData(null)
    setEvaluationResult(null)
    setView("evaluations")
  }

  const calculateAge = (birthDate: string) => {
    const today = new Date()
    const birth = new Date(birthDate)
    let age = today.getFullYear() - birth.getFullYear()
    const monthDiff = today.getMonth() - birth.getMonth()
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--
    }
    return age
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
        {view === "owners" && <VetOwnersTable onViewDogs={handleViewDogs} />}

        {view === "dogs" && selectedOwner && (
          <VetDogsView owner={selectedOwner} onBack={handleBackToOwners} onViewEvaluations={handleViewEvaluations} />
        )}

        {view === "evaluations" && selectedDog && (
          <EvaluationsView dog={selectedDog} onBack={handleBackToDogs} onNewEvaluation={handleNewEvaluation} />
        )}

        {view === "upload" && <DataUploadForm onBack={handleBackToEvaluations} onProcess={handleDataUploaded} />}

        {view === "new-evaluation" && evaluationData && (
          <NewEvaluationForm data={evaluationData} onBack={handleBackToEvaluations} onEvaluate={handleEvaluate} />
        )}

        {view === "result" && evaluationResult && (
          <EvaluationResult evaluation={evaluationResult} onFinish={handleBackToEvaluations} />
        )}
      </div>
    </main>
  )
}
