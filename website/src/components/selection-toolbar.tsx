"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { LanguageSelect } from "@/components/ui/language-select";
import { Loader2, Sparkles, X } from "lucide-react";
import { useSelection } from "@/contexts/selection-context";
import { useCreateSummary } from "@/hooks/use-analysis";
import { api } from "@/lib/api";
import { MdxRenderer } from "@/components/ui/mdx-renderer";

export function SelectionToolbar() {
  const { selectedBlockIds, hasSelections, clearSelections } = useSelection();
  const [selectedLanguage, setSelectedLanguage] = useState("en");
  const [summary, setSummary] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const createSummaryMutation = useCreateSummary();

  const handleGenerateSummary = async () => {
    if (!hasSelections) return;

    setSummary("");
    setIsDialogOpen(true);

    try {
      const stream = await createSummaryMutation.mutateAsync({
        block_ids: selectedBlockIds,
        language: selectedLanguage
      });

      // Use the SSE parser to handle the stream
      for await (const { event, data } of api.parseSummaryStream(stream)) {
        switch (event) {
          case "start":
            // Initial message, could show this to user
            console.log("Summary generation started:", data);
            break;
          case "chunk":
            // Append the chunk to our summary
            setSummary((prev) => prev + data);
            break;
          case "completed":
            // Summary is complete
            console.log("Summary generation completed");
            return; // Exit the loop
          default:
            console.log("Unknown event:", event, data);
        }
      }
    } catch (error) {
      console.error("Error generating summary:", error);
      setSummary("Sorry, there was an error generating the summary. Please try again.");
    }
  };

  if (!hasSelections) {
    return null;
  }

  return (
    <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 z-50">
      <div className="bg-background border border-border rounded-lg shadow-lg p-4 flex items-center gap-3 min-w-fit">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <span className="bg-primary text-primary-foreground rounded-full px-2 py-1 text-xs font-medium">{selectedBlockIds.length}</span>
          <span>blocks selected</span>
        </div>

        <div className="flex items-center gap-2">
          <LanguageSelect value={selectedLanguage} onValueChange={setSelectedLanguage} />

          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={handleGenerateSummary} disabled={createSummaryMutation.isPending}>
                <Sparkles className="w-4 h-4 mr-2" />
                Generate Summary
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl max-h-[80vh] overflow-hidden">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <Sparkles className="w-5 h-5" />
                  AI Summary ({selectedBlockIds.length} blocks)
                </DialogTitle>
              </DialogHeader>
              <div className="overflow-y-auto">
                {createSummaryMutation.isPending ? (
                  <div className="flex items-center justify-center p-8">
                    <Loader2 className="w-6 h-6 animate-spin mr-2" />
                    <span>Generating summary...</span>
                  </div>
                ) : (
                  <div className="scroll-auto max-h-[75vh]">
                    <MdxRenderer content={summary || "Summary will appear here..."} />
                  </div>
                )}
              </div>
            </DialogContent>
          </Dialog>

          <Button variant="outline" size="sm" onClick={clearSelections} className="text-muted-foreground hover:text-foreground">
            <X className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
