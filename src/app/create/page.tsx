"use client";

import type React from "react";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import {
  Save,
  ArrowLeft,
  Pencil,
  Eraser,
  Square,
  Circle,
  Trash2,
  RefreshCw,
  Eye,
  EyeOff,
} from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import type { Frame } from "@/interfaces/Animation";
import { v4 as uuidv4 } from "@/lib/uuid";
import { animationService } from "@/services/animationService";

export default function CreateAnimationPage() {
  const router = useRouter();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const currentFrameCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const [frames, setFrames] = useState<Frame[]>([{ id: uuidv4(), data: null }]);
  const [currentFrameIndex, setCurrentFrameIndex] = useState(0);
  const [isDrawing, setIsDrawing] = useState(false);
  const [title, setTitle] = useState("Untitled Animation");
  const [tool, setTool] = useState<
    "pencil" | "eraser" | "rectangle" | "circle"
  >("pencil");
  const [color, setColor] = useState("#000000");
  const [brushSize, setBrushSize] = useState(5);
  const [startPos, setStartPos] = useState({ x: 0, y: 0 });
  const [showPreviousFrame, setShowPreviousFrame] = useState(true);
  const [lastPoint, setLastPoint] = useState<{ x: number; y: number } | null>(
    null
  );
  const [isFrameInitialized, setIsFrameInitialized] = useState(false);

  // Create an offscreen canvas for the current frame only (without preview)
  useEffect(() => {
    // Create an offscreen canvas for the current frame
    const offscreenCanvas = document.createElement("canvas");
    offscreenCanvas.width = 500;
    offscreenCanvas.height = 500;
    currentFrameCanvasRef.current = offscreenCanvas;

    // Initialize it with transparent background
    const ctx = offscreenCanvas.getContext("2d");
    if (ctx) {
      ctx.clearRect(0, 0, offscreenCanvas.width, offscreenCanvas.height);

      // If we have data for this frame, load it
      if (frames[currentFrameIndex] && frames[currentFrameIndex].data) {
        const img = new Image();
        img.crossOrigin = "anonymous";
        img.onload = () => {
          if (ctx) {
            ctx.drawImage(img, 0, 0);
            setIsFrameInitialized(true);
            // Force update the visible canvas after loading the frame
            updateVisibleCanvas();
          }
        };
        img.src = frames[currentFrameIndex].data as string;
      } else {
        setIsFrameInitialized(true);
      }
    }
  }, [currentFrameIndex, frames]);

  // Update the visible canvas with both previous frame (low alpha) and current frame
  useEffect(() => {
    if (!isFrameInitialized) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    // Set canvas size
    canvas.width = 500;
    canvas.height = 500;

    const ctx = canvas.getContext("2d", { alpha: true });
    if (!ctx) return;

    // Clear canvas with transparent background
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Fill with white background (for visibility)
    ctx.fillStyle = "white";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw previous frame with lower opacity if it exists, we're not on the first frame, and preview is enabled
    if (
      showPreviousFrame &&
      currentFrameIndex > 0 &&
      frames[currentFrameIndex - 1].data
    ) {
      const prevImg = new Image();
      prevImg.crossOrigin = "anonymous";
      prevImg.onload = () => {
        if (ctx) {
          ctx.globalAlpha = 0.3; // Lower opacity for previous frame
          ctx.drawImage(prevImg, 0, 0);
          ctx.globalAlpha = 1.0; // Reset opacity

          // Draw current frame on top
          if (currentFrameCanvasRef.current) {
            ctx.drawImage(currentFrameCanvasRef.current, 0, 0);
          }
        }
      };
      prevImg.src = frames[currentFrameIndex - 1].data as string;
    } else {
      // Just draw current frame if no previous frame or preview is disabled
      if (currentFrameCanvasRef.current) {
        ctx.drawImage(currentFrameCanvasRef.current, 0, 0);
      }
    }
  }, [
    currentFrameIndex,
    frames,
    currentFrameCanvasRef.current,
    showPreviousFrame,
    isFrameInitialized,
  ]);

  const saveCurrentFrame = () => {
    if (!currentFrameCanvasRef.current) return;

    // Create a temporary canvas to save the frame with white background
    const tempCanvas = document.createElement("canvas");
    tempCanvas.width = 500;
    tempCanvas.height = 500;
    const tempCtx = tempCanvas.getContext("2d");

    if (tempCtx) {
      // Fill with white background
      tempCtx.fillStyle = "white";
      tempCtx.fillRect(0, 0, tempCanvas.width, tempCanvas.height);

      // Draw the current frame content
      tempCtx.drawImage(currentFrameCanvasRef.current, 0, 0);

      // Check if there's any actual content on the canvas (not just white)
      const imageData = tempCtx.getImageData(
        0,
        0,
        tempCanvas.width,
        tempCanvas.height
      );
      const data = imageData.data;
      let hasContent = false;

      // Check if there's any non-white pixel
      for (let i = 0; i < data.length; i += 4) {
        if (data[i] !== 255 || data[i + 1] !== 255 || data[i + 2] !== 255) {
          hasContent = true;
          break;
        }
      }

      // Save only the current frame's canvas (without the preview)
      const updatedFrames = [...frames];
      updatedFrames[currentFrameIndex].data = hasContent
        ? tempCanvas.toDataURL("image/png")
        : null;
      setFrames(updatedFrames);
    }
  };

  const addNewFrame = () => {
    saveCurrentFrame();
    const newFrames = [...frames, { id: uuidv4(), data: null }];
    setFrames(newFrames);
    setCurrentFrameIndex(newFrames.length - 1);
    setIsFrameInitialized(false); // Reset for new frame
  };

  const deleteCurrentFrame = () => {
    if (frames.length <= 1) return;

    const newFrames = frames.filter((_, index) => index !== currentFrameIndex);
    setFrames(newFrames);
    setCurrentFrameIndex(Math.min(currentFrameIndex, newFrames.length - 1));
    setIsFrameInitialized(false); // Reset for frame change
  };

  const clearCurrentFrame = () => {
    // Clear the current frame canvas
    if (!currentFrameCanvasRef.current) return;

    const ctx = currentFrameCanvasRef.current.getContext("2d");
    if (ctx) {
      ctx.clearRect(
        0,
        0,
        currentFrameCanvasRef.current.width,
        currentFrameCanvasRef.current.height
      );

      // Update the visible canvas
      updateVisibleCanvas();

      // Update the frame data
      const updatedFrames = [...frames];
      updatedFrames[currentFrameIndex].data = null;
      setFrames(updatedFrames);
    }
  };

  const updateVisibleCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas || !currentFrameCanvasRef.current) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Fill with white background (for visibility)
    ctx.fillStyle = "white";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw previous frame with lower opacity if enabled
    if (
      showPreviousFrame &&
      currentFrameIndex > 0 &&
      frames[currentFrameIndex - 1].data
    ) {
      const prevImg = new Image();
      prevImg.crossOrigin = "anonymous";
      prevImg.src = frames[currentFrameIndex - 1].data as string;
      ctx.globalAlpha = 0.3;
      ctx.drawImage(prevImg, 0, 0);
      ctx.globalAlpha = 1.0;
    }

    // Draw current frame content
    ctx.drawImage(currentFrameCanvasRef.current, 0, 0);
  };

  // Draw a line between two points on both canvases
  const drawLine = (
    startX: number,
    startY: number,
    endX: number,
    endY: number,
    isEraser = false
  ) => {
    const canvas = canvasRef.current;
    if (!canvas || !currentFrameCanvasRef.current) return;

    // Get context for both canvases
    const visibleCtx = canvas.getContext("2d");
    const currentFrameCtx = currentFrameCanvasRef.current.getContext("2d");

    if (!visibleCtx || !currentFrameCtx) return;

    // Draw on visible canvas
    visibleCtx.beginPath();
    visibleCtx.moveTo(startX, startY);
    visibleCtx.lineTo(endX, endY);
    visibleCtx.strokeStyle = isEraser ? "white" : color;
    visibleCtx.lineWidth = brushSize;
    visibleCtx.lineCap = "round";
    visibleCtx.lineJoin = "round";
    visibleCtx.stroke();

    // Draw on current frame canvas
    currentFrameCtx.beginPath();
    currentFrameCtx.moveTo(startX, startY);
    currentFrameCtx.lineTo(endX, endY);
    currentFrameCtx.strokeStyle = isEraser ? "rgba(255,255,255,0)" : color; // Use transparent for eraser
    currentFrameCtx.lineWidth = brushSize;
    currentFrameCtx.lineCap = "round";
    currentFrameCtx.lineJoin = "round";
    currentFrameCtx.stroke();
  };

  const handleStartDrawing = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas || !currentFrameCanvasRef.current) return;

    // Get the scaling factor of the canvas
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    // Calculate the correct position accounting for scaling
    const x = (e.clientX - rect.left) * scaleX;
    const y = (e.clientY - rect.top) * scaleY;

    setIsDrawing(true);
    setStartPos({ x, y });
    setLastPoint({ x, y });

    // For pencil and eraser, we'll draw lines between points in handleDrawing
    // For shapes, we'll just store the start position
  };

  const handleDrawing = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing || !lastPoint) return;

    const canvas = canvasRef.current;
    if (!canvas || !currentFrameCanvasRef.current) return;

    // Get the scaling factor of the canvas
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    // Calculate the correct position accounting for scaling
    const x = (e.clientX - rect.left) * scaleX;
    const y = (e.clientY - rect.top) * scaleY;

    if (tool === "pencil" || tool === "eraser") {
      // Draw a line from the last point to the current point
      drawLine(lastPoint.x, lastPoint.y, x, y, tool === "eraser");

      // Update the last point
      setLastPoint({ x, y });
    } else if (tool === "rectangle" || tool === "circle") {
      // For shape tools, we need to redraw the canvas on each mouse move
      updateVisibleCanvas();

      // Now draw the shape preview on the visible canvas only
      const visibleCtx = canvas.getContext("2d");
      if (!visibleCtx) return;

      visibleCtx.strokeStyle = color;
      visibleCtx.lineWidth = brushSize;
      visibleCtx.lineCap = "round";
      visibleCtx.lineJoin = "round";

      if (tool === "rectangle") {
        const width = x - startPos.x;
        const height = y - startPos.y;
        visibleCtx.strokeRect(startPos.x, startPos.y, width, height);
      } else if (tool === "circle") {
        const radius = Math.sqrt(
          Math.pow(x - startPos.x, 2) + Math.pow(y - startPos.y, 2)
        );
        visibleCtx.beginPath();
        visibleCtx.arc(startPos.x, startPos.y, radius, 0, 2 * Math.PI);
        visibleCtx.stroke();
      }
    }
  };

  const handleEndDrawing = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;

    const canvas = canvasRef.current;
    if (!canvas || !currentFrameCanvasRef.current) return;

    // Get the scaling factor of the canvas
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    // Calculate the correct position accounting for scaling
    const x = (e.clientX - rect.left) * scaleX;
    const y = (e.clientY - rect.top) * scaleY;

    // Handle single click for pencil/eraser (draw a dot)
    if (tool === "pencil" || tool === "eraser") {
      if (
        lastPoint &&
        Math.abs(x - lastPoint.x) < 2 &&
        Math.abs(y - lastPoint.y) < 2
      ) {
        const visibleCtx = canvas.getContext("2d");
        const currentFrameCtx = currentFrameCanvasRef.current.getContext("2d");

        if (visibleCtx && currentFrameCtx) {
          // Draw a dot on visible canvas
          visibleCtx.beginPath();
          visibleCtx.arc(x, y, brushSize / 2, 0, Math.PI * 2);
          visibleCtx.fillStyle = tool === "eraser" ? "white" : color;
          visibleCtx.fill();

          // Draw a dot on current frame canvas
          currentFrameCtx.beginPath();
          currentFrameCtx.arc(x, y, brushSize / 2, 0, Math.PI * 2);
          currentFrameCtx.fillStyle =
            tool === "eraser" ? "rgba(255,255,255,0)" : color;
          currentFrameCtx.fill();
        }
      }
    } else if (tool === "rectangle" || tool === "circle") {
      // Get context for the current frame canvas
      const currentFrameCtx = currentFrameCanvasRef.current.getContext("2d");
      if (!currentFrameCtx) return;

      currentFrameCtx.strokeStyle = color;
      currentFrameCtx.lineWidth = brushSize;
      currentFrameCtx.lineCap = "round";
      currentFrameCtx.lineJoin = "round";

      if (tool === "rectangle") {
        // Final drawing of rectangle on the current frame canvas
        const width = x - startPos.x;
        const height = y - startPos.y;
        currentFrameCtx.strokeRect(startPos.x, startPos.y, width, height);
      } else if (tool === "circle") {
        // Final drawing of circle on the current frame canvas
        const radius = Math.sqrt(
          Math.pow(x - startPos.x, 2) + Math.pow(y - startPos.y, 2)
        );
        currentFrameCtx.beginPath();
        currentFrameCtx.arc(startPos.x, startPos.y, radius, 0, 2 * Math.PI);
        currentFrameCtx.stroke();
      }
    }

    setIsDrawing(false);
    setLastPoint(null);

    // Update the visible canvas
    updateVisibleCanvas();
  };

  const handleFrameClick = (index: number) => {
    if (index === currentFrameIndex) return;

    // Save the current frame before switching
    saveCurrentFrame();

    // Switch to the selected frame
    setCurrentFrameIndex(index);
    setIsFrameInitialized(false); // Reset for frame change
  };

  const saveAnimation = async () => {
    saveCurrentFrame();

    // Filter out frames with no content
    const validFrames = frames.filter((frame) => frame.data !== null);

    // Make sure we have at least one frame
    if (validFrames.length === 0) {
      alert("Please create at least one frame with content before saving.");
      return;
    }

    try {
      const response = await animationService.create({
        title,
        frames: validFrames,
      });

      if (response.success) {
        router.push("/");
      } else {
        alert("Failed to save animation. Please try again.");
      }
    } catch (error) {
      console.error("Error saving animation:", error);
      alert("An error occurred while saving the animation. Please try again.");
    }
  };

  return (
    <div className="container mx-auto p-4 h-[100svh] flex flex-col">
      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            onClick={() => router.push("/")}
            className="flex items-center gap-2"
          >
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
              <Button
                variant="outline"
                size="icon"
                onClick={clearCurrentFrame}
                title="Clear Canvas"
                className="ml-1"
              >
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
            <Slider
              value={[brushSize]}
              min={1}
              max={50}
              step={1}
              onValueChange={(value) => setBrushSize(value[0])}
            />
          </div>

          <div className="bg-muted p-3 rounded-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                {showPreviousFrame ? (
                  <Eye className="h-4 w-4" />
                ) : (
                  <EyeOff className="h-4 w-4" />
                )}
                <Label htmlFor="show-previous">Show Previous Frame</Label>
              </div>
              <Switch
                id="show-previous"
                checked={showPreviousFrame}
                onCheckedChange={setShowPreviousFrame}
              />
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-3 overflow-hidden">
          <div className="bg-muted p-3 rounded-lg flex justify-center items-center flex-grow overflow-hidden">
            <canvas
              ref={canvasRef}
              className="border border-border bg-white max-w-full max-h-full object-contain"
              style={{
                width: "auto",
                height: "auto",
                maxHeight: "calc(100svh - 220px)",
              }}
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
                <Button
                  variant="outline"
                  size="sm"
                  onClick={deleteCurrentFrame}
                  disabled={frames.length <= 1}
                >
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
                    ${
                      index === currentFrameIndex
                        ? "border-primary"
                        : "border-border"
                    }
                  `}
                  onClick={() => handleFrameClick(index)}
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
  );
}
