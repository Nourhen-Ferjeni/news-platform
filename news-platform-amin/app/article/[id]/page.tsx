"use client"
import { Badge } from "@/components/ui/badge"
import { Card } from "@/components/ui/card"
import { useRouter, useSearchParams, useParams } from "next/navigation"
import Link from "next/link"
import { ArrowLeft, Clock, Eye, Share2, Bookmark, ThumbsUp, MessageCircle } from "lucide-react"
import SourceVerification from "@/components/source-verification"
import { useCallback, useMemo, useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { BrainCircuit } from "lucide-react"

export default function ArticleDetailPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { id } = useParams<{ id: string }>()
  const [savedArticle, setSavedArticle] = useState(false)
  const [likes, setLikes] = useState(1204)
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


  const articleFromQuery = useMemo(() => {
    const title = searchParams.get("title") || ""
    const source = searchParams.get("source") || ""
    const date = searchParams.get("publishedAt") || ""
    const image = searchParams.get("image") || "/article-featured-image.jpg"
    const url = searchParams.get("url") || ""
    return { title, source, date, image, url }
  }, [searchParams])

  const article = {
    id: id,
    title: articleFromQuery.title || "Article",
    source: articleFromQuery.source || "",
    date: articleFromQuery.date || "",
    category: "News",
    author: articleFromQuery.source || "Reporter",
    authorAvatar: (articleFromQuery.source || "R").slice(0, 2).toUpperCase(),
    readTime: "",
    views: "",
    content: extractedText || "",
    summary: summary || "",
  }

  const handleExtractAndSummarize = useCallback(async () => {
    if (!articleFromQuery.url) return
    let extracted: string | null = null
    try {
      setExtracting(true)
      setSummary(null)
      // 1) extract
      const ex = await fetch("/api/extract", {
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
      // 2) summarize
      const abort = new AbortController()
      const timer = setTimeout(() => abort.abort(), 35000)
      const sm = await fetch("/api/summarize", {
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
      // Accept fallback summaries too; if error, show it instead of throwing
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
      const res = await fetch("http://127.0.0.1:8001/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ article_text: extractedText }),
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
  console.log("🟦 Generate button clicked"); // debug

  const res = await fetch("http://127.0.0.1:8080/generate_post", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      article_text: extractedText || summary || "No text"
    }),
  });

  console.log("🟦 API request sent");

  const data = await res.json();
  console.log("🟩 Response received:", data);

  setGeneratedPost(data);
  setShowModal(true);
};

  return (
    <main className="min-h-screen bg-background">
      {/* Premium Navigation Header */}
      <nav className="sticky top-0 z-40 border-b border-border/40 bg-background/80 backdrop-blur-md">
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.back()}
              className="p-2 hover:bg-card rounded-lg transition-colors hover:scale-105 active:scale-95"
            >
              <ArrowLeft size={20} className="text-primary" />
            </button>
            <Link href="/dashboard" className="text-lg font-bold text-primary hover:opacity-80 transition-opacity">
              📰 Press
            </Link>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setSavedArticle(!savedArticle)}
              className={`p-2 rounded-lg transition-all ${
                savedArticle ? "bg-primary/10 text-primary" : "hover:bg-card text-muted-foreground"
              }`}
            >
              <Bookmark size={20} fill={savedArticle ? "currentColor" : "none"} />
            </button>
            <button className="p-2 hover:bg-card rounded-lg transition-colors text-muted-foreground hover:text-foreground">
              <Share2 size={20} />
            </button>
          </div>
        </div>
      </nav>

      <div className="bg-gradient-to-b from-primary/5 to-transparent">
        <div className="max-w-4xl mx-auto px-6 py-12 fade-in-up">
          {/* Breadcrumbs & Category */}
          <div className="mb-6 flex items-center gap-2 text-sm">
            <Link href="/dashboard" className="text-muted-foreground hover:text-primary transition-colors">
              Articles
            </Link>
            <span className="text-muted-foreground">/</span>
            <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20">
              {article.category}
            </Badge>
          </div>

          {/* Hero Title Section */}
          <h1 className="text-5xl md:text-6xl font-bold text-foreground mb-6 leading-tight text-balance">
            {article.title}
          </h1>

          {/* Meta Information - Enhanced */}
          <div className="flex flex-col md:flex-row md:items-center gap-6 mb-8 pb-8 border-b border-border/40">
            {/* Author Info */}
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-gradient-to-br from-primary to-accent rounded-full flex items-center justify-center text-white font-semibold shadow-lg">
                {article.authorAvatar}
              </div>
              <div>
                <p className="font-semibold text-foreground text-lg">{article.author}</p>
                <p className="text-sm text-muted-foreground">{article.source}</p>
              </div>
            </div>

            {/* Divider */}
            <div className="hidden md:block w-px h-16 bg-border/40"></div>

            {/* Article Stats */}
            <div className="flex flex-wrap gap-6">
              {article.date && (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Clock size={18} />
                  <span>{new Date(article.date).toDateString()}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Hero Image Section */}
      <div className="w-full h-96 md:h-[500px] fade-in">
        <img src={articleFromQuery.image || "/article-featured-image.jpg"} alt={article.title} className="w-full h-full object-cover" />
      </div>

      {/* Main Content Area */}
      <div className="bg-background">
        <div className="max-w-4xl mx-auto px-6 py-12">
          <div className="mb-12 fade-in-up" style={{ animationDelay: "0.05s" }}>
            <h2 className="text-3xl font-bold text-foreground mb-4">Summary</h2>
            <Card className="p-6 border border-primary/10 bg-gradient-to-br from-primary/5 to-accent/5 rounded-xl">
              {summarizing && (
                <p className="text-base md:text-lg text-muted-foreground">Summarizing…</p>
              )}
              {!summarizing && summaryError && (
                <p className="text-base md:text-lg text-destructive">{summaryError}</p>
              )}
              {!summarizing && !summaryError && summary && (
                <p className="text-base md:text-lg text-foreground leading-relaxed whitespace-pre-wrap">{summary}</p>
              )}
              {!summarizing && !summaryError && !summary && (
                <p className="text-base md:text-lg text-muted-foreground">No summary yet. Click "Extract & Summarize".</p>
              )}
            </Card>
          </div>

          {/* Extraction & Summary Controls */}
          <div className="mb-8 flex flex-wrap gap-3">
            <button
              onClick={handleExtractAndSummarize}
              disabled={extracting || summarizing || !articleFromQuery.url}
              className="px-4 py-2 rounded-lg border border-border hover:border-primary/40 hover:bg-primary/5 transition-all disabled:opacity-60"
            >
              {extracting ? "Extracting…" : summarizing ? "Summarizing…" : "🧠 Extract & Summarize"}
            </button>
            <button
              onClick={handleAnalyze}
              disabled={analyzing || !extractedText}
              className="px-4 py-2 rounded-lg border border-border hover:border-primary/40 hover:bg-primary/5 transition-all disabled:opacity-60"
            >
              {analyzing ? "Analyzing…" : <><BrainCircuit size={16} className="mr-2" /> Analyze</>}
            </button>
            <button
              onClick={handleGeneratePost}
              disabled={generating || !summary}
              className="px-4 py-2 rounded-lg border border-border hover:border-primary/40 hover:bg-primary/5 transition-all disabled:opacity-60"
            >
              {generating ? "Generating Post…" : "🚀 Generate Social Post"}
            </button>
            {articleFromQuery.url && (
              <a
                href={articleFromQuery.url}
                target="_blank"
                rel="noreferrer"
                className="px-4 py-2 rounded-lg border border-border hover:border-primary/40 hover:bg-primary/5 transition-all"
              >
                Open Original
              </a>
            )}
          </div>

          {/* Main Article Content */}
          {article.content && (
            <div className="mb-12 fade-in-up" style={{ animationDelay: "0.1s" }}>
              <h2 className="text-3xl font-bold text-foreground mb-4">Extracted Article</h2>
              <div className="prose-invert max-w-none">
                {article.content.split("\n").map(
                  (paragraph, idx) =>
                    paragraph.trim() && (
                      <p key={idx} className="text-base md:text-lg text-foreground leading-relaxed mb-6 text-justify">
                        {paragraph.trim()}
                      </p>
                    ),
                )}
              </div>
            </div>
          )}
          <Card
            className="p-0 mb-12 border-0 bg-transparent rounded-xl fade-in-up overflow-hidden"
            style={{ animationDelay: "0.2s" }}
          >
            {/* Premium Section Header */}
            <div className="px-8 pt-12 pb-8 border-b border-border/30">
              <h2 className="text-4xl font-bold text-foreground mb-2">Analysis</h2>
              <p className="text-muted-foreground text-base">AI summary and insights</p>
            </div>

            {/* Analysis Content - Vertical stacked layout */}
            <div className="divide-y divide-border/20">
              {analyzing && (
                <div className="px-8 py-10">
                  <p className="text-base md:text-lg text-muted-foreground">Analyzing…</p>
                </div>
              )}
              {!analyzing && analysisError && (
                <div className="px-8 py-10">
                  <p className="text-base md:text-lg text-destructive">{analysisError}</p>
                </div>
              )}
              {!analyzing && !analysisError && analysis && (
                <div className="px-8 py-10">
                  <pre className="text-base md:text-lg text-foreground leading-relaxed whitespace-pre-wrap">{analysis}</pre>
                </div>
              )}
              {!analyzing && !analysisError && !analysis && (
                <div className="px-8 py-10">
                  <p className="text-base md:text-lg text-muted-foreground">No analysis yet. Click "Analyze".</p>
                </div>
              )}
            </div>

            {/* Key Insight Section */}
            <div className="px-8 py-10 bg-gradient-to-r from-primary/5 via-accent/5 to-primary/5 border-t border-border/20">
              <div className="flex items-start gap-4">
                <div className="text-2xl flex-shrink-0">💡</div>
                <div>
                  <h4 className="font-semibold text-foreground mb-2">Conclusion Clé</h4>
                  <p className="text-foreground leading-relaxed text-sm">
                    Ce partenariat représente un tournant majeur pour la redéfinition des rapports entre créateurs et
                    plateformes. Les implications vont bien au-delà du secteur créatif traditionnel et pourraient
                    établir de nouveaux standards pour toute l'industrie du divertissement.
                  </p>
                </div>
              </div>
            </div>
          </Card>

          {/* Engagement Section */}
          <div className="flex flex-wrap gap-4 mb-12 pb-12 border-b border-border/40">
            <button
              onClick={() => setLikes(likes + 1)}
              className="flex items-center gap-2 px-4 py-2 rounded-lg border border-border hover:border-primary/40 hover:bg-primary/5 transition-all group"
            >
              <ThumbsUp size={18} className="group-hover:text-primary transition-colors" />
              <span className="text-sm text-muted-foreground group-hover:text-foreground">{likes}</span>
            </button>
            <button className="flex items-center gap-2 px-4 py-2 rounded-lg border border-border hover:border-primary/40 hover:bg-primary/5 transition-all group">
              <MessageCircle size={18} className="group-hover:text-primary transition-colors" />
              <span className="text-sm text-muted-foreground group-hover:text-foreground">124</span>
            </button>
          </div>

          {/* Source Verification */}
          <div className="mb-16 fade-in-up" style={{ animationDelay: "0.3s" }}>
            <SourceVerification contentType="article" contentTitle={article.title} />
          </div>

          {/* Related Articles Section */}
          <div className="bg-card rounded-xl p-8 border border-border/40">
            <h3 className="text-2xl font-bold text-foreground mb-6">Articles Connexes</h3>
            <div className="grid md:grid-cols-2 gap-4">
              {[1, 2].map((item) => (
                <Link
                  key={item}
                  href="/dashboard"
                  className="p-4 rounded-lg border border-border hover:border-primary/40 hover:bg-background transition-all group"
                >
                  <h4 className="font-semibold text-foreground group-hover:text-primary transition-colors mb-2 line-clamp-2">
                    Article relacionné {item}
                  </h4>
                  <p className="text-sm text-muted-foreground">Continuer la lecture →</p>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>
      <Dialog open={showModal} onOpenChange={setShowModal}>
       <DialogContent className="w-full max-w-3xl">
       <DialogHeader>
        <DialogTitle>Generated Social Media Post</DialogTitle>
       </DialogHeader>

       {generatedPost && (
       <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-2">
         <p><strong>Summary:</strong> {generatedPost.summary}</p>
         <p><strong>Emojis:</strong> {generatedPost.emojis}</p>
         <p><strong>Hashtags:</strong> {generatedPost.hashtags}</p>

         {generatedPost.image_path && (
           <img src={`http://127.0.0.1:8080/${generatedPost.image_path}`} 
                alt="Generated" className="rounded-lg border" />
        )}

         <button
            className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-lg"
            onClick={async () => {
             const shareRes = await fetch("http://127.0.0.1:8080/share_post", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(generatedPost),
              });
             const resp = await shareRes.json();
             if (resp.facebook_post_id) alert("✅ Post shared successfully!");
             else alert("❌ Failed to share post!");
           }}
          >
           📤 Share on Facebook
         </button>
        </div>
      )}
    </DialogContent>
    </Dialog>

    </main>
  )
}
