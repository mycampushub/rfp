import { useState } from 'react'
import { toast } from 'sonner'

export function useCsvExport() {
  const [exporting, setExporting] = useState(false)

  async function exportCsv(url: string, filename: string) {
    setExporting(true)
    try {
      const res = await fetch(url)
      if (!res.ok) throw new Error('Export failed')
      const blob = await res.blob()
      const link = document.createElement('a')
      link.href = URL.createObjectURL(blob)
      link.download = filename
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(link.href)
      toast.success('Export completed successfully')
    } catch (error) {
      toast.error('Failed to export data')
    } finally {
      setExporting(false)
    }
  }

  return { exportCsv, exporting }
}
