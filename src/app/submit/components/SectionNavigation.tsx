"use client"

import { Button } from "@/components/ui/button"
import type { Section } from "./types"

interface SectionNavigationProps {
  sections: Section[]
  currentSection: number
  setCurrentSection: (index: number) => void
}

export function SectionNavigation({ sections, currentSection, setCurrentSection }: SectionNavigationProps) {
  if (sections.length === 0) return null

  return (
    <div className="mb-6">
      <div className="flex items-center space-x-2">
        {sections.map((section, index) => (
          <Button
            key={section.id}
            variant={currentSection === index ? "default" : "outline"}
            size="sm"
            onClick={() => setCurrentSection(index)}
          >
            {index + 1}. {section.title}
          </Button>
        ))}
      </div>
    </div>
  )
}
