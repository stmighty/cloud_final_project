"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Play, Pause, Trash2, MoreHorizontal, User } from "lucide-react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import type { Animation } from "@/interfaces/Animation"
import api2 from "@/lib/axios2"
import Image from "next/image"

interface AnimationCardProps {
  animation: Animation
  canDelete?: boolean
  onDelete: (id: string) => void
}

export default function AnimationCard({ animation, canDelete, onDelete }: AnimationCardProps) {
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentFrameIndex, setCurrentFrameIndex] = useState(0)
  const [previewImage, setPreviewImage] = useState(animation.imageList[0])

  const handleDelete = async () => {
    try {
      await api2.delete(`animations/${animation._id}`)
      onDelete?.(animation._id)
    } catch (err) {
      console.error("Failed to delete animation", err)
    }
  }

  const togglePlayback = () => {
    setIsPlaying(!isPlaying)
    if (!isPlaying) {
      setCurrentFrameIndex(0)
      setPreviewImage(animation.imageList[0])
    }
  }

  useEffect(() => {
    let animationTimer: NodeJS.Timeout

    if (isPlaying && animation.imageList.length > 1) {
      animationTimer = setTimeout(() => {
        const nextIndex = (currentFrameIndex + 1) % animation.imageList.length
        setCurrentFrameIndex(nextIndex)
        setPreviewImage(animation.imageList[nextIndex])
      }, 200) // 5 FPS
    }

    return () => {
      if (animationTimer) clearTimeout(animationTimer)
    }
  }, [isPlaying, currentFrameIndex, animation.imageList])

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
            alt="animation-preview"
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
          <h3 className="font-medium truncate">{animation.name}</h3>
          {canDelete && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={handleDelete}>
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
        <div className="flex items-center justify-between w-full text-xs text-muted-foreground">
          <div className="flex items-center gap-1">
            <User className="h-3 w-3" />
            <span className="truncate max-w-[120px]">{animation.userId}</span>
          </div>
          <span>{formatDate(animation.createdAt)}</span>
        </div>
      </CardFooter>
    </Card>
  )
}
