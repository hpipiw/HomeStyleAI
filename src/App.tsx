import React, { useState, useEffect, useRef } from 'react';
import { useDropzone } from 'react-dropzone';
import { motion, AnimatePresence } from 'motion/react';
import { Upload, Image as ImageIcon, Wand2, Plus, X, Check, Loader2, Download, RefreshCw } from 'lucide-react';
import { cn } from '@/lib/utils';
import { generateMakeover } from '@/services/gemini';

// Default styles
const DEFAULT_STYLES = [
  { id: 'nordic', name: '北歐風 (Nordic)' },
  { id: 'modern', name: '現代簡約 (Modern)' },
  { id: 'industrial', name: '工業風 (Industrial)' },
  { id: 'muji', name: '日式無印 (Muji)' },
  { id: 'luxury', name: '奢華風 (Luxury)' },
  { id: 'wabi-sabi', name: '侘寂風 (Wabi-sabi)' },
  { id: 'country', name: '鄉村風 (Country)' },
  { id: 'mid-century', name: '經典現代 (Mid-Century)' },
];

// Default preserved items
const DEFAULT_PRESERVED_ITEMS = [
  { id: 'walls', name: '牆壁 (Walls)' },
  { id: 'floor', name: '地板 (Floor)' },
  { id: 'ceiling', name: '天花板 (Ceiling)' },
  { id: 'large-furniture', name: '大型家具 (Large Furniture)' },
  { id: 'furniture-layout', name: '家具位置 (Layout)' },
  { id: 'lighting', name: '燈具 (Lighting)' },
  { id: 'windows', name: '窗戶 (Windows)' },
  { id: 'doors', name: '門 (Doors)' },
];

