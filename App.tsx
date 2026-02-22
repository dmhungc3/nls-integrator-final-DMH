import React, { useState, useEffect, useRef } from 'react';
import { FileUp, Download, Sparkles, GraduationCap, Cpu, CheckCircle2, Play, Settings, BookOpen, Layers } from 'lucide-react';
import { AppState, SubjectType, GradeType } from './types';
import { extractTextFromDocx, createIntegrationTextPrompt } from './utils';
import { generateCompetencyIntegration } from './services/geminiService';
import { injectContentIntoDocx } from './services/docxManipulator';

const App: React.FC = () => {
  const APP_VERSION = "v3.2-STABLE"; 
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
      <div className="max-w-5xl mx-auto">
        {/* Header Đơn giản */}
        <div className="flex justify-between items-center mb-8 bg-white p-4 rounded-xl shadow-sm">
          <div className="flex items-center gap-3">
            <div className="bg-blue-600 p-2 rounded-lg text-white"><Sparkles size={20}/></div>
            <div><h1 className="font-bold text-xl">NLS Integrator</h1><span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded font-bold">{APP_VERSION}</span></div>
          </div>
          <div className="flex gap-2">
            <input type="password" value={userApiKey} onChange={e => setUserApiKey(e.target.value)} placeholder="Nhập API Key..." className="border rounded px-3 py-1 text-sm w-48 outline-none focus:border-blue-500"/>
            <button onClick={() => localStorage.setItem('gemini_api_key', userApiKey)} className="bg-gray-800 text-white px-3 py-1 rounded text-sm font-bold">Lưu</button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Cột trái: Điều khiển */}
          <div className="md:col-span-2 space-y-6">
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
              <h2 className="font-bold text-lg mb-4 flex items-center gap-2"><Settings size={18}/> 1. Thiết lập</h2>
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="text-xs font-bold text-gray-500 uppercase block mb-1">Môn học</label>
                  <select className="w-full border p-2 rounded-lg outline-none focus:border-blue-500 font-medium" value={state.subject} onChange={e => setState(prev => ({...prev, subject: e.target.value as SubjectType}))}>
                    <option value="Toán">Toán học</option><option value="Ngữ văn">Ngữ văn</option><option value="Tiếng Anh">Tiếng Anh</option><option value="Vật lý">Vật lý</option><option value="Hóa học">Hóa học</option><option value="Sinh học">Sinh học</option><option value="Lịch sử">Lịch sử</option><option value="Địa lý">Địa lý</option><option value="Tin học">Tin học</option><option value="Công nghệ">Công nghệ</option><option value="GDCD">GD Kinh tế & Pháp luật</option><option value="Hoạt động trải nghiệm">HĐ Trải nghiệm</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-bold text-gray-500 uppercase block mb-1">Khối lớp</label>
                  <select className="w-full border p-2 rounded-lg outline-none focus:border-blue-500 font-medium" value={state.grade} onChange={e => setState(prev => ({...prev, grade: e.target.value as GradeType}))}>
                    <option value="Lớp 10">Lớp 10</option><option value="Lớp 11">Lớp 11</option><option value="Lớp 12">Lớp 12</option><option value="Lớp 6">Lớp 6</option><option value="Lớp 7">Lớp 7</option><option value="Lớp 8">Lớp 8</option><option value="Lớp 9">Lớp 9</option>
                  </select>
                </div>
              </div>

              <div className="border-2 border-dashed border-gray-300 rounded-xl h-32 flex flex-col items-center justify-center cursor-pointer hover:bg-blue-50 transition-colors relative">
                <FileUp className="text-gray-400 mb-2"/>
                <span className="text-sm font-medium text-gray-600">{state.file ? state.file.name : "Nhấn để chọn file Word (.docx)"}</span>
                <input type="file" accept=".docx" className="absolute inset-0 opacity-0 cursor-pointer" onChange={e => e.target.files && setState(prev => ({...prev, file: e.target.files![0]}))}/>
              </div>

              <button disabled={!state.file || state.isProcessing} onClick={handleAnalyze} className="w-full mt-4 bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-xl font-bold shadow-lg flex justify-center items-center gap-2 disabled:opacity-50">
                {state.isProcessing ? <Cpu className="animate-spin"/> : <Play/>} BẮT ĐẦU TÍCH HỢP
              </button>
            </div>

            {state.generatedContent && (
              <div className="bg-white p-6 rounded-xl shadow-sm border border-green-100 animate-in fade-in">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="font-bold text-lg text-green-700 flex items-center gap-2"><CheckCircle2/> Kết quả</h2>
                  <button onClick={handleDownload} className="bg-green-600 text-white px-4 py-2 rounded-lg font-bold text-xs flex items-center gap-2 shadow hover:bg-green-700"><Download size={16}/> TẢI VỀ MÁY</button>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg text-sm text-gray-700 max-h-64 overflow-y-auto border border-gray-200">
                  <p className="font-bold text-blue-600 mb-2">[Xem trước nội dung chèn vào Hoạt động]:</p>
                  {state.generatedContent.activities_integration.map((act, i) => (
                    <div key={i} className="mb-3 pl-3 border-l-2 border-blue-400">
                      <span className="font-bold text-xs uppercase text-gray-500">{act.anchor_text}:</span>
                      <p className="mt-1">{act.content}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Cột phải: Logs & Info */}
          <div className="space-y-6">
            <div className="bg-white p-5 rounded-xl shadow-sm border">
              <h4 className="text-xs font-bold text-gray-400 uppercase mb-3 flex items-center gap-2"><GraduationCap size={14}/> Tác giả</h4>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center font-bold">MH</div>
                <div><p className="font-bold text-gray-800">Đặng Mạnh Hùng</p><p className="text-xs text-gray-500">THPT Lý Nhân Tông</p></div>
              </div>
            </div>
            <div className="bg-gray-900 p-4 rounded-xl shadow-lg h-64 flex flex-col text-xs font-mono text-green-400">
              <div className="border-b border-gray-700 pb-2 mb-2 font-bold text-gray-500 uppercase">System Terminal</div>
              <div ref={scrollRef} className="flex-1 overflow-y-auto space-y-1">
                {state.logs.map((l, i) => <div key={i}>> {l}</div>)}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
export default App;