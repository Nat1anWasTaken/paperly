"use client";

import * as React from "react";
import { MainLayout } from "@/components/layouts/main-layout";
import { BlockRenderer } from "@/components/blocks";
import { notFound } from "next/navigation";
import { api } from "@/lib/api";
import { Paper, PaperBlock, PaperData, PaperSection, BlockKind, FrontendPaper } from "@/data/types";

interface PaperSectionPageProps {
  params: Promise<{
    paper_id: string;
    section: string;
  }>;
}

// Helper function to organize blocks into sections based on headers
function organizeBlocksIntoSections(blocks: PaperBlock[]): PaperSection[] {
  const sections: PaperSection[] = [];
  let currentSection: PaperSection | null = null;

  blocks.forEach((block) => {
    if (block.kind === BlockKind.HEADER && block.level <= 2) {
      // Create a new section for H1 and H2 headers
      if (currentSection) {
        sections.push(currentSection);
      }
      
      currentSection = {
        id: `section-${block.id}`,
        title: block.text,
        level: block.level,
        blocks: [block],
      };
    } else {
      // Add block to current section, or create a default section if none exists
      if (!currentSection) {
        currentSection = {
          id: "section-default",
          title: "Content",
          level: 1,
          blocks: [],
        };
      }
      currentSection.blocks.push(block);
    }
  });

  // Don't forget the last section
  if (currentSection) {
    sections.push(currentSection);
  }

  return sections;
}

export default function PaperSectionPage({ params }: PaperSectionPageProps) {
  const { paper_id, section } = React.use(params);
  
  const [paper, setPaper] = React.useState<Paper | null>(null);
  const [blocks, setBlocks] = React.useState<PaperBlock[]>([]);
  const [sections, setSections] = React.useState<PaperSection[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    async function fetchPaperData() {
      try {
        setLoading(true);
        setError(null);

        // Fetch paper info and blocks in parallel
        const [paperData, blocksData] = await Promise.all([
          api.getPaper(paper_id),
          api.getPaperBlocksForUI(paper_id)
        ]);

        setPaper(paperData);
        setBlocks(blocksData);
        
        // Organize blocks into sections
        const organizedSections = organizeBlocksIntoSections(blocksData);
        setSections(organizedSections);
        
      } catch (err) {
        console.error('Failed to fetch paper data:', err);
        setError(err instanceof Error ? err.message : 'Failed to load paper');
      } finally {
        setLoading(false);
      }
    }

    fetchPaperData();
  }, [paper_id]);

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

  if (!paper) {
    notFound();
  }

  // Find the current section
  const currentSection = sections.find((s) => s.id === section);

  if (!currentSection) {
    notFound();
  }

  // Create paper data for the layout
  const paperData: PaperData = {
    paper: {
      id: paper._id || paper_id, // Use _id if available, fallback to paper_id
      title: paper.title,
      doi: "", // Not available from API
      created_at: paper.created_at || new Date().toISOString(),
    } as FrontendPaper,
    totalPages: 1, // We don't have page info from API
    pages: [
      {
        pageNumber: 1,
        sections: sections,
      }
    ],
  };

  return (
    <MainLayout paperData={paperData} currentSectionId={section}>
      <article className="space-y-8">
        <div key={currentSection.id} id={currentSection.id} className="section">
          <h2 className="text-2xl font-bold mb-4">{currentSection.title}</h2>
          <div className="space-y-6">
            {currentSection.blocks.map((block) => (
              <BlockRenderer key={block.id} block={block} />
            ))}
          </div>
        </div>
      </article>
    </MainLayout>
  );
}
