"use client";

import React from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Languages } from "lucide-react";
import { useLanguages } from "@/hooks/use-analysis";

interface LanguageSelectProps {
  value: string;
  onValueChange: (value: string) => void;
  disabled?: boolean;
  placeholder?: string;
  className?: string;
}

export function LanguageSelect({ 
  value, 
  onValueChange, 
  disabled = false, 
  placeholder = "Select language",
  className = "w-40" 
}: LanguageSelectProps) {
  const { data: languages = [], isLoading: isLanguagesLoading } = useLanguages();

  return (
    <Select 
      value={value} 
      onValueChange={onValueChange} 
      disabled={disabled || isLanguagesLoading}
    >
      <SelectTrigger className={className}>
        <Languages className="w-4 h-4 mr-2" />
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        {languages.map((lang) => (
          <SelectItem key={lang.code} value={lang.code}>
            {lang.name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}