"use client"

import { useEffect, useState, useCallback } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { FileText, Zap, Users, Layers } from "lucide-react"

export interface TemplateData {
  id: string
  name: string
  description: string | null
  category: string | null
  isPublic: boolean
  sections: string        // JSON
  scoringCriteria: string // JSON
  terms: string | null
  usageCount: number
  _count?: { rfps: number }
  createdByUser?: { name: string | null; email: string }
}

interface TemplateSelectorProps {
  onSelect: (_template: TemplateData | null) => void
  selectedId?: string | null
}

function parseSectionCount(sectionsJson: string): number {
  try {
    const sections = JSON.parse(sectionsJson)
    return Array.isArray(sections) ? sections.length : 0
  } catch {
    return 0
  }
}

function getCategoryColor(category: string | null): string {
  switch (category) {
    case "IT Services":
      return "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300"
    case "Professional Services":
      return "bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300"
    case "Construction":
      return "bg-orange-100 text-orange-800 dark:bg-orange-900/40 dark:text-orange-300"
    case "Software Development":
      return "bg-violet-100 text-violet-800 dark:bg-violet-900/40 dark:text-violet-300"
    case "Marketing Services":
      return "bg-pink-100 text-pink-800 dark:bg-pink-900/40 dark:text-pink-300"
    case "General":
      return "bg-slate-100 text-slate-800 dark:bg-slate-700/40 dark:text-slate-300"
    default:
      return "bg-slate-100 text-slate-800 dark:bg-slate-700/40 dark:text-slate-300"
  }
}

function getCategoryIcon(category: string | null) {
  switch (category) {
    case "IT Services":
      return <Zap className="h-5 w-5" />
    case "Professional Services":
      return <Users className="h-5 w-5" />
    case "Construction":
      return <Layers className="h-5 w-5" />
    default:
      return <FileText className="h-5 w-5" />
  }
}

export function TemplateSelector({ onSelect, selectedId }: TemplateSelectorProps) {
  const [templates, setTemplates] = useState<TemplateData[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchTemplates = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch("/api/templates")
      if (!res.ok) throw new Error("Failed to load templates")
      const data = await res.json()
      setTemplates(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load templates")
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchTemplates()
  }, [fetchTemplates])

  if (loading) {
    return (
      <div className="space-y-4">
        <div>
          <h2 className="text-xl font-bold mb-1">Choose a Template</h2>
          <p className="text-sm text-muted-foreground">
            Start with a pre-built template to save time, or create from scratch.
          </p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader className="pb-3">
                <Skeleton className="h-5 w-2/3 mb-2" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-1/3 mt-2" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-4 w-1/2" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="space-y-4">
        <div>
          <h2 className="text-xl font-bold mb-1">Choose a Template</h2>
          <p className="text-sm text-muted-foreground">
            Start with a pre-built template to save time, or create from scratch.
          </p>
        </div>
        <div className="rounded-lg border border-destructive/50 bg-destructive/5 p-4 text-sm text-destructive">
          {error}
          <Button variant="outline" size="sm" className="ml-3" onClick={fetchTemplates}>
            Retry
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold mb-1">Choose a Template</h2>
        <p className="text-sm text-muted-foreground">
          Start with a pre-built template to save time, or create from scratch.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* Start from Scratch card */}
        <Card
          className={`cursor-pointer transition-all hover:shadow-md border-2 ${
            selectedId === null
              ? "border-primary shadow-md ring-1 ring-primary/20"
              : "border-border hover:border-primary/40"
          }`}
          onClick={() => onSelect(null)}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault()
              onSelect(null)
            }
          }}
          aria-label="Start from scratch"
          aria-pressed={selectedId === null}
        >
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="flex items-center justify-center h-9 w-9 rounded-lg bg-muted">
                  <FileText className="h-5 w-5 text-muted-foreground" />
                </div>
                <CardTitle className="text-base">Start from Scratch</CardTitle>
              </div>
            </div>
            <CardDescription className="mt-2">
              Create a fully custom RFP without any pre-built sections or scoring criteria.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4 text-xs text-muted-foreground">
              <span>Custom sections</span>
              <span>•</span>
              <span>Custom scoring</span>
            </div>
          </CardContent>
        </Card>

        {/* Template cards */}
        {templates.map((template) => {
          const sectionCount = parseSectionCount(template.sections)
          const isSelected = selectedId === template.id

          return (
            <Card
              key={template.id}
              className={`cursor-pointer transition-all hover:shadow-md border-2 ${
                isSelected
                  ? "border-primary shadow-md ring-1 ring-primary/20"
                  : "border-border hover:border-primary/40"
              }`}
              onClick={() => onSelect(template)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault()
                  onSelect(template)
                }
              }}
              aria-label={`Select ${template.name} template`}
              aria-pressed={isSelected}
            >
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="flex items-center justify-center h-9 w-9 rounded-lg bg-muted">
                      {getCategoryIcon(template.category)}
                    </div>
                    <CardTitle className="text-base">{template.name}</CardTitle>
                  </div>
                  {template.isPublic && (
                    <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                      Public
                    </Badge>
                  )}
                </div>
                <CardDescription className="mt-2 line-clamp-2">
                  {template.description}
                </CardDescription>
                {template.category && (
                  <div className="mt-2">
                    <Badge
                      variant="secondary"
                      className={`text-[11px] px-2 py-0.5 ${getCategoryColor(template.category)}`}
                    >
                      {template.category}
                    </Badge>
                  </div>
                )}
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-4 text-xs text-muted-foreground">
                  <span>{sectionCount} section{sectionCount !== 1 ? "s" : ""}</span>
                  <span>•</span>
                  <span>{template.usageCount} used</span>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {selectedId === null && (
        <div className="rounded-lg bg-muted/50 border p-3 text-sm text-muted-foreground text-center">
          Select a template above to pre-populate sections and scoring criteria, or click &quot;Start from Scratch&quot; to build your own.
        </div>
      )}
    </div>
  )
}
