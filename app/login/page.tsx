"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import Link from "next/link"
import { useRouter } from "next/navigation"

export default function Login() {
  const router = useRouter()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setLoading(true)

    // Basic validation
    if (!email || !password) {
      setError("Veuillez remplir tous les champs")
      setLoading(false)
      return
    }

    if (!email.includes("@")) {
      setError("Veuillez entrer une adresse email valide")
      setLoading(false)
      return
    }

    if (password.length < 6) {
      setError("Le mot de passe doit contenir au moins 6 caractères")
      setLoading(false)
      return
    }

    // Simulate authentication
    setTimeout(() => {
      localStorage.setItem("user", JSON.stringify({ email }))
      router.push("/dashboard")
      setLoading(false)
    }, 1000)
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-background to-secondary/20 flex flex-col">
      {/* Header */}
      <nav className="flex items-center justify-between px-6 py-4 border-b border-border">
        <Link href="/" className="text-2xl font-bold text-primary">
          <span className="text-2xl">📰</span> Press
        </Link>
      </nav>

      {/* Login Form */}
      <div className="flex-1 flex items-center justify-center px-6 py-20">
        <div className="w-full max-w-md fade-in-up">
          <div className="bg-card rounded-lg border border-border p-8 shadow-lg">
            <h1 className="text-3xl font-bold mb-2 text-foreground">Connexion</h1>
            <p className="text-muted-foreground mb-8">Connectez-vous à votre compte pour continuer</p>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2 text-foreground">Email</label>
                <Input
                  type="email"
                  placeholder="votre@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2 text-foreground">Mot de passe</label>
                <Input
                  type="password"
                  placeholder="••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full"
                />
              </div>

              {error && <div className="p-3 rounded-md bg-destructive/10 text-destructive text-sm">{error}</div>}

              <Button
                type="submit"
                className="w-full bg-primary hover:bg-primary/90 text-primary-foreground"
                disabled={loading}
              >
                {loading ? "Connexion..." : "Se connecter"}
              </Button>
            </form>

            <p className="text-center text-muted-foreground mt-6">
              Pas encore de compte ?{" "}
              <Link href="/signup" className="text-primary font-semibold hover:underline">
                S'inscrire
              </Link>
            </p>
          </div>
        </div>
      </div>
    </main>
  )
}
