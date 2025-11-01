"use client"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { TrendingUp, Shield, ArrowRight, BarChart3 } from "lucide-react"
import { useEffect, useState } from "react"

export default function Home() {
  const [parallaxOffset, setParallaxOffset] = useState(0)

  useEffect(() => {
    const handleScroll = () => {
      setParallaxOffset(window.scrollY * 0.5)
    }
    window.addEventListener("scroll", handleScroll)
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  return (
    <main className="min-h-screen bg-background overflow-hidden">
      {/* Navigation */}
      <nav className="fixed top-0 w-full z-50 bg-background/80 backdrop-blur-md border-b border-border">
        <div className="max-w-7xl mx-auto flex items-center justify-between px-6 py-4">
          <div className="text-2xl font-bold text-primary fade-in">📰 Press</div>
          <div className="flex gap-3">
            <Link href="/login" className="fade-in-up" style={{ animationDelay: "0.1s" }}>
              <Button variant="ghost" className="text-foreground hover:bg-secondary">
                Connexion
              </Button>
            </Link>
            <Link href="/signup" className="fade-in-up" style={{ animationDelay: "0.15s" }}>
              <Button className="bg-primary hover:bg-primary/90 text-primary-foreground rounded-full">
                Inscription
              </Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="min-h-screen flex items-center justify-center px-6 pt-20 relative overflow-hidden">
        <div className="absolute inset-0 opacity-40">
          <div className="absolute top-20 right-20 w-72 h-72 bg-accent rounded-full blur-3xl opacity-20 animate-pulse"></div>
          <div
            className="absolute bottom-20 left-20 w-96 h-96 bg-primary rounded-full blur-3xl opacity-20 animate-pulse"
            style={{ animationDelay: "1s" }}
          ></div>
        </div>

        <div className="relative z-10 max-w-4xl mx-auto text-center">
          <div className="inline-block mb-6 px-4 py-2 rounded-full bg-secondary border border-accent/20 fade-in-up">
            <span className="text-sm font-medium text-foreground">Nouvelle génération d'actualités</span>
          </div>

          <h1
            className="text-7xl md:text-8xl font-bold mb-8 fade-in-up"
            style={{ lineHeight: "1.1", animationDelay: "0.05s" }}
          >
            <span className="text-foreground">Actualités</span>
            <br />
            <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">Vérifiées</span>
          </h1>

          <p
            className="text-lg md:text-xl text-muted-foreground mb-12 fade-in-up max-w-2xl mx-auto leading-relaxed"
            style={{ animationDelay: "0.1s" }}
          >
            Plateforme d'actualités intelligente avec analyse approfondie, détection des fausses informations et
            vérification de sources en temps réel
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center" style={{ animationDelay: "0.15s" }}>
            <Link href="/dashboard" className="fade-in-up">
              <Button
                size="lg"
                className="w-full sm:w-auto bg-primary hover:bg-primary/90 text-primary-foreground text-base px-8 h-12 rounded-full transition-all duration-300 hover:shadow-lg hover:shadow-primary/30 hover:scale-105"
              >
                Commencer <ArrowRight size={20} />
              </Button>
            </Link>
            <Link href="/signup" className="fade-in-up" style={{ animationDelay: "0.05s" }}>
              <Button
                size="lg"
                variant="outline"
                className="w-full sm:w-auto border border-border text-foreground hover:bg-secondary rounded-full text-base px-8 h-12 transition-all duration-300 bg-transparent hover:scale-105"
              >
                En savoir plus
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Features Section - Enhanced Design */}
      <section className="py-32 px-6 bg-gradient-to-b from-background to-secondary/10 border-t border-border relative">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-20 fade-in-up">
            <span className="text-sm font-semibold text-primary tracking-wide uppercase">Capacités</span>
            <h2 className="text-5xl md:text-6xl font-bold text-foreground mt-3 leading-tight">
              Tout ce dont vous avez besoin pour rester informé
            </h2>
            <p className="text-lg text-muted-foreground max-w-3xl mx-auto mt-6">
              Une plateforme complète conçue pour la confiance, la précision et la compréhension approfondie
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 lg:gap-12">
            {[
              {
                icon: Shield,
                number: "01",
                title: "Vérification Intelligente",
                description:
                  "Détection avancée des fausses informations avec analyse en temps réel et score de confiance précis",
              },
              {
                icon: BarChart3,
                number: "02",
                title: "Analyse Approfondie",
                description:
                  "Contextualisation automatique avec résumés structurés et perspectives multiples sur chaque sujet",
              },
              {
                icon: TrendingUp,
                number: "03",
                title: "Contenu Multimédia",
                description:
                  "Articles, vidéos et podcasts enrichis avec analyses complètes et vérifications de sources",
              },
            ].map((feature, idx) => (
              <div
                key={idx}
                className="group relative fade-in-up overflow-hidden"
                style={{ animationDelay: `${0.1 * idx}s` }}
              >
                <div className="absolute -inset-1 bg-gradient-to-br from-primary/5 to-accent/5 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                <div className="relative p-8 border border-border rounded-2xl bg-card/40 hover:bg-card/70 transition-all duration-300">
                  <div className="flex items-start justify-between mb-6">
                    <div className="flex flex-col gap-4">
                      <span className="text-sm font-bold text-primary/60 tracking-wider">{feature.number}</span>
                      <feature.icon className="w-8 h-8 text-primary group-hover:text-accent group-hover:scale-110 transition-all duration-300" />
                    </div>
                  </div>
                  <h3 className="text-2xl font-semibold mb-3 text-foreground group-hover:text-accent transition-colors">
                    {feature.title}
                  </h3>
                  <p className="text-muted-foreground leading-relaxed text-sm">{feature.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Trending Topics - Enhanced */}
      <section className="py-24 px-6 bg-background border-t border-border">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-end justify-between mb-16 fade-in-up">
            <div>
              <span className="text-sm font-semibold text-primary tracking-wide uppercase">Explorez</span>
              <h2 className="text-4xl md:text-5xl font-bold text-foreground mt-2">Tendances du moment</h2>
              <p className="text-muted-foreground mt-4 max-w-2xl">
                Découvrez les sujets qui font l'actualité et captent l'attention des lecteurs
              </p>
            </div>
            <Link href="/dashboard" className="hidden md:block fade-in-up" style={{ animationDelay: "0.1s" }}>
              <Button variant="outline" className="rounded-full bg-transparent">
                Voir tous <ArrowRight size={16} className="ml-2" />
              </Button>
            </Link>
          </div>

          <div className="grid md:grid-cols-4 gap-4">
            {[
              { tag: "Intelligence Artificielle", count: "2,541", icon: "🤖" },
              { tag: "Technologie Blockchain", count: "1,892", icon: "🔗" },
              { tag: "Durabilité", count: "1,245", icon: "🌱" },
              { tag: "Cybersécurité", count: "956", icon: "🔒" },
            ].map((topic, idx) => (
              <Link key={idx} href="/dashboard">
                <div
                  className="group p-6 rounded-xl border border-border bg-card/50 hover:bg-card hover:border-primary transition-all duration-300 cursor-pointer fade-in-up hover:shadow-lg hover:-translate-y-1"
                  style={{ animationDelay: `${0.05 * idx}s` }}
                >
                  <div className="flex items-start justify-between mb-4">
                    <span className="text-3xl">{topic.icon}</span>
                    <span className="text-xs font-bold text-primary/60">{topic.count}</span>
                  </div>
                  <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors text-sm">
                    {topic.tag}
                  </h3>
                  <p className="text-xs text-muted-foreground mt-2">Découvrir</p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 px-6 bg-gradient-to-r from-primary via-primary/80 to-accent text-primary-foreground text-center relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0 bg-grid-small"></div>
        </div>
        <div className="absolute top-0 right-0 w-96 h-96 bg-primary-foreground/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3"></div>

        <div className="relative z-10 max-w-3xl mx-auto">
          <h2 className="text-4xl md:text-5xl font-bold mb-6 fade-in-up">Rejoignez notre communauté</h2>
          <p className="text-lg mb-8 opacity-95 fade-in-up" style={{ animationDelay: "0.1s" }}>
            Des milliers de lecteurs informés font confiance à Press pour les actualités essentielles
          </p>
          <Link href="/signup" className="fade-in-up inline-block" style={{ animationDelay: "0.2s" }}>
            <Button
              size="lg"
              className="bg-primary-foreground text-primary hover:bg-primary-foreground/90 text-base px-8 h-12 rounded-full transition-all duration-300 shadow-lg hover:shadow-xl hover:scale-110"
            >
              S'inscrire Gratuitement <ArrowRight size={20} />
            </Button>
          </Link>
        </div>
      </section>
    </main>
  )
}
