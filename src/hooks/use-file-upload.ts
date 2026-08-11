import { useState, useCallback } from 'react'

export function useFileUpload() {
  const [files, setFiles] = useState<File[]>([])
  const [uploading, setUploading] = useState(false)
  const [uploadedUrls, setUploadedUrls] = useState<string[]>([])

  const addFiles = useCallback((newFiles: FileList | File[]) => {
    setFiles(prev => [...prev, ...Array.from(newFiles)])
  }, [])

  const removeFile = useCallback((index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index))
  }, [])

  const clearFiles = useCallback(() => {
    setFiles([])
  }, [])

  const upload = useCallback(async () => {
    if (files.length === 0) return { urls: [] as string[], files: [] as never[] }
    setUploading(true)
    try {
      const formData = new FormData()
      files.forEach(f => formData.append('files', f))
      const res = await fetch('/api/upload', { method: 'POST', body: formData })
      const data = await res.json()
      if (!res.ok) {
        throw new Error(data.error || `Upload failed (${res.status})`)
      }
      if (data.urls) setUploadedUrls(prev => [...prev, ...data.urls])
      return data
    } catch (error: any) {
      throw error
    } finally {
      setUploading(false)
    }
  }, [files])

  return { files, addFiles, removeFile, clearFiles, uploading, uploadedUrls, upload }
}
