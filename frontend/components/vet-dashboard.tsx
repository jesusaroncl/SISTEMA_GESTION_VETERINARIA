"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  LineChart, Line, ResponsiveContainer, Cell,
} from "recharts"
import { Users, Dog, ClipboardList, Activity } from "lucide-react"
import { formatDateDDMMYYYY } from "@/lib/date-utils"

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://127.0.0.1:9000"

const GRADO_COLORS: Record<string, string> = {
  "AUSENTE":  "#22c55e",
  "I /VI":    "#eab308",
  "II /VI":   "#f97316",
  "III /VI":  "#ef4444",
}
const GRADO_BADGE: Record<string, string> = {
  "AUSENTE":  "bg-green-100 text-green-800",
  "I /VI":    "bg-yellow-100 text-yellow-800",
  "II /VI":   "bg-orange-100 text-orange-800",
  "III /VI":  "bg-red-100 text-red-800",
}
const EDAD_COLORS = ["#60a5fa", "#a78bfa", "#fb923c", "#f87171"]
const RANGOS_EDAD = ["0-2 años", "3-5 años", "6-8 años", "9+ años"]
const ORDEN_GRADOS = ["AUSENTE", "I /VI", "II /VI", "III /VI"]

type DashboardData = {
  totalPropietarios: number
  totalPerros: number
  totalEvaluaciones: number
  tasaHallazgo: number
  distribucionGrados: Record<string, number>
  tendenciaSemanal: { semana: string; total: number; conSoplo: number }[]
  soplosPorRaza: Record<string, number | string>[]
  confianzaPorGrado: { grado: string; confianza: number }[]
  confianzaGeneral: number
  evaluacionesRecientes: {
    id: string
    fecha: string | null
    gradoLevine: string
    perro: string
    propietario: string
  }[]
}

