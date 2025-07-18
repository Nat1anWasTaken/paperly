"use client";

import * as React from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";

interface PaperNavigationFooterProps {
  currentSectionIndex: number;
  totalSections: number;
  onSectionNavigation: (direction: 'prev' | 'next') => void;
}

export function PaperNavigationFooter({ 
  currentSectionIndex,
  totalSections,
  onSectionNavigation 
}: PaperNavigationFooterProps) {
  const handlePreviousSection = () => {
    if (currentSectionIndex > 0) {
      onSectionNavigation('prev');
    }
  };

  const handleNextSection = () => {
    if (currentSectionIndex < totalSections - 1) {
      onSectionNavigation('next');
    }
  };

  return (
    <div className="fixed bottom-4 left-1/2 transform -translate-x-1/2 z-50">
      <div className="flex items-center gap-2 bg-background/95 backdrop-blur-sm border border-border rounded-lg px-3 py-2 shadow-lg">
        <Button
          variant="ghost"
          size="icon"
          onClick={handlePreviousSection}
          disabled={currentSectionIndex <= 0}
          className="size-8"
        >
          <ChevronLeft className="size-4" />
        </Button>
        
        <span className="text-sm font-medium text-foreground px-2 py-1 bg-muted text-center min-w-[60px]">
          {currentSectionIndex + 1}/{totalSections}
        </span>
        
        <Button
          variant="ghost"
          size="icon"
          onClick={handleNextSection}
          disabled={currentSectionIndex >= totalSections - 1}
          className="size-8"
        >
          <ChevronRight className="size-4" />
        </Button>
      </div>
    </div>
  );
} 