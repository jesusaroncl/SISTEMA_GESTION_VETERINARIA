"use client"

import { useEffect, useState, useCallback } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer, Cell, LabelList,
  ComposedChart, Area, Line, ReferenceLine,
  PieChart, Pie, Sector,
} from "recharts"
import { Users, Dog, ClipboardList, Activity, TrendingUp, Brain, AlertCircle } from "lucide-react"
import { formatDateDDMMYYYY } from "@/lib/date-utils"

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://127.0.0.1:5000"

/* ── Paleta ─────────────────────────────────────────────── */
const GRADO_COLORS: Record<string, string> = {
  "AUSENTE": "#22c55e",
  "I /VI":   "#eab308",
  "II /VI":  "#f97316",
  "III /VI": "#ef4444",
}
const GRADO_BADGE: Record<string, string> = {
  "AUSENTE": "bg-green-100 text-green-800 border border-green-200",
  "I /VI":   "bg-yellow-100 text-yellow-800 border border-yellow-200",
  "II /VI":  "bg-orange-100 text-orange-800 border border-orange-200",
  "III /VI": "bg-red-100 text-red-800 border border-red-200",
}
const EDAD_COLORS  = ["#38bdf8", "#818cf8", "#fb923c", "#f87171"]
const RANGOS_EDAD  = ["0-2 años", "3-5 años", "6-8 años", "9+ años"]
const ORDEN_GRADOS = ["AUSENTE", "I /VI", "II /VI", "III /VI"]

/* ── Tipos ───────────────────────────────────────────────── */
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
    id: string; fecha: string | null; gradoLevine: string; perro: string; propietario: string
  }[]
}

/* ── Tooltip personalizado – Tendencia ───────────────────── */
const TooltipTendencia = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-white border border-gray-200 rounded-xl shadow-lg px-4 py-3 text-xs">
      <p className="font-semibold text-gray-700 mb-2">Semana {label}</p>
      {payload.map((p: any) => (
        <div key={p.dataKey} className="flex items-center gap-2 mb-1">
          <span className="w-2 h-2 rounded-full" style={{ background: p.color }} />
          <span className="text-gray-600">{p.name}:</span>
          <span className="font-bold text-gray-800">{p.value}</span>
        </div>
      ))}
      {payload.length === 2 && payload[0].value > 0 && (
        <div className="mt-2 pt-2 border-t border-gray-100 text-gray-500">
          Tasa: <span className="font-semibold text-orange-500">
            {Math.round((payload[1].value / payload[0].value) * 100)}%
          </span>
        </div>
      )}
    </div>
  )
}

/* ── Tooltip personalizado – Confianza ───────────────────── */
const TooltipConfianza = ({ active, payload }: any) => {
  if (!active || !payload?.length) return null
  const { grado, confianza } = payload[0].payload
  return (
    <div className="bg-white border border-gray-200 rounded-xl shadow-lg px-4 py-3 text-xs">
      <p className="font-semibold mb-1" style={{ color: GRADO_COLORS[grado] ?? "#6b7280" }}>
        Grado {grado}
      </p>
      <p className="text-gray-700">Confianza promedio: <strong>{confianza}%</strong></p>
      <p className="text-gray-400 mt-1">{confianza >= 80 ? "Alta precisión" : confianza >= 70 ? "Buena precisión" : "Precisión moderada"}</p>
    </div>
  )
}

/* ── Tooltip personalizado – Raza ────────────────────────── */
const TooltipRaza = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null
  const total = payload.reduce((s: number, p: any) => s + (p.value || 0), 0)
  return (
    <div className="bg-white border border-gray-200 rounded-xl shadow-lg px-4 py-3 text-xs min-w-[160px]">
      <p className="font-semibold text-gray-800 mb-2">{label}</p>
      {payload.map((p: any) => p.value > 0 && (
        <div key={p.dataKey} className="flex items-center justify-between gap-4 mb-1">
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full" style={{ background: p.fill }} />
            <span className="text-gray-600">{p.dataKey}</span>
          </div>
          <span className="font-bold">{p.value}</span>
        </div>
      ))}
      <div className="mt-2 pt-2 border-t border-gray-100 flex justify-between">
        <span className="text-gray-500">Total soplos</span>
        <span className="font-bold text-gray-800">{total}</span>
      </div>
    </div>
  )
}

