"use client";

import * as React from "react";
import { MainLayout } from "@/components/layouts/main-layout";
import { BlockRenderer } from "@/components/blocks";
import { QuizAccordion, groupQuizBlocks } from "@/components/blocks/quiz-accordion";
import { notFound } from "next/navigation";
import { usePaperData } from "@/hooks/use-papers";
import { PaperData, FrontendPaper, QuizBlock } from "@/data/types";

interface PaperSectionPageProps {
  params: Promise<{
    paper_id: string;
    section_id: string;
  }>;
}

export default function PaperSectionPage({ params }: PaperSectionPageProps) {
  const { paper_id, section_id: section_id } = React.use(params);

  const { paper, sections, isLoading: loading, isRefetching, isError, error, hasCachedData } = usePaperData(paper_id);

  // Only show full loading screen if we have no cached data
  if (loading && !hasCachedData) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading paper...</p>
        </div>
      </div>
    );
  }

  if (isError || error) {
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

  if (!paper || !sections) {
    notFound();
  }

  // Find the current section
  const currentSection = sections.find((s) => s.id === section_id);

  if (!currentSection) {
    notFound();
  }

  // Create paper data for the layout
  const paperData: PaperData = {
    paper: {
      id: paper._id || paper_id, // Use _id if available, fallback to paper_id
      title: paper.title,
      doi: "", // Not available from API
      created_at: paper.created_at || new Date().toISOString()
    } as FrontendPaper,
    totalPages: 1, // We don't have page info from API
    pages: [
      {
        pageNumber: 1,
        sections
      }
    ]
  };

  return (
    <MainLayout paperData={paperData} currentSectionId={section_id}>
      {/* Subtle loading indicator for background refreshes */}
      {isRefetching && hasCachedData && (
        <div className="fixed top-0 left-0 right-0 h-1 bg-primary/20 z-50">
          <div className="h-full bg-primary animate-pulse" />
        </div>
      )}

      <article className="space-y-8">
        <div key={currentSection.id} id={currentSection.id} className="section">
          <div className="space-y-6">
            {groupQuizBlocks(currentSection.blocks).map((blockOrGroup, index) => {
              // If it's an array of quiz blocks, render as accordion
              if (Array.isArray(blockOrGroup)) {
                return <QuizAccordion key={`quiz-group-${index}`} quizBlocks={blockOrGroup as QuizBlock[]} />;
              }
              // Otherwise render as normal block
              return <BlockRenderer key={blockOrGroup.id} block={blockOrGroup} />;
            })}
          </div>
        </div>
      </article>
    </MainLayout>
  );
}
