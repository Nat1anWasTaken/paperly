"use client";

import * as React from "react";
import {
  ResizablePanelGroup,
  ResizablePanel,
  ResizableHandle,
} from "@/components/ui/resizable";
import { PaperNavigation } from "./paper-navigation";
import { PaperHeader } from "./paper-header";
import { AiChat } from "./ai-chat";
import { PaperNavigationFooter } from "./paper-navigation-footer";
import { PaperData, PaperSection } from "@/data/types";

interface MainLayoutProps {
  children: React.ReactNode;
  paperData: PaperData;
  currentSectionId?: string;
}

export function MainLayout({
  children,
  paperData,
  currentSectionId = "",
}: MainLayoutProps) {
  const [activeSectionId, setActiveSectionId] =
    React.useState<string>(currentSectionId);
  const [currentPage, setCurrentPage] = React.useState<number>(1);
  const [isSidebarCollapsed, setIsSidebarCollapsed] =
    React.useState<boolean>(false);

  // Get ALL sections from the entire paper for navigation
  const paperSections: PaperSection[] = paperData.pages.flatMap(
    (page) => page.sections
  );

  const scrollToSection = (sectionId: string) => {
    // For URL-based navigation, we'll navigate to the section route
    setActiveSectionId(sectionId);

    // Navigate to the section route
    window.location.href = `/${paperData.paper.id}/${sectionId}`;
  };

  const toggleSidebar = () => {
    setIsSidebarCollapsed(!isSidebarCollapsed);
  };

  // Calculate current section index for navigation
  const currentSectionIndex = paperSections.findIndex(
    (section) => section.id === (currentSectionId || activeSectionId)
  );

  const handleSectionNavigation = (direction: "prev" | "next") => {
    const newIndex =
      direction === "prev" ? currentSectionIndex - 1 : currentSectionIndex + 1;
    if (newIndex >= 0 && newIndex < paperSections.length) {
      const newSectionId = paperSections[newIndex].id;
      scrollToSection(newSectionId);
    }
  };

  return (
    <div className="h-screen w-full bg-background">
      <ResizablePanelGroup direction="horizontal" className="h-full">
        {/* Left Sidebar - Paper Navigation */}
        {!isSidebarCollapsed && (
          <>
            <ResizablePanel
              defaultSize={20}
              minSize={15}
              maxSize={35}
              className="border-r"
            >
              <PaperNavigation
                paperSections={paperSections}
                activeSectionId={currentSectionId || activeSectionId}
                onSectionClick={scrollToSection}
                onToggleSidebar={toggleSidebar}
                paperId={paperData.paper.id}
              />
            </ResizablePanel>

            <ResizableHandle withHandle />
          </>
        )}

        {/* Main Content Area */}
        <ResizablePanel
          className="h-screen overflow-y-hidden"
          defaultSize={isSidebarCollapsed ? 75 : 55}
          minSize={30}
        >
          <main className="overflow-y-auto h-screen">
            <PaperHeader
              paperTitle={paperData.paper.title}
              onToggleSidebar={toggleSidebar}
            />

            <div className="max-w-4xl mx-auto px-8 pb-12 max-h-screen">
              <div className="paper-content">{children}</div>
            </div>
          </main>
        </ResizablePanel>

        <ResizableHandle withHandle />

        {/* Right Sidebar - AI Chat */}
        <ResizablePanel
          defaultSize={25}
          minSize={20}
          maxSize={40}
          className="border-l"
        >
          <AiChat paperId={paperData.paper.id} />
        </ResizablePanel>
      </ResizablePanelGroup>

      {/* Bottom Navigation Footer - Fixed positioned, doesn't affect layout */}
      <PaperNavigationFooter
        currentSectionIndex={currentSectionIndex}
        totalSections={paperSections.length}
        currentSectionTitle={paperSections[currentSectionIndex]?.title || ""}
        onSectionNavigation={handleSectionNavigation}
      />
    </div>
  );
}
