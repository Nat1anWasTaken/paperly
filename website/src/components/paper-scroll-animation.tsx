"use client";

import { useState, useEffect } from "react";
import { ThreeDMarquee } from "@/components/ui/3d-marquee";

// Generate image paths for each paper
const generateImagePaths = (paperId: string, maxPages: number) => {
  const paths = [];
  for (let i = 1; i <= maxPages; i++) {
    const pageNum = i.toString().padStart(4, "0");
    paths.push(`/asset/${paperId}/${paperId}_page-${pageNum}.webp`);
  }
  return paths;
};

// Special function for the psychology paper with different naming convention
const generatePsychologyImagePaths = (paperId: string, maxPages: number) => {
  const paths = [];
  for (let i = 1; i <= maxPages; i++) {
    const pageNum = i.toString().padStart(4, "0");
    paths.push(`/asset/${paperId}/${paperId}-${pageNum}.webp`);
  }
  return paths;
};

const papers = [
  {
    title: "Attention Is All You Need",
    subtitle:
      "Transformers: A Revolutionary Architecture for Natural Language Processing",
    images: generateImagePaths("1706.03762v7", 15),
  },
  {
    title: "PLOS ONE Research Paper",
    subtitle: "Computational Biology and Interdisciplinary Research Methods",
    images: generateImagePaths("journal.pone.0283170", 10),
  },
  {
    title: "Educational Technology Research",
    subtitle: "Smart Learning Environments and Digital Innovation",
    images: generateImagePaths("s40561-025-00377-2", 28),
  },
  {
    title: "Using Thematic Analysis in Psychology",
    subtitle: "Qualitative Research Methods and Data Analysis Techniques",
    images: generatePsychologyImagePaths(
      "Using_thematic_analysis_in_psychology_page",
      43
    ),
  },
];

interface PaperScrollAnimationProps {
  actionButton: React.ReactNode;
}

export function PaperScrollAnimation({
  actionButton,
}: PaperScrollAnimationProps) {
  const [imagesLoaded, setImagesLoaded] = useState(false);
  const [loadedImages, setLoadedImages] = useState(new Set());

  // Combine all paper images into one array for the marquee
  const allImages = papers.flatMap((paper) => paper.images);

  // Preload all images
  useEffect(() => {
    let loadedCount = 0;

    const preloadImage = (src: string) => {
      return new Promise((resolve) => {
        const img = new Image();
        img.onload = () => {
          loadedCount++;
          setLoadedImages((prev) => new Set([...prev, src]));
          if (loadedCount === allImages.length) {
            setImagesLoaded(true);
          }
          resolve(src);
        };
        img.onerror = () => {
          loadedCount++;
          if (loadedCount === allImages.length) {
            setImagesLoaded(true);
          }
          resolve(src);
        };
        img.src = src;
      });
    };

    // Preload all images
    Promise.all(allImages.map(preloadImage));
  }, [allImages]);

  if (!imagesLoaded) {
    return (
      <div className="min-h-screen bg-background text-foreground flex items-center justify-center">
        <div className="text-center">
          <div className="loading-spinner mb-4"></div>
          <h1 className="text-4xl font-bold text-foreground mb-4">PAPERLY</h1>
          <p className="text-lg text-muted-foreground mb-4">
            Loading papers...
          </p>
          <div className="w-64 bg-muted rounded-full h-2">
            <div
              className="bg-primary h-2 rounded-full transition-all duration-300"
              style={{
                width: `${(loadedImages.size / allImages.length) * 100}%`,
              }}
            ></div>
          </div>
          <p className="text-sm text-muted-foreground mt-2">
            {loadedImages.size} / {allImages.length} images loaded
          </p>
        </div>

        <style jsx>{`
          .loading-spinner {
            width: 50px;
            height: 50px;
            border: 4px solid var(--muted);
            border-top: 4px solid var(--primary);
            border-radius: 50%;
            animation: spin 1s linear infinite;
            margin: 0 auto;
          }

          @keyframes spin {
            0% {
              transform: rotate(0deg);
            }
            100% {
              transform: rotate(360deg);
            }
          }
        `}</style>
      </div>
    );
  }

  return (
    <div className="h-screen bg-background text-foreground overflow-hidden relative">
      {/* Full screen background animation */}
      <div className="absolute inset-0 w-full h-full">
        <ThreeDMarquee images={allImages} className="w-full h-full" />
      </div>

      {/* Header with background */}
      <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-20 text-center">
        <div className="bg-background/90 backdrop-blur-sm px-8 py-6 border border-border/20 shadow-lg">
          <h1 className="text-5xl font-bold text-foreground mb-4">PAPERLY</h1>
          <div className="bg-muted/80 backdrop-blur-sm px-4 py-2 border border-border/10">
            <p className="text-lg text-muted-foreground">
              Making academic papers easier to read and learn
            </p>
          </div>
        </div>
      </div>

      {/* Action button (Upload Paper or other action) */}
      <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 z-20">
        {actionButton}
      </div>
    </div>
  );
}
