"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Play, Pause, Trash2, MoreHorizontal, User } from "lucide-react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import type { Animation } from "@/lib/types"

interface AnimationCardProps {
  animation: Animation
  onDelete: (id: string) => void
}

export default function AnimationCard({ animation, onDelete }: AnimationCardProps) {
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentFrameIndex, setCurrentFrameIndex] = useState(0)
  const [previewImage, setPreviewImage] = useState(animation.thumbnail)

  const togglePlayback = () => {
    setIsPlaying(!isPlaying)
    if (!isPlaying) {
      setCurrentFrameIndex(0)
      setPreviewImage(animation.frames[0].data as string)
    } else {
      setPreviewImage(animation.thumbnail)
    }
  }

  // Use useEffect to handle animation playback
  useEffect(() => {
    let animationTimer: NodeJS.Timeout

    if (isPlaying && animation.frames.length > 1) {
      animationTimer = setTimeout(() => {
        const nextIndex = (currentFrameIndex + 1) % animation.frames.length
        setCurrentFrameIndex(nextIndex)
        setPreviewImage(animation.frames[nextIndex].data as string)
      }, 200) // 5 FPS
    }

    return () => {
      if (animationTimer) clearTimeout(animationTimer)
    }
  }, [isPlaying, currentFrameIndex, animation.frames])

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString()
  }

  return (
    <Card className="overflow-hidden">
      <CardContent className="p-0 relative">
        <div className="aspect-square bg-muted/30 flex items-center justify-center">
          <img
            src={previewImage}
            alt={animation.title}
            className="w-full h-full object-contain"
          />
        </div>
        <Button
          variant="secondary"
          size="icon"
          className="absolute bottom-2 right-2 rounded-full"
          onClick={togglePlayback}
        >
          {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
        </Button>
      </CardContent>
      <CardFooter className="p-3 flex flex-col items-start gap-1">
        <div className="w-full flex justify-between items-center">
          <h3 className="font-medium truncate">{animation.title}</h3>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => onDelete(animation.id)}>
                <Trash2 className="h-4 w-4 mr-2" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        <div className="flex items-center justify-between w-full text-xs text-muted-foreground">
          <div className="flex items-center gap-1">
            <User className="h-3 w-3" />
            <span className="truncate max-w-[120px]">{animation.createdBy || "Anonymous"}</span>
          </div>
          <span>{formatDate(animation.createdAt)}</span>
        </div>
      </CardFooter>
    </Card>
  )
}

