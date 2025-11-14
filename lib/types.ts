
export type Owner = {
  id: string
  nombres: string
  apellidos: string
  dni: string
  celular: string
  correo: string
  direccion: string
  sexo: "Masculino" | "Femenino"
  fechaNacimiento: string
}

export type Dog = {
  id: string
  ownerId: string
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
}

export type UploadedData = {
  soploCardiaco: File | null
  radiografia: File | null
}

export type EvaluationData = {
  raza: string
  edad: number
  soploCardiaco: string
  esRiesgo: boolean
  datosResultado: string
}