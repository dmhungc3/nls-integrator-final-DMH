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
        const docFile = zip.file("word/document.xml");
        if (!docFile) throw new Error("File Word không hợp lệ");
        
        let docXml = docFile.asText();
        const label = mode === 'NLS' ? "Tích hợp NLS" : "Tích hợp AI";

        // --- HÀM 1: SAO CHÉP PHONG CÁCH (FONT & SIZE) ---
        const detectStyle = (xml: string, index: number) => {
            const chunk = xml.substring(Math.max(0, index - 3000), index); 
            
            // Tìm cỡ chữ (w:sz)
            const szMatch = chunk.match(/<w:sz\s+w:val=["'](\d+)["'][^>]*\/>/g);
            let fontSize = null;
            if (szMatch && szMatch.length > 0) {
                 const last = szMatch[szMatch.length - 1];
                 const m = last.match(/val=["'](\d+)["']/);
                 if (m) fontSize = m[1];
            }

            // Tìm Font chữ (w:rFonts)
            const fontMatch = chunk.match(/<w:rFonts\s+[^>]*\/>/g);
            let fontTag = ""; 
            if (fontMatch && fontMatch.length > 0) {
                fontTag = fontMatch[fontMatch.length - 1];
            }

            return { fontSize, fontTag };
        };

        // --- HÀM 2: TẠO KHỐI XML (HEADER + LIST) ---
        const createXmlBlock = (text: string, style: { fontSize: string | null, fontTag: string }) => {
          if (!text) return "";
          
          const lines = text.split('\n').map(l => l.trim()).filter(l => l.length > 0);
          if (lines.length === 0) return "";

          // Style chung cho cả khối (Màu xanh dương đậm)
          let rPrHeader = `<w:b/><w:color w:val="2E74B5"/>`; // Header: Đậm
          let rPrBody = `<w:color w:val="2E74B5"/>`; // Body: Thường

          // Áp dụng style sao chép được
          if (style.fontSize) {
              const szTag = `<w:sz w:val="${style.fontSize}"/><w:szCs w:val="${style.fontSize}"/>`;
              rPrHeader += szTag;
              rPrBody += szTag;
          }
          if (style.fontTag) {
              rPrHeader += style.fontTag;
              rPrBody += style.fontTag;
          }

          // 1. Tạo dòng Tiêu đề (Header)
          let xmlBlock = `<w:p>
                            <w:pPr><w:ind w:left="360"/></w:pPr>
                            <w:r>
                                <w:rPr>${rPrHeader}</w:rPr>
                                <w:t>👉 ${escapeXml(label)}:</w:t>
                            </w:r>
                          </w:p>`;

          // 2. Tạo các dòng Liệt kê (List)
          lines.forEach(line => {
              // Lọc sạch các ký tự thừa
              let cleanLine = line
                  .replace(/\*\*/g, "") 
                  .replace(/__/, "")
                  .replace(/^\s*[-•+]\s*/, "") // Xóa gạch đầu dòng cũ
                  .replace(/^(👉|NLS:|Tiết \d+:|Tích hợp NLS:)\s*/gi, "")
                  .trim();

              if (cleanLine) {
                  xmlBlock += `<w:p>
                                 <w:pPr><w:ind w:left="720"/></w:pPr> 
                                 <w:r>
                                    <w:rPr>${rPrBody}</w:rPr>
                                    <w:t xml:space="preserve">- ${escapeXml(cleanLine)}</w:t>
                                 </w:r>
                               </w:p>`;
              }
          });

          return xmlBlock;
        };

        // --- 3. CHÈN NĂNG LỰC (VÀO MỤC 2. NĂNG LỰC) ---
        const objectiveLines = content.objectives_addition.split('\n').filter(l => l.trim());
        // Từ khóa mở rộng để bắt dính nhiều giáo án hơn
        const keywords = ["Phẩm chất năng lực", "2. Phát triển năng lực", "2. Năng lực", "2. năng lực", "II. MỤC TIÊU", "II. Mục tiêu", "Năng lực cần đạt", "3. Năng lực"];
        
        const findAllIndices = (xml: string, keyword: string) => {
            const regex = new RegExp(keyword.replace(/\./g, "\\."), "gi");
            let match;
            const indices = [];
            while ((match = regex.exec(xml)) !== null) indices.push(match.index);
            return indices;
        };

        let targetIndices: number[] = [];
        for (const key of keywords) {
            const found = findAllIndices(docXml, key);
            if (found.length > 0) {
                if (targetIndices.length === 0) targetIndices = found;
                if (found.length >= objectiveLines.length) { 
                    targetIndices = found; 
                    break; 
                }
            }
        }

        let newXml = docXml;
        const reverseIndices = [...targetIndices].reverse(); 
        
        if (targetIndices.length > 0) {
             reverseIndices.forEach((index, reverseI) => {
                 const realIndex = targetIndices.length - 1 - reverseI;
                 
                 // Logic mới: Chèn toàn bộ nội dung tổng hợp vào mỗi mục Năng lực tìm thấy
                 // (Vì anh muốn "tổng hợp tất cả" vào đây)
                 let contentToInsert = content.objectives_addition;

                 if (contentToInsert) {
                     const currentStyle = detectStyle(newXml, index);
                     const xmlBlock = createXmlBlock(contentToInsert, currentStyle);
                     
                     if (xmlBlock) {
                         const closingTag = "</w:p>";
                         const insertPos = newXml.indexOf(closingTag, index);
                         if (insertPos !== -1) {
                             const splitPos = insertPos + closingTag.length;
                             newXml = newXml.substring(0, splitPos) + xmlBlock + newXml.substring(splitPos);
                         }
                     }
                 }
             });
        } else {
            // Fallback: Chèn vào đầu
            const xmlBlock = createXmlBlock(content.objectives_addition, { fontSize: null, fontTag: "" });
            if (xmlBlock) {
                const bodyTag = "<w:body>";
                const bodyIndex = newXml.indexOf(bodyTag);
                if (bodyIndex !== -1) {
                    newXml = newXml.substring(0, bodyIndex + bodyTag.length) + xmlBlock + newXml.substring(bodyIndex + bodyTag.length);
                }
            }
        }
        docXml = newXml;

        // --- 4. CHÈN HOẠT ĐỘNG (VÀO BẢNG HOẶC VĂN BẢN) ---
        if (Array.isArray(content.activities_enhancement)) {
            content.activities_enhancement.forEach(item => {
                let safeName = escapeXml(item.activity_name);
                let actIndex = docXml.indexOf(safeName); 
                
                // Thử tìm biến thể ngắn hơn nếu tên dài không khớp
                if (actIndex === -1 && safeName.includes(":")) {
                    safeName = safeName.split(":")[0];
                    actIndex = docXml.indexOf(safeName);
                }

                if (actIndex !== -1) {
                     const currentStyle = detectStyle(docXml, actIndex);
                     const closingTag = "</w:p>";
                     const insertPos = docXml.indexOf(closingTag, actIndex);
                     
                     if (insertPos !== -1) {
                         const splitPos = insertPos + closingTag.length;
                         const xmlBlock = createXmlBlock(item.enhanced_content, currentStyle);
                         
                         if (xmlBlock) {
                             docXml = docXml.substring(0, splitPos) + xmlBlock + docXml.substring(splitPos);
                         }
                     }
                }
            });
        }

        zip.file("word/document.xml", docXml);
        resolve(zip.generate({ type: "blob", mimeType: "application/vnd.openxmlformats-officedocument.wordprocessingml.document", compression: "DEFLATE" }));

      } catch (err) { reject(err); }
    };
    reader.readAsArrayBuffer(file);
  });
};

const escapeXml = (unsafe: string): string => {
  if (!unsafe) return "";
  const map: Record<string, string> = { '<': '&lt;', '>': '&gt;', '&': '&amp;', "'": '&apos;', '"': '&quot;' };
  return unsafe.replace(/[<>&'"]/g, (c) => map[c] || c);
};