"use client"

import { useEffect, useState, useCallback } from "react"
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer, Cell, LabelList,
  ComposedChart, Area, Line, ReferenceLine,
  PieChart, Pie, Sector,
} from "recharts"
import { Users, Dog, ClipboardList, Activity, TrendingUp, Brain, AlertCircle, RefreshCw } from "lucide-react"
import { formatDateDDMMYYYY } from "@/lib/date-utils"

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://127.0.0.1:5000"

/* ─── Paleta ──────────────────────────────────────────────── */
const GRADO_COLORS: Record<string, string> = {
  "AUSENTE": "#10b981",
  "I /VI":   "#f59e0b",
  "II /VI":  "#f97316",
  "III /VI": "#ef4444",
}
const GRADO_BADGE_CLS: Record<string, string> = {
  "AUSENTE": "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200",
  "I /VI":   "bg-amber-50  text-amber-700  ring-1 ring-amber-200",
  "II /VI":  "bg-orange-50 text-orange-700 ring-1 ring-orange-200",
  "III /VI": "bg-red-50    text-red-700    ring-1 ring-red-200",
}
const EDAD_COLORS  = ["#38bdf8", "#818cf8", "#fb923c", "#f87171"]
const RANGOS_EDAD  = ["0-2 años", "3-5 años", "6-8 años", "9+ años"]
const ORDEN_GRADOS = ["AUSENTE", "I /VI", "II /VI", "III /VI"]

/* ─── Tipo de datos ───────────────────────────────────────── */
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

/* ─── Tooltips ────────────────────────────────────────────── */
const TooltipTendencia = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null
  const tasa = payload[0].value > 0
    ? Math.round((payload[1]?.value / payload[0].value) * 100)
    : 0
  return (
    <div className="bg-white/95 backdrop-blur-sm border border-slate-100 rounded-2xl shadow-xl px-4 py-3 text-xs min-w-[160px]">
      <p className="font-semibold text-slate-500 mb-2.5 uppercase tracking-wider">Semana {label}</p>
      {payload.map((p: any) => (
        <div key={p.dataKey} className="flex items-center justify-between gap-6 mb-1.5">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full" style={{ background: p.color }} />
            <span className="text-slate-600">{p.name}</span>
          </div>
          <span className="font-bold text-slate-800">{p.value}</span>
        </div>
      ))}
      <div className="mt-2.5 pt-2.5 border-t border-slate-100 flex justify-between items-center">
        <span className="text-slate-400">Tasa hallazgo</span>
        <span className="font-bold text-orange-500">{tasa}%</span>
      </div>
    </div>
  )
}

const TooltipConfianza = ({ active, payload }: any) => {
  if (!active || !payload?.length) return null
  const { grado, confianza } = payload[0].payload
  const nivel = confianza >= 85 ? "Excelente" : confianza >= 75 ? "Buena" : "Moderada"
  return (
    <div className="bg-white/95 backdrop-blur-sm border border-slate-100 rounded-2xl shadow-xl px-4 py-3 text-xs">
      <p className="font-semibold mb-1" style={{ color: GRADO_COLORS[grado] }}>Grado {grado}</p>
      <p className="text-slate-700">Confianza: <strong>{confianza}%</strong></p>
      <p className="text-slate-400 mt-1">Precisión: {nivel}</p>
    </div>
  )
}

const TooltipRaza = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null
  const total = payload.reduce((s: number, p: any) => s + (p.value || 0), 0)
  return (
    <div className="bg-white/95 backdrop-blur-sm border border-slate-100 rounded-2xl shadow-xl px-4 py-3 text-xs min-w-[180px]">
      <p className="font-semibold text-slate-700 mb-2.5">{label}</p>
      {payload.map((p: any) => p.value > 0 && (
        <div key={p.dataKey} className="flex items-center justify-between gap-4 mb-1.5">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-sm" style={{ background: p.fill }} />
            <span className="text-slate-500">{p.dataKey}</span>
          </div>
          <span className="font-bold text-slate-800">{p.value}</span>
        </div>
      ))}
      <div className="mt-2.5 pt-2.5 border-t border-slate-100 flex justify-between">
        <span className="text-slate-400">Total</span>
        <span className="font-bold text-slate-800">{total}</span>
      </div>
    </div>
  )
}

