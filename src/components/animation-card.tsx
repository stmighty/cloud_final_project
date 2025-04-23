"use client";

import { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Pause, Trash2, MoreHorizontal, Heart } from "lucide-react";
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
import { animationService } from "@/services/animationService";
import { toast } from "sonner";

interface AnimationCardProps {
  animation: Animation;
  canDelete: boolean;
  onDelete: (id: string) => void;
  isDeleting?: boolean;
}

export default function AnimationCard({
  animation,
  canDelete,
  onDelete,
  isDeleting = false,
}: AnimationCardProps) {
  const [isPlaying, setIsPlaying] = useState(true); // Auto-play by default
  const [currentFrameIndex, setCurrentFrameIndex] = useState(0);
  const [previewImage, setPreviewImage] = useState(animation.thumbnail);
  const [isLiked, setIsLiked] = useState(animation.isLiked ?? false);
  const [likeCount, setLikeCount] = useState(animation.likeCount);
  const animationTimerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    setIsLiked(animation.isLiked ?? false);
    setLikeCount(animation.likeCount);
  }, [animation.isLiked, animation.likeCount]);

  const togglePlayback = () => {
    setIsPlaying(!isPlaying);
    if (!isPlaying) {
      setCurrentFrameIndex(0);
      setPreviewImage(animation.frames[0].data as string);
    } else {
      setPreviewImage(animation.thumbnail);
    }
  };

  const handleLike = async () => {
    try {
      const response = await animationService.react(animation._id, !isLiked);
      if (response.success) {
        setIsLiked(response.isLiked ?? false);
        setLikeCount(response.likeCount);
      } else {
        toast.error("Failed to update reaction");
      }
    } catch (error) {
      console.error("Error updating reaction:", error);
      toast.error("Failed to update reaction");
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
                <Pause className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>{isPlaying ? "Pause" : "Play"} animation</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </CardContent>
      <CardFooter className="p-4 flex justify-between items-center">
        <div className="flex flex-col">
          <h3 className="font-medium">{animation.title}</h3>
          <p className="text-sm text-muted-foreground">
            {formatDate(animation.createdAt)}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={handleLike}
            className={isLiked ? "text-red-500 hover:text-red-600" : ""}
          >
            <Heart
              className="h-4 w-4"
              fill={isLiked ? "currentColor" : "none"}
            />
          </Button>
          <span className="text-sm text-muted-foreground">{likeCount}</span>
        </div>
        {canDelete && (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => onDelete(animation._id)}
                  disabled={isDeleting}
                >
                  {isDeleting ? (
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                  ) : (
                    <Trash2 className="h-4 w-4" />
                  )}
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Delete animation</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )}
      </CardFooter>
    </Card>
  );
}
