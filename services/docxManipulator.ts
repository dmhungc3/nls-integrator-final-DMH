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
        
        // 1. Kiểm tra file document.xml
        const docFile = zip.file("word/document.xml");
        if (!docFile) throw new Error("File Word không hợp lệ (thiếu document.xml)");
        
        let docXml = docFile.asText();
        const label = mode === 'NLS' ? "Tích hợp NLS" : "Tích hợp AI";

        // 2. Hàm tạo khối XML chuẩn (Xử lý prefix thông minh)
        const createXmlBlock = (text: string) => {
          if (!text) return "";
          return text.split('\n').filter(l => l.trim()).map(line => {
            const cleanLine = line.replace(/👉.*?:/g, '').trim();
            
            // Lấy prefix từ dòng text (nếu AI sinh ra) hoặc dùng mặc định
            // Vì Prompt đã yêu cầu không ghi "(Tiết 1)" nên prefix sẽ sạch
            const prefixMatch = line.match(/^(👉.*?):/);
            const prefix = prefixMatch ? prefixMatch[1] : `👉 ${label}`;

            return `<w:p>
                      <w:pPr><w:ind w:left="360"/></w:pPr>
                      <w:r><w:rPr><w:b/><w:color w:val="2E74B5"/></w:rPr><w:t>${escapeXml(prefix)}: </w:t></w:r>
                      <w:r><w:t xml:space="preserve">${escapeXml(cleanLine)}</w:t></w:r>
                    </w:p>`;
          }).join('');
        };

        // --- 3. THUẬT TOÁN CHÈN PHÂN PHỐI (DISTRIBUTED INSERT) ---
        
        // Bước A: Tách nội dung năng lực thành mảng (Mỗi dòng là 1 tiết)
        const objectiveLines = content.objectives_addition.split('\n').filter(line => line.trim().length > 0);

        // Bước B: Tìm tất cả vị trí các từ khóa Mục tiêu/Năng lực
        // Danh sách từ khóa ưu tiên (từ phổ biến nhất đến ít phổ biến)
        const keywords = ["Phát triển năng lực", "2. Năng lực", "2. năng lực", "II. MỤC TIÊU", "II. Mục tiêu", "Năng lực cần đạt"];
        
        // Hàm tìm tất cả chỉ số (index) của một từ khóa trong văn bản XML
        const findAllIndices = (xml: string, keyword: string) => {
            // Escape ký tự đặc biệt như dấu chấm
            const regex = new RegExp(keyword.replace(/\./g, "\\."), "gi");
            let match;
            const indices = [];
            while ((match = regex.exec(xml)) !== null) {
                indices.push(match.index);
            }
            return indices;
        };

        let targetIndices: number[] = [];
        
        // Quét từng từ khóa, chọn từ khóa nào tìm thấy số lượng vị trí hợp lý nhất
        // (Tìm thấy ít nhất bằng số lượng tiết mà AI đã sinh ra)
        for (const key of keywords) {
            const found = findAllIndices(docXml, key);
            if (found.length > 0) {
                // Ưu tiên trường hợp khớp số lượng (Ví dụ: AI có 2 dòng, Word có 2 mục Năng lực)
                if (found.length >= objectiveLines.length) {
                    targetIndices = found;
                    break; 
                }
                // Nếu chưa tìm thấy đủ, cứ tạm lưu lại kết quả của từ khóa đầu tiên tìm thấy
                if (targetIndices.length === 0) targetIndices = found; 
            }
        }

        // Bước C: Tiến hành chèn (QUAN TRỌNG: Chèn từ dưới lên trên để không làm lệch index)
        let newXml = docXml;
        const reverseIndices = [...targetIndices].reverse(); 
        
        if (targetIndices.length > 0) {
             reverseIndices.forEach((index, reverseI) => {
                 // Tính chỉ số thực trong mảng xuôi: i = (length - 1) - reverseI
                 // Ví dụ: Có 2 vị trí. Vị trí cuối (reverseI=0) là index 1. Vị trí đầu (reverseI=1) là index 0.
                 const realIndex = targetIndices.length - 1 - reverseI;
                 
                 // Chỉ chèn nếu có nội dung tương ứng cho tiết này
                 if (realIndex < objectiveLines.length) {
                     const contentToInsert = objectiveLines[realIndex];
                     
                     // Tìm thẻ đóng </w:p> gần nhất SAU vị trí từ khóa
                     const closingTag = "</w:p>";
                     const insertPos = newXml.indexOf(closingTag, index);
                     
                     if (insertPos !== -1) {
                         const splitPos = insertPos + closingTag.length;
                         const xmlBlock = createXmlBlock(contentToInsert);
                         // Chèn đoạn XML mới vào
                         newXml = newXml.substring(0, splitPos) + xmlBlock + newXml.substring(splitPos);
                     }
                 }
             });
        } else {
            // Fallback: Nếu giáo án quá lạ, không tìm thấy từ khóa nào -> Chèn tất cả vào đầu trang
            const xmlBlock = createXmlBlock(content.objectives_addition);
            // Tìm thẻ body để chèn vào đầu
            const bodyTag = "<w:body>";
            const bodyIndex = newXml.indexOf(bodyTag);
            if (bodyIndex !== -1) {
                newXml = newXml.substring(0, bodyIndex + bodyTag.length) + xmlBlock + newXml.substring(bodyIndex + bodyTag.length);
            }
        }
        
        docXml = newXml;

        // --- 4. THUẬT TOÁN CHÈN HOẠT ĐỘNG (ACTIVITY INSERT) ---
        if (Array.isArray(content.activities_enhancement)) {
            content.activities_enhancement.forEach(item => {
                const safeName = escapeXml(item.activity_name);
                // Tìm vị trí tên hoạt động
                const actIndex = docXml.indexOf(safeName); 
                
                if (actIndex !== -1) {
                     const closingTag = "</w:p>";
                     const insertPos = docXml.indexOf(closingTag, actIndex);
                     
                     if (insertPos !== -1) {
                         const splitPos = insertPos + closingTag.length;
                         const xmlBlock = createXmlBlock(item.enhanced_content);
                         docXml = docXml.substring(0, splitPos) + xmlBlock + docXml.substring(splitPos);
                     }
                }
            });
        }

        // 5. Đóng gói và trả về Blob
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

// Hàm mã hóa ký tự đặc biệt XML
const escapeXml = (unsafe: string): string => {
  if (!unsafe) return "";
  const map: Record<string, string> = {
    '<': '&lt;',
    '>': '&gt;',
    '&': '&amp;',
    "'": '&apos;',
    '"': '&quot;'
  };
  return unsafe.replace(/[<>&'"]/g, (c) => map[c] || c);
};