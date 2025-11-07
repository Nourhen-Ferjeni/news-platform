"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { useRouter } from "next/navigation"
import { 
  MessageCircle, Search, ChevronRight, Play, Clock, Globe, 
  RefreshCw, X, FileText, Mic, Sparkles, Eye, Newspaper, 
  Video, Filter, Calendar, ThumbsUp, MessageSquare
} from "lucide-react"
import Link from "next/link"
import { ChatBot } from "@/components/chatbot"

interface User {
  name?: string
  email: string
  avatar?: string
}

interface NewsArticle {
  id: string
  title: string
  description: string
  source: string
  publishedAt: string
  image?: string
  url: string
  category?: string
  readTime?: string
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
  likes?: string
  transcript?: string
  summary?: string
  category?: string
  description?: string
}

const categories = [
  "All",
  "Tunisia",
  "Technology",
  "Business",
  "Politics",
  "Science",
  "Health",
  "Entertainment",
  "Sports"
]

// Static videos data as default with better cover images
const staticVideos: Video[] = [
  {
    id: "1",
    title: "Breaking News: Global Economic Summit 2024",
    source: "World News Network",
    date: "Jun 5 2024",
    duration: "15:30",
    thumbnail: "/news-analysis.jpg",
    youtubeId: "dQw4w9WgXcQ",
    views: "250K",
    likes: "12K",
    transcript: "This is a sample transcript about the global economic summit discussions...",
    summary: "World leaders gather to discuss economic policies and global cooperation.",
    category: "Politics"
  },
  {
    id: "2",
    title: "Tech Innovation: AI Revolution in Healthcare",
    source: "Tech Today",
    date: "Jun 2 2024",
    duration: "22:45",
    thumbnail: "/ai-debate.jpg",
    youtubeId: "dQw4w9WgXcQ",
    views: "180K",
    likes: "8.5K",
    transcript: "Exploring how artificial intelligence is transforming modern healthcare systems...",
    summary: "AI applications in medical diagnosis and treatment are revolutionizing patient care.",
    category: "Technology"
  },
  {
    id: "3",
    title: "Climate Change: New Solutions Emerging",
    source: "Science Daily",
    date: "May 30 2024",
    duration: "18:20",
    thumbnail: "/startup-documentary.jpg",
    youtubeId: "dQw4w9WgXcQ",
    views: "320K",
    likes: "15K",
    transcript: "Scientists present innovative approaches to combat climate change effects...",
    summary: "Breakthrough technologies and policies to address global warming challenges.",
    category: "Science"
  },
  {
    id: "4",
    title: "Startup Success Stories from Tunisia",
    source: "Business Insider",
    date: "May 28 2024",
    duration: "25:10",
    thumbnail: "/tech-interview.jpg",
    youtubeId: "dQw4w9WgXcQ",
    views: "95K",
    likes: "4.2K",
    transcript: "Interview with successful Tunisian entrepreneurs and their journey...",
    summary: "Inspiring stories of innovation and entrepreneurship from Tunisia.",
    category: "Business"
  },
]

