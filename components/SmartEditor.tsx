import React, { useState, useEffect } from 'react';
import { GeneratedNLSContent } from '../types';
import { Save, PenTool, X } from 'lucide-react'; // Thêm icon X cho nút hủy nếu muốn đẹp hơn

interface SmartEditorProps {
  initialContent: GeneratedNLSContent;
  onConfirm: (finalContent: GeneratedNLSContent) => void;
  onCancel: () => void;
}

const SmartEditor: React.FC<SmartEditorProps> = ({ initialContent, onConfirm, onCancel }) => {
  const [content, setContent] = useState<GeneratedNLSContent>(initialContent);
  const [activeTab, setActiveTab] = useState<'objectives' | 'materials'>('objectives');

  // Sync prop changes (Giữ nguyên nếu logic app yêu cầu reset khi prop đổi)
  useEffect(() => {
    if (initialContent) {
      setContent(initialContent);
    }
  }, [initialContent]);

  // Sửa type any thành string vì input là textarea
  const updateField = (field: keyof GeneratedNLSContent, value: string) => {
    setContent(prev => ({ ...prev, [field]: value }));
  };

  const handleConfirm = () => {
    onConfirm(content);
  };

  return (
    <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col h-[600px] animate-in fade-in zoom-in duration-200">
      {/* Header */}
      <div className="bg-white border-b border-slate-100 px-8 py-5 flex justify-between items-center sticky top-0 z-10">
        <div className="flex items-center gap-4">
          <div className="p-2.5 bg-indigo-50 rounded-xl">
            <PenTool className="w-6 h-6 text-indigo-600" />
          </div>
          <h3 className="font-bold text-xl text-slate-800">Smart Studio Stable</h3>
        </div>
        <div className="flex gap-3">
          <button 
            onClick={onCancel} 
            className="px-5 py-2.5 text-slate-500 font-bold hover:bg-slate-50 rounded-xl transition-colors"
          >
            Hủy
          </button>
          <button 
            onClick={handleConfirm} 
            className="px-6 py-2.5 bg-indigo-600 text-white rounded-xl font-bold shadow-lg shadow-indigo-100 transition-all hover:bg-indigo-700 active:scale-95 flex items-center"
          >
            <Save className="w-4 h-4 mr-2" /> 
            Xác nhận
          </button>
        </div>
      </div>

      {/* Body */}
      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <div className="w-64 bg-slate-50 border-r border-slate-100 p-4 space-y-2">
          <button 
            onClick={() => setActiveTab('objectives')} 
            className={`w-full text-left p-4 rounded-xl font-bold transition-all ${
              activeTab === 'objectives' 
                ? 'bg-white shadow-sm text-indigo-600 border border-indigo-50' 
                : 'text-slate-500 hover:bg-slate-100 hover:text-slate-700' // ĐÃ SỬA: slate-50 -> slate-500
            }`}
          >
            1. Mục tiêu
          </button>
          <button 
            onClick={() => setActiveTab('materials')} 
            className={`w-full text-left p-4 rounded-xl font-bold transition-all ${
              activeTab === 'materials' 
                ? 'bg-white shadow-sm text-indigo-600 border border-indigo-50' 
                : 'text-slate-500 hover:bg-slate-100 hover:text-slate-700' // ĐÃ SỬA: slate-50 -> slate-500
            }`}
          >
            2. Học liệu
          </button>
        </div>

        {/* Editor Area */}
        <div className="flex-1 p-6 bg-white overflow-y-auto">
          <div className="h-full flex flex-col gap-2">
            <label className="text-sm font-semibold text-slate-400 uppercase tracking-wider">
                {activeTab === 'objectives' ? 'Nội dung mục tiêu bổ sung' : 'Nội dung học liệu bổ sung'}
            </label>
            <textarea 
              value={activeTab === 'objectives' ? content.objectives_addition : content.materials_addition} 
              onChange={(e) => updateField(activeTab === 'objectives' ? 'objectives_addition' : 'materials_addition', e.target.value)} 
              placeholder={activeTab === 'objectives' ? "Nhập mục tiêu bài giảng..." : "Nhập danh sách học liệu..."}
              className="w-full flex-1 p-6 rounded-2xl border-2 border-slate-100 bg-slate-50/50 text-base leading-relaxed text-slate-700 outline-none focus:border-indigo-500 focus:bg-white transition-all resize-none"
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default SmartEditor;