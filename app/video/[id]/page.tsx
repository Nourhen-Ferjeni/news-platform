"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card } from "@/components/ui/card"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { ArrowLeft, Play } from "lucide-react"
import SourceVerification from "@/components/source-verification"

interface VideoDetailPageProps {
  params: {
    id: string
  }
}

export default function VideoDetailPage({ params }: VideoDetailPageProps) {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState<"description" | "transcription" | "analyse">("description")

  const video = {
    id: params.id,
    title: "Analyse exclusive des nouvelles politiques économiques",
    source: "News Channel",
    date: "Jun 5 2025",
    duration: "12:34",
    presenter: "Dr. Michel Dubois",
    description:
      "Une analyse approfondie des dernières mesures économiques et leurs implications pour le marché mondial.",
    transcription: `[00:00] Bonjour à tous, je suis Dr. Michel Dubois. Aujourd'hui, nous allons examiner les dernières politiques économiques...
[02:15] Les experts s'accordent à dire que ces mesures auront un impact significatif...
[05:30] Voyons les chiffres en détail. Le PIB a augmenté de 2.3% au dernier trimestre...
[08:45] Certains critiques soulèvent des préoccupations concernant l'inflation...
[12:10] En conclusion, nous pouvons nous attendre à des changements importants dans les prochains mois...`,
    summary: "Les nouvelles politiques économiques expliquées par un expert du secteur",
    deepAnalysis: `
      ANALYSE VIDÉO APPROFONDIE:
      
      1. Points Clés
      - Croissance économique de 2.3%
      - Nouvelles mesures fiscales
      - Impact sur les marchés mondiaux
      
      2. Implications
      - Risques inflationnistes
      - Opportunités d'investissement
      - Changements réglementaires
      
      3. Perspectives Futures
      - Tendances économiques probables
      - Secteurs à surveiller
      - Recommandations d'experts
    `,
    generatedImage: "/economic-policy-visualization.jpg",
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-background to-secondary/20">
      {/* Header */}
      <nav className="sticky top-0 z-40 flex items-center gap-4 px-6 py-4 border-b border-border bg-background/95 backdrop-blur">
        <button onClick={() => router.back()} className="hover:text-primary transition-colors">
          <ArrowLeft size={24} />
        </button>
        <Link href="/dashboard" className="text-2xl font-bold text-primary">
          <span className="text-2xl">📰</span> Press
        </Link>
      </nav>

      {/* Video Content */}
      <div className="max-w-4xl mx-auto px-6 py-12">
        <div className="fade-in-up">
          {/* Meta Info */}
          <div className="flex gap-2 mb-4">
            <Badge variant="secondary">Vidéo</Badge>
            <Badge variant="outline">{video.source}</Badge>
            <Badge variant="outline">{video.date}</Badge>
            <Badge variant="outline">{video.duration}</Badge>
          </div>

          {/* Title */}
          <h1 className="text-5xl font-bold mb-4 text-foreground text-balance">{video.title}</h1>

          {/* Presenter */}
          <p className="text-lg text-muted-foreground mb-8">Présenté par {video.presenter}</p>

          {/* Video Player */}
          <div className="w-full aspect-video rounded-lg overflow-hidden mb-8 bg-gradient-to-br from-secondary to-primary flex items-center justify-center group cursor-pointer">
            <img
              src="/video-thumbnail-play.jpg"
              alt={video.title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            />
            <div className="absolute inset-0 bg-black/30 group-hover:bg-black/50 transition-colors flex items-center justify-center">
              <Play size={64} className="text-white opacity-0 group-hover:opacity-100 transition-opacity fill-white" />
            </div>
          </div>

          {/* Tabs */}
          <div className="flex gap-4 mb-8 border-b border-border">
            {(["description", "transcription", "analyse"] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-4 py-2 font-medium transition-colors border-b-2 ${
                  activeTab === tab
                    ? "border-primary text-primary"
                    : "border-transparent text-muted-foreground hover:text-foreground"
                }`}
              >
                {tab === "description" ? "Description" : tab === "transcription" ? "Transcription" : "Analyse"}
              </button>
            ))}
          </div>

          {/* Tab Content */}
          <div className="mb-12">
            {activeTab === "description" && (
              <Card className="p-6 border-border">
                <h3 className="font-semibold text-lg mb-4 text-foreground">Description</h3>
                <p className="text-foreground mb-6">{video.description}</p>

                <h3 className="font-semibold text-lg mb-4 text-foreground">Résumé</h3>
                <p className="text-foreground mb-6">{video.summary}</p>

                <h3 className="font-semibold text-lg mb-4 text-foreground">Image Générée</h3>
                <div className="w-full h-72 rounded-lg overflow-hidden bg-gradient-to-br from-secondary to-primary">
                  <img
                    src={video.generatedImage || "/placeholder.svg"}
                    alt="Generated visualization"
                    className="w-full h-full object-cover"
                  />
                </div>
              </Card>
            )}

            {activeTab === "transcription" && (
              <Card className="p-6 border-border">
                <h3 className="font-semibold text-lg mb-4 text-foreground">Transcription Complète</h3>
                <div className="whitespace-pre-wrap text-foreground text-sm leading-relaxed font-mono bg-background/50 p-4 rounded border border-border/50">
                  {video.transcription}
                </div>
              </Card>
            )}

            {activeTab === "analyse" && (
              <Card className="p-6 border-accent bg-accent/10">
                <h3 className="font-semibold text-lg mb-4 text-foreground">Analyse Approfondie</h3>
                <div className="whitespace-pre-wrap text-foreground text-sm leading-relaxed font-mono">
                  {video.deepAnalysis}
                </div>
              </Card>
            )}
          </div>

          {/* Audio Extraction Section */}
          <Card className="p-6 mb-8 border-border">
            <h3 className="font-semibold text-lg mb-4 text-foreground">Audio Extrait</h3>
            <div className="bg-background/50 rounded-lg p-6 flex items-center justify-between">
              <div>
                <p className="font-medium text-foreground mb-1">Piste Audio Principale</p>
                <p className="text-sm text-muted-foreground">Format MP3 - 12:34 minutes</p>
              </div>
              <Button className="bg-primary hover:bg-primary/90 text-primary-foreground">Télécharger l'Audio</Button>
            </div>
          </Card>

          {/* Source Verification */}
          <SourceVerification contentType="video" contentTitle={video.title} />
        </div>
      </div>
    </main>
  )
}
