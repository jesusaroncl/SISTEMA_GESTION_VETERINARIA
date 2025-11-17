"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ArrowLeft } from "lucide-react"
import { DogsTable } from "@/components/dogs-table" // <-- Se usa el componente refactorizado
import { DogForm } from "@/components/dog-form"
import type { Owner, Dog } from "@/lib/types"

type DogsViewProps = {
  owner: Owner
  onBack: () => void
}

export function DogsView({ owner, onBack }: DogsViewProps) {
  const [view, setView] = useState<"table" | "form">("table")
  const [editingDog, setEditingDog] = useState<Dog | null>(null)

  const handleNewDog = () => {
    setEditingDog(null)
    setView("form")
  }

  const handleEditDog = (dog: Dog) => {
    setEditingDog(dog)
    setView("form")
  }

  const handleBackToTable = () => {
    setEditingDog(null)
    setView("table")
  }

  return (
    <div>
      {view === "table" ? (
        <Card>
          <CardHeader>
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="icon" onClick={onBack}>
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <div>
                <CardTitle className="text-2xl font-bold">
                  Perros de {owner.nombres} {owner.apellidos}
                </CardTitle>
                <p className="text-sm text-muted-foreground mt-1">
                  DNI: {owner.dni} | Celular: {owner.celular}
                </p>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {/* Se pasa el rol "asistente" y los callbacks de edición */}
            <DogsTable
              ownerId={owner.id}
              role="asistente" 
              onNewDog={handleNewDog}
              onEditDog={handleEditDog}
            />
          </CardContent>
        </Card>
      ) : (
        <DogForm
          dog={editingDog}
          ownerId={owner.id}
          ownerName={`${owner.nombres} ${owner.apellidos}`}
          onBack={handleBackToTable}
          onSave={handleBackToTable}
        />
      )}
    </div>
  )
}