"use client";

import React from "react";
import { useSelection } from "@/contexts/selection-context";
import { cn } from "@/lib/utils";

interface SelectableBlockWrapperProps {
  blockId: string;
  children: React.ReactNode;
  className?: string;
}

export function SelectableBlockWrapper({ blockId, children, className }: SelectableBlockWrapperProps) {
  const { isSelectionMode, isBlockSelected, toggleBlockSelection } = useSelection();

  const isSelected = isBlockSelected(blockId);

  const handleClick = (e: React.MouseEvent) => {
    if (isSelectionMode) {
      e.preventDefault();
      e.stopPropagation();
      toggleBlockSelection(blockId);
    }
  };

  if (!isSelectionMode) {
    return <div className={className}>{children}</div>;
  }

  return (
    <div
      className={cn(
        "relative group transition-all duration-200 rounded-lg mb-2",
        isSelectionMode && "cursor-pointer hover:bg-accent/50 p-3",
        isSelected && "bg-primary/10 ring-2 ring-primary/50 ring-offset-2 ring-offset-background shadow-sm",
        className
      )}
      onClick={handleClick}
    >
      <div className={cn("transition-opacity duration-200", isSelectionMode && !isSelected && "opacity-70")}>{children}</div>

      {isSelected && isSelectionMode && <div className="absolute inset-0 pointer-events-none bg-primary/5 rounded-lg" />}
    </div>
  );
}
