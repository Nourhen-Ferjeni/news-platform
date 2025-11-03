"use client"

import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"
import { useState } from "react"
import { Play } from "lucide-react"

interface VideoCardProps {
  id: string
  title: string
  source: string
  date: string
  duration: string
  thumbnail?: string
}

export function VideoCard({ id, title, source, date, duration, thumbnail }: VideoCardProps) {
  const [isHovered, setIsHovered] = useState(false)

  return (
    <Link href={`/video/${id}`}>
      <Card
        className="overflow-hidden hover:shadow-xl transition-all duration-300 cursor-pointer hover:-translate-y-2 border border-border hover:border-accent/50 group"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <div className="relative h-40 bg-gradient-to-br from-secondary to-primary overflow-hidden">
          {thumbnail && (
            <img
              src={thumbnail || "/placeholder.svg"}
              alt={title}
              className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
            />
          )}
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors duration-300 flex items-center justify-center">
            <div
              className={`transform transition-all duration-300 ${
                isHovered ? "scale-110 opacity-100" : "scale-90 opacity-50"
              }`}
            >
              <div className="bg-primary/90 backdrop-blur rounded-full p-3 flex items-center justify-center">
                <Play size={24} className="text-white fill-white" />
              </div>
            </div>
          </div>
          <div className="absolute top-3 right-3 bg-black/70 backdrop-blur text-white text-xs px-3 py-1 rounded-full font-medium">
            {duration}
          </div>
        </div>

        <div className="p-4">
          <div className="flex gap-2 mb-3">
            <Badge variant="secondary" className="text-xs font-medium bg-secondary/80 text-foreground">
              Vidéo
            </Badge>
            <Badge variant="outline" className="text-xs font-medium border-border text-muted-foreground">
              {source}
            </Badge>
          </div>

          <h3 className="font-semibold text-base text-foreground line-clamp-2 mb-3 group-hover:text-primary transition-colors duration-300">
            {title}
          </h3>

          <p className="text-xs text-muted-foreground font-medium">{date}</p>
        </div>
      </Card>
    </Link>
  )
}
