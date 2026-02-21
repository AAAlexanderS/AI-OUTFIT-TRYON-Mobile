import React, { useState } from 'react';

interface SectionProps {
  title: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
}

export const Section: React.FC<SectionProps> = ({ title, children, defaultOpen = false }) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div className="border-b border-white/5 last:border-0 pb-2">
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between py-3 text-left group"
      >
        <span className="text-sm font-bold text-zinc-300 group-hover:text-white transition-colors">{title}</span>
        <div className={`p-1 rounded-full bg-white/5 group-hover:bg-white/10 transition-colors`}>
          <svg 
            className={`w-3 h-3 text-zinc-500 group-hover:text-zinc-300 transform transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} 
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path>
          </svg>
        </div>
      </button>
      <div 
        className={`overflow-hidden transition-all duration-300 ease-in-out ${isOpen ? 'max-h-[2000px] opacity-100 mb-4' : 'max-h-0 opacity-0'}`}
      >
        {children}
      </div>
    </div>
  );
};