"use client";

import * as React from "react";
import { ChevronLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { usePrefetchPaper } from "@/hooks/use-papers";

interface PaperSection {
  id: string;
  title: string;
  level: number; // 1 for main sections, 2 for subsections, etc.
}

interface PaperNavigationProps {
  paperSections: PaperSection[];
  activeSectionId: string;
  onSectionClick: (sectionId: string) => void;
  onToggleSidebar: () => void;
  paperId: string;
}

export function PaperNavigation({
  paperSections,
  activeSectionId,
  onSectionClick,
  onToggleSidebar,
  paperId,
}: PaperNavigationProps) {
  const { prefetchPaper } = usePrefetchPaper();
  return (
    <div className="h-full overflow-y-auto bg-card">
      <div className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-card-foreground">
            Contents
          </h2>
          <Button
            variant="ghost"
            size="sm"
            onClick={onToggleSidebar}
            className="p-1"
          >
            <ChevronLeft className="size-4" />
          </Button>
        </div>
        <nav className="space-y-1">
          {paperSections.map((section) => (
            <Button
              key={section.id}
              variant="ghost"
              className={cn(
                "w-full justify-start text-left h-auto p-3 hover:bg-accent",
                section.level === 2 && "ml-4 text-sm",
                section.level === 3 && "ml-8 text-sm",
                activeSectionId === section.id &&
                  "bg-accent text-accent-foreground"
              )}
              onClick={() => onSectionClick(section.id)}
              onMouseEnter={() => {
                // Prefetch paper data when hovering over navigation items
                prefetchPaper(paperId);
              }}
            >
              <span className="text-sm text-muted-foreground mr-2">
                {section.level === 1
                  ? "•"
                  : section.level === 2
                  ? "◦"
                  : "▪"}
              </span>
              {section.title}
            </Button>
          ))}
        </nav>
      </div>
    </div>
  );
} 