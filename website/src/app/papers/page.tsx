"use client";

import * as React from "react";

import { usePapers, usePrefetchPaper } from "@/hooks/use-papers";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ThemeToggle } from "@/components/theme-toggle";
import { FileText, Home, Calendar, ExternalLink, Loader2, AlertCircle, Clock, Plus, Search, X } from "lucide-react";
import Link from "next/link";

export default function PapersPage() {
  const [searchQuery, setSearchQuery] = React.useState("");
  const { data: papers = [], isLoading: loading, error } = usePapers();
  const { prefetchPaper } = usePrefetchPaper();

  // Filter papers based on search query
  const filteredPapers = React.useMemo(() => {
    if (!searchQuery.trim()) return papers;
    
    return papers.filter(paper =>
      paper.title.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [papers, searchQuery]);

  const formatDate = (dateString?: string) => {
    if (!dateString) return "Unknown date";
    try {
      return new Date(dateString).toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
      });
    } catch {
      return "Invalid date";
    }
  };

  const getTimeAgo = (dateString?: string) => {
    if (!dateString) return "Unknown";
    try {
      const date = new Date(dateString);
      const now = new Date();
      const diffInMs = now.getTime() - date.getTime();
      const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));
      
      if (diffInDays === 0) return "Today";
      if (diffInDays === 1) return "Yesterday";
      if (diffInDays < 7) return `${diffInDays} days ago`;
      if (diffInDays < 30) return `${Math.floor(diffInDays / 7)} weeks ago`;
      if (diffInDays < 365) return `${Math.floor(diffInDays / 30)} months ago`;
      return `${Math.floor(diffInDays / 365)} years ago`;
    } catch {
      return "Unknown";
    }
  };

  const clearSearch = () => {
    setSearchQuery("");
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-background/95 backdrop-blur-xl border-b border-border/50">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/">
                <Button variant="ghost" size="sm" className="flex items-center gap-2 hover:bg-accent/50">
                  <Home className="w-4 h-4" />
                  Home
                </Button>
              </Link>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                  <FileText className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-foreground">Papers Library</h1>
                  <p className="text-sm text-muted-foreground">Manage and view your research papers</p>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Link href="/">
                <Button size="sm" className="flex items-center gap-2">
                  <Plus className="w-4 h-4" />
                  Upload Paper
                </Button>
              </Link>
              <ThemeToggle />
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-6 py-8">
        {loading && (
          <div className="flex items-center justify-center py-20">
            <div className="text-center">
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Loading your papers</h3>
              <p className="text-muted-foreground">Please wait while we fetch your library...</p>
            </div>
          </div>
        )}

        {error && (
          <div className="flex items-center justify-center py-20">
            <div className="text-center max-w-md">
              <div className="w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center mx-auto mb-4">
                <AlertCircle className="w-8 h-8 text-destructive" />
              </div>
              <h3 className="text-xl font-semibold mb-2 text-foreground">Failed to load papers</h3>
              <p className="text-muted-foreground mb-6">{error instanceof Error ? error.message : "Failed to load papers"}</p>
              <Button onClick={() => window.location.reload()} className="flex items-center gap-2">
                <Loader2 className="w-4 h-4" />
                Try Again
              </Button>
            </div>
          </div>
        )}

        {!loading && !error && (
          <>
            {/* Search Bar */}
            {papers.length > 0 && (
              <div className="mb-8">
                <div className="max-w-md">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      type="text"
                      placeholder="Search papers by title..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10 pr-10 h-11 text-base"
                    />
                    {searchQuery && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={clearSearch}
                        className="absolute right-1 top-1/2 transform -translate-y-1/2 h-8 w-8 p-0 hover:bg-muted"
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                  {searchQuery && (
                    <p className="text-sm text-muted-foreground mt-2">
                      {filteredPapers.length} {filteredPapers.length === 1 ? "paper" : "papers"} found for &ldquo;{searchQuery}&rdquo;
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* Stats Bar */}
            <div className="mb-8">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-semibold text-foreground">
                    {searchQuery ? filteredPapers.length : papers.length} {(searchQuery ? filteredPapers.length : papers.length) === 1 ? "Paper" : "Papers"}
                  </h2>
                  <p className="text-sm text-muted-foreground">
                    {searchQuery ? "Search results" : "Your research collection"}
                  </p>
                </div>
                {papers.length > 0 && !searchQuery && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Clock className="w-4 h-4" />
                    Last updated {getTimeAgo(papers[0]?.created_at)}
                  </div>
                )}
              </div>
            </div>

            {papers.length === 0 ? (
              <div className="text-center py-20">
                <div className="w-20 h-20 rounded-2xl bg-muted/50 flex items-center justify-center mx-auto mb-6">
                  <FileText className="w-10 h-10 text-muted-foreground/50" />
                </div>
                <h3 className="text-2xl font-semibold mb-3 text-foreground">No papers yet</h3>
                <p className="text-muted-foreground mb-8 max-w-md mx-auto">
                  Your library is empty. Upload your first research paper to start building your collection.
                </p>
                <Link href="/">
                  <Button size="lg" className="flex items-center gap-2">
                    <Plus className="w-5 h-5" />
                    Upload Your First Paper
                  </Button>
                </Link>
              </div>
            ) : filteredPapers.length === 0 ? (
              <div className="text-center py-20">
                <div className="w-20 h-20 rounded-2xl bg-muted/50 flex items-center justify-center mx-auto mb-6">
                  <Search className="w-10 h-10 text-muted-foreground/50" />
                </div>
                <h3 className="text-2xl font-semibold mb-3 text-foreground">No papers found</h3>
                <p className="text-muted-foreground mb-8 max-w-md mx-auto">
                  No papers match your search for &ldquo;{searchQuery}&rdquo;. Try a different search term.
                </p>
                <Button onClick={clearSearch} variant="outline" className="flex items-center gap-2">
                  <X className="w-4 h-4" />
                  Clear Search
                </Button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredPapers.map((paper, index) => (
                  <div
                    key={paper._id || index}
                    className="group relative bg-card border border-border rounded-xl p-6 hover:shadow-lg hover:shadow-primary/5 transition-all duration-300 hover:border-primary/20 hover:-translate-y-1"
                    onMouseEnter={() => {
                      // Prefetch paper data on hover for better UX
                      if (paper._id) {
                        prefetchPaper(paper._id);
                      }
                    }}
                  >
                    {/* Paper Icon */}
                    <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary/15 transition-colors">
                      <FileText className="w-6 h-6 text-primary" />
                    </div>

                    {/* Content */}
                    <div className="mb-4">
                      <h3 className="font-semibold text-foreground text-lg leading-tight mb-2 line-clamp-2">
                        {searchQuery ? (
                          <span
                            dangerouslySetInnerHTML={{
                              __html: paper.title.replace(
                                new RegExp(`(${searchQuery})`, 'gi'),
                                '<mark class="bg-primary/20 text-primary font-semibold">$1</mark>'
                              )
                            }}
                          />
                        ) : (
                          paper.title
                        )}
                      </h3>
                      
                      <div className="flex items-center gap-2 text-sm text-muted-foreground mb-3">
                        <Calendar className="w-4 h-4" />
                        <span>{formatDate(paper.created_at)}</span>
                        <span className="w-1 h-1 bg-muted-foreground rounded-full"></span>
                        <span>{getTimeAgo(paper.created_at)}</span>
                      </div>
                    </div>

                    {/* Action */}
                    <Link href={`/${paper._id || 'unknown'}`} className="block">
                      <Button 
                        size="sm" 
                        className="w-full flex items-center justify-center gap-2 group-hover:bg-primary group-hover:text-primary-foreground transition-all"
                        variant="outline"
                      >
                        <ExternalLink className="w-4 h-4" />
                        Read Paper
                      </Button>
                    </Link>

                    {/* Hover Effect */}
                    <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
} 