"use client"

import { Zap, Shield, MessageSquare } from "lucide-react"

const features = [
  {
    icon: Zap,
    title: "Fast Responses",
    description: "Get instant answers powered by cutting-edge AI technology.",
  },
  {
    icon: MessageSquare,
    title: "Personalized Answers",
    description: "Receive tailored responses based on your unique needs.",
  },
  {
    icon: Shield,
    title: "Secure Conversations",
    description: "Your privacy is protected with enterprise-grade security.",
  },
]

export default function Features() {
  return (
    <section className="py-20 px-4 bg-card/50">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold mb-4">Why Choose Us</h2>
          <p className="text-lg text-muted-foreground">Experience the best in conversational AI</p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {features.map((feature, index) => {
            const Icon = feature.icon
            return (
              <div
                key={index}
                className="p-8 rounded-2xl bg-background border border-border hover:border-accent transition-colors group"
              >
                <div className="mb-4 inline-block p-3 bg-accent/10 rounded-lg group-hover:bg-accent/20 transition-colors">
                  <Icon className="w-6 h-6 text-accent" />
                </div>
                <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
                <p className="text-muted-foreground">{feature.description}</p>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
