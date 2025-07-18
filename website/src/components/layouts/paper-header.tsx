"use client";

import * as React from "react";
import { FileText, Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/theme-toggle";

interface PaperHeaderProps {
  paperTitle: string;
  onToggleSidebar: () => void;
}

export function PaperHeader({ paperTitle, onToggleSidebar }: PaperHeaderProps) {
  return (
    <header className="sticky top-2 z-10 mx-4 mt-2 mb-3 flex items-center justify-between bg-background/20 backdrop-blur-2xl supports-[backdrop-filter]:bg-background/10 px-4 py-2.5 border border-border shadow-lg rounded-lg">
      <div className="flex items-center gap-3">
        <Button
          variant="ghost"
          size="icon"
          onClick={onToggleSidebar}
          className="size-9"
        >
          <Menu className="size-4" />
        </Button>
        <FileText className="size-5 text-primary" />
        <span className="text-base font-medium text-foreground truncate max-w-[400px]">
          {paperTitle}
        </span>
      </div>

      <ThemeToggle />
    </header>
  );
}
