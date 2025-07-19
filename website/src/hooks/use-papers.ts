import { useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { PaperBlock, PaperSection, BlockKind } from "@/data/types";

// Query Keys
export const paperKeys = {
  all: ["papers"] as const,
  lists: () => [...paperKeys.all, "list"] as const,
  list: (filters: Record<string, unknown>) => [...paperKeys.lists(), { filters }] as const,
  details: () => [...paperKeys.all, "detail"] as const,
  detail: (id: string) => [...paperKeys.details(), id] as const,
  blocks: (id: string) => [...paperKeys.detail(id), "blocks"] as const,
  sections: (id: string) => [...paperKeys.detail(id), "sections"] as const
};

// Helper function to organize blocks into sections
function organizeBlocksIntoSections(blocks: PaperBlock[]): PaperSection[] {
  const sections: PaperSection[] = [];
  let currentSection: PaperSection | null = null;

  blocks.forEach((block) => {
    if (block.kind === BlockKind.HEADER && block.level <= 2) {
      // Create a new section for H1 and H2 headers
      if (currentSection) {
        sections.push(currentSection);
      }

      currentSection = {
        id: `section-${block.id}`,
        title: block.text,
        level: block.level,
        blocks: [block]
      };
    } else {
      // Add block to current section, or create a default section if none exists
      if (!currentSection) {
        currentSection = {
          id: "section-default",
          title: "Content",
          level: 1,
          blocks: []
        };
      }
      currentSection.blocks.push(block);
    }
  });

  // Don't forget the last section
  if (currentSection) {
    sections.push(currentSection);
  }

  return sections;
}

// Custom Hooks

/**
 * Get all papers
 */
export function usePapers() {
  return useQuery({
    queryKey: paperKeys.lists(),
    queryFn: () => api.getPapers(),
    staleTime: 2 * 60 * 1000 // 2 minutes
  });
}

/**
 * Get a specific paper
 */
export function usePaper(paperId: string) {
  return useQuery({
    queryKey: paperKeys.detail(paperId),
    queryFn: () => api.getPaper(paperId),
    enabled: !!paperId,
    staleTime: 15 * 60 * 1000 // 15 minutes - papers don't change often
  });
}

/**
 * Get paper blocks
 */
export function usePaperBlocks(paperId: string) {
  return useQuery({
    queryKey: paperKeys.blocks(paperId),
    queryFn: () => api.getPaperBlocksForUI(paperId),
    enabled: !!paperId,
    staleTime: 15 * 60 * 1000 // 15 minutes - paper content is static
  });
}

/**
 * Get paper sections (organized blocks)
 */
export function usePaperSections(paperId: string) {
  return useQuery({
    queryKey: paperKeys.sections(paperId),
    queryFn: async () => {
      console.log("usePaperSections: fetching blocks for", paperId);
      const blocks = await api.getPaperBlocksForUI(paperId);
      console.log("usePaperSections: got blocks", blocks.length);
      const sections = organizeBlocksIntoSections(blocks);
      console.log("usePaperSections: organized into sections", sections.length);
      return sections;
    },
    enabled: !!paperId,
    staleTime: 15 * 60 * 1000 // 15 minutes - sections derived from static content
  });
}

/**
 * Get paper with blocks in parallel (most efficient for paper pages)
 * Optimized for instant navigation - only shows loading when no cached data exists
 */
export function usePaperData(paperId: string) {
  const paperQuery = usePaper(paperId);
  const blocksQuery = usePaperBlocks(paperId);
  const sectionsQuery = usePaperSections(paperId);

  console.log("usePaperData debug:", {
    paperId,
    paper: !!paperQuery.data,
    blocks: !!blocksQuery.data,
    sections: !!sectionsQuery.data,
    sectionsLoading: sectionsQuery.isLoading,
    sectionsError: sectionsQuery.isError,
    sectionsEnabled: sectionsQuery.enabled
  });

  // Check if we have any cached data
  const hasCachedData = !!(paperQuery.data || blocksQuery.data || sectionsQuery.data);

  // Only show loading if we have no cached data at all
  const isInitialLoading = !hasCachedData && (paperQuery.isLoading || blocksQuery.isLoading || sectionsQuery.isLoading);

  // Show loading for background refetches only if explicitly fetching
  const isRefetching = paperQuery.isFetching || blocksQuery.isFetching || sectionsQuery.isFetching;

  return {
    paper: paperQuery.data,
    blocks: blocksQuery.data,
    sections: sectionsQuery.data,
    isLoading: isInitialLoading,
    isRefetching,
    isError: paperQuery.isError || blocksQuery.isError || sectionsQuery.isError,
    error: paperQuery.error || blocksQuery.error || sectionsQuery.error,
    isSuccess: paperQuery.isSuccess && blocksQuery.isSuccess && sectionsQuery.isSuccess,
    // Additional state for better UX
    hasCachedData,
    isStale: paperQuery.isStale || blocksQuery.isStale || sectionsQuery.isStale
  };
}

/**
 * Prefetch paper data
 */
export function usePrefetchPaper() {
  const queryClient = useQueryClient();

  const prefetchPaper = (paperId: string) => {
    // Prefetch paper details
    queryClient.prefetchQuery({
      queryKey: paperKeys.detail(paperId),
      queryFn: () => api.getPaper(paperId),
      staleTime: 5 * 60 * 1000
    });

    // Prefetch paper blocks
    queryClient.prefetchQuery({
      queryKey: paperKeys.blocks(paperId),
      queryFn: () => api.getPaperBlocksForUI(paperId),
      staleTime: 5 * 60 * 1000
    });

    // Prefetch paper sections
    queryClient.prefetchQuery({
      queryKey: paperKeys.sections(paperId),
      queryFn: async () => {
        const blocks = await api.getPaperBlocksForUI(paperId);
        return organizeBlocksIntoSections(blocks);
      },
      staleTime: 5 * 60 * 1000
    });
  };

  return { prefetchPaper };
}

/**
 * Prefetch adjacent sections for smoother navigation
 */
export function usePrefetchAdjacentSections() {
  const queryClient = useQueryClient();

  const prefetchAdjacentSections = (paperId: string, currentSectionIndex: number, totalSections: number) => {
    // Prefetch previous section
    if (currentSectionIndex > 0) {
      queryClient.prefetchQuery({
        queryKey: paperKeys.sections(paperId),
        queryFn: async () => {
          const blocks = await api.getPaperBlocksForUI(paperId);
          return organizeBlocksIntoSections(blocks);
        },
        staleTime: 10 * 60 * 1000
      });
    }

    // Prefetch next section
    if (currentSectionIndex < totalSections - 1) {
      queryClient.prefetchQuery({
        queryKey: paperKeys.sections(paperId),
        queryFn: async () => {
          const blocks = await api.getPaperBlocksForUI(paperId);
          return organizeBlocksIntoSections(blocks);
        },
        staleTime: 10 * 60 * 1000
      });
    }
  };

  return { prefetchAdjacentSections };
}

/**
 * Invalidate and refetch paper data
 */
export function useInvalidatePaper() {
  const queryClient = useQueryClient();

  const invalidatePaper = (paperId: string) => {
    queryClient.invalidateQueries({ queryKey: paperKeys.detail(paperId) });
  };

  const invalidateAllPapers = () => {
    queryClient.invalidateQueries({ queryKey: paperKeys.all });
  };

  return { invalidatePaper, invalidateAllPapers };
}
