"use client"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { TrendingUp, Shield, ArrowRight, BarChart3, Sparkles, Globe, Zap, Eye, Users, Target, Clock } from "lucide-react"
import { useEffect, useState, useRef } from "react"

export default function Home() {
  const [parallaxOffset, setParallaxOffset] = useState(0)
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 })
  const [isVisible, setIsVisible] = useState(false)
  const heroRef = useRef(null)

  useEffect(() => {
    const handleScroll = () => {
      setParallaxOffset(window.scrollY * 0.5)
    }

    const handleMouseMove = (e: MouseEvent) => {
      setMousePosition({ x: e.clientX, y: e.clientY })
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true)
        }
      },
      { threshold: 0.1 }
    )

    if (heroRef.current) {
      observer.observe(heroRef.current)
    }

    window.addEventListener("scroll", handleScroll)
    window.addEventListener("mousemove", handleMouseMove)

    return () => {
      window.removeEventListener("scroll", handleScroll)
      window.removeEventListener("mousemove", handleMouseMove)
      if (heroRef.current) {
        observer.unobserve(heroRef.current)
      }
    }
  }, [])

  // Floating particles effect
  const FloatingParticles = () => {
    return (
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[...Array(20)].map((_, i) => (
          <div
            key={i}
            className="absolute w-1 h-1 bg-primary/30 rounded-full animate-float"
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

  // Animated news grid background component
  const NewsGridBackground = () => {
    return (
      <div className="absolute inset-0 opacity-[0.02] pointer-events-none">
        <div className="grid grid-cols-8 gap-4 w-full h-full transform rotate-12 scale-150">
          {[...Array(48)].map((_, i) => (
            <div
              key={i}
              className="bg-foreground rounded-sm animate-pulse-subtle"
              style={{
                animationDelay: `${i * 0.1}s`,
                height: `${40 + Math.random() * 60}px`,
              }}
            />
          ))}
        </div>
      </div>
    )
  }

  // Custom cursor component
  const CustomCursor = () => {
    return (
      <div
        className="fixed w-8 h-8 pointer-events-none z-50 mix-blend-difference transition-transform duration-100 ease-out"
        style={{
          left: `${mousePosition.x}px`,
          top: `${mousePosition.y}px`,
          transform: 'translate(-50%, -50%)',
        }}
      >
        <div className="w-2 h-2 bg-primary rounded-full animate-ping absolute inset-0" />
        <div className="w-2 h-2 bg-primary rounded-full" />
      </div>
    )
  }

  return (
    <main className="min-h-screen bg-background overflow-hidden relative">
      <CustomCursor />
      
      {/* Enhanced Navigation */}
      <nav className="fixed top-0 w-full z-50 bg-background/90 backdrop-blur-xl border-b border-border/50 transition-all duration-300 hover:bg-background/95">
        <div className="max-w-7xl mx-auto flex items-center justify-between px-6 py-4">
          <div className="flex items-center gap-3 group cursor-pointer">
            <div className="relative">
              
              <div className="absolute -inset-1 bg-primary/20 rounded-full blur-sm opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            </div>
            <span className="text-2xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent transition-all duration-300 group-hover:scale-105">
              NewsHub
            </span>
          </div>
          
          <div className="flex gap-3">
            <Link href="/login" className="fade-in-up" style={{ animationDelay: "0.1s" }}>
              <Button 
                variant="ghost" 
                className="text-foreground hover:bg-secondary/80 hover:scale-105 transition-all duration-300 rounded-full group"
              >
                <Eye className="w-4 h-4 mr-2 opacity-70 group-hover:opacity-100 transition-opacity" />
                Sign In
              </Button>
            </Link>
            <Link href="/signup" className="fade-in-up" style={{ animationDelay: "0.15s" }}>
              <Button className="bg-primary hover:bg-primary/90 text-primary-foreground rounded-full transition-all duration-300 hover:shadow-2xl hover:shadow-primary/30 hover:scale-105 group">
                <Sparkles className="w-4 h-4 mr-2 group-hover:rotate-180 transition-transform duration-500" />
                Sign Up
              </Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Enhanced Hero Section */}
      <section 
        ref={heroRef}
        className="min-h-screen flex items-center justify-center px-6 pt-20 relative overflow-hidden"
      >
        <NewsGridBackground />
        <FloatingParticles />
        
        {/* Dynamic light effects */}
        <div 
          className="absolute inset-0 opacity-40 transition-opacity duration-1000"
          style={{
            background: `radial-gradient(600px at ${mousePosition.x}px ${mousePosition.y}px, rgba(120, 119, 198, 0.15), transparent 80%)`
          }}
        />
        
        <div className="absolute inset-0 opacity-30">
          <div className="absolute top-1/4 -left-10 w-72 h-72 bg-accent rounded-full blur-3xl opacity-20 animate-pulse-slow" />
          <div className="absolute bottom-1/4 -right-10 w-96 h-96 bg-primary rounded-full blur-3xl opacity-20 animate-pulse-slow" style={{ animationDelay: "2s" }} />
        </div>

        <div className="relative z-10 max-w-6xl mx-auto text-center">
          {/* Enhanced badge */}
          <div className="inline-flex items-center gap-2 mb-8 px-6 py-3 rounded-full bg-secondary/50 border border-accent/30 backdrop-blur-sm fade-in-up hover:scale-105 transition-transform duration-300 group cursor-pointer">
            <Zap className="w-4 h-4 text-primary group-hover:scale-110 transition-transform" />
            <span className="text-sm font-medium text-foreground">Next Generation Intelligent News Platform</span>
          </div>

          {/* Enhanced main title */}
          <div className="space-y-6 mb-12">
            <h1 className="text-6xl md:text-8xl lg:text-9xl font-black tracking-tight fade-in-up" style={{ lineHeight: "1.1" }}>
              <span className="text-foreground block">News</span>
              <span className="bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent bg-size-200 animate-gradient-x block">
                Reinvented
              </span>
            </h1>
            
            {/* Animated slogan */}
            <div className="fade-in-up" style={{ animationDelay: "0.2s" }}>
              <p className="text-xl md:text-2xl text-muted-foreground font-light max-w-4xl mx-auto leading-relaxed">
                Stay informed, stay <span className="text-primary font-semibold">inspired</span>. 
                <br />
                Your window to the world, <span className="text-accent font-semibold">without the noise</span>.
              </p>
            </div>
          </div>

          {/* Enhanced CTA */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center fade-in-up" style={{ animationDelay: "0.3s" }}>
            <Link href="/dashboard" className="group">
              <Button
                size="lg"
                className="relative w-full sm:w-auto bg-primary hover:bg-primary/90 text-primary-foreground text-lg px-10 h-14 rounded-2xl transition-all duration-500 hover:shadow-2xl hover:shadow-primary/40 hover:scale-105 overflow-hidden"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
                <span className="relative flex items-center gap-3">
                  Explore News 
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform duration-300" />
                </span>
              </Button>
            </Link>
            
            <Link href="/about" className="group">
              <Button
                size="lg"
                variant="outline"
                className="w-full sm:w-auto border-2 border-border text-foreground hover:bg-secondary/50 hover:border-primary/50 rounded-2xl text-lg px-10 h-14 transition-all duration-500 bg-transparent hover:scale-105 group"
              >
                <Globe className="w-5 h-5 mr-2 group-hover:rotate-180 transition-transform duration-500" />
                Learn More
              </Button>
            </Link>
          </div>

          {/* Real-time stats */}
          <div className="grid grid-cols-3 gap-8 max-w-2xl mx-auto mt-20 fade-in-up" style={{ animationDelay: "0.4s" }}>
            {[
              { number: "10K+", label: "Verified Articles" },
              { number: "500+", label: "Trusted Sources" },
              { number: "99.8%", label: "Accuracy Rate" },
            ].map((stat, idx) => (
              <div key={idx} className="text-center group cursor-pointer">
                <div className="text-2xl md:text-3xl font-bold text-primary group-hover:scale-110 transition-transform duration-300">
                  {stat.number}
                </div>
                <div className="text-xs text-muted-foreground mt-2 group-hover:text-foreground transition-colors">
                  {stat.label}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Scroll indicator */}
        <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 fade-in-up" style={{ animationDelay: "1s" }}>
          <div className="w-6 h-10 border-2 border-border rounded-full flex justify-center">
            <div className="w-1 h-3 bg-primary rounded-full mt-2 animate-bounce" />
          </div>
        </div>
      </section>

      {/* Features Section - Premium Design */}
      <section className="py-32 px-6 bg-gradient-to-b from-background to-secondary/5 border-t border-border/50 relative overflow-hidden">
        <FloatingParticles />
        
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-20 fade-in-up">
            <span className="text-sm font-semibold text-primary tracking-wide uppercase bg-primary/10 px-4 py-2 rounded-full">
              Innovation
            </span>
            <h2 className="text-5xl md:text-6xl font-bold text-foreground mt-6 mb-4 leading-tight">
              The Future of News
              <br />
              <span className="text-primary">Starts Today</span>
            </h2>
            <p className="text-lg text-muted-foreground max-w-3xl mx-auto leading-relaxed">
              A revolutionary reading experience that transforms how you consume news
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 lg:gap-12">
            {[
              {
                icon: Shield,
                number: "01",
                title: "Smart Verification",
                description: "Our AI analyzes every piece of information in real-time with transparent trust scoring",
                color: "from-blue-500 to-cyan-500",
              },
              {
                icon: BarChart3,
                number: "02",
                title: "Contextual Analysis",
                description: "Understand the issues with intelligent summaries and multiple perspectives",
                color: "from-purple-500 to-pink-500",
              },
              {
                icon: TrendingUp,
                number: "03",
                title: "Immersive Media",
                description: "Articles, podcasts and videos enhanced in a unique reading experience",
                color: "from-orange-500 to-red-500",
              },
            ].map((feature, idx) => (
              <div
                key={idx}
                className="group relative fade-in-up overflow-hidden"
                style={{ animationDelay: `${0.1 * idx}s` }}
              >
                <div className={`absolute inset-0 bg-gradient-to-br ${feature.color} opacity-0 group-hover:opacity-5 transition-opacity duration-500 rounded-3xl`} />
                <div className="relative p-8 border border-border/50 rounded-3xl bg-card/30 backdrop-blur-sm hover:bg-card/50 transition-all duration-500 group-hover:scale-105 group-hover:border-primary/30">
                  <div className="flex items-start justify-between mb-6">
                    <div className="flex flex-col gap-4">
                      <span className="text-sm font-black text-primary/60 tracking-wider">{feature.number}</span>
                      <div className="relative">
                        <feature.icon className="w-10 h-10 text-primary group-hover:scale-110 transition-all duration-500" />
                        <div className="absolute inset-0 bg-primary/20 rounded-full blur-md opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                      </div>
                    </div>
                  </div>
                  <h3 className="text-2xl font-bold mb-4 text-foreground group-hover:text-primary transition-colors duration-300">
                    {feature.title}
                  </h3>
                  <p className="text-muted-foreground leading-relaxed text-sm group-hover:text-foreground/80 transition-colors">
                    {feature.description}
                  </p>
                  
                  {/* Decorative line */}
                  <div className="absolute bottom-0 left-8 right-8 h-0.5 bg-gradient-to-r from-transparent via-primary/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Why Choose Us Section */}
      <section className="py-32 px-6 bg-gradient-to-b from-background to-secondary/5 border-t border-border/50 relative overflow-hidden">
        <FloatingParticles />
        
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-20 fade-in-up">
            <span className="text-sm font-semibold text-primary tracking-wide uppercase bg-primary/10 px-4 py-2 rounded-full">
              Excellence
            </span>
            <h2 className="text-5xl md:text-6xl font-bold text-foreground mt-6 mb-4 leading-tight">
              Why Choose
              <br />
              <span className="text-primary">PressFlow</span>
            </h2>
            <p className="text-lg text-muted-foreground max-w-3xl mx-auto leading-relaxed">
              Discover what makes us the reference platform for reliable and intelligent information
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              {
                icon: Shield,
                title: "Absolute Reliability",
                description: "All our sources are verified and certified by our advanced trust algorithm",
                features: ["Multi-source verification", "Trust scoring", "Reliability history"]
              },
              {
                icon: Zap,
                title: "Lightning Fast",
                description: "Receive crucial information in real-time with instant intelligent processing",
                features: ["Real-time updates", "Smart notifications", "Express synthesis"]
              },
              {
                icon: Users,
                title: "Community Driven",
                description: "Join a community of informed readers who shape the future of news",
                features: ["Expert discussions", "Collaborative verification", "Knowledge sharing"]
              },
              {
                icon: Target,
                title: "Precision Focused",
                description: "Get exactly the information you need with our advanced personalization",
                features: ["Smart filtering", "Personalized feeds", "Relevance scoring"]
              },
              {
                icon: Clock,
                title: "24/7 Coverage",
                description: "Never miss important news with our continuous global monitoring",
                features: ["Global coverage", "Continuous updates", "Breaking news alerts"]
              },
              {
                icon: BarChart3,
                title: "Deep Insights",
                description: "Go beyond headlines with comprehensive analysis and context",
                features: ["In-depth analysis", "Trend forecasting", "Contextual background"]
              }
            ].map((feature, idx) => (
              <div
                key={idx}
                className="group relative fade-in-up"
                style={{ animationDelay: `${0.1 * idx}s` }}
              >
                <div className="relative p-8 border border-border/50 rounded-3xl bg-card/30 backdrop-blur-sm hover:bg-card/50 transition-all duration-500 group-hover:scale-105 group-hover:border-primary/30 h-full">
                  <div className="flex items-center gap-4 mb-6">
                    <div className="relative">
                      <feature.icon className="w-12 h-12 text-primary group-hover:scale-110 transition-all duration-500" />
                      <div className="absolute inset-0 bg-primary/20 rounded-full blur-md opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                    </div>
                    <h3 className="text-2xl font-bold text-foreground group-hover:text-primary transition-colors">
                      {feature.title}
                    </h3>
                  </div>
                  
                  <p className="text-muted-foreground leading-relaxed mb-6 group-hover:text-foreground/80 transition-colors">
                    {feature.description}
                  </p>
                  
                  <ul className="space-y-3">
                    {feature.features.map((item, itemIdx) => (
                      <li key={itemIdx} className="flex items-center gap-3 text-sm text-muted-foreground group-hover:text-foreground/80 transition-colors">
                        <div className="w-1.5 h-1.5 bg-primary rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA - Premium Version */}
      <section className="py-32 px-6 bg-gradient-to-br from-primary via-primary/90 to-accent text-primary-foreground text-center relative overflow-hidden">
        {/* Animated background effects */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0 bg-grid-white/[0.02] bg-[size:60px_60px]" />
        </div>
        <div className="absolute top-0 right-0 w-96 h-96 bg-primary-foreground/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3 animate-pulse-slow" />
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-accent/10 rounded-full blur-3xl translate-y-1/2 -translate-x-1/3 animate-pulse-slow" style={{ animationDelay: "2s" }} />

        <div className="relative z-10 max-w-4xl mx-auto">
          <Sparkles className="w-16 h-16 mx-auto mb-8 opacity-80 animate-pulse" />
          
          <h2 className="text-5xl md:text-6xl font-black mb-8 fade-in-up leading-tight">
            Join the
            <br />
            <span className="bg-gradient-to-r from-primary-foreground to-primary-foreground/80 bg-clip-text text-transparent">
              Revolution
            </span>
          </h2>
          
          <p className="text-xl mb-12 opacity-95 fade-in-up max-w-2xl mx-auto leading-relaxed" style={{ animationDelay: "0.1s" }}>
            Thousands of informed readers are already transforming their news consumption with PressFlow
          </p>
          
          <Link href="/signup" className="fade-in-up inline-block" style={{ animationDelay: "0.2s" }}>
            <Button
              size="lg"
              className="bg-primary-foreground text-primary hover:bg-primary-foreground/90 text-lg px-12 h-14 rounded-2xl transition-all duration-500 shadow-2xl hover:shadow-3xl hover:scale-110 group relative overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
              <span className="relative flex items-center gap-3">
                Get Started Now
                <Zap className="w-5 h-5 group-hover:scale-110 group-hover:rotate-12 transition-transform duration-300" />
              </span>
            </Button>
          </Link>
          
          {/* Trust stats */}
          <div className="grid grid-cols-3 gap-8 max-w-md mx-auto mt-16 fade-in-up" style={{ animationDelay: "0.3s" }}>
            {[
              { number: "50K+", label: "Readers" },
              { number: "24/7", label: "Coverage" },
              { number: "100%", label: "Verified" },
            ].map((stat, idx) => (
              <div key={idx} className="text-center">
                <div className="text-2xl font-bold opacity-95">{stat.number}</div>
                <div className="text-sm opacity-80 mt-1">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </main>
  )
}