/* ─── Active Shape Pie ────────────────────────────────────── */
const renderActiveShape = (props: any) => {
  const { cx, cy, innerRadius, outerRadius, startAngle, endAngle, fill, payload, percent, value } = props
  return (
    <g>
      <text x={cx} y={cy - 12} textAnchor="middle" fill="#0f172a" style={{ fontSize: 26, fontWeight: 800 }}>{value}</text>
      <text x={cx} y={cy + 14} textAnchor="middle" fill="#94a3b8" style={{ fontSize: 11 }}>{payload.grado}</text>
      <Sector cx={cx} cy={cy} innerRadius={innerRadius} outerRadius={outerRadius + 8}
        startAngle={startAngle} endAngle={endAngle} fill={fill} />
      <Sector cx={cx} cy={cy} innerRadius={outerRadius + 13} outerRadius={outerRadius + 17}
        startAngle={startAngle} endAngle={endAngle} fill={fill} opacity={0.4} />
      <text x={cx} y={cy + 42} textAnchor="middle" fill={fill} style={{ fontSize: 14, fontWeight: 700 }}>
        {(percent * 100).toFixed(1)}%
      </text>
    </g>
  )
}

/* ─── Label de confianza ──────────────────────────────────── */
const LabelConfianza = (props: any) => {
  const { x, y, width, value } = props
  if (!value) return null
  return (
    <text x={x + width / 2} y={y - 8} textAnchor="middle" fill="#475569" fontSize={11} fontWeight={700}>
      {value}%
    </text>
  )
}

/* ─── Card base ───────────────────────────────────────────── */
function ChartCard({ title, description, children, action }: {
  title: string; description?: string; children: React.ReactNode; action?: React.ReactNode
}) {
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
      <div className="px-6 pt-5 pb-3 flex items-start justify-between gap-4">
        <div>
          <h3 className="text-sm font-bold text-slate-800 tracking-tight">{title}</h3>
          {description && <p className="text-xs text-slate-400 mt-0.5">{description}</p>}
        </div>
        {action}
      </div>
      <div className="px-6 pb-5">{children}</div>
    </div>
  )
}

