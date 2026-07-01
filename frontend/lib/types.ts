export type Owner = {
  id: string
  nombres: string
  apellidos: string
  tipoDocumento: string
  dni: string
  celular: string
  correo: string
  direccion: string
  sexo: "Masculino" | "Femenino"
  fechaNacimiento: string
  ubigeo?: string
  departamento?: string
  provincia?: string
  distrito?: string
}

export type Dog = {
  id: string
  ownerId: string
  especie: string // Campo añadido
  nombre: string
  raza: string
  fechaNacimiento: string
  sexo: "Macho" | "Hembra"
  estado: "Vivo" | "Muerto"
}

export type Evaluation = {
  id: string
  dogId: string
  fecha: string
  resultado: string
  comentarios: string
  categoria?: string
  gradoLevine?: string
  descripcionGrado?: string
  puntoAuscultacion?: string
  edadAtEvaluation?: number | null
}

export type UploadedData = {
  soploCardiaco: File | null
  puntoAuscultacion?: string
}

export type EvaluationData = {
  raza: string
  edad: number
  gradoLevine: string
  descripcionGrado: string
  esRiesgo: boolean
  datosResultado: string
  edad: number | null
  puntoAuscultacion?: string
}