"use client"

import type React from "react"
import { MessageCircle, Loader2 } from "lucide-react"
import AnalysisCard from "./analysis-card"

interface Message {
  id: string
  role: "user" | "assistant"
  content: string
  timestamp: Date
  type?: "chat" | "analysis"
}

interface ChatMessagesProps {
  messages: Message[]
  isLoading: boolean
  messagesEndRef: React.RefObject<HTMLDivElement | null>
}

const parseAnalysis = (content: string) => {
  const getSection = (start: string, end: string) => {
    const startIndex = content.indexOf(start);
    if (startIndex === -1) return '';
    const endIndex = content.indexOf(end, startIndex);
    return content.slice(startIndex + start.length, endIndex === -1 ? undefined : endIndex).trim();
  };

  const conciseSummary = getSection('Concise Summary:', 'Expanded Analysis:');
  const expandedAnalysis = getSection('Expanded Analysis:', 'Impact Forecast:');
  const impactForecastStr = getSection('Impact Forecast:', 'Scenarios:');
  const scenariosStr = getSection('Scenarios:', 'Confidence:');
  const confidenceMatch = content.match(/Confidence:\s*([\d.]+)/);

  const impactForecast = impactForecastStr.split('\n- ').filter(Boolean).map(item => {
    const typeMatch = item.match(/\*\*([^*]+)\*\*:\s*(.*)/);
    const detailsMatch = item.match(/(\w+)\s*Term\s*\(([\d.]+)\)/);
    return {
      type: typeMatch ? typeMatch[1] : 'N/A',
      horizon: detailsMatch ? `${detailsMatch[1]} Term` : 'N/A',
      magnitude: 'N/A', // Not available in the new format
      probability: detailsMatch ? parseFloat(detailsMatch[2]) : 0,
      rationale: typeMatch ? typeMatch[2] : 'N/A',
    };
  });

  const scenarios = scenariosStr.split('\n- ').filter(Boolean).map(item => {
    const descriptionMatch = item.match(/\*\*Scenario \d+:\s*(.*)/);
    return {
      description: descriptionMatch ? descriptionMatch[1] : item,
      probability: 0, // Not available in the new format
    };
  });

  return {
    conciseSummary,
    expandedAnalysis,
    impactForecast,
    scenarios,
    confidence: confidenceMatch ? parseFloat(confidenceMatch[1]) : 0,
  };
};

export default function ChatMessages({ messages, isLoading, messagesEndRef }: ChatMessagesProps) {
  return (
    <div className="flex-1 overflow-y-auto scrollbar-hide">
      <div className="max-w-4xl mx-auto px-4 py-8 space-y-6">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full py-20 text-center">
            <div className="mb-4 p-4 bg-accent/10 rounded-full">
              <MessageCircle className="w-8 h-8 text-accent" />
            </div>
            <h2 className="text-2xl font-semibold mb-2">Start a conversation</h2>
            <p className="text-muted-foreground">Ask me anything and I'll help you out.</p>
          </div>
        ) : (
          <>
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.role === "user" ? "justify-end" : "justify-start"} animate-in fade-in slide-in-from-bottom-2 duration-300`}
              >
                {message.type === "analysis" ? (
                  <AnalysisCard analysis={parseAnalysis(message.content)} />
                ) : (
                  <div
                    className={`max-w-2xl px-4 py-3 rounded-2xl ${
                      message.role === "user"
                        ? "bg-accent text-accent-foreground rounded-br-none"
                        : "bg-card text-foreground rounded-bl-none border border-border"
                    }`}
                  >
                    <p className="text-sm md:text-base leading-relaxed">{message.content}</p>
                  </div>
                )}
              </div>
            ))}

            {isLoading && (
              <div className="flex justify-start animate-in fade-in slide-in-from-bottom-2 duration-300">
                <div className="bg-card text-foreground rounded-2xl rounded-bl-none border border-border px-4 py-3 flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin text-accent" />
                  <span className="text-sm text-muted-foreground">Thinking...</span>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </>
        )}
      </div>
    </div>
  )
}
