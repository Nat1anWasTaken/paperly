"use client";

import { samplePaper } from "@/data/sample-paper";
import { PaperScrollAnimation } from "@/components/paper-scroll-animation";
import { UploadModal } from "@/components/upload-modal";
import { Upload, FileText } from "lucide-react";
import Link from "next/link";

export default function Home() {
  return (
    <div className="relative">
      {/* Top Navigation */}
      <div className="absolute top-4 right-4 z-50">
        <Link href="/papers">
          <button className="px-6 py-2 bg-secondary text-secondary-foreground font-medium rounded-lg hover:bg-secondary/80 transition-colors flex items-center gap-2 shadow-lg backdrop-blur-sm border border-border">
            <FileText className="w-4 h-4" />
            View Papers
          </button>
        </Link>
      </div>

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
    </div>
  );
}
