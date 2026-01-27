const { GoogleGenerativeAI } = require("@google/generative-ai");

// Thay KEY_MOI_CUA_BAN vào đây
const genAI = new GoogleGenerativeAI("DÁN_API_KEY_MỚI_VÀO_ĐÂY");

async function listModels() {
  try {
    const modelList = await genAI.getGenerativeModel({ model: "gemini-pro" }).apiKey; // Hack nhẹ để init
    // Thực tế dùng listModels của SDK quản lý (nếu có) hoặc thử gọi sai để xem gợi ý
    // Tuy nhiên, cách đơn giản nhất là thử gọi 1 model cơ bản:
    console.log("Đang thử kết nối...");
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
    const result = await model.generateContent("Hello 2026");
    console.log("Gemini 2.5 Flash: HOẠT ĐỘNG TỐT!");
  } catch (error) {
    console.log("Lỗi:", error.message);
    console.log("Gợi ý: Hãy thử đổi tên model thành 'gemini-1.5-pro-latest' hoặc 'gemini-2.0-flash'");
  }
}

listModels();