"use client";

import React from "react";
import { PaperBlock, BlockKind } from "@/data/types";
import { useTranslation } from "@/contexts/translation-context";
import { useBlockTranslation } from "@/hooks/use-analysis";
import { Loader2, AlertCircle } from "lucide-react";

interface TranslatedBlockWrapperProps {
  block: PaperBlock;
  children: React.ReactNode;
}

export function TranslatedBlockWrapper({ block, children }: TranslatedBlockWrapperProps) {
  const { currentLanguage, isTranslationMode } = useTranslation();
  
  // Define which block types should be translated
  const translatableBlockTypes = [
    BlockKind.HEADER,
    BlockKind.PARAGRAPH,
    BlockKind.QUIZ,
    BlockKind.QUOTE,
    BlockKind.TABLE,
    BlockKind.FOOTNOTE
  ];
  
  // Only fetch translation if we're in translation mode, not English, and block type is translatable
  const shouldFetchTranslation = isTranslationMode && 
    currentLanguage !== "en" && 
    translatableBlockTypes.includes(block.kind);
  
  const {
    data: translation,
    isLoading,
    isError,
    error
  } = useBlockTranslation(block.id, currentLanguage, shouldFetchTranslation);

  // If not in translation mode or language is English, render original content
  if (!shouldFetchTranslation) {
    return <>{children}</>;
  }

  // Loading state
  if (isLoading) {
    return (
      <div className="relative">
        {/* Show original content with loading overlay */}
        <div className="opacity-50">{children}</div>
        <div className="absolute top-2 right-2 flex items-center gap-2 bg-background/90 backdrop-blur-sm border border-border rounded-lg px-2 py-1 text-xs text-muted-foreground">
          <Loader2 className="w-3 h-3 animate-spin" />
          Translating...
        </div>
      </div>
    );
  }

  // Error state - fallback to original content with error indicator
  if (isError) {
    console.error("Translation error for block", block.id, error);
    return (
      <div className="relative">
        {children}
        <div className="absolute top-2 right-2 flex items-center gap-2 bg-destructive/10 border border-destructive/20 rounded-lg px-2 py-1 text-xs text-destructive">
          <AlertCircle className="w-3 h-3" />
          Translation failed
        </div>
      </div>
    );
  }

  // Success state - return translated content
  if (translation) {
    // Clone the block with translated content
    const translatedBlock = {
      ...block,
      // Handle different block types
      ...getTranslatedContent(block, translation.content)
    } as PaperBlock;

    // Clone children and pass translated block
    const translatedChildren = React.Children.map(children, (child) => {
      if (React.isValidElement(child)) {
        return React.cloneElement(child, { block: translatedBlock } as any);
      }
      return child;
    });

    return (
      <div className="relative">
        {translatedChildren}
      </div>
    );
  }

  // Fallback to original content
  return <>{children}</>;
}

// Helper function to apply translated content based on block type
function getTranslatedContent(block: PaperBlock, translatedContent: string): Partial<PaperBlock> {
  try {
    // Try to parse as JSON first (for complex blocks like quiz)
    const parsed = JSON.parse(translatedContent);
    
    // For quiz blocks, handle structured translation
    if (block.kind === "quiz" && parsed.question && parsed.options) {
      return {
        question: parsed.question,
        options: parsed.options,
        explanation: parsed.explanation || block.explanation
      };
    }
    
    // For other structured translations
    if (parsed.text) {
      return {
        text: parsed.text,
        title: parsed.title || (hasTitleProperty(block) ? block.title : undefined)
      };
    }
  } catch {
    // Not JSON, treat as plain text
  }
  
  // Handle plain text translations
  if (hasTextProperty(block)) {
    // If content has multiple lines and block supports title, split them
    if (hasTitleProperty(block) && translatedContent.includes('\n')) {
      const lines = translatedContent.split('\n');
      return {
        title: lines[0],
        text: lines.slice(1).join('\n')
      };
    }
    
    return { text: translatedContent };
  }
  
  // For blocks with only specific text fields (like headers)
  if ('text' in block) {
    return { text: translatedContent };
  }
  
  return {};
}

// Type guards to check if block has text properties
function hasTextProperty(block: PaperBlock): block is PaperBlock & { text: string } {
  return 'text' in block;
}

function hasTitleProperty(block: PaperBlock): block is PaperBlock & { title?: string } {
  return 'title' in block;
} 