export function VetDashboard({ username }: { username: string }) {
  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const token = localStorage.getItem("access_token")
    fetch(`${API_BASE_URL}/api/dashboard`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => r.json())
      .then(setData)
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <p className="text-muted-foreground">Cargando dashboard...</p>
      </div>
    )
  }

  // Preparar datos para gráficos
  const distribucionData = ORDEN_GRADOS.map((g) => ({
    grado: g,
    cantidad: data?.distribucionGrados[g] ?? 0,
    color: GRADO_COLORS[g],
  }))

  const confianzaOrdenada = ORDEN_GRADOS
    .map((g) => data?.confianzaPorGrado.find((c) => c.grado === g))
    .filter(Boolean) as { grado: string; confianza: number }[]

  return (
    <div className="space-y-6">
      {/* Bienvenida */}
      <div>
        <h2 className="text-2xl font-bold text-gray-800">Bienvenido, {username}</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Panel de estadísticas del Sistema de Gestión Veterinaria
        </p>
      </div>

      {/* ── Tarjetas resumen ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">Propietarios</p>
                <p className="text-3xl font-bold mt-1">{data?.totalPropietarios ?? 0}</p>
              </div>
              <div className="bg-[#1793a5]/10 p-3 rounded-full">
                <Users className="h-5 w-5 text-[#1793a5]" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">Pacientes Caninos</p>
                <p className="text-3xl font-bold mt-1">{data?.totalPerros ?? 0}</p>
              </div>
              <div className="bg-[#1793a5]/10 p-3 rounded-full">
                <Dog className="h-5 w-5 text-[#1793a5]" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">Total Evaluaciones</p>
                <p className="text-3xl font-bold mt-1">{data?.totalEvaluaciones ?? 0}</p>
              </div>
              <div className="bg-[#1793a5]/10 p-3 rounded-full">
                <ClipboardList className="h-5 w-5 text-[#1793a5]" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">Tasa de Hallazgo</p>
                <p className="text-3xl font-bold mt-1 text-orange-500">{data?.tasaHallazgo ?? 0}%</p>
                <p className="text-xs text-muted-foreground">soplos detectados</p>
              </div>
              <div className="bg-orange-100 p-3 rounded-full">
                <Activity className="h-5 w-5 text-orange-500" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ── Fila 2: Distribución grados + Tendencia semanal ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Distribución por grado Levine */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold">Distribución por Grado Levine</CardTitle>
          </CardHeader>
          <CardContent>
            {data && Object.keys(data.distribucionGrados).length > 0 ? (
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={distribucionData} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                  <XAxis dataKey="grado" tick={{ fontSize: 11 }} />
                  <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                  <Tooltip
                    formatter={(value) => [`${value} evaluaciones`, "Cantidad"]}
                    contentStyle={{ fontSize: 12, borderRadius: 8 }}
                  />
                  <Bar dataKey="cantidad" radius={[4, 4, 0, 0]}>
                    {distribucionData.map((entry, i) => (
                      <Cell key={i} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-sm text-muted-foreground py-8 text-center">Sin datos aún</p>
            )}
          </CardContent>
        </Card>

        {/* Tendencia semanal */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold">Tendencia Semanal de Hallazgos</CardTitle>
          </CardHeader>
          <CardContent>
            {data && data.tendenciaSemanal.length > 0 ? (
              <ResponsiveContainer width="100%" height={220}>
                <LineChart data={data.tendenciaSemanal} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="semana" tick={{ fontSize: 11 }} />
                  <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                  <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <Line
                    type="monotone"
                    dataKey="total"
                    name="Total casos"
                    stroke="#1793a5"
                    strokeWidth={2}
                    dot={{ r: 4 }}
                    activeDot={{ r: 6 }}
                  />
                  <Line
                    type="monotone"
                    dataKey="conSoplo"
                    name="Con soplo"
                    stroke="#ef4444"
                    strokeWidth={2}
                    dot={{ r: 4 }}
                    activeDot={{ r: 6 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-sm text-muted-foreground py-8 text-center">Sin datos en las últimas 10 semanas</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* ── Fila 3: Soplos por raza+edad + Confianza CNN ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Soplos por raza y rango de edad */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold">Soplos por Raza y Rango de Edad</CardTitle>
          </CardHeader>
          <CardContent>
            {data && data.soplosPorRaza.length > 0 ? (
              <ResponsiveContainer width="100%" height={240}>
                <BarChart
                  layout="vertical"
                  data={data.soplosPorRaza}
                  margin={{ top: 5, right: 20, left: 5, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f0f0f0" />
                  <XAxis type="number" allowDecimals={false} tick={{ fontSize: 11 }} />
                  <YAxis
                    type="category"
                    dataKey="raza"
                    width={110}
                    tick={{ fontSize: 10 }}
                  />
                  <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  {RANGOS_EDAD.map((rango, i) => (
                    <Bar key={rango} dataKey={rango} stackId="a" fill={EDAD_COLORS[i]} radius={i === RANGOS_EDAD.length - 1 ? [0, 4, 4, 0] : [0, 0, 0, 0]} />
                  ))}
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-sm text-muted-foreground py-8 text-center">Sin soplos registrados</p>
            )}
          </CardContent>
        </Card>

        {/* Nivel de confianza del modelo CNN */}
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-semibold">Nivel de Confianza del Modelo CNN</CardTitle>
              {data && data.confianzaGeneral > 0 && (
                <span className="text-xs bg-[#1793a5]/10 text-[#1793a5] font-semibold px-2 py-0.5 rounded-full">
                  Prom. general: {data.confianzaGeneral}%
                </span>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {data && confianzaOrdenada.length > 0 ? (
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={confianzaOrdenada} margin={{ top: 5, right: 10, left: -10, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                  <XAxis dataKey="grado" tick={{ fontSize: 11 }} />
                  <YAxis domain={[0, 100]} unit="%" tick={{ fontSize: 11 }} />
                  <Tooltip
                    formatter={(value) => [`${value}%`, "Confianza promedio"]}
                    contentStyle={{ fontSize: 12, borderRadius: 8 }}
                  />
                  <Bar dataKey="confianza" name="Confianza %" radius={[4, 4, 0, 0]}>
                    {confianzaOrdenada.map((entry, i) => (
                      <Cell key={i} fill={GRADO_COLORS[entry.grado] ?? "#1793a5"} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="py-8 text-center">
                <p className="text-sm text-muted-foreground">Sin datos de confianza aún.</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Se registrará con las nuevas evaluaciones de audio.
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* ── Últimas evaluaciones ── */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold">Últimas Evaluaciones</CardTitle>
        </CardHeader>
        <CardContent>
          {!data || data.evaluacionesRecientes.length === 0 ? (
            <p className="text-sm text-muted-foreground">Sin evaluaciones aún.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-muted-foreground text-xs uppercase tracking-wide">
                    <th className="text-left py-2 pr-4 font-medium">Fecha</th>
                    <th className="text-left py-2 pr-4 font-medium">Perro</th>
                    <th className="text-left py-2 pr-4 font-medium">Propietario</th>
                    <th className="text-left py-2 font-medium">Grado Levine</th>
                  </tr>
                </thead>
                <tbody>
                  {data.evaluacionesRecientes.map((ev) => (
                    <tr key={ev.id} className="border-b last:border-0 hover:bg-muted/30">
                      <td className="py-2 pr-4 whitespace-nowrap text-xs">
                        {ev.fecha ? formatDateDDMMYYYY(ev.fecha) : "—"}
                      </td>
                      <td className="py-2 pr-4 font-medium">{ev.perro}</td>
                      <td className="py-2 pr-4 text-muted-foreground">{ev.propietario}</td>
                      <td className="py-2">
                        <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${GRADO_BADGE[ev.gradoLevine] ?? "bg-gray-100 text-gray-800"}`}>
                          {ev.gradoLevine}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