export default function App() {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [selectedStyle, setSelectedStyle] = useState<string | null>(null);
  const [customStyles, setCustomStyles] = useState<{ id: string; name: string }[]>([]);
  const [newStyleName, setNewStyleName] = useState('');
  const [preservedItems, setPreservedItems] = useState<string[]>([]);
  const [customPreservedItems, setCustomPreservedItems] = useState<{ id: string; name: string }[]>([]);
  const [newPreservedItemName, setNewPreservedItemName] = useState('');
  const [customPrompt, setCustomPrompt] = useState('');
  const [error, setError] = useState<string | null>(null);

  // Load custom styles and preserved items from localStorage
  useEffect(() => {
    const savedStyles = localStorage.getItem('customStyles');
    if (savedStyles) {
      setCustomStyles(JSON.parse(savedStyles));
    }
    const savedPreservedItems = localStorage.getItem('customPreservedItems');
    if (savedPreservedItems) {
      setCustomPreservedItems(JSON.parse(savedPreservedItems));
    }
  }, []);

  // Save custom styles to localStorage
  const addCustomStyle = () => {
    if (!newStyleName.trim()) return;
    const newStyle = { id: `custom-${Date.now()}`, name: newStyleName.trim() };
    const updatedStyles = [...customStyles, newStyle];
    setCustomStyles(updatedStyles);
    localStorage.setItem('customStyles', JSON.stringify(updatedStyles));
    setNewStyleName('');
    setSelectedStyle(newStyle.name); // Auto-select the new style
  };

  const removeCustomStyle = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const updatedStyles = customStyles.filter(s => s.id !== id);
    setCustomStyles(updatedStyles);
    localStorage.setItem('customStyles', JSON.stringify(updatedStyles));
    if (selectedStyle === customStyles.find(s => s.id === id)?.name) {
      setSelectedStyle(null);
    }
  };

  // Save custom preserved items to localStorage
  const addCustomPreservedItem = () => {
    if (!newPreservedItemName.trim()) return;
    const newItem = { id: `custom-item-${Date.now()}`, name: newPreservedItemName.trim() };
    const updatedItems = [...customPreservedItems, newItem];
    setCustomPreservedItems(updatedItems);
    localStorage.setItem('customPreservedItems', JSON.stringify(updatedItems));
    setNewPreservedItemName('');
    setPreservedItems(prev => [...prev, newItem.name]); // Auto-select
  };

  const removeCustomPreservedItem = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const itemToRemove = customPreservedItems.find(i => i.id === id);
    const updatedItems = customPreservedItems.filter(i => i.id !== id);
    setCustomPreservedItems(updatedItems);
    localStorage.setItem('customPreservedItems', JSON.stringify(updatedItems));
    
    if (itemToRemove && preservedItems.includes(itemToRemove.name)) {
      setPreservedItems(prev => prev.filter(i => i !== itemToRemove.name));
    }
  };

  const onDrop = (acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (file) {
      setFile(file);
      setPreview(URL.createObjectURL(file));
      setGeneratedImage(null);
      setError(null);
    }
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/png': ['.png'],
      'image/jpeg': ['.jpg', '.jpeg'],
      'image/webp': ['.webp'],
    },
    maxFiles: 1,
  } as any);

  const handleGenerate = async () => {
    if (!file || !selectedStyle) return;

    setIsGenerating(true);
    setError(null);
    try {
      const result = await generateMakeover(file, selectedStyle, preservedItems, customPrompt);
      setGeneratedImage(result);
    } catch (err) {
      console.error(err);
      setError('生成失敗，請稍後再試。 (Failed to generate image)');
    } finally {
      setIsGenerating(false);
    }
  };

  const togglePreservedItem = (itemName: string) => {
    setPreservedItems(prev => 
      prev.includes(itemName) 
        ? prev.filter(i => i !== itemName)
        : [...prev, itemName]
    );
  };

  const downloadImage = () => {
    if (!generatedImage) return;
    const link = document.createElement('a');
    link.href = generatedImage;
    link.download = `homestyle-makeover-${Date.now()}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans pb-20">
      {/* Header */}
      <header className="bg-slate-900/50 backdrop-blur-md border-b border-slate-800 sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="bg-emerald-500/20 p-2 rounded-lg border border-emerald-500/30">
              <Wand2 className="w-5 h-5 text-emerald-400" />
            </div>
            <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-emerald-400 to-teal-400">
              HomeStyle AI
            </h1>
          </div>
          <div className="text-sm text-slate-400 font-medium">
            居家風格改造助手
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Left Column: Controls */}
          <div className="lg:col-span-4 space-y-8">
            
            {/* Step 1: Upload */}
            <section>
              <h2 className="text-lg font-semibold mb-4 flex items-center gap-2 text-slate-200">
                <span className="flex items-center justify-center w-6 h-6 rounded-full bg-emerald-600 text-white text-xs">1</span>
                上傳照片 (Upload Photo)
              </h2>
              <div 
                {...getRootProps()} 
                className={cn(
                  "border-2 border-dashed rounded-xl p-8 transition-all cursor-pointer flex flex-col items-center justify-center text-center gap-4 bg-slate-900/50 hover:border-emerald-500/50 hover:bg-emerald-500/10",
                  isDragActive ? "border-emerald-500 bg-emerald-500/10" : "border-slate-700",
                  preview ? "border-emerald-500/30" : ""
                )}
              >
                <input {...getInputProps()} />
                {preview ? (
                  <div className="relative w-full aspect-video rounded-lg overflow-hidden shadow-sm ring-1 ring-slate-700">
                    <img src={preview} alt="Preview" className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-black/60 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                      <p className="text-white font-medium flex items-center gap-2">
                        <RefreshCw className="w-4 h-4" /> 更換照片
                      </p>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="w-12 h-12 rounded-full bg-slate-800 flex items-center justify-center text-slate-400">
                      <Upload className="w-6 h-6" />
                    </div>
                    <div>
                      <p className="font-medium text-slate-300">點擊或拖曳上傳照片</p>
                      <p className="text-sm text-slate-500 mt-1">支援 JPG, PNG</p>
                    </div>
                  </>
                )}
              </div>
            </section>

            {/* Step 2: Select Style */}
            <section>
              <h2 className="text-lg font-semibold mb-4 flex items-center gap-2 text-slate-200">
                <span className="flex items-center justify-center w-6 h-6 rounded-full bg-emerald-600 text-white text-xs">2</span>
                選擇風格 (Select Style)
              </h2>
              
              <div className="grid grid-cols-2 gap-3 mb-4">
                {DEFAULT_STYLES.map((style) => (
                  <button
                    key={style.id}
                    onClick={() => setSelectedStyle(style.name)}
                    className={cn(
                      "px-3 py-2.5 text-sm font-medium rounded-lg border text-left transition-all",
                      selectedStyle === style.name
                        ? "border-emerald-500 bg-emerald-500/20 text-emerald-300 ring-1 ring-emerald-500/50"
                        : "border-slate-700 bg-slate-800/50 text-slate-400 hover:border-slate-600 hover:bg-slate-800"
                    )}
                  >
                    {style.name}
                  </button>
                ))}
                {customStyles.map((style) => (
                  <button
                    key={style.id}
                    onClick={() => setSelectedStyle(style.name)}
                    className={cn(
                      "px-3 py-2.5 text-sm font-medium rounded-lg border text-left transition-all relative group pr-8",
                      selectedStyle === style.name
                        ? "border-emerald-500 bg-emerald-500/20 text-emerald-300 ring-1 ring-emerald-500/50"
                        : "border-slate-700 bg-slate-800/50 text-slate-400 hover:border-slate-600 hover:bg-slate-800"
                    )}
                  >
                    <span className="truncate block">{style.name}</span>
                    <span 
                      onClick={(e) => removeCustomStyle(style.id, e)}
                      className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-slate-500 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X className="w-3 h-3" />
                    </span>
                  </button>
                ))}
              </div>

              {/* Add Custom Style */}
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="自訂風格 (Custom Style)..."
                  value={newStyleName}
                  onChange={(e) => setNewStyleName(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && addCustomStyle()}
                  className="flex-1 px-3 py-2 text-sm bg-slate-900 border border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 text-slate-200 placeholder:text-slate-600"
                />
                <button
                  onClick={addCustomStyle}
                  disabled={!newStyleName.trim()}
                  className="px-3 py-2 bg-slate-800 text-white rounded-lg hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors border border-slate-700"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
            </section>

            {/* Step 3: Preserve Items */}
            <section>
              <h2 className="text-lg font-semibold mb-4 flex items-center gap-2 text-slate-200">
                <span className="flex items-center justify-center w-6 h-6 rounded-full bg-emerald-600 text-white text-xs">3</span>
                保留項目 (Preserve Items)
              </h2>
              <div className="flex flex-wrap gap-2 mb-4">
                {DEFAULT_PRESERVED_ITEMS.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => togglePreservedItem(item.name)}
                    className={cn(
                      "px-3 py-1.5 text-xs font-medium rounded-full border transition-all flex items-center gap-1.5",
                      preservedItems.includes(item.name)
                        ? "border-teal-500/50 bg-teal-500/20 text-teal-300"
                        : "border-slate-700 bg-slate-800/50 text-slate-400 hover:border-slate-600"
                    )}
                  >
                    {preservedItems.includes(item.name) && <Check className="w-3 h-3" />}
                    {item.name}
                  </button>
                ))}
                {customPreservedItems.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => togglePreservedItem(item.name)}
                    className={cn(
                      "px-3 py-1.5 text-xs font-medium rounded-full border transition-all flex items-center gap-1.5 relative group pr-7",
                      preservedItems.includes(item.name)
                        ? "border-teal-500/50 bg-teal-500/20 text-teal-300"
                        : "border-slate-700 bg-slate-800/50 text-slate-400 hover:border-slate-600"
                    )}
                  >
                    {preservedItems.includes(item.name) && <Check className="w-3 h-3" />}
                    {item.name}
                    <span 
                      onClick={(e) => removeCustomPreservedItem(item.id, e)}
                      className="absolute right-1.5 top-1/2 -translate-y-1/2 p-0.5 text-slate-500 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X className="w-3 h-3" />
                    </span>
                  </button>
                ))}
              </div>

              {/* Add Custom Preserved Item */}
              <div className="flex gap-2 mb-2">
                <input
                  type="text"
                  placeholder="自訂保留項目 (Custom Item)..."
                  value={newPreservedItemName}
                  onChange={(e) => setNewPreservedItemName(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && addCustomPreservedItem()}
                  className="flex-1 px-3 py-2 text-sm bg-slate-900 border border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 text-slate-200 placeholder:text-slate-600"
                />
                <button
                  onClick={addCustomPreservedItem}
                  disabled={!newPreservedItemName.trim()}
                  className="px-3 py-2 bg-slate-800 text-white rounded-lg hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors border border-slate-700"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>

              <p className="text-xs text-slate-500 ml-1">
                選中的項目將在改造過程中保持不變。
              </p>
            </section>

            {/* Step 4: Custom Instructions (Optional) */}
            <section>
              <h2 className="text-lg font-semibold mb-4 flex items-center gap-2 text-slate-200">
                <span className="flex items-center justify-center w-6 h-6 rounded-full bg-emerald-600 text-white text-xs">4</span>
                額外指令 (Optional Instructions)
              </h2>
              <textarea
                value={customPrompt}
                onChange={(e) => setCustomPrompt(e.target.value)}
                placeholder="例如：增加一些綠色植物，讓光線更明亮... (e.g., Add some plants, make it brighter...)"
                className="w-full px-3 py-2 text-sm bg-slate-900 border border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 min-h-[80px] resize-y text-slate-200 placeholder:text-slate-600"
              />
            </section>

            {/* Generate Button */}
            <button
              onClick={handleGenerate}
              disabled={!file || !selectedStyle || isGenerating}
              className={cn(
                "w-full py-4 rounded-xl font-bold text-lg shadow-lg shadow-emerald-500/20 transition-all flex items-center justify-center gap-2",
                !file || !selectedStyle || isGenerating
                  ? "bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700"
                  : "bg-gradient-to-r from-emerald-600 to-teal-600 text-white hover:shadow-emerald-500/30 hover:scale-[1.02] active:scale-[0.98]"
              )}
            >
              {isGenerating ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  生成中 (Generating)...
                </>
              ) : (
                <>
                  <Wand2 className="w-5 h-5" />
                  開始改造 (Generate)
                </>
              )}
            </button>

            {error && (
              <div className="p-3 bg-red-500/10 text-red-400 text-sm rounded-lg border border-red-500/20">
                {error}
              </div>
            )}
          </div>

          {/* Right Column: Result */}
          <div className="lg:col-span-8">
            <div className="bg-slate-900/50 rounded-2xl border border-slate-800 shadow-sm p-6 min-h-[600px] flex flex-col backdrop-blur-sm">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-semibold text-slate-200">預覽結果 (Result)</h2>
                {generatedImage && (
                  <button 
                    onClick={downloadImage}
                    className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-slate-300 bg-slate-800 rounded-lg hover:bg-slate-700 transition-colors border border-slate-700"
                  >
                    <Download className="w-4 h-4" />
                    下載圖片
                  </button>
                )}
              </div>

              <div className="flex-1 flex items-center justify-center bg-slate-950/50 rounded-xl border border-dashed border-slate-800 overflow-hidden relative">
                {!file ? (
                  <div className="text-center text-slate-600">
                    <ImageIcon className="w-12 h-12 mx-auto mb-3 opacity-20" />
                    <p>請先上傳照片並選擇風格</p>
                  </div>
                ) : (
                  <div className="relative w-full h-full flex items-center justify-center p-4">
                    <AnimatePresence mode="wait">
                      {generatedImage ? (
                        <motion.img
                          key="generated"
                          initial={{ opacity: 0, scale: 0.95 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0 }}
                          src={generatedImage}
                          alt="Generated Result"
                          className="max-w-full max-h-full object-contain rounded-lg shadow-lg ring-1 ring-slate-800"
                        />
                      ) : (
                        <motion.img
                          key="original"
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                          src={preview!}
                          alt="Original"
                          className={cn(
                            "max-w-full max-h-full object-contain rounded-lg shadow-lg ring-1 ring-slate-800 transition-all duration-500",
                            isGenerating ? "blur-sm opacity-50 scale-95" : ""
                          )}
                        />
                      )}
                    </AnimatePresence>
                    
                    {isGenerating && (
                      <div className="absolute inset-0 flex items-center justify-center z-10">
                        <div className="bg-slate-900/90 backdrop-blur-sm px-6 py-4 rounded-2xl shadow-xl flex flex-col items-center gap-3 border border-slate-800">
                          <Loader2 className="w-8 h-8 text-emerald-500 animate-spin" />
                          <p className="font-medium text-slate-300">AI 正在設計中...</p>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
              <div className="mt-4 text-center text-xs text-slate-600">
                Powered by Gemini 2.5 Flash Image
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
