"use client";

import * as React from "react";
import { MainLayout } from "@/components/layouts/main-layout";
import { BlockRenderer } from "@/components/blocks";
import { samplePaper } from "@/data/sample-paper";
import { notFound } from "next/navigation";

interface PaperSectionPageProps {
  params: Promise<{
    paper_id: string;
    section: string;
  }>;
}

export default function PaperSectionPage({ params }: PaperSectionPageProps) {
  const { paper_id, section } = React.use(params);

  // For now, we're using the sample paper data
  // In a real app, you'd fetch the paper data based on paper_id
  const paperData = samplePaper;

  // Find all sections across all pages to get the current section
  const allSections = paperData.pages.flatMap((page) => page.sections);
  const currentSection = allSections.find((s) => s.id === section);

  if (!currentSection) {
    notFound();
  }

  // Find which page contains this section
  const currentPage = paperData.pages.find((page) =>
    page.sections.some((s) => s.id === section)
  );

  if (!currentPage) {
    notFound();
  }

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
