"use client";

import { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Pause, Trash2, MoreHorizontal } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import type { Animation } from "@/interfaces/Animation";

interface AnimationCardProps {
  animation: Animation;
  onDelete: (id: string) => void;
}

export default function AnimationCard({
  animation,
  onDelete,
}: AnimationCardProps) {
  const [isPlaying, setIsPlaying] = useState(true); // Auto-play by default
  const [currentFrameIndex, setCurrentFrameIndex] = useState(0);
  const [previewImage, setPreviewImage] = useState(animation.thumbnail);
  const animationTimerRef = useRef<NodeJS.Timeout | null>(null);

  const togglePlayback = () => {
    setIsPlaying(!isPlaying);
    if (!isPlaying) {
      setCurrentFrameIndex(0);
      setPreviewImage(animation.frames[0].data as string);
    } else {
      setPreviewImage(animation.thumbnail);
    }
  };

  // Use useEffect to handle animation playback
  useEffect(() => {
    if (animationTimerRef.current) {
      clearTimeout(animationTimerRef.current);
    }

    if (isPlaying && animation.frames.length > 1) {
      animationTimerRef.current = setTimeout(() => {
        const nextIndex = (currentFrameIndex + 1) % animation.frames.length;
        setCurrentFrameIndex(nextIndex);
        setPreviewImage(animation.frames[nextIndex].data as string);
      }, 200); // 5 FPS
    }

    return () => {
      if (animationTimerRef.current) {
        clearTimeout(animationTimerRef.current);
      }
    };
  }, [isPlaying, currentFrameIndex, animation.frames]);

  // Clean up on unmount
  useEffect(() => {
    return () => {
      if (animationTimerRef.current) {
        clearTimeout(animationTimerRef.current);
      }
    };
  }, []);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString();
  };

  return (
    <Card className="overflow-hidden h-full flex flex-col hover:shadow-md transition-shadow">
      <CardContent className="p-0 relative flex-grow">
        <div className="aspect-square bg-white flex items-center justify-center overflow-hidden">
          <img
            src={previewImage || "/placeholder.svg"}
            alt={animation.title}
            className="w-full h-full object-contain"
          />
        </div>
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="secondary"
                size="icon"
                className="absolute bottom-2 right-2 rounded-full w-8 h-8 bg-background/80 backdrop-blur-sm hover:bg-background"
                onClick={togglePlayback}
              >
                {isPlaying ? (
                  <Pause className="h-4 w-4" />
                ) : (
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="lucide lucide-play"
                  >
                    <polygon points="5 3 19 12 5 21 5 3" />
                  </svg>
                )}
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>{isPlaying ? "Pause" : "Play"} animation</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </CardContent>
      <CardFooter className="p-2 flex justify-between items-center bg-muted/20">
        <div className="overflow-hidden">
          <h3 className="font-medium text-sm truncate" title={animation.title}>
            {animation.title}
          </h3>
          <p className="text-xs text-muted-foreground">
            {formatDate(animation.createdAt)}
          </p>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <MoreHorizontal className="h-4 w-4" />
              <span className="sr-only">Open menu</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem
              onClick={() => onDelete(animation.id)}
              className="text-destructive focus:text-destructive"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </CardFooter>
    </Card>
  );
}
