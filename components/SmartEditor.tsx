import React, { useState, useEffect } from 'react';
import { GeneratedNLSContent } from '../types';
import { Save, PenTool, CheckCircle, ChevronRight } from 'lucide-react';

interface SmartEditorProps {
  initialContent: GeneratedNLSContent;
  onConfirm: (finalContent: GeneratedNLSContent) => void;
  onCancel: () => void;
}

const SmartEditor: React.FC<SmartEditorProps> = ({ initialContent, onConfirm, onCancel }) => {
  const [content, setContent] = useState<GeneratedNLSContent>(initialContent);
  const [activeTab, setActiveTab] = useState<'objectives' | 'materials' | 'activities' | 'appendix'>('objectives');

  // ÉP DỮ LIỆU HIỂN THỊ
  useEffect(() => {
    if (initialContent) {
      console.log("Dữ liệu nhận từ AI:", initialContent);
      setContent(initialContent);
    }
  }, [initialContent]);

  const updateField = (field: keyof GeneratedNLSContent, value: any) => {
    setContent(prev => ({ ...prev, [field]: value }));
  };

  return (
    <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col h-[600px]">
      <div className="bg-white border-b border-slate-100 px-8 py-5 flex justify-between items-center">
        <div className="flex items-center gap-4">
            <div className="p-2.5 bg-indigo-50 rounded-xl"><PenTool className="w-6 h-6 text-indigo-600" /></div>
            <h3 className="font-bold text-xl text-slate-800">Smart Studio (v2.1.6)</h3>
        </div>
        <div className="flex gap-4">
             <button onClick={onCancel} className="px-5 py-2.5 text-slate-400 font-bold">Hủy</button>
             <button onClick={() => onConfirm(content)} className="px-8 py-2.5 bg-indigo-600 text-white rounded-xl font-bold shadow-lg shadow-indigo-100 transition-all active:scale-95">
                <Save className="w-4 h-4 mr-2 inline" /> Xác nhận chèn
             </button>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        <div className="w-64 bg-slate-50 border-r border-slate-100 p-4 space-y-2">
            <button onClick={() => setActiveTab('objectives')} className={`w-full text-left p-4 rounded-xl font-bold ${activeTab === 'objectives' ? 'bg-white shadow text-indigo-600' : 'text-slate-500'}`}>1. Mục tiêu</button>
            <button onClick={() => setActiveTab('materials')} className={`w-full text-left p-4 rounded-xl font-bold ${activeTab === 'materials' ? 'bg-white shadow text-indigo-600' : 'text-slate-500'}`}>2. Học liệu</button>
        </div>

        <div className="flex-1 p-8 bg-white overflow-y-auto">
            <label className="block text-[11px] font-black text-slate-400 uppercase mb-4 italic">Nội dung AI đề xuất (Nếu trống, hãy kiểm tra kết nối mạng):</label>
            <textarea 
                value={activeTab === 'objectives' ? content.objectives_addition : content.materials_addition} 
                onChange={(e) => updateField(activeTab === 'objectives' ? 'objectives_addition' : 'materials_addition', e.target.value)} 
                className="w-full h-[400px] p-6 rounded-2xl border-2 border-indigo-50 bg-slate-50/30 text-sm leading-relaxed text-slate-700 outline-none focus:border-indigo-500 transition-all"
                placeholder="Đang đợi nội dung từ AI..."
            />
        </div>
      </div>
    </div>
  );
};

export default SmartEditor;