import { useQuery, useMutation } from "@tanstack/react-query";
import { api } from "@/lib/api";

// Query Keys
export const analysisKeys = {
  all: ["analysis"] as const,
  analysis: (id: string) => [...analysisKeys.all, "detail", id] as const,
};

/**
 * Get analysis status with polling
 */
export function useAnalysis(analysisId: string, enabled = true) {
  return useQuery({
    queryKey: analysisKeys.analysis(analysisId),
    queryFn: () => api.getAnalysis(analysisId),
    enabled: enabled && !!analysisId,
    refetchInterval: (query) => {
      // Stop polling when analysis is complete or errored
      if (query.state.data?.status === 'completed' || query.state.data?.status === 'errored') {
        return false;
      }
      // Poll every 2 seconds while analysis is in progress
      return 2000;
    },
    staleTime: 0, // Always fetch fresh data for analysis status
  });
}

/**
 * Upload file mutation
 */
export function useUploadFile() {
  return useMutation({
    mutationFn: async ({ uploadUrl, file }: { uploadUrl: string; file: File }) => {
      return api.uploadFile(uploadUrl, file);
    },
  });
}

/**
 * Get upload URL mutation
 */
export function useGetUploadUrl() {
  return useMutation({
    mutationFn: () => api.getUploadUrl(),
  });
}

/**
 * Create analysis mutation
 */
export function useCreateAnalysis() {
  return useMutation({
    mutationFn: (fileKey: string) => api.createAnalysis(fileKey),
  });
}

/**
 * Create summary mutation with streaming
 */
export function useCreateSummary() {
  return useMutation({
    mutationFn: async ({
      block_ids,
      language = 'en_US',
    }: {
      block_ids: string[];
      language?: string;
    }) => {
      return api.createSummary({ block_ids, language });
    },
  });
}

/**
 * Chat with paper mutation
 */
export function useChatWithPaper() {
  return useMutation({
    mutationFn: async ({
      paperId,
      message,
      history = [],
      language = 'en_US',
    }: {
      paperId: string;
      message: string;
      history?: Array<{ role: string; content: string }>;
      language?: string;
    }) => {
      return api.chatWithPaper(paperId, message, history, language);
    },
  });
} 