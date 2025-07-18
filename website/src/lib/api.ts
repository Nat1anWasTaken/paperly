// API configuration and utilities for Paperly backend
const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000';

// Types based on OpenAPI schema
export interface FileUploadResponse {
  upload_url: string;
  key: string;
}

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

export type AnalysisStatus = 
  | "created"
  | "extracting_markdown"
  | "markdown_extracted"
  | "generating_metadata"
  | "metadata_generated"
  | "processing_into_blocks"
  | "completed"
  | "errored";

export interface Paper {
  _id?: string;
  title: string;
  created_at?: string;
}

export interface PaperBlocksResponse {
  blocks: Array<any>; // Block types from the API
}

// API utility class
export class PaperlyAPI {
  private baseUrl: string;

  constructor(baseUrl: string = API_BASE_URL) {
    this.baseUrl = baseUrl;
  }

  /**
   * Get a presigned URL for file upload
   */
  async getUploadUrl(): Promise<FileUploadResponse> {
    const response = await fetch(`${this.baseUrl}/papers/upload_url`);
    if (!response.ok) {
      throw new Error(`Failed to get upload URL: ${response.statusText}`);
    }
    return response.json();
  }

  /**
   * Upload file to presigned URL using PUT method
   */
  async uploadFile(uploadUrl: string, file: File): Promise<void> {
    const response = await fetch(uploadUrl, {
      method: 'PUT',
      body: file,
      headers: {
        'Content-Type': file.type,
      },
    });

    if (!response.ok) {
      throw new Error(`File upload failed: ${response.statusText}`);
    }
  }

  /**
   * Create an analysis task
   */
  async createAnalysis(fileKey: string): Promise<CreateAnalysisResponse> {
    const response = await fetch(`${this.baseUrl}/analyses/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ file_key: fileKey }),
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
    const response = await fetch(`${this.baseUrl}/papers/${paperId}/blocks`);
    if (!response.ok) {
      throw new Error(`Failed to get paper blocks: ${response.statusText}`);
    }
    return response.json();
  }
}

// Export singleton instance
export const api = new PaperlyAPI();

// Utility function for uploading and analyzing a paper
export interface UploadProgress {
  stage: 'uploading' | 'analyzing';
  progress: number;
  status?: AnalysisStatus;
  message?: string;
}

export async function uploadAndAnalyzePaper(
  file: File,
  onProgress?: (progress: UploadProgress) => void
): Promise<{ paperId?: string; analysisId: string }> {
  try {
    // Step 1: Get upload URL
    onProgress?.({ stage: 'uploading', progress: 10, message: 'Getting upload URL...' });
    const { upload_url, key } = await api.getUploadUrl();

    // Step 2: Upload file
    onProgress?.({ stage: 'uploading', progress: 50, message: 'Uploading file...' });
    await api.uploadFile(upload_url, file);

    // Step 3: Create analysis
    onProgress?.({ stage: 'uploading', progress: 100, message: 'File uploaded successfully' });
    onProgress?.({ stage: 'analyzing', progress: 0, message: 'Starting analysis...' });
    
    const { analysis_id } = await api.createAnalysis(key);

    // Step 4: Monitor analysis progress
    let analysisComplete = false;
    let paperId: string | undefined;
    
    while (!analysisComplete) {
      await new Promise(resolve => setTimeout(resolve, 2000)); // Wait 2 seconds
      
      const analysis = await api.getAnalysis(analysis_id);
      
      const progressMap: Record<AnalysisStatus, number> = {
        created: 10,
        extracting_markdown: 25,
        markdown_extracted: 40,
        generating_metadata: 55,
        metadata_generated: 70,
        processing_into_blocks: 85,
        completed: 100,
        errored: 0,
      };

      const progress = progressMap[analysis.status] || 0;
      
      onProgress?.({
        stage: 'analyzing',
        progress,
        status: analysis.status,
        message: getStatusMessage(analysis.status),
      });

      if (analysis.status === 'completed') {
        analysisComplete = true;
        paperId = analysis.paper_id;
      } else if (analysis.status === 'errored') {
        throw new Error('Analysis failed');
      }
    }

    return { paperId, analysisId: analysis_id };
  } catch (error) {
    console.error('Upload and analysis failed:', error);
    throw error;
  }
}

function getStatusMessage(status: AnalysisStatus): string {
  const messages: Record<AnalysisStatus, string> = {
    created: 'Analysis task created...',
    extracting_markdown: 'Extracting text from PDF...',
    markdown_extracted: 'Text extraction complete',
    generating_metadata: 'Generating paper metadata...',
    metadata_generated: 'Metadata generated',
    processing_into_blocks: 'Processing content blocks...',
    completed: 'Analysis complete!',
    errored: 'Analysis failed',
  };
  
  return messages[status] || 'Processing...';
} 