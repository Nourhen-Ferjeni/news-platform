"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Eye, EyeOff, Mail, Lock, Sparkles, ArrowRight } from "lucide-react"

export default function Login() {
  const router = useRouter()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 })

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePosition({ x: e.clientX, y: e.clientY })
    }

    window.addEventListener("mousemove", handleMouseMove)
    return () => window.removeEventListener("mousemove", handleMouseMove)
  }, [])

  // Floating particles effect
  const FloatingParticles = () => {
    return (
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[...Array(15)].map((_, i) => (
          <div
            key={i}
            className="absolute w-1 h-1 bg-primary/20 rounded-full animate-float"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 5}s`,
              animationDuration: `${15 + Math.random() * 10}s`,
            }}
          />
        ))}
      </div>
    )
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setLoading(true)

    // Basic validation
    if (!email || !password) {
      setError("Please fill in all fields")
      setLoading(false)
      return
    }

    if (!email.includes("@")) {
      setError("Please enter a valid email address")
      setLoading(false)
      return
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters long")
      setLoading(false)
      return
    }

    // Simulate authentication
    setTimeout(() => {
      localStorage.setItem("user", JSON.stringify({ email }))
      router.push("/dashboard")
      setLoading(false)
    }, 1500)
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-background via-secondary/5 to-background relative overflow-hidden">
      {/* Dynamic background effects */}
      <div className="absolute inset-0 opacity-30">
        <div className="absolute top-20 left-10 w-72 h-72 bg-primary/10 rounded-full blur-3xl animate-pulse-slow" />
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-accent/10 rounded-full blur-3xl animate-pulse-slow" style={{ animationDelay: '2s' }} />
      </div>

      {/* Animated grid background */}
      <div className="absolute inset-0 opacity-[0.02] pointer-events-none">
        <div className="grid grid-cols-8 gap-4 w-full h-full transform rotate-6 scale-110">
          {[...Array(32)].map((_, i) => (
            <div
              key={i}
              className="bg-foreground rounded-sm animate-pulse-subtle"
              style={{
                animationDelay: `${i * 0.2}s`,
                height: `${30 + Math.random() * 50}px`,
              }}
            />
          ))}
        </div>
      </div>

      <FloatingParticles />

      {/* Dynamic light effect */}
      <div 
        className="absolute inset-0 opacity-30 transition-opacity duration-1000 pointer-events-none"
        style={{
          background: `radial-gradient(400px at ${mousePosition.x}px ${mousePosition.y}px, rgba(120, 119, 198, 0.1), transparent 80%)`
        }}
      />

      {/* Header */}
      <nav className="relative z-10 flex items-center justify-between px-6 py-4 border-b border-border/50 bg-background/80 backdrop-blur-xl">
        <Link href="/" className="flex items-center gap-3 group">
          <div className="relative">
            <div className="text-2xl font-bold text-primary transition-all duration-500 group-hover:scale-110 group-hover:rotate-12">
              📰
            </div>
            <div className="absolute -inset-1 bg-primary/20 rounded-full blur-sm opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          </div>
          <span className="text-2xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent transition-all duration-300 group-hover:scale-105">
            NewsHub
          </span>
        </Link>

        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <span>New to NewsHub?</span>
          <Link href="/signup" className="text-primary font-semibold hover:underline transition-all duration-300 hover:scale-105">
            Create account
          </Link>
        </div>
      </nav>

      {/* Login Form */}
      <div className="flex-1 flex items-center justify-center px-6 py-20 relative z-10">
        <div className="w-full max-w-lg fade-in-up">
          {/* Enhanced card with modern design */}
          <div className="bg-card/40 backdrop-blur-sm rounded-2xl border border-border/50 p-8 shadow-2xl hover:shadow-3xl transition-all duration-500 hover:scale-105 group relative overflow-hidden">
            {/* Background gradient effect */}
            <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-accent/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-2xl" />
            
            {/* Header section */}
            <div className="relative text-center mb-8">
              
              <h1 className="text-4xl font-black mb-3 text-foreground leading-tight">
  Sign In to{" "}
  <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent inline">
    PressFlow
  </span>
</h1>
              
              <p className="text-muted-foreground text-lg leading-relaxed">
                Access your personalized news dashboard and stay informed
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6 relative">
              {/* Email Field */}
              <div className="group">
                <label className="block text-sm font-semibold mb-3 text-foreground flex items-center gap-2">
                  <Mail className="w-4 h-4 text-primary" />
                  Email Address
                </label>
                <div className="relative">
                  <Input
                    type="email"
                    placeholder="your@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-11 pr-4 py-3 rounded-xl border-2 border-border/50 bg-background/50 backdrop-blur-sm transition-all duration-300 focus:border-primary/50 focus:bg-background/80 group-hover:border-primary/30"
                  />
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                </div>
              </div>

              {/* Password Field */}
              <div className="group">
                <label className="block text-sm font-semibold mb-3 text-foreground flex items-center gap-2">
                  <Lock className="w-4 h-4 text-primary" />
                  Password
                </label>
                <div className="relative">
                  <Input
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-11 pr-11 py-3 rounded-xl border-2 border-border/50 bg-background/50 backdrop-blur-sm transition-all duration-300 focus:border-primary/50 focus:bg-background/80 group-hover:border-primary/30"
                  />
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors duration-200"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Forgot Password */}
              <div className="flex justify-end">
                <Link href="/forgot-password" className="text-sm text-primary font-semibold hover:underline transition-all duration-300 hover:scale-105">
                  Forgot your password?
                </Link>
              </div>

              {/* Error Message */}
              {error && (
                <div className="p-4 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-sm backdrop-blur-sm animate-shake">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-destructive rounded-full animate-pulse" />
                    {error}
                  </div>
                </div>
              )}

              {/* Submit Button */}
              <Button
                type="submit"
                className="w-full bg-primary hover:bg-primary/90 text-primary-foreground text-lg py-3 rounded-xl transition-all duration-500 hover:shadow-2xl hover:shadow-primary/30 hover:scale-105 group relative overflow-hidden"
                disabled={loading}
              >
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
                <span className="relative flex items-center justify-center gap-3">
                  {loading ? (
                    <>
                      <div className="w-5 h-5 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                      Signing In...
                    </>
                  ) : (
                    <>
                      Access Dashboard
                      <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform duration-300" />
                    </>
                  )}
                </span>
              </Button>
            </form>

            {/* Sign Up Link */}
            <div className="text-center pt-8 border-t border-border/30">
              <p className="text-muted-foreground">
                Don't have an account?{" "}
                <Link 
                  href="/signup" 
                  className="text-primary font-bold hover:underline transition-all duration-300 hover:scale-105 inline-flex items-center gap-1 group"
                >
                  Create Account
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform duration-300" />
                </Link>
              </p>
            </div>
          </div>

          {/* Security Note */}
          <div className="mt-6 text-center">
            <p className="text-xs text-muted-foreground flex items-center justify-center gap-2">
              <Lock className="w-3 h-3" />
              Your data is securely encrypted and protected
            </p>
          </div>
        </div>
      </div>
    </main>
  )
}