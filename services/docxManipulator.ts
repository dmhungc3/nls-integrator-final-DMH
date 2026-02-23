import PizZip from 'pizzip';
import { GeneratedNLSContent } from '../types';

export const injectContentIntoDocx = async (
  file: File,
  content: GeneratedNLSContent,
  mode: 'NLS' | 'NAI',
  _log: (msg: string) => void
): Promise<Blob> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const binaryString = e.target?.result;
        if (!binaryString) throw new Error("Lỗi đọc file");

        const zip = new PizZip(binaryString as ArrayBuffer);
        
        // 1. Kiểm tra file tồn tại
        const docFile = zip.file("word/document.xml");
        if (!docFile) throw new Error("File Word không hợp lệ (thiếu document.xml)");
        
        let docXml = docFile.asText();
        const label = mode === 'NLS' ? "Tích hợp NLS" : "Tích hợp AI";

        // 2. Hàm tạo khối XML (Nâng cấp để giữ thông tin "Tiết 1", "Tiết 2")
        const createXmlBlock = (text: string) => {
          if (!text) return "";
          return text.split('\n').filter(l => l.trim()).map(line => {
            // Tách tiêu đề (màu xanh) và nội dung (màu đen)
            // Nếu dòng có dạng "👉 Tích hợp NLS (Tiết 1): Nội dung..." thì tách ở dấu : đầu tiên
            const match = line.match(/^(👉.*?):\s*(.*)$/);
            
            let prefix = `👉 ${label}`; // Mặc định
            let body = line.replace(/👉.*?:/g, '').trim();

            if (match) {
                prefix = match[1]; // Lấy phần "👉 ... (Tiết 1)"
                body = match[2];   // Lấy phần nội dung phía sau
            }

            return `<w:p>
                      <w:pPr><w:ind w:left="360"/></w:pPr>
                      <w:r><w:rPr><w:b/><w:color w:val="2E74B5"/></w:rPr><w:t>${escapeXml(prefix)}: </w:t></w:r>
                      <w:r><w:t xml:space="preserve">${escapeXml(body)}</w:t></w:r>
                    </w:p>`;
          }).join('');
        };

        // 3. Thuật toán chèn an toàn (Insert After Paragraph)
        const insertSafe = (fullXml: string, keyword: string, newContent: string): string => {
            if (!newContent) return fullXml;
            
            // Tìm vị trí từ khóa (không phân biệt hoa thường)
            const lowerXml = fullXml.toLowerCase();
            const lowerKeyword = keyword.toLowerCase();
            const keywordPos = lowerXml.indexOf(lowerKeyword);
            
            if (keywordPos === -1) return fullXml;

            // Tìm thẻ đóng </w:p> gần nhất sau từ khóa
            const closingTag = "</w:p>";
            const insertIndex = fullXml.indexOf(closingTag, keywordPos);
            
            if (insertIndex === -1) return fullXml;

            // Chèn vào ngay sau đoạn văn chứa từ khóa
            const splitPoint = insertIndex + closingTag.length;
            return fullXml.substring(0, splitPoint) + newContent + fullXml.substring(splitPoint);
        };

        // 4. CHIẾN LƯỢC TÌM VỊ TRÍ CHÈN THÔNG MINH
        // Danh sách ưu tiên các từ khóa mục tiêu
        const priorityKeywords = [
            "2. Phát triển năng lực", // Ưu tiên số 1 (Giáo án mới)
            "2. Năng lực",            // Phổ biến
            "II. MỤC TIÊU",           // Truyền thống
            "II. Mục tiêu",
            "Năng lực cần đạt"
        ];

        let inserted = false;
        
        // Duyệt qua danh sách, thấy từ khóa nào thì chèn vào đó và dừng lại
        for (const key of priorityKeywords) {
            if (docXml.toLowerCase().includes(key.toLowerCase())) {
                docXml = insertSafe(docXml, key, createXmlBlock(content.objectives_addition));
                inserted = true;
                break; // Đã chèn xong
            }
        }

        // Nếu giáo án quá lạ, không tìm thấy từ khóa nào -> Chèn tạm vào sau chữ "BÀI"
        if (!inserted) {
             docXml = insertSafe(docXml, "BÀI", createXmlBlock(content.objectives_addition));
        }

        // Lưu ý: Đã bỏ qua việc chèn vào Thiết bị và Hoạt động để tập trung nội dung vào 1 chỗ.

        // Ghi lại file
        zip.file("word/document.xml", docXml);
        const out = zip.generate({
            type: "blob",
            mimeType: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
            compression: "DEFLATE"
        });
        resolve(out);

      } catch (err) {
        console.error(err);
        reject(err);
      }
    };
    reader.readAsArrayBuffer(file);
  });
};

const escapeXml = (unsafe: string): string => {
  if (!unsafe) return "";
  const map: Record<string, string> = {
    '<': '&lt;', '>': '&gt;', '&': '&amp;', "'": '&apos;', '"': '&quot;'
  };
  return unsafe.replace(/[<>&'"]/g, (c) => map[c] || c);
};