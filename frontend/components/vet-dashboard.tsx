"use client"

import { useEffect, useState, useCallback } from "react"
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer, Cell, LabelList,
  ComposedChart, Line,
} from "recharts"
import { Users, Dog, ClipboardList, Activity, AlertCircle, RefreshCw, MapPin, BrainCircuit } from "lucide-react"
import { formatDateDDMMYYYY } from "@/lib/date-utils"

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://127.0.0.1:5000"

const GRADO_COLORS: Record<string, string> = {
  "AUSENTE": "#10b981",
  "I /VI":   "#06b6d4",
  "II /VI":  "#f59e0b",
  "III /VI": "#ef4444",
}
const GRADO_BADGE: Record<string, string> = {
  "AUSENTE": "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-300",
  "I /VI":   "bg-cyan-50 text-cyan-700 ring-1 ring-cyan-300",
  "II /VI":  "bg-amber-50 text-amber-700 ring-1 ring-amber-300",
  "III /VI": "bg-red-50 text-red-700 ring-1 ring-red-300",
}

const RANGOS_EDAD     = ["<7y", "7-10y", ">10y"]
const EDAD_COLORS     = ["#1793a5", "#f97316", "#7c3aed"]
const ORDEN_GRADOS    = ["AUSENTE", "I /VI", "II /VI", "III /VI"]
const GRADOS_SOPLO    = ["I /VI", "II /VI", "III /VI"]
const DISTRITO_COLORS = ["#06b6d4", "#f59e0b", "#ef4444"]

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
    idCorto: string; fecha: string | null; gradoLevine: string
    perro: string; raza: string; especie: string; propietario: string; resultado: string
  }[]
  soplosPorDistrito: { distrito: string; "I /VI": number; "II /VI": number; "III /VI": number }[]
}

/* ── Tooltip Tendencia ───────────────────────────────── */
const TooltipTendencia = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-white border border-gray-200 rounded-lg shadow-lg px-3 py-2 text-xs">
      <p className="font-semibold text-gray-600 mb-1.5">Semana {label}</p>
      {payload.map((p: any) => (
        <div key={p.dataKey} className="flex items-center gap-2 mb-1">
          <span className="w-2 h-2 rounded-full" style={{ background: p.color }} />
          <span className="text-gray-500">{p.name}:</span>
          <span className="font-bold text-gray-800">{p.value}</span>
        </div>
      ))}
    </div>
  )
}

const TooltipRaza = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null
  const total = payload.reduce((s: number, p: any) => s + (p.value || 0), 0)
  return (
    <div className="bg-white border border-gray-200 rounded-lg shadow-lg px-3 py-2 text-xs min-w-[160px]">
      <p className="font-semibold text-gray-700 mb-1.5">{label}</p>
      {payload.map((p: any) => p.value > 0 && (
        <div key={p.dataKey} className="flex items-center justify-between gap-3 mb-1">
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-sm" style={{ background: p.fill }} />
            <span className="text-gray-500">{p.dataKey}</span>
          </div>
          <span className="font-bold">{p.value}</span>
        </div>
      ))}
      <div className="mt-1.5 pt-1.5 border-t border-gray-100 flex justify-between">
        <span className="text-gray-400">Total</span>
        <span className="font-bold text-gray-800">{total}</span>
      </div>
    </div>
  )
}

const TooltipDistrito = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null
  const total = payload.reduce((s: number, p: any) => s + (p.value || 0), 0)
  return (
    <div className="bg-white border border-gray-200 rounded-lg shadow-lg px-3 py-2 text-xs min-w-[180px]">
      <div className="flex items-center gap-1.5 mb-2">
        <MapPin className="w-3 h-3 text-[#1793a5]" />
        <p className="font-bold text-gray-700">{label}</p>
      </div>
      {payload.map((p: any) => p.value > 0 && (
        <div key={p.dataKey} className="flex items-center justify-between gap-3 mb-1">
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-sm" style={{ background: p.fill }} />
            <span className="text-gray-500">{p.dataKey}</span>
          </div>
          <span className="font-bold">{p.value} caso{p.value !== 1 ? "s" : ""}</span>
        </div>
      ))}
      <div className="mt-1.5 pt-1.5 border-t border-gray-100 flex justify-between">
        <span className="text-gray-400">Total soplos</span>
        <span className="font-bold text-gray-800">{total}</span>
      </div>
    </div>
  )
}

