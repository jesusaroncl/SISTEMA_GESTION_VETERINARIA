"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
// import { VetOwnersTable } from "@/components/vet-owners-table" // Ya no se usa
import { OwnersTable } from "@/components/owners-table" // Se usa la refactorizada
import { VetDogsView } from "@/components/vet-dogs-view" // Se usa la refactorizada
import { EvaluationsView } from "@/components/evaluations-view"
import { DataUploadForm } from "@/components/data-upload-form"
import { NewEvaluationForm } from "@/components/new-evaluation-form"
import { EvaluationResult } from "@/components/evaluation-result"
import { Button } from "@/components/ui/button"
import { LogOut, Home } from "lucide-react"
import type { Owner, Dog, Evaluation, EvaluationData, UploadedData } from "@/lib/types"

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL

export default function VeterinarioPage() {
  const router = useRouter()
  const [username, setUsername] = useState("")
  const [view, setView] = useState<"owners" | "dogs" | "evaluations" | "upload" | "new-evaluation" | "result">("owners")
  const [selectedOwner, setSelectedOwner] = useState<Owner | null>(null)
  const [selectedDog, setSelectedDog] = useState<Dog | null>(null)
  const [uploadedData, setUploadedData] = useState<UploadedData | null>(null)
  const [evaluationData, setEvaluationData] = useState<EvaluationData | null>(null)
  const [evaluationResult, setEvaluationResult] = useState<Evaluation | null>(null)
  const [isProcessing, setIsProcessing] = useState(false) 

  useEffect(() => {
    const userRole = localStorage.getItem("userRole")
    const storedUsername = localStorage.getItem("username")

    if (!userRole || userRole !== "veterinario") {
      router.push("/")
      return
    }

    setUsername(storedUsername || "")
  }, [router])

  const getAuthToken = () => {
    return typeof window !== "undefined" ? localStorage.getItem("access_token") : null
  }

  const handleLogout = () => {
    localStorage.removeItem("userRole")
    localStorage.removeItem("username")
    localStorage.removeItem("access_token")
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

  const handleDataUploaded = async (data: UploadedData) => {
    if (!data.soploCardiaco || !selectedDog) {
        alert("No se seleccionó ningún archivo o perro.")
        return
    }

    setIsProcessing(true)
    const token = getAuthToken()
    const formData = new FormData()
    formData.append("soplo_cardiaco", data.soploCardiaco)

    try {
        const response = await fetch(
            `${API_BASE_URL}/api/dogs/${selectedDog.id}/evaluate_audio`, 
            {
                method: "POST",
                headers: { "Authorization": `Bearer ${token}` },
                body: formData,
            }
        )
        const resultData = await response.json()
        if (!response.ok) throw new Error(resultData.msg || "Error en el servidor de ML")

        setEvaluationData(resultData as EvaluationData)
        setView("new-evaluation")

    } catch (e) {
        alert(e instanceof Error ? e.message : "Error al procesar el audio.")
    } finally {
        setIsProcessing(false)
    }
  }

  const handleEvaluate = async (data: EvaluationData) => {
    if (!selectedDog) {
        alert("Error: No hay un perro seleccionado.");
        return;
    }
    const token = getAuthToken();
    if (!token) {
        alert("Error de autenticación.");
        return;
    }

    try {
        const response = await fetch(`${API_BASE_URL}/api/evaluations`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
                dogId: selectedDog.id,
                evaluationData: data
            })
        });

        const savedEvaluation = await response.json();
        if (!response.ok) throw new Error(savedEvaluation.msg || "Error al guardar la evaluación.");

        setEvaluationResult(savedEvaluation as Evaluation);
        setView("result");

    } catch (e) {
        alert(e instanceof Error ? e.message : "Error de conexión.");
    }
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

  // calculateAge no es necesario en esta página, pero lo dejamos por si acaso.
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
        {view === "owners" && (
            <OwnersTable
                role="veterinario" 
                onViewDogs={handleViewDogs}
                onNewOwner={() => {}} // No usado por el veterinario
                onEditOwner={() => {}} // No usado por el veterinario
            />
        )}

        {view === "dogs" && selectedOwner && (
          <VetDogsView 
            owner={selectedOwner} 
            onBack={handleBackToOwners} 
            onViewEvaluations={handleViewEvaluations} 
          />
        )}

        {view === "evaluations" && selectedDog && (
          <EvaluationsView 
            dog={selectedDog} 
            onBack={handleBackToDogs} 
            onNewEvaluation={handleNewEvaluation} 
          />
        )}

        {view === "upload" && (
            isProcessing ? (
                <div className="text-center p-8">
                    <p className="text-lg font-semibold">Procesando audio...</p>
                    <p>El modelo de IA está analizando el soplo cardiaco. Esto puede tardar un momento.</p>
                </div>
            ) : (
                <DataUploadForm onBack={handleBackToEvaluations} onProcess={handleDataUploaded} />
            )
        )}

        {view === "new-evaluation" && evaluationData && (
          <NewEvaluationForm 
            data={evaluationData} 
            onBack={handleBackToEvaluations} 
            onEvaluate={handleEvaluate} 
          />
        )}

        {view === "result" && evaluationResult && (
          <EvaluationResult 
            evaluation={evaluationResult} 
            onFinish={handleBackToEvaluations} 
          />
        )}
      </div>
    </main>
  )
}