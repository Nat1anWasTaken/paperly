"use client";

import { useState, useCallback } from "react";
import { Upload, FileText, Clock, Trash2, Eye } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";

interface UploadedPaper {
  id: string;
  name: string;
  size: string;
  uploadDate: string;
  status: 'processing' | 'ready' | 'error';
}

interface UploadModalProps {
  trigger?: React.ReactNode;
}

export function UploadModal({ trigger }: UploadModalProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadHistory, setUploadHistory] = useState<UploadedPaper[]>([
    {
      id: "1",
      name: "Deep Learning Fundamentals.pdf",
      size: "2.4 MB",
      uploadDate: "2 hours ago",
      status: "ready"
    },
    {
      id: "2", 
      name: "Neural Networks and Backpropagation.pdf",
      size: "1.8 MB",
      uploadDate: "1 day ago", 
      status: "ready"
    },
    {
      id: "3",
      name: "Transformer Architecture.pdf",
      size: "3.1 MB",
      uploadDate: "3 days ago",
      status: "processing"
    }
  ]);

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
  }, []);

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    handleFiles(files);
  };

  const handleFiles = async (files: File[]) => {
    const pdfFiles = files.filter(file => file.type === "application/pdf");
    
    if (pdfFiles.length === 0) {
      alert("Please upload PDF files only.");
      return;
    }

    for (const file of pdfFiles) {
      await uploadFile(file);
    }
  };

  const uploadFile = async (file: File) => {
    setUploading(true);
    setUploadProgress(0);

    // Simulate upload progress
    const interval = setInterval(() => {
      setUploadProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          setUploading(false);
          
          // Add to history
          const newPaper: UploadedPaper = {
            id: Date.now().toString(),
            name: file.name,
            size: `${(file.size / (1024 * 1024)).toFixed(1)} MB`,
            uploadDate: "Just now",
            status: "processing"
          };
          
          setUploadHistory(prev => [newPaper, ...prev]);
          
          // Simulate processing completion
          setTimeout(() => {
            setUploadHistory(prev => 
              prev.map(paper => 
                paper.id === newPaper.id 
                  ? { ...paper, status: "ready" as const }
                  : paper
              )
            );
          }, 3000);
          
          return 100;
        }
        return prev + 10;
      });
    }, 200);
  };

  const deletePaper = (id: string) => {
    setUploadHistory(prev => prev.filter(paper => paper.id !== id));
  };

  const getStatusIcon = (status: UploadedPaper['status']) => {
    switch (status) {
      case 'processing':
        return <div className="w-2 h-2 bg-yellow-500 rounded-full animate-pulse" />;
      case 'ready':
        return <div className="w-2 h-2 bg-green-500 rounded-full" />;
      case 'error':
        return <div className="w-2 h-2 bg-red-500 rounded-full" />;
    }
  };

  const getStatusText = (status: UploadedPaper['status']) => {
    switch (status) {
      case 'processing':
        return 'Processing...';
      case 'ready':
        return 'Ready';
      case 'error':
        return 'Error';
    }
  };

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
          <DialogDescription>
            Upload PDF files to make them easier to read with Paperly
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Upload Area */}
          <div className="space-y-4">
            <Label className="text-sm font-medium text-foreground">Upload PDF</Label>
            <div
              className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
                dragActive 
                  ? 'border-primary bg-primary/5' 
                  : 'border-border hover:border-primary/50'
              }`}
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
            >
              <Upload className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
              <p className="text-foreground font-medium mb-1">
                Drop PDF files here or click to browse
              </p>
              <p className="text-sm text-muted-foreground mb-4">
                Supports PDF files up to 10MB
              </p>
              <Input
                type="file"
                accept=".pdf"
                multiple
                onChange={handleFileInput}
                className="hidden"
                id="file-upload"
              />
              <Label htmlFor="file-upload" className="cursor-pointer">
                <Button variant="outline" className="pointer-events-none">
                  Choose Files
                </Button>
              </Label>
            </div>

            {/* Upload Progress */}
            {uploading && (
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-foreground">Uploading...</span>
                  <span className="text-muted-foreground">{uploadProgress}%</span>
                </div>
                <div className="w-full bg-muted rounded-full h-2">
                  <div 
                    className="bg-primary h-2 rounded-full transition-all duration-300"
                    style={{ width: `${uploadProgress}%` }}
                  />
                </div>
              </div>
            )}
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
                  <p className="text-center text-muted-foreground text-sm py-8">
                    No papers uploaded yet
                  </p>
                ) : (
                  uploadHistory.map((paper) => (
                    <div
                      key={paper.id}
                      className="flex items-center gap-3 p-3 bg-card rounded-lg border hover:bg-accent/50 transition-colors"
                    >
                      <FileText className="w-4 h-4 text-primary" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-foreground truncate">
                          {paper.name}
                        </p>
                        <div className="flex items-center gap-2 mt-1">
                          {getStatusIcon(paper.status)}
                          <span className="text-xs text-muted-foreground">
                            {getStatusText(paper.status)} • {paper.size} • {paper.uploadDate}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        {paper.status === 'ready' && (
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <Eye className="w-3 h-3" />
                          </Button>
                        )}
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-8 w-8 text-muted-foreground hover:text-destructive"
                          onClick={() => deletePaper(paper.id)}
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