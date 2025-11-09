"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import {
  AlertTriangle,
  CheckCircle2,
  ExternalLink,
  Loader2,
  Shield,
  TrendingUp,
  FileText,
  Link2,
  Clock,
  BarChart3,
} from "lucide-react"

interface VerificationData {
  verdict: "TRUE" | "FALSE" | "MIXED"
  confidence: number
  confidenceLevel: "Low Confidence" | "Medium Confidence" | "High Confidence"
  justification: string
  keyEvidence: string[]
  mostConvincingSource: string
  consulted_sources: Array<{
    title: string
    url: string
    source_type: string
    summary: string
  }>
  from_cache?: boolean
  similar_claim?: string
}

interface SourceVerificationProps {
  contentType: "article" | "video"
  contentTitle: string
  contentSummary?: string
}

export default function SourceVerification({ 
  contentType, 
  contentTitle,
  contentSummary 
}: SourceVerificationProps) {
  const [isChecking, setIsChecking] = useState(false)
  const [showDetailedResults, setShowDetailedResults] = useState(false)
  const [verificationData, setVerificationData] = useState<VerificationData | null>(null)
  const [error, setError] = useState<string | null>(null)

  const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000'

  const handleVerify = async () => {
    setIsChecking(true)
    setError(null)

    try {
      // Utiliser directement le summary comme revendication
      const claim = contentSummary || contentTitle;
      
      const response = await fetch(`${API_BASE}/check-fake-news`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          claim: claim,
        }),
      })

      if (!response.ok) {
        throw new Error('Error while verifying')
      }

      const data = await response.json()
      
      if (data.error) {
        throw new Error(data.error)
      }

      setVerificationData(data)
      setShowDetailedResults(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setIsChecking(false)
    }
  }

  const handleReset = () => {
    setShowDetailedResults(false)
    setVerificationData(null)
    setError(null)
  }

  // Default demo data if the API is not available
  const defaultVerificationData: VerificationData = {
    verdict: "TRUE",
    confidence: 87,
    confidenceLevel: "High Confidence",
    justification: "The information about the partnership between Larry Jackson and Mariah Carey is corroborated by multiple reliable sources. The agreement details align with financial reports and official announcements.",
    keyEvidence: [
      "Forbes confirms Mariah Carey signing to Larry Jackson's platform",
      "Official press release announcing the strategic partnership",
      "Financial documents indicating a $400M valuation",
      "Confirmed interviews from both parties involved",
    ],
    mostConvincingSource: "Forbes is considered a highly reliable source for financial and business reporting with a strong track record of accuracy.",
    consulted_sources: [
      {
        title: "Forbes: Larry Jackson Signs Mariah Carey to $400M Creative Platform",
        url: "https://www.forbes.com/article-example",
        source_type: "Forbes",
        summary: "An article detailing the strategic partnership between Larry Jackson and Mariah Carey, including financial terms and industry implications.",
      },
      {
        title: "Press Release: Official Partnership Announcement",
        url: "https://www.businesswire.com/news/home/example",
        source_type: "Business Wire",
        summary: "Official press release confirming the agreement details and strategic vision behind the partnership.",
      },
      {
        title: "Financial Times: Music Industry Investments Analysis",
        url: "https://www.ft.com/content/example",
        source_type: "Financial Times",
        summary: "In-depth analysis of music industry investments and emerging trends in creative platforms.",
      },
    ],
    from_cache: false,
    similar_claim: ""
  }

  const data = verificationData

  if (!showDetailedResults) {
    return (
      <Card className="p-8 border-border/50 bg-gradient-to-br from-card to-card/50">
        <div className="space-y-4">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
              {error}
            </div>
          )}

          <Button
            onClick={handleVerify}
            disabled={isChecking}
            className={`w-full sm:w-auto py-6 px-8 rounded-lg font-semibold transition-all ${
              isChecking ? "bg-primary/50" : "bg-primary hover:bg-primary/90 shadow-lg hover:shadow-xl"
            }`}>
            {isChecking ? (
              <>
                <Loader2 size={18} className="mr-2 animate-spin" />
                Verifying...
              </>
            ) : (
              <>
                <Shield size={18} className="mr-2" />
                Verify Source
              </>
            )}
          </Button>
        </div>
      </Card>
    )
  }

  if (!data) {
    return null
  }

  const getVerdictColor = () => {
    switch (data.verdict) {
      case "TRUE":
        return "bg-gradient-to-r from-emerald-500 to-green-600"
      case "FALSE":
        return "bg-gradient-to-r from-red-500 to-rose-600"
      default:
        return "bg-gradient-to-r from-amber-500 to-orange-600"
    }
  }

  const getVerdictBgColor = () => {
    switch (data.verdict) {
      case "TRUE":
        return "bg-emerald-50/40 dark:bg-emerald-950/20 border-emerald-200/50 dark:border-emerald-800/40"
      case "FALSE":
        return "bg-red-50/40 dark:bg-red-950/20 border-red-200/50 dark:border-red-800/40"
      default:
        return "bg-amber-50/40 dark:bg-amber-950/20 border-amber-200/50 dark:border-amber-800/40"
    }
  }

  const getVerdictIcon = () => {
    if (data.verdict === "TRUE") {
      return <CheckCircle2 size={40} className="text-emerald-600 dark:text-emerald-400" />
    }
    return <AlertTriangle size={40} className="text-red-600 dark:text-red-400" />
  }

  const getVerdictText = () => {
    switch (data.verdict) {
      case "TRUE":
        return "Vérifié Vrai"
      case "FALSE":
        return "Faux"
      default:
        return "Information Mixte"
    }
  }

  const getConfidenceBadgeColor = () => {
    if (data.confidence >= 80)
      return "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300"
    if (data.confidence >= 50) return "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300"
    return "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300"
  }

  return (
    <div className="space-y-6 w-full">
      {/* Header Section */}
      <div className="space-y-2 mb-6">
        <div className="flex items-center gap-2">
          <Shield size={24} className="text-primary" />
          <h3 className="text-2xl font-bold text-foreground">Source Verification</h3>
        </div>
        <p className="text-foreground/70 text-sm">
          In-depth analysis of content reliability and authenticity
        </p>
      </div>

      {showDetailedResults && verificationData && (
        <div className="space-y-6 animate-fade-in">
          {/* Cache Notice */}
          {data.from_cache && (
            <Card className="p-4 bg-blue-50 border-blue-200 dark:bg-blue-950/20 dark:border-blue-800">
              <div className="flex items-center gap-2 text-blue-700 dark:text-blue-300">
                <CheckCircle2 size={16} />
                <span className="text-sm font-medium">Instant result (semantic cache)</span>
              </div>
              {data.similar_claim && (
                <p className="text-blue-600 dark:text-blue-400 text-sm mt-1">
                  Based on similar claim: "{data.similar_claim}"
                </p>
              )}
            </Card>
          )}

          {/* Verdict Section - Hero */}
          <div className={`p-8 rounded-2xl border-2 ${getVerdictBgColor()} backdrop-blur-sm`}>
            <div className="flex items-start justify-between gap-6">
              <div className="flex items-start gap-4">
                {getVerdictIcon()}
                <div className="space-y-2">
                  <h4 className="font-bold text-3xl text-foreground">{getVerdictText()}</h4>
                  <span
                    className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${getConfidenceBadgeColor()}`}>
                    {data.confidenceLevel}
                  </span>
                </div>
              </div>
              <div className="text-right">
                <div className="text-4xl font-black bg-gradient-to-br from-primary to-primary/60 bg-clip-text text-transparent">
                  {data.confidence}%
                </div>
                <p className="text-xs text-foreground/60 mt-1">Reliability score</p>
              </div>
            </div>
          </div>

          {/* Statistics Bar */}
          <div className="grid grid-cols-3 gap-3">
            <Card className="p-4 text-center bg-card/50 border-border/30">
              <TrendingUp size={20} className="mx-auto text-primary mb-2" />
              <p className="text-2xl font-bold text-foreground">{data.consulted_sources?.length || 0}</p>
              <p className="text-xs text-foreground/60 mt-1">Sources</p>
            </Card>
            <Card className="p-4 text-center bg-card/50 border-border/30">
              <FileText size={20} className="mx-auto text-primary mb-2" />
              <p className="text-2xl font-bold text-foreground">{data.keyEvidence?.length || 0}</p>
              <p className="text-xs text-foreground/60 mt-1">Evidence</p>
            </Card>
            <Card className="p-4 text-center bg-card/50 border-border/30">
              <Clock size={20} className="mx-auto text-primary mb-2" />
              <p className="text-2xl font-bold text-foreground">2m</p>
              <p className="text-xs text-foreground/60 mt-1">Analysis</p>
            </Card>
          </div>

          {/* Justification */}
          <Card className="p-6 bg-gradient-to-br from-card/50 to-card/30 border-border/30">
            <div className="flex items-start gap-3 mb-3">
              <BarChart3 size={20} className="text-primary mt-1 flex-shrink-0" />
              <h5 className="font-bold text-lg text-foreground">Detailed Analysis</h5>
            </div>
              <p className="text-foreground/80 leading-relaxed text-sm">{data.justification}</p>
          </Card>

          {/* Key Evidence */}
          <Card className="p-6 bg-gradient-to-br from-card/50 to-card/30 border-border/30">
            <div className="flex items-start gap-3 mb-4">
              <CheckCircle2 size={20} className="text-primary mt-0.5 flex-shrink-0" />
              <h5 className="font-bold text-lg text-foreground">Key Evidence</h5>
            </div>
            <div className="space-y-3">
              {data.keyEvidence?.map((evidence, idx) => (
                <div key={idx} className="flex gap-3 p-4 rounded-lg bg-background/50 border border-border/20 hover:border-primary/30 transition-colors">
                  <div className="flex-shrink-0 w-5 h-5 bg-primary/20 rounded-full flex items-center justify-center mt-0.5">
                    <CheckCircle2 size={12} className="text-primary" />
                  </div>
                  <div className="flex-1 space-y-2">
                    {evidence.split(';').filter(item => item.trim()).map((item, itemIdx) => (
                      <p key={itemIdx} className="text-sm text-foreground/80 leading-relaxed">
                        {item.trim()}
                      </p>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </Card>

          {/* Most Convincing Source */}
          <Card className="p-6 bg-gradient-to-r from-primary/10 to-primary/5 border border-primary/20">
            <div className="flex items-start gap-3 mb-3">
              <Shield size={20} className="text-primary mt-1 flex-shrink-0" />
              <div>
                <h5 className="font-bold text-lg text-foreground">Primary Source</h5>
                    <p className="text-foreground/70 text-sm mt-2">{data.mostConvincingSource}</p>
              </div>
            </div>
          </Card>

          {/* Consulted Sources */}
          <div className="space-y-4 pt-2">
            <div className="flex items-center gap-2">
              <Link2 size={20} className="text-primary" />
              <h5 className="font-bold text-lg text-foreground">Consulted Sources</h5>
            </div>
            <div className="grid gap-3">
              {data.consulted_sources?.map((source, idx) => (
                <a
                  key={idx}
                  href={source.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group block p-4 rounded-xl bg-card/50 border border-border/50 hover:border-primary/50 hover:bg-primary/5 transition-all duration-300 transform hover:scale-[1.02]"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                        <p className="font-medium text-foreground group-hover:text-primary transition-colors line-clamp-2 flex items-start gap-2">
                        <ExternalLink size={16} className="flex-shrink-0 mt-0.5" />
                        {source.title}
                      </p>
                      <div className="mt-2 space-y-1">
                        <p className="text-xs font-semibold text-primary/80">Source: {source.source_type}</p>
                        <p className="text-sm text-foreground/70 mt-2 leading-relaxed">{source.summary}</p>
                        <p className="text-xs text-foreground/50 truncate mt-2">{source.url}</p>
                      </div>
                    </div>
                  </div>
                </a>
              ))}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-border/30">
            <Button onClick={handleReset} variant="outline" className="sm:flex-1">
              Verify Another Claim
            </Button>
            <Button variant="outline" className="sm:flex-1 bg-transparent">
              Report an Error
            </Button>
            <Button className="sm:flex-1 bg-primary hover:bg-primary/90">Share Report</Button>
          </div>
        </div>
      )}
    </div>
  )
}
