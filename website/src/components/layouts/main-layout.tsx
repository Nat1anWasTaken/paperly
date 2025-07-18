"use client";

import * as React from "react";
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from "@/components/ui/resizable";
import { AiChat } from "./ai-chat";
import { PaperNavigation } from "./paper-navigation";
import { PaperHeader } from "./paper-header";
import { PaperNavigationFooter } from "./paper-navigation-footer";
import { SelectionProvider } from "@/contexts/selection-context";
import { SelectionToolbar } from "@/components/selection-toolbar";
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
  const [isSidebarCollapsed, setIsSidebarCollapsed] = React.useState(false);
  const [activeSectionId, setActiveSectionId] = React.useState(currentSectionId);

  const toggleSidebar = () => {
    setIsSidebarCollapsed(!isSidebarCollapsed);
  };

  // Extract sections from paper data
  const paperSections: PaperSection[] = React.useMemo(() => {
    return paperData.pages.flatMap(page => page.sections);
  }, [paperData.pages]);

  const scrollToSection = (sectionId: string) => {
    setActiveSectionId(sectionId);
    
    // Find the section element and scroll to it
    const element = document.getElementById(sectionId);
    if (element) {
      const rect = element.getBoundingClientRect();
      const mainContent = element.closest('main');
      if (mainContent) {
        mainContent.scrollTo({
          top: mainContent.scrollTop + rect.top - 100, // 100px offset from top
          behavior: 'smooth'
        });
      }
    } else {
      // If element not found on current page, navigate to it
      const targetSectionUrl = `/${paperData.paper.id}/${sectionId}`;
      if (window.location.pathname !== targetSectionUrl) {
        window.location.href = targetSectionUrl;
      }
    }
  };

  // Calculate current section index for navigation footer
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
    <SelectionProvider>
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

        {/* Selection Toolbar - Shows when blocks are selected */}
        <SelectionToolbar />
      </div>
    </SelectionProvider>
  );
}
