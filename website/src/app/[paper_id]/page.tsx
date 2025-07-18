"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { PaperBlock, BlockKind } from "@/data/types";

interface PaperPageProps {
  params: Promise<{
    paper_id: string;
  }>;
}

// Helper function to find the first meaningful section
function findFirstSection(blocks: PaperBlock[]): string | null {
  // Look for the first header that could serve as a section
  for (const block of blocks) {
    if (block.kind === BlockKind.HEADER && block.level <= 2) {
      return `section-${block.id}`;
    }
  }
  
  // If no headers found, create a default section
  if (blocks.length > 0) {
    return "section-default";
  }
  
  return null;
}

export default function PaperPage({ params }: PaperPageProps) {
  const { paper_id } = React.use(params);
  const router = useRouter();
  
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    async function fetchAndRedirect() {
      try {
        setLoading(true);
        setError(null);

        console.log('Fetching blocks for paper:', paper_id);
        
        // Fetch the blocks to determine the first section
        const blocks = await api.getPaperBlocksForUI(paper_id);
        
        console.log('Fetched blocks:', blocks.length);
        
        const firstSectionId = findFirstSection(blocks);
        
        console.log('First section ID:', firstSectionId);
        
        if (firstSectionId) {
          // Use router.replace instead of redirect
          router.replace(`/${paper_id}/${firstSectionId}`);
        } else {
          setError("No content found in this paper");
          setLoading(false);
        }
      } catch (err) {
        console.error('Failed to fetch paper blocks:', err);
        const errorMessage = err instanceof Error ? err.message : 'Failed to load paper';
        console.log('Error details:', errorMessage);
        setError(errorMessage);
        setLoading(false);
      }
    }

    fetchAndRedirect();
  }, [paper_id, router]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading paper...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4 text-destructive">Error Loading Paper</h1>
          <p className="text-muted-foreground mb-4">{error}</p>
          <button 
            onClick={() => window.location.reload()} 
            className="px-4 py-2 bg-primary text-primary-foreground rounded hover:bg-primary/90"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  // This should not be reached due to redirect, but just in case
  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <h1 className="text-2xl font-bold mb-4">Paper Not Found</h1>
        <p className="text-muted-foreground">The requested paper could not be found.</p>
      </div>
    </div>
  );
} 