// LocalStorage utilities for managing analysis data
import { AnalysisStatus } from './api';

export interface StoredAnalysis {
  id: string;
  analysisId: string;
  paperId?: string;
  fileName: string;
  fileSize: string;
  uploadDate: string;
  status: 'uploading' | 'analyzing' | 'ready' | 'error';
  analysisStatus?: AnalysisStatus;
  progress?: number;
  errorMessage?: string;
  lastUpdated: string;
}

const STORAGE_KEY = 'paperly_analyses';

export class AnalysisStorage {
  /**
   * Get all stored analyses from localStorage
   */
  static getAll(): StoredAnalysis[] {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      console.error('Error reading analyses from localStorage:', error);
      return [];
    }
  }

  /**
   * Save an analysis to localStorage
   */
  static save(analysis: StoredAnalysis): void {
    try {
      const analyses = this.getAll();
      const existingIndex = analyses.findIndex(a => a.id === analysis.id);
      
      if (existingIndex >= 0) {
        analyses[existingIndex] = { ...analysis, lastUpdated: new Date().toISOString() };
      } else {
        analyses.unshift({ ...analysis, lastUpdated: new Date().toISOString() });
      }
      
      // Keep only the last 50 analyses to avoid localStorage bloat
      const trimmedAnalyses = analyses.slice(0, 50);
      
      localStorage.setItem(STORAGE_KEY, JSON.stringify(trimmedAnalyses));
    } catch (error) {
      console.error('Error saving analysis to localStorage:', error);
    }
  }

  /**
   * Update an existing analysis
   */
  static update(id: string, updates: Partial<StoredAnalysis>): void {
    try {
      const analyses = this.getAll();
      const existingIndex = analyses.findIndex(a => a.id === id);
      
      if (existingIndex >= 0) {
        analyses[existingIndex] = { 
          ...analyses[existingIndex], 
          ...updates, 
          lastUpdated: new Date().toISOString() 
        };
        localStorage.setItem(STORAGE_KEY, JSON.stringify(analyses));
      }
    } catch (error) {
      console.error('Error updating analysis in localStorage:', error);
    }
  }

  /**
   * Delete an analysis from localStorage
   */
  static delete(id: string): void {
    try {
      const analyses = this.getAll();
      const filtered = analyses.filter(a => a.id !== id);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
    } catch (error) {
      console.error('Error deleting analysis from localStorage:', error);
    }
  }

  /**
   * Get a specific analysis by ID
   */
  static getById(id: string): StoredAnalysis | null {
    const analyses = this.getAll();
    return analyses.find(a => a.id === id) || null;
  }

  /**
   * Get analyses that are still processing (for status monitoring)
   */
  static getProcessing(): StoredAnalysis[] {
    const analyses = this.getAll();
    return analyses.filter(a => 
      a.status === 'uploading' || 
      a.status === 'analyzing' || 
      (a.analysisStatus && !['completed', 'errored'].includes(a.analysisStatus))
    );
  }

  /**
   * Clear all stored analyses (useful for debugging)
   */
  static clear(): void {
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch (error) {
      console.error('Error clearing analyses from localStorage:', error);
    }
  }

  /**
   * Export analyses as JSON (for backup/debugging)
   */
  static export(): string {
    return JSON.stringify(this.getAll(), null, 2);
  }

  /**
   * Import analyses from JSON
   */
  static import(jsonData: string): boolean {
    try {
      const analyses = JSON.parse(jsonData);
      if (Array.isArray(analyses)) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(analyses));
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error importing analyses:', error);
      return false;
    }
  }
} 