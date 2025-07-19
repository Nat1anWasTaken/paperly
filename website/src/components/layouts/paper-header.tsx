"use client";

import * as React from "react";
import { FileText, Menu, MousePointer2, Languages } from "lucide-react";
import { Button } from "@/components/ui/button";
import { LanguageSelect } from "@/components/ui/language-select";
import { ThemeToggle } from "@/components/theme-toggle";
import { useSelection } from "@/contexts/selection-context";
import { useTranslation } from "@/contexts/translation-context";

interface PaperHeaderProps {
  paperTitle: string;
  onToggleSidebar: () => void;
}

export function PaperHeader({ paperTitle, onToggleSidebar }: PaperHeaderProps) {
  const { isSelectionMode, setSelectionMode } = useSelection();
  const { currentLanguage, isTranslationMode, setCurrentLanguage, toggleTranslationMode } = useTranslation();

  return (
    <header className="sticky top-2 z-10 mx-4 mt-2 mb-3 flex items-center justify-between bg-background/20 backdrop-blur-2xl supports-[backdrop-filter]:bg-background/10 px-4 py-2.5 border border-border shadow-lg rounded-lg">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={onToggleSidebar} className="size-9">
          <Menu className="size-4" />
        </Button>
        <FileText className="size-5 text-primary" />
        <span className="text-base font-medium text-foreground truncate max-w-[400px]">{paperTitle}</span>
        
        {/* Translation Controls */}
        <div className="flex items-center gap-2 ml-4">
          <Button
            variant={isTranslationMode ? "default" : "outline"}
            size="icon"
            onClick={toggleTranslationMode}
            className="size-9"
            title={isTranslationMode ? "Show original" : "Translate"}
          >
            <Languages className="size-4" />
          </Button>
          
          {isTranslationMode && (
            <LanguageSelect
              value={currentLanguage}
              onValueChange={setCurrentLanguage}
              placeholder="Select language"
              className="w-36"
            />
          )}
        </div>
      </div>

      <div className="flex items-center gap-2">
        <Button 
          variant={isSelectionMode ? "default" : "outline"} 
          size="icon" 
          onClick={() => setSelectionMode(!isSelectionMode)} 
          className="size-9"
          title={isSelectionMode ? "Exit selection mode" : "Select blocks"}
        >
          <MousePointer2 className="size-4" />
        </Button>
        <ThemeToggle />
      </div>
    </header>
  );
}
