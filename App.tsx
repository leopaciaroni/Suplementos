
import React, { useState, useEffect, useMemo } from 'react';
import { CATEGORIES, INITIAL_SUPPLEMENTS } from './constants';
import { CategoryId, Supplement, Category, GeneratedStack } from './types';
import { searchSupplementsAI, generateStackAI } from './geminiService';

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

  // Helper to normalize strings for comparison (removes accents)
  const normalize = (str: string) => {
    return str.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
  };

  // Extract all unique positive effects available in current supplements
  const availableEffects = useMemo(() => {
    const effects = new Set<string>();
    supplements.forEach(s => {
      (s.positiveEffects || []).forEach(e => {
        if (e) effects.add(e);
      });
    });
    return Array.from(effects).sort();
  }, [supplements]);

  const filteredSupplements = useMemo(() => {
    return supplements.filter(s => {
      const goals = (s.goals || []).map(g => normalize(g));
      const posEffects = (s.positiveEffects || []).map(e => normalize(e));
      const name = normalize(s.name || '');
      const description = normalize(s.description || '');
      
      const queryNorm = normalize(searchQuery);
      const subcatNorm = selectedSubcategory ? normalize(selectedSubcategory) : null;
      const effectNorm = selectedEffect ? normalize(selectedEffect) : null;

      const matchesCategory = !selectedCategory || s.category === selectedCategory;
      
      // Fuzzy match for subcategory
      const matchesSubcategory = !subcatNorm || goals.some(g => g.includes(subcatNorm) || subcatNorm.includes(g));
      
      const matchesEffect = !effectNorm || posEffects.some(e => e === effectNorm);
      
      const matchesSearch = !queryNorm || 
                            name.includes(queryNorm) || 
                            description.includes(queryNorm) ||
                            goals.some(g => g.includes(queryNorm)) ||
                            posEffects.some(e => e.includes(queryNorm));
                            
      return matchesCategory && matchesSubcategory && matchesEffect && matchesSearch;
    });
  }, [supplements, selectedCategory, selectedSubcategory, selectedEffect, searchQuery]);

  const handleAISearch = async (forcedQuery?: string) => {
    const targetQuery = forcedQuery || searchQuery;
    if (!targetQuery.trim()) return;
    
    setLoading(true);
    setIsSearchingAI(true);
    setSources([]);
    try {
      const result = await searchSupplementsAI(targetQuery);
      setSources(result.sources || []);
      
      const newSupplementsFromAI = result.supplements || [];
      setSupplements(prev => {
        const existingNames = new Set(prev.map(p => normalize(p.name || '')));
        const filteredNew = newSupplementsFromAI.filter(n => n.name && !existingNames.has(normalize(n.name)));
        return [...prev, ...filteredNew];
      });
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
      setIsSearchingAI(false);
    }
  };

  const handleGenerateStack = async (goal: string) => {
    if (!goal.trim()) return;
    setStackLoading(true);
    setGeneratedStack(null);
    try {
      const stack = await generateStackAI(goal);
      setGeneratedStack(stack);
      setTimeout(() => {
        document.getElementById('stack-result')?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    } catch (err) {
      alert("Error generando mezcla. Intenta de nuevo.");
    } finally {
      setStackLoading(false);
    }
  };

  const resetFilters = () => {
    setSelectedCategory(null);
    setSelectedSubcategory(null);
    setSelectedEffect(null);
    setSearchQuery('');
    setCustomStackGoal('');
  };

  return (
    <div className="min-h-screen pb-24 bg-slate-50">
      <header className="bg-white border-b sticky top-0 z-50 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-2 cursor-pointer" onClick={resetFilters}>
            <div className="w-10 h-10 bg-emerald-600 rounded-lg flex items-center justify-center text-white shadow-md shadow-emerald-200">
              <i className="fa-solid fa-microscope text-xl"></i>
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-900 tracking-tight">SuppleMind <span className="text-emerald-600">Pro</span></h1>
              <p className="text-[10px] text-slate-500 font-bold uppercase tracking-tighter">Investigación Científica Real</p>
            </div>
          </div>

          <div className="flex flex-1 max-w-xl gap-2">
            <div className="relative flex-1">
              <input 
                type="text" 
                placeholder="Investiga: 'Dormir mejor', 'Fuerza', 'Focus'..."
                className="w-full pl-10 pr-4 py-3 bg-slate-100 border-2 border-transparent rounded-xl text-sm focus:ring-0 focus:border-emerald-500 focus:bg-white transition-all outline-none"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAISearch()}
              />
              <i className="fa-solid fa-search absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 text-sm"></i>
            </div>
            <button 
              onClick={() => handleAISearch()}
              disabled={loading}
              className="bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-3 rounded-xl text-sm font-bold transition-all shadow-lg shadow-emerald-200 flex items-center gap-2 disabled:opacity-50"
            >
              {loading ? <i className="fa-solid fa-dna fa-spin"></i> : <i className="fa-solid fa-wand-magic-sparkles"></i>}
              <span className="hidden sm:inline">Investigar IA</span>
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* Grounding Sources */}
        {(sources || []).length > 0 && (
          <div className="mb-6 p-4 bg-emerald-50 border border-emerald-100 rounded-xl">
            <h4 className="text-[10px] font-bold text-emerald-700 uppercase tracking-widest mb-2 flex items-center gap-2">
              <i className="fa-solid fa-book-open"></i> Fuentes de la Investigación
            </h4>
            <div className="flex flex-wrap gap-2">
              {sources.map((source, i) => (
                <a key={i} href={source.uri} target="_blank" rel="noopener noreferrer" className="text-[10px] bg-white border border-emerald-200 text-emerald-600 px-2 py-1 rounded-lg hover:bg-emerald-100 transition-colors shadow-sm">
                  {source.title ? source.title.substring(0, 30) : 'Fuente'}...
                </a>
              ))}
            </div>
          </div>
        )}

        {/* Custom Stack Generator Section */}
        <section className="mb-12 bg-white rounded-[2.5rem] p-8 md:p-12 shadow-xl border border-emerald-50 relative overflow-hidden">
          <div className="relative z-10 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <div className="inline-flex items-center gap-2 bg-emerald-100 text-emerald-700 px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest mb-6">
                <i className="fa-solid fa-vial-circle-check"></i> Laboratorio de Stacks
              </div>
              <h2 className="text-4xl font-black text-slate-900 mb-6 tracking-tight">Crea tu Mezcla <span className="text-emerald-600 underline decoration-emerald-200 underline-offset-4">Personalizada</span></h2>
              <p className="text-slate-500 text-lg mb-8 leading-relaxed">
                Describe tu objetivo específico y nuestra IA diseñará un protocolo completo de suplementación basado en sinergia clínica.
              </p>
              
              <div className="flex flex-col sm:flex-row gap-3">
                <input 
                  type="text" 
                  placeholder="Ej: 'Optimizar Telómeros y Longevidad'"
                  className="flex-1 px-6 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl text-lg focus:ring-0 focus:border-emerald-500 focus:bg-white transition-all outline-none shadow-inner"
                  value={customStackGoal}
                  onChange={(e) => setCustomStackGoal(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleGenerateStack(customStackGoal)}
                />
                <button 
                  onClick={() => handleGenerateStack(customStackGoal)}
                  disabled={stackLoading || !customStackGoal.trim()}
                  className="bg-slate-900 hover:bg-emerald-600 text-white px-8 py-4 rounded-2xl font-black transition-all shadow-xl flex items-center justify-center gap-3 active:scale-95 disabled:opacity-30"
                >
                  {stackLoading ? <i className="fa-solid fa-atom fa-spin text-xl"></i> : <i className="fa-solid fa-bolt-lightning text-xl"></i>}
                  GENERAR
                </button>
              </div>
            </div>
            
            <div className="bg-slate-900 rounded-[2rem] p-8 text-white shadow-2xl relative">
              <h3 className="text-emerald-400 font-black text-xs uppercase tracking-widest mb-4">Sinergias Populares</h3>
              <div className="space-y-4">
                {[
                  { title: 'Focus Cognitivo Extremo', goal: 'Optimizar enfoque y memoria de trabajo' },
                  { title: 'Reparación de Telómeros', goal: 'Longevidad celular y salud cromosómica' },
                  { title: 'Recuperación Deportiva Pro', goal: 'Reducir inflamación y fatiga muscular' }
                ].map((item, i) => (
                  <button 
                    key={i}
                    onClick={() => {
                        setCustomStackGoal(item.goal);
                        handleGenerateStack(item.goal);
                    }}
                    className="w-full text-left p-4 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl transition-all group flex items-center justify-between"
                  >
                    <div>
                      <p className="font-bold text-sm group-hover:text-emerald-400 transition-colors">{item.title}</p>
                      <p className="text-[10px] text-slate-400 mt-1">{item.goal}</p>
                    </div>
                    <i className="fa-solid fa-plus text-slate-600 group-hover:text-emerald-400"></i>
                  </button>
                ))}
              </div>
            </div>
          </div>
          <i className="fa-solid fa-microscope absolute right-[-50px] bottom-[-50px] text-[300px] text-emerald-50/50 -rotate-12 pointer-events-none"></i>
        </section>

        {/* Generated Stack UI */}
        <div id="stack-result">
          {(stackLoading || generatedStack) && (
            <section className="mb-12">
              {stackLoading ? (
                <div className="bg-white rounded-3xl p-16 text-center border-2 border-dashed border-emerald-200 animate-pulse shadow-inner">
                  <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4 text-emerald-600">
                      <i className="fa-solid fa-atom fa-spin text-3xl"></i>
                  </div>
                  <p className="text-xl font-bold text-slate-800">Analizando Sinergias Médicas...</p>
                  <p className="text-slate-500 mt-2">Buscando interacciones seguras en PubMed y Cochrane Library.</p>
                </div>
              ) : generatedStack && (
                <div className="bg-white rounded-[2.5rem] shadow-2xl border border-emerald-100 overflow-hidden animate-in fade-in zoom-in duration-500">
                  <div className="bg-gradient-to-r from-emerald-600 to-teal-700 p-8 md:p-12 text-white">
                    <div className="flex justify-between items-start">
                      <div className="max-w-3xl">
                        <div className="flex items-center gap-3 mb-4">
                          <span className="bg-white/20 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border border-white/10">Stack de Precisión</span>
                        </div>
                        <h3 className="text-4xl font-black mb-4">{generatedStack.title}</h3>
                        <p className="text-emerald-50 text-xl leading-relaxed opacity-90">{generatedStack.description}</p>
                      </div>
                      <button onClick={() => setGeneratedStack(null)} className="bg-black/20 hover:bg-black/40 p-3 rounded-full transition-all hover:rotate-90">
                        <i className="fa-solid fa-times text-xl"></i>
                      </button>
                    </div>
                  </div>
                  <div className="p-8 md:p-12">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                      {(generatedStack.items || []).map((item, idx) => (
                        <div key={idx} className="bg-slate-50 p-8 rounded-[2rem] border border-slate-100 hover:border-emerald-200 transition-all hover:shadow-lg">
                          <div className="flex items-center gap-4 mb-6">
                              <span className="w-10 h-10 bg-emerald-600 text-white rounded-2xl flex items-center justify-center font-bold shadow-lg shadow-emerald-100">{idx + 1}</span>
                              <h4 className="font-bold text-slate-900 text-xl">{item.supplement}</h4>
                          </div>
                          <div className="space-y-4 text-sm">
                            <div className="flex justify-between border-b border-slate-200 pb-2">
                              <span className="text-slate-400 font-bold uppercase tracking-tighter text-[10px]">Dosis</span>
                              <span className="font-bold text-emerald-700">{item.dosage}</span>
                            </div>
                            <div className="flex justify-between border-b border-slate-200 pb-2">
                              <span className="text-slate-400 font-bold uppercase tracking-tighter text-[10px]">Timing</span>
                              <span className="font-bold text-slate-700">{item.timing}</span>
                            </div>
                            <p className="text-slate-600 italic leading-relaxed pt-2">"{item.reason}"</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </section>
          )}
        </div>

        {/* Categories Grid */}
        <section className="mb-12">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-2xl font-black text-slate-800 flex items-center gap-3">
              <i className="fa-solid fa-grid-2 text-emerald-600"></i> Áreas de Optimización
            </h2>
            {(selectedCategory || selectedSubcategory || selectedEffect) && (
               <button onClick={resetFilters} className="text-[10px] font-black text-emerald-600 border-2 border-emerald-100 px-4 py-2 rounded-xl uppercase tracking-widest hover:bg-emerald-50 transition-all">
                 Limpiar Filtros
               </button>
            )}
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-4">
            {CATEGORIES.map((cat) => (
              <button
                key={cat.id}
                onClick={() => {
                  setSelectedCategory(cat.id === selectedCategory ? null : cat.id);
                  setSelectedSubcategory(null);
                }}
                className={`flex flex-col items-center p-6 rounded-3xl transition-all border-2 group ${
                  selectedCategory === cat.id 
                    ? 'border-emerald-500 bg-white shadow-xl -translate-y-1' 
                    : 'border-transparent bg-white hover:border-slate-200 shadow-sm'
                }`}
              >
                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-4 transition-transform group-hover:scale-110 shadow-sm ${cat.color} text-2xl`}>
                  <i className={`fa-solid ${cat.icon}`}></i>
                </div>
                <span className="text-[10px] font-black text-center uppercase tracking-wider text-slate-600 group-hover:text-emerald-700">{cat.name}</span>
              </button>
            ))}
          </div>
        </section>

        {/* Dynamic Filters Section */}
        <section className="mb-12 flex flex-col gap-8">
          {selectedCategory && (
            <div className="animate-in fade-in slide-in-from-left-4 duration-500">
              <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4 ml-1">Especialidades</h3>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => setSelectedSubcategory(null)}
                  className={`px-5 py-2.5 rounded-xl text-xs font-black transition-all border-2 uppercase tracking-widest ${
                    !selectedSubcategory ? 'bg-slate-800 text-white border-slate-800 shadow-lg' : 'bg-white text-slate-400 border-slate-100 hover:border-slate-200'
                  }`}
                >
                  TODAS
                </button>
                {CATEGORIES.find(c => c.id === selectedCategory)?.subcategories.map(sub => (
                  <button
                    key={sub}
                    onClick={() => setSelectedSubcategory(sub)}
                    className={`px-5 py-2.5 rounded-xl text-xs font-black transition-all border-2 uppercase tracking-widest ${
                      selectedSubcategory === sub ? 'bg-emerald-600 text-white border-emerald-600 shadow-lg shadow-emerald-100' : 'bg-white text-slate-500 border-slate-100 hover:border-slate-200'
                    }`}
                  >
                    {sub}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="animate-in fade-in slide-in-from-right-4 duration-500 bg-white p-8 rounded-[2rem] border border-slate-100 shadow-sm">
            <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
              <i className="fa-solid fa-bolt text-amber-500"></i> Filtrar por Efecto Deseado
            </h3>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setSelectedEffect(null)}
                className={`px-4 py-2 rounded-xl text-[10px] font-black transition-all border-2 uppercase tracking-widest ${
                  !selectedEffect ? 'bg-indigo-600 text-white border-indigo-600 shadow-lg' : 'bg-slate-50 text-slate-400 border-transparent hover:border-slate-200'
                }`}
              >
                CUALQUIERA
              </button>
              {availableEffects.map(eff => (
                <button
                  key={eff}
                  onClick={() => setSelectedEffect(eff === selectedEffect ? null : eff)}
                  className={`px-4 py-2 rounded-xl text-[10px] font-black transition-all border-2 uppercase tracking-widest ${
                    selectedEffect === eff ? 'bg-indigo-600 text-white border-indigo-600 shadow-lg' : 'bg-slate-50 text-slate-500 border-transparent hover:border-slate-200'
                  }`}
                >
                  {eff}
                </button>
              ))}
            </div>
          </div>
        </section>

        {/* Results Container */}
        <section>
          <div className="flex items-center justify-between mb-10">
            <h2 className="text-3xl font-black text-slate-900 tracking-tight">
              {isSearchingAI ? 'Hallazgos de IA' : 'Catálogo de Suplementos'} 
              <span className="ml-4 text-sm font-bold text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full">{filteredSupplements.length} resultados</span>
            </h2>
          </div>

          {filteredSupplements.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {filteredSupplements.map((supp) => (
                <SupplementCard key={supp.id} supplement={supp} />
              ))}
            </div>
          ) : (
            <div className="bg-white rounded-[3rem] p-20 text-center border-2 border-dashed border-slate-200 shadow-inner">
              <div className="w-24 h-24 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-8 text-slate-200">
                <i className="fa-solid fa-magnifying-glass-chart text-5xl"></i>
              </div>
              <h3 className="text-3xl font-black text-slate-800 mb-4">Sin datos locales</h3>
              <p className="text-slate-500 mb-10 max-w-xl mx-auto text-lg leading-relaxed">
                Nuestra base de datos local no contiene exactamente lo que buscas.
                {" "}Gemini Pro puede investigar en tiempo real sobre este tema.
              </p>
              <button 
                onClick={() => handleAISearch(selectedSubcategory || searchQuery)}
                disabled={loading}
                className="bg-slate-900 hover:bg-emerald-600 text-white px-12 py-5 rounded-[1.5rem] font-black transition-all shadow-2xl flex items-center gap-4 mx-auto text-lg uppercase tracking-widest active:scale-95"
              >
                {loading ? <i className="fa-solid fa-spinner fa-spin"></i> : <i className="fa-solid fa-earth-americas"></i>}
                Consultar Web Científica
              </button>
            </div>
          )}
        </section>
      </main>

      <footer className="fixed bottom-0 w-full bg-slate-900/95 backdrop-blur-xl border-t border-white/5 px-6 py-4 z-[100] text-white">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="flex items-start gap-4 max-w-2xl">
            <div className="w-10 h-10 bg-amber-500 rounded-xl flex items-center justify-center text-slate-900 shadow-lg shadow-amber-500/20">
              <i className="fa-solid fa-triangle-exclamation"></i>
            </div>
            <div>
              <p className="text-[9px] leading-relaxed text-slate-400 font-bold uppercase tracking-wider mb-0.5">Nota Médica</p>
              <p className="text-[10px] leading-tight text-slate-200">
                Esta plataforma sintetiza literatura científica. <strong>No sustituye el diagnóstico médico.</strong> Consulte a su médico antes de iniciar cualquier protocolo.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-6">
            <span className="text-[10px] font-black text-emerald-400 uppercase tracking-widest">Grounding v2.5</span>
            <button onClick={() => window.scrollTo({top: 0, behavior: 'smooth'})} className="w-10 h-10 bg-white/5 hover:bg-white/10 rounded-full flex items-center justify-center transition-all border border-white/5">
                <i className="fa-solid fa-arrow-up text-xs"></i>
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
};

const SupplementCard: React.FC<{ supplement: Supplement }> = ({ supplement }) => {
  const [expanded, setExpanded] = useState(false);
  const categoryInfo = CATEGORIES.find(c => c.id === supplement.category);
  
  const goals = supplement.goals || [];
  const positiveEffects = supplement.positiveEffects || [];
  const sideEffects = supplement.sideEffects || [];

  // Carousel Logic for Positive Effects
  const MAX_VISIBLE_BENEFITS = 3;
  const hasManyBenefits = positiveEffects.length > MAX_VISIBLE_BENEFITS;
  const [benefitIndex, setBenefitIndex] = useState(0);

  const totalPages = Math.max(1, positiveEffects.length - MAX_VISIBLE_BENEFITS + 1);

  const nextBenefit = (e: React.MouseEvent) => {
    e.stopPropagation();
    setBenefitIndex((prev) => (prev + 1) % totalPages);
  };

  const prevBenefit = (e: React.MouseEvent) => {
    e.stopPropagation();
    setBenefitIndex((prev) => (prev - 1 + totalPages) % totalPages);
  };

  return (
    <div className="bg-white rounded-[2rem] shadow-sm border border-slate-100 hover:shadow-2xl transition-all group overflow-hidden flex flex-col h-full border-b-4 hover:border-b-emerald-500 relative">
      <div className="p-8 flex-1">
        <div className="flex justify-between items-start mb-6">
          <div className="flex gap-2 flex-wrap">
            <div className={`px-4 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest shadow-sm ${categoryInfo?.color || 'bg-slate-100 text-slate-600'}`}>
              {categoryInfo?.name || supplement.category}
            </div>
            <div className={`px-2 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-widest shadow-sm flex items-center gap-1.5 ${supplement.source === 'ai' ? 'bg-indigo-50 text-indigo-600 border border-indigo-100' : 'bg-slate-50 text-slate-500 border border-slate-100'}`}>
              <i className={`fa-solid ${supplement.source === 'ai' ? 'fa-wand-sparkles' : 'fa-database'}`}></i>
              {supplement.source === 'ai' ? 'IA Research' : 'Local Base'}
            </div>
          </div>
          <div className="text-slate-100 text-3xl group-hover:text-emerald-50 transition-colors opacity-40">
            <i className="fa-solid fa-flask-vial"></i>
          </div>
        </div>
        
        <h3 className="text-2xl font-black text-slate-900 mb-4 group-hover:text-emerald-700 transition-colors">{supplement.name}</h3>
        <p className="text-sm text-slate-500 mb-8 leading-relaxed line-clamp-3">{supplement.description}</p>
        
        <div className="flex flex-wrap gap-1.5 mb-10">
          {goals.map(goal => (
            <span key={goal} className="px-3 py-1 bg-slate-100 text-slate-600 rounded-lg text-[9px] font-black uppercase tracking-tighter border border-slate-200/50">
              {goal}
            </span>
          ))}
        </div>

        <div className="space-y-8">
          <div className="relative">
            <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
              <span className="w-2 h-2 bg-emerald-500 rounded-full"></span> Beneficios Clínicos
            </h4>
            
            <div className="relative min-h-[140px] bg-slate-50/50 p-4 rounded-2xl border border-slate-100">
              <div className="grid grid-cols-1 gap-3 h-[96px] overflow-hidden">
                {positiveEffects.slice(benefitIndex, benefitIndex + MAX_VISIBLE_BENEFITS).map((eff, i) => (
                  <div 
                    key={`${benefitIndex}-${i}`} 
                    className="flex items-start gap-3 text-xs text-slate-800 font-bold leading-tight animate-in fade-in slide-in-from-right-4 duration-300"
                  >
                    <i className="fa-solid fa-check-circle text-emerald-500 mt-0.5"></i>
                    {eff}
                  </div>
                ))}
              </div>

              {hasManyBenefits && (
                <div className="flex items-center justify-between mt-4 pt-3 border-t border-slate-200/50">
                  <div className="flex items-center gap-3">
                    <button 
                      onClick={prevBenefit}
                      className="group flex items-center gap-2 text-[9px] font-black text-slate-400 hover:text-emerald-600 transition-colors uppercase tracking-widest"
                    >
                      <i className="fa-solid fa-arrow-left"></i>
                      <span>Ant.</span>
                    </button>
                    
                    <div className="flex gap-1">
                      {Array.from({ length: totalPages }).map((_, i) => (
                        <div 
                          key={i} 
                          className={`h-1.5 rounded-full transition-all duration-300 ${i === benefitIndex ? 'w-4 bg-emerald-500 shadow-sm shadow-emerald-200' : 'w-1.5 bg-slate-200'}`} 
                        />
                      ))}
                    </div>

                    <button 
                      onClick={nextBenefit}
                      className="group flex items-center gap-2 text-[9px] font-black text-slate-400 hover:text-emerald-600 transition-colors uppercase tracking-widest"
                    >
                      <span>Sig.</span>
                      <i className="fa-solid fa-arrow-right"></i>
                    </button>
                  </div>
                  <span className="text-[9px] font-black text-slate-300 uppercase">
                    {benefitIndex + 1} / {totalPages}
                  </span>
                </div>
              )}
            </div>
          </div>

          {expanded && (
            <div className="animate-in fade-in slide-in-from-top-6 duration-700 space-y-8 pt-6 border-t border-slate-100">
              <div>
                <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                  <span className="w-2 h-2 bg-rose-500 rounded-full"></span> Contraindicaciones
                </h4>
                <div className="flex flex-wrap gap-2">
                  {sideEffects.map((eff, i) => (
                    <div key={i} className="text-[10px] text-rose-700 bg-rose-50 border border-rose-100 px-3 py-2 rounded-xl font-black tracking-tight">
                      {eff.toUpperCase()}
                    </div>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200/50">
                  <span className="text-[9px] font-black text-slate-400 uppercase block mb-1.5 tracking-tighter">Dosis Mínima</span>
                  <span className="text-sm font-black text-slate-900">{supplement.minDose}</span>
                </div>
                <div className="bg-emerald-50 p-5 rounded-2xl border border-emerald-100">
                  <span className="text-[9px] font-black text-emerald-600 uppercase block mb-1.5 tracking-tighter">Dosis Ideal</span>
                  <span className="text-sm font-black text-slate-900">{supplement.idealDose}</span>
                </div>
              </div>

              {supplement.timing && (
                <div className="bg-blue-50 p-5 rounded-2xl border border-blue-100 flex items-center gap-5">
                  <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-blue-600 shadow-sm border border-blue-100">
                    <i className="fa-regular fa-calendar-check text-xl"></i>
                  </div>
                  <div>
                    <span className="text-[9px] font-black text-blue-600 uppercase block tracking-tighter mb-0.5">Protocolo Sugerido</span>
                    <span className="text-sm font-black text-slate-900">{supplement.timing}</span>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
      
      <button 
        onClick={() => setExpanded(!expanded)}
        className="w-full py-6 px-8 bg-slate-50 text-[10px] font-black text-slate-500 uppercase tracking-widest hover:bg-emerald-600 hover:text-white transition-all flex items-center justify-center gap-4 group/btn active:bg-emerald-700"
      >
        {expanded ? 'Ocultar Evidencia' : 'Ver Investigación Completa'}
        <i className={`fa-solid fa-chevron-${expanded ? 'up' : 'right'} text-[12px] transition-transform ${expanded ? '' : 'group-hover/btn:translate-x-1'}`}></i>
      </button>
    </div>
  );
};

export default App;
