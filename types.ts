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

// --- CÁC TYPE CHÍNH CHO ỨNG DỤNG (Khớp với App.tsx và Logic xử lý) ---

// Danh sách môn chuẩn GDPT 2018
// Thêm "| string" để chấp nhận giá trị linh hoạt nếu thẻ Select thay đổi
export type SubjectType = 
  // Môn bắt buộc
  | 'Toán' | 'Ngữ văn' | 'Lịch sử' | 'Tiếng Anh' 
  | 'Giáo dục thể chất' | 'Giáo dục quốc phòng và an ninh' | 'Hoạt động trải nghiệm, hướng nghiệp'
  // Môn lựa chọn
  | 'Địa lí' | 'Vật lí' | 'Hóa học' | 'Sinh học' 
  | 'Tin học' | 'Công nghệ' | 'Giáo dục kinh tế và pháp luật' 
  | 'Âm nhạc' | 'Mỹ thuật' 
  // Các môn cấp 2 & Tổng hợp
  | 'Khoa học tự nhiên' | 'Lịch sử và Địa lí'
  | string; 

export type GradeType = 
  | 'Lớp 1' | 'Lớp 2' | 'Lớp 3' | 'Lớp 4' | 'Lớp 5' 
  | 'Lớp 6' | 'Lớp 7' | 'Lớp 8' | 'Lớp 9' 
  | 'Lớp 10' | 'Lớp 11' | 'Lớp 12'
  | string;

// Cấu trúc một hoạt động được tích hợp (Cấu trúc Mới)
export interface EnhancedActivityItem {
  activity_name: string;      // Tên hoạt động (VD: Hoạt động 1: Khởi động)
  enhanced_content: string;   // Nội dung đã viết lại có tích hợp công nghệ
}

// Cấu trúc cũ (Giữ lại để tương thích ngược nếu cần, đánh dấu optional)
export interface LegacyActivityItem {
  anchor_text: string;
  content: string;
}

// Dữ liệu JSON mà AI trả về (Đã cập nhật theo Prompt mới)
export interface GeneratedNLSContent {
  // Phần mục tiêu bổ sung
  objectives_addition: string;
  
  // Phần học liệu bổ sung
  materials_addition: string;
  
  // QUAN TRỌNG: Danh sách hoạt động đã được nâng cấp (Dạng Mảng)
  activities_enhancement: EnhancedActivityItem[];

  // Các trường cũ/phụ (Optional)
  activities_integration?: LegacyActivityItem[]; // Trường cũ
  appendix_table?: string;                       // Bảng phụ lục (nếu có)
}

// Cấu hình xử lý (Bật/tắt các phần muốn chèn)
export interface ProcessingConfig {
  insertObjectives: boolean;
  insertMaterials: boolean;
  insertActivities: boolean;
  appendTable: boolean;
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
  
  // Dữ liệu đã sinh ra từ AI
  generatedContent: GeneratedNLSContent | null;
  
  // Kết quả file Word cuối cùng
  result: {
    fileName: string;
    blob: Blob;
  } | null;
}