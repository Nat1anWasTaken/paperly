import * as React from "react";
import { samplePaper } from "@/data/sample-paper";
import { redirect } from "next/navigation";

interface PaperPageProps {
  params: Promise<{
    paper_id: string;
  }>;
}

export default function PaperPage({ params }: PaperPageProps) {
  const { paper_id } = React.use(params);
  
  // For now, we're using the sample paper data
  // In a real app, you'd fetch the paper data based on paper_id
  const paperData = samplePaper;
  
  // Get the first section from the entire paper
  const allSections = paperData.pages.flatMap(page => page.sections);
  const firstSection = allSections[0];
  
  if (firstSection) {
    // Redirect to the first section
    redirect(`/${paper_id}/${firstSection.id}`);
  }
  
  // If no sections found, return a not found or error page
  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <h1 className="text-2xl font-bold mb-4">Paper Not Found</h1>
        <p className="text-muted-foreground">The requested paper could not be found.</p>
      </div>
    </div>
  );
} 