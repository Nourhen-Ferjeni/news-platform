"use client"
import { Badge } from "@/components/ui/badge"
import { Card } from "@/components/ui/card"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { ArrowLeft, Clock, Eye, Share2, Bookmark, ThumbsUp, MessageCircle } from "lucide-react"
import SourceVerification from "@/components/source-verification"
import { useState } from "react"

interface ArticleDetailPageProps {
  params: {
    id: string
  }
}

export default function ArticleDetailPage({ params }: ArticleDetailPageProps) {
  const router = useRouter()
  const [savedArticle, setSavedArticle] = useState(false)
  const [likes, setLikes] = useState(1204)

  const article = {
    id: params.id,
    title: "Comment Larry Jackson a signé Mariah Carey à sa startup de 400 millions",
    source: "Forbes",
    date: "Jun 6 2025",
    category: "Affaires",
    author: "Jane Reporter",
    authorAvatar: "JR",
    readTime: "8",
    views: "24.5K",
    content: `
      Une histoire fascinante sur le monde des affaires modernes et les investissements stratégiques.
      
      Larry Jackson, entrepreneur visionnaire et cofondateur de talents remarquables, a annoncé aujourd'hui 
      la signature de Mariah Carey à sa nouvelle plateforme d'excellence créative, valorisée à 400 millions de dollars.
      
      Cette collaboration stratégique représente un tournant majeur dans l'industrie de l'entertainment. 
      Mariah Carey, artiste légendaire avec un catalogue impressionnant, rejoint une écosystème 
      innovant dédié à l'émergence des talents et à la création de contenu de classe mondiale.
      
      "C'est une opportunité exceptionnelle d'explorer de nouvelles frontières créatives," déclare 
      Jackson lors de la conférence de presse. "Mariah apporte sa vision unique et son expérience 
      inestimable à notre mission."
      
      La plateforme, lancée il y a moins d'un an, a déjà attiré plusieurs investisseurs majeurs 
      et continue à redéfinir les standards de l'industrie créative.
      
      Les analystes de marché considèrent cette fusion comme un signal fort de confiance dans 
      le modèle économique innovant proposé par Jackson et son équipe.
    `,
    summary: "Un partenariat majeur entre un entrepreneur visionnaire et une légende de la musique",
    deepAnalysis: `
      ANALYSE APPROFONDIE:
      
      1. Contexte Économique
      - Valorisation de 400M$ indique une confiance forte du marché
      - Stratégie d'acquisition de talents superstars
      - Modèle basé sur la plateforme créative
      
      2. Implications pour l'Industrie
      - Disruption potentielle des structures traditionnelles
      - Nouvelle dynamique de pouvoir entre créateurs et plateformes
      - Possibilités de monétisation alternatives
      
      3. Évaluation des Risques
      - Viabilité à long terme du modèle
      - Concurrence des plateformes établies
      - Dépendance à la personnalité des talents
      
      4. Perspectives d'Avenir
      - Expansion probable à d'autres domaines créatifs
      - Potentiel IPO pour la plateforme
      - Influence sur les contrats de talents
    `,
  }

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
              <div className="flex items-center gap-2 text-muted-foreground">
                <Clock size={18} />
                <span>{article.date}</span>
              </div>
              <div className="flex items-center gap-2 text-muted-foreground">
                <Clock size={18} />
                <span>{article.readTime} min</span>
              </div>
              <div className="flex items-center gap-2 text-muted-foreground">
                <Eye size={18} />
                <span>{article.views} vues</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Hero Image Section */}
      <div className="w-full h-96 md:h-[500px] fade-in">
        <img src="/article-featured-image.jpg" alt={article.title} className="w-full h-full object-cover" />
      </div>

      {/* Main Content Area */}
      <div className="bg-background">
        <div className="max-w-4xl mx-auto px-6 py-12">
          <Card className="p-8 mb-12 border border-primary/10 bg-gradient-to-br from-primary/5 to-accent/5 rounded-xl">
            <p className="text-xl text-foreground leading-relaxed font-medium italic">"{article.summary}"</p>
          </Card>

          {/* Main Article Content */}
          <div className="prose-invert max-w-none mb-12 fade-in-up" style={{ animationDelay: "0.1s" }}>
            {article.content.split("\n").map(
              (paragraph, idx) =>
                paragraph.trim() && (
                  <p key={idx} className="text-lg text-foreground leading-relaxed mb-8 text-justify">
                    {paragraph.trim()}
                  </p>
                ),
            )}
          </div>

          <Card
            className="p-0 mb-12 border-0 bg-transparent rounded-xl fade-in-up overflow-hidden"
            style={{ animationDelay: "0.2s" }}
          >
            {/* Premium Section Header */}
            <div className="px-8 pt-12 pb-8 border-b border-border/30">
              <h2 className="text-4xl font-bold text-foreground mb-2">Analyse Approfondie</h2>
              <p className="text-muted-foreground text-base">Décortication des enjeux et impacts stratégiques</p>
            </div>

            {/* Analysis Content - Vertical stacked layout */}
            <div className="divide-y divide-border/20">
              {/* Analysis Item 1 */}
              <div className="px-8 py-10 hover:bg-card/40 transition-colors duration-300 group cursor-pointer">
                <div className="flex items-start gap-6 mb-4">
                  <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-primary/20 to-primary/10 border border-primary/20 flex items-center justify-center text-primary font-bold text-lg flex-shrink-0 group-hover:from-primary/30 group-hover:to-primary/20 transition-colors">
                    01
                  </div>
                  <div className="flex-1">
                    <h3 className="text-2xl font-semibold text-foreground mb-3 group-hover:text-primary transition-colors">
                      Contexte Économique
                    </h3>
                    <p className="text-muted-foreground leading-relaxed mb-4">
                      Comprendre la dynamique financière et la position de marché de cette transaction.
                    </p>
                    <ul className="space-y-2.5">
                      <li className="flex items-start gap-3">
                        <span className="w-1.5 h-1.5 rounded-full bg-primary mt-2.5 flex-shrink-0"></span>
                        <span className="text-foreground text-sm leading-relaxed">
                          Valorisation de 400M$ indique une confiance forte du marché
                        </span>
                      </li>
                      <li className="flex items-start gap-3">
                        <span className="w-1.5 h-1.5 rounded-full bg-primary mt-2.5 flex-shrink-0"></span>
                        <span className="text-foreground text-sm leading-relaxed">
                          Stratégie d'acquisition de talents superstars
                        </span>
                      </li>
                      <li className="flex items-start gap-3">
                        <span className="w-1.5 h-1.5 rounded-full bg-primary mt-2.5 flex-shrink-0"></span>
                        <span className="text-foreground text-sm leading-relaxed">
                          Modèle basé sur la plateforme créative innovante
                        </span>
                      </li>
                    </ul>
                  </div>
                </div>
              </div>

              {/* Analysis Item 2 */}
              <div className="px-8 py-10 hover:bg-card/40 transition-colors duration-300 group cursor-pointer">
                <div className="flex items-start gap-6 mb-4">
                  <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-accent/20 to-accent/10 border border-accent/20 flex items-center justify-center text-accent font-bold text-lg flex-shrink-0 group-hover:from-accent/30 group-hover:to-accent/20 transition-colors">
                    02
                  </div>
                  <div className="flex-1">
                    <h3 className="text-2xl font-semibold text-foreground mb-3 group-hover:text-accent transition-colors">
                      Implications Stratégiques
                    </h3>
                    <p className="text-muted-foreground leading-relaxed mb-4">
                      Analyse des conséquences pour l'écosystème créatif et les structures traditionnelles.
                    </p>
                    <ul className="space-y-2.5">
                      <li className="flex items-start gap-3">
                        <span className="w-1.5 h-1.5 rounded-full bg-accent mt-2.5 flex-shrink-0"></span>
                        <span className="text-foreground text-sm leading-relaxed">
                          Disruption potentielle des structures traditionnelles
                        </span>
                      </li>
                      <li className="flex items-start gap-3">
                        <span className="w-1.5 h-1.5 rounded-full bg-accent mt-2.5 flex-shrink-0"></span>
                        <span className="text-foreground text-sm leading-relaxed">
                          Nouvelle dynamique de pouvoir entre créateurs et plateformes
                        </span>
                      </li>
                      <li className="flex items-start gap-3">
                        <span className="w-1.5 h-1.5 rounded-full bg-accent mt-2.5 flex-shrink-0"></span>
                        <span className="text-foreground text-sm leading-relaxed">
                          Possibilités de monétisation alternatives
                        </span>
                      </li>
                    </ul>
                  </div>
                </div>
              </div>

              {/* Analysis Item 3 */}
              <div className="px-8 py-10 hover:bg-card/40 transition-colors duration-300 group cursor-pointer">
                <div className="flex items-start gap-6 mb-4">
                  <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-destructive/20 to-destructive/10 border border-destructive/20 flex items-center justify-center text-destructive font-bold text-lg flex-shrink-0 group-hover:from-destructive/30 group-hover:to-destructive/20 transition-colors">
                    03
                  </div>
                  <div className="flex-1">
                    <h3 className="text-2xl font-semibold text-foreground mb-3 group-hover:text-destructive transition-colors">
                      Facteurs de Risque
                    </h3>
                    <p className="text-muted-foreground leading-relaxed mb-4">
                      Identification des défis et incertitudes associés à ce modèle.
                    </p>
                    <ul className="space-y-2.5">
                      <li className="flex items-start gap-3">
                        <span className="w-1.5 h-1.5 rounded-full bg-destructive mt-2.5 flex-shrink-0"></span>
                        <span className="text-foreground text-sm leading-relaxed">
                          Viabilité à long terme du modèle économique
                        </span>
                      </li>
                      <li className="flex items-start gap-3">
                        <span className="w-1.5 h-1.5 rounded-full bg-destructive mt-2.5 flex-shrink-0"></span>
                        <span className="text-foreground text-sm leading-relaxed">
                          Concurrence croissante des plateformes établies
                        </span>
                      </li>
                      <li className="flex items-start gap-3">
                        <span className="w-1.5 h-1.5 rounded-full bg-destructive mt-2.5 flex-shrink-0"></span>
                        <span className="text-foreground text-sm leading-relaxed">
                          Dépendance à la personnalité des talents clés
                        </span>
                      </li>
                    </ul>
                  </div>
                </div>
              </div>

              {/* Analysis Item 4 */}
              <div className="px-8 py-10 hover:bg-card/40 transition-colors duration-300 group cursor-pointer">
                <div className="flex items-start gap-6 mb-4">
                  <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-primary/20 to-primary/10 border border-primary/20 flex items-center justify-center text-primary font-bold text-lg flex-shrink-0 group-hover:from-primary/30 group-hover:to-primary/20 transition-colors">
                    04
                  </div>
                  <div className="flex-1">
                    <h3 className="text-2xl font-semibold text-foreground mb-3 group-hover:text-primary transition-colors">
                      Perspectives d'Avenir
                    </h3>
                    <p className="text-muted-foreground leading-relaxed mb-4">
                      Tendances attendues et évolution probable de cette stratégie.
                    </p>
                    <ul className="space-y-2.5">
                      <li className="flex items-start gap-3">
                        <span className="w-1.5 h-1.5 rounded-full bg-primary mt-2.5 flex-shrink-0"></span>
                        <span className="text-foreground text-sm leading-relaxed">
                          Expansion probable à d'autres domaines créatifs
                        </span>
                      </li>
                      <li className="flex items-start gap-3">
                        <span className="w-1.5 h-1.5 rounded-full bg-primary mt-2.5 flex-shrink-0"></span>
                        <span className="text-foreground text-sm leading-relaxed">
                          Potentiel IPO ou acquisition stratégique
                        </span>
                      </li>
                      <li className="flex items-start gap-3">
                        <span className="w-1.5 h-1.5 rounded-full bg-primary mt-2.5 flex-shrink-0"></span>
                        <span className="text-foreground text-sm leading-relaxed">
                          Influence majeure sur les contrats de talents
                        </span>
                      </li>
                    </ul>
                  </div>
                </div>
              </div>
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
    </main>
  )
}
