"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { useRouter } from "next/navigation"
import { MessageCircle, Search, ChevronRight } from "lucide-react"
import Link from "next/link"
import { ChatBot } from "@/components/chatbot"

interface User {
  name?: string
  email: string
}

const mockArticles = [
  {
    id: "1",
    title: "Comment Larry Jackson a signé Mariah Carey à sa startup de 400 millions",
    summary:
      "Une histoire fascinante sur le monde des affaires modernes et les investissements stratégiques qui transforment l'industrie.",
    source: "Forbes",
    date: "Jun 6 2025",
    category: "Affaires",
    image: "/business-deal.jpg",
    author: "Jane Reporter",
    readTime: "8 min",
  },
  {
    id: "2",
    title: "Under Armour s'associe avec gamma pour une nouvelle campagne Stephen Curry",
    summary:
      "Le géant du sport annonce un partenariat majeur avec une nouvelle marque émergente pour révolutionner le marché.",
    source: "Forbes",
    date: "Apr 13 2025",
    category: "Sports",
    image: "/sports-brand.jpg",
    author: "Mike Johnson",
    readTime: "6 min",
  },
  {
    id: "3",
    title: "Pourquoi les femmes de gamma sont la clé de son succès multi-milliardaire",
    summary: "Une analyse approfondie du rôle crucial des femmes dans les entreprises technologiques modernes.",
    source: "Entrepreneur",
    date: "Mar 26 2025",
    category: "Technologie",
    image: "/tech-leadership.jpg",
    author: "Sarah Williams",
    readTime: "10 min",
  },
  {
    id: "4",
    title: "Snoop Dogg, Sexyy Red apportent 420 millions de revenus",
    summary:
      "Les produits collaboratifs du célèbre rappeur génèrent des revenus record dans l'industrie du divertissement.",
    source: "Hollywood Reporter",
    date: "Jan 31 2025",
    category: "Divertissement",
    image: "/entertainment-industry.jpg",
    author: "David Brown",
    readTime: "7 min",
  },
  {
    id: "5",
    title: "Les tendances émergentes du marché technologique en 2025",
    summary:
      "Analyse des technologies qui façonneront l'année à venir dans le secteur tech avec prédictions d'experts.",
    source: "TechCrunch",
    date: "Jan 28 2025",
    category: "Technologie",
    image: "/tech-trends-2025.jpg",
    author: "Alex Chen",
    readTime: "9 min",
  },
  {
    id: "6",
    title: "Révolution dans le secteur des ressources renouvelables",
    summary: "Les nouvelles technologies d'énergie verte changent le paysage énergétique mondial de manière durable.",
    source: "Reuters",
    date: "Jan 25 2025",
    category: "Environnement",
    image: "/renewable-energy.jpg",
    author: "Emma Davis",
    readTime: "11 min",
  },
]

const mockVideos = [
  {
    id: "1",
    title: "Analyse exclusive des nouvelles politiques économiques",
    source: "News Channel",
    date: "Jun 5 2025",
    duration: "12:34",
    thumbnail: "/news-analysis.jpg",
  },
  {
    id: "2",
    title: "Documentaire: Les secrets des startups millionnaires",
    source: "Documentary Plus",
    date: "Jun 2 2025",
    duration: "45:20",
    thumbnail: "/startup-documentary.jpg",
  },
  {
    id: "3",
    title: "Entrevue avec des leaders de l'industrie technologique",
    source: "Tech TV",
    date: "May 30 2025",
    duration: "28:15",
    thumbnail: "/tech-interview.jpg",
  },
  {
    id: "4",
    title: "Débat: L'avenir de l'intelligence artificielle",
    source: "Future Forums",
    date: "May 25 2025",
    duration: "1:05:30",
    thumbnail: "/ai-debate.jpg",
  },
]

