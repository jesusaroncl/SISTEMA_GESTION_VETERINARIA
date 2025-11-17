"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ArrowLeft } from "lucide-react"
import { DogsTable } from "@/components/dogs-table" // <-- Se usa el componente refactorizado
import type { Owner, Dog } from "@/lib/types"

type VetDogsViewProps = {
  owner: Owner
  onBack: () => void
  onViewEvaluations: (dog: Dog) => void
}

export function VetDogsView({ owner, onBack, onViewEvaluations }: VetDogsViewProps) {
  return (
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
            <p className="text-sm text-muted-foreground mt-1">DNI: {owner.dni}</p>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {/* Se pasa el rol "veterinario" y el callback de evaluaciones.
          No se pasan onNewDog/onEditDog porque no son necesarios aquí.
        */}
        <DogsTable 
            ownerId={owner.id} 
            role="veterinario"
            onViewEvaluations={onViewEvaluations} 
        />
      </CardContent>
    </Card>
  )
}