/* ── Campana de Gauss SVG ────────────────────────────── */
function BellCurve() {
  return (
    <svg viewBox="0 0 200 80" className="w-full" style={{ maxHeight: 80 }}>
      <defs>
        <linearGradient id="bellFill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#1793a5" stopOpacity={0.35} />
          <stop offset="100%" stopColor="#1793a5" stopOpacity={0.04} />
        </linearGradient>
      </defs>
      <path
        d="M5,72 C25,72 40,68 55,55 C70,42 80,8 100,8 C120,8 130,42 145,55 C160,68 175,72 195,72"
        fill="none" stroke="#1793a5" strokeWidth={2.5} strokeLinecap="round"
      />
      <path
        d="M5,72 C25,72 40,68 55,55 C70,42 80,8 100,8 C120,8 130,42 145,55 C160,68 175,72 195,72 L195,76 L5,76 Z"
        fill="url(#bellFill)"
      />
      <line x1="100" y1="8" x2="100" y2="72" stroke="#1793a5" strokeWidth={1} strokeDasharray="3 2" opacity={0.4} />
    </svg>
  )
}

/* ── Tarjeta KPI ─────────────────────────────────────── */
function KpiCard({ icon: Icon, iconBg, iconColor, value, label }: {
  icon: any; iconBg: string; iconColor: string; value: string | number; label: string
}) {
  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm px-5 py-4 flex items-center gap-4">
      <div className={`${iconBg} p-3 rounded-xl flex-shrink-0`}>
        <Icon className={`h-5 w-5 ${iconColor}`} />
      </div>
      <div>
        <p className="text-2xl font-extrabold text-gray-800 leading-none">{value}</p>
        <p className="text-xs text-gray-400 mt-1 font-medium">{label}</p>
      </div>
    </div>
  )
}

/* ── Card contenedor ─────────────────────────────────── */
function Panel({ title, icon, children, className = "" }: {
  title: string; icon?: React.ReactNode; children: React.ReactNode; className?: string
}) {
  return (
    <div className={`bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden ${className}`}>
      <div className="px-4 pt-4 pb-2 flex items-center gap-2">
        {icon && <span className="text-[#1793a5]">{icon}</span>}
        <h3 className="text-sm font-bold text-gray-700">{title}</h3>
      </div>
      <div className="px-4 pb-4">{children}</div>
    </div>
  )
}