/* ── Active Shape para PieChart ──────────────────────────── */
const renderActiveShape = (props: any) => {
  const {
    cx, cy, innerRadius, outerRadius, startAngle, endAngle,
    fill, payload, percent, value,
  } = props
  return (
    <g>
      <text x={cx} y={cy - 10} textAnchor="middle" fill="#111827" className="text-base font-bold" style={{ fontSize: 22, fontWeight: 700 }}>
        {value}
      </text>
      <text x={cx} y={cy + 18} textAnchor="middle" fill="#6b7280" style={{ fontSize: 11 }}>
        {payload.grado}
      </text>
      <Sector cx={cx} cy={cy} innerRadius={innerRadius} outerRadius={outerRadius + 8}
        startAngle={startAngle} endAngle={endAngle} fill={fill} />
      <Sector cx={cx} cy={cy} innerRadius={outerRadius + 12} outerRadius={outerRadius + 16}
        startAngle={startAngle} endAngle={endAngle} fill={fill} />
      <text x={cx} y={cy + 44} textAnchor="middle" fill={fill} style={{ fontSize: 13, fontWeight: 600 }}>
        {(percent * 100).toFixed(1)}%
      </text>
    </g>
  )
}

/* ── Leyenda personalizada – Pie ─────────────────────────── */
const LeyendaPie = ({ data, total }: { data: { grado: string; cantidad: number }[]; total: number }) => (
  <div className="flex flex-col gap-2 justify-center h-full pl-2">
    {data.filter(d => d.cantidad > 0).map((d) => (
      <div key={d.grado} className="flex items-center gap-2">
        <span className="w-3 h-3 rounded-sm flex-shrink-0" style={{ background: GRADO_COLORS[d.grado] }} />
        <span className="text-xs text-gray-700 font-medium flex-1">{d.grado}</span>
        <span className="text-xs font-bold text-gray-800">{d.cantidad}</span>
        <span className="text-xs text-gray-400">({total > 0 ? Math.round(d.cantidad / total * 100) : 0}%)</span>
      </div>
    ))}
  </div>
)

/* ── Label personalizado para barra de confianza ─────────── */
const LabelConfianza = (props: any) => {
  const { x, y, width, value } = props
  if (!value) return null
  return (
    <text x={x + width / 2} y={y - 6} textAnchor="middle" fill="#374151" fontSize={11} fontWeight={600}>
      {value}%
    </text>
  )
}

