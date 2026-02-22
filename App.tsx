import React, { useState, useEffect, useRef } from 'react';
import { 
  FileUp, Download, Sparkles, GraduationCap, Cpu, CheckCircle2, 
  Play, Settings, BookOpen, Layers 
} from 'lucide-react';
import { AppState, SubjectType, GradeType } from './types';
import { extractTextFromDocx, createIntegrationTextPrompt } from './utils';
import { generateCompetencyIntegration } from './services/geminiService';
import { injectContentIntoDocx } from './services/docxManipulator';

const App: React.FC = () => {
  const APP_VERSION = "v3.2-CLASSIC-STABLE"; 
  const [state, setState] = useState<AppState>({
    file: null, subject: 'Toán' as SubjectType, grade: 'Lớp 10' as GradeType, 
    isProcessing: false, step: 'upload', logs: [],
    config: { insertObjectives: true, insertMaterials: true, insertActivities: true, appendTable: true },
    generatedContent: null, result: null
  });
  const [userApiKey, setUserApiKey] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const savedKey = localStorage.getItem('gemini_api_key');
    if (savedKey) setUserApiKey(savedKey);
  }, []);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [state.logs]);

  const addLog = (msg: string) => setState(prev => ({ ...prev, logs: [...prev.logs, msg] }));

  const handleAnalyze = async () => {
    if (!userApiKey || !state.file) {
        addLog("🔴 Thiếu API Key hoặc File giáo án."); return;
    }
    setState(prev => ({ ...prev, isProcessing: true, logs: ["⏳ Đang xử lý giáo án..."] }));
    try {
      const text = await extractTextFromDocx(state.file);
      const content = await generateCompetencyIntegration(
        createIntegrationTextPrompt(text, state.subject, state.grade, 'NLS', 'DEFAULT'), 
        userApiKey
      );
      addLog("✅ Đã tạo nội dung NLS thành công.");
      setState(prev => ({ ...prev, isProcessing: false, generatedContent: content, step: 'review' }));
    } catch (e: any) { 
      addLog(`🔴 Lỗi: ${e.message}`); 
      setState(prev => ({ ...prev, isProcessing: false })); 
    }
  };

  const handleDownload = async () => {
    if (!state.file || !state.generatedContent) return;
    addLog("⬇️ Đang tạo file Word...");
    try {
      const blob = await injectContentIntoDocx(state.file, state.generatedContent, 'NLS', addLog);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a'); a.href = url; a.download = `NLS-${state.file.name}`;
      document.body.appendChild(a); a.click(); document.body.removeChild(a);
      addLog("✅ Tải xuống thành công!");
      setState(prev => ({ ...prev, step: 'done' }));
    } catch (e: any) { addLog(`🔴 Lỗi file: ${e.message}`); }
  };

  return (
    <div className="min-h-screen bg-gray-50 font-sans text-gray-800 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header V3.2 */}
        <div className="flex justify-between items-center mb-8 bg-white p-4 rounded-xl shadow-sm border border-gray-200">
          <div className="flex items-center gap-3">
            <div className="bg-blue-600 p-2 rounded-lg text-white"><Sparkles size={20}/></div>
            <div><h1 className="font-bold text-xl text-gray-800">NLS Integrator</h1><span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded font-bold">{APP_VERSION}</span></div>
          </div>
          <div className="flex gap-2">
            <input type="password" value={userApiKey} onChange={e => setUserApiKey(e.target.value)} placeholder="Nhập API Key..." className="border rounded-lg px-4 py-2 text-sm w-56 outline-none focus:border-blue-500 transition-all"/>
            <button onClick={() => localStorage.setItem('gemini_api_key', userApiKey)} className="bg-gray-800 hover:bg-gray-900 text-white px-4 py-2 rounded-lg text-sm font-bold transition-all">Lưu</button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Cột trái: Điều khiển */}
          <div className="md:col-span-2 space-y-6">
            <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-200">
              <h2 className="font-bold text-lg mb-6 flex items-center gap-2 text-gray-700"><Settings size={18}/> 1. Cấu hình bài dạy</h2>
              
              <div className="grid grid-cols-2 gap-6 mb-6">
                <div>
                  <label className="text-xs font-bold text-gray-500 uppercase block mb-2">Môn học</label>
                  <select className="w-full border-2 border-gray-100 p-3 rounded-xl outline-none focus:border-blue-500 font-medium bg-gray-50 cursor-pointer" value={state.subject} onChange={e => setState(prev => ({...prev, subject: e.target.value as SubjectType}))}>
                    <optgroup label="Môn Bắt buộc"><option value="Toán">Toán học</option><option value="Ngữ văn">Ngữ văn</option><option value="Tiếng Anh">Tiếng Anh</option><option value="Lịch sử">Lịch sử</option></optgroup>
                    <optgroup label="Môn Tự chọn"><option value="Vật lý">Vật lý</option><option value="Hóa học">Hóa học</option><option value="Sinh học">Sinh học</option><option value="Tin học">Tin học</option><option value="Công nghệ">Công nghệ</option><option value="Địa lý">Địa lý</option><option value="GDCD">GD Kinh tế & Pháp luật</option></optgroup>
                    <optgroup label="Xu hướng mới"><option value="AI">Trí tuệ nhân tạo</option><option value="Stem">STEM/Robotics</option></optgroup>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-bold text-gray-500 uppercase block mb-2">Khối lớp</label>
                  <select className="w-full border-2 border-gray-100 p-3 rounded-xl outline-none focus:border-blue-500 font-medium bg-gray-50 cursor-pointer" value={state.grade} onChange={e => setState(prev => ({...prev, grade: e.target.value as GradeType}))}>
                    <option value="Lớp 10">Lớp 10</option><option value="Lớp 11">Lớp 11</option><option value="Lớp 12">Lớp 12</option><option value="Lớp 6">Lớp 6</option><option value="Lớp 7">Lớp 7</option><option value="Lớp 8">Lớp 8</option><option value="Lớp 9">Lớp 9</option>
                  </select>
                </div>
              </div>

              <div className="border-2 border-dashed border-blue-200 bg-blue-50/50 rounded-2xl h-40 flex flex-col items-center justify-center cursor-pointer hover:bg-blue-50 transition-all relative group">
                <FileUp className="text-blue-400 mb-3 group-hover:-translate-y-1 transition-transform" size={32}/>
                <span className="text-sm font-bold text-blue-800">{state.file ? state.file.name : "Nhấn để chọn file Word (.docx)"}</span>
                <input type="file" accept=".docx" className="absolute inset-0 opacity-0 cursor-pointer" onChange={e => e.target.files && setState(prev => ({...prev, file: e.target.files![0]}))}/>
              </div>

              <button disabled={!state.file || state.isProcessing} onClick={handleAnalyze} className="w-full mt-6 bg-blue-600 hover:bg-blue-700 text-white py-4 rounded-xl font-bold shadow-lg shadow-blue-200 flex justify-center items-center gap-2 disabled:opacity-50 transition-all">
                {state.isProcessing ? <Cpu className="animate-spin"/> : <Play/>} BẮT ĐẦU TÍCH HỢP
              </button>
            </div>

            {state.generatedContent && (
              <div className="bg-white p-6 rounded-2xl shadow-sm border border-green-200 animate-in fade-in slide-in-from-bottom-4">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="font-bold text-lg text-green-700 flex items-center gap-2"><CheckCircle2/> Kết quả</h2>
                  <button onClick={handleDownload} className="bg-green-600 text-white px-5 py-2 rounded-xl font-bold text-xs flex items-center gap-2 shadow-lg shadow-green-200 hover:bg-green-700 transition-all"><Download size={16}/> TẢI VỀ MÁY</button>
                </div>
                <div className="bg-gray-50 p-5 rounded-xl text-sm text-gray-700 max-h-80 overflow-y-auto border border-gray-200 custom-scrollbar">
                  <p className="font-bold text-blue-600 mb-3 uppercase text-xs tracking-wider">Xem trước nội dung chèn:</p>
                  {state.generatedContent.activities_integration.map((act, i) => (
                    <div key={i} className="mb-4 pl-4 border-l-4 border-blue-400 bg-white p-3 rounded-r-lg shadow-sm">
                      <span className="font-bold text-xs uppercase text-gray-400 block mb-1">Vị trí chèn: {act.anchor_text}</span>
                      <p className="font-medium text-gray-800">👉 {act.content}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Cột phải: Logs & Info */}
          <div className="space-y-6">
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200">
              <h4 className="text-xs font-bold text-gray-400 uppercase mb-4 flex items-center gap-2 tracking-widest"><GraduationCap size={14}/> Tác giả</h4>
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center font-black text-lg">MH</div>
                <div><p className="font-bold text-gray-800 text-lg">Đặng Mạnh Hùng</p><p className="text-xs text-gray-500 font-medium">THPT Lý Nhân Tông</p></div>
              </div>
            </div>
            <div className="bg-gray-900 p-5 rounded-2xl shadow-xl h-[400px] flex flex-col text-xs font-mono text-green-400 border border-gray-800">
              <div className="border-b border-gray-700 pb-3 mb-3 font-bold text-gray-500 uppercase flex gap-2 items-center"><Cpu size={14}/> System Terminal</div>
              <div ref={scrollRef} className="flex-1 overflow-y-auto space-y-2 custom-scrollbar">
                {state.logs.map((l, i) => (
                  <div key={i} className="flex gap-2">
                    <span className="text-gray-600 select-none">&gt;</span>
                    <span>{l}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
export default App;