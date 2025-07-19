"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { Upload, FileText, Clock, Trash2, Eye, CheckCircle, AlertCircle, Loader2, Copy } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { uploadAndAnalyzePaper, UploadProgress, AnalysisStatus, api } from "@/lib/api";
import { AnalysisStorage, StoredAnalysis } from "@/lib/storage";

interface UploadModalProps {
  trigger?: React.ReactNode;
}

export function UploadModal({ trigger }: UploadModalProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [uploadHistory, setUploadHistory] = useState<StoredAnalysis[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const monitoringRef = useRef<Set<string>>(new Set());

  // Load stored analyses on component mount
  useEffect(() => {
    const storedAnalyses = AnalysisStorage.getAll();
    setUploadHistory(storedAnalyses);

    // Resume monitoring for any in-progress analyses
    const processingAnalyses = AnalysisStorage.getProcessing();
    processingAnalyses.forEach((analysis) => {
      if (analysis.analysisId && !monitoringRef.current.has(analysis.analysisId)) {
        monitorAnalysis(analysis.id, analysis.analysisId);
      }
    });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Monitor analysis progress
  const monitorAnalysis = useCallback(async (id: string, analysisId: string) => {
    if (monitoringRef.current.has(analysisId)) return;

    monitoringRef.current.add(analysisId);

    try {
      while (true) {
        await new Promise((resolve) => setTimeout(resolve, 2000));

        const analysis = await api.getAnalysis(analysisId);

        const progressMap: Record<AnalysisStatus, number> = {
          created: 10,
          extracting_markdown: 20,
          markdown_extracted: 35,
          generating_metadata: 50,
          metadata_generated: 65,
          processing_into_blocks: 75,
          blocks_processed: 85,
          generating_quizzes: 95,
          completed: 100,
          errored: 0
        };

        const progress = progressMap[analysis.status] || 0;

        const updates: Partial<StoredAnalysis> = {
          status: analysis.status === "completed" ? "ready" : analysis.status === "errored" ? "error" : "analyzing",
          analysisStatus: analysis.status,
          progress,
          paperId: analysis.paper_id
        };

        if (analysis.status === "errored") {
          updates.errorMessage = "Analysis failed";
        }

        AnalysisStorage.update(id, updates);
        setUploadHistory(AnalysisStorage.getAll());

        if (analysis.status === "completed" || analysis.status === "errored") {
          monitoringRef.current.delete(analysisId);
          break;
        }
      }
    } catch (error) {
      console.error("Error monitoring analysis:", error);
      AnalysisStorage.update(id, {
        status: "error",
        errorMessage: "Failed to monitor analysis progress"
      });
      setUploadHistory(AnalysisStorage.getAll());
      monitoringRef.current.delete(analysisId);
    }
  }, []);

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    const files = Array.from(e.dataTransfer.files);
    handleFiles(files);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    handleFiles(files);

    // Clear the input so the same file can be selected again
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleFiles = useCallback(async (files: File[]) => {
    const pdfFiles = files.filter((file) => file.type === "application/pdf");

    if (pdfFiles.length === 0) {
      alert("Please upload PDF files only.");
      return;
    }

    // Process files one by one to avoid overwhelming the server
    for (const file of pdfFiles) {
      await uploadFile(file);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const uploadFile = useCallback(
    async (file: File) => {
      const newAnalysisId = Date.now().toString();

      // Create initial stored analysis
      const initialAnalysis: StoredAnalysis = {
        id: newAnalysisId,
        analysisId: "", // Will be set after API call
        fileName: file.name,
        fileSize: `${(file.size / (1024 * 1024)).toFixed(1)} MB`,
        uploadDate: new Date().toLocaleString(),
        status: "uploading",
        progress: 0,
        lastUpdated: new Date().toISOString()
      };

      AnalysisStorage.save(initialAnalysis);
      setUploadHistory(AnalysisStorage.getAll());

      try {
        const result = await uploadAndAnalyzePaper(file, (progress: UploadProgress) => {
          const updates: Partial<StoredAnalysis> = {
            status: progress.stage === "uploading" ? "uploading" : "analyzing",
            progress: progress.progress,
            analysisStatus: progress.status
          };

          AnalysisStorage.update(newAnalysisId, updates);
          setUploadHistory(AnalysisStorage.getAll());
        });

        // Update with analysis ID and start monitoring
        AnalysisStorage.update(newAnalysisId, {
          analysisId: result.analysisId,
          status: "analyzing"
        });
        setUploadHistory(AnalysisStorage.getAll());

        // Start monitoring the analysis
        monitorAnalysis(newAnalysisId, result.analysisId);
      } catch (error) {
        console.error("Upload failed:", error);

        AnalysisStorage.update(newAnalysisId, {
          status: "error",
          errorMessage: error instanceof Error ? error.message : "Upload failed"
        });
        setUploadHistory(AnalysisStorage.getAll());
      }
    },
    [monitorAnalysis, setUploadHistory]
  );

  const deletePaper = (id: string) => {
    AnalysisStorage.delete(id);
    setUploadHistory(AnalysisStorage.getAll());
  };

  const viewPaper = (analysis: StoredAnalysis) => {
    if (analysis.paperId && analysis.status === "ready") {
      window.open(`/${analysis.paperId}`, "_blank");
    }
  };

  const copyAnalysisId = (analysisId: string) => {
    navigator.clipboard.writeText(analysisId);
    // You could add a toast notification here
  };

  const getStatusIcon = (analysis: StoredAnalysis) => {
    switch (analysis.status) {
      case "uploading":
        return <Loader2 className="w-4 h-4 text-blue-500 animate-spin" />;
      case "analyzing":
        return <Loader2 className="w-4 h-4 text-yellow-500 animate-spin" />;
      case "ready":
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case "error":
        return <AlertCircle className="w-4 h-4 text-red-500" />;
    }
  };

  const getStatusText = (analysis: StoredAnalysis) => {
    switch (analysis.status) {
      case "uploading":
        return `Uploading... ${analysis.progress || 0}%`;
      case "analyzing":
        return analysis.analysisStatus ? getAnalysisStatusText(analysis.analysisStatus) + ` ${analysis.progress || 0}%` : `Analyzing... ${analysis.progress || 0}%`;
      case "ready":
        return "Ready to view";
      case "error":
        return analysis.errorMessage || "Upload failed";
    }
  };

  const getAnalysisStatusText = (status: AnalysisStatus): string => {
    const statusTexts: Record<AnalysisStatus, string> = {
      created: "Starting analysis...",
      extracting_markdown: "Extracting text...",
      markdown_extracted: "Text extracted...",
      generating_metadata: "Generating metadata...",
      metadata_generated: "Metadata generated...",
      processing_into_blocks: "Processing blocks...",
      blocks_processed: "Blocks processed...",
      generating_quizzes: "Generating quizzes...",
      completed: "Complete!",
      errored: "Analysis failed"
    };

    return statusTexts[status] || "Processing...";
  };

  const isUploading = uploadHistory.some((analysis) => analysis.status === "uploading" || analysis.status === "analyzing");

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button className="gap-2">
            <Upload className="w-4 h-4" />
            Upload Paper
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle className="text-foreground">Upload Academic Paper</DialogTitle>
          <DialogDescription>Upload PDF files to analyze and make them easier to read with Paperly</DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Upload Area */}
          <div className="space-y-4">
            <Label className="text-sm font-medium text-foreground">Upload PDF</Label>
            <div
              className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
                dragActive ? "border-primary bg-primary/5" : "border-border hover:border-primary/50"
              } ${isUploading ? "opacity-50 pointer-events-none" : ""}`}
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
            >
              <Upload className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
              <p className="text-foreground font-medium mb-1">{isUploading ? "Processing uploads..." : "Drop PDF files here"}</p>
              <p className="text-sm text-muted-foreground mb-4">Supports PDF files up to 50MB</p>
              <Input ref={fileInputRef} type="file" accept=".pdf" multiple onChange={handleFileInput} className="hidden" id="file-upload" disabled={isUploading} />
              <Label htmlFor="file-upload" className="cursor-pointer w-full flex flex-row items-center justify-center">
                <Button variant="outline" className="pointer-events-none" disabled={isUploading}>
                  {isUploading ? "Processing..." : "Choose Files"}
                </Button>
              </Label>
            </div>
          </div>

          {/* Upload History */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-muted-foreground" />
              <Label className="text-sm font-medium text-foreground">Recent Uploads</Label>
            </div>

            <ScrollArea className="h-48 border rounded-lg">
              <div className="p-3 space-y-2">
                {uploadHistory.length === 0 ? (
                  <p className="text-center text-muted-foreground text-sm py-8">No papers uploaded yet</p>
                ) : (
                  uploadHistory.map((analysis) => (
                    <div key={analysis.id} className="flex items-center gap-3 p-3 bg-card rounded-lg border hover:bg-accent/50 transition-colors">
                      <FileText className="w-4 h-4 text-primary" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-foreground truncate">{analysis.fileName}</p>
                        <div className="flex items-center gap-2 mt-1">
                          {getStatusIcon(analysis)}
                          <span className="text-xs text-muted-foreground">
                            {getStatusText(analysis)} • {analysis.fileSize} • {analysis.uploadDate}
                          </span>
                        </div>

                        {/* Analysis ID display */}
                        {analysis.analysisId && (
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-xs text-muted-foreground font-mono">ID: {analysis.analysisId.slice(0, 8)}...</span>
                            <Button variant="ghost" size="icon" className="h-4 w-4 p-0" onClick={() => copyAnalysisId(analysis.analysisId)} title="Copy full analysis ID">
                              <Copy className="w-3 h-3" />
                            </Button>
                          </div>
                        )}

                        {/* Progress bar for active uploads */}
                        {(analysis.status === "uploading" || analysis.status === "analyzing") && (
                          <div className="w-full bg-muted rounded-full h-1.5 mt-2">
                            <div
                              className={`h-1.5 rounded-full transition-all duration-300 ${analysis.status === "uploading" ? "bg-blue-500" : "bg-yellow-500"}`}
                              style={{ width: `${analysis.progress || 0}%` }}
                            />
                          </div>
                        )}
                      </div>

                      <div className="flex items-center gap-1">
                        {analysis.status === "ready" && (
                          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => viewPaper(analysis)} title="View paper">
                            <Eye className="w-3 h-3" />
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-muted-foreground hover:text-destructive"
                          onClick={() => deletePaper(analysis.id)}
                          disabled={analysis.status === "uploading" || analysis.status === "analyzing"}
                          title="Delete"
                        >
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </ScrollArea>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
