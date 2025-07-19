"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { usePaperData } from "@/hooks/use-papers";
import { PaperSection } from "@/data/types";

interface PaperPageProps {
  params: Promise<{
    paper_id: string;
  }>;
}

// Helper function to find the first meaningful section
function findFirstSection(sections: PaperSection[]): string | null {
  // Return the first section's ID
  if (sections.length > 0) {
    return sections[0].id;
  }

  return null;
}

export default function PaperPage({ params }: PaperPageProps) {
  const { paper_id } = React.use(params);
  const router = useRouter();
  const [hasRedirected, setHasRedirected] = React.useState(false);

  const { sections, isLoading: loading, error, hasCachedData } = usePaperData(paper_id);

  // Redirect immediately when sections are available (either from cache or fresh data)
  React.useEffect(() => {
    if (sections && sections.length > 0 && !hasRedirected) {
      console.log("Sections available, redirecting...", sections.length);
      console.log("All sections:", sections.map(s => ({ id: s.id, title: s.title })));

      const firstSectionId = findFirstSection(sections);
      console.log("First section ID:", firstSectionId);

      if (firstSectionId) {
        setHasRedirected(true);
        router.replace(`/${paper_id}/${firstSectionId}`);
      }
    }
  }, [sections, paper_id, router, hasRedirected]);

  // Show loading screen while we're waiting for sections or during redirect
  if (loading || hasRedirected || !sections) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">
            {hasRedirected ? "Redirecting..." : "Loading paper..."}
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4 text-destructive">Error Loading Paper</h1>
          <p className="text-muted-foreground mb-4">{error instanceof Error ? error.message : "Failed to load paper"}</p>
          <button onClick={() => window.location.reload()} className="px-4 py-2 bg-primary text-primary-foreground rounded hover:bg-primary/90">
            Try Again
          </button>
        </div>
      </div>
    );
  }

  // Check if sections are loaded but empty
  if (sections && sections.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">No Content Found</h1>
          <p className="text-muted-foreground">No content found in this paper.</p>
        </div>
      </div>
    );
  }

  // This should rarely be reached due to redirect, but keep as fallback
  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
        <p className="text-muted-foreground">Preparing paper...</p>
      </div>
    </div>
  );
}
