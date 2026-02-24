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

        // --- HÀM PHÁT HIỆN CỠ CHỮ (STYLE DETECTOR) ---
        const detectFontSize = (xml: string, index: number): string => {
            // Tìm ngược từ vị trí chèn để xem đoạn văn trước đó dùng cỡ chữ nào
            // Tìm thẻ <w:sz w:val="..."/> gần nhất phía trước
            const chunk = xml.substring(Math.max(0, index - 2000), index); // Lấy 2000 ký tự trước đó
            const match = chunk.match(/<w:sz\s+w:val=["'](\d+)["']\s*\/>/g);
            
            if (match && match.length > 0) {
                // Lấy giá trị cuối cùng tìm thấy (gần vị trí chèn nhất)
                const lastMatch = match[match.length - 1];
                const valueMatch = lastMatch.match(/val=["'](\d+)["']/);
                return valueMatch ? valueMatch[1] : "26"; // Mặc định 26 (13pt) nếu không tìm thấy
            }
            return "28"; // Mặc định 28 (14pt) nếu không có thông tin - Chuẩn giáo án mới
        };

        // --- HÀM TẠO KHỐI XML (CÓ ĐỒNG BỘ CỠ CHỮ) ---
        const createXmlBlock = (text: string, fontSize: string) => {
          if (!text) return "";
          
          const lines = text.split('\n').map(l => l.trim()).filter(l => l.length > 0);
          if (lines.length === 0) return "";

          // Header: 👉 Tích hợp NLS: (Màu xanh, Đậm, Cỡ chữ đồng bộ)
          let xmlBlock = `<w:p>
                            <w:pPr><w:ind w:left="360"/></w:pPr>
                            <w:r>
                                <w:rPr>
                                    <w:b/>
                                    <w:color w:val="2E74B5"/>
                                    <w:sz w:val="${fontSize}"/>
                                    <w:szCs w:val="${fontSize}"/>
                                </w:rPr>
                                <w:t>👉 ${escapeXml(label)}:</w:t>
                            </w:r>
                          </w:p>`;

          // Content List: - Nội dung... (Màu xanh, Thường, Cỡ chữ đồng bộ)
          lines.forEach(line => {
              let cleanContent = line.replace(/^(👉|NLS:|-|\+|Tiết \d+:)\s*/gi, '').trim();
              if (cleanContent) {
                  xmlBlock += `<w:p>
                                 <w:pPr><w:ind w:left="720"/></w:pPr> 
                                 <w:r>
                                    <w:rPr>
                                        <w:color w:val="2E74B5"/>
                                        <w:sz w:val="${fontSize}"/>
                                        <w:szCs w:val="${fontSize}"/>
                                    </w:rPr>
                                    <w:t xml:space="preserve">- ${escapeXml(cleanContent)}</w:t>
                                 </w:r>
                               </w:p>`;
              }
          });
          return xmlBlock;
        };

        // --- 1. CHÈN NĂNG LỰC TỔNG HỢP ---
        const objectiveLines = content.objectives_addition.split('\n').filter(l => l.trim());
        const keywords = ["Phẩm chất năng lực", "2. Phát triển năng lực", "2. Năng lực", "2. năng lực", "II. MỤC TIÊU", "II. Mục tiêu", "Năng lực cần đạt"];
        
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
                     const contentToInsert = objectiveLines[realIndex];
                     
                     // PHÁT HIỆN CỠ CHỮ TẠI VỊ TRÍ NÀY
                     const currentFontSize = detectFontSize(newXml, index);
                     
                     const xmlBlock = createXmlBlock(contentToInsert, currentFontSize);
                     
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
            // Fallback (Mặc định size 28 - 14pt)
            const xmlBlock = createXmlBlock(content.objectives_addition, "28");
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
                     // PHÁT HIỆN CỠ CHỮ TẠI VỊ TRÍ HOẠT ĐỘNG NÀY
                     const currentFontSize = detectFontSize(docXml, actIndex);

                     const closingTag = "</w:p>";
                     const insertPos = docXml.indexOf(closingTag, actIndex);
                     
                     if (insertPos !== -1) {
                         const splitPos = insertPos + closingTag.length;
                         const xmlBlock = createXmlBlock(item.enhanced_content, currentFontSize);
                         
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