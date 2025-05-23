"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { PlusCircle } from "lucide-react";
import AnimationCard from "@/components/animation-card";
import type { Animation } from "@/interfaces/Animation";
import { useAuth } from "@/contexts/AuthContext";
import { ProfileButton } from "@/components/profile-button";
import { Separator } from "@/components/ui/separator";
import { animationService } from "@/services/animationService";
import { toast } from "sonner";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function LandingPage() {
  const [animations, setAnimations] = useState<Animation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"all" | "top">("all");
  const { user, loading } = useAuth();

  const fetchAnimations = async () => {
    try {
      setIsLoading(true);
      const response = await animationService.getAll();
      setAnimations(response.animations);
    } catch (error) {
      console.error("Error fetching animations:", error);
      toast.error("Failed to load animations");
    } finally {
      setIsLoading(false);
    }
  };

  const fetchTopLiked = async () => {
    try {
      setIsLoading(true);
      const response = await animationService.getTopLiked();
      setAnimations(response.animations);
    } catch (error) {
      console.error("Error fetching top liked animations:", error);
      toast.error("Failed to load top liked animations");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      setDeletingId(id);
      const response = await animationService.delete(id);
      if (response.success) {
        setAnimations(animations.filter((a) => a._id !== id));
        toast.success("Animation deleted successfully");
      } else {
        toast.error("Failed to delete animation");
      }
    } catch (error) {
      console.error("Error deleting animation:", error);
      toast.error("Failed to delete animation");
    } finally {
      setDeletingId(null);
    }
  };

  useEffect(() => {
    if (activeTab === "all") {
      fetchAnimations();
    } else {
      fetchTopLiked();
    }
  }, [activeTab]);

  return (
    <div className="min-h-[100svh] flex flex-col bg-gradient-to-b from-background to-background/50">
      <div className="container mx-auto pb-1 pt-6">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text">
            My Animations
          </h1>
          <div className="flex items-center gap-5">
            {user ? (
              <Link href="/create">
                <Button className="flex items-center gap-2 shadow-sm hover:shadow transition-all">
                  <PlusCircle className="h-4 w-4" />
                  Create New Animation
                </Button>
              </Link>
            ) : (
              <Link href="/signin">
                <Button className="flex items-center gap-2 shadow-sm hover:shadow transition-all">
                  <PlusCircle className="h-4 w-4" />
                  Create New Animation
                </Button>
              </Link>
            )}
            {!loading && (
              <>
                {user ? (
                  <ProfileButton />
                ) : (
                  <Button
                    asChild
                    variant="outline"
                    className="hidden md:inline-flex"
                  >
                    <Link href="/signin">Sign In with Google</Link>
                  </Button>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      <Separator className="mt-6" />

      <div className="container mx-auto p-4 flex-grow">
        <Tabs
          value={activeTab}
          onValueChange={(value) => setActiveTab(value as "all" | "top")}
          className="mb-6"
        >
          <TabsList>
            <TabsTrigger value="all">All Animations</TabsTrigger>
            <TabsTrigger value="top">Top Liked</TabsTrigger>
          </TabsList>
        </Tabs>

        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          </div>
        ) : animations.length === 0 ? (
          <div className="text-center py-16 rounded-lg border border-dashed border-muted-foreground/20 bg-muted/30 backdrop-blur-sm flex-grow flex flex-col items-center justify-center mt-8 shadow-sm">
            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
              <PlusCircle className="h-8 w-8 text-primary/70" />
            </div>
            <h2 className="text-xl font-medium mb-2">No animations yet</h2>
            <p className="text-muted-foreground mb-6 max-w-md">
              Create your first animation to get started with your creative
              journey
            </p>
            {user ? (
              <Link href="/create">
                <Button className="shadow-md hover:shadow-lg transition-all">
                  Create Animation
                </Button>
              </Link>
            ) : (
              <Link href="/signin">
                <Button className="shadow-md hover:shadow-lg transition-all">
                  Sign In to Create
                </Button>
              </Link>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 mt-8">
            {animations.map((animation) => (
              <AnimationCard
                key={animation._id}
                animation={animation}
                canDelete={animation.userId === user?.uid}
                onDelete={handleDelete}
                isDeleting={deletingId === animation._id}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
