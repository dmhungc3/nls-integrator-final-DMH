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
        if (!docFile) throw new Error("File Word không hợp lệ (thiếu document.xml)");
        
        let docXml = docFile.asText();
        const label = mode === 'NLS' ? "Tích hợp NLS" : "Tích hợp AI";

        // --- HÀM TẠO KHỐI XML (HEADER + LIST) ---
        const createXmlBlock = (text: string) => {
          if (!text) return "";
          
          // 1. Tách dòng và lọc dòng trống
          const lines = text.split('\n').map(l => l.trim()).filter(l => l.length > 0);
          if (lines.length === 0) return "";

          // 2. Tạo dòng TIÊU ĐỀ CHUNG (Đậm, Màu Xanh)
          let xmlBlock = `<w:p>
                            <w:pPr><w:ind w:left="360"/></w:pPr>
                            <w:r>
                                <w:rPr><w:b/><w:color w:val="2E74B5"/></w:rPr>
                                <w:t>👉 ${escapeXml(label)}:</w:t>
                            </w:r>
                          </w:p>`;

          // 3. Tạo các dòng NỘI DUNG (Thường, Màu Xanh, bắt đầu bằng -)
          lines.forEach(line => {
              // Xóa các ký tự thừa ở đầu nếu có, đảm bảo bắt đầu bằng "- "
              let cleanContent = line.replace(/^(👉|NLS:|-|\+|Tiết \d+:)\s*/gi, '').trim();
              
              if (cleanContent) {
                  xmlBlock += `<w:p>
                                 <w:pPr><w:ind w:left="720"/></w:pPr> 
                                 <w:r>
                                    <w:rPr><w:color w:val="2E74B5"/></w:rPr>
                                    <w:t xml:space="preserve">- ${escapeXml(cleanContent)}</w:t>
                                 </w:r>
                               </w:p>`;
              }
          });

          return xmlBlock;
        };

        // --- 1. CHÈN NĂNG LỰC TỔNG HỢP ---
        const objectiveLines = content.objectives_addition.split('\n').filter(l => l.trim());
        const keywords = [
            "Phẩm chất năng lực", 
            "2. Phát triển năng lực", 
            "2. Năng lực", 
            "2. năng lực", 
            "II. MỤC TIÊU", 
            "II. Mục tiêu", 
            "Năng lực cần đạt"
        ];
        
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
                if (found.length >= objectiveLines.length) { targetIndices = found; break; }
                if (targetIndices.length === 0) targetIndices = found; 
            }
        }

        let newXml = docXml;
        const reverseIndices = [...targetIndices].reverse(); 
        
        if (targetIndices.length > 0) {
             reverseIndices.forEach((index, reverseI) => {
                 const realIndex = targetIndices.length - 1 - reverseI;
                 if (realIndex < objectiveLines.length) {
                     // Lấy nội dung của tiết đó
                     const contentToInsert = objectiveLines[realIndex];
                     // Tạo block: Header + Dòng nội dung đó
                     const xmlBlock = createXmlBlock(contentToInsert);
                     
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
            // Fallback
            const xmlBlock = createXmlBlock(content.objectives_addition);
            if (xmlBlock) {
                const bodyTag = "<w:body>";
                const bodyIndex = newXml.indexOf(bodyTag);
                if (bodyIndex !== -1) {
                    newXml = newXml.substring(0, bodyIndex + bodyTag.length) + xmlBlock + newXml.substring(bodyIndex + bodyTag.length);
                }
            }
        }
        docXml = newXml;

        // --- 2. CHÈN HOẠT ĐỘNG (DEEP SCAN) ---
        if (Array.isArray(content.activities_enhancement)) {
            content.activities_enhancement.forEach(item => {
                let safeName = escapeXml(item.activity_name);
                let actIndex = docXml.indexOf(safeName); 
                
                if (actIndex === -1 && safeName.includes(":")) {
                    safeName = safeName.split(":")[0];
                    actIndex = docXml.indexOf(safeName);
                }

                if (actIndex !== -1) {
                     const closingTag = "</w:p>";
                     const insertPos = docXml.indexOf(closingTag, actIndex);
                     
                     if (insertPos !== -1) {
                         const splitPos = insertPos + closingTag.length;
                         // Tạo block: Header + Các bước hướng dẫn
                         const xmlBlock = createXmlBlock(item.enhanced_content);
                         
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