/* ══════════════════════════════════════════════════════════ */
export function VetDashboard({ username }: { username: string }) {
  const [data, setData]         = useState<DashboardData | null>(null)
  const [loading, setLoading]   = useState(true)
  const [error, setError]       = useState(false)
  const [activeGrado, setActiveGrado] = useState(0)

  useEffect(() => {
    const token = localStorage.getItem("access_token")
    fetch(`${API_BASE_URL}/api/dashboard`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => { if (!r.ok) throw new Error(); return r.json() })
      .then(setData)
      .catch(() => setError(true))
      .finally(() => setLoading(false))
  }, [])

  const onPieEnter = useCallback((_: any, index: number) => setActiveGrado(index), [])

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-3">
        <div className="w-8 h-8 border-4 border-[#1793a5] border-t-transparent rounded-full animate-spin" />
        <p className="text-muted-foreground text-sm">Cargando estadísticas...</p>
      </div>
    )
  }

  if (error || !data) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-3 text-muted-foreground">
        <AlertCircle className="w-10 h-10 text-red-400" />
        <p className="text-sm">No se pudieron cargar los datos del dashboard.</p>
      </div>
    )
  }

  /* ── Preparar datos ── */
  const distribucionData = ORDEN_GRADOS.map((g) => ({
    grado: g,
    cantidad: data.distribucionGrados[g] ?? 0,
  })).filter(d => d.cantidad > 0)

  const totalEvals = distribucionData.reduce((s, d) => s + d.cantidad, 0)

  const confianzaData = ORDEN_GRADOS
    .map((g) => data.confianzaPorGrado.find((c) => c.grado === g))
    .filter(Boolean) as { grado: string; confianza: number }[]

  const totalSoplosRaza = data.soplosPorRaza.map((r) => ({
    ...r,
    _total: RANGOS_EDAD.reduce((s, rng) => s + ((r[rng] as number) || 0), 0),
  }))

  return (
    <div className="space-y-6">

      {/* ── Encabezado ── */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Bienvenido, {username}</h2>
          <p className="text-sm text-muted-foreground mt-0.5">
            Panel estadístico · Sistema de Gestión Veterinaria
          </p>
        </div>
        <span className="hidden sm:inline-block text-xs text-muted-foreground bg-muted px-3 py-1 rounded-full">
          Datos en tiempo real
        </span>
      </div>

      {/* ── Tarjetas KPI ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Propietarios", value: data.totalPropietarios, icon: Users,        color: "text-[#1793a5]", bg: "bg-[#1793a5]/10" },
          { label: "Pacientes Caninos", value: data.totalPerros,  icon: Dog,          color: "text-violet-600", bg: "bg-violet-100" },
          { label: "Evaluaciones",    value: data.totalEvaluaciones, icon: ClipboardList, color: "text-blue-600", bg: "bg-blue-100" },
          { label: "Tasa de Hallazgo", value: `${data.tasaHallazgo}%`, icon: Activity, color: "text-orange-500", bg: "bg-orange-100", sub: "soplos detectados" },
        ].map(({ label, value, icon: Icon, color, bg, sub }) => (
          <Card key={label} className="border-0 shadow-sm hover:shadow-md transition-shadow">
            <CardContent className="pt-5 pb-4">
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider truncate">{label}</p>
                  <p className={`text-3xl font-extrabold mt-1 ${color}`}>{value}</p>
                  {sub && <p className="text-xs text-muted-foreground mt-0.5">{sub}</p>}
                </div>
                <div className={`${bg} p-2.5 rounded-xl flex-shrink-0`}>
                  <Icon className={`h-5 w-5 ${color}`} />
                </div>
              </div>
              {/* Barra de progreso para tasa */}
              {label === "Tasa de Hallazgo" && (
                <div className="mt-3 h-1.5 bg-orange-100 rounded-full overflow-hidden">
                  <div className="h-full bg-orange-400 rounded-full transition-all duration-700"
                    style={{ width: `${Math.min(data.tasaHallazgo, 100)}%` }} />
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* ── Fila 2: Distribución (Donut) + Tendencia semanal ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

        {/* Distribución Grado Levine — Donut interactivo */}
        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-1">
            <CardTitle className="text-sm font-semibold text-gray-800">Distribución por Grado Levine</CardTitle>
            <CardDescription className="text-xs">Hover para ver detalle de cada grado</CardDescription>
          </CardHeader>
          <CardContent>
            {distribucionData.length > 0 ? (
              <div className="flex items-center gap-4">
                <ResponsiveContainer width={200} height={200}>
                  <PieChart>
                    <Pie
                      activeIndex={activeGrado}
                      activeShape={renderActiveShape}
                      data={distribucionData}
                      dataKey="cantidad"
                      nameKey="grado"
                      cx="50%"
                      cy="50%"
                      innerRadius={58}
                      outerRadius={80}
                      onMouseEnter={onPieEnter}
                    >
                      {distribucionData.map((entry, i) => (
                        <Cell key={i} fill={GRADO_COLORS[entry.grado]} stroke="white" strokeWidth={2} />
                      ))}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
                <div className="flex-1">
                  <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">Leyenda</p>
                  <LeyendaPie data={distribucionData} total={totalEvals} />
                  <div className="mt-3 pt-3 border-t border-gray-100">
                    <p className="text-xs text-gray-500">Total evaluaciones</p>
                    <p className="text-xl font-bold text-gray-800">{totalEvals}</p>
                  </div>
                </div>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground py-8 text-center">Sin datos aún</p>
            )}
          </CardContent>
        </Card>

        {/* Tendencia semanal — Area + Line */}
        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-1">
            <CardTitle className="text-sm font-semibold text-gray-800">Tendencia Semanal de Hallazgos</CardTitle>
            <CardDescription className="text-xs">Total de casos vs casos con soplo — últimas 10 semanas</CardDescription>
          </CardHeader>
          <CardContent>
            {data.tendenciaSemanal.length > 0 ? (
              <ResponsiveContainer width="100%" height={220}>
                <ComposedChart data={data.tendenciaSemanal} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
                  <defs>
                    <linearGradient id="gradTotal" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%"  stopColor="#1793a5" stopOpacity={0.25} />
                      <stop offset="95%" stopColor="#1793a5" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="gradSoplo" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%"  stopColor="#ef4444" stopOpacity={0.15} />
                      <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="4 4" stroke="#f0f0f0" vertical={false} />
                  <XAxis dataKey="semana" tick={{ fontSize: 11, fill: "#9ca3af" }} axisLine={false} tickLine={false} />
                  <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: "#9ca3af" }} axisLine={false} tickLine={false} />
                  <Tooltip content={<TooltipTendencia />} />
                  <Legend
                    wrapperStyle={{ fontSize: 11, paddingTop: 8 }}
                    formatter={(value) => <span style={{ color: "#374151" }}>{value}</span>}
                  />
                  <Area
                    type="monotone" dataKey="total" name="Total casos"
                    stroke="#1793a5" strokeWidth={2.5}
                    fill="url(#gradTotal)"
                    dot={{ r: 4, fill: "#1793a5", strokeWidth: 2, stroke: "white" }}
                    activeDot={{ r: 6, fill: "#1793a5" }}
                  />
                  <Line
                    type="monotone" dataKey="conSoplo" name="Con soplo"
                    stroke="#ef4444" strokeWidth={2.5} strokeDasharray="5 3"
                    dot={{ r: 4, fill: "#ef4444", strokeWidth: 2, stroke: "white" }}
                    activeDot={{ r: 6, fill: "#ef4444" }}
                  />
                </ComposedChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-sm text-muted-foreground py-8 text-center">Sin datos en las últimas 10 semanas</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* ── Fila 3: Raza/Edad + Confianza CNN ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

        {/* Soplos por Raza y Rango de Edad */}
        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-1">
            <CardTitle className="text-sm font-semibold text-gray-800">Soplos por Raza y Rango de Edad</CardTitle>
            <CardDescription className="text-xs">Solo evaluaciones con soplo detectado (grado ≠ AUSENTE)</CardDescription>
          </CardHeader>
          <CardContent>
            {data.soplosPorRaza.length > 0 ? (
              <ResponsiveContainer width="100%" height={260}>
                <BarChart
                  layout="vertical"
                  data={totalSoplosRaza}
                  margin={{ top: 5, right: 45, left: 10, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="4 4" horizontal={false} stroke="#f0f0f0" />
                  <XAxis type="number" allowDecimals={false} tick={{ fontSize: 11, fill: "#9ca3af" }} axisLine={false} tickLine={false} />
                  <YAxis
                    type="category" dataKey="raza" width={120}
                    tick={{ fontSize: 10, fill: "#374151" }} axisLine={false} tickLine={false}
                  />
                  <Tooltip content={<TooltipRaza />} />
                  <Legend
                    wrapperStyle={{ fontSize: 11, paddingTop: 8 }}
                    formatter={(value) => <span style={{ color: "#374151" }}>{value}</span>}
                  />
                  {RANGOS_EDAD.map((rango, i) => (
                    <Bar key={rango} dataKey={rango} stackId="a" fill={EDAD_COLORS[i]}
                      radius={i === RANGOS_EDAD.length - 1 ? [0, 4, 4, 0] : [0, 0, 0, 0]}>
                      {/* Etiqueta de total al final de la última barra */}
                      {i === RANGOS_EDAD.length - 1 && (
                        <LabelList
                          dataKey="_total"
                          position="right"
                          style={{ fontSize: 11, fontWeight: 700, fill: "#374151" }}
                        />
                      )}
                    </Bar>
                  ))}
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-sm text-muted-foreground py-8 text-center">Sin soplos registrados</p>
            )}
          </CardContent>
        </Card>

        {/* Confianza Promedio del Modelo CNN */}
        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-1">
            <div className="flex items-start justify-between gap-2">
              <div>
                <CardTitle className="text-sm font-semibold text-gray-800 flex items-center gap-1.5">
                  <Brain className="h-4 w-4 text-violet-500" />
                  Confianza del Modelo CNN
                </CardTitle>
                <CardDescription className="text-xs mt-0.5">Precisión promedio por grado Levine</CardDescription>
              </div>
              {data.confianzaGeneral > 0 && (
                <div className="text-right flex-shrink-0">
                  <p className="text-xs text-muted-foreground">Promedio general</p>
                  <p className="text-xl font-extrabold text-violet-600">{data.confianzaGeneral}%</p>
                </div>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {confianzaData.length > 0 ? (
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={confianzaData} margin={{ top: 20, right: 10, left: -15, bottom: 5 }}>
                  <defs>
                    {confianzaData.map((d) => (
                      <linearGradient key={d.grado} id={`gradConf_${d.grado.replace(/\s|\//g, "_")}`} x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%"   stopColor={GRADO_COLORS[d.grado]} stopOpacity={1} />
                        <stop offset="100%" stopColor={GRADO_COLORS[d.grado]} stopOpacity={0.55} />
                      </linearGradient>
                    ))}
                  </defs>
                  <CartesianGrid strokeDasharray="4 4" vertical={false} stroke="#f0f0f0" />
                  <XAxis dataKey="grado" tick={{ fontSize: 11, fill: "#6b7280" }} axisLine={false} tickLine={false} />
                  <YAxis domain={[0, 100]} unit="%" tick={{ fontSize: 11, fill: "#9ca3af" }} axisLine={false} tickLine={false} />
                  <Tooltip content={<TooltipConfianza />} />
                  <Legend
                    wrapperStyle={{ fontSize: 11, paddingTop: 4 }}
                    payload={[{ value: "Confianza promedio (%)", type: "square", color: "#8b5cf6" }]}
                  />
                  {data.confianzaGeneral > 0 && (
                    <ReferenceLine
                      y={data.confianzaGeneral} stroke="#8b5cf6" strokeDasharray="5 3" strokeWidth={1.5}
                      label={{ value: `Prom. ${data.confianzaGeneral}%`, position: "insideTopRight", fontSize: 10, fill: "#8b5cf6" }}
                    />
                  )}
                  <Bar dataKey="confianza" name="Confianza %" radius={[6, 6, 0, 0]} maxBarSize={60}>
                    <LabelList content={<LabelConfianza />} />
                    {confianzaData.map((d) => (
                      <Cell key={d.grado} fill={`url(#gradConf_${d.grado.replace(/\s|\//g, "_")})`} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="py-8 text-center">
                <Brain className="w-8 h-8 text-muted-foreground/30 mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">Sin datos de confianza aún.</p>
                <p className="text-xs text-muted-foreground mt-1">Se registrará con las nuevas evaluaciones de audio.</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* ── Tabla de últimas evaluaciones ── */}
      <Card className="border-0 shadow-sm">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-sm font-semibold text-gray-800">Últimas Evaluaciones</CardTitle>
              <CardDescription className="text-xs">Las 5 evaluaciones más recientes registradas</CardDescription>
            </div>
            <TrendingUp className="w-4 h-4 text-muted-foreground" />
          </div>
        </CardHeader>
        <CardContent>
          {data.evaluacionesRecientes.length === 0 ? (
            <p className="text-sm text-muted-foreground py-4 text-center">Sin evaluaciones registradas.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100">
                    <th className="text-left py-2.5 pr-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">#</th>
                    <th className="text-left py-2.5 pr-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Fecha</th>
                    <th className="text-left py-2.5 pr-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Paciente</th>
                    <th className="text-left py-2.5 pr-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Propietario</th>
                    <th className="text-left py-2.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Resultado</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {data.evaluacionesRecientes.map((ev, i) => (
                    <tr key={ev.id} className="hover:bg-gray-50/80 transition-colors">
                      <td className="py-3 pr-4 text-xs text-muted-foreground font-mono">{i + 1}</td>
                      <td className="py-3 pr-4 text-xs text-gray-600 whitespace-nowrap">
                        {ev.fecha ? formatDateDDMMYYYY(ev.fecha) : "—"}
                      </td>
                      <td className="py-3 pr-4 font-semibold text-gray-800">{ev.perro}</td>
                      <td className="py-3 pr-4 text-gray-500 text-xs">{ev.propietario}</td>
                      <td className="py-3">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${GRADO_BADGE[ev.gradoLevine] ?? "bg-gray-100 text-gray-800 border border-gray-200"}`}>
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
