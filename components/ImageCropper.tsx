'use client'

import React, { useState, useRef, useEffect } from 'react'

interface ImageCropperProps {
  imageSrc: string
  aspectRatio?: number // e.g. 1 for square, undefined for free crop
  onCrop: (croppedDataUri: string) => void
  onCancel: () => void
}

interface CropArea {
  x: number
  y: number
  w: number
  h: number
}

interface RenderedSize {
  width: number
  height: number
}

export function ImageCropper({ imageSrc, aspectRatio, onCrop, onCancel }: ImageCropperProps) {
  const [crop, setCrop] = useState<CropArea | null>(null)
  const [renderedSize, setRenderedSize] = useState<RenderedSize | null>(null)
  const [activeAction, setActiveAction] = useState<string | null>(null)
  const [pointerStart, setPointerStart] = useState<{ x: number; y: number } | null>(null)
  const [cropStart, setCropStart] = useState<CropArea | null>(null)

  const imageRef = useRef<HTMLImageElement>(null)

  // Recalculate crop bounds on image load
  const handleImageLoad = (e: React.SyntheticEvent<HTMLImageElement>) => {
    const img = e.currentTarget
    const width = img.width
    const height = img.height
    setRenderedSize({ width, height })

    let initialX = 0
    let initialY = 0
    let initialW = width
    let initialH = height

    if (aspectRatio) {
      const size = Math.min(width, height)
      initialW = size
      initialH = size
      initialX = (width - size) / 2
      initialY = (height - size) / 2
    }

    setCrop({
      x: initialX,
      y: initialY,
      w: initialW,
      h: initialH,
    })
  }

  // Pointer event handlers for unified mouse and touch drag/resize
  const handlePointerDown = (action: string, e: React.PointerEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (!crop) return

    e.currentTarget.setPointerCapture(e.pointerId)
    setPointerStart({ x: e.clientX, y: e.clientY })
    setCropStart({ ...crop })
    setActiveAction(action)
  }

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!activeAction || !pointerStart || !cropStart || !renderedSize || !crop) return
    e.preventDefault()
    e.stopPropagation()

    const dx = e.clientX - pointerStart.x
    const dy = e.clientY - pointerStart.y

    const imgW = renderedSize.width
    const imgH = renderedSize.height

    let { x, y, w, h } = cropStart
    const minSize = 40

    if (activeAction === 'move') {
      let newX = Math.max(0, Math.min(imgW - w, x + dx))
      let newY = Math.max(0, Math.min(imgH - h, y + dy))
      setCrop({ x: newX, y: newY, w, h })
    } else {
      let newX = x
      let newY = y
      let newW = w
      let newH = h

      if (aspectRatio) {
        // Enforce 1:1 Aspect Ratio (Square)
        if (activeAction === 'resize-br') {
          const delta = Math.max(dx, dy)
          const size = Math.max(minSize, Math.min(imgW - x, imgH - y, w + delta))
          newW = size
          newH = size
        } else if (activeAction === 'resize-bl') {
          const delta = Math.max(-dx, dy)
          const size = Math.max(minSize, Math.min(x + w, imgH - y, w + delta))
          newX = x + w - size
          newW = size
          newH = size
        } else if (activeAction === 'resize-tr') {
          const delta = Math.max(dx, -dy)
          const size = Math.max(minSize, Math.min(imgW - x, y + h, w + delta))
          newY = y + h - size
          newW = size
          newH = size
        } else if (activeAction === 'resize-tl') {
          const delta = Math.max(-dx, -dy)
          const size = Math.max(minSize, Math.min(x + w, y + h, w + delta))
          newX = x + w - size
          newY = y + h - size
          newW = size
          newH = size
        }
      } else {
        // Free Aspect Ratio
        if (activeAction.includes('r')) {
          newW = Math.max(minSize, Math.min(imgW - x, w + dx))
        }
        if (activeAction.includes('b')) {
          newH = Math.max(minSize, Math.min(imgH - y, h + dy))
        }
        if (activeAction.includes('l')) {
          const maxLeftW = x + w
          const potentialW = w - dx
          if (potentialW >= minSize) {
            newX = Math.max(0, x + dx)
            newW = maxLeftW - newX
          } else {
            newX = x + w - minSize
            newW = minSize
          }
        }
        if (activeAction.includes('t')) {
          const maxTopH = y + h
          const potentialH = h - dy
          if (potentialH >= minSize) {
            newY = Math.max(0, y + dy)
            newH = maxTopH - newY
          } else {
            newY = y + h - minSize
            newH = minSize
          }
        }
      }

      setCrop({ x: newX, y: newY, w: newW, h: newH })
    }
  }

  const handlePointerUp = (e: React.PointerEvent) => {
    if (!activeAction) return
    e.preventDefault()
    e.stopPropagation()
    try {
      e.currentTarget.releasePointerCapture(e.pointerId)
    } catch (_) {}
    setActiveAction(null)
    setPointerStart(null)
    setCropStart(null)
  }

  // Draw cropped image onto Canvas and trigger onCrop callback
  const handleSave = () => {
    if (!crop || !renderedSize) return

    const img = imageRef.current
    if (!img) return

    const naturalW = img.naturalWidth
    const naturalH = img.naturalHeight

    const scaleX = naturalW / renderedSize.width
    const scaleY = naturalH / renderedSize.height

    const sourceX = crop.x * scaleX
    const sourceY = crop.y * scaleY
    const sourceW = crop.w * scaleX
    const sourceH = crop.h * scaleY

    const canvas = document.createElement('canvas')

    // Maintain premium quality while avoiding extremely large payloads (caps crop at 1200px max)
    const maxCropDim = 1200
    let destW = sourceW
    let destH = sourceH
    if (sourceW > maxCropDim || sourceH > maxCropDim) {
      if (sourceW > sourceH) {
        destH = (sourceH / sourceW) * maxCropDim
        destW = maxCropDim
      } else {
        destW = (sourceW / sourceH) * maxCropDim
        destH = maxCropDim
      }
    }

    canvas.width = destW
    canvas.height = destH

    const ctx = canvas.getContext('2d')
    if (!ctx) {
      alert('Failed to process cropped canvas image context.')
      return
    }

    ctx.imageSmoothingEnabled = true
    ctx.imageSmoothingQuality = 'high'

    ctx.drawImage(
      img,
      sourceX,
      sourceY,
      sourceW,
      sourceH,
      0,
      0,
      destW,
      destH
    )

    const croppedDataUri = canvas.toDataURL('image/jpeg', 0.85)
    onCrop(croppedDataUri)
  }

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 99999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'var(--overlay)',
        backdropFilter: 'blur(8px)',
        padding: '20px',
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '650px',
          background: 'var(--surface)',
          border: '1px solid var(--border-hi)',
          borderRadius: 'var(--r-lg, 16px)',
          boxShadow: 'var(--shadow-lg)',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          maxHeight: '90vh',
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: '16px 24px',
            borderBottom: '1px solid var(--border)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 700, color: 'var(--text-pri)' }}>
            Crop Photo
          </h3>
          <span
            style={{
              fontSize: '12px',
              color: 'var(--text-sec)',
              background: 'var(--bg-alt)',
              padding: '4px 10px',
              borderRadius: '20px',
              fontWeight: 600,
            }}
          >
            {aspectRatio ? 'Square (1:1)' : 'Free Crop'}
          </span>
        </div>

        {/* Workspace */}
        <div
          style={{
            padding: '24px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'var(--bg-alt)',
            overflow: 'auto',
            flex: 1,
            minHeight: '280px',
          }}
        >
          <div
            style={{
              position: 'relative',
              userSelect: 'none',
              WebkitUserSelect: 'none',
            }}
          >
            <img
              ref={imageRef}
              src={imageSrc}
              alt="Source"
              onLoad={handleImageLoad}
              style={{
                display: 'block',
                maxWidth: '100%',
                maxHeight: '55vh',
                pointerEvents: 'none',
              }}
            />

            {/* Crop Box and Controls overlay */}
            {crop && renderedSize && (
              <div
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: '100%',
                  height: '100%',
                  pointerEvents: 'none',
                }}
              >
                {/* Visual crop box */}
                <div
                  onPointerDown={(e) => handlePointerDown('move', e)}
                  onPointerMove={handlePointerMove}
                  onPointerUp={handlePointerUp}
                  style={{
                    position: 'absolute',
                    top: crop.y,
                    left: crop.x,
                    width: crop.w,
                    height: crop.h,
                    border: '2px dashed var(--accent, #3b82f6)',
                    cursor: 'move',
                    pointerEvents: 'auto',
                    boxShadow: '0 0 0 9999px rgba(0, 0, 0, 0.65)',
                    boxSizing: 'border-box',
                  }}
                >
                  {/* Rule of Thirds - Grid lines */}
                  <div
                    className="crop-grid-line-h"
                    style={{
                      position: 'absolute',
                      left: 0,
                      right: 0,
                      top: '33.33%',
                      borderTop: '1px dashed rgba(255, 255, 255, 0.3)',
                    }}
                  />
                  <div
                    className="crop-grid-line-h"
                    style={{
                      position: 'absolute',
                      left: 0,
                      right: 0,
                      top: '66.66%',
                      borderTop: '1px dashed rgba(255, 255, 255, 0.3)',
                    }}
                  />
                  <div
                    className="crop-grid-line-v"
                    style={{
                      position: 'absolute',
                      top: 0,
                      bottom: 0,
                      left: '33.33%',
                      borderLeft: '1px dashed rgba(255, 255, 255, 0.3)',
                    }}
                  />
                  <div
                    className="crop-grid-line-v"
                    style={{
                      position: 'absolute',
                      top: 0,
                      bottom: 0,
                      left: '66.66%',
                      borderLeft: '1px dashed rgba(255, 255, 255, 0.3)',
                    }}
                  />

                  {/* Corner Handles */}
                  {/* Top-Left */}
                  <div
                    onPointerDown={(e) => handlePointerDown('resize-tl', e)}
                    onPointerMove={handlePointerMove}
                    onPointerUp={handlePointerUp}
                    style={{
                      position: 'absolute',
                      top: -6,
                      left: -6,
                      width: 14,
                      height: 14,
                      backgroundColor: 'var(--accent, #3b82f6)',
                      border: '2px solid #ffffff',
                      borderRadius: '50%',
                      cursor: 'nwse-resize',
                      pointerEvents: 'auto',
                    }}
                  />
                  {/* Top-Right */}
                  <div
                    onPointerDown={(e) => handlePointerDown('resize-tr', e)}
                    onPointerMove={handlePointerMove}
                    onPointerUp={handlePointerUp}
                    style={{
                      position: 'absolute',
                      top: -6,
                      right: -6,
                      width: 14,
                      height: 14,
                      backgroundColor: 'var(--accent, #3b82f6)',
                      border: '2px solid #ffffff',
                      borderRadius: '50%',
                      cursor: 'nesw-resize',
                      pointerEvents: 'auto',
                    }}
                  />
                  {/* Bottom-Left */}
                  <div
                    onPointerDown={(e) => handlePointerDown('resize-bl', e)}
                    onPointerMove={handlePointerMove}
                    onPointerUp={handlePointerUp}
                    style={{
                      position: 'absolute',
                      bottom: -6,
                      left: -6,
                      width: 14,
                      height: 14,
                      backgroundColor: 'var(--accent, #3b82f6)',
                      border: '2px solid #ffffff',
                      borderRadius: '50%',
                      cursor: 'nesw-resize',
                      pointerEvents: 'auto',
                    }}
                  />
                  {/* Bottom-Right */}
                  <div
                    onPointerDown={(e) => handlePointerDown('resize-br', e)}
                    onPointerMove={handlePointerMove}
                    onPointerUp={handlePointerUp}
                    style={{
                      position: 'absolute',
                      bottom: -6,
                      right: -6,
                      width: 14,
                      height: 14,
                      backgroundColor: 'var(--accent, #3b82f6)',
                      border: '2px solid #ffffff',
                      borderRadius: '50%',
                      cursor: 'nwse-resize',
                      pointerEvents: 'auto',
                    }}
                  />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div
          style={{
            padding: '16px 24px',
            borderTop: '1px solid var(--border)',
            display: 'flex',
            justifyContent: 'flex-end',
            gap: '12px',
          }}
        >
          <button
            type="button"
            className="btn btn-ghost"
            onClick={onCancel}
            style={{ minWidth: '100px' }}
          >
            Cancel
          </button>
          <button
            type="button"
            className="btn btn-primary"
            onClick={handleSave}
            disabled={!crop}
            style={{ minWidth: '120px' }}
          >
            Apply Crop
          </button>
        </div>
      </div>
    </div>
  )
}
