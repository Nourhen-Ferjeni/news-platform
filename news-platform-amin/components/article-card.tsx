"use client"

import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"
import { useState } from "react"

interface ArticleCardProps {
  id: string
  title: string
  summary: string
  source: string
  date: string
  category: string
  image?: string
}

export function ArticleCard({ id, title, summary, source, date, category, image }: ArticleCardProps) {
  const [isHovered, setIsHovered] = useState(false)

  return (
    <Link href={`/article/${id}`}>
      <Card
        className="overflow-hidden hover:shadow-xl transition-all duration-300 cursor-pointer hover:-translate-y-2 h-full flex flex-col border border-border hover:border-accent/50 group"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        {image && (
          <div className="h-40 bg-gradient-to-br from-secondary to-primary overflow-hidden relative">
            <img
              src={image || "/placeholder.svg"}
              alt={title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            />
            <div
              className={`absolute inset-0 bg-gradient-to-t from-black/40 to-transparent transition-opacity duration-300 ${
                isHovered ? "opacity-100" : "opacity-0"
              }`}
            />
          </div>
        )}
        <div className="p-6 flex-1 flex flex-col">
          <div className="flex gap-2 mb-3">
            <Badge variant="secondary" className="text-xs font-medium bg-secondary/80 text-foreground">
              {category}
            </Badge>
            <Badge variant="outline" className="text-xs font-medium border-border text-muted-foreground">
              {source}
            </Badge>
          </div>

          <h3 className="font-semibold text-lg mb-3 text-foreground line-clamp-3 flex-1 group-hover:text-primary transition-colors duration-300">
            {title}
          </h3>

          <p className="text-sm text-muted-foreground line-clamp-2 mb-4">{summary}</p>

          <p className="text-xs text-muted-foreground font-medium">{date}</p>
        </div>
      </Card>
    </Link>
  )
}
