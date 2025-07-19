// API configuration and utilities for Paperly backend
import { Paper, PaperBlocksResponse, convertApiBlockToFrontendBlock, PaperBlock } from "@/data/types";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000";

// Types based on OpenAPI schema
export interface FileUploadResponse {
  upload_url: string;
  key: string;
}

export type AnalysisStatus =
  | "created"
  | "extracting_markdown"
  | "markdown_extracted"
  | "generating_metadata"
  | "metadata_generated"
  | "processing_into_blocks"
  | "blocks_processed"
  | "generating_quizzes"
  | "completed"
  | "errored";

export interface CreateAnalysisRequest {
  file_key: string;
}

export interface CreateAnalysisResponse {
  analysis_id: string;
  status: AnalysisStatus;
  message: string;
}

export interface GetAnalysisResponse {
  analysis_id: string;
  status: AnalysisStatus;
  file_key: string;
  paper_id?: string;
}

export interface SummaryRequest {
  block_ids: string[];
  language?: string;
}

export interface Language {
  code: string;
  name: string;
}

export class PaperlyAPI {
  private baseUrl: string;

  constructor(baseUrl: string = API_BASE_URL) {
    this.baseUrl = baseUrl;
  }

  /**
   * Create a summary for selected blocks
   */
  async createSummary(request: SummaryRequest): Promise<ReadableStream<Uint8Array>> {
    const url = `${this.baseUrl}/summaries/`;

    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "text/event-stream"
      },
      body: JSON.stringify({
        block_ids: request.block_ids,
        language: request.language || "en"
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Failed to create summary: ${response.status} ${response.statusText} - ${errorText}`);
    }

    if (!response.body) {
      throw new Error("No response body received from summary endpoint");
    }

    return response.body;
  }

  /**
   * Parse SSE stream and extract text content
   */
  async *parseSummaryStream(stream: ReadableStream<Uint8Array>): AsyncGenerator<{ event: string; data: string }> {
    const reader = stream.getReader();
    const decoder = new TextDecoder();
    let buffer = "";

    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });

        // Split by double newlines to get complete SSE messages
        const messages = buffer.split("\n\n");
        buffer = messages.pop() || ""; // Keep the incomplete message in buffer

        for (const message of messages) {
          if (message.trim() === "") continue;

          const lines = message.split("\n");
          let event = "";
          let data = "";

          for (const line of lines) {
            if (line.startsWith("event: ")) {
              event = line.substring(7).trim();
            } else if (line.startsWith("data: ")) {
              data = line.substring(6);
            }
          }

          if (event && data !== undefined) {
            yield { event, data };
          }
        }
      }
    } finally {
      reader.releaseLock();
    }
  }

  /**
   * Get pre-signed upload URL
   */
  async getUploadUrl(): Promise<FileUploadResponse> {
    const response = await fetch(`${this.baseUrl}/papers/upload_url`);
    if (!response.ok) {
      throw new Error(`Failed to get upload URL: ${response.statusText}`);
    }
    return response.json();
  }

  /**
   * Upload file to pre-signed URL
   */
  async uploadFile(uploadUrl: string, file: File): Promise<void> {
    const response = await fetch(uploadUrl, {
      method: "PUT",
      body: file,
      headers: {
        "Content-Type": file.type
      }
    });

    if (!response.ok) {
      throw new Error(`Failed to upload file: ${response.statusText}`);
    }
  }

  /**
   * Create analysis task
   */
  async createAnalysis(fileKey: string): Promise<CreateAnalysisResponse> {
    const response = await fetch(`${this.baseUrl}/analyses/`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ file_key: fileKey })
    });

    if (!response.ok) {
      throw new Error(`Failed to create analysis: ${response.statusText}`);
    }
    return response.json();
  }

  /**
   * Get analysis status
   */
  async getAnalysis(analysisId: string): Promise<GetAnalysisResponse> {
    const response = await fetch(`${this.baseUrl}/analyses/${analysisId}`);
    if (!response.ok) {
      throw new Error(`Failed to get analysis: ${response.statusText}`);
    }
    return response.json();
  }

  /**
   * Get all papers
   */
  async getPapers(): Promise<Paper[]> {
    const response = await fetch(`${this.baseUrl}/papers/`);
    if (!response.ok) {
      throw new Error(`Failed to get papers: ${response.statusText}`);
    }
    return response.json();
  }

  /**
   * Get a specific paper
   */
  async getPaper(paperId: string): Promise<Paper> {
    const response = await fetch(`${this.baseUrl}/papers/${paperId}`);
    if (!response.ok) {
      throw new Error(`Failed to get paper: ${response.statusText}`);
    }
    return response.json();
  }

  /**
   * Get paper blocks
   */
  async getPaperBlocks(paperId: string): Promise<PaperBlocksResponse> {
    const url = `${this.baseUrl}/papers/${paperId}/blocks`;
    console.log("API: Fetching from URL:", url);

    const response = await fetch(url);

    console.log("API: Response status:", response.status);
    console.log("API: Response ok:", response.ok);

    if (!response.ok) {
      const errorText = await response.text();
      console.log("API: Error response:", errorText);
      throw new Error(`Failed to get paper blocks: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    console.log("API: Response data:", data);
    return data;
  }

  /**
   * Get paper blocks converted to frontend format
   */
  async getPaperBlocksForUI(paperId: string): Promise<PaperBlock[]> {
    console.log("API: Getting blocks for paper", paperId);
    console.log("API: Base URL:", this.baseUrl);

    const response = await this.getPaperBlocks(paperId);
    console.log("API: Raw response:", response);

    const convertedBlocks = response.blocks.map((apiBlock, index) => convertApiBlockToFrontendBlock(apiBlock, index));

    console.log("API: Converted blocks:", convertedBlocks.length);
    return convertedBlocks;
  }

  /**
   * Chat with a paper
   */
  async chatWithPaper(paperId: string, message: string, history: Array<{ role: string; content: string }> = [], language: string = "en"): Promise<Response> {
    const response = await fetch(`${this.baseUrl}/chat/${paperId}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        message,
        history,
        language
      })
    });

    if (!response.ok) {
      throw new Error(`Chat request failed: ${response.statusText}`);
    }

    return response;
  }

  /**
   * Get supported languages
   */
  async getLanguages(): Promise<Language[]> {
    const response = await fetch(`${this.baseUrl}/languages`);
    if (!response.ok) {
      throw new Error(`Failed to get languages: ${response.statusText}`);
    }
    return response.json();
  }
}

// Default API instance
export const api = new PaperlyAPI();

// Utility function for uploading and analyzing a paper
export interface UploadProgress {
  stage: "uploading" | "analyzing";
  progress: number;
  status?: AnalysisStatus;
  message?: string;
}

export async function uploadAndAnalyzePaper(file: File, onProgress?: (progress: UploadProgress) => void): Promise<{ paperId?: string; analysisId: string }> {
  try {
    // Step 1: Get upload URL
    onProgress?.({ stage: "uploading", progress: 10, message: "Getting upload URL..." });
    const { upload_url, key } = await api.getUploadUrl();

    // Step 2: Upload file
    onProgress?.({ stage: "uploading", progress: 50, message: "Uploading file..." });
    await api.uploadFile(upload_url, file);

    // Step 3: Create analysis
    onProgress?.({ stage: "uploading", progress: 100, message: "File uploaded successfully" });
    onProgress?.({ stage: "analyzing", progress: 0, message: "Starting analysis..." });

    const { analysis_id } = await api.createAnalysis(key);

    // Step 4: Monitor analysis progress
    let analysisComplete = false;
    let paperId: string | undefined;

    while (!analysisComplete) {
      await new Promise((resolve) => setTimeout(resolve, 2000)); // Wait 2 seconds

      const analysis = await api.getAnalysis(analysis_id);

      const progressMap: Record<AnalysisStatus, number> = {
        created: 10,
        extracting_markdown: 20,
        markdown_extracted: 35,
        generating_metadata: 50,
        metadata_generated: 65,
        processing_into_blocks: 75,
        blocks_processed: 85,
        generating_quizzes: 95,
        completed: 100,
        errored: 0
      };

      const progress = progressMap[analysis.status] || 0;

      onProgress?.({
        stage: "analyzing",
        progress,
        status: analysis.status,
        message: getStatusMessage(analysis.status)
      });

      if (analysis.status === "completed") {
        analysisComplete = true;
        paperId = analysis.paper_id;
      } else if (analysis.status === "errored") {
        throw new Error("Analysis failed");
      }
    }

    return { paperId, analysisId: analysis_id };
  } catch (error) {
    console.error("Upload and analysis failed:", error);
    throw error;
  }
}

function getStatusMessage(status: AnalysisStatus): string {
  switch (status) {
    case "created":
      return "Analysis task created";
    case "extracting_markdown":
      return "Extracting content from PDF...";
    case "markdown_extracted":
      return "Content extracted successfully";
    case "generating_metadata":
      return "Analyzing document structure...";
    case "metadata_generated":
      return "Document structure analyzed";
    case "processing_into_blocks":
      return "Processing content blocks...";
    case "blocks_processed":
      return "Content blocks processed";
    case "generating_quizzes":
      return "Generating interactive quizzes...";
    case "completed":
      return "Analysis completed successfully";
    case "errored":
      return "Analysis failed";
    default:
      return "Processing...";
  }
}
