"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { Progress } from "@/components/ui/progress"

interface Analysis {
  conciseSummary: string
  expandedAnalysis: string
  impactForecast: {
    type: string
    horizon: string
    magnitude: string
    probability: number
    rationale: string
  }[]
  scenarios: {
    description: string
    probability: number
  }[]
  confidence: number
}

interface AnalysisCardProps {
  analysis: Analysis
}

export default function AnalysisCard({ analysis }: AnalysisCardProps) {
  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>Analysis Report</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <h3 className="font-semibold">Concise Summary</h3>
          <p className="text-muted-foreground">{analysis.conciseSummary}</p>
        </div>

        <Accordion type="single" collapsible>
          <AccordionItem value="item-1">
            <AccordionTrigger>Expanded Analysis</AccordionTrigger>
            <AccordionContent>
              {analysis.expandedAnalysis}
            </AccordionContent>
          </AccordionItem>
        </Accordion>

        <Tabs defaultValue="forecast">
          <TabsList>
            <TabsTrigger value="forecast">Impact Forecast</TabsTrigger>
            <TabsTrigger value="scenarios">Scenarios</TabsTrigger>
          </TabsList>
          <TabsContent value="forecast">
            <div className="space-y-2">
              {analysis.impactForecast.map((item, index) => (
                <div key={index} className="p-2 border rounded">
                  <p><strong>Type:</strong> {item.type}</p>
                  <p><strong>Horizon:</strong> {item.horizon}</p>
                  <p><strong>Magnitude:</strong> {item.magnitude}</p>
                  <p><strong>Probability:</strong> {item.probability}</p>
                  <p><strong>Rationale:</strong> {item.rationale}</p>
                </div>
              ))}
            </div>
          </TabsContent>
          <TabsContent value="scenarios">
            <div className="space-y-2">
              {analysis.scenarios.map((item, index) => (
                <div key={index} className="p-2 border rounded">
                  <p><strong>Description:</strong> {item.description}</p>
                  <p><strong>Probability:</strong> {item.probability}</p>
                </div>
              ))}
            </div>
          </TabsContent>
        </Tabs>

        <div>
          <h3 className="font-semibold">Confidence</h3>
          <Progress value={analysis.confidence * 100} />
        </div>
      </CardContent>
    </Card>
  )
}