export default function Dashboard() {
  const router = useRouter()
  const [user, setUser] = useState<User | null>(null)
  const [showChat, setShowChat] = useState(false)
  const [mounted, setMounted] = useState(false)
  const [selectedCategory, setSelectedCategory] = useState("Tous")

  useEffect(() => {
    setMounted(true)
    const storedUser = localStorage.getItem("user")
    if (!storedUser) {
      router.push("/login")
      return
    }
    setUser(JSON.parse(storedUser))
  }, [router])

  const handleLogout = () => {
    localStorage.removeItem("user")
    router.push("/")
  }

  const categories = ["Tous", "Affaires", "Technologie", "Sports", "Divertissement", "Environnement"]
  const filteredArticles =
    selectedCategory === "Tous" ? mockArticles : mockArticles.filter((a) => a.category === selectedCategory)

  if (!mounted || !user) {
    return null
  }

  return (
    <main className="min-h-screen bg-background">
      {/* Header */}
      <nav className="sticky top-0 z-40 border-b border-border bg-background/95 backdrop-blur">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/" className="text-2xl font-bold text-foreground">
            <span className="text-2xl">📰</span> Press
          </Link>

          <div className="flex-1 mx-8 max-w-md">
            <div className="flex items-center gap-2 px-4 py-2 rounded-lg border border-border bg-card hover:border-accent transition-all">
              <Search size={18} className="text-muted-foreground" />
              <input
                type="text"
                placeholder="Rechercher..."
                className="flex-1 bg-transparent outline-none text-sm text-foreground placeholder:text-muted-foreground"
              />
            </div>
          </div>

          <div className="flex items-center gap-4">
            <span className="text-sm text-muted-foreground hidden sm:inline">
              {user.name || user.email.split("@")[0]}
            </span>
            <Button variant="outline" size="sm" onClick={handleLogout}>
              Déconnexion
            </Button>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="max-w-6xl mx-auto px-6 py-12">
        {/* Title Section */}
        <div className="mb-12 fade-in-up">
          <h1 className="text-5xl font-bold text-foreground mb-3">Articles du jour</h1>
          <p className="text-lg text-muted-foreground">{filteredArticles.length} articles sélectionnés et vérifiés</p>
        </div>

        {/* Category Filter */}
        <div className="mb-12 fade-in-up" style={{ animationDelay: "0.05s" }}>
          <div className="flex gap-2 overflow-x-auto pb-2">
            {categories.map((cat, idx) => (
              <button
                key={idx}
                onClick={() => setSelectedCategory(cat)}
                className={`px-4 py-2 rounded-lg whitespace-nowrap transition-all text-sm font-medium ${
                  selectedCategory === cat
                    ? "bg-primary text-primary-foreground shadow-md"
                    : "bg-card text-foreground border border-border hover:border-accent hover:bg-card/80"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Magazine-style Articles List */}
        <div className="space-y-8">
          {filteredArticles.map((article, idx) => (
            <Link
              key={article.id}
              href={`/article/${article.id}`}
              className="fade-in-up group"
              style={{ animationDelay: `${0.05 * idx}s` }}
            >
              <article className="border border-border rounded-xl overflow-hidden hover:border-accent transition-all duration-300 hover:shadow-lg bg-card/30">
                <div className="grid md:grid-cols-3 gap-0">
                  {/* Image */}
                  <div className="md:col-span-1 h-64 md:h-auto overflow-hidden">
                    <img
                      src={article.image || "/placeholder.svg"}
                      alt={article.title}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                    />
                  </div>

                  {/* Content */}
                  <div className="md:col-span-2 p-8 flex flex-col justify-between">
                    {/* Top Section */}
                    <div>
                      <div className="flex items-center gap-3 mb-4">
                        <span className="inline-block px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-semibold">
                          {article.category}
                        </span>
                        <span className="text-xs text-muted-foreground">{article.source}</span>
                      </div>

                      <h2 className="text-2xl font-bold text-foreground mb-3 group-hover:text-primary transition-colors line-clamp-3">
                        {article.title}
                      </h2>

                      <p className="text-foreground text-base leading-relaxed mb-4 line-clamp-2">{article.summary}</p>
                    </div>

                    {/* Bottom Section */}
                    <div className="flex items-center justify-between pt-4 border-t border-border/50">
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <span>Par {article.author}</span>
                        </span>
                        <span>{article.readTime}</span>
                        <span>{article.date}</span>
                      </div>
                      <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" />
                    </div>
                  </div>
                </div>
              </article>
            </Link>
          ))}
        </div>
      </div>

      {/* Floating Chat Button */}
      <button
        onClick={() => setShowChat(!showChat)}
        className="fixed bottom-6 right-6 bg-primary hover:bg-primary/90 text-primary-foreground rounded-full p-4 shadow-lg transition-all duration-300 hover:scale-110 z-30"
        aria-label="Open chat"
      >
        <MessageCircle size={24} />
      </button>

      {/* Chat Interface */}
      {showChat && (
        <div className="fixed bottom-24 right-6 w-96 max-w-[calc(100vw-48px)] z-30 fade-in-up">
          <ChatBot onClose={() => setShowChat(false)} />
        </div>
      )}
    </main>
  )
}
