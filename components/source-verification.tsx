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
}

interface SourceVerificationProps {
  contentType: "article" | "video"
  contentTitle: string
}

export default function SourceVerification({ contentType, contentTitle }: SourceVerificationProps) {
  const [isChecking, setIsChecking] = useState(false)
  const [showDetailedResults, setShowDetailedResults] = useState(false)

  const verificationData: VerificationData = {
    verdict: "FALSE",
    confidence: 94,
    confidenceLevel: "High Confidence",
    justification:
      "La prétention que le jus de citron soigne complètement la COVID-19 est fausse. Les organismes de santé réputés et les sites de vérification des faits ont explicitement réfuté cette affirmation.",
    keyEvidence: [
      "Le jus de citron ne guérit pas la COVID-19 selon les experts médicaux",
      "Plusieurs organisations de santé réputées ont démenti cette affirmation",
      "Aucune preuve scientifique ne soutient cette prétention",
      "L'Organisation mondiale de la santé (OMS) le confirme",
    ],
    mostConvincingSource:
      "Les organismes de santé publique et les sites de vérification des faits sont convaincants car ce sont des sources réputées et vérifiées.",
    consulted_sources: [
      {
        title: "Le jus de citron et le thé ne guérissent pas la COVID-19",
        url: "https://www.factcheck.org/2020/04/",
        source_type: "FactCheck.org",
        summary:
          "FactCheck.org a analysé et réfuté plusieurs affirmations fausses concernant les remèdes miracles contre la COVID-19, y compris le jus de citron et le thé. Les experts médicaux consultés confirment qu'aucune de ces affirmations n'est scientifiquement valide.",
      },
      {
        title: "Recommandations de l'OMS sur les traitements COVID-19",
        url: "https://www.who.int/emergencies/diseases/novel-coronavirus-2019",
        source_type: "Organisation mondiale de la santé",
        summary:
          "L'OMS fournit des recommandations officielles basées sur des preuves scientifiques. Selon l'organisation, il n'existe pas de remède naturel simple pour la COVID-19 et seuls les traitements médicaux approuvés sont recommandés.",
      },
      {
        title: "Vérification des fausses affirmations médicales",
        url: "https://www.healthline.com/",
        source_type: "Healthline Medical Review",
        summary:
          "Healthline, une autorité médicale vérifiée, a publié de nombreux articles détaillant les fausses affirmations médicales circulant sur les réseaux sociaux et expliquant pourquoi elles sont inexactes selon les données scientifiques actuelles.",
      },
      {
        title: "Centre de contrôle et de prévention des maladies",
        url: "https://www.cdc.gov/",
        source_type: "CDC",
        summary:
          "Le CDC, agence fédérale américaine, met à jour régulièrement ses recommandations basées sur les dernières recherches scientifiques concernant la COVID-19 et confirme l'inefficacité des remèdes non médicaux.",
      },
    ],
    summary:
      "Cette vérification des faits s'adresse à une fausse affirmation circulant sur les réseaux sociaux. L'affirmation prétend faussement qu'un mélange peut guérir la COVID-19, ce qui a été réfuté de manière approfondie par plusieurs sources officielles.",
  }

  const handleVerify = () => {
    setIsChecking(true)
    setTimeout(() => {
      setShowDetailedResults(true)
      setIsChecking(false)
    }, 2000)
  }

  const getVerdictColor = () => {
    switch (verificationData.verdict) {
      case "TRUE":
        return "bg-gradient-to-r from-emerald-500 to-green-600"
      case "FALSE":
        return "bg-gradient-to-r from-red-500 to-rose-600"
      default:
        return "bg-gradient-to-r from-amber-500 to-orange-600"
    }
  }

  const getVerdictBgColor = () => {
    switch (verificationData.verdict) {
      case "TRUE":
        return "bg-emerald-50/40 dark:bg-emerald-950/20 border-emerald-200/50 dark:border-emerald-800/40"
      case "FALSE":
        return "bg-red-50/40 dark:bg-red-950/20 border-red-200/50 dark:border-red-800/40"
      default:
        return "bg-amber-50/40 dark:bg-amber-950/20 border-amber-200/50 dark:border-amber-800/40"
    }
  }

  const getVerdictIcon = () => {
    if (verificationData.verdict === "TRUE") {
      return <CheckCircle2 size={40} className="text-emerald-600 dark:text-emerald-400" />
    }
    return <AlertTriangle size={40} className="text-red-600 dark:text-red-400" />
  }

  const getVerdictText = () => {
    switch (verificationData.verdict) {
      case "TRUE":
        return "Vérifié Vrai"
      case "FALSE":
        return "Faux"
      default:
        return "Information Mixte"
    }
  }

  const getConfidenceBadgeColor = () => {
    if (verificationData.confidence >= 80)
      return "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300"
    if (verificationData.confidence >= 50) return "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300"
    return "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300"
  }

  return (
    <div className="space-y-6 w-full">
      {/* Header Section */}
      <div className="space-y-2 mb-6">
        <div className="flex items-center gap-2">
          <Shield size={24} className="text-primary" />
          <h3 className="text-2xl font-bold text-foreground">Vérification de la Source</h3>
        </div>
        <p className="text-foreground/70 text-sm">
          Analyse approfondie de la fiabilité et de l'authenticité du contenu
        </p>
      </div>

      {!showDetailedResults ? (
        <Card className="p-8 border-border/50 bg-gradient-to-br from-card to-card/50">
          <div className="space-y-4">
            <p className="text-foreground/80 leading-relaxed">
              Analysez la fiabilité de cette {contentType === "article" ? "source d'article" : "vidéo"} avec notre
              système intelligent. Nous vérifierons les faits, authentifierons les sources et détecterons les biais
              potentiels.
            </p>
            <Button
              onClick={handleVerify}
              disabled={isChecking}
              className={`w-full sm:w-auto py-6 px-8 rounded-lg font-semibold transition-all ${
                isChecking ? "bg-primary/50" : "bg-primary hover:bg-primary/90 shadow-lg hover:shadow-xl"
              }`}
            >
              {isChecking ? (
                <>
                  <Loader2 size={18} className="mr-2 animate-spin" />
                  Vérification en cours...
                </>
              ) : (
                <>
                  <Shield size={18} className="mr-2" />
                  Vérifier la Source
                </>
              )}
            </Button>
          </div>
        </Card>
      ) : (
        <div className="space-y-6 animate-fade-in">
          {/* Verdict Section - Hero */}
          <div className={`p-8 rounded-2xl border-2 ${getVerdictBgColor()} backdrop-blur-sm`}>
            <div className="flex items-start justify-between gap-6">
              <div className="flex items-start gap-4">
                {getVerdictIcon()}
                <div className="space-y-2">
                  <h4 className="font-bold text-3xl text-foreground">{getVerdictText()}</h4>
                  <span
                    className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${getConfidenceBadgeColor()}`}
                  >
                    {verificationData.confidenceLevel}
                  </span>
                </div>
              </div>
              <div className="text-right">
                <div className="text-4xl font-black bg-gradient-to-br from-primary to-primary/60 bg-clip-text text-transparent">
                  {verificationData.confidence}%
                </div>
                <p className="text-xs text-foreground/60 mt-1">Score de fiabilité</p>
              </div>
            </div>
          </div>

          {/* Statistics Bar */}
          <div className="grid grid-cols-3 gap-3">
            <Card className="p-4 text-center bg-card/50 border-border/30">
              <TrendingUp size={20} className="mx-auto text-primary mb-2" />
              <p className="text-2xl font-bold text-foreground">{verificationData.consulted_sources.length}</p>
              <p className="text-xs text-foreground/60 mt-1">Sources</p>
            </Card>
            <Card className="p-4 text-center bg-card/50 border-border/30">
              <FileText size={20} className="mx-auto text-primary mb-2" />
              <p className="text-2xl font-bold text-foreground">{verificationData.keyEvidence.length}</p>
              <p className="text-xs text-foreground/60 mt-1">Preuves</p>
            </Card>
            <Card className="p-4 text-center bg-card/50 border-border/30">
              <Clock size={20} className="mx-auto text-primary mb-2" />
              <p className="text-2xl font-bold text-foreground">2m</p>
              <p className="text-xs text-foreground/60 mt-1">Analyse</p>
            </Card>
          </div>

          {/* Justification */}
          <Card className="p-6 bg-gradient-to-br from-card/50 to-card/30 border-border/30">
            <div className="flex items-start gap-3 mb-3">
              <BarChart3 size={20} className="text-primary mt-1 flex-shrink-0" />
              <h5 className="font-bold text-lg text-foreground">Analyse Détaillée</h5>
            </div>
            <p className="text-foreground/80 leading-relaxed text-sm">{verificationData.justification}</p>
          </Card>

          {/* Key Evidence */}
          <Card className="p-6 bg-gradient-to-br from-card/50 to-card/30 border-border/30">
            <div className="flex items-start gap-3 mb-4">
              <CheckCircle2 size={20} className="text-primary mt-0.5 flex-shrink-0" />
              <h5 className="font-bold text-lg text-foreground">Preuves Clés</h5>
            </div>
            <ul className="space-y-3">
              {verificationData.keyEvidence.map((evidence, idx) => (
                <li key={idx} className="flex gap-3 text-sm text-foreground/80 p-3 rounded-lg bg-background/50">
                  <span className="text-primary font-bold flex-shrink-0 mt-0.5">✓</span>
                  <span>{evidence}</span>
                </li>
              ))}
            </ul>
          </Card>

          {/* Most Convincing Source */}
          <Card className="p-6 bg-gradient-to-r from-primary/10 to-primary/5 border border-primary/20">
            <div className="flex items-start gap-3 mb-3">
              <Shield size={20} className="text-primary mt-1 flex-shrink-0" />
              <div>
                <h5 className="font-bold text-lg text-foreground">Source Primaire</h5>
                <p className="text-foreground/70 text-sm mt-2">{verificationData.mostConvincingSource}</p>
              </div>
            </div>
          </Card>

          {/* Consulted Sources */}
          <div className="space-y-4 pt-2">
            <div className="flex items-center gap-2">
              <Link2 size={20} className="text-primary" />
              <h5 className="font-bold text-lg text-foreground">Sources Consultées</h5>
            </div>
            <div className="grid gap-3">
              {verificationData.consulted_sources.map((source, idx) => (
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
            <Button onClick={() => setShowDetailedResults(false)} variant="outline" className="sm:flex-1">
              Vérifier à Nouveau
            </Button>
            <Button variant="outline" className="sm:flex-1 bg-transparent">
              Signaler une Erreur
            </Button>
            <Button className="sm:flex-1 bg-primary hover:bg-primary/90">Partager le Rapport</Button>
          </div>
        </div>
      )}
    </div>
  )
}
