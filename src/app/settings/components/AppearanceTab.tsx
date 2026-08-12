"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Palette, RefreshCw, Save } from "lucide-react"

interface AppearanceSettings {
  theme: string
  fontSize: string
  sidebarCollapsed: boolean
  highContrast: boolean
}

interface AppearanceTabProps {
  appearanceSettings: AppearanceSettings
  isLoading: boolean
  fontSizeMap: Record<string, string>
  setAppearanceSettings: React.Dispatch<React.SetStateAction<AppearanceSettings>>
  onSave: () => void
}

export function AppearanceTab({ appearanceSettings, isLoading, fontSizeMap, setAppearanceSettings, onSave }: AppearanceTabProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <Palette className="mr-2 h-5 w-5" />
          Appearance Settings
        </CardTitle>
        <CardDescription>
          Customize the look and feel of your workspace
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Theme</h3>
          <div className="grid gap-4 md:grid-cols-3">
            <Button
              variant={appearanceSettings.theme === "light" ? "default" : "outline"}
              onClick={() => {
                setAppearanceSettings(prev => {
                  const next = { ...prev, theme: "light" }
                  localStorage.setItem('appearance', JSON.stringify(next))
                  return next
                })
                document.documentElement.classList.remove('dark')
              }}
              className="h-20 flex-col"
            >
              <div className="w-full h-8 bg-card border rounded mb-2"></div>
              Light
            </Button>
            <Button
              variant={appearanceSettings.theme === "dark" ? "default" : "outline"}
              onClick={() => {
                setAppearanceSettings(prev => {
                  const next = { ...prev, theme: "dark" }
                  localStorage.setItem('appearance', JSON.stringify(next))
                  return next
                })
                document.documentElement.classList.toggle('dark', true)
              }}
              className="h-20 flex-col"
            >
              <div className="w-full h-8 bg-foreground rounded mb-2"></div>
              Dark
            </Button>
            <Button
              variant={appearanceSettings.theme === "system" ? "default" : "outline"}
              onClick={() => {
                setAppearanceSettings(prev => {
                  const next = { ...prev, theme: "system" }
                  localStorage.setItem('appearance', JSON.stringify(next))
                  return next
                })
                const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
                document.documentElement.classList.toggle('dark', prefersDark)
              }}
              className="h-20 flex-col"
            >
              <div className="w-full h-8 bg-gradient-to-r from-white to-gray-900 rounded mb-2"></div>
              System
            </Button>
          </div>
        </div>

        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Text Size</h3>
          <div className="flex items-center space-x-4">
            {[
              { value: "small", label: "Small", preview: "Aa" },
              { value: "medium", label: "Medium", preview: "Aa" },
              { value: "large", label: "Large", preview: "Aa" }
            ].map((size) => (
              <Button
                key={size.value}
                variant={appearanceSettings.fontSize === size.value ? "default" : "outline"}
                onClick={() => {
                  setAppearanceSettings(prev => {
                    const next = { ...prev, fontSize: size.value }
                    localStorage.setItem('appearance', JSON.stringify(next))
                    return next
                  })
                  document.documentElement.style.fontSize = fontSizeMap[size.value]
                }}
                className="flex flex-col items-center space-y-1"
              >
                <span className={`text-${size.value === "small" ? "sm" : size.value === "large" ? "lg" : "base"}`}>
                  {size.preview}
                </span>
                {size.label}
              </Button>
            ))}
          </div>
        </div>

        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Layout Options</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Collapsed Sidebar</p>
                <p className="text-sm text-muted-foreground">Collapse sidebar by default</p>
              </div>
              <Checkbox
                checked={appearanceSettings.sidebarCollapsed}
                onCheckedChange={(checked) => 
                  setAppearanceSettings(prev => ({ ...prev, sidebarCollapsed: checked as boolean }))
                }
              />
            </div>
            
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">High Contrast</p>
                <p className="text-sm text-muted-foreground">Increase contrast for better visibility</p>
              </div>
              <Checkbox
                checked={appearanceSettings.highContrast}
                onCheckedChange={(checked) => 
                  setAppearanceSettings(prev => ({ ...prev, highContrast: checked as boolean }))
                }
              />
            </div>
          </div>
        </div>

        <div className="flex justify-end">
          <Button onClick={onSave} disabled={isLoading}>
            {isLoading ? <RefreshCw className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
            Save Changes
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
