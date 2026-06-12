'use client'

import { useState, useRef } from 'react'

interface PhotoUploadProps {
  /** Called with base64 data URI after the user selects/drops a file */
  onChange: (dataUri: string, filename: string) => void
  /** Preview URL to display (uploaded file from Drive or local preview) */
  previewUrl?: string
  label?: string
  /** Show as compact avatar-picker (44x44) instead of full drop zone */
  compact?: boolean
}

/**
 * Reusable photo upload component.
 * Supports click-to-select and drag-and-drop.
 * Converts file to base64 data URI for sending to /api/upload.
 * Optimises preview by capping resolution via canvas resize.
 */
export function PhotoUpload({ onChange, previewUrl, label = 'Upload Photo', compact = false }: PhotoUploadProps) {
  const [dragging, setDragging] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  function handleFile(file: File) {
    if (!file.type.startsWith('image/')) return

    const reader = new FileReader()
    reader.onload = (e) => {
      const dataUri = e.target?.result as string
      // Resize to max 1024px to keep upload size reasonable
      const img = new Image()
      img.onload = () => {
        const canvas = document.createElement('canvas')
        const maxDim = 1024
        let { width, height } = img
        if (width > maxDim || height > maxDim) {
          if (width > height) { height = (height / width) * maxDim; width = maxDim }
          else { width = (width / height) * maxDim; height = maxDim }
        }
        canvas.width = width
        canvas.height = height
        canvas.getContext('2d')!.drawImage(img, 0, 0, width, height)
        const resized = canvas.toDataURL('image/jpeg', 0.85)
        onChange(resized, file.name.replace(/\.[^.]+$/, '.jpg'))
      }
      img.src = dataUri
    }
    reader.readAsDataURL(file)
  }

  if (compact) {
    return (
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        style={{
          position: 'relative',
          width: 52, height: 52,
          borderRadius: '50%',
          border: '2px dashed var(--border-hi)',
          background: previewUrl ? 'none' : 'var(--elevated)',
          cursor: 'pointer',
          overflow: 'hidden',
          transition: 'border-color var(--t-base)',
          flexShrink: 0,
        }}
        onMouseEnter={e => (e.currentTarget.style.borderColor = 'var(--accent)')}
        onMouseLeave={e => (e.currentTarget.style.borderColor = 'var(--border-hi)')}
      >
        {previewUrl
          ? <img src={previewUrl} alt="Preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          : <span style={{ fontSize: 22, opacity: 0.4, lineHeight: '52px' }}>📷</span>
        }
        <input ref={inputRef} type="file" accept="image/*" hidden onChange={e => e.target.files?.[0] && handleFile(e.target.files[0])} />
      </button>
    )
  }

  return (
    <div>
      {label && <div className="input-label" style={{ marginBottom: 8 }}>{label}</div>}
      <div
        className={`photo-drop ${dragging ? 'dragging' : ''}`}
        onClick={() => inputRef.current?.click()}
        onDragOver={e => { e.preventDefault(); setDragging(true) }}
        onDragLeave={() => setDragging(false)}
        onDrop={e => {
          e.preventDefault(); setDragging(false)
          const file = e.dataTransfer.files[0]
          if (file) handleFile(file)
        }}
      >
        {previewUrl ? (
          <img src={previewUrl} alt="Preview" style={{ height: 120, objectFit: 'cover', borderRadius: 8 }} />
        ) : (
          <>
            <span className="photo-drop-icon">📸</span>
            <span className="photo-drop-text">Click or drag & drop a photo here<br /><small>JPEG, PNG, WEBP • max 10MB</small></span>
          </>
        )}
      </div>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        hidden
        onChange={e => e.target.files?.[0] && handleFile(e.target.files[0])}
      />
    </div>
  )
}
