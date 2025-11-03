"use client"

import type React from "react"
import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card } from "@/components/ui/card"
import { X, Send } from "lucide-react"

interface Message {
  role: "user" | "assistant"
  content: string
}

interface ChatBotProps {
  onClose: () => void
}

export function ChatBot({ onClose }: ChatBotProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content:
        "Bonjour! Je suis votre assistant de recherche d'actualités. Vous pouvez me poser des questions sur les articles, vidéos, ou demander une analyse approfondie. Comment puis-je vous aider?",
    },
  ])
  const [input, setInput] = useState("")
  const [loading, setLoading] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages])

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!input.trim()) return

    const userMessage: Message = { role: "user", content: input }
    setMessages((prev) => [...prev, userMessage])
    setInput("")
    setLoading(true)

    setTimeout(() => {
      const assistantResponse: Message = {
        role: "assistant",
        content: generateResponse(input),
      }
      setMessages((prev) => [...prev, assistantResponse])
      setLoading(false)
    }, 800)
  }

  const generateResponse = (input: string) => {
    const lowerInput = input.toLowerCase()

    if (lowerInput.includes("article") || lowerInput.includes("news")) {
      return "Je peux vous aider à explorer nos articles. Souhaitez-vous connaître les articles récents, ou préférez-vous filtrer par catégorie (Technologie, Sports, Affaires, etc.)?"
    } else if (lowerInput.includes("vidéo") || lowerInput.includes("video")) {
      return "Nous avons plusieurs vidéos intéressantes disponibles. Voulez-vous voir les analyses d'experts, les documentaires, ou les débats?"
    } else if (lowerInput.includes("fake") || lowerInput.includes("faux")) {
      return 'Excellent question! Notre système de vérification analyse chaque source et identifie les indicateurs de fausses informations. Vous pouvez cliquer sur le bouton "Vérifier" sur chaque article pour voir l\'analyse détaillée.'
    } else if (lowerInput.includes("résumé") || lowerInput.includes("resume")) {
      return "Je peux générer des résumés automatiques de n'importe quel article. Lequel vous intéresse particulièrement?"
    } else {
      return "C'est une excellente question! Je peux vous aider à explorer les actualités, analyser des contenus, ou répondre à vos questions sur les articles et vidéos. Que souhaitez-vous savoir?"
    }
  }

  return (
    <Card className="h-96 bg-card border border-border shadow-2xl flex flex-col overflow-hidden scale-in">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-border bg-gradient-to-r from-primary/5 to-accent/5">
        <div>
          <h3 className="font-semibold text-foreground">Assistant IA</h3>
          <p className="text-xs text-muted-foreground">Analyseur d'actualités</p>
        </div>
        <button
          onClick={onClose}
          className="text-muted-foreground hover:text-foreground hover:bg-muted transition-all duration-300 rounded-full p-1"
          aria-label="Close chat"
        >
          <X size={20} />
        </button>
      </div>

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message, idx) => (
          <div key={idx} className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}>
            <div
              className={`max-w-xs px-4 py-3 rounded-lg text-sm ${
                message.role === "user"
                  ? "bg-primary text-primary-foreground rounded-br-none"
                  : "bg-secondary text-foreground rounded-bl-none"
              }`}
            >
              <p>{message.content}</p>
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex justify-start">
            <div className="bg-secondary text-foreground px-4 py-3 rounded-lg rounded-bl-none">
              <div className="flex gap-1">
                <div className="w-2 h-2 rounded-full bg-muted-foreground pulse-subtle"></div>
                <div
                  className="w-2 h-2 rounded-full bg-muted-foreground pulse-subtle"
                  style={{ animationDelay: "0.1s" }}
                ></div>
                <div
                  className="w-2 h-2 rounded-full bg-muted-foreground pulse-subtle"
                  style={{ animationDelay: "0.2s" }}
                ></div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Input */}
      <form
        onSubmit={handleSendMessage}
        className="border-t border-border p-3 flex gap-2 bg-gradient-to-r from-secondary/30 to-background"
      >
        <Input
          type="text"
          placeholder="Posez votre question..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          disabled={loading}
          className="text-sm bg-card border-border placeholder:text-muted-foreground"
        />
        <Button
          type="submit"
          size="sm"
          className="bg-primary hover:bg-primary/90 text-primary-foreground transition-all duration-300"
          disabled={loading || !input.trim()}
        >
          <Send size={16} />
        </Button>
      </form>
    </Card>
  )
}
