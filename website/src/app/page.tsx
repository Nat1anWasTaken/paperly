"use client";

import { PaperScrollAnimation } from "@/components/paper-scroll-animation";
import { UploadModal } from "@/components/upload-modal";
import { Button } from "@/components/ui/button";
import { Upload, FileText } from "lucide-react";
import Link from "next/link";

export default function Home() {
  return (
    <div className="relative">
      {/* Top Navigation */}
      <div className="absolute top-4 right-4 z-50">
        <Link href="/papers">
          <Button variant="secondary" className="shadow-lg backdrop-blur-sm border border-border">
            <FileText className="w-4 h-4" />
            View Papers
          </Button>
        </Link>
      </div>

      <PaperScrollAnimation
        actionButton={
          <UploadModal
            trigger={
              <Button variant="default" size="lg" className="font-bold">
                <Upload className="w-4 h-4" />
                Upload Paper
              </Button>
            }
          />
        }
      />
    </div>
  );
}
