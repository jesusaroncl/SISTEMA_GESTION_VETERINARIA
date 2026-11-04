"use client"

import type React from "react"
import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AlertCircle, CheckCircle2, KeyRound } from "lucide-react"

type Step = "identify" | "code" | "password" | "done"

const DESCRIPTIONS: Record<Step, string> = {
  identify: "Ingresa tu usuario o correo y te enviaremos un código de 6 dígitos.",
  code: "Ingresa el código que enviamos a tu correo.",
  password: "Elige tu nueva contraseña.",
  done: "Tu contraseña fue actualizada.",
}

export default function ForgotPasswordPage() {
  const router = useRouter()
  const [step, setStep] = useState<Step>("identify")
  const [identifier, setIdentifier] = useState("")
  const [code, setCode] = useState("")
  const [resetToken, setResetToken] = useState("")
  const [password, setPassword] = useState("")
  const [confirm, setConfirm] = useState("")
  const [info, setInfo] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL

  const post = async (path: string, body: object) => {
    const response = await fetch(`${API_BASE_URL}/auth/${path}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    })
    const data = await response.json()
    return { ok: response.ok, data }
  }

  const run = async (action: () => Promise<void>) => {
    setError("")
    setInfo("")
    setLoading(true)
    try {
      await action()
    } catch {
      setError("No se pudo conectar con el servidor.")
    } finally {
      setLoading(false)
    }
  }

  const requestCode = (e?: React.FormEvent) => {
    e?.preventDefault()
    return run(async () => {
      const { ok, data } = await post("forgot-password", { identifier })
      if (!ok) return setError(data.msg || "No se pudo procesar la solicitud")
      setInfo(data.msg)
      setCode("")
      setStep("code")
    })
  }

  const verifyCode = (e: React.FormEvent) => {
    e.preventDefault()
    return run(async () => {
      const { ok, data } = await post("verify-reset-code", { identifier, code })
      if (!ok) return setError(data.msg || "Código inválido o expirado")
      setResetToken(data.reset_token)
      setStep("password")
    })
  }

  const resetPassword = (e: React.FormEvent) => {
    e.preventDefault()
    if (password.length < 6) return setError("La contraseña debe tener al menos 6 caracteres")
    if (password !== confirm) return setError("Las contraseñas no coinciden")
    return run(async () => {
      const { ok, data } = await post("reset-password", { token: resetToken, password })
      if (!ok) return setError(data.msg || "No se pudo restablecer la contraseña")
      setStep("done")
      setTimeout(() => router.push("/"), 2500)
    })
  }

  const inputClass = "border-gray-300 focus:border-[#1793a5] focus:ring-[#1793a5]"
  const buttonClass = "w-full bg-[#1793a5] hover:bg-[#136d7a] text-white"

  return (
    <main className="min-h-screen bg-gradient-to-br from-[#d0e8ed] via-[#7ececa] to-[#1793a5] flex items-center justify-center p-4">
      <Card className="w-full max-w-md shadow-2xl border-0">
        <CardHeader className="space-y-4 text-center pb-8">
          <div className="flex justify-center mb-2">
            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-[#1793a5] to-[#7ececa] flex items-center justify-center shadow-lg">
              <KeyRound className="w-10 h-10 text-white" strokeWidth={2.5} />
            </div>
          </div>
          <CardTitle className="text-2xl font-bold text-[#1793a5]">Recuperar contraseña</CardTitle>
          <CardDescription className="text-base text-gray-600">{DESCRIPTIONS[step]}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          {info && (
            <Alert>
              <CheckCircle2 className="h-4 w-4" />
              <AlertDescription>{info}</AlertDescription>
            </Alert>
          )}

          {step === "identify" && (
            <form onSubmit={requestCode} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="identifier">Usuario o correo</Label>
                <Input
                  id="identifier"
                  type="text"
                  placeholder="Ingrese su usuario o correo"
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  required
                  className={inputClass}
                />
              </div>
              <Button type="submit" disabled={loading} className={buttonClass} size="lg">
                {loading ? "Enviando..." : "Enviar código"}
              </Button>
            </form>
          )}

          {step === "code" && (
            <form onSubmit={verifyCode} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="code">Código de verificación</Label>
                <Input
                  id="code"
                  type="text"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  maxLength={6}
                  placeholder="000000"
                  value={code}
                  onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
                  required
                  className={`${inputClass} text-center text-2xl tracking-[0.5em]`}
                />
              </div>
              <Button type="submit" disabled={loading || code.length !== 6} className={buttonClass} size="lg">
                {loading ? "Verificando..." : "Verificar código"}
              </Button>
              <div className="text-center">
                <button
                  type="button"
                  disabled={loading}
                  onClick={() => requestCode()}
                  className="text-sm text-[#1793a5] hover:underline"
                >
                  Reenviar código
                </button>
              </div>
            </form>
          )}

          {step === "password" && (
            <form onSubmit={resetPassword} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="password">Nueva contraseña</Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className={inputClass}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirm">Confirmar contraseña</Label>
                <Input
                  id="confirm"
                  type="password"
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  required
                  className={inputClass}
                />
              </div>
              <Button type="submit" disabled={loading} className={buttonClass} size="lg">
                {loading ? "Guardando..." : "Restablecer contraseña"}
              </Button>
            </form>
          )}

          {step === "done" && (
            <Alert>
              <CheckCircle2 className="h-4 w-4" />
              <AlertDescription>Contraseña actualizada. Redirigiendo al inicio de sesión...</AlertDescription>
            </Alert>
          )}

          <div className="text-center">
            <Link href="/" className="text-sm text-[#1793a5] hover:underline">
              Volver al inicio de sesión
            </Link>
          </div>
        </CardContent>
      </Card>
    </main>
  )
}
