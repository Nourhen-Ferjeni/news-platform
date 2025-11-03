"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import Link from "next/link"
import { useRouter } from "next/navigation"

export default function Signup() {
  const router = useRouter()
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
  })
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setLoading(true)

    // Validation
    if (!formData.name || !formData.email || !formData.password || !formData.confirmPassword) {
      setError("Veuillez remplir tous les champs")
      setLoading(false)
      return
    }

    if (!formData.email.includes("@")) {
      setError("Veuillez entrer une adresse email valide")
      setLoading(false)
      return
    }

    if (formData.password.length < 6) {
      setError("Le mot de passe doit contenir au moins 6 caractères")
      setLoading(false)
      return
    }

    if (formData.password !== formData.confirmPassword) {
      setError("Les mots de passe ne correspondent pas")
      setLoading(false)
      return
    }

    // Simulate registration
    setTimeout(() => {
      localStorage.setItem(
        "user",
        JSON.stringify({
          name: formData.name,
          email: formData.email,
        }),
      )
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

      {/* Signup Form */}
      <div className="flex-1 flex items-center justify-center px-6 py-20">
        <div className="w-full max-w-md fade-in-up">
          <div className="bg-card rounded-lg border border-border p-8 shadow-lg">
            <h1 className="text-3xl font-bold mb-2 text-foreground">Inscription</h1>
            <p className="text-muted-foreground mb-8">Créez votre compte pour accéder à nos actualités</p>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2 text-foreground">Nom complet</label>
                <Input
                  type="text"
                  name="name"
                  placeholder="Jean Dupont"
                  value={formData.name}
                  onChange={handleChange}
                  className="w-full"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2 text-foreground">Email</label>
                <Input
                  type="email"
                  name="email"
                  placeholder="votre@email.com"
                  value={formData.email}
                  onChange={handleChange}
                  className="w-full"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2 text-foreground">Mot de passe</label>
                <Input
                  type="password"
                  name="password"
                  placeholder="••••••"
                  value={formData.password}
                  onChange={handleChange}
                  className="w-full"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2 text-foreground">Confirmer le mot de passe</label>
                <Input
                  type="password"
                  name="confirmPassword"
                  placeholder="••••••"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  className="w-full"
                />
              </div>

              {error && <div className="p-3 rounded-md bg-destructive/10 text-destructive text-sm">{error}</div>}

              <Button
                type="submit"
                className="w-full bg-primary hover:bg-primary/90 text-primary-foreground"
                disabled={loading}
              >
                {loading ? "Inscription..." : "S'inscrire"}
              </Button>
            </form>

            <p className="text-center text-muted-foreground mt-6">
              Déjà un compte ?{" "}
              <Link href="/login" className="text-primary font-semibold hover:underline">
                Se connecter
              </Link>
            </p>
          </div>
        </div>
      </div>
    </main>
  )
}
