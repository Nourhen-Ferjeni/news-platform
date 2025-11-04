"use client"

export default function Footer() {
  return (
    <footer className="border-t border-border bg-background/50 py-12 px-4">
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-col md:flex-row justify-between items-center gap-8">
          <div>
            <p className="text-sm text-muted-foreground">© 2025 Talk to AI. All rights reserved.</p>
          </div>

          <div className="flex gap-6">
            <a href="#" className="text-sm text-muted-foreground hover:text-accent transition-colors">
              Twitter
            </a>
            <a href="#" className="text-sm text-muted-foreground hover:text-accent transition-colors">
              GitHub
            </a>
            <a href="#" className="text-sm text-muted-foreground hover:text-accent transition-colors">
              Discord
            </a>
          </div>
        </div>
      </div>
    </footer>
  )
}
