export interface EnhancedActivityItem {
  activity_name: string;
  enhanced_content: string;
}

export interface GeneratedNLSContent {
  objectives_addition: string;
  materials_addition: string;
  activities_enhancement: EnhancedActivityItem[];
}

export type SubjectType = string;
export type GradeType = string;

export interface AppState {
  file: File | null;
  subject: SubjectType;
  grade: GradeType;
  isProcessing: boolean;
  step: 'upload' | 'review' | 'done';
  logs: string[];
  config: any;
  generatedContent: GeneratedNLSContent | null;
  result: { fileName: string; blob: Blob } | null;
}