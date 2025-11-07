"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Eye, EyeOff, Mail, Lock, User, Sparkles, ArrowRight, Check } from "lucide-react"

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
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
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
      setError("Please fill in all fields")
      setLoading(false)
      return
    }

    if (!formData.email.includes("@")) {
      setError("Please enter a valid email address")
      setLoading(false)
      return
    }

    if (formData.password.length < 6) {
      setError("Password must be at least 6 characters long")
      setLoading(false)
      return
    }

    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match")
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
    }, 1500)
  }

  // Password strength indicator
  const getPasswordStrength = () => {
    if (formData.password.length === 0) return 0
    let strength = 0
    if (formData.password.length >= 6) strength += 25
    if (formData.password.match(/[a-z]/) && formData.password.match(/[A-Z]/)) strength += 25
    if (formData.password.match(/\d/)) strength += 25
    if (formData.password.match(/[^a-zA-Z\d]/)) strength += 25
    return strength
  }

  const passwordStrength = getPasswordStrength()

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
          <span>Already have an account?</span>
          <Link href="/login" className="text-primary font-semibold hover:underline transition-all duration-300 hover:scale-105">
            Sign in
          </Link>
        </div>
      </nav>

      {/* Signup Form - Increased width only */}
      <div className="flex-1 flex items-center justify-center px-6 py-12 relative z-10">
        <div className="w-full max-w-lg fade-in-up">
          {/* Enhanced card with modern design */}
          <div className="bg-card/40 backdrop-blur-sm rounded-2xl border border-border/50 p-8 shadow-2xl hover:shadow-3xl transition-all duration-500 hover:scale-105 group relative overflow-hidden">
            {/* Background gradient effect */}
            <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-accent/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-2xl" />
            
            {/* Header section */}
            <div className="relative text-center mb-8">
              
              
              <h1 className="text-4xl font-black mb-3 text-foreground leading-tight">
                Create Your{" "}
                <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent inline">
                  NewsHub
                </span>{" "}
                Account
              </h1>
              
              <p className="text-muted-foreground text-lg leading-relaxed">
                Start your journey to smarter news consumption
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6 relative">
              {/* Name Field */}
              <div className="group">
                <label className="block text-sm font-semibold mb-3 text-foreground">
                  Full Name
                </label>
                <div className="relative">
                  <Input
                    type="text"
                    name="name"
                    placeholder="Enter your full name"
                    value={formData.name}
                    onChange={handleChange}
                    className="w-full px-4 py-3 rounded-xl border-2 border-border/50 bg-background/50 backdrop-blur-sm transition-all duration-300 focus:border-primary/50 focus:bg-background/80 group-hover:border-primary/30"
                  />
                </div>
              </div>

              {/* Email Field */}
              <div className="group">
                <label className="block text-sm font-semibold mb-3 text-foreground">
                  Email Address
                </label>
                <div className="relative">
                  <Input
                    type="email"
                    name="email"
                    placeholder="your@email.com"
                    value={formData.email}
                    onChange={handleChange}
                    className="w-full px-4 py-3 rounded-xl border-2 border-border/50 bg-background/50 backdrop-blur-sm transition-all duration-300 focus:border-primary/50 focus:bg-background/80 group-hover:border-primary/30"
                  />
                </div>
              </div>

              {/* Password Field */}
              <div className="group">
                <label className="block text-sm font-semibold mb-3 text-foreground">
                  Password
                </label>
                <div className="relative">
                  <Input
                    type={showPassword ? "text" : "password"}
                    name="password"
                    placeholder="Create a strong password"
                    value={formData.password}
                    onChange={handleChange}
                    className="w-full px-4 py-3 rounded-xl border-2 border-border/50 bg-background/50 backdrop-blur-sm transition-all duration-300 focus:border-primary/50 focus:bg-background/80 group-hover:border-primary/30"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors duration-200"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>

                {/* Password Strength Indicator */}
                {formData.password && (
                  <div className="mt-3 space-y-2">
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>Password strength</span>
                      <span className={
                        passwordStrength >= 75 ? "text-green-500" :
                        passwordStrength >= 50 ? "text-yellow-500" :
                        passwordStrength >= 25 ? "text-orange-500" : "text-red-500"
                      }>
                        {passwordStrength >= 75 ? "Strong" :
                         passwordStrength >= 50 ? "Good" :
                         passwordStrength >= 25 ? "Weak" : "Very Weak"}
                      </span>
                    </div>
                    <div className="w-full bg-secondary rounded-full h-2">
                      <div 
                        className={`h-2 rounded-full transition-all duration-500 ${
                          passwordStrength >= 75 ? "bg-green-500" :
                          passwordStrength >= 50 ? "bg-yellow-500" :
                          passwordStrength >= 25 ? "bg-orange-500" : "bg-red-500"
                        }`}
                        style={{ width: `${passwordStrength}%` }}
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Confirm Password Field */}
              <div className="group">
                <label className="block text-sm font-semibold mb-3 text-foreground">
                  Confirm Password
                </label>
                <div className="relative">
                  <Input
                    type={showConfirmPassword ? "text" : "password"}
                    name="confirmPassword"
                    placeholder="Confirm your password"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    className="w-full px-4 py-3 rounded-xl border-2 border-border/50 bg-background/50 backdrop-blur-sm transition-all duration-300 focus:border-primary/50 focus:bg-background/80 group-hover:border-primary/30"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors duration-200"
                  >
                    {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>

                {/* Password Match Indicator */}
                {formData.confirmPassword && (
                  <div className="mt-2 flex items-center gap-2 text-xs">
                    {formData.password === formData.confirmPassword ? (
                      <div className="text-green-500 flex items-center gap-1">
                        <Check className="w-3 h-3" />
                        Passwords match
                      </div>
                    ) : (
                      <div className="text-red-500 flex items-center gap-1">
                        <div className="w-3 h-3 rounded-full bg-red-500" />
                        Passwords do not match
                      </div>
                    )}
                  </div>
                )}
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
                      Creating Account...
                    </>
                  ) : (
                    <>
                      Create Account
                      <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform duration-300" />
                    </>
                  )}
                </span>
              </Button>
            </form>

            {/* Terms and Privacy */}
            <div className="text-center mt-6">
              <p className="text-xs text-muted-foreground">
                By creating an account, you agree to our{" "}
                <Link href="/terms" className="text-primary hover:underline">Terms of Service</Link>
                {" "}and{" "}
                <Link href="/privacy" className="text-primary hover:underline">Privacy Policy</Link>
              </p>
            </div>

            {/* Sign In Link */}
            <div className="text-center pt-8 border-t border-border/30">
              <p className="text-muted-foreground">
                Already have an account?{" "}
                <Link 
                  href="/login" 
                  className="text-primary font-bold hover:underline transition-all duration-300 hover:scale-105 inline-flex items-center gap-1 group"
                >
                  Sign In
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform duration-300" />
                </Link>
              </p>
            </div>
          </div>

          {/* Security Note */}
          <div className="mt-6 text-center">
            <p className="text-xs text-muted-foreground">
              Your data is securely encrypted and protected
            </p>
          </div>
        </div>
      </div>
    </main>
  )
}