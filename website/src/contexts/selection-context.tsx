"use client";

import React, { createContext, useContext, useState, useCallback } from "react";

interface SelectionContextType {
  selectedBlockIds: string[];
  isSelectionMode: boolean;
  setSelectionMode: (enabled: boolean) => void;
  toggleBlockSelection: (blockId: string) => void;
  isBlockSelected: (blockId: string) => boolean;
  clearSelections: () => void;
  hasSelections: boolean;
}

const SelectionContext = createContext<SelectionContextType | undefined>(undefined);

export function SelectionProvider({ children }: { children: React.ReactNode }) {
  const [selectedBlockIds, setSelectedBlockIds] = useState<string[]>([]);
  const [isSelectionMode, setIsSelectionMode] = useState(false);

  const setSelectionMode = useCallback((enabled: boolean) => {
    setIsSelectionMode(enabled);
    if (!enabled) {
      setSelectedBlockIds([]);
    }
  }, []);

  const toggleBlockSelection = useCallback((blockId: string) => {
    setSelectedBlockIds((prev) => {
      if (prev.includes(blockId)) {
        return prev.filter((id) => id !== blockId);
      } else {
        return [...prev, blockId];
      }
    });
  }, []);

  const isBlockSelected = useCallback(
    (blockId: string) => {
      return selectedBlockIds.includes(blockId);
    },
    [selectedBlockIds]
  );

  const clearSelections = useCallback(() => {
    setSelectedBlockIds([]);
  }, []);

  const hasSelections = selectedBlockIds.length > 0;

  const value: SelectionContextType = {
    selectedBlockIds,
    isSelectionMode,
    setSelectionMode,
    toggleBlockSelection,
    isBlockSelected,
    clearSelections,
    hasSelections
  };

  return <SelectionContext.Provider value={value}>{children}</SelectionContext.Provider>;
}

export function useSelection() {
  const context = useContext(SelectionContext);
  if (context === undefined) {
    throw new Error("useSelection must be used within a SelectionProvider");
  }
  return context;
}
