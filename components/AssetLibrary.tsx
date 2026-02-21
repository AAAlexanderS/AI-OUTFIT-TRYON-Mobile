
import React, { useState, useRef } from 'react';
import { AssetLibrary } from '../types';

interface AssetLibraryProps {
  isOpen: boolean;
  onClose: () => void;
  library: AssetLibrary;
  onUpdateLibrary: (newLibrary: AssetLibrary) => void;
}

type CategoryKey = keyof AssetLibrary;

const CATEGORIES: { key: CategoryKey; label: string }[] = [
  { key: 'profile', label: 'Models' },
  { key: 'upperBody', label: 'Tops' },
  { key: 'lowerBody', label: 'Bottoms' },
  { key: 'headwear', label: 'Headwear' },
  { key: 'footwear', label: 'Shoes' },
  { key: 'accessories', label: 'Accessories' },
];

export const AssetLibraryModal: React.FC<AssetLibraryProps> = ({ isOpen, onClose, library, onUpdateLibrary }) => {
  const [activeTab, setActiveTab] = useState<CategoryKey>('profile');
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const newUrls: string[] = [];
    Array.from(files).forEach(file => {
      const url = URL.createObjectURL(file as File);
      newUrls.push(url);
    });

    const updatedLibrary = {
      ...library,
      [activeTab]: [...newUrls, ...library[activeTab]] // Add new items to the start
    };

    onUpdateLibrary(updatedLibrary);
    
    // Reset input
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleDelete = (index: number) => {
    const currentList = library[activeTab];
    const newList = currentList.filter((_, i) => i !== index);
    
    onUpdateLibrary({
      ...library,
      [activeTab]: newList
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fadeIn">
      <div className="w-full max-w-4xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950">
          <div className="flex items-center gap-3">
             <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white shadow-lg shadow-indigo-500/20">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>
             </div>
             <div>
               <h2 className="text-sm font-bold text-slate-900 dark:text-white tracking-widest uppercase">Asset Library</h2>
               <p className="text-[10px] text-slate-500 dark:text-slate-400">Manage placeholder resources</p>
             </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-full text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
          </button>
        </div>

        {/* Content */}
        <div className="flex flex-col md:flex-row flex-1 overflow-hidden">
          
          {/* Sidebar Tabs */}
          <div className="w-full md:w-48 flex-shrink-0 bg-slate-50 dark:bg-slate-950 border-b md:border-b-0 md:border-r border-slate-200 dark:border-slate-800 flex flex-row md:flex-col p-2 gap-1 overflow-x-auto md:overflow-y-auto custom-scrollbar">
            {CATEGORIES.map(cat => (
              <button
                key={cat.key}
                onClick={() => setActiveTab(cat.key)}
                className={`text-left px-4 py-3 rounded-lg text-xs font-bold uppercase tracking-wider transition-all flex-shrink-0 whitespace-nowrap ${
                  activeTab === cat.key 
                    ? 'bg-white dark:bg-slate-800 text-indigo-600 dark:text-white shadow-sm border border-slate-200 dark:border-slate-700' 
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-800'
                }`}
              >
                <div className="flex justify-between items-center gap-2">
                  <span>{cat.label}</span>
                  <span className={`text-[9px] px-1.5 py-0.5 rounded ${activeTab === cat.key ? 'bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400' : 'bg-slate-200 dark:bg-slate-800 text-slate-500 dark:text-slate-500'}`}>{library[cat.key].length}</span>
                </div>
              </button>
            ))}
          </div>

          {/* Grid Area */}
          <div className="flex-1 bg-white dark:bg-slate-900 flex flex-col min-h-0">
            
            {/* Action Bar */}
            <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center bg-white dark:bg-slate-900">
               <span className="text-xs text-slate-500">
                  Showing {library[activeTab].length} items in <span className="text-slate-900 dark:text-white font-bold">{CATEGORIES.find(c => c.key === activeTab)?.label}</span>
               </span>
               <div>
                  <input 
                    type="file" 
                    ref={fileInputRef}
                    multiple 
                    accept="image/*" 
                    className="hidden" 
                    onChange={handleFileUpload}
                  />
                  <button 
                    onClick={() => fileInputRef.current?.click()}
                    className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white text-[10px] font-bold uppercase tracking-widest rounded-lg hover:bg-indigo-700 transition-colors shadow-sm shadow-indigo-500/20"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"></path></svg>
                    Upload New
                  </button>
               </div>
            </div>

            {/* Grid */}
            <div className="flex-1 overflow-y-auto p-4 md:p-6 custom-scrollbar bg-slate-50/50 dark:bg-black/20">
              {library[activeTab].length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-slate-400 dark:text-slate-600">
                   <svg className="w-12 h-12 mb-2 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>
                   <span className="text-xs font-medium">No assets in this category</span>
                </div>
              ) : (
                <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                  {library[activeTab].map((url, idx) => (
                    <div key={`${activeTab}-${idx}`} className="group relative aspect-[3/4] bg-white dark:bg-slate-800 rounded-lg overflow-hidden border border-slate-200 dark:border-slate-700 hover:border-indigo-500 dark:hover:border-indigo-500 transition-all shadow-sm hover:shadow-md">
                      <img src={url} alt="Asset" className="w-full h-full object-cover" />
                      
                      <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                         <button 
                            onClick={() => handleDelete(idx)}
                            className="p-2 bg-white text-rose-500 rounded-full hover:bg-rose-500 hover:text-white hover:scale-110 transition-all shadow-lg"
                            title="Delete Asset"
                         >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                         </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
