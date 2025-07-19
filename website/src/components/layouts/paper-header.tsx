"use client";

import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";
import { LanguageSelect } from "@/components/ui/language-select";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useSelection } from "@/contexts/selection-context";
import { useTranslation } from "@/contexts/translation-context";
import { FileText, Languages, Menu, MousePointer2 } from "lucide-react";

interface PaperHeaderProps {
  paperTitle: string;
  onToggleSidebar: () => void;
}

export function PaperHeader({ paperTitle, onToggleSidebar }: PaperHeaderProps) {
  const { isSelectionMode, setSelectionMode } = useSelection();
  const { currentLanguage, isTranslationMode, setCurrentLanguage, toggleTranslationMode } = useTranslation();

  return (
    <TooltipProvider>
      <header className="sticky top-2 z-10 mx-4 mt-2 mb-3 flex items-center justify-between bg-background/20 backdrop-blur-2xl supports-[backdrop-filter]:bg-background/10 px-4 py-2.5 border border-border shadow-lg rounded-lg">
        <div className="flex items-center gap-3">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon" onClick={onToggleSidebar} className="size-9">
                <Menu className="size-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Toggle sidebar</p>
            </TooltipContent>
          </Tooltip>
          <FileText className="size-5 text-primary" />
          <span className="text-base font-medium text-foreground truncate max-w-[400px]">{paperTitle}</span>
        </div>

        <div className="flex items-center gap-2">
          {isTranslationMode && <LanguageSelect value={currentLanguage} onValueChange={setCurrentLanguage} placeholder="Select language" className="w-36" />}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant={isTranslationMode ? "default" : "outline"} size="icon" onClick={toggleTranslationMode} className="size-9">
                <Languages className="size-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>{isTranslationMode ? "Show original" : "Translate"}</p>
            </TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant={isSelectionMode ? "default" : "outline"} size="icon" onClick={() => setSelectionMode(!isSelectionMode)} className="size-9">
                <MousePointer2 className="size-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>{isSelectionMode ? "Exit selection mode" : "Select blocks and summary"}</p>
            </TooltipContent>
          </Tooltip>
          <ThemeToggle />
        </div>
      </header>
    </TooltipProvider>
  );
}
