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

interface PaperSection {
  id: string;
  title: string;
  level: number; // 1 for main sections, 2 for subsections, etc.
}

interface MainLayoutProps {
  children: React.ReactNode;
  paperTitle?: string;
  paperSections?: PaperSection[];
}

export function MainLayout({
  children,
  paperTitle = "Sample Research Paper",
  paperSections = [
    { id: "introduction", title: "Introduction", level: 1 },
    { id: "related-work", title: "Related Work", level: 1 },
    { id: "method", title: "Method", level: 1 },
    { id: "experiments", title: "Experiments", level: 1 },
    { id: "experimental-setup", title: "Experimental Setup", level: 2 },
    { id: "results", title: "Results", level: 2 },
    { id: "discussion", title: "Discussion", level: 1 },
    { id: "conclusion", title: "Conclusion", level: 1 },
  ],
}: MainLayoutProps) {
  const [activeSectionId, setActiveSectionId] = React.useState<string>("");
  const [isSidebarCollapsed, setIsSidebarCollapsed] =
    React.useState<boolean>(false);

  const scrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: "smooth" });
      setActiveSectionId(sectionId);
    }
  };

  const toggleSidebar = () => {
    setIsSidebarCollapsed(!isSidebarCollapsed);
  };

  return (
    <div className="flex h-screen bg-background">
      <div className="w-full">
        <ResizablePanelGroup direction="horizontal" className="h-screen">
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
                  activeSectionId={activeSectionId}
                  onSectionClick={scrollToSection}
                  onToggleSidebar={toggleSidebar}
                />
              </ResizablePanel>

              <ResizableHandle withHandle />
            </>
          )}

          {/* Main Content Area */}
          <ResizablePanel
            defaultSize={isSidebarCollapsed ? 75 : 55}
            minSize={30}
          >
            <main className="h-full overflow-y-auto">
              <PaperHeader
                paperTitle={paperTitle}
                onToggleSidebar={toggleSidebar}
              />

              <div className="max-w-4xl mx-auto px-8 pb-8">
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
            <AiChat />
          </ResizablePanel>
        </ResizablePanelGroup>
      </div>
    </div>
  );
}
