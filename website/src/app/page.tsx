"use client";

import { samplePaper } from "@/data/sample-paper";
import { PaperScrollAnimation } from "@/components/paper-scroll-animation";
import { UploadModal } from "@/components/upload-modal";
import { Upload } from "lucide-react";

export default function Home() {
  return (
    <PaperScrollAnimation 
      actionButton={
        <UploadModal 
          trigger={
            <button className="px-8 py-3 bg-primary text-primary-foreground font-bold rounded-lg hover:bg-primary/90 transition-colors flex items-center gap-2">
              <Upload className="w-4 h-4" />
              Upload Paper
            </button>
          }
        />
      }
    />
  );
}