/* ══════════════════════════════════════════════════════════════ */
export function VetDashboard({ username }: { username: string }) {
  const [data, setData]       = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError]     = useState(false)
  const [activeGrado, setActiveGrado] = useState(0)
  const onPieEnter = useCallback((_: any, i: number) => setActiveGrado(i), [])

  const fetchData = useCallback(() => {
    setLoading(true); setError(false)
    const token = localStorage.getItem("access_token")
    fetch(`${API_BASE_URL}/api/dashboard`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => { if (!r.ok) throw new Error(); return r.json() })
      .then(setData).catch(() => setError(true)).finally(() => setLoading(false))
  }, [])

  useEffect(() => { fetchData() }, [fetchData])

  /* ── Estado de carga ── */
  if (loading) return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
      <div className="w-10 h-10 border-4 border-[#1793a5]/30 border-t-[#1793a5] rounded-full animate-spin" />
      <p className="text-slate-500 text-sm font-medium">Cargando estadísticas…</p>
    </div>
  )

  if (error || !data) return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3">
      <div className="w-14 h-14 bg-red-50 rounded-2xl flex items-center justify-center">
        <AlertCircle className="w-7 h-7 text-red-400" />
      </div>
      <p className="text-slate-600 text-sm font-medium">No se pudieron cargar los datos</p>
      <button onClick={fetchData}
        className="text-xs text-[#1793a5] hover:underline flex items-center gap-1 mt-1">
        <RefreshCw className="w-3 h-3" /> Reintentar
      </button>
    </div>
  )

  /* ── Preparar datos ── */
  const distribucionData = ORDEN_GRADOS
    .map(g => ({ grado: g, cantidad: data.distribucionGrados[g] ?? 0 }))
    .filter(d => d.cantidad > 0)
  const totalEvals = distribucionData.reduce((s, d) => s + d.cantidad, 0)

  const confianzaData = ORDEN_GRADOS
    .map(g => data.confianzaPorGrado.find(c => c.grado === g))
    .filter(Boolean) as { grado: string; confianza: number }[]

  const razaData = data.soplosPorRaza.map(r => ({
    ...r,
    _total: RANGOS_EDAD.reduce((s, rng) => s + ((r[rng] as number) || 0), 0),
  }))

  /* ── KPI config ── */
  const kpis = [
    { label: "Propietarios",     value: data.totalPropietarios,  icon: Users,        accent: "from-[#1793a5] to-cyan-400",   iconBg: "bg-cyan-50",   iconColor: "text-[#1793a5]" },
    { label: "Pacientes Caninos",value: data.totalPerros,         icon: Dog,          accent: "from-violet-500 to-purple-400", iconBg: "bg-violet-50", iconColor: "text-violet-600" },
    { label: "Evaluaciones",     value: data.totalEvaluaciones,   icon: ClipboardList,accent: "from-blue-500 to-sky-400",      iconBg: "bg-blue-50",   iconColor: "text-blue-600" },
    { label: "Tasa de Hallazgo", value: `${data.tasaHallazgo}%`,  icon: Activity,     accent: "from-orange-500 to-amber-400",  iconBg: "bg-orange-50", iconColor: "text-orange-500",
      extra: (
        <div className="mt-3">
          <div className="flex justify-between text-[10px] text-slate-400 mb-1">
            <span>0%</span><span>100%</span>
          </div>
          <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
            <div className="h-full rounded-full bg-gradient-to-r from-orange-400 to-amber-300 transition-all duration-1000"
              style={{ width: `${Math.min(data.tasaHallazgo, 100)}%` }} />
          </div>
        </div>
      )
    },
  ] as const

  return (
    <div className="space-y-7">

      {/* ── Encabezado ─────────────────────────────────── */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#1793a5] via-[#1180a0] to-[#0d6b87] px-7 py-6 text-white shadow-lg">
        {/* Círculos decorativos */}
        <div className="absolute -right-10 -top-10 w-48 h-48 bg-white/5 rounded-full" />
        <div className="absolute -right-4 top-12 w-28 h-28 bg-white/5 rounded-full" />
        <div className="relative">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-cyan-200 text-xs font-medium uppercase tracking-widest mb-1">Panel Estadístico</p>
              <h2 className="text-2xl font-extrabold tracking-tight">Bienvenido, {username}</h2>
              <p className="text-cyan-100/80 text-sm mt-1">Sistema de Gestión Veterinaria · Módulo Veterinario</p>
            </div>
            <span className="hidden sm:flex items-center gap-1.5 bg-white/15 backdrop-blur-sm text-white/90 text-xs font-medium px-3 py-1.5 rounded-full border border-white/20 flex-shrink-0">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-300 animate-pulse" />
              En vivo
            </span>
          </div>
          {/* Mini KPIs dentro del header */}
          <div className="mt-5 grid grid-cols-3 gap-3">
            {[
              { label: "Propietarios",  value: data.totalPropietarios },
              { label: "Pacientes",     value: data.totalPerros },
              { label: "Evaluaciones",  value: data.totalEvaluaciones },
            ].map(k => (
              <div key={k.label} className="bg-white/10 backdrop-blur-sm rounded-xl px-4 py-2.5 border border-white/10">
                <p className="text-3xl font-extrabold">{k.value}</p>
                <p className="text-cyan-200/80 text-xs mt-0.5">{k.label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Tarjetas KPI ───────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map(({ label, value, icon: Icon, accent, iconBg, iconColor, extra }) => (
          <div key={label} className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden hover:shadow-md transition-all duration-200 hover:-translate-y-0.5">
            {/* Barra superior con gradiente */}
            <div className={`h-1 bg-gradient-to-r ${accent}`} />
            <div className="p-5">
              <div className="flex items-start justify-between mb-3">
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider leading-tight">{label}</p>
                <div className={`${iconBg} p-2 rounded-xl`}>
                  <Icon className={`h-4 w-4 ${iconColor}`} />
                </div>
              </div>
              <p className={`text-4xl font-extrabold tracking-tight ${iconColor}`}>{value}</p>
              {extra}
            </div>
          </div>
        ))}
      </div>

      {/* ── Fila 2: Donut + Tendencia ──────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">

        {/* Donut — 2/5 */}
        <div className="lg:col-span-2">
          <ChartCard
            title="Distribución por Grado Levine"
            description="Hover sobre cada sector para ver el detalle"
          >
            {distribucionData.length > 0 ? (
              <div className="flex flex-col gap-4">
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    <Pie
                      activeIndex={activeGrado}
                      activeShape={renderActiveShape}
                      data={distribucionData}
                      dataKey="cantidad"
                      nameKey="grado"
                      cx="50%" cy="50%"
                      innerRadius={60} outerRadius={82}
                      onMouseEnter={onPieEnter}
                    >
                      {distribucionData.map((d, i) => (
                        <Cell key={i} fill={GRADO_COLORS[d.grado]} stroke="white" strokeWidth={3} />
                      ))}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
                {/* Leyenda */}
                <div className="space-y-2">
                  {distribucionData.map((d) => {
                    const pct = totalEvals > 0 ? Math.round(d.cantidad / totalEvals * 100) : 0
                    return (
                      <div key={d.grado} className="flex items-center gap-2.5">
                        <span className="w-3 h-3 rounded-sm flex-shrink-0" style={{ background: GRADO_COLORS[d.grado] }} />
                        <span className="text-xs text-slate-600 font-medium flex-1">{d.grado}</span>
                        <div className="flex items-center gap-2">
                          <div className="w-16 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                            <div className="h-full rounded-full" style={{ width: `${pct}%`, background: GRADO_COLORS[d.grado] }} />
                          </div>
                          <span className="text-xs font-bold text-slate-700 w-6 text-right">{d.cantidad}</span>
                          <span className="text-xs text-slate-400 w-8">({pct}%)</span>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            ) : (
              <p className="text-sm text-slate-400 py-10 text-center">Sin datos aún</p>
            )}
          </ChartCard>
        </div>

        {/* Tendencia semanal — 3/5 */}
        <div className="lg:col-span-3">
          <ChartCard
            title="Tendencia Semanal de Hallazgos"
            description="Total de casos vs casos con soplo detectado — últimas 10 semanas"
          >
            {data.tendenciaSemanal.length > 0 ? (
              <ResponsiveContainer width="100%" height={270}>
                <ComposedChart data={data.tendenciaSemanal} margin={{ top: 15, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="gTotal" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%"   stopColor="#1793a5" stopOpacity={0.3} />
                      <stop offset="100%" stopColor="#1793a5" stopOpacity={0.02} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="4 4" stroke="#f1f5f9" vertical={false} />
                  <XAxis dataKey="semana" tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
                  <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
                  <Tooltip content={<TooltipTendencia />} cursor={{ stroke: "#e2e8f0", strokeWidth: 1.5 }} />
                  <Legend
                    iconType="circle" iconSize={8}
                    wrapperStyle={{ fontSize: 11, paddingTop: 12 }}
                    formatter={v => <span style={{ color: "#475569", fontWeight: 500 }}>{v}</span>}
                  />
                  <Area type="monotone" dataKey="total" name="Total casos"
                    stroke="#1793a5" strokeWidth={2.5} fill="url(#gTotal)"
                    dot={{ r: 4, fill: "white", stroke: "#1793a5", strokeWidth: 2 }}
                    activeDot={{ r: 6, fill: "#1793a5" }}
                  />
                  <Line type="monotone" dataKey="conSoplo" name="Con soplo"
                    stroke="#ef4444" strokeWidth={2.5} strokeDasharray="6 3"
                    dot={{ r: 4, fill: "white", stroke: "#ef4444", strokeWidth: 2 }}
                    activeDot={{ r: 6, fill: "#ef4444" }}
                  />
                </ComposedChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-sm text-slate-400 py-10 text-center">Sin datos en las últimas 10 semanas</p>
            )}
          </ChartCard>
        </div>
      </div>

      {/* ── Fila 3: Raza/Edad + Confianza CNN ─────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

        {/* Soplos por Raza y Edad */}
        <ChartCard
          title="Prevalencia de Soplos por Raza"
          description="Solo evaluaciones con soplo detectado · segmentado por rango de edad"
        >
          {data.soplosPorRaza.length > 0 ? (
            <ResponsiveContainer width="100%" height={270}>
              <BarChart layout="vertical" data={razaData}
                margin={{ top: 5, right: 50, left: 10, bottom: 5 }}>
                <CartesianGrid strokeDasharray="4 4" horizontal={false} stroke="#f1f5f9" />
                <XAxis type="number" allowDecimals={false}
                  tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
                <YAxis type="category" dataKey="raza" width={122}
                  tick={{ fontSize: 10, fill: "#475569", fontWeight: 500 }} axisLine={false} tickLine={false} />
                <Tooltip content={<TooltipRaza />} cursor={{ fill: "#f8fafc" }} />
                <Legend iconType="square" iconSize={9} wrapperStyle={{ fontSize: 11, paddingTop: 10 }}
                  formatter={v => <span style={{ color: "#475569" }}>{v}</span>} />
                {RANGOS_EDAD.map((rango, i) => (
                  <Bar key={rango} dataKey={rango} stackId="a" fill={EDAD_COLORS[i]}
                    radius={i === RANGOS_EDAD.length - 1 ? [0, 6, 6, 0] : [0, 0, 0, 0]}>
                    {i === RANGOS_EDAD.length - 1 && (
                      <LabelList dataKey="_total" position="right"
                        style={{ fontSize: 11, fontWeight: 700, fill: "#475569" }} />
                    )}
                  </Bar>
                ))}
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-sm text-slate-400 py-10 text-center">Sin soplos registrados</p>
          )}
        </ChartCard>

        {/* Confianza CNN */}
        <ChartCard
          title="Confianza del Modelo CNN"
          description="Precisión promedio de predicción por grado Levine"
          action={
            data.confianzaGeneral > 0 ? (
              <div className="text-right flex-shrink-0">
                <p className="text-[10px] text-slate-400 uppercase tracking-wider">Promedio</p>
                <div className="flex items-baseline gap-1 justify-end">
                  <span className="text-2xl font-extrabold text-violet-600">{data.confianzaGeneral}</span>
                  <span className="text-sm font-bold text-violet-400">%</span>
                </div>
              </div>
            ) : undefined
          }
        >
          {confianzaData.length > 0 ? (
            <ResponsiveContainer width="100%" height={270}>
              <BarChart data={confianzaData} margin={{ top: 22, right: 10, left: -20, bottom: 5 }}>
                <defs>
                  {confianzaData.map(d => (
                    <linearGradient key={d.grado} id={`gc_${d.grado.replace(/[\s/]/g,"_")}`} x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%"   stopColor={GRADO_COLORS[d.grado]} stopOpacity={1} />
                      <stop offset="100%" stopColor={GRADO_COLORS[d.grado]} stopOpacity={0.5} />
                    </linearGradient>
                  ))}
                </defs>
                <CartesianGrid strokeDasharray="4 4" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="grado" tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
                <YAxis domain={[0, 100]} unit="%" tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
                <Tooltip content={<TooltipConfianza />} cursor={{ fill: "#f8fafc" }} />
                <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 11, paddingTop: 10 }}
                  payload={[{ value: "Confianza promedio (%)", type: "circle" as any, color: "#8b5cf6" }]} />
                {data.confianzaGeneral > 0 && (
                  <ReferenceLine y={data.confianzaGeneral} stroke="#8b5cf6" strokeDasharray="5 4" strokeWidth={1.5}
                    label={{ value: `Prom. ${data.confianzaGeneral}%`, position: "insideTopRight", fontSize: 10, fill: "#7c3aed", fontWeight: 600 }} />
                )}
                <Bar dataKey="confianza" name="Confianza %" radius={[8, 8, 0, 0]} maxBarSize={72}>
                  <LabelList content={<LabelConfianza />} />
                  {confianzaData.map(d => (
                    <Cell key={d.grado} fill={`url(#gc_${d.grado.replace(/[\s/]/g,"_")})`} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex flex-col items-center justify-center py-10 gap-3">
              <div className="w-12 h-12 bg-violet-50 rounded-2xl flex items-center justify-center">
                <Brain className="w-6 h-6 text-violet-300" />
              </div>
              <p className="text-sm text-slate-400">Sin datos de confianza aún</p>
              <p className="text-xs text-slate-300">Se registrará con las nuevas evaluaciones de audio</p>
            </div>
          )}
        </ChartCard>
      </div>

      {/* ── Tabla de últimas evaluaciones ──────────────── */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-50 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-800 tracking-tight">Últimas Evaluaciones</h3>
            <p className="text-xs text-slate-400 mt-0.5">Las 5 evaluaciones más recientes registradas en el sistema</p>
          </div>
          <TrendingUp className="w-4 h-4 text-slate-300" />
        </div>
        {data.evaluacionesRecientes.length === 0 ? (
          <div className="py-12 text-center">
            <ClipboardList className="w-8 h-8 text-slate-200 mx-auto mb-2" />
            <p className="text-sm text-slate-400">Sin evaluaciones registradas</p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50/60">
                <th className="text-left px-6 py-3 text-[10px] font-bold text-slate-400 uppercase tracking-widest w-10">#</th>
                <th className="text-left px-4 py-3 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Fecha</th>
                <th className="text-left px-4 py-3 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Paciente</th>
                <th className="text-left px-4 py-3 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Propietario</th>
                <th className="text-left px-4 py-3 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Resultado</th>
              </tr>
            </thead>
            <tbody>
              {data.evaluacionesRecientes.map((ev, i) => (
                <tr key={ev.id} className="border-t border-slate-50 hover:bg-slate-50/60 transition-colors">
                  <td className="px-6 py-3.5 text-xs text-slate-300 font-mono font-medium">{String(i + 1).padStart(2, "0")}</td>
                  <td className="px-4 py-3.5 text-xs text-slate-500 whitespace-nowrap">
                    {ev.fecha ? formatDateDDMMYYYY(ev.fecha) : "—"}
                  </td>
                  <td className="px-4 py-3.5 font-semibold text-slate-700">{ev.perro}</td>
                  <td className="px-4 py-3.5 text-xs text-slate-400">{ev.propietario}</td>
                  <td className="px-4 py-3.5">
                    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${GRADO_BADGE_CLS[ev.gradoLevine] ?? "bg-slate-100 text-slate-600 ring-1 ring-slate-200"}`}>
                      {ev.gradoLevine}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

    </div>
  )
}
