"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"

export default function Hero() {
  return (
    <section className="relative min-h-[calc(100vh-64px)] flex items-center justify-center px-4 py-20">
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-1/4 right-1/4 w-96 h-96 bg-accent/10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-1/4 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-3xl"></div>
      </div>

      <div className="relative z-10 max-w-3xl mx-auto text-center">
        <div className="mb-6 inline-block">
          <span className="text-sm font-medium text-accent">Powered by AI</span>
        </div>

        <h1 className="text-5xl md:text-7xl font-bold mb-6 leading-tight text-balance">Talk to AI. Instantly.</h1>

        <p className="text-lg md:text-xl text-muted-foreground mb-8 max-w-2xl mx-auto text-balance">
          Experience the power of conversational AI. Get instant answers, creative ideas, and personalized assistance.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link href="/chat">
            <Button size="lg" className="bg-accent hover:bg-accent/90 text-accent-foreground px-8">
              Start Chatting
            </Button>
          </Link>
          <Button size="lg" variant="outline" className="border-border hover:bg-card px-8 bg-transparent">
            Learn More
          </Button>
        </div>
      </div>
    </section>
  )
}
