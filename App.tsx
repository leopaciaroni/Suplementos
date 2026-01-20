
import React, { useState, useMemo } from 'react';
import { CATEGORIES, INITIAL_SUPPLEMENTS } from './constants.tsx';
import { CategoryId, Supplement, GeneratedStack } from './types.ts';
import { searchSupplementsAI, generateStackAI } from './geminiService.ts';

const App: React.FC = () => {
  const [selectedCategory, setSelectedCategory] = useState<CategoryId | null>(null);
  const [selectedSubcategory, setSelectedSubcategory] = useState<string | null>(null);
  const [selectedEffect, setSelectedEffect] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [supplements, setSupplements] = useState<Supplement[]>(INITIAL_SUPPLEMENTS);
  const [sources, setSources] = useState<{title: string, uri: string}[]>([]);
  const [loading, setLoading] = useState(false);
  const [isSearchingAI, setIsSearchingAI] = useState(false);
  const [generatedStack, setGeneratedStack] = useState<GeneratedStack | null>(null);
  const [stackLoading, setStackLoading] = useState(false);
  const [customStackGoal, setCustomStackGoal] = useState('');

  const normalize = (str: string | undefined | null) => {
    if (!str) return "";
    return str.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
  };

  const isFiltered = useMemo(() => {
    return !!(selectedCategory || selectedSubcategory || selectedEffect || searchQuery.trim() || generatedStack);
  }, [selectedCategory, selectedSubcategory, selectedEffect, searchQuery, generatedStack]);

  const filteredSupplements = useMemo(() => {
    return supplements.filter(s => {
      const sGoals = (s.goals || []).map(g => normalize(g));
      const sPosEffects = (s.positiveEffects || []).map(e => normalize(e));
      const sName = normalize(s.name || '');
      const sDesc = normalize(s.description || '');
      
      const qNorm = normalize(searchQuery);
      const subNorm = selectedSubcategory ? normalize(selectedSubcategory) : null;
      const effNorm = selectedEffect ? normalize(selectedEffect) : null;

      const matchesCategory = !selectedCategory || s.category === selectedCategory;
      const matchesSubcategory = !subNorm || sGoals.some(g => g.includes(subNorm) || subNorm.includes(g));
      const matchesEffect = !effNorm || sPosEffects.some(e => e === effNorm);
      const matchesSearch = !qNorm || 
                            sName.includes(qNorm) || 
                            sDesc.includes(qNorm) ||
                            sGoals.some(g => g.includes(qNorm)) ||
                            sPosEffects.some(e => e.includes(qNorm));
                            
      return matchesCategory && matchesSubcategory && matchesEffect && matchesSearch;
    });
  }, [supplements, selectedCategory, selectedSubcategory, selectedEffect, searchQuery]);

  const handleAISearch = async () => {
    if (!searchQuery.trim()) return;
    
    setLoading(true);
    setIsSearchingAI(true);
    setSources([]);
    try {
      const result = await searchSupplementsAI(searchQuery);
      setSources(result.sources || []);
      const newSupps = result.supplements || [];
      setSupplements(prev => {
        const existingNames = new Set(prev.map(p => normalize(p.name)));
        const filteredNew = newSupps.filter(n => n.name && !existingNames.has(normalize(n.name)));
        return [...prev, ...filteredNew];
      });
    } catch (err) {
      console.error("AI Search Error:", err);
    } finally {
      setLoading(false);
      setIsSearchingAI(false);
    }
  };

  const handleGenerateStack = async () => {
    if (!customStackGoal.trim()) return;
    setStackLoading(true);
    setGeneratedStack(null);
    try {
      const stack = await generateStackAI(customStackGoal);
      setGeneratedStack(stack);
      setTimeout(() => document.getElementById('stack-result')?.scrollIntoView({ behavior: 'smooth' }), 100);
    } catch (err) {
      console.error("Stack Generation Error:", err);
      alert("Error al procesar el protocolo.");
    } finally {
      setStackLoading(false);
    }
  };

  const resetFilters = () => {
    setSelectedCategory(null);
    setSelectedSubcategory(null);
    setSelectedEffect(null);
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
          {/* Logo Evolutra */}
          <div className="flex items-center gap-5 cursor-pointer group" onClick={resetFilters}>
            <div className="relative w-14 h-14 bg-[#3a2a1f] rounded-full flex items-center justify-center text-white shadow-xl overflow-hidden group-hover:scale-105 transition-all duration-500 border-2 border-[#4a3a2f]">
              <div className="absolute inset-0 bg-gradient-to-tr from-emerald-600/30 via-transparent to-amber-500/10"></div>
              <i className="fa-solid fa-leaf text-2xl text-emerald-400 relative z-10 group-hover:rotate-12 transition-transform"></i>
            </div>
            <div>
              <h1 className="text-3xl font-black text-[#3a2a1f] tracking-tighter leading-none">EVOLUTRA</h1>
              <p className="text-[10px] text-emerald-700 font-bold uppercase tracking-[0.2em] mt-1.5">Ciencia de la suplementación natural</p>
            </div>
          </div>

          <div className="flex flex-1 max-w-xl gap-2 items-center">
            <div className="relative flex-1">
              <input 
                type="text" 
                placeholder="Busca por ingrediente u objetivo..."
                className="w-full pl-12 pr-12 py-4 bg-slate-100 border-2 border-transparent rounded-[1.25rem] text-sm font-bold focus:border-[#3a2a1f] focus:bg-white transition-all outline-none text-slate-700 shadow-inner"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAISearch()}
              />
              <i className="fa-solid fa-search absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"></i>
              {searchQuery && (
                <button 
                  onClick={() => setSearchQuery('')}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-300 hover:text-rose-500 transition-colors"
                >
                  <i className="fa-solid fa-circle-xmark"></i>
                </button>
              )}
            </div>
            <button 
              onClick={handleAISearch}
              disabled={loading}
              className="bg-[#3a2a1f] hover:bg-[#4a3a2f] text-white px-7 py-4 rounded-[1.25rem] text-sm font-black transition-all shadow-lg active:scale-95 disabled:opacity-50"
            >
              {loading ? <i className="fa-solid fa-circle-notch fa-spin"></i> : <i className="fa-solid fa-wand-magic-sparkles"></i>}
            </button>
            
            {isFiltered && (
              <button 
                onClick={resetFilters}
                className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-rose-500 hover:text-rose-600 transition-all ml-2 bg-rose-50 px-5 py-4 rounded-[1.25rem] whitespace-nowrap shadow-sm border border-rose-100"
              >
                <i className="fa-solid fa-rotate-left"></i>
                <span className="hidden sm:inline">Reiniciar</span>
              </button>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {/* Fuentes AI */}
        {sources.length > 0 && (
          <div className="mb-8 p-6 bg-emerald-50 border border-emerald-100 rounded-[2rem] animate-fade-in shadow-sm">
            <h4 className="text-[10px] font-black text-emerald-700 uppercase tracking-widest mb-4 flex items-center gap-2">
              <i className="fa-solid fa-microscope"></i> Evidencia científica localizada
            </h4>
            <div className="flex flex-wrap gap-2">
              {sources.map((source, i) => (
                <a key={i} href={source.uri} target="_blank" rel="noopener noreferrer" className="text-[11px] bg-white border border-emerald-200 text-emerald-700 px-4 py-2 rounded-xl hover:bg-emerald-600 hover:text-white transition-all font-bold flex items-center gap-2 shadow-sm">
                  <i className="fa-solid fa-link text-[8px]"></i>
                  {String(source.title).substring(0, 40)}...
                </a>
              ))}
            </div>
          </div>
        )}

        {/* Hero IA */}
        <section className="mb-16 bg-[#3a2a1f] rounded-[3.5rem] p-10 md:p-16 text-white relative overflow-hidden shadow-2xl">
          <div className="absolute top-[-80px] right-[-80px] w-[400px] h-[400px] bg-emerald-600/10 rounded-full blur-[100px]"></div>
          <div className="relative z-10 max-w-3xl">
            <span className="bg-emerald-500/20 text-emerald-400 px-5 py-2 rounded-full text-[10px] font-black uppercase tracking-[0.3em] mb-10 inline-block border border-emerald-500/30">Protocolos Inteligentes Evolutra</span>
            <h2 className="text-5xl md:text-6xl font-black mb-10 tracking-tighter leading-[1]">Optimiza tu Biología <br/><span className="text-emerald-400 italic font-serif">con Evolución AI</span></h2>
            <div className="flex flex-col sm:flex-row gap-4">
              <input 
                type="text" 
                placeholder="Objetivo: 'memoria y claridad mental'..."
                className="flex-1 px-8 py-6 bg-white/10 border border-white/20 rounded-[1.5rem] text-lg focus:bg-white/20 focus:border-emerald-500 outline-none transition-all placeholder:text-slate-500 font-bold"
                value={customStackGoal}
                onChange={(e) => setCustomStackGoal(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleGenerateStack()}
              />
              <button 
                onClick={handleGenerateStack}
                disabled={stackLoading}
                className="bg-emerald-500 hover:bg-emerald-400 text-[#3a2a1f] px-14 py-6 rounded-[1.5rem] font-black transition-all flex items-center justify-center gap-3 active:scale-95 disabled:opacity-50 shadow-2xl text-lg"
              >
                {stackLoading ? <i className="fa-solid fa-atom fa-spin"></i> : <i className="fa-solid fa-flask"></i>}
                GENERAR
              </button>
            </div>
          </div>
        </section>

        <div id="stack-result">
          {generatedStack && (
            <div className="mb-16 animate-fade-in bg-white border border-emerald-100 rounded-[3.5rem] overflow-hidden shadow-2xl">
              <div className="bg-[#3a2a1f] p-12 text-white flex flex-col md:flex-row justify-between items-start md:items-center border-b border-emerald-900/50 gap-6">
                <div className="flex-1">
                  <h3 className="text-4xl font-black mb-3 flex items-center gap-4 tracking-tighter uppercase text-white">
                    <i className="fa-solid fa-vial-circle-check text-emerald-400"></i>
                    {generatedStack.title}
                  </h3>
                  <p className="text-emerald-50/70 font-medium text-lg max-w-3xl leading-relaxed">{generatedStack.description}</p>
                </div>
                <button onClick={() => setGeneratedStack(null)} className="p-4 bg-white/5 hover:bg-rose-500/20 rounded-full transition-all border border-white/10">
                  <i className="fa-solid fa-times text-2xl"></i>
                </button>
              </div>
              <div className="p-12 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {generatedStack.items.map((item, i) => (
                  <div key={i} className="bg-[#fdfdfb] p-10 rounded-[2.5rem] border border-slate-100 shadow-sm group hover:border-emerald-300 transition-all duration-300">
                    <h4 className="font-black text-slate-900 text-2xl mb-6 flex items-center justify-between">
                      {String(item.supplement)}
                      <i className="fa-solid fa-capsules text-emerald-100 group-hover:text-emerald-500 transition-colors"></i>
                    </h4>
                    <div className="space-y-5 text-sm font-bold">
                      <div className="flex justify-between border-b border-slate-100 pb-4"><span className="text-slate-400 uppercase tracking-widest text-[10px]">Dosificación</span><span className="text-emerald-700">{String(item.dosage)}</span></div>
                      <div className="flex justify-between border-b border-slate-100 pb-4"><span className="text-slate-400 uppercase tracking-widest text-[10px]">Sincronía</span><span className="text-slate-700">{String(item.timing)}</span></div>
                      <p className="text-slate-500 leading-relaxed italic font-medium pt-3 text-[13px]">"{String(item.reason)}"</p>
                    </div>
                  </div>
                ))}
              </div>
              <div className="bg-rose-50 border-t border-rose-100 p-8 flex items-center justify-center gap-6">
                <i className="fa-solid fa-triangle-exclamation text-rose-500 text-3xl"></i>
                <p className="text-[12px] font-black text-rose-700 uppercase tracking-[0.2em] text-center max-w-2xl">{String(generatedStack.precautions)}</p>
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

        {/* Listado de Suplementos */}
        <section>
          <div className="flex flex-col lg:flex-row lg:items-end justify-between mb-16 gap-8">
            <div className="max-w-xl">
              <h2 className="text-4xl md:text-5xl font-black text-[#3a2a1f] tracking-tighter mb-4 uppercase">Directorio <span className="text-emerald-600">Bioactivo</span></h2>
              <p className="text-slate-400 text-sm font-bold uppercase tracking-[0.2em]">Sustancias de grado farmacéutico y extractos botánicos</p>
            </div>
            <div className="flex flex-wrap items-center gap-4">
              <div className="bg-white px-8 py-5 rounded-[2rem] shadow-sm border border-slate-100 flex items-center gap-6">
                <span className="text-4xl font-black text-[#3a2a1f] tabular-nums leading-none">{filteredSupplements.length}</span>
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">Compuestos<br/>Visibles</span>
              </div>
              {selectedCategory && (
                <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide max-w-[calc(100vw-4rem)] lg:max-w-md">
                  {CATEGORIES.find(c => c.id === selectedCategory)?.subcategories.map(sub => (
                    <button 
                      key={sub} 
                      onClick={() => setSelectedSubcategory(sub === selectedSubcategory ? null : sub)}
                      className={`whitespace-nowrap px-6 py-4 rounded-[1.25rem] text-[10px] font-black uppercase transition-all shadow-sm ${selectedSubcategory === sub ? 'bg-[#3a2a1f] text-white shadow-lg' : 'bg-white text-slate-400 border border-slate-100 hover:border-emerald-200'}`}
                    >
                      {sub}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-12">
            {filteredSupplements.map(supp => (
              <SupplementCard key={supp.id} supplement={supp} />
            ))}
          </div>
          
          {filteredSupplements.length === 0 && (
            <div className="py-32 text-center bg-white rounded-[5rem] border-4 border-dashed border-slate-100 shadow-inner mx-4">
              <i className="fa-solid fa-flask-vial text-6xl text-slate-200 mb-8"></i>
              <h3 className="text-2xl font-black text-slate-400 uppercase tracking-widest mb-10">Sin resultados activos</h3>
              <button onClick={resetFilters} className="bg-[#3a2a1f] text-white px-10 py-5 rounded-[1.5rem] font-black text-sm uppercase tracking-widest shadow-xl active:scale-95">
                Restablecer sistema
              </button>
            </div>
          )}
        </section>
      </main>

      <footer className="fixed bottom-0 w-full bg-white/90 backdrop-blur-xl border-t border-slate-100 p-8 z-[60]">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-8">
          <div className="flex items-center gap-6">
            <div className="w-12 h-12 bg-[#3a2a1f] rounded-[1rem] flex items-center justify-center text-white border border-[#4a3a2f]">
              <i className="fa-solid fa-leaf text-xl text-emerald-400"></i>
            </div>
            <div>
              <p className="text-[11px] font-black text-[#3a2a1f] uppercase tracking-[0.2em]">EVOLUTRA - PREMIUM NUTRITION SCIENCE</p>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] mt-1">⚠️ Uso informativo. Consulte siempre a un profesional médico.</p>
            </div>
          </div>
          <div className="flex items-center gap-8 text-[10px] font-black text-slate-300 uppercase tracking-widest">
            <div className="flex items-center gap-3">
              <div className="h-3 w-3 bg-emerald-500 rounded-full animate-pulse shadow-sm shadow-emerald-500"></div>
              <span className="text-emerald-700">AI Node Active</span>
            </div>
            <div className="w-px h-8 bg-slate-200 hidden md:block"></div>
            <span>Grounding v2.5 Online</span>
          </div>
        </div>
      </footer>
    </div>
  );
};

const SupplementCard: React.FC<{ supplement: Supplement }> = ({ supplement }) => {
  const [expanded, setExpanded] = useState(false);
  const [benefitIndex, setBenefitIndex] = useState(0);
  const categoryInfo = CATEGORIES.find(c => c.id === supplement.category);
  const positiveEffects = supplement.positiveEffects || [];
  const MAX_VISIBLE = 3;
  const totalPages = Math.max(1, positiveEffects.length - MAX_VISIBLE + 1);

  const next = (e: React.MouseEvent) => { e.stopPropagation(); setBenefitIndex((prev) => (prev + 1) % totalPages); };
  const prev = (e: React.MouseEvent) => { e.stopPropagation(); setBenefitIndex((prev) => (prev - 1 + totalPages) % totalPages); };

  return (
    <div className="bg-white rounded-[3.5rem] border border-slate-100 shadow-sm hover:shadow-2xl transition-all duration-500 overflow-hidden flex flex-col group h-full border-b-[10px] hover:border-b-emerald-600">
      <div className="p-12 flex-1">
        <div className="flex justify-between items-start mb-10">
          <span className={`px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] shadow-sm ${categoryInfo?.color || 'bg-slate-100 text-slate-600'}`}>
            {String(categoryInfo?.name || supplement.category)}
          </span>
          <div className="w-14 h-14 rounded-2xl bg-slate-50 flex items-center justify-center text-slate-200 group-hover:text-emerald-400 transition-colors shadow-inner">
            <i className="fa-solid fa-flask text-3xl"></i>
          </div>
        </div>

        <h3 className="text-3xl font-black text-[#3a2a1f] mb-6 tracking-tighter uppercase leading-tight">{String(supplement.name)}</h3>
        <p className="text-[15px] text-slate-500 mb-10 leading-relaxed font-medium line-clamp-3 group-hover:line-clamp-none transition-all duration-500">{String(supplement.description)}</p>

        <div className="space-y-8">
          <div className="bg-slate-50/50 p-8 rounded-[2.5rem] border border-slate-100 relative shadow-inner">
            <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.4em] mb-6">Evidencia Bioquímica</h4>
            <div className="min-h-[100px] flex flex-col justify-center">
              <div className="space-y-3">
                {positiveEffects.slice(benefitIndex, benefitIndex + MAX_VISIBLE).map((eff, i) => (
                  <div key={i} className="flex items-start gap-4 text-sm font-bold text-slate-700 animate-fade-in">
                    <i className="fa-solid fa-check-circle text-emerald-500 mt-1"></i> {String(eff)}
                  </div>
                ))}
              </div>
            </div>

            {positiveEffects.length > MAX_VISIBLE && (
              <div className="flex items-center justify-between mt-8 pt-6 border-t border-slate-200">
                <div className="flex items-center gap-4">
                  <button onClick={prev} className="w-10 h-10 rounded-xl bg-white border border-slate-200 text-slate-400 hover:text-emerald-600 transition-all flex items-center justify-center shadow-sm">
                    <i className="fa-solid fa-chevron-left text-[10px]"></i>
                  </button>
                  <button onClick={next} className="w-10 h-10 rounded-xl bg-white border border-slate-200 text-slate-400 hover:text-emerald-600 transition-all flex items-center justify-center shadow-sm">
                    <i className="fa-solid fa-chevron-right text-[10px]"></i>
                  </button>
                </div>
                <span className="text-[10px] font-black text-slate-300 tabular-nums uppercase">{benefitIndex + 1} / {totalPages}</span>
              </div>
            )}
          </div>

          {expanded && (
            <div className="animate-fade-in pt-10 space-y-8 border-t border-slate-100">
              <div>
                <h4 className="text-[10px] font-black text-rose-400 uppercase tracking-[0.4em] mb-4 flex items-center gap-3">
                  <i className="fa-solid fa-shield-halved"></i> Precauciones
                </h4>
                <div className="flex flex-wrap gap-2">
                  {(supplement.sideEffects || []).map((eff, i) => (
                    <span key={i} className="text-[11px] font-black text-rose-700 bg-rose-50 px-5 py-2 rounded-2xl border border-rose-100 uppercase">{String(eff)}</span>
                  ))}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-slate-50 p-6 rounded-[2rem] border border-slate-100">
                  <span className="block text-[9px] font-black text-slate-400 uppercase mb-2">Referencia Dosis</span>
                  <span className="text-sm font-black text-[#3a2a1f]">{String(supplement.idealDose)}</span>
                </div>
                <div className="bg-emerald-50/50 p-6 rounded-[2rem] border border-emerald-100">
                  <span className="block text-[9px] font-black text-emerald-700 uppercase mb-2">Sincronía</span>
                  <span className="text-sm font-black text-[#3a2a1f]">{String(supplement.timing || 'Mañana')}</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
      <button onClick={() => setExpanded(!expanded)} className="w-full py-8 bg-slate-50 text-[10px] font-black text-slate-400 uppercase tracking-[0.5em] hover:bg-[#3a2a1f] hover:text-white transition-all flex items-center justify-center gap-4">
        {expanded ? 'Ocultar Bio-Perfil' : 'Análisis Completo'} 
        <i className={`fa-solid fa-chevron-${expanded ? 'up' : 'down'} text-[9px]`}></i>
      </button>
    </div>
  );
};

export default App;
