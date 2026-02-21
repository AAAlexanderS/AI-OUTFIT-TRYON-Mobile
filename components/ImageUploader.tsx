
import React from 'react';

interface ImageUploaderProps {
  label?: string;
  images?: { id: string; previewUrl: string }[]; 
  previewUrl?: string | null; 
  onFileSelect: (file: File) => void;
  onRemove?: (id: string) => void;
  onClear?: () => void;
  onRandomize?: () => void;
  compact?: boolean;
  aspectRatio?: string;
  maxFiles?: number;
}

export const ImageUploader: React.FC<ImageUploaderProps> = ({ 
  label, 
  images = [],
  previewUrl, 
  onFileSelect, 
  onRemove,
  onClear,
  onRandomize,
  compact = false,
  aspectRatio,
  maxFiles = 1
}) => {
  
  const displayImages = previewUrl 
    ? [{ id: 'single', previewUrl }] 
    : images;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      onFileSelect(e.target.files[0]);
      e.target.value = '';
    }
  };

  const isMulti = maxFiles > 1;

  // Optimized aspect ratios
  // If no aspectRatio prop is provided, we default to full h/w fit or specific ratios based on context
  const dimensionClass = aspectRatio || 'h-full w-full';

  return (
    <div className="flex flex-col h-full group/uploader">
      {label && (
        <div className="flex justify-between items-center mb-2 px-0.5">
          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest leading-none">
            {label}
          </span>
          {onRandomize && (
            <button 
              onClick={onRandomize}
              className="text-slate-400 hover:text-indigo-600 transition-colors opacity-0 group-hover/uploader:opacity-100"
              title="Shuffle"
            >
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path>
              </svg>
            </button>
          )}
        </div>
      )}

      <div className={`relative ${dimensionClass} bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg overflow-hidden hover:border-slate-300 dark:hover:border-slate-600 transition-all duration-300 group/box shadow-sm`}>
        
        <div className="w-full h-full flex">
          {displayImages.length > 0 ? (
            <div className={`w-full h-full ${isMulti ? 'grid grid-cols-2 gap-px bg-slate-200 dark:bg-slate-800' : ''}`}>
              {displayImages.map((img) => (
                <div 
                  key={img.id} 
                  className={`relative h-full w-full overflow-hidden bg-white dark:bg-slate-900 group/item`}
                >
                  <img 
                    src={img.previewUrl} 
                    alt="Upload" 
                    className="w-full h-full object-cover" 
                  />
                  
                  {/* Remove Button */}
                  <button 
                    onClick={(e) => {
                      e.preventDefault();
                      if (maxFiles === 1 && onClear) onClear();
                      else if (onRemove) onRemove(img.id);
                    }}
                    className="absolute top-1 right-1 p-1 bg-white/90 dark:bg-slate-900/90 hover:bg-rose-500 hover:text-white text-slate-600 dark:text-slate-300 rounded-full shadow-sm opacity-0 group-hover/item:opacity-100 transition-all duration-200 z-10"
                  >
                    <svg className="w-2.5 h-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
                    </svg>
                  </button>
                </div>
              ))}

              {isMulti && displayImages.length < maxFiles && (
                <label className="relative h-full w-full flex flex-col items-center justify-center cursor-pointer bg-slate-50 dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors group/add">
                   <div className="w-8 h-8 rounded-full border border-slate-200 dark:border-slate-700 text-slate-300 dark:text-slate-600 flex items-center justify-center group-hover/add:border-indigo-500/50 group-hover/add:text-indigo-500 transition-all">
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M12 4v16m8-8H4"></path></svg>
                   </div>
                  <input type="file" className="hidden" accept="image/*" onChange={handleFileChange} />
                </label>
              )}
            </div>
          ) : (
            <label className="w-full h-full flex flex-col items-center justify-center cursor-pointer bg-slate-50 dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors relative group/empty">
              <div className="w-10 h-10 rounded-full border border-slate-200 dark:border-slate-700 text-slate-300 dark:text-slate-600 flex items-center justify-center group-hover/empty:border-indigo-500/50 group-hover/empty:text-indigo-500 group-hover/empty:scale-110 transition-all duration-300">
                 <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                   <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1" d="M12 4v16m8-8H4"></path>
                 </svg>
              </div>
              <input type="file" className="hidden" accept="image/*" onChange={handleFileChange} />
            </label>
          )}

          {displayImages.length > 0 && displayImages.length === maxFiles && isMulti && (
             <div className="absolute bottom-1 right-1 w-2 h-2 bg-emerald-500 rounded-full shadow-sm pointer-events-none z-10"></div>
          )}
        </div>
      </div>
    </div>
  );
};
