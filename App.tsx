
import React, { useState, useMemo, useEffect } from 'react';
import { CATEGORIES, INITIAL_SUPPLEMENTS } from './constants.tsx';
import { CategoryId, Supplement, GeneratedStack } from './types.ts';
import { searchSupplementsAI, generateStackAI } from './geminiService.ts';

const App: React.FC = () => {
  const [selectedCategory, setSelectedCategory] = useState<CategoryId | null>(null);
  const [selectedSubcategory, setSelectedSubcategory] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [supplements, setSupplements] = useState<Supplement[]>(INITIAL_SUPPLEMENTS);
  const [sources, setSources] = useState<{title: string, uri: string}[]>([]);
  const [loading, setLoading] = useState(false);
  const [generatedStack, setGeneratedStack] = useState<GeneratedStack | null>(null);
  const [stackLoading, setStackLoading] = useState(false);
  const [customStackGoal, setCustomStackGoal] = useState('');

  // Efecto para asegurar que el componente se montó correctamente
  useEffect(() => {
    console.log("EVOLUTRA: App montada correctamente.");
  }, []);

  const normalize = (str: string | undefined | null) => {
    if (!str) return "";
    return String(str).normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
  };

  const isFiltered = useMemo(() => {
    return !!(selectedCategory || selectedSubcategory || searchQuery.trim() || generatedStack);
  }, [selectedCategory, selectedSubcategory, searchQuery, generatedStack]);

  const filteredSupplements = useMemo(() => {
    return supplements.filter(s => {
      const sGoals = (s.goals || []).map(g => normalize(g));
      const sPosEffects = (s.positiveEffects || []).map(e => normalize(e));
      const sName = normalize(s.name);
      const sDesc = normalize(s.description);
      
      const qNorm = normalize(searchQuery);
      const subNorm = selectedSubcategory ? normalize(selectedSubcategory) : null;

      const matchesCategory = !selectedCategory || s.category === selectedCategory;
      const matchesSubcategory = !subNorm || sGoals.some(g => g.includes(subNorm) || subNorm.includes(g));
      const matchesSearch = !qNorm || 
                            sName.includes(qNorm) || 
                            sDesc.includes(qNorm) ||
                            sGoals.some(g => g.includes(qNorm)) ||
                            sPosEffects.some(e => e.includes(qNorm));
                            
      return matchesCategory && matchesSubcategory && matchesSearch;
    });
  }, [supplements, selectedCategory, selectedSubcategory, searchQuery]);

  const handleAISearch = async () => {
    if (!searchQuery.trim()) return;
    setLoading(true);
    setSources([]);
    try {
      const result = await searchSupplementsAI(searchQuery);
      if (result && result.supplements) {
        setSources(result.sources || []);
        setSupplements(prev => {
          const existingNames = new Set(prev.map(p => normalize(p.name)));
          const filteredNew = result.supplements.filter(n => n.name && !existingNames.has(normalize(n.name)));
          return [...prev, ...filteredNew];
        });
      }
    } catch (err) {
      console.error("AI Search Error:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateStack = async () => {
    if (!customStackGoal.trim()) return;
    setStackLoading(true);
    setGeneratedStack(null);
    try {
      const stack = await generateStackAI(customStackGoal);
      if (stack) {
        setGeneratedStack(stack);
        setTimeout(() => document.getElementById('stack-result')?.scrollIntoView({ behavior: 'smooth' }), 100);
      }
    } catch (err) {
      console.error("Stack Generation Error:", err);
    } finally {
      setStackLoading(false);
    }
  };

  const resetFilters = () => {
    setSelectedCategory(null);
    setSelectedSubcategory(null);
    setSearchQuery('');
    setGeneratedStack(null);
    setCustomStackGoal('');
    setSources([]);
    setSupplements(INITIAL_SUPPLEMENTS);
  };

  return (
    <div className="min-h-screen pb-32 bg-[#fdfdfb] text-slate-900">
      <header className="bg-white/80 backdrop-blur-xl border-b sticky top-0 z-50 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center gap-5 cursor-pointer group" onClick={resetFilters}>
            <div className="relative w-14 h-14 bg-[#3a2a1f] rounded-full flex items-center justify-center text-white shadow-xl overflow-hidden group-hover:scale-105 transition-all duration-500 border-2 border-[#4a3a2f]">
              <i className="fa-solid fa-leaf text-2xl text-emerald-400 relative z-10"></i>
            </div>
            <div>
              <h1 className="text-3xl font-black text-[#3a2a1f] tracking-tighter leading-none">EVOLUTRA</h1>
              <p className="text-[10px] text-emerald-700 font-bold uppercase tracking-[0.2em] mt-1.5">Ciencia de la suplementación</p>
            </div>
          </div>

          <div className="flex flex-1 max-w-xl gap-2 items-center">
            <div className="relative flex-1">
              <input 
                type="text" 
                placeholder="Busca ingredientes u objetivos..."
                className="w-full pl-12 pr-12 py-4 bg-slate-100 border-2 border-transparent rounded-[1.25rem] text-sm font-bold focus:border-[#3a2a1f] focus:bg-white transition-all outline-none text-slate-700"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAISearch()}
              />
              <i className="fa-solid fa-search absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"></i>
            </div>
            <button 
              onClick={handleAISearch}
              disabled={loading}
              className="bg-[#3a2a1f] text-white px-7 py-4 rounded-[1.25rem] text-sm font-black transition-all active:scale-95 disabled:opacity-50"
            >
              {loading ? <i className="fa-solid fa-circle-notch fa-spin"></i> : <i className="fa-solid fa-wand-magic-sparkles"></i>}
            </button>
            {isFiltered && (
              <button onClick={resetFilters} className="text-rose-500 bg-rose-50 p-4 rounded-[1.25rem] hover:bg-rose-100 transition-all shadow-sm">
                <i className="fa-solid fa-rotate-left"></i>
              </button>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {/* Fuentes AI */}
        {sources.length > 0 && (
          <div className="mb-8 p-6 bg-emerald-50 border border-emerald-100 rounded-[2rem] animate-fade-in">
            <h4 className="text-[10px] font-black text-emerald-700 uppercase tracking-widest mb-4">Evidencia científica:</h4>
            <div className="flex flex-wrap gap-2">
              {sources.map((source, i) => (
                <a key={i} href={source.uri} target="_blank" rel="noopener noreferrer" className="text-[11px] bg-white border border-emerald-200 text-emerald-700 px-4 py-2 rounded-xl hover:bg-emerald-600 hover:text-white transition-all font-bold">
                  {String(source.title).substring(0, 30)}...
                </a>
              ))}
            </div>
          </div>
        )}

        {/* Hero IA */}
        <section className="mb-16 bg-[#3a2a1f] rounded-[3.5rem] p-10 md:p-16 text-white relative overflow-hidden shadow-2xl">
          <div className="relative z-10 max-w-3xl">
            <span className="bg-emerald-500/20 text-emerald-400 px-5 py-2 rounded-full text-[10px] font-black uppercase tracking-[0.3em] mb-10 inline-block border border-emerald-500/30">Protocolos Inteligentes</span>
            <h2 className="text-5xl md:text-6xl font-black mb-10 tracking-tighter leading-[1]">Optimiza tu Biología</h2>
            <div className="flex flex-col sm:flex-row gap-4">
              <input 
                type="text" 
                placeholder="Ej: 'Claridad mental y enfoque'..."
                className="flex-1 px-8 py-6 bg-white/10 border border-white/20 rounded-[1.5rem] text-lg focus:bg-white/20 focus:border-emerald-500 outline-none transition-all placeholder:text-slate-500 font-bold"
                value={customStackGoal}
                onChange={(e) => setCustomStackGoal(e.target.value)}
              />
              <button 
                onClick={handleGenerateStack}
                disabled={stackLoading}
                className="bg-emerald-500 hover:bg-emerald-400 text-[#3a2a1f] px-14 py-6 rounded-[1.5rem] font-black transition-all flex items-center justify-center gap-3 active:scale-95 disabled:opacity-50 shadow-2xl text-lg"
              >
                {stackLoading ? <i className="fa-solid fa-atom fa-spin"></i> : "GENERAR"}
              </button>
            </div>
          </div>
        </section>

        <div id="stack-result">
          {generatedStack && (
            <div className="mb-16 animate-fade-in bg-white border border-emerald-100 rounded-[3.5rem] overflow-hidden shadow-2xl">
              <div className="bg-[#3a2a1f] p-12 text-white flex justify-between items-center">
                <div>
                  <h3 className="text-4xl font-black mb-3 text-white uppercase">{String(generatedStack.title)}</h3>
                  <p className="text-emerald-50/70 font-medium text-lg leading-relaxed">{String(generatedStack.description)}</p>
                </div>
                <button onClick={() => setGeneratedStack(null)} className="p-4 bg-white/5 hover:bg-rose-500/20 rounded-full">
                  <i className="fa-solid fa-times text-2xl"></i>
                </button>
              </div>
              <div className="p-12 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {(generatedStack.items || []).map((item, i) => (
                  <div key={i} className="bg-[#fdfdfb] p-10 rounded-[2.5rem] border border-slate-100 shadow-sm">
                    <h4 className="font-black text-slate-900 text-2xl mb-6">{String(item.supplement)}</h4>
                    <div className="space-y-4 text-sm font-bold">
                      <p className="text-emerald-700">Dosis: {String(item.dosage)}</p>
                      <p className="text-slate-700">Timing: {String(item.timing)}</p>
                      <p className="text-slate-500 leading-relaxed italic text-[13px]">"{String(item.reason)}"</p>
                    </div>
                  </div>
                ))}
              </div>
              <div className="bg-rose-50 border-t border-rose-100 p-8 text-center text-[12px] font-black text-rose-700 uppercase tracking-widest">
                ⚠️ {String(generatedStack.precautions)}
              </div>
            </div>
          )}
        </div>

        {/* Categorías */}
        <section className="mb-20">
          <h3 className="text-[12px] font-black text-slate-400 uppercase tracking-[0.5em] mb-10">Sistemas Biológicos</h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-4">
            {CATEGORIES.map(cat => (
              <button
                key={cat.id}
                onClick={() => { setSelectedCategory(cat.id === selectedCategory ? null : cat.id); setSelectedSubcategory(null); }}
                className={`flex flex-col items-center p-6 rounded-[2.5rem] transition-all border-2 ${selectedCategory === cat.id ? 'border-emerald-500 bg-white shadow-2xl -translate-y-2' : 'border-transparent bg-white shadow-sm hover:border-slate-200'}`}
              >
                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-4 ${cat.color} text-2xl shadow-inner`}><i className={`fa-solid ${cat.icon}`}></i></div>
                <span className="text-[10px] font-black uppercase text-center tracking-tighter text-slate-600 leading-tight">{cat.name}</span>
              </button>
            ))}
          </div>
        </section>

        {/* Directorio */}
        <section>
          <div className="flex flex-col lg:flex-row lg:items-end justify-between mb-16 gap-8">
            <div className="max-w-xl">
              <h2 className="text-4xl md:text-5xl font-black text-[#3a2a1f] tracking-tighter mb-4 uppercase">Directorio <span className="text-emerald-600">Bioactivo</span></h2>
              <p className="text-slate-400 text-sm font-bold uppercase tracking-[0.2em]">Extractos de grado premium</p>
            </div>
            {selectedCategory && (
              <div className="flex gap-2 overflow-x-auto pb-2 max-w-full">
                {CATEGORIES.find(c => c.id === selectedCategory)?.subcategories.map(sub => (
                  <button 
                    key={sub} 
                    onClick={() => setSelectedSubcategory(sub === selectedSubcategory ? null : sub)}
                    className={`whitespace-nowrap px-6 py-4 rounded-[1.25rem] text-[10px] font-black uppercase transition-all shadow-sm ${selectedSubcategory === sub ? 'bg-[#3a2a1f] text-white' : 'bg-white text-slate-400 border border-slate-100'}`}
                  >
                    {sub}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-12">
            {filteredSupplements.map(supp => (
              <SupplementCard key={supp.id} supplement={supp} />
            ))}
          </div>
          
          {filteredSupplements.length === 0 && (
            <div className="py-20 text-center bg-white rounded-[5rem] border-4 border-dashed border-slate-100">
              <p className="text-2xl font-black text-slate-300 uppercase tracking-widest">Sin resultados</p>
            </div>
          )}
        </section>
      </main>

      <footer className="fixed bottom-0 w-full bg-white/90 backdrop-blur-xl border-t p-8 z-[60]">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <p className="text-[11px] font-black text-[#3a2a1f] uppercase tracking-[0.2em]">EVOLUTRA - PREMIUM NUTRITION SCIENCE</p>
          <div className="flex items-center gap-3">
            <div className="h-3 w-3 bg-emerald-500 rounded-full animate-pulse"></div>
            <span className="text-[10px] font-black text-emerald-700 uppercase tracking-widest">AI Node Active</span>
          </div>
        </div>
      </footer>
    </div>
  );
};

const SupplementCard: React.FC<{ supplement: Supplement }> = ({ supplement }) => {
  const [expanded, setExpanded] = useState(false);
  const categoryInfo = CATEGORIES.find(c => c.id === supplement.category);

  return (
    <div className="bg-white rounded-[3.5rem] border border-slate-100 shadow-sm hover:shadow-2xl transition-all duration-500 overflow-hidden flex flex-col group h-full hover:border-b-emerald-600 border-b-8">
      <div className="p-10 flex-1">
        <div className="flex justify-between items-start mb-8">
          <span className={`px-5 py-2 rounded-xl text-[9px] font-black uppercase tracking-[0.2em] shadow-sm ${categoryInfo?.color || 'bg-slate-100 text-slate-600'}`}>
            {String(categoryInfo?.name || supplement.category)}
          </span>
        </div>
        <h3 className="text-2xl font-black text-[#3a2a1f] mb-4 uppercase leading-tight">{String(supplement.name)}</h3>
        <p className="text-[14px] text-slate-500 mb-8 leading-relaxed line-clamp-3">{String(supplement.description)}</p>

        {expanded && (
          <div className="animate-fade-in space-y-6 pt-6 border-t border-slate-50">
            <div className="space-y-2">
              <h4 className="text-[9px] font-black text-emerald-600 uppercase tracking-widest">Beneficios:</h4>
              {(supplement.positiveEffects || []).map((eff, i) => (
                <div key={i} className="text-xs font-bold text-slate-700 flex items-start gap-2">
                  <i className="fa-solid fa-check text-emerald-500 mt-0.5"></i> {String(eff)}
                </div>
              ))}
            </div>
            <div className="bg-slate-50 p-6 rounded-2xl">
              <p className="text-[10px] font-black text-slate-400 uppercase mb-2">Protocolo sugerido:</p>
              <p className="text-xs font-bold text-[#3a2a1f]">{String(supplement.idealDose)} - {String(supplement.timing || 'Mañana')}</p>
            </div>
          </div>
        )}
      </div>
      <button onClick={() => setExpanded(!expanded)} className="w-full py-6 bg-slate-50 text-[10px] font-black text-slate-400 uppercase tracking-[0.5em] hover:bg-[#3a2a1f] hover:text-white transition-all">
        {expanded ? 'OCULTAR' : 'DETALLES'}
      </button>
    </div>
  );
};

export default App;
