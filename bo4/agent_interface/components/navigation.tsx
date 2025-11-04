"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"

export default function Navigation() {
  return (
    <nav className="sticky top-0 z-50 border-b border-border bg-background/80 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <Link href="/" className="flex items-center gap-2 font-bold text-xl">
            <div className="w-8 h-8 bg-accent rounded-lg flex items-center justify-center text-accent-foreground font-bold">
              AI
            </div>
            <span>Talk to AI</span>
          </Link>

          <div className="hidden md:flex items-center gap-8">
            <Link href="/" className="text-sm hover:text-accent transition-colors">
              Home
            </Link>
            <Link href="#" className="text-sm hover:text-accent transition-colors">
              Docs
            </Link>
            <Link href="#" className="text-sm hover:text-accent transition-colors">
              Pricing
            </Link>
          </div>

          <div className="flex items-center gap-4">
            <Button variant="ghost" size="sm">
              Login
            </Button>
            <Link href="/chat">
              <Button size="sm" className="bg-accent hover:bg-accent/90 text-accent-foreground">
                Start Chatting
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </nav>
  )
}