export default function Dashboard() {
  const router = useRouter()
  const [user, setUser] = useState<User | null>(null)
  const [showChat, setShowChat] = useState(false)
  const [mounted, setMounted] = useState(false)
  const [selectedCategory, setSelectedCategory] = useState("All")
  const [articles, setArticles] = useState<NewsArticle[]>([])
  const [videos, setVideos] = useState<Video[]>(staticVideos) // Set static videos as default
  const [loadingNews, setLoadingNews] = useState(false)
  const [loadingVideos, setLoadingVideos] = useState(false)
  const [newsError, setNewsError] = useState<string | null>(null)
  const [videosError, setVideosError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedVideo, setSelectedVideo] = useState<Video | null>(null)
  const [activeTab, setActiveTab] = useState<"video" | "transcript" | "summary">("video")
  const [transcribingVideoId, setTranscribingVideoId] = useState<string | null>(null)
  const [transcriptionResult, setTranscriptionResult] = useState<any>(null)
  const [generatingSummary, setGeneratingSummary] = useState(false)
  const [summaryResult, setSummaryResult] = useState<any>(null)
  const [activeView, setActiveView] = useState<"news" | "videos">("news")

  useEffect(() => {
    setMounted(true)
    const storedUser = localStorage.getItem("user")
    if (!storedUser) {
      router.push("/login")
      return
    }
    setUser(JSON.parse(storedUser))
  }, [router])

  // Function to fetch videos from Flask API
  const fetchYouTubeVideos = async () => {
    try {
      setLoadingVideos(true)
      setVideosError(null)
      const response = await fetch('http://localhost:5001/scrape_youtube')
      
      if (!response.ok) {
        throw new Error(`HTTP Error: ${response.status}`)
      }
      
      const data = await response.json()
      
      if (data.status === "success" && data.data && data.data.youtube_videos) {
        const formattedVideos: Video[] = data.data.youtube_videos.map((video: any, index: number) => ({
          id: video.video_id || `video-${index}`,
          title: video.title || "Title not available",
          source: video.channel || "Unknown Channel",
          date: new Date(video.published_at || new Date()).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric'
          }),
          duration: video.duration || "00:00",
          thumbnail: video.thumbnail || "/api/placeholder/400/250?text=YouTube+Video",
          youtubeId: video.video_id || "",
          views: video.views || "0",
          likes: video.likes || "1K",
          transcript: video.transcript || "",
          summary: video.summary || "",
          category: "Technology"
        }))
        setVideos(formattedVideos)
      } else {
        throw new Error(data.message || "Error during YouTube scraping")
      }
    } catch (error: any) {
      console.error("Error fetching videos:", error)
      setVideosError(error.message || "Unable to load new YouTube videos. Showing static videos instead.")
      // Keep the static videos as fallback
      setVideos(staticVideos)
    } finally {
      setLoadingVideos(false)
    }
  }

  // Function to transcribe a specific video
  const transcribeVideo = async (videoId: string) => {
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

      // If transcription succeeds, update the video in the list
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

        // If video is currently open, update it too
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
      console.error('Error during transcription:', error)
      setTranscriptionResult({
        status: "error",
        message: "Error during transcription"
      })
      return { status: "error", message: "Error during transcription" }
    } finally {
      setTranscribingVideoId(null)
    }
  }

  // Function to generate summary for a specific video
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

      // If summary succeeds, update the video
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
      console.error('Error generating video summary:', error)
      setSummaryResult({
        status: "error",
        message: "Error during summary generation"
      })
      return { status: "error", message: "Error during summary generation" }
    } finally {
      setGeneratingSummary(false)
    }
  }

  // Function to generate summary from existing text
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

      // If summary succeeds, update the video
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
      console.error('Error generating summary:', error)
      setSummaryResult({
        status: "error",
        message: "Error during summary generation"
      })
      return { status: "error", message: "Error during summary generation" }
    } finally {
      setGeneratingSummary(false)
    }
  }

  useEffect(() => {
    const fetchNews = async () => {
      try {
        setLoadingNews(true)
        setNewsError(null)
        const searchParam = searchQuery ? `&q=${encodeURIComponent(searchQuery)}` : "&q=technology%20OR%20world%20OR%20business"
        
        const res = await fetch(`/api/news?pageSize=10${searchParam}`, { 
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
          category: "News",
          readTime: "5 min"
        }))
        setArticles(mapped)
      } catch (e: any) {
        setNewsError(e?.message || "Failed to load news")
      } finally {
        setLoadingNews(false)
      }
    }
    fetchNews()
  }, [searchQuery])

  // Load videos on component mount - Only static videos by default
  useEffect(() => {
    // Set static videos as default, no API call on mount
    setVideos(staticVideos);
    // Add a notification or message indicating these are demo videos
    setVideosError("Ces vidéos sont des exemples statiques. Cliquez sur 'Actualiser les vidéos' pour charger de nouvelles vidéos depuis le backend.");
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
      await transcribeVideo(selectedVideo.id)
    }
  }

  const handleGenerateSummaryInModal = async () => {
    if (selectedVideo) {
      // If video already has transcript, generate summary from text
      if (selectedVideo.transcript) {
        await generateSummaryFromText(selectedVideo.transcript, selectedVideo.id)
      } else {
        // Otherwise use summarize_video route that does transcription + summary
        await generateVideoSummary(selectedVideo.id)
      }
    }
  }

  const filteredArticles = articles

  if (!mounted || !user) {
    return null
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
      {/* Enhanced Header with Animation */}
      <nav className="sticky top-0 z-40 border-b border-border/60 bg-background/80 backdrop-blur-xl supports-[backdrop-filter]:bg-background/60 animate-slide-down">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/" className="group flex items-center gap-3">
            <div className="relative">
              <div className="w-10 h-10 bg-gradient-to-br from-primary to-accent rounded-xl flex items-center justify-center transform group-hover:scale-110 transition-all duration-300 shadow-lg">
                <span className="text-lg text-primary-foreground font-bold">📰</span>
              </div>
              <div className="absolute inset-0 bg-gradient-to-br from-primary to-accent rounded-xl opacity-0 group-hover:opacity-100 blur-md transition-opacity duration-300 -z-10"></div>
            </div>
            <span className="text-2xl font-bold bg-gradient-to-r from-foreground to-primary bg-clip-text text-transparent">
              NewsHub
            </span>
          </Link>

          {/* Search Bar */}
          <div className="flex-1 mx-8 max-w-md">
            <div className="relative group">
              <div className="absolute inset-0 bg-gradient-to-r from-primary/20 to-accent/20 rounded-xl blur opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              <div className="flex items-center gap-2 px-4 py-3 rounded-xl border border-border/60 bg-card/50 backdrop-blur-sm relative z-10 hover:border-accent/60 transition-all duration-300 shadow-sm hover:shadow-md">
                <Search size={18} className="text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Search articles and videos..."
                  className="flex-1 bg-transparent outline-none text-sm text-foreground placeholder:text-muted-foreground"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>
          </div>

          {/* User Menu */}
          <div className="flex items-center gap-4">
            <div className="hidden sm:flex items-center gap-3 px-3 py-2 rounded-lg bg-card/50 border border-border/60 backdrop-blur-sm">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              <span className="text-sm text-muted-foreground">
                {user.name || user.email.split("@")[0]}
              </span>
            </div>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleLogout}
              className="hover:scale-105 transition-all duration-300 border-border/60 hover:border-destructive/50 hover:text-destructive"
            >
              Logout
            </Button>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Title Section */}
        <div className="mb-8 animate-fade-in-up">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-2 h-12 bg-gradient-to-b from-primary to-accent rounded-full"></div>
            <div>
              <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-foreground to-primary bg-clip-text text-transparent">
                News & Videos Dashboard
              </h1>
              <p className="text-lg text-muted-foreground mt-2">
                Stay updated with the latest news and video content
              </p>
            </div>
          </div>
        </div>

        {/* View Toggle */}
        <div className="mb-8 animate-fade-in-up" style={{ animationDelay: "0.1s" }}>
          <div className="flex gap-2 p-1 bg-muted/30 rounded-xl border border-border/40 w-fit">
            <button
              onClick={() => setActiveView("news")}
              className={`flex items-center gap-2 px-6 py-3 rounded-lg text-sm font-medium transition-all duration-300 ${
                activeView === "news"
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Newspaper size={16} />
              News Articles
            </button>
            <button
              onClick={() => setActiveView("videos")}
              className={`flex items-center gap-2 px-6 py-3 rounded-lg text-sm font-medium transition-all duration-300 ${
                activeView === "videos"
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Video size={16} />
              Videos
            </button>
          </div>
        </div>

        {/* Category Filter */}
        <div className="mb-8 flex flex-wrap gap-4 animate-fade-in-up" style={{ animationDelay: "0.2s" }}>
          <div className="flex flex-wrap gap-2">
            {categories.map((category) => (
              <button
                key={category}
                onClick={() => setSelectedCategory(category)}
                className={`px-4 py-2 rounded-xl text-sm font-medium transition-all duration-300 border ${
                  selectedCategory === category
                    ? "bg-primary text-primary-foreground border-primary shadow-sm"
                    : "bg-card/50 border-border/60 text-foreground hover:border-accent/60"
                }`}
              >
                {category}
              </button>
            ))}
          </div>
        </div>

        {/* News Articles Section */}
        {activeView === "news" && (
          <section className="animate-fade-in-up" style={{ animationDelay: "0.3s" }}>
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-4">
                <div className="w-1 h-8 bg-gradient-to-b from-blue-500 to-cyan-500 rounded-full"></div>
                <div>
                  <h2 className="text-2xl md:text-3xl font-bold text-foreground">Latest News</h2>
                  <p className="text-muted-foreground">Stay informed with recent articles from around the world</p>
                </div>
              </div>
              <div className="w-12 h-1 bg-gradient-to-r from-primary to-accent rounded-full"></div>
            </div>

            <div className="space-y-6">
              {loadingNews ? (
                // Loading skeleton for news
                [1, 2, 3].map((i) => (
                  <div key={i} className="animate-pulse border border-border/60 rounded-2xl p-6">
                    <div className="grid md:grid-cols-3 gap-6">
                      <div className="md:col-span-1 bg-muted h-48 rounded-xl"></div>
                      <div className="md:col-span-2 space-y-4">
                        <div className="h-6 bg-muted rounded w-3/4"></div>
                        <div className="h-4 bg-muted rounded w-full"></div>
                        <div className="h-4 bg-muted rounded w-2/3"></div>
                      </div>
                    </div>
                  </div>
                ))
              ) : newsError ? (
                <div className="text-center py-12">
                  <div className="text-destructive mb-4">{newsError}</div>
                  <Button onClick={() => window.location.reload()} variant="outline">
                    Retry
                  </Button>
                </div>
              ) : (
                filteredArticles.map((article, idx) => {
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
                      <article className="border border-border/60 rounded-2xl overflow-hidden hover:border-accent/60 transition-all duration-500 hover:shadow-xl bg-card/30 group-hover:bg-card/50 backdrop-blur-sm">
                        <div className="grid md:grid-cols-3 gap-0">
                          {/* Image with enhanced zoom effect */}
                          <div className="md:col-span-1 h-64 md:h-auto overflow-hidden relative">
                            <img
                              src={article.image || "/placeholder.svg"}
                              alt={article.title}
                              className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                            />
                            <div className="absolute inset-0 bg-gradient-to-r from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                          </div>

                          {/* Enhanced Content */}
                          <div className="md:col-span-2 p-6 md:p-8 flex flex-col justify-between">
                            {/* Top Section */}
                            <div>
                              <div className="flex items-center gap-3 mb-4">
                                <span className="inline-block px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-semibold border border-primary/20">
                                  {article.source}
                                </span>
                                <span className="text-xs text-muted-foreground">
                                  {new Date(article.publishedAt).toLocaleDateString('en-US', {
                                    day: 'numeric',
                                    month: 'long',
                                    year: 'numeric'
                                  })}
                                </span>
                              </div>

                              <h2 className="text-xl md:text-2xl font-bold text-foreground mb-3 group-hover:text-primary transition-colors duration-300 line-clamp-2">
                                {article.title}
                              </h2>

                              <p className="text-foreground/80 text-base leading-relaxed mb-4 line-clamp-3">
                                {article.description}
                              </p>
                            </div>

                            {/* Enhanced Bottom Section */}
                            <div className="flex items-center justify-between pt-4 border-t border-border/40">
                              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                                Verified Source
                              </div>
                              <div className="flex items-center gap-2 text-primary font-semibold group-hover:gap-3 transition-all duration-300">
                                <span>Read Article</span>
                                <ChevronRight size={16} className="group-hover:translate-x-1 transition-transform duration-300" />
                              </div>
                            </div>
                          </div>
                        </div>
                      </article>
                    </Link>
                  )
                })
              )}
            </div>
          </section>
        )}

        {/* Videos Section */}
        {activeView === "videos" && (
          <section className="animate-fade-in-up" style={{ animationDelay: "0.3s" }}>
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-4">
                <div className="w-1 h-8 bg-gradient-to-b from-purple-500 to-pink-500 rounded-full"></div>
                <div>
                  <h2 className="text-2xl md:text-3xl font-bold text-foreground">Popular Videos</h2>
                  <p className="text-muted-foreground">
                    {videos === staticVideos ? "Static demo videos - Click Refresh to load new videos" : "AI-analyzed video content with automatic transcription"}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={fetchYouTubeVideos}
                  disabled={loadingVideos}
                  className="flex items-center gap-2 bg-primary/10 border-primary/20 text-primary hover:bg-primary/20 hover:border-primary/30 transition-all duration-300"
                >
                  <RefreshCw size={16} className={`${loadingVideos ? "animate-spin" : ""} transition-transform duration-300 hover:rotate-180`} />
                  {loadingVideos ? "Chargement..." : "Actualiser les vidéos"}
                </Button>
                
              </div>
            </div>

            {videosError && (
              <div className="mb-6 p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-xl text-yellow-600 animate-shake">
                <div className="flex items-center gap-2">
                  <span>⚠️</span>
                  <span>{videosError}</span>
                </div>
              </div>
            )}
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {loadingVideos ? (
                // Enhanced loading skeleton
                [1, 2, 3, 4, 5].map((i) => (
                  <div key={i} className="animate-pulse">
                    <div className="bg-gradient-to-br from-muted to-muted/50 h-48 rounded-2xl mb-4"></div>
                    <div className="space-y-3">
                      <div className="h-4 bg-muted rounded-lg"></div>
                      <div className="h-4 bg-muted rounded-lg w-3/4"></div>
                      <div className="h-3 bg-muted rounded-lg w-1/2"></div>
                    </div>
                  </div>
                ))
              ) : (
                videos.map((video, idx) => (
                  <div 
                    key={video.id}
                    className="group cursor-pointer bg-card/50 backdrop-blur-sm border border-border/60 rounded-2xl overflow-hidden hover:border-accent/60 transition-all duration-500 hover:shadow-xl hover:scale-105"
                    style={{ animationDelay: `${0.1 * idx}s` }}
                  >
                    {/* Enhanced Thumbnail with cover image and animated overlay */}
                    <div className="relative overflow-hidden">
                      <img
                        src={video.thumbnail}
                        alt={video.title}
                        className="w-full h-48 object-cover group-hover:scale-110 transition-transform duration-700"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-all duration-500"></div>
                      <div className="absolute bottom-3 right-3 bg-black/90 text-white text-xs px-2 py-1 rounded-lg backdrop-blur-sm">
                        {video.duration}
                      </div>
                      {/* Category badge removed as requested */}
                      <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-500">
                        <div className="bg-primary/90 text-primary-foreground rounded-full p-4 transform scale-75 group-hover:scale-100 transition-transform duration-300 shadow-2xl">
                          <Play size={24} fill="currentColor" />
                        </div>
                      </div>
                    </div>

                    {/* Enhanced Content */}
                    <div className="p-5">
                      <h3 className="font-semibold text-foreground mb-3 line-clamp-2 group-hover:text-primary transition-colors duration-300 min-h-[3rem]">
                        {video.title}
                      </h3>
                      <div className="flex items-center justify-between text-sm text-muted-foreground mb-4">
                        <span className="font-medium">{video.source}</span>
                        <div className="flex items-center gap-2">
                          <Eye size={14} />
                          <span>{video.views}</span>
                        </div>
                      </div>

                      {/* Enhanced Action Buttons */}
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={(e) => {
                            e.stopPropagation()
                            openVideoModal(video)
                          }}
                          className="flex-1 text-xs border-border/60 hover:border-primary/50 hover:bg-primary/5"
                        >
                          <Play size={12} className="mr-1" />
                          Watch
                        </Button>
                        <Button
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation()
                            transcribeVideo(video.id)
                          }}
                          disabled={transcribingVideoId === video.id}
                          className="flex-1 text-xs bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white border-0"
                        >
                          <Mic size={12} className="mr-1" />
                          {transcribingVideoId === video.id ? (
                            <div className="flex items-center gap-1">
                              <div className="w-2 h-2 bg-white rounded-full animate-bounce"></div>
                              <div className="w-2 h-2 bg-white rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                              <div className="w-2 h-2 bg-white rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
                            </div>
                          ) : (
                            "Transcribe"
                          )}
                        </Button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </section>
        )}
      </div>

      {/* Enhanced Video Modal */}
      {selectedVideo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xl animate-fade-in">
          <div className="relative w-full max-w-6xl max-h-[90vh] bg-card border border-border/60 rounded-3xl overflow-hidden shadow-2xl animate-scale-in">
            {/* Enhanced Header */}
            <div className="flex items-center justify-between p-6 border-b border-border/60 bg-gradient-to-r from-card to-card/80 backdrop-blur-sm">
              <div className="flex items-center gap-4">
                <div className="w-3 h-12 bg-gradient-to-b from-purple-500 to-pink-500 rounded-full"></div>
                <div>
                  <h3 className="text-xl font-bold text-foreground line-clamp-1">{selectedVideo.title}</h3>
                  <p className="text-sm text-muted-foreground">{selectedVideo.source} • {selectedVideo.date}</p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={closeVideoModal}
                className="rounded-xl hover:bg-destructive/10 hover:text-destructive transition-all duration-300"
              >
                <X size={20} />
              </Button>
            </div>

            {/* Enhanced Content */}
            <div className="flex flex-col lg:flex-row h-[calc(90vh-120px)]">
              {/* Left: Video Player */}
              <div className="flex-1 p-6">
                <div className="relative aspect-video bg-black rounded-2xl overflow-hidden shadow-2xl">
                  <iframe
                    src={`https://www.youtube.com/embed/${selectedVideo.youtubeId}?autoplay=1`}
                    className="absolute inset-0 w-full h-full"
                    allowFullScreen
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  />
                </div>
                
                {/* Enhanced Stats */}
                <div className="grid grid-cols-3 gap-4 mt-6">
                  <div className="text-center p-4 bg-muted/30 rounded-xl border border-border/40">
                    <Clock className="w-5 h-5 text-muted-foreground mx-auto mb-2" />
                    <p className="text-sm text-muted-foreground">Duration</p>
                    <p className="font-semibold text-foreground">{selectedVideo.duration}</p>
                  </div>
                  <div className="text-center p-4 bg-muted/30 rounded-xl border border-border/40">
                    <Eye className="w-5 h-5 text-muted-foreground mx-auto mb-2" />
                    <p className="text-sm text-muted-foreground">Views</p>
                    <p className="font-semibold text-foreground">{selectedVideo.views}</p>
                  </div>
                  <div className="text-center p-4 bg-muted/30 rounded-xl border border-border/40">
                    <FileText className="w-5 h-5 text-muted-foreground mx-auto mb-2" />
                    <p className="text-sm text-muted-foreground">Status</p>
                    <p className="font-semibold text-foreground">
                      {selectedVideo.transcript ? "Transcribed" : "Not transcribed"}
                    </p>
                  </div>
                </div>
              </div>

              {/* Right: Enhanced Tabs */}
              <div className="w-full lg:w-96 border-t lg:border-t-0 lg:border-l border-border/60 p-6 flex flex-col">
                {/* Enhanced Tabs Header */}
                <div className="flex gap-1 p-1 bg-muted/30 rounded-xl border border-border/40 mb-6">
                  {[
                    { id: "video", label: "Video", icon: Play },
                    { id: "transcript", label: "Transcript", icon: FileText },
                    { id: "summary", label: "Summary", icon: Sparkles }
                  ].map((tab) => (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id as any)}
                      className={`flex items-center gap-2 flex-1 px-4 py-3 rounded-lg text-sm font-medium transition-all duration-300 ${
                        activeTab === tab.id
                          ? "bg-background text-foreground shadow-sm"
                          : "text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      <tab.icon size={16} />
                      {tab.label}
                    </button>
                  ))}
                </div>

                {/* Enhanced Tab Content */}
                <div className="flex-1 overflow-y-auto">
                  {activeTab === "video" && (
                    <div className="space-y-4">
                      <h4 className="font-semibold text-foreground">About this video</h4>
                      <p className="text-sm text-muted-foreground leading-relaxed">
                        {selectedVideo.description || "No description available."}
                      </p>
                    </div>
                  )}

                  {activeTab === "transcript" && (
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <h4 className="font-semibold text-foreground">Transcript</h4>
                        <Button
                          size="sm"
                          onClick={handleTranscribeInModal}
                          disabled={transcribingVideoId === selectedVideo.id}
                          className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white border-0"
                        >
                          <Mic size={14} className="mr-2" />
                          {transcribingVideoId === selectedVideo.id ? "Transcribing..." : "Transcribe"}
                        </Button>
                      </div>
                      
                      {transcriptionResult && (
                        <div className={`p-4 rounded-xl border ${
                          transcriptionResult.status === "success" 
                            ? "bg-green-500/10 border-green-500/20 text-green-600" 
                            : "bg-destructive/10 border-destructive/20 text-destructive"
                        }`}>
                          {transcriptionResult.message}
                        </div>
                      )}

                      <div className="bg-muted/30 rounded-xl p-4 border border-border/40">
                        {selectedVideo.transcript ? (
                          <p className="text-sm text-foreground leading-relaxed whitespace-pre-wrap">
                            {selectedVideo.transcript}
                          </p>
                        ) : (
                          <p className="text-sm text-muted-foreground text-center py-8">
                            No transcript available. Click "Transcribe" to generate the transcript.
                          </p>
                        )}
                      </div>
                    </div>
                  )}

                  {activeTab === "summary" && (
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <h4 className="font-semibold text-foreground">AI Summary</h4>
                        <Button
                          size="sm"
                          onClick={handleGenerateSummaryInModal}
                          disabled={generatingSummary}
                          className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white border-0"
                        >
                          <Sparkles size={14} className="mr-2" />
                          {generatingSummary ? "Generating..." : "Summarize"}
                        </Button>
                      </div>

                      {summaryResult && (
                        <div className={`p-4 rounded-xl border ${
                          summaryResult.status === "success" 
                            ? "bg-purple-500/10 border-purple-500/20 text-purple-600" 
                            : "bg-destructive/10 border-destructive/20 text-destructive"
                        }`}>
                          {summaryResult.message}
                        </div>
                      )}

                      <div className="bg-muted/30 rounded-xl p-4 border border-border/40">
                        {selectedVideo.summary ? (
                          <p className="text-sm text-foreground leading-relaxed whitespace-pre-wrap">
                            {selectedVideo.summary}
                          </p>
                        ) : (
                          <p className="text-sm text-muted-foreground text-center py-8">
                            No summary available. Click "Summarize" to generate an AI summary.
                          </p>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Enhanced Chatbot Button */}
      <div className="fixed bottom-8 right-8 z-30">
        <Button
          onClick={() => setShowChat(true)}
          size="lg"
          className="rounded-full w-14 h-14 bg-gradient-to-br from-primary to-accent hover:from-primary/90 hover:to-accent/90 shadow-2xl hover:shadow-3xl hover:scale-110 transition-all duration-500 group"
        >
          <MessageCircle size={24} className="text-primary-foreground group-hover:scale-110 transition-transform duration-300" />
        </Button>
      </div>

      {/* Chatbot Modal */}
      {showChat && (
        <div className="fixed inset-0 z-50 flex items-end justify-end pb-8 pr-8 animate-fade-in">
          <div className="w-96 h-[600px] animate-scale-in">
            <ChatBot onClose={() => setShowChat(false)} />
          </div>
        </div>
      )}
    </main>
  )
}