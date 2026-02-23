// src/types.ts

// --- CÁC TYPE CHO DỮ LIỆU KHUNG NĂNG LỰC (Dùng cho tính năng mở rộng sau này) ---
export interface MucDoThanhThao {
  ten: string;
  kyHieu: string;
  moTa: string;
  nhiemVu: string;
  tuChu: string;
  lopApDung: string[];
}

export interface NangLucThanhPhan {
  ma: string;
  ten: string;
  moTa: string;
  chiSoTheoLop: Record<string, string[]>;
}

export interface MienNangLuc {
  ma: string;
  ten: string;
  moTaTongQuat: string;
  nangLucThanhPhan: NangLucThanhPhan[];
}

export interface KhungNLSData {
  thongTu: string;
  congVan3456: string;
  congVan405: string;
  mucDoThanhThao: Record<string, MucDoThanhThao>;
  mienNangLuc: MienNangLuc[];
}

// --- CÁC TYPE CHÍNH CHO ỨNG DỤNG (Khớp với App.tsx) ---

// Danh sách môn chuẩn GDPT 2018 (Khớp value trong thẻ <select>)
export type SubjectType = 
  // Môn bắt buộc
  | 'Toán' | 'Ngữ văn' | 'Lịch sử' | 'Tiếng Anh' 
  | 'Giáo dục thể chất' | 'Giáo dục quốc phòng và an ninh' | 'Hoạt động trải nghiệm, hướng nghiệp'
  // Môn lựa chọn
  | 'Địa lí' | 'Vật lí' | 'Hóa học' | 'Sinh học' 
  | 'Tin học' | 'Công nghệ' | 'Giáo dục kinh tế và pháp luật' 
  | 'Âm nhạc' | 'Mỹ thuật' 
  // Các môn cấp 2
  | 'Khoa học tự nhiên' | 'Lịch sử và Địa lí'; 

export type GradeType = 
  | 'Lớp 1' | 'Lớp 2' | 'Lớp 3' | 'Lớp 4' | 'Lớp 5' 
  | 'Lớp 6' | 'Lớp 7' | 'Lớp 8' | 'Lớp 9' 
  | 'Lớp 10' | 'Lớp 11' | 'Lớp 12';

// Cấu hình xử lý (Bật/tắt các phần muốn chèn)
export interface ProcessingConfig {
  insertObjectives: boolean;
  insertMaterials: boolean;
  insertActivities: boolean;
  appendTable: boolean;
}

// Cấu trúc một hoạt động được tích hợp
export interface ActivityItem {
  anchor_text: string; // Vị trí neo (VD: "Hoạt động 1")
  content: string;     // Nội dung NLS cần chèn
}

// Dữ liệu JSON mà AI trả về
export interface GeneratedNLSContent {
  objectives_addition: string;
  materials_addition: string;
  activities_integration: ActivityItem[];
  appendix_table: string; 
}

// Trạng thái toàn cục của App
export interface AppState {
  file: File | null;
  subject: SubjectType | '';
  grade: GradeType | '';
  isProcessing: boolean;
  step: 'upload' | 'review' | 'done';
  logs: string[];
  config: ProcessingConfig;
  generatedContent: GeneratedNLSContent | null;
  result: {
    fileName: string;
    blob: Blob;
  } | null;
}