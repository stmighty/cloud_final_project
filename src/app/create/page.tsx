"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Slider } from "@/components/ui/slider"
import { Save, ArrowLeft, Pencil, Eraser, Square, Circle, Trash2, RefreshCw } from "lucide-react"
import type { Animation, Frame } from "@/lib/types"
import { v4 as uuidv4 } from "@/lib/uuid"

export default function CreateAnimationPage() {
  const router = useRouter()
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const currentFrameCanvasRef = useRef<HTMLCanvasElement | null>(null)
  const [frames, setFrames] = useState<Frame[]>([{ id: uuidv4(), data: null }])
  const [currentFrameIndex, setCurrentFrameIndex] = useState(0)
  const [isDrawing, setIsDrawing] = useState(false)
  const [title, setTitle] = useState("Untitled Animation")
  const [tool, setTool] = useState<"pencil" | "eraser" | "rectangle" | "circle">("pencil")
  const [color, setColor] = useState("#000000")
  const [brushSize, setBrushSize] = useState(5)
  const [startPos, setStartPos] = useState({ x: 0, y: 0 })

  // Create an offscreen canvas for the current frame only (without preview)
  useEffect(() => {
    // Create an offscreen canvas for the current frame
    const offscreenCanvas = document.createElement("canvas")
    offscreenCanvas.width = 500
    offscreenCanvas.height = 500
    currentFrameCanvasRef.current = offscreenCanvas

    // Initialize it with white background
    const ctx = offscreenCanvas.getContext("2d")
    if (ctx) {
      ctx.fillStyle = "white"
      ctx.fillRect(0, 0, offscreenCanvas.width, offscreenCanvas.height)

      // If we have data for this frame, load it
      if (frames[currentFrameIndex].data) {
        const img = new Image()
        img.crossOrigin = "anonymous"
        img.onload = () => {
          ctx.drawImage(img, 0, 0)
        }
        img.src = frames[currentFrameIndex].data as string
      }
    }
  }, [currentFrameIndex, frames])

  // Update the visible canvas with both previous frame (low alpha) and current frame
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    // Set canvas size
    canvas.width = 500
    canvas.height = 500

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height)

    // Fill with white background
    ctx.fillStyle = "white"
    ctx.fillRect(0, 0, canvas.width, canvas.height)

    // Draw previous frame with lower opacity if it exists and we're not on the first frame
    // Only show exactly one frame back
    if (currentFrameIndex > 0 && frames[currentFrameIndex - 1].data) {
      const prevImg = new Image()
      prevImg.crossOrigin = "anonymous"
      prevImg.onload = () => {
        ctx.globalAlpha = 0.3 // Lower opacity for previous frame
        ctx.drawImage(prevImg, 0, 0)
        ctx.globalAlpha = 1.0 // Reset opacity

        // Draw current frame on top
        if (currentFrameCanvasRef.current) {
          ctx.drawImage(currentFrameCanvasRef.current, 0, 0)
        }
      }
      prevImg.src = frames[currentFrameIndex - 1].data as string
    } else {
      // Just draw current frame if no previous frame
      if (currentFrameCanvasRef.current) {
        ctx.drawImage(currentFrameCanvasRef.current, 0, 0)
      }
    }
  }, [currentFrameIndex, frames, currentFrameCanvasRef.current])

  const saveCurrentFrame = () => {
    if (!currentFrameCanvasRef.current) return

    // Save only the current frame's canvas (without the preview)
    const updatedFrames = [...frames]
    updatedFrames[currentFrameIndex].data = currentFrameCanvasRef.current.toDataURL("image/png")
    setFrames(updatedFrames)
  }

  const addNewFrame = () => {
    saveCurrentFrame()
    const newFrames = [...frames, { id: uuidv4(), data: null }]
    setFrames(newFrames)
    setCurrentFrameIndex(newFrames.length - 1)
  }

  const deleteCurrentFrame = () => {
    if (frames.length <= 1) return

    const newFrames = frames.filter((_, index) => index !== currentFrameIndex)
    setFrames(newFrames)
    setCurrentFrameIndex(Math.min(currentFrameIndex, newFrames.length - 1))
  }

  const clearCurrentFrame = () => {
    // Clear the current frame canvas
    if (!currentFrameCanvasRef.current) return

    const ctx = currentFrameCanvasRef.current.getContext("2d")
    if (ctx) {
      ctx.fillStyle = "white"
      ctx.fillRect(0, 0, currentFrameCanvasRef.current.width, currentFrameCanvasRef.current.height)

      // Update the visible canvas
      const visibleCanvas = canvasRef.current
      if (visibleCanvas) {
        const visibleCtx = visibleCanvas.getContext("2d")
        if (visibleCtx) {
          visibleCtx.clearRect(0, 0, visibleCanvas.width, visibleCanvas.height)
          visibleCtx.fillStyle = "white"
          visibleCtx.fillRect(0, 0, visibleCanvas.width, visibleCanvas.height)

          // Redraw previous frame with low alpha if needed
          if (currentFrameIndex > 0 && frames[currentFrameIndex - 1].data) {
            const prevImg = new Image()
            prevImg.crossOrigin = "anonymous"
            prevImg.onload = () => {
              if (visibleCtx) {
                visibleCtx.globalAlpha = 0.3
                visibleCtx.drawImage(prevImg, 0, 0)
                visibleCtx.globalAlpha = 1.0
              }
            }
            prevImg.src = frames[currentFrameIndex - 1].data as string
          }
        }
      }

      // Update the frame data
      const updatedFrames = [...frames]
      updatedFrames[currentFrameIndex].data = null
      setFrames(updatedFrames)
    }
  }

  const handleStartDrawing = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current
    if (!canvas || !currentFrameCanvasRef.current) return

    // Get the scaling factor of the canvas
    const rect = canvas.getBoundingClientRect()
    const scaleX = canvas.width / rect.width
    const scaleY = canvas.height / rect.height

    // Calculate the correct position accounting for scaling
    const x = (e.clientX - rect.left) * scaleX
    const y = (e.clientY - rect.top) * scaleY

    setIsDrawing(true)
    setStartPos({ x, y })

    // Get context for both canvases
    const visibleCtx = canvas.getContext("2d")
    const currentFrameCtx = currentFrameCanvasRef.current.getContext("2d")

    if (!visibleCtx || !currentFrameCtx) return

    if (tool === "pencil" || tool === "eraser") {
      // Set up both contexts
      visibleCtx.beginPath()
      visibleCtx.moveTo(x, y)
      visibleCtx.lineCap = "round"
      visibleCtx.lineJoin = "round"
      visibleCtx.strokeStyle = tool === "eraser" ? "white" : color
      visibleCtx.lineWidth = brushSize

      currentFrameCtx.beginPath()
      currentFrameCtx.moveTo(x, y)
      currentFrameCtx.lineCap = "round"
      currentFrameCtx.lineJoin = "round"
      currentFrameCtx.strokeStyle = tool === "eraser" ? "white" : color
      currentFrameCtx.lineWidth = brushSize
    }
  }

  const handleDrawing = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return

    const canvas = canvasRef.current
    if (!canvas || !currentFrameCanvasRef.current) return

    // Get the scaling factor of the canvas
    const rect = canvas.getBoundingClientRect()
    const scaleX = canvas.width / rect.width
    const scaleY = canvas.height / rect.height

    // Calculate the correct position accounting for scaling
    const x = (e.clientX - rect.left) * scaleX
    const y = (e.clientY - rect.top) * scaleY

    // Get context for both canvases
    const visibleCtx = canvas.getContext("2d")
    const currentFrameCtx = currentFrameCanvasRef.current.getContext("2d")

    if (!visibleCtx || !currentFrameCtx) return

    if (tool === "pencil" || tool === "eraser") {
      // Draw on both canvases
      visibleCtx.lineTo(x, y)
      visibleCtx.stroke()

      currentFrameCtx.lineTo(x, y)
      currentFrameCtx.stroke()
    } else if (tool === "rectangle" || tool === "circle") {
      // For shape tools, we need to redraw the canvas on each mouse move

      // First, redraw the visible canvas with the previous frame (if any)
      visibleCtx.clearRect(0, 0, canvas.width, canvas.height)
      visibleCtx.fillStyle = "white"
      visibleCtx.fillRect(0, 0, canvas.width, canvas.height)

      // Draw previous frame with lower opacity if it exists
      if (currentFrameIndex > 0 && frames[currentFrameIndex - 1].data) {
        const prevImg = new Image()
        prevImg.crossOrigin = "anonymous"
        prevImg.src = frames[currentFrameIndex - 1].data as string
        visibleCtx.globalAlpha = 0.3
        visibleCtx.drawImage(prevImg, 0, 0)
        visibleCtx.globalAlpha = 1.0
      }

      // Draw current frame content
      visibleCtx.drawImage(currentFrameCanvasRef.current, 0, 0)

      // Now draw the shape preview on the visible canvas only
      visibleCtx.strokeStyle = color
      visibleCtx.lineWidth = brushSize

      if (tool === "rectangle") {
        const width = x - startPos.x
        const height = y - startPos.y
        visibleCtx.strokeRect(startPos.x, startPos.y, width, height)
      } else if (tool === "circle") {
        const radius = Math.sqrt(Math.pow(x - startPos.x, 2) + Math.pow(y - startPos.y, 2))
        visibleCtx.beginPath()
        visibleCtx.arc(startPos.x, startPos.y, radius, 0, 2 * Math.PI)
        visibleCtx.stroke()
      }
    }
  }

  const handleEndDrawing = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return

    const canvas = canvasRef.current
    if (!canvas || !currentFrameCanvasRef.current) return

    // Get the scaling factor of the canvas
    const rect = canvas.getBoundingClientRect()
    const scaleX = canvas.width / rect.width
    const scaleY = canvas.height / rect.height

    // Calculate the correct position accounting for scaling
    const x = (e.clientX - rect.left) * scaleX
    const y = (e.clientY - rect.top) * scaleY

    // Get context for both canvases
    const currentFrameCtx = currentFrameCanvasRef.current.getContext("2d")

    if (!currentFrameCtx) return

    if (tool === "rectangle") {
      // Final drawing of rectangle on the current frame canvas
      currentFrameCtx.strokeStyle = color
      currentFrameCtx.lineWidth = brushSize
      const width = x - startPos.x
      const height = y - startPos.y
      currentFrameCtx.strokeRect(startPos.x, startPos.y, width, height)
    } else if (tool === "circle") {
      // Final drawing of circle on the current frame canvas
      currentFrameCtx.strokeStyle = color
      currentFrameCtx.lineWidth = brushSize
      const radius = Math.sqrt(Math.pow(x - startPos.x, 2) + Math.pow(y - startPos.y, 2))
      currentFrameCtx.beginPath()
      currentFrameCtx.arc(startPos.x, startPos.y, radius, 0, 2 * Math.PI)
      currentFrameCtx.stroke()
    }

    setIsDrawing(false)

    // Update the visible canvas
    const visibleCtx = canvas.getContext("2d")
    if (visibleCtx) {
      visibleCtx.clearRect(0, 0, canvas.width, canvas.height)
      visibleCtx.fillStyle = "white"
      visibleCtx.fillRect(0, 0, canvas.width, canvas.height)

      // Draw previous frame with lower opacity if it exists
      if (currentFrameIndex > 0 && frames[currentFrameIndex - 1].data) {
        const prevImg = new Image()
        prevImg.crossOrigin = "anonymous"
        prevImg.src = frames[currentFrameIndex - 1].data as string
        visibleCtx.globalAlpha = 0.3
        visibleCtx.drawImage(prevImg, 0, 0)
        visibleCtx.globalAlpha = 1.0
      }

      // Draw current frame content
      visibleCtx.drawImage(currentFrameCanvasRef.current, 0, 0)
    }
  }

  const saveAnimation = () => {
    saveCurrentFrame()

    const animation: Animation = {
      id: uuidv4(),
      title,
      frames: frames,
      createdAt: new Date().toISOString(),
      thumbnail: frames[0].data as string,
      createdBy: "user-id", // Replace with actual user ID if available
    }

    // Save to localStorage
    const savedAnimations = localStorage.getItem("animations")
    const animations = savedAnimations ? JSON.parse(savedAnimations) : []
    animations.push(animation)
    localStorage.setItem("animations", JSON.stringify(animations))

    router.push("/")
  }

  return (
    <div className="container mx-auto p-4 h-[100svh] flex flex-col">
      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center gap-4">
          <Button variant="outline" onClick={() => router.push("/")} className="flex items-center gap-2">
            <ArrowLeft className="h-4 w-4" />
            Back to Library
          </Button>
          <Input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="max-w-xs"
            placeholder="Animation Title"
          />
        </div>
        <Button onClick={saveAnimation} className="flex items-center gap-2">
          <Save className="h-4 w-4" />
          Save Animation
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[auto_1fr] gap-4 flex-grow overflow-hidden">
        <div className="flex flex-col gap-3 overflow-y-auto">
          <div className="bg-muted p-3 rounded-lg">
            <h3 className="font-medium mb-2">Tools</h3>
            <div className="flex flex-wrap gap-2">
              <Button
                variant={tool === "pencil" ? "default" : "outline"}
                size="icon"
                onClick={() => setTool("pencil")}
                title="Pencil"
              >
                <Pencil className="h-4 w-4" />
              </Button>
              <Button
                variant={tool === "eraser" ? "default" : "outline"}
                size="icon"
                onClick={() => setTool("eraser")}
                title="Eraser"
              >
                <Eraser className="h-4 w-4" />
              </Button>
              <Button
                variant={tool === "rectangle" ? "default" : "outline"}
                size="icon"
                onClick={() => setTool("rectangle")}
                title="Rectangle"
              >
                <Square className="h-4 w-4" />
              </Button>
              <Button
                variant={tool === "circle" ? "default" : "outline"}
                size="icon"
                onClick={() => setTool("circle")}
                title="Circle"
              >
                <Circle className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="icon" onClick={clearCurrentFrame} title="Clear Canvas" className="ml-1">
                <RefreshCw className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <div className="bg-muted p-3 rounded-lg">
            <h3 className="font-medium mb-2">Color</h3>
            <input
              type="color"
              value={color}
              onChange={(e) => setColor(e.target.value)}
              className="w-full h-8 cursor-pointer"
            />
          </div>

          <div className="bg-muted p-3 rounded-lg">
            <h3 className="font-medium mb-2">Brush Size: {brushSize}px</h3>
            <Slider value={[brushSize]} min={1} max={50} step={1} onValueChange={(value) => setBrushSize(value[0])} />
          </div>
        </div>

        <div className="flex flex-col gap-3 overflow-hidden">
          <div className="bg-muted p-3 rounded-lg flex justify-center items-center flex-grow overflow-hidden">
            <canvas
              ref={canvasRef}
              className="border border-border bg-white max-w-full max-h-full object-contain"
              style={{ width: "auto", height: "auto", maxHeight: "calc(100svh - 220px)" }}
              onMouseDown={handleStartDrawing}
              onMouseMove={handleDrawing}
              onMouseUp={handleEndDrawing}
              onMouseLeave={handleEndDrawing}
            />
          </div>

          <div className="bg-muted p-3 rounded-lg">
            <div className="flex justify-between items-center mb-2">
              <h3 className="font-medium">Frames</h3>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={addNewFrame}>
                  Add Frame
                </Button>
                <Button variant="outline" size="sm" onClick={deleteCurrentFrame} disabled={frames.length <= 1}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
            <div className="flex gap-2 overflow-x-auto pb-1">
              {frames.map((frame, index) => (
                <div
                  key={frame.id}
                  className={`
                    border-2 rounded cursor-pointer flex-shrink-0
                    ${index === currentFrameIndex ? "border-primary" : "border-border"}
                  `}
                  onClick={() => {
                    saveCurrentFrame()
                    setCurrentFrameIndex(index)
                  }}
                >
                  {frame.data ? (
                    <img
                      src={(frame.data as string) || "/placeholder.svg"}
                      alt={`Frame ${index + 1}`}
                      className="w-14 h-14 object-cover"
                    />
                  ) : (
                    <div className="w-14 h-14 bg-white flex items-center justify-center text-muted-foreground">
                      {index + 1}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

