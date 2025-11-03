"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { useRouter } from "next/navigation"
import { MessageCircle, Search, ChevronRight, Play, Clock, Globe, RefreshCw, X, FileText, Mic, Sparkles } from "lucide-react"
import Link from "next/link"
import { ChatBot } from "@/components/chatbot"

interface User {
  name?: string
  email: string
}

interface NewsArticle {
  id: string
  title: string
  description: string
  source: string
  publishedAt: string
  image?: string
  url: string
}

interface Video {
  id: string
  title: string
  source: string
  date: string
  duration: string
  thumbnail: string
  youtubeId: string
  views: string
  transcript?: string
  summary?: string
}

const countries = [
  { code: "all", name: "Tous les pays", flag: "🌍" },
  { code: "fr", name: "France", flag: "🇫🇷" },
  { code: "tn", name: "Tunisie", flag: "🇹🇳" },
  { code: "us", name: "États-Unis", flag: "🇺🇸" },
  { code: "gb", name: "Royaume-Uni", flag: "🇬🇧" },
  { code: "de", name: "Allemagne", flag: "🇩🇪" },
  { code: "jp", name: "Japon", flag: "🇯🇵" },
  { code: "ca", name: "Canada", flag: "🇨🇦" },
]

export default function Dashboard() {
  const router = useRouter()
  const [user, setUser] = useState<User | null>(null)
  const [showChat, setShowChat] = useState(false)
  const [mounted, setMounted] = useState(false)
  const [selectedCountry, setSelectedCountry] = useState("all")
  const [articles, setArticles] = useState<NewsArticle[]>([])
  const [videos, setVideos] = useState<Video[]>([])
  const [loadingNews, setLoadingNews] = useState(false)
  const [loadingVideos, setLoadingVideos] = useState(false)
  const [newsError, setNewsError] = useState<string | null>(null)
  const [videosError, setVideosError] = useState<string | null>(null)
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedVideo, setSelectedVideo] = useState<Video | null>(null)
  const [activeTab, setActiveTab] = useState<"video" | "transcript" | "summary">("video")
  const [transcribingVideoId, setTranscribingVideoId] = useState<string | null>(null)
  const [transcriptionResult, setTranscriptionResult] = useState<any>(null)
  const [generatingSummary, setGeneratingSummary] = useState(false)
  const [summaryResult, setSummaryResult] = useState<any>(null)

  useEffect(() => {
    setMounted(true)
    const storedUser = localStorage.getItem("user")
    if (!storedUser) {
      router.push("/login")
      return
    }
    setUser(JSON.parse(storedUser))
  }, [router])

  // Fonction pour fetch les vidéos depuis l'API Flask
  const fetchYouTubeVideos = async () => {
    try {
      setLoadingVideos(true)
      setVideosError(null)
      const response = await fetch('http://localhost:5001/scrape_youtube')
      
      if (!response.ok) {
        throw new Error(`Erreur HTTP: ${response.status}`)
      }
      
      const data = await response.json()
      
      if (data.status === "success" && data.data && data.data.youtube_videos) {
        const formattedVideos: Video[] = data.data.youtube_videos.map((video: any, index: number) => ({
          id: video.video_id || `video-${index}`,
          title: video.title || "Titre non disponible",
          source: video.channel || "Chaîne inconnue",
          date: new Date(video.published_at || new Date()).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric'
          }),
          duration: video.duration || "00:00",
          thumbnail: video.thumbnail || "/placeholder.svg",
          youtubeId: video.video_id || "",
          views: video.views || "0",
          transcript: video.transcript || "",
          summary: video.summary || ""
        }))
        setVideos(formattedVideos)
      } else {
        throw new Error(data.message || "Erreur lors du scraping YouTube")
      }
    } catch (error: any) {
      console.error("Erreur lors du fetch des vidéos:", error)
      setVideosError(error.message || "Impossible de charger les vidéos YouTube")
      // Fallback vers des vidéos mockées en cas d'erreur
      setVideos([
        {
          id: "1",
          title: "Analyse exclusive des nouvelles politiques économiques",
          source: "News Channel",
          date: "Jun 5 2025",
          duration: "12:34",
          thumbnail: "/news-analysis.jpg",
          youtubeId: "dQw4w9WgXcQ",
          views: "125K",
          transcript: "Ceci est une transcription exemple de la vidéo sur les politiques économiques...",
          summary: "Résumé des points clés de la vidéo sur les politiques économiques..."
        },
        {
          id: "2",
          title: "Documentaire: Les secrets des startups millionnaires",
          source: "Documentary Plus",
          date: "Jun 2 2025",
          duration: "45:20",
          thumbnail: "/startup-documentary.jpg",
          youtubeId: "dQw4w9WgXcQ",
          views: "89K",
          transcript: "Transcription du documentaire sur les startups...",
          summary: "Résumé des enseignements clés du documentaire..."
        },
        {
          id: "3",
          title: "Entrevue avec des leaders de l'industrie technologique",
          source: "Tech TV",
          date: "May 30 2025",
          duration: "28:15",
          thumbnail: "/tech-interview.jpg",
          youtubeId: "dQw4w9WgXcQ",
          views: "156K",
          transcript: "Transcription de l'interview avec les leaders tech...",
          summary: "Points principaux discutés durant l'interview..."
        },
        {
          id: "4",
          title: "Débat: L'avenir de l'intelligence artificielle",
          source: "Future Forums",
          date: "May 25 2025",
          duration: "1:05:30",
          thumbnail: "/ai-debate.jpg",
          youtubeId: "dQw4w9WgXcQ",
          views: "234K",
          transcript: "Transcription complète du débat sur l'IA...",
          summary: "Synthèse des arguments pour et contre le développement de l'IA..."
        },
      ])
    } finally {
      setLoadingVideos(false)
    }
  }

  // Fonction pour transcrire une vidéo spécifique
  const transcribeVideo = async (videoId: string, videoUrl: string) => {
    try {
      setTranscribingVideoId(videoId)
      setTranscriptionResult(null)

      const response = await fetch('http://localhost:5001/transcribe_video', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          video_url: `https://www.youtube.com/watch?v=${videoId}` 
        })
      })

      const result = await response.json()
      setTranscriptionResult(result)

      // Si la transcription réussit, mettre à jour la vidéo dans la liste
      if (result.status === "success" && result.video_data) {
        setVideos(prevVideos => 
          prevVideos.map(video => 
            video.id === videoId 
              ? { 
                  ...video, 
                  transcript: result.video_data.transcript,
                  summary: result.video_data.summary || video.summary
                }
              : video
          )
        )

        // Si la vidéo est actuellement ouverte, mettre à jour aussi
        if (selectedVideo && selectedVideo.id === videoId) {
          setSelectedVideo(prev => 
            prev ? { 
              ...prev, 
              transcript: result.video_data.transcript,
              summary: result.video_data.summary || prev.summary
            } : prev
          )
        }
      }

      return result
    } catch (error) {
      console.error('Erreur lors de la transcription:', error)
      setTranscriptionResult({
        status: "error",
        message: "Erreur lors de la transcription"
      })
      return { status: "error", message: "Erreur lors de la transcription" }
    } finally {
      setTranscribingVideoId(null)
    }
  }

  // Fonction pour générer un résumé pour une vidéo spécifique
  const generateVideoSummary = async (videoId: string) => {
    try {
      setGeneratingSummary(true)
      setSummaryResult(null)

      const response = await fetch('http://localhost:5001/summarize_video', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ video_id: videoId })
      })

      const result = await response.json()
      setSummaryResult(result)

      // Si le résumé réussit, mettre à jour la vidéo
      if (result.status === "success" && result.video_data) {
        setVideos(prevVideos => 
          prevVideos.map(video => 
            video.id === videoId 
              ? { ...video, summary: result.video_data.summary }
              : video
          )
        )

        if (selectedVideo && selectedVideo.id === videoId) {
          setSelectedVideo(prev => 
            prev ? { ...prev, summary: result.video_data.summary } : prev
          )
        }
      }

      return result

    } catch (error) {
      console.error('Erreur génération résumé vidéo:', error)
      setSummaryResult({
        status: "error",
        message: "Erreur lors de la génération du résumé"
      })
      return { status: "error", message: "Erreur lors de la génération du résumé" }
    } finally {
      setGeneratingSummary(false)
    }
  }

  // Fonction pour générer un résumé à partir d'un texte existant
  const generateSummaryFromText = async (text: string, videoId: string) => {
    try {
      setGeneratingSummary(true)
      setSummaryResult(null)

      const response = await fetch('http://localhost:5001/generate_summary', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ text })
      })

      const result = await response.json()
      setSummaryResult(result)

      // Si le résumé réussit, mettre à jour la vidéo
      if (result.status === "success" && result.summary) {
        setVideos(prevVideos => 
          prevVideos.map(video => 
            video.id === videoId 
              ? { ...video, summary: result.summary }
              : video
          )
        )

        if (selectedVideo && selectedVideo.id === videoId) {
          setSelectedVideo(prev => 
            prev ? { ...prev, summary: result.summary } : prev
          )
        }
      }

      return result

    } catch (error) {
      console.error('Erreur génération résumé:', error)
      setSummaryResult({
        status: "error",
        message: "Erreur lors de la génération du résumé"
      })
      return { status: "error", message: "Erreur lors de la génération du résumé" }
    } finally {
      setGeneratingSummary(false)
    }
  }

  useEffect(() => {
    const fetchNews = async () => {
      try {
        setLoadingNews(true)
        setNewsError(null)
        const countryParam = selectedCountry !== "all" ? `&country=${selectedCountry}` : ""
        const searchParam = searchQuery ? `&q=${encodeURIComponent(searchQuery)}` : "&q=technology%20OR%20world%20OR%20business"
        
        const res = await fetch(`/api/news?pageSize=10${countryParam}${searchParam}`, { 
          cache: "no-store" 
        })
        const data = await res.json()
        if (!res.ok) throw new Error(data?.error || "Failed to load news")
        const mapped: NewsArticle[] = (data.articles || []).map((a: any, idx: number) => ({
          id: String(idx + 1),
          title: a.title || "Untitled",
          description: a.description || a.content || "",
          source: a.source?.name || "",
          publishedAt: a.publishedAt || "",
          image: a.urlToImage || "/placeholder.svg",
          url: a.url,
        }))
        setArticles(mapped)
      } catch (e: any) {
        setNewsError(e?.message || "Failed to load news")
      } finally {
        setLoadingNews(false)
      }
    }
    fetchNews()
  }, [selectedCountry, searchQuery])

  // Charger les vidéos au montage du composant
  useEffect(() => {
    fetchYouTubeVideos()
  }, [])

  const handleLogout = () => {
    localStorage.removeItem("user")
    router.push("/")
  }

  const openVideoModal = (video: Video) => {
    setSelectedVideo(video)
    setActiveTab("video")
    setTranscriptionResult(null)
    setSummaryResult(null)
  }

  const closeVideoModal = () => {
    setSelectedVideo(null)
    setActiveTab("video")
    setTranscriptionResult(null)
    setSummaryResult(null)
  }

  const handleTranscribeInModal = async () => {
    if (selectedVideo) {
      await transcribeVideo(selectedVideo.id, selectedVideo.youtubeId)
    }
  }

  const handleGenerateSummaryInModal = async () => {
    if (selectedVideo) {
      // Si la vidéo a déjà une transcription, générer le résumé à partir du texte
      if (selectedVideo.transcript) {
        await generateSummaryFromText(selectedVideo.transcript, selectedVideo.id)
      } else {
        // Sinon, utiliser la route summarize_video qui fait transcription + résumé
        await generateVideoSummary(selectedVideo.id)
      }
    }
  }

  const filteredArticles = articles
  const selectedCountryName = countries.find(c => c.code === selectedCountry)?.name || "Tous les pays"
  const selectedCountryFlag = countries.find(c => c.code === selectedCountry)?.flag || "🌍"

  if (!mounted || !user) {
    return null
  }

  return (
    <main className="min-h-screen from-background via-background to-primary/5">
      {/* Header avec animation */}
      <nav className="sticky top-0 z-40 border-b border-border bg-background/95 backdrop-blur animate-slide-down">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/" className="text-2xl font-bold text-foreground hover:scale-105 transition-transform">
            <span className="text-2xl">📰</span> Press
          </Link>

          <div className="flex-1 mx-8 max-w-md">
            <div className="flex items-center gap-2 px-4 py-2 rounded-lg border border-border bg-card hover:border-accent transition-all duration-300 shadow-sm hover:shadow-md">
              <Search size={18} className="text-muted-foreground" />
              <input
                type="text"
                placeholder="Rechercher des articles..."
                className="flex-1 bg-transparent outline-none text-sm text-foreground placeholder:text-muted-foreground"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>

          <div className="flex items-center gap-4">
            <span className="text-sm text-muted-foreground hidden sm:inline animate-fade-in">
              {user.name || user.email.split("@")[0]}
            </span>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleLogout}
              className="hover:scale-105 transition-transform"
            >
              Déconnexion
            </Button>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6 py-12">
        {/* Title Section avec animation */}
        <div className="mb-12 animate-fade-in-up">
          <h1 className="text-5xl font-bold mb-3 from-foreground to-primary bg-clip-text text-transparent">
            Actualités & Vidéos
          </h1>
          <p className="text-lg text-muted-foreground">
            {loadingNews ? "Chargement..." : newsError ? newsError : `${filteredArticles.length} articles et ${videos.length} vidéos`}
          </p>
        </div>

        {/* Filtre Pays avec dropdown animé */}
        <div className="mb-12 animate-fade-in-up" style={{ animationDelay: "0.1s" }}>
          <div className="relative inline-block">
            <button
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              className="flex items-center gap-3 px-6 py-3 rounded-xl bg-card border border-border hover:border-accent transition-all duration-300 shadow-sm hover:shadow-md group"
            >
              <Globe size={20} className="text-muted-foreground group-hover:text-primary transition-colors" />
              <span className="text-foreground font-medium">{selectedCountryFlag} {selectedCountryName}</span>
              <ChevronRight 
                size={16} 
                className={`text-muted-foreground transition-transform duration-300 ${isDropdownOpen ? 'rotate-90' : ''}`} 
              />
            </button>

            {isDropdownOpen && (
              <div className="absolute top-full left-0 mt-2 w-64 bg-card border border-border rounded-xl shadow-lg z-20 animate-scale-in">
                {countries.map((country, idx) => (
                  <button
                    key={country.code}
                    onClick={() => {
                      setSelectedCountry(country.code)
                      setIsDropdownOpen(false)
                    }}
                    className={`w-full px-4 py-3 text-left hover:bg-accent/10 transition-all duration-200 flex items-center gap-3 ${
                      selectedCountry === country.code ? 'bg-primary/10 text-primary' : 'text-foreground'
                    } ${idx === 0 ? 'rounded-t-xl' : ''} ${
                      idx === countries.length - 1 ? 'rounded-b-xl' : ''
                    }`}
                    style={{ animationDelay: `${0.02 * idx}s` }}
                  >
                    <span className="text-lg">{country.flag}</span>
                    <span className="font-medium">{country.name}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Section Vidéos YouTube */}
        <section className="mb-16 animate-fade-in-up" style={{ animationDelay: "0.2s" }}>
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-4">
              <h2 className="text-3xl font-bold text-foreground">Vidéos populaires</h2>
              <Button
                variant="outline"
                size="sm"
                onClick={fetchYouTubeVideos}
                disabled={loadingVideos}
                className="flex items-center gap-2"
              >
                <RefreshCw size={16} className={loadingVideos ? "animate-spin" : ""} />
                {loadingVideos ? "Chargement..." : "Actualiser"}
              </Button>
            </div>
            <div className="w-12 h-1 from-primary to-accent rounded-full"></div>
          </div>

          {videosError && (
            <div className="mb-4 p-4 bg-destructive/10 border border-destructive/20 rounded-lg text-destructive">
              {videosError}
            </div>
          )}
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {loadingVideos ? (
              // Squelette de chargement
              [1, 2, 3, 4].map((i) => (
                <div key={i} className="animate-pulse">
                  <div className="bg-muted h-48 rounded-2xl mb-4"></div>
                  <div className="space-y-2">
                    <div className="h-4 bg-muted rounded"></div>
                    <div className="h-4 bg-muted rounded w-3/4"></div>
                  </div>
                </div>
              ))
            ) : (
              videos.map((video, idx) => (
                <div 
                  key={video.id}
                  className="group cursor-pointer bg-card border border-border rounded-2xl overflow-hidden hover:border-accent transition-all duration-500 hover:shadow-xl hover:scale-105"
                  style={{ animationDelay: `${0.1 * idx}s` }}
                >
                  {/* Thumbnail avec overlay animé */}
                  <div className="relative overflow-hidden">
                    <img
                      src={video.thumbnail || "/placeholder.svg"}
                      alt={video.title}
                      className="w-full h-48 object-cover group-hover:scale-110 transition-transform duration-500"
                    />
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-all duration-300"></div>
                    <div className="absolute bottom-2 right-2 bg-black/80 text-white text-xs px-2 py-1 rounded">
                      {video.duration}
                    </div>
                    <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                      <div className="bg-primary/90 text-primary-foreground rounded-full p-4 transform scale-75 group-hover:scale-100 transition-transform duration-300">
                        <Play size={24} fill="currentColor" />
                      </div>
                    </div>
                  </div>

                  {/* Content */}
                  <div className="p-4">
                    <h3 className="font-semibold text-foreground mb-2 line-clamp-2 group-hover:text-primary transition-colors">
                      {video.title}
                    </h3>
                    <div className="flex items-center justify-between text-sm text-muted-foreground">
                      <span>{video.source}</span>
                      <div className="flex items-center gap-2">
                        <span>{video.views}</span>
                        <Clock size={14} />
                        <span>{video.date}</span>
                      </div>
                    </div>

                    {/* Bouton Transcrire */}
                    <div className="mt-3 flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={(e) => {
                          e.stopPropagation()
                          openVideoModal(video)
                        }}
                        className="flex-1 text-xs"
                      >
                        <Play size={12} className="mr-1" />
                        Voir
                      </Button>
                      <Button
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation()
                          transcribeVideo(video.id, video.youtubeId)
                        }}
                        disabled={transcribingVideoId === video.id}
                        className="flex-1 text-xs bg-green-600 hover:bg-green-700"
                      >
                        <Mic size={12} className="mr-1" />
                        {transcribingVideoId === video.id ? "Transcription..." : "Transcrire"}
                      </Button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </section>

        {/* Section Articles avec animations améliorées */}
        <section className="animate-fade-in-up" style={{ animationDelay: "0.3s" }}>
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-3xl font-bold text-foreground">Articles récents</h2>
            <div className="w-12 h-1 from-primary to-accent rounded-full"></div>
          </div>

          <div className="space-y-8">
            {!loadingNews && !newsError && filteredArticles.map((article, idx) => {
              const href = `/article/${article.id}?` + new URLSearchParams({
                url: article.url,
                title: article.title,
                source: article.source,
                publishedAt: article.publishedAt,
                image: article.image || "/article-featured-image.jpg",
              }).toString()

              return (
                <Link
                  key={article.id}
                  href={href}
                  className="block animate-fade-in-up group"
                  style={{ animationDelay: `${0.05 * idx}s` }}
                >
                  <article className="border border-border rounded-2xl overflow-hidden hover:border-accent transition-all duration-500 hover:shadow-xl bg-card/30 group-hover:bg-card/50">
                    <div className="grid md:grid-cols-3 gap-0">
                      {/* Image avec effet de zoom */}
                      <div className="md:col-span-1 h-64 md:h-auto overflow-hidden">
                        <img
                          src={article.image || "/placeholder.svg"}
                          alt={article.title}
                          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                        />
                      </div>

                      {/* Content */}
                      <div className="md:col-span-2 p-8 flex flex-col justify-between">
                        {/* Top Section */}
                        <div>
                          <div className="flex items-center gap-3 mb-4">
                            <span className="inline-block px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-semibold animate-pulse">
                              {article.source}
                            </span>
                            <span className="text-xs text-muted-foreground">
                              {new Date(article.publishedAt).toLocaleDateString('fr-FR', {
                                day: 'numeric',
                                month: 'long',
                                year: 'numeric'
                              })}
                            </span>
                          </div>

                          <h2 className="text-2xl font-bold text-foreground mb-3 group-hover:text-primary transition-colors duration-300 line-clamp-3">
                            {article.title}
                          </h2>

                          <p className="text-foreground text-base leading-relaxed mb-4 line-clamp-2 opacity-90">
                            {article.description}
                          </p>
                        </div>

                        {/* Bottom Section avec animation */}
                        <div className="flex items-center justify-between pt-4 border-t border-border/50 group-hover:border-accent/50 transition-colors">
                          <div className="flex items-center gap-4 text-sm text-muted-foreground">
                            <span className="flex items-center gap-1 transition-colors group-hover:text-foreground">
                              <span>{article.source}</span>
                            </span>
                            <span className="transition-colors group-hover:text-foreground">
                              {new Date(article.publishedAt).toLocaleTimeString('fr-FR', { 
                                hour: "2-digit", 
                                minute: "2-digit" 
                              })}
                            </span>
                          </div>
                          <div className="flex items-center gap-2 text-muted-foreground group-hover:text-primary transition-all duration-300 group-hover:translate-x-1">
                            <span className="text-sm font-medium">Lire</span>
                            <ChevronRight className="w-4 h-4" />
                          </div>
                        </div>
                      </div>
                    </div>
                  </article>
                </Link>
              )
            })}
          </div>
        </section>
      </div>

      {/* Modal Video */}
      {selectedVideo && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-card border border-border rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden animate-scale-in">
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-border">
              <h3 className="text-xl font-bold text-foreground">{selectedVideo.title}</h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={closeVideoModal}
                className="hover:bg-destructive/10 hover:text-destructive"
              >
                <X size={20} />
              </Button>
            </div>

            {/* Tabs */}
            <div className="border-b border-border">
              <div className="flex">
                <button
                  onClick={() => setActiveTab("video")}
                  className={`flex-1 py-3 px-4 text-sm font-medium transition-all duration-200 ${
                    activeTab === "video" 
                      ? "text-primary border-b-2 border-primary" 
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <Play size={16} className="inline mr-2" />
                  Vidéo
                </button>
                <button
                  onClick={() => setActiveTab("transcript")}
                  className={`flex-1 py-3 px-4 text-sm font-medium transition-all duration-200 ${
                    activeTab === "transcript" 
                      ? "text-primary border-b-2 border-primary" 
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <FileText size={16} className="inline mr-2" />
                  Transcription
                </button>
                <button
                  onClick={() => setActiveTab("summary")}
                  className={`flex-1 py-3 px-4 text-sm font-medium transition-all duration-200 ${
                    activeTab === "summary" 
                      ? "text-primary border-b-2 border-primary" 
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <Sparkles size={16} className="inline mr-2" />
                  Résumé
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="p-6 max-h-[60vh] overflow-y-auto">
              {activeTab === "video" && (
                <div className="aspect-video bg-black rounded-lg overflow-hidden">
                  <iframe
                    src={`https://www.youtube.com/embed/${selectedVideo.youtubeId}`}
                    className="w-full h-full"
                    allowFullScreen
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  />
                </div>
              )}

              {activeTab === "transcript" && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="text-lg font-semibold text-foreground">Transcription</h4>
                    <Button
                      size="sm"
                      onClick={handleTranscribeInModal}
                      disabled={transcribingVideoId === selectedVideo.id}
                      className="bg-green-600 hover:bg-green-700"
                    >
                      <Mic size={14} className="mr-1" />
                      {transcribingVideoId === selectedVideo.id ? "Transcription en cours..." : "Transcrire"}
                    </Button>
                  </div>
                  
                  {transcriptionResult && (
                    <div className={`p-3 rounded-lg ${
                      transcriptionResult.status === "success" 
                        ? "bg-green-100 border border-green-300" 
                        : "bg-red-100 border border-red-300"
                    }`}>
                      <p className={`text-sm ${
                        transcriptionResult.status === "success" ? "text-green-800" : "text-red-800"
                      }`}>
                        {transcriptionResult.message}
                      </p>
                    </div>
                  )}

                  <div className="bg-muted/50 rounded-lg p-4 max-h-96 overflow-y-auto">
                    <p className="text-foreground whitespace-pre-wrap leading-relaxed">
                      {selectedVideo.transcript || "Aucune transcription disponible pour cette vidéo. Cliquez sur 'Transcrire' pour générer la transcription."}
                    </p>
                  </div>
                </div>
              )}

              {activeTab === "summary" && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="text-lg font-semibold text-foreground">Résumé</h4>
                    <Button
                      onClick={handleGenerateSummaryInModal}
                      disabled={generatingSummary}
                      className="bg-blue-600 hover:bg-blue-700"
                    >
                      <Sparkles size={14} className="mr-1" />
                      {generatingSummary ? "Génération..." : "Générer Résumé"}
                    </Button>
                  </div>

                  {summaryResult && (
                    <div className={`p-3 rounded-lg ${
                      summaryResult.status === "success" 
                        ? "bg-green-100 border border-green-300" 
                        : "bg-red-100 border border-red-300"
                    }`}>
                      <p className={`text-sm ${
                        summaryResult.status === "success" ? "text-green-800" : "text-red-800"
                      }`}>
                        {summaryResult.message}
                      </p>
                    </div>
                  )}

                  <div className="bg-primary/10 border border-primary/20 rounded-lg p-4">
                    <p className="text-foreground leading-relaxed whitespace-pre-wrap">
                      {selectedVideo.summary || "Aucun résumé disponible pour cette vidéo. Cliquez sur 'Générer Résumé' pour créer un résumé automatique de la vidéo."}
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-border bg-muted/20">
              <div className="flex items-center justify-between text-sm text-muted-foreground">
                <span>{selectedVideo.source}</span>
                <div className="flex items-center gap-4">
                  <span>{selectedVideo.views} vues</span>
                  <span>{selectedVideo.duration}</span>
                  <span>{selectedVideo.date}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Floating Chat Button amélioré */}
      <button
        onClick={() => setShowChat(!showChat)}
        className="fixed bottom-6 right-6 bg-primary hover:bg-primary/90 text-primary-foreground rounded-full p-4 shadow-2xl transition-all duration-300 hover:scale-110 z-30 animate-bounce-slow"
        aria-label="Open chat"
      >
        <MessageCircle size={24} />
      </button>

      {/* Chat Interface avec animation */}
      {showChat && (
        <div className="fixed bottom-24 right-6 w-96 max-w-[calc(100vw-48px)] z-30 animate-scale-in">
          <ChatBot onClose={() => setShowChat(false)} />
        </div>
      )}
    </main>
  )
}