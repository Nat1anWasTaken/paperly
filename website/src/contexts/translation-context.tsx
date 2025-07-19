"use client";

import React, { createContext, useContext, useState, useCallback, ReactNode } from "react";

export interface TranslationContextType {
  currentLanguage: string;
  isTranslationMode: boolean;
  setCurrentLanguage: (language: string) => void;
  setTranslationMode: (enabled: boolean) => void;
  toggleTranslationMode: () => void;
}

const TranslationContext = createContext<TranslationContextType | undefined>(undefined);

interface TranslationProviderProps {
  children: ReactNode;
}

export function TranslationProvider({ children }: TranslationProviderProps) {
  const [currentLanguage, setCurrentLanguageState] = useState<string>("en");
  const [isTranslationMode, setIsTranslationMode] = useState<boolean>(false);

  const setCurrentLanguage = useCallback((language: string) => {
    setCurrentLanguageState(language);
    // If setting to English, automatically turn off translation mode
    if (language === "en") {
      setIsTranslationMode(false);
    } else {
      // If setting to another language, automatically turn on translation mode
      setIsTranslationMode(true);
    }
  }, []);

  const setTranslationMode = useCallback((enabled: boolean) => {
    setIsTranslationMode(enabled);
    // If disabling translation mode, reset to English
    if (!enabled) {
      setCurrentLanguageState("en");
    }
  }, []);

  const toggleTranslationMode = useCallback(() => {
    setTranslationMode(!isTranslationMode);
  }, [isTranslationMode, setTranslationMode]);

  const value: TranslationContextType = {
    currentLanguage,
    isTranslationMode,
    setCurrentLanguage,
    setTranslationMode,
    toggleTranslationMode
  };

  return (
    <TranslationContext.Provider value={value}>
      {children}
    </TranslationContext.Provider>
  );
}

export function useTranslation() {
  const context = useContext(TranslationContext);
  if (context === undefined) {
    throw new Error("useTranslation must be used within a TranslationProvider");
  }
  return context;
} 