/* ══════════════════════════════════════════════════════ */
export function VetDashboard({ username }: { username: string }) {
  const [data, setData]       = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError]     = useState(false)

  const fetchData = useCallback(() => {
    setLoading(true); setError(false)
    const token = localStorage.getItem("access_token")
    fetch(`${API_BASE_URL}/api/dashboard`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => { if (!r.ok) throw new Error(); return r.json() })
      .then(setData).catch(() => setError(true)).finally(() => setLoading(false))
  }, [])

  useEffect(() => { fetchData() }, [fetchData])

  if (loading) return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3">
      <div className="w-9 h-9 border-4 border-[#1793a5]/20 border-t-[#1793a5] rounded-full animate-spin" />
      <p className="text-gray-400 text-sm">Cargando estadísticas…</p>
    </div>
  )

  if (error || !data) return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3">
      <AlertCircle className="w-8 h-8 text-red-400" />
      <p className="text-gray-500 text-sm">No se pudieron cargar los datos</p>
      <button onClick={fetchData} className="text-xs text-[#1793a5] hover:underline flex items-center gap-1">
        <RefreshCw className="w-3 h-3" /> Reintentar
      </button>
    </div>
  )

  const distribucionData = ORDEN_GRADOS.map(g => ({
    grado: g.replace(" /VI", "/VI"),
    gradoFull: g,
    cantidad: data.distribucionGrados[g] ?? 0,
  }))

  const tendenciaData = data.tendenciaSemanal.map((s, i) => ({ ...s, semana: i + 1 }))
  const distritoBarHeight = Math.max(220, (data.soplosPorDistrito?.length ?? 0) * 44)

  return (
    <div className="space-y-5">

      {/* ── Título ─────────────────────────────────────── */}
      <div>
        <h2 className="text-2xl font-extrabold text-gray-800">Dashboard</h2>
        <p className="text-sm text-gray-400 mt-0.5">
          Vista Avanzada de Cardiología Canina — Clínica Veterinaria
        </p>
      </div>

      {/* ── KPI Cards ──────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <KpiCard icon={Users}         iconBg="bg-[#e8f7f9]" iconColor="text-[#1793a5]"  value={data.totalPropietarios}  label="Propietarios" />
        <KpiCard icon={Dog}           iconBg="bg-orange-50" iconColor="text-orange-500" value={data.totalPerros}         label="Pacientes Caninos" />
        <KpiCard icon={ClipboardList} iconBg="bg-blue-50"   iconColor="text-blue-500"   value={data.totalEvaluaciones}  label="Total Evaluaciones" />
        <KpiCard icon={Activity}      iconBg="bg-[#e8f7f9]" iconColor="text-[#1793a5]"  value={`${data.tasaHallazgo}%`} label="Tasa de Hallazgo de Soplos" />
      </div>

      {/* ── Cuerpo principal ───────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-3">

        {/* Columna izquierda (2/5) */}
        <div className="lg:col-span-2 flex flex-col gap-3">

          <Panel
            title="Distribución de Grado de Soplo"
            icon={<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>}
          >
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={distribucionData} margin={{ top: 5, right: 5, left: -25, bottom: 0 }} barCategoryGap="30%">
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                <XAxis dataKey="grado" tick={{ fontSize: 10, fill: "#9ca3af" }} axisLine={false} tickLine={false} />
                <YAxis allowDecimals={false} tick={{ fontSize: 10, fill: "#9ca3af" }} axisLine={false} tickLine={false} />
                <Tooltip
                  formatter={(v: any, _: any, props: any) => [`${v} evaluaciones`, props.payload.gradoFull]}
                  contentStyle={{ fontSize: 11, borderRadius: 8, border: "1px solid #e5e7eb" }}
                />
                <Bar dataKey="cantidad" radius={[3, 3, 0, 0]} maxBarSize={40}>
                  {distribucionData.map((d, i) => (
                    <Cell key={i} fill={GRADO_COLORS[d.gradoFull] ?? "#1793a5"} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
            <div className="flex flex-wrap gap-x-3 gap-y-1 mt-1">
              {distribucionData.filter(d => d.cantidad > 0).map(d => (
                <div key={d.gradoFull} className="flex items-center gap-1">
                  <span className="w-2.5 h-2.5 rounded-sm" style={{ background: GRADO_COLORS[d.gradoFull] }} />
                  <span className="text-[10px] text-gray-500">{d.gradoFull} ({d.cantidad})</span>
                </div>
              ))}
            </div>
          </Panel>

          <Panel
            title="Tendencia Semanal de Hallazgos"
            icon={<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" /></svg>}
          >
            {tendenciaData.length > 0 ? (
              <ResponsiveContainer width="100%" height={150}>
                <ComposedChart data={tendenciaData} margin={{ top: 5, right: 5, left: -25, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" vertical={false} />
                  <XAxis dataKey="semana" tick={{ fontSize: 10, fill: "#9ca3af" }} axisLine={false} tickLine={false} />
                  <YAxis allowDecimals={false} tick={{ fontSize: 10, fill: "#9ca3af" }} axisLine={false} tickLine={false} />
                  <Tooltip content={<TooltipTendencia />} cursor={{ stroke: "#e5e7eb" }} />
                  <Legend iconType="plainline" iconSize={16} wrapperStyle={{ fontSize: 10, paddingTop: 6 }}
                    formatter={v => <span style={{ color: "#6b7280" }}>{v}</span>} />
                  <Line type="monotone" dataKey="total" name="Total Casos"
                    stroke="#1793a5" strokeWidth={2} strokeDasharray="5 3"
                    dot={{ r: 3, fill: "#1793a5", strokeWidth: 0 }} activeDot={{ r: 5 }} />
                  <Line type="monotone" dataKey="conSoplo" name="Con Soplo"
                    stroke="#f97316" strokeWidth={2}
                    dot={{ r: 3, fill: "#f97316", strokeWidth: 0 }} activeDot={{ r: 5 }} />
                </ComposedChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-xs text-gray-400 py-6 text-center">Sin datos</p>
            )}
          </Panel>
        </div>

        {/* Columna derecha (3/5) */}
        <div className="lg:col-span-3 flex flex-col gap-3">
          <div className="grid grid-cols-3 gap-3 flex-1">

            {/* Soplos por Raza y Rango de Edad (2/3) */}
            <div className="col-span-2">
              <Panel
                title="Soplos por Raza y Rango de Edad"
                icon={<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" /></svg>}
                className="h-full"
              >
                {data.soplosPorRaza.length > 0 ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart layout="vertical" data={data.soplosPorRaza}
                      margin={{ top: 0, right: 30, left: 8, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f3f4f6" />
                      <XAxis type="number" allowDecimals={false}
                        tick={{ fontSize: 10, fill: "#9ca3af" }} axisLine={false} tickLine={false} />
                      <YAxis type="category" dataKey="raza" width={118}
                        tick={{ fontSize: 9.5, fill: "#4b5563", fontWeight: 500 }} axisLine={false} tickLine={false} />
                      <Tooltip content={<TooltipRaza />} cursor={{ fill: "#f9fafb" }} />
                      <Legend iconType="square" iconSize={9}
                        wrapperStyle={{ fontSize: 10, paddingTop: 8 }}
                        formatter={v => <span style={{ color: "#6b7280" }}>{v}</span>} />
                      {RANGOS_EDAD.map((rango, i) => (
                        <Bar key={rango} dataKey={rango} stackId="a" fill={EDAD_COLORS[i]}
                          radius={i === RANGOS_EDAD.length - 1 ? [0, 4, 4, 0] : [0, 0, 0, 0]}>
                          {i === RANGOS_EDAD.length - 1 && (
                            <LabelList
                              valueAccessor={(entry: any) =>
                                RANGOS_EDAD.reduce((s, r) => s + ((entry[r] as number) || 0), 0) || null
                              }
                              position="right"
                              style={{ fontSize: 10, fontWeight: 700, fill: "#6b7280" }}
                            />
                          )}
                        </Bar>
                      ))}
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <p className="text-xs text-gray-400 py-10 text-center">Sin soplos registrados</p>
                )}
              </Panel>
            </div>

            {/* Nivel de Confianza CNN (1/3) */}
            <div className="col-span-1">
              <div className="bg-white rounded-xl border border-gray-100 shadow-sm h-full flex flex-col p-4">
                <div className="flex items-start gap-1.5 mb-3">
                  <BrainCircuit className="w-4 h-4 text-[#1793a5] flex-shrink-0 mt-0.5" />
                  <p className="text-xs font-bold text-gray-700 leading-tight">
                    Nivel de Confianza Promedio del Modelo CNN
                  </p>
                </div>
                <div className="flex-1 flex flex-col items-center justify-center gap-2">
                  {data.confianzaGeneral > 0 ? (
                    <>
                      <p className="text-5xl font-extrabold text-gray-800 tracking-tight">
                        {data.confianzaGeneral}
                        <span className="text-2xl font-bold text-gray-400">%</span>
                      </p>
                      <p className="text-[10px] text-gray-400 font-medium uppercase tracking-wider">
                        {data.confianzaGeneral >= 85 ? "Excelente precisión" :
                         data.confianzaGeneral >= 75 ? "Buena precisión" : "Precisión moderada"}
                      </p>
                      <div className="w-full mt-2"><BellCurve /></div>
                      {data.confianzaPorGrado.length > 0 && (
                        <div className="w-full mt-1 space-y-1.5">
                          {ORDEN_GRADOS.map(g => {
                            const item = data.confianzaPorGrado.find(c => c.grado === g)
                            if (!item) return null
                            return (
                              <div key={g} className="flex items-center gap-1.5">
                                <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: GRADO_COLORS[g] }} />
                                <span className="text-[10px] text-gray-500 flex-1 truncate">{g}</span>
                                <span className="text-[10px] font-bold text-gray-700">{item.confianza}%</span>
                              </div>
                            )
                          })}
                        </div>
                      )}
                    </>
                  ) : (
                    <div className="text-center">
                      <p className="text-3xl font-extrabold text-gray-300">—</p>
                      <p className="text-xs text-gray-400 mt-2">Sin datos aún</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Distribución por Distrito ──────────────────── */}
      <Panel
        title="Distribución de Grados de Soplo por Distrito"
        icon={<MapPin className="w-4 h-4" />}
      >
        {data.soplosPorDistrito?.length > 0 ? (
          <>
            <ResponsiveContainer width="100%" height={distritoBarHeight}>
              <BarChart
                layout="vertical"
                data={data.soplosPorDistrito}
                margin={{ top: 4, right: 50, left: 10, bottom: 4 }}
              >
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f3f4f6" />
                <XAxis
                  type="number"
                  allowDecimals={false}
                  tick={{ fontSize: 10, fill: "#9ca3af" }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  type="category"
                  dataKey="distrito"
                  width={110}
                  tick={{ fontSize: 10, fill: "#4b5563", fontWeight: 500 }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip content={<TooltipDistrito />} cursor={{ fill: "#f9fafb" }} />
                <Legend
                  iconType="square"
                  iconSize={9}
                  wrapperStyle={{ fontSize: 10, paddingTop: 10 }}
                  formatter={v => <span style={{ color: "#6b7280" }}>{v}</span>}
                />
                {GRADOS_SOPLO.map((grado, i) => (
                  <Bar
                    key={grado}
                    dataKey={grado}
                    stackId="d"
                    fill={DISTRITO_COLORS[i]}
                    radius={i === GRADOS_SOPLO.length - 1 ? [0, 4, 4, 0] : [0, 0, 0, 0]}
                  >
                    {i === GRADOS_SOPLO.length - 1 && (
                      <LabelList
                        valueAccessor={(entry: any) =>
                          GRADOS_SOPLO.reduce((s, g) => s + ((entry[g] as number) || 0), 0) || null
                        }
                        position="right"
                        style={{ fontSize: 10, fontWeight: 700, fill: "#6b7280" }}
                      />
                    )}
                  </Bar>
                ))}
              </BarChart>
            </ResponsiveContainer>
            <div className="flex items-center gap-4 mt-2 flex-wrap">
              {GRADOS_SOPLO.map((g, i) => (
                <div key={g} className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-sm" style={{ background: DISTRITO_COLORS[i] }} />
                  <span className="text-[10px] text-gray-500 font-medium">{g}</span>
                </div>
              ))}
              <span className="ml-auto text-[10px] text-gray-400 italic">Solo casos con soplo detectado</span>
            </div>
          </>
        ) : (
          <p className="text-xs text-gray-400 py-8 text-center">Sin datos de distrito disponibles</p>
        )}
      </Panel>

      {/* ── Tabla de Últimas Evaluaciones ──────────────── */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="px-5 py-3.5 border-b border-gray-50 flex items-center gap-2">
          <svg className="w-4 h-4 text-[#1793a5]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
          </svg>
          <h3 className="text-sm font-bold text-gray-700">Últimas Evaluaciones Diagnósticas</h3>
        </div>

        {data.evaluacionesRecientes.length === 0 ? (
          <p className="text-sm text-gray-400 py-8 text-center">Sin evaluaciones registradas</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50/50">
                  {["ID_EV", "FECHA", "MASCOTA", "PROPIETARIO", "ESPECIE", "RESULTADO", "GRADO"].map(h => (
                    <th key={h} className="text-left px-4 py-2.5 text-[10px] font-bold text-gray-400 uppercase tracking-widest whitespace-nowrap">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {data.evaluacionesRecientes.map((ev, i) => (
                  <tr key={ev.idCorto} className={`border-b border-gray-50 hover:bg-gray-50/60 transition-colors ${i % 2 === 0 ? "" : "bg-gray-50/20"}`}>
                    <td className="px-4 py-3 font-mono font-semibold text-gray-500">{ev.idCorto}</td>
                    <td className="px-4 py-3 text-gray-500 whitespace-nowrap">
                      {ev.fecha ? formatDateDDMMYYYY(ev.fecha) : "—"}
                    </td>
                    <td className="px-4 py-3">
                      <p className="font-semibold text-gray-800">{ev.perro}</p>
                      <p className="text-gray-400 text-[10px]">Breed: {ev.raza}</p>
                    </td>
                    <td className="px-4 py-3 text-gray-600">{ev.propietario}</td>
                    <td className="px-4 py-3 text-gray-500">{ev.especie}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold whitespace-nowrap
                        ${ev.resultado === "Soplo Cardíaco"
                          ? "bg-orange-50 text-orange-600 ring-1 ring-orange-200"
                          : "bg-emerald-50 text-emerald-600 ring-1 ring-emerald-200"}`}>
                        {ev.resultado}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold whitespace-nowrap ${GRADO_BADGE[ev.gradoLevine] ?? "bg-gray-100 text-gray-600 ring-1 ring-gray-200"}`}>
                        {ev.gradoLevine}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

    </div>
  )
}
