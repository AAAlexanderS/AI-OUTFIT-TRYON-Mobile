
import React, { useState, useEffect } from 'react';
import { AppState, INITIAL_WARDROBE, Wardrobe, ClothingItem, AssetLibrary } from './types';
import { ImageUploader } from './components/ImageUploader';
import { AssetLibraryModal } from './components/AssetLibrary';
import { generateOutfit } from './services/geminiService';
import { PRESETS } from './constants';

const DAILY_LIMIT = 10;

// Helper to get random item from a list
const getRandom = (arr: string[]) => {
  if (!arr || arr.length === 0) return null;
  return arr[Math.floor(Math.random() * arr.length)];
};

// Section Title Component
const SectionTitle: React.FC<{ children: React.ReactNode, index: string }> = ({ children, index }) => (
  <div className="flex items-center gap-2 mb-3 mt-1">
    <span className="text-[10px] font-bold text-slate-400 dark:text-slate-600 tracking-widest uppercase">{index}.</span>
    <h3 className="text-[10px] font-bold text-slate-700 dark:text-slate-300 tracking-widest uppercase">
      {children}
    </h3>
  </div>
);

const App: React.FC = () => {
  // Asset Library State (Starts with PRESETS)
  const [assetLibrary, setAssetLibrary] = useState<AssetLibrary>(PRESETS);
  const [isLibraryOpen, setIsLibraryOpen] = useState(false);

  const [state, setState] = useState<AppState>({
    profilePhoto: null,
    profilePreviewUrl: null, 
    wardrobe: INITIAL_WARDROBE, 
  });

  const [isGenerating, setIsGenerating] = useState(false);
  const [countdown, setCountdown] = useState<number | null>(null);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [dailyCount, setDailyCount] = useState<number>(0);
  const [isDarkMode, setIsDarkMode] = useState(false);

  // Initialize Dark Mode
  useEffect(() => {
    if (localStorage.theme === 'light') {
      setIsDarkMode(false);
      document.documentElement.classList.remove('dark');
    } else {
      setIsDarkMode(true);
      document.documentElement.classList.add('dark');
    }
  }, []);

  const toggleTheme = () => {
    if (isDarkMode) {
      document.documentElement.classList.remove('dark');
      localStorage.theme = 'light';
      setIsDarkMode(false);
    } else {
      document.documentElement.classList.add('dark');
      localStorage.theme = 'dark';
      setIsDarkMode(true);
    }
  };

  // Initialize Daily Limit
  useEffect(() => {
    const today = new Date().toISOString().split('T')[0];
    const stored = localStorage.getItem('gemini_outfit_limit');
    if (stored) {
      try {
        const { date, count } = JSON.parse(stored);
        if (date === today) {
          setDailyCount(count);
        } else {
          localStorage.setItem('gemini_outfit_limit', JSON.stringify({ date: today, count: 0 }));
          setDailyCount(0);
        }
      } catch (e) {
        localStorage.setItem('gemini_outfit_limit', JSON.stringify({ date: today, count: 0 }));
        setDailyCount(0);
      }
    } else {
      localStorage.setItem('gemini_outfit_limit', JSON.stringify({ date: today, count: 0 }));
      setDailyCount(0);
    }
  }, []);

  // Use Effect to trigger initial randomization ONLY after library is ready
  useEffect(() => {
    if (!state.profilePreviewUrl) {
      // Small delay to ensure state is settled if we were loading from LS (not implemented here but good practice)
      randomizeAll();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Run once on mount

  const randomizeAll = () => {
    const profileUrl = getRandom(assetLibrary.profile);
    const uUrl = getRandom(assetLibrary.upperBody);
    const lUrl = getRandom(assetLibrary.lowerBody);
    const fUrl = getRandom(assetLibrary.footwear);
    const hUrl = getRandom(assetLibrary.headwear);
    const aUrl = getRandom(assetLibrary.accessories);

    setState({
      ...state,
      profilePhoto: null,
      profilePreviewUrl: profileUrl,
      wardrobe: {
        headwear: hUrl ? [{ id: `preset_h_${Date.now()}`, previewUrl: hUrl }] : [], 
        upperBody: uUrl ? [{ id: `preset_u_${Date.now()}`, previewUrl: uUrl }] : [],
        lowerBody: lUrl ? [{ id: `preset_l_${Date.now()}`, previewUrl: lUrl }] : [],
        footwear: fUrl ? [{ id: `preset_f_${Date.now()}`, previewUrl: fUrl }] : [],
        accessories: aUrl ? [{ id: `preset_a_${Date.now()}`, previewUrl: aUrl }] : [],
      }
    });
  };

  const randomizeProfile = () => {
    const url = getRandom(assetLibrary.profile);
    if (url) {
      setState(prev => ({
         ...prev,
         profilePhoto: null,
         profilePreviewUrl: url
      }));
    }
  };

  const randomizeWardrobeItem = (category: keyof AssetLibrary) => {
    const presetList = assetLibrary[category];
    const url = getRandom(presetList);
    
    // Map 'profile' category isn't a wardrobe item, handle others
    const wardrobeKey = category as keyof Wardrobe;
    
    if (!url) return;

    const newItem: ClothingItem = {
      id: `preset_${Date.now()}`,
      previewUrl: url
    };

    setState(prev => ({
      ...prev,
      wardrobe: {
        ...prev.wardrobe,
        [wardrobeKey]: [newItem]
      }
    }));
  };

  const incrementLimit = () => {
    const today = new Date().toISOString().split('T')[0];
    const newCount = dailyCount + 1;
    setDailyCount(newCount);
    localStorage.setItem('gemini_outfit_limit', JSON.stringify({ date: today, count: newCount }));
  };

  const addWardrobeItem = (category: keyof Wardrobe, file: File) => {
    const newItem: ClothingItem = {
      id: Date.now().toString() + Math.random().toString(),
      file,
      previewUrl: URL.createObjectURL(file)
    };

    setState(prev => {
      const currentList = prev.wardrobe[category];
      const limit = (category === 'headwear' || category === 'footwear') ? 1 : 2; // Updated limit logic
      if (currentList.length >= limit) return prev; 

      return {
        ...prev,
        wardrobe: {
          ...prev.wardrobe,
          [category]: [...currentList, newItem]
        }
      };
    });
  };

  const removeWardrobeItem = (category: keyof Wardrobe, id: string) => {
    setState(prev => ({
      ...prev,
      wardrobe: {
        ...prev.wardrobe,
        [category]: prev.wardrobe[category].filter(item => item.id !== id)
      }
    }));
  };

  const handleGenerate = async () => {
    if (dailyCount >= DAILY_LIMIT) {
      setError("Daily limit reached. Please come back tomorrow!");
      return;
    }

    if (!state.profilePreviewUrl) {
      setError("Please upload a profile photo first.");
      return;
    }
    
    setIsGenerating(true);
    setCountdown(35); // Estimated generation time: 30s
    setError(null);
    setGeneratedImage(null);

    // Start timer
    const timer = setInterval(() => {
        setCountdown((prev) => {
            if (prev === null || prev <= 1) return 1; // Hold at 1s if generation takes longer
            return prev - 1;
        });
    }, 1000);

    try {
      const imageUrl = await generateOutfit(state);
      setGeneratedImage(imageUrl);
      incrementLimit();
    } catch (err: any) {
      console.error("Generation error:", err);
      let errorMessage = err.message || "Failed to generate outfit. Please try again.";
      
      if (errorMessage.includes("referer") || errorMessage.includes("403")) {
        errorMessage = "API Key Error: The API key is restricted and blocked this request. Please check your API key referrer restrictions in Google Cloud Console.";
      }
      
      setError(errorMessage);
    } finally {
      clearInterval(timer);
      setCountdown(null);
      setIsGenerating(false);
    }
  };

  return (
    <div className="h-screen w-full bg-slate-100 dark:bg-slate-950 text-slate-900 dark:text-slate-50 font-sans overflow-hidden flex flex-col relative selection:bg-indigo-500/30 selection:text-indigo-200 transition-colors duration-300">
      
      {/* Background Ambience - Subtle */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
         <div className="absolute top-[-30%] left-[-10%] w-[50vw] h-[50vw] bg-indigo-500/5 rounded-full blur-[100px]" />
      </div>

      {/* Asset Library Modal */}
      <AssetLibraryModal 
        isOpen={isLibraryOpen}
        onClose={() => setIsLibraryOpen(false)}
        library={assetLibrary}
        onUpdateLibrary={setAssetLibrary}
      />

      {/* Header */}
      <header className="flex-shrink-0 h-14 border-b border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-950/80 backdrop-blur-xl flex items-center justify-between px-5 z-20">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center shadow-lg shadow-indigo-500/20 text-white">
             <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M13 10V3L4 14h7v7l9-11h-7z"/></svg>
          </div>
          <h1 className="text-xs font-bold tracking-widest text-slate-900 dark:text-white uppercase">AI Outfit Try-On</h1>
        </div>
        
        <div className="flex items-center gap-4">
          {/* Library Button */}
          <button 
            onClick={() => setIsLibraryOpen(true)}
            className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-100 dark:bg-slate-800 text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors border border-transparent dark:border-slate-700"
          >
             <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"></path></svg>
             <span>Library</span>
          </button>

          <button onClick={toggleTheme} className="text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors">
              {isDarkMode ? (
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
              ) : (
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" /></svg>
              )}
          </button>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 flex flex-col-reverse md:flex-row overflow-hidden z-10 relative">
        
        {/* Left Panel (Dashboard) */}
        <div className="w-full md:w-[320px] flex-shrink-0 h-auto md:h-full flex flex-col bg-white dark:bg-slate-950 border-t md:border-t-0 md:border-r border-slate-200 dark:border-slate-800 transition-colors duration-300 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)] md:shadow-none z-20">
           
           <div className="flex-1 overflow-x-auto md:overflow-x-hidden md:overflow-y-auto custom-scrollbar p-4 pb-0 flex flex-row md:flex-col gap-4 md:gap-0 items-center md:items-stretch">
             
             {/* 01. IDENTITY */}
             <div className="mb-0 md:mb-6 flex-shrink-0">
               <div className="hidden md:block">
                 <SectionTitle index="01">Identity</SectionTitle>
               </div>
               
               <div className="w-24 h-24 md:w-full md:aspect-square">
                  <ImageUploader 
                      label="Profile"
                      maxFiles={1}
                      previewUrl={state.profilePreviewUrl}
                      onRandomize={randomizeProfile}
                      onFileSelect={(file) => setState(prev => ({ ...prev, profilePhoto: file, profilePreviewUrl: URL.createObjectURL(file) }))}
                      onClear={() => setState(prev => ({ ...prev, profilePhoto: null, profilePreviewUrl: null }))}
                  />
               </div>
             </div>

             {/* 02. GARMENTS */}
             <div className="pb-0 md:pb-6 flex flex-row md:flex-col gap-4">
                <div className="hidden md:block">
                   <SectionTitle index="02">Garments</SectionTitle>
                </div>
                
                <div className="flex flex-row md:flex-col gap-4">
                   {/* Row 1: Upper & Lower Body */}
                   <div className="flex flex-row md:grid md:grid-cols-2 gap-4 md:gap-3">
                      <div className="h-24 w-20 md:w-auto md:h-40 flex-shrink-0">
                          <ImageUploader 
                             label="Upper"
                             maxFiles={2}
                             images={state.wardrobe.upperBody}
                             onRandomize={() => randomizeWardrobeItem('upperBody')}
                             onFileSelect={(f) => addWardrobeItem('upperBody', f)}
                             onRemove={(id) => removeWardrobeItem('upperBody', id)}
                           />
                      </div>
                      <div className="h-24 w-20 md:w-auto md:h-40 flex-shrink-0">
                          <ImageUploader 
                             label="Lower"
                             maxFiles={2}
                             images={state.wardrobe.lowerBody}
                             onRandomize={() => randomizeWardrobeItem('lowerBody')}
                             onFileSelect={(f) => addWardrobeItem('lowerBody', f)}
                             onRemove={(id) => removeWardrobeItem('lowerBody', id)}
                           />
                      </div>
                   </div>

                   {/* Row 2: Accessories */}
                   <div className="flex flex-row md:grid md:grid-cols-3 gap-4 md:gap-3">
                      <div className="w-20 h-20 md:w-auto md:aspect-square flex-shrink-0">
                          <ImageUploader 
                             label="Head"
                             compact
                             maxFiles={1}
                             images={state.wardrobe.headwear}
                             onRandomize={() => randomizeWardrobeItem('headwear')}
                             onFileSelect={(f) => addWardrobeItem('headwear', f)}
                             onRemove={(id) => removeWardrobeItem('headwear', id)}
                          />
                      </div>
                      <div className="w-20 h-20 md:w-auto md:aspect-square flex-shrink-0">
                          <ImageUploader 
                             label="Acc"
                             compact
                             maxFiles={3}
                             images={state.wardrobe.accessories}
                             onRandomize={() => randomizeWardrobeItem('accessories')}
                             onFileSelect={(f) => addWardrobeItem('accessories', f)}
                             onRemove={(id) => removeWardrobeItem('accessories', id)}
                          />
                      </div>
                      <div className="w-20 h-20 md:w-auto md:aspect-square flex-shrink-0">
                          <ImageUploader 
                             label="Shoes"
                             compact
                             maxFiles={1}
                             images={state.wardrobe.footwear}
                             onRandomize={() => randomizeWardrobeItem('footwear')}
                             onFileSelect={(f) => addWardrobeItem('footwear', f)}
                             onRemove={(id) => removeWardrobeItem('footwear', id)}
                          />
                      </div>
                   </div>
                </div>
             </div>
           </div>

           {/* Footer */}
           <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 z-20">
             <div className="flex justify-between items-center mb-3 md:mb-4">
                <span className="hidden md:inline text-[10px] font-bold text-slate-500 uppercase tracking-widest">Daily Usage</span>
                <div className="h-6 px-3 min-w-[60px] flex items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 ml-auto md:ml-0">
                    <span className={`text-[10px] font-mono font-bold ${dailyCount >= DAILY_LIMIT ? 'text-rose-500' : 'text-slate-600 dark:text-slate-400'}`}>
                        {DAILY_LIMIT - dailyCount}/{DAILY_LIMIT}
                    </span>
                </div>
             </div>
             
             <button 
                onClick={handleGenerate}
                disabled={isGenerating || dailyCount >= DAILY_LIMIT}
                className={`
                  w-full py-3 rounded-lg font-bold text-xs tracking-widest uppercase
                  flex items-center justify-center gap-2 transition-all duration-300 shadow-sm
                  ${isGenerating || dailyCount >= DAILY_LIMIT
                    ? 'bg-slate-100 dark:bg-slate-800 text-slate-400 cursor-not-allowed' 
                    : 'bg-indigo-600 text-white hover:bg-indigo-700 hover:shadow-indigo-500/20'
                  }
                `}
              >
                {isGenerating ? (
                  <>
                    <svg className="animate-spin -ml-1 h-3.5 w-3.5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <span>Processing {countdown !== null ? `(${countdown}s)` : '...'}</span>
                  </>
                ) : (
                  <>Generate Outfit</>
                )}
             </button>

             {error && (
                <div className="mt-3 text-center">
                   <p className="text-rose-500 text-[10px] font-medium leading-tight">{error}</p>
                </div>
             )}
           </div>
        </div>

        {/* Right Panel - Preview */}
        <div className="flex-1 flex items-center justify-center bg-slate-50 dark:bg-black/50 relative">
            {/* Background Grid */}
           <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 pointer-events-none"></div>
           
           {generatedImage ? (
             <div className="relative w-full h-full p-10 flex items-center justify-center animate-fadeIn z-10">
                <div className="relative max-h-full rounded-lg overflow-hidden shadow-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 group">
                  <img src={generatedImage} alt="Generated Outfit" className="max-h-[85vh] w-auto object-contain" />
                  
                  <div className="absolute bottom-6 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                     <a 
                       href={generatedImage} 
                       download={`outfit_tryon_${Date.now()}.png`}
                       className="bg-white text-black px-5 py-2.5 rounded-full text-[10px] font-bold uppercase tracking-widest shadow-xl flex items-center gap-2 hover:scale-105 transition-transform"
                     >
                       Download Image
                     </a>
                  </div>
                </div>
             </div>
           ) : (
             <div className="text-center opacity-40 select-none pointer-events-none">
                <div className="w-24 h-24 mx-auto rounded-full border border-dashed border-slate-300 dark:border-slate-700 flex items-center justify-center mb-6 text-slate-400 dark:text-slate-600">
                  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>
                </div>
                <h3 className="text-slate-500 dark:text-slate-400 font-bold text-sm tracking-widest uppercase mb-2">Preview Area</h3>
                <p className="text-slate-400 dark:text-slate-500 text-[10px]">Upload your profile and garments on the left</p>
             </div>
           )}
        </div>
      </div>
    </div>
  );
};

export default App;
