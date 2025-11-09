"use client"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { useRouter, useSearchParams, useParams } from "next/navigation"
import Link from "next/link"
import { 
  ArrowLeft, 
  Clock, 
  Eye, 
  Share2, 
  Bookmark, 
  ThumbsUp, 
  MessageCircle, 
  Download, 
  RefreshCw, 
  Image as ImageIcon,
  Play,
  BarChart3,
  TrendingUp,
  Users,
  Sparkles
} from "lucide-react"
import SourceVerification from "@/components/source-verification"
import { useCallback, useMemo, useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { BrainCircuit } from "lucide-react"

export default function ArticleDetailPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { id } = useParams<{ id: string }>()
  const [savedArticle, setSavedArticle] = useState(false)
  const [likes, setLikes] = useState(1247)
  const [extracting, setExtracting] = useState(false)
  const [summarizing, setSummarizing] = useState(false)
  const [extractedText, setExtractedText] = useState<string | null>(null)
  const [summary, setSummary] = useState<string | null>(null)
  const [summaryError, setSummaryError] = useState<string | null>(null)
  const [generating, setGenerating] = useState(false)
  const [showModal, setShowModal] = useState(false)
  const [generatedPost, setGeneratedPost] = useState<any>(null)
  const [analyzing, setAnalyzing] = useState(false)
  const [analysis, setAnalysis] = useState<string | null>(null)
  const [analysisError, setAnalysisError] = useState<string | null>(null)
  const [imageLoading, setImageLoading] = useState(false)
  const [imageError, setImageError] = useState<string | null>(null)
  const [generatedImage, setGeneratedImage] = useState<string | null>(null)

  const articleFromQuery = useMemo(() => {
    const title = searchParams.get("title") || "Breaking News: Major Development in Technology Sector"
    const source = searchParams.get("source") || "TechNews International"
    const date = searchParams.get("publishedAt") || new Date().toISOString()
    const image = searchParams.get("image") || "/article-featured-image.jpg"
    const url = searchParams.get("url") || ""
    return { title, source, date, image, url }
  }, [searchParams])

  const article = {
    id: id,
    title: articleFromQuery.title,
    source: articleFromQuery.source,
    date: articleFromQuery.date,
    category: "Technology",
    author: "Sarah Chen",
    authorAvatar: "SC",
    readTime: "4 min",
    views: "2.4K",
    content: extractedText || "This is a detailed analysis of the current technological advancements shaping our future. The rapid development in AI and machine learning continues to transform industries worldwide...",
    summary: summary || "",
  }

  const handleExtractAndSummarize = useCallback(async () => {
    if (!articleFromQuery.url) return
    let extracted: string | null = null
    try {
      setExtracting(true)
      setSummary(null)
      const ex = await fetch("http://127.0.0.1:8000/extract", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: articleFromQuery.url }),
      })
      const exJson = await ex.json()
      if (!ex.ok) throw new Error(exJson?.error || "Failed to extract")
      extracted = (exJson.text as string) || ""
      setExtractedText(extracted)
    } catch (e) {
      console.error(e)
    } finally {
      setExtracting(false)
    }

    try {
      const textToSummarize = (extracted || "").trim()
      if (!textToSummarize) return
      setSummarizing(true)
      setSummaryError(null)
      const abort = new AbortController()
      const timer = setTimeout(() => abort.abort(), 35000)
      const sm = await fetch("http://127.0.0.1:8000/summarize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: textToSummarize, max_length: 150, min_length: 50 }),
        signal: abort.signal,
      })
      clearTimeout(timer)
      const smText = await sm.text()
      let smJson: any = {}
      try {
        smJson = smText ? JSON.parse(smText) : {}
      } catch {
        smJson = {}
      }
      if (!sm.ok && !smJson?.summary) {
        setSummaryError(smJson?.error || "Failed to summarize")
        return
      }
      setSummary(smJson.summary)
    } catch (e) {
      console.error(e)
      setSummaryError((e as Error)?.message || "Failed to summarize")
    } finally {
      setSummarizing(false)
    }
  }, [articleFromQuery.url])

  const handleAnalyze = useCallback(async () => {
    if (!extractedText) return
    try {
      setAnalyzing(true)
      setAnalysis(null)
      setAnalysisError(null)
      const res = await fetch("http://127.0.0.1:8000/deep-analysis", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: extractedText }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data?.error || "Failed to analyze")
      setAnalysis(data.analysis)
    } catch (e) {
      console.error(e)
      setAnalysisError((e as Error)?.message || "Failed to analyze")
    } finally {
      setAnalyzing(false)
    }
  }, [extractedText])

  const handleGeneratePost = async () => {
    console.log("🟦 Generate Post button clicked");
    setGenerating(true);
    setImageLoading(true);
    setImageError(null);

    try {
      const res = await fetch("http://127.0.0.1:8000/generate-post", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text: extractedText || summary || "No text"
        }),
      });

      console.log("🟦 API request sent");

      const data = await res.json();
      console.log("🟩 Response received:", data);

      setGeneratedPost(data);
      
      // Mettre à jour l'image générée également
      if (data.image_path) {
        setGeneratedImage(`http://127.0.0.1:8080/${data.image_path}`);
      }
      
      setShowModal(true);
    } catch (error) {
      console.error("❌ Error generating post:", error);
      setImageError("Failed to generate post");
    } finally {
      setGenerating(false);
      setImageLoading(false);
    }
  };

  const handleRegeneratePost = async () => {
    setImageLoading(true);
    setImageError(null);
    
    try {
      const res = await fetch("http://127.0.0.1:8080/generate_post", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          article_text: extractedText || summary || "No text"
        }),
      });

      const data = await res.json();
      setGeneratedPost(data);
      
      if (data.image_path) {
        setGeneratedImage(`http://127.0.0.1:8080/${data.image_path}`);
      }
    } catch (error) {
      console.error("❌ Error regenerating post:", error);
      setImageError("Failed to regenerate post");
    } finally {
      setImageLoading(false);
    }
  };

  const handleDownloadImage = () => {
    if (!generatedImage) return;
    
    const link = document.createElement('a');
    link.href = generatedImage;
    link.download = `social-post-${Date.now()}.jpg`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleSharePost = async () => {
    if (!generatedPost) return;

    try {
      const shareRes = await fetch("http://127.0.0.1:8000/share-post", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text: generatedPost.summary || generatedPost.text,
          emojis: generatedPost.emojis,
          hashtags: generatedPost.hashtags,
          image_path: generatedPost.image_path
        }),
      });
      
      const result = await shareRes.json();
      
      if (result.facebook_post_id) {
        alert("✅ Post shared successfully on Facebook!");
      } else {
        alert("❌ Failed to share post on Facebook!");
      }
    } catch (error) {
      console.error("❌ Error sharing post:", error);
      alert("❌ Error sharing post!");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50/20 dark:from-slate-950 dark:to-blue-950/20">
      {/* Enhanced Navigation */}
      <nav className="sticky top-0 z-50 border-b border-slate-200/60 bg-white/80 dark:bg-slate-950/80 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-8">
              <Link href="/dashboard" className="flex items-center gap-3 group">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-purple-600 rounded-xl flex items-center justify-center shadow-lg group-hover:shadow-xl transition-all">
                  <span className="text-white font-bold text-lg">N</span>
                </div>
                <span className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  NewsHub
                </span>
              </Link>
              
              <div className="hidden md:flex items-center gap-6">
                <Link href="/dashboard" className="text-slate-600 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 font-medium transition-colors">
                  Dashboard
                </Link>
                <Link href="/trending" className="text-slate-600 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 font-medium transition-colors">
                  Trending
                </Link>
                <Link href="/categories" className="text-slate-600 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 font-medium transition-colors">
                  Categories
                </Link>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setSavedArticle(!savedArticle)}
                className={`rounded-xl ${savedArticle ? 'text-blue-600' : 'text-slate-600'}`}
              >
                <Bookmark size={20} fill={savedArticle ? "currentColor" : "none"} />
              </Button>
              <Button variant="ghost" size="icon" className="rounded-xl text-slate-600">
                <Share2 size={20} />
              </Button>
              <Button 
                variant="ghost" 
                onClick={() => router.back()}
                className="rounded-xl text-slate-600"
              >
                <ArrowLeft size={20} className="mr-2" />
                Back
              </Button>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content - Prend toute la largeur */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="space-y-8">
          {/* Article Header */}
          <Card className="border-0 shadow-xl rounded-3xl overflow-hidden bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm">
            <CardContent className="p-0">
              <div className="relative h-96 md:h-[480px]">
                <img 
                  src={articleFromQuery.image} 
                  alt={article.title}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                <div className="absolute bottom-0 left-0 right-0 p-8 text-white">
                  <div className="flex items-center gap-4 mb-4">
                    <Badge className="bg-blue-600/90 hover:bg-blue-700 border-0 text-white px-3 py-1 rounded-lg">
                      {article.category}
                    </Badge>
                    <div className="flex items-center gap-2 text-white/80">
                      <Clock size={16} />
                      <span className="text-sm">{article.readTime} read</span>
                    </div>
                    <div className="flex items-center gap-2 text-white/80">
                      <Eye size={16} />
                      <span className="text-sm">{article.views}</span>
                    </div>
                  </div>
                  <h1 className="text-4xl md:text-5xl font-bold leading-tight mb-4">
                    {article.title}
                  </h1>
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-semibold shadow-lg">
                        {article.authorAvatar}
                      </div>
                      <div>
                        <p className="font-semibold text-lg">{article.author}</p>
                        <p className="text-white/80 text-sm">{article.source}</p>
                      </div>
                    </div>
                    <div className="h-8 w-px bg-white/30"></div>
                    <p className="text-white/80">
                      {new Date(article.date).toLocaleDateString('en-US', { 
                        year: 'numeric', 
                        month: 'long', 
                        day: 'numeric' 
                      })}
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* AI Tools Section */}
          <Card className="border-0 shadow-lg rounded-2xl bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-3 text-2xl">
                <Sparkles className="text-blue-600" size={24} />
                AI Assistant
              </CardTitle>
              <CardDescription>
                Enhance your reading experience with AI-powered tools
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Button
                  onClick={handleExtractAndSummarize}
                  disabled={extracting || summarizing}
                  variant="outline"
                  className="h-16 justify-start p-4 rounded-xl border-2 border-blue-200/50 hover:border-blue-300 hover:bg-white/50 dark:border-blue-800/50 dark:hover:border-blue-700"
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-lg bg-blue-100 dark:bg-blue-900 flex items-center justify-center ${(extracting || summarizing) ? 'animate-pulse' : ''}`}>
                      <BrainCircuit size={20} className="text-blue-600" />
                    </div>
                    <div className="text-left">
                      <p className="font-semibold text-sm">
                        {extracting ? 'Extracting...' : summarizing ? 'Summarizing...' : 'Extract & Summarize'}
                      </p>
                      <p className="text-xs text-slate-500">AI-powered analysis</p>
                    </div>
                  </div>
                </Button>

                <Button
                  onClick={handleAnalyze}
                  disabled={analyzing || !extractedText}
                  variant="outline"
                  className="h-16 justify-start p-4 rounded-xl border-2 border-purple-200/50 hover:border-purple-300 hover:bg-white/50 dark:border-purple-800/50 dark:hover:border-purple-700"
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-lg bg-purple-100 dark:bg-purple-900 flex items-center justify-center ${analyzing ? 'animate-pulse' : ''}`}>
                      <BarChart3 size={20} className="text-purple-600" />
                    </div>
                    <div className="text-left">
                      <p className="font-semibold text-sm">
                        {analyzing ? 'Analyzing...' : 'Deep Analysis'}
                      </p>
                      <p className="text-xs text-slate-500">Comprehensive insights</p>
                    </div>
                  </div>
                </Button>

                <Button
                  onClick={handleGeneratePost}
                  disabled={imageLoading || !extractedText}
                  variant="outline"
                  className="h-16 justify-start p-4 rounded-xl border-2 border-green-200/50 hover:border-green-300 hover:bg-white/50 dark:border-green-800/50 dark:hover:border-green-700"
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-lg bg-green-100 dark:bg-green-900 flex items-center justify-center ${imageLoading ? 'animate-pulse' : ''}`}>
                      <ImageIcon size={20} className="text-green-600" />
                    </div>
                    <div className="text-left">
                      <p className="font-semibold text-sm">
                        {imageLoading ? 'Generating...' : 'Create Social Post'}
                      </p>
                      <p className="text-xs text-slate-500">Complete post with image</p>
                    </div>
                  </div>
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Analysis Section */}
          <Card className="border-0 shadow-lg rounded-2xl bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-2xl">
                <BarChart3 className="text-purple-600" size={24} />
                Deep Analysis
              </CardTitle>
              <CardDescription>
                Comprehensive AI-powered analysis of article content and credibility
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              {/* Analysis Content - Vertical stacked layout */}
              <div className="divide-y divide-slate-200 dark:divide-slate-700">
                {analyzing && (
                  <div className="px-8 py-12">
                    <div className="flex flex-col items-center justify-center">
                      <div className="w-12 h-12 border-4 border-purple-600/30 border-t-purple-600 rounded-full animate-spin mb-4"></div>
                      <p className="text-lg text-slate-600 dark:text-slate-400">Analyzing article content...</p>
                      <p className="text-sm text-slate-500 dark:text-slate-500 mt-2">This may take a few moments</p>
                    </div>
                  </div>
                )}
                {!analyzing && analysisError && (
                  <div className="px-8 py-10">
                    <div className="text-center">
                      <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                        <span className="text-red-600 text-2xl">!</span>
                      </div>
                      <p className="text-lg text-red-600 font-medium mb-2">Analysis Failed</p>
                      <p className="text-slate-600 dark:text-slate-400">{analysisError}</p>
                    </div>
                  </div>
                )}
                {!analyzing && !analysisError && analysis && (
                  <div className="px-8 py-8">
                    <div className="prose prose-lg dark:prose-invert max-w-none">
                      <pre className="text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-wrap text-base font-mono bg-slate-50 dark:bg-slate-800/50 p-6 rounded-xl border border-slate-200 dark:border-slate-700">
                        {analysis}
                      </pre>
                    </div>
                  </div>
                )}
                {!analyzing && !analysisError && !analysis && (
                  <div className="px-8 py-12">
                    <div className="text-center">
                      <BarChart3 size={48} className="text-slate-300 mx-auto mb-4" />
                      <p className="text-lg text-slate-500 dark:text-slate-400">No analysis performed yet</p>
                      <p className="text-sm text-slate-400 dark:text-slate-500 mt-2">
                        Click "Deep Analysis" to generate comprehensive insights
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Content Sections */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Summary Section */}
            <Card className="border-0 shadow-lg rounded-2xl bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp size={20} className="text-blue-600" />
                  Executive Summary
                </CardTitle>
              </CardHeader>
              <CardContent>
                {summarizing ? (
                  <div className="flex items-center gap-3 py-8">
                    <div className="w-6 h-6 border-2 border-blue-600/30 border-t-blue-600 rounded-full animate-spin"></div>
                    <p className="text-slate-600">Generating summary...</p>
                  </div>
                ) : summary ? (
                  <p className="text-slate-700 dark:text-slate-300 leading-relaxed text-lg">
                    {summary}
                  </p>
                ) : (
                  <div className="text-center py-8">
                    <BrainCircuit size={48} className="text-slate-300 mx-auto mb-4" />
                    <p className="text-slate-500">No summary generated yet</p>
                    <p className="text-sm text-slate-400 mt-1">Use AI Assistant to create one</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Generated Image Section */}
            <Card className="border-0 shadow-lg rounded-2xl bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ImageIcon size={20} className="text-green-600" />
                  Generated Visual
                </CardTitle>
              </CardHeader>
              <CardContent>
                {imageLoading ? (
                  <div className="flex flex-col items-center justify-center py-12">
                    <div className="w-12 h-12 border-4 border-green-600/30 border-t-green-600 rounded-full animate-spin mb-4"></div>
                    <p className="text-slate-600">Creating social post...</p>
                  </div>
                ) : imageError ? (
                  <div className="flex flex-col items-center justify-center py-8 text-center">
                    <div className="w-12 h-12 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mb-3">
                      <span className="text-red-600 text-lg">!</span>
                    </div>
                    <p className="text-red-600 text-sm mb-2">Error generating post</p>
                    <p className="text-slate-500 text-xs">{imageError}</p>
                  </div>
                ) : generatedImage ? (
                  <div className="space-y-4">
                    <div className="relative rounded-xl overflow-hidden border-2 border-slate-200 dark:border-slate-700">
                      <img 
                        src={generatedImage} 
                        alt="Generated Social Media Image"
                        className="w-full h-48 object-cover"
                        onError={() => setImageError("Failed to load generated image")}
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
                    </div>
                    <div className="flex gap-2">
                      <Button 
                        onClick={handleRegeneratePost}
                        disabled={imageLoading}
                        variant="outline" 
                        size="sm"
                        className="flex-1"
                      >
                        <RefreshCw size={16} className="mr-2" />
                        {imageLoading ? 'Regenerating...' : 'Regenerate'}
                      </Button>
                      <Button 
                        onClick={handleDownloadImage}
                        variant="outline" 
                        size="sm"
                        className="flex-1"
                      >
                        <Download size={16} className="mr-2" />
                        Download
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8 border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-xl">
                    <ImageIcon size={48} className="text-slate-300 mx-auto mb-4" />
                    <p className="text-slate-500">No visual generated yet</p>
                    <p className="text-sm text-slate-400 mt-1">Click "Create Social Post" to generate content</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Full Article Content */}
          <Card className="border-0 shadow-lg rounded-2xl bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm">
            <CardHeader>
              <CardTitle>Full Article</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="prose prose-lg dark:prose-invert max-w-none">
                <p className="text-slate-700 dark:text-slate-300 leading-relaxed text-lg mb-6">
                  {article.content}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Source Verification - En bas de page */}
          <Card className="border-0 shadow-lg rounded-2xl bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm">
            <CardHeader>
              <CardTitle>Source Credibility</CardTitle>
              <CardDescription>
                In-depth analysis of content reliability and authenticity
              </CardDescription>
            </CardHeader>
            <CardContent>
              <SourceVerification contentType="article" contentTitle={article.title} />
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Enhanced Generated Post Modal */}
      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent className="max-w-2xl rounded-2xl border-0 shadow-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-2xl">
              <Share2 className="text-blue-600" size={24} />
              Social Media Post
            </DialogTitle>
          </DialogHeader>
          
          {generatedPost && (
            <div className="space-y-6">
              <Card className="border-2 border-slate-100 dark:border-slate-700">
                <CardContent className="p-6">
                  <div className="space-y-4">
                    <div>
                      <h4 className="font-semibold text-slate-700 dark:text-slate-300 mb-2">Post Content</h4>
                      <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
                        {generatedPost.summary || generatedPost.text}
                      </p>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <h4 className="font-semibold text-slate-700 dark:text-slate-300 mb-2">Emojis</h4>
                        <p className="text-2xl">{generatedPost.emojis}</p>
                      </div>
                      <div>
                        <h4 className="font-semibold text-slate-700 dark:text-slate-300 mb-2">Hashtags</h4>
                        <p className="text-slate-600 dark:text-slate-400">{generatedPost.hashtags}</p>
                      </div>
                    </div>

                    {generatedPost.image_path && (
                      <div>
                        <h4 className="font-semibold text-slate-700 dark:text-slate-300 mb-2">Generated Image</h4>
                        <img 
                          src={`http://127.0.0.1:8080/${generatedPost.image_path}`}
                          alt="Generated Social Media Post"
                          className="w-full rounded-lg border border-slate-200 dark:border-slate-700"
                        />
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              <div className="flex gap-3">
                <Button 
                  onClick={handleSharePost}
                  className="flex-1 h-12 rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold shadow-lg"
                >
                  <Share2 size={20} className="mr-2" />
                  Share on Facebook
                </Button>
                <Button 
                  onClick={handleDownloadImage}
                  variant="outline"
                  className="h-12 rounded-xl"
                >
                  <Download size={20} className="mr-2" />
                  Download
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
