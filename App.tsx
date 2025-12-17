
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

  const normalize = (str: string) => {
    return str ? str.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase() : "";
  };

  const availableEffects = useMemo(() => {
    const effects = new Set<string>();
    supplements.forEach(s => {
      (s.positiveEffects || []).forEach(e => { if (e) effects.add(e); });
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
      const newSupps = result.supplements || [];
      setSupplements(prev => {
        const existingNames = new Set(prev.map(p => normalize(p.name)));
        const filteredNew = newSupps.filter(n => n.name && !existingNames.has(normalize(n.name)));
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
      setTimeout(() => document.getElementById('stack-result')?.scrollIntoView({ behavior: 'smooth' }), 100);
    } catch (err) {
      alert("Error generando mezcla.");
    } finally {
      setStackLoading(false);
    }
  };

  const resetFilters = () => {
    setSelectedCategory(null);
    setSelectedSubcategory(null);
    setSelectedEffect(null);
    setSearchQuery('');
  };

  return (
    <div className="min-h-screen pb-32 bg-slate-50">
      <header className="bg-white border-b sticky top-0 z-50 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-2 cursor-pointer" onClick={resetFilters}>
            <div className="w-10 h-10 bg-emerald-600 rounded-lg flex items-center justify-center text-white shadow-lg shadow-emerald-200">
              <i className="fa-solid fa-microscope text-xl"></i>
            </div>
            <div>
              <h1 className="text-xl font-black text-slate-900 tracking-tighter">SuppleMind <span className="text-emerald-600">Pro</span></h1>
              <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Biohacking basado en evidencia</p>
            </div>
          </div>

          <div className="flex flex-1 max-w-xl gap-2">
            <div className="relative flex-1">
              <input 
                type="text" 
                placeholder="Busca: 'angiogénesis', 'longevidad', 'foco'..."
                className="w-full pl-10 pr-4 py-3 bg-slate-100 border-2 border-transparent rounded-xl text-sm focus:border-emerald-500 focus:bg-white transition-all outline-none"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAISearch()}
              />
              <i className="fa-solid fa-search absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"></i>
            </div>
            <button 
              onClick={() => handleAISearch()}
              className="bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-3 rounded-xl text-sm font-black transition-all shadow-lg shadow-emerald-200"
            >
              <i className="fa-solid fa-wand-magic-sparkles"></i>
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {(sources || []).length > 0 && (
          <div className="mb-8 p-5 bg-emerald-50 border border-emerald-100 rounded-2xl animate-fade-in">
            <h4 className="text-[10px] font-black text-emerald-700 uppercase tracking-widest mb-3 flex items-center gap-2">
              <i className="fa-solid fa-book-open"></i> Referencias científicas
            </h4>
            <div className="flex flex-wrap gap-2">
              {sources.map((source, i) => (
                <a key={i} href={source.uri} target="_blank" rel="noopener noreferrer" className="text-[10px] bg-white border border-emerald-200 text-emerald-600 px-3 py-1.5 rounded-lg hover:bg-emerald-100 transition-all font-bold">
                  {source.title ? source.title.substring(0, 40) : 'Paper Científico'}...
                </a>
              ))}
            </div>
          </div>
        )}

        <section className="mb-16 bg-slate-900 rounded-[2.5rem] p-8 md:p-12 text-white relative overflow-hidden shadow-2xl">
          <div className="relative z-10 max-w-2xl">
            <span className="bg-emerald-500/20 text-emerald-400 px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest mb-6 inline-block border border-emerald-500/30">Protocolos Personalizados</span>
            <h2 className="text-4xl font-black mb-6 tracking-tight">Diseña tu Stack <span className="text-emerald-400">Sinérgico</span></h2>
            <div className="flex flex-col sm:flex-row gap-3">
              <input 
                type="text" 
                placeholder="Ej: 'angiogénesis nerviosa y salud de telómeros'..."
                className="flex-1 px-6 py-4 bg-white/5 border border-white/10 rounded-2xl text-lg focus:bg-white/10 focus:border-emerald-500 outline-none transition-all"
                value={customStackGoal}
                onChange={(e) => setCustomStackGoal(e.target.value)}
              />
              <button 
                onClick={() => handleGenerateStack(customStackGoal)}
                disabled={stackLoading}
                className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 px-8 py-4 rounded-2xl font-black transition-all flex items-center justify-center gap-3 active:scale-95 disabled:opacity-50"
              >
                {stackLoading ? <i className="fa-solid fa-atom fa-spin"></i> : <i className="fa-solid fa-bolt"></i>}
                GENERAR
              </button>
            </div>
          </div>
        </section>

        <div id="stack-result">
          {generatedStack && (
            <div className="mb-16 animate-fade-in bg-white border border-emerald-100 rounded-[2.5rem] overflow-hidden shadow-2xl">
              <div className="bg-emerald-600 p-10 text-white flex justify-between items-start">
                <div><h3 className="text-3xl font-black mb-2">{generatedStack.title}</h3><p className="text-emerald-50 opacity-90">{generatedStack.description}</p></div>
                <button onClick={() => setGeneratedStack(null)} className="p-2 hover:bg-black/10 rounded-full"><i className="fa-solid fa-times text-xl"></i></button>
              </div>
              <div className="p-10 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {generatedStack.items.map((item, i) => (
                  <div key={i} className="bg-slate-50 p-6 rounded-3xl border border-slate-100">
                    <h4 className="font-black text-slate-900 text-xl mb-4">{item.supplement}</h4>
                    <div className="space-y-3 text-sm">
                      <div className="flex justify-between border-b border-slate-200 pb-2"><span className="text-slate-400 font-bold uppercase">Dosis</span><span className="font-black text-emerald-700">{item.dosage}</span></div>
                      <div className="flex justify-between border-b border-slate-200 pb-2"><span className="text-slate-400 font-bold uppercase">Toma</span><span className="font-black text-slate-700">{item.timing}</span></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <section className="mb-12">
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
            {CATEGORIES.map(cat => (
              <button
                key={cat.id}
                onClick={() => { setSelectedCategory(cat.id === selectedCategory ? null : cat.id); setSelectedSubcategory(null); }}
                className={`flex flex-col items-center p-5 rounded-3xl transition-all border-2 ${selectedCategory === cat.id ? 'border-emerald-500 bg-white shadow-xl translate-y-[-4px]' : 'border-transparent bg-white shadow-sm'}`}
              >
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-3 ${cat.color} text-xl shadow-inner`}><i className={`fa-solid ${cat.icon}`}></i></div>
                <span className="text-[9px] font-black uppercase text-center tracking-tighter text-slate-600">{cat.name}</span>
              </button>
            ))}
          </div>
        </section>

        <section>
          <div className="flex items-center justify-between mb-10">
            <h2 className="text-3xl font-black text-slate-900">Catálogo de Suplementos</h2>
            {selectedCategory && (
              <div className="flex gap-2">
                {CATEGORIES.find(c => c.id === selectedCategory)?.subcategories.map(sub => (
                  <button 
                    key={sub} 
                    onClick={() => setSelectedSubcategory(sub === selectedSubcategory ? null : sub)}
                    className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase transition-all ${selectedSubcategory === sub ? 'bg-slate-800 text-white shadow-lg' : 'bg-white text-slate-400 border border-slate-200'}`}
                  >
                    {sub}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredSupplements.map(supp => (
              <SupplementCard key={supp.id} supplement={supp} />
            ))}
          </div>
        </section>
      </main>

      <footer className="fixed bottom-0 w-full bg-slate-900 text-white p-4 border-t border-white/5 backdrop-blur-md z-[60]">
        <div className="max-w-7xl mx-auto flex justify-between items-center px-4">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">⚠️ Uso educativo. No sustituye consejo médico.</p>
          <span className="text-[9px] font-black text-emerald-400 bg-emerald-400/10 px-3 py-1 rounded-full border border-emerald-400/20 uppercase tracking-widest">Grounding Active</span>
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
    <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm hover:shadow-2xl transition-all overflow-hidden flex flex-col group h-full border-b-4 hover:border-b-emerald-500">
      <div className="p-8 flex-1">
        <div className="flex justify-between items-start mb-6">
          <span className={`px-4 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-widest shadow-sm ${categoryInfo?.color || 'bg-slate-100 text-slate-600'}`}>
            {categoryInfo?.name || supplement.category}
          </span>
          <i className="fa-solid fa-vial text-slate-100 text-3xl opacity-50 group-hover:text-emerald-100 transition-colors"></i>
        </div>

        <h3 className="text-2xl font-black text-slate-900 mb-3 group-hover:text-emerald-700 transition-colors">{supplement.name}</h3>
        <p className="text-sm text-slate-500 mb-8 leading-relaxed line-clamp-3">{supplement.description}</p>

        <div className="space-y-6">
          <div className="bg-slate-50 p-5 rounded-3xl border border-slate-100 relative">
            <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Beneficios Clínicos</h4>
            <div className="min-h-[100px] flex flex-col justify-center">
              <div className="space-y-3">
                {positiveEffects.slice(benefitIndex, benefitIndex + MAX_VISIBLE).map((eff, i) => (
                  <div key={i} className="flex items-start gap-3 text-xs font-bold text-slate-700 animate-fade-in">
                    <i className="fa-solid fa-check-circle text-emerald-500 mt-0.5"></i> {eff}
                  </div>
                ))}
              </div>
            </div>

            {positiveEffects.length > MAX_VISIBLE && (
              <div className="flex items-center justify-between mt-6 pt-4 border-t border-slate-200/50">
                <div className="flex items-center gap-3">
                  <button onClick={prev} className="w-9 h-9 rounded-full bg-white border border-slate-200 text-slate-400 hover:text-emerald-600 hover:border-emerald-200 flex items-center justify-center transition-all shadow-sm">
                    <i className="fa-solid fa-arrow-left text-[10px]"></i>
                  </button>
                  <div className="flex gap-1.5">
                    {Array.from({ length: totalPages }).map((_, i) => (
                      <div key={i} className={`h-1.5 rounded-full transition-all ${i === benefitIndex ? 'w-5 bg-emerald-500' : 'w-1.5 bg-slate-200'}`} />
                    ))}
                  </div>
                  <button onClick={next} className="w-9 h-9 rounded-full bg-white border border-slate-200 text-slate-400 hover:text-emerald-600 hover:border-emerald-200 flex items-center justify-center transition-all shadow-sm">
                    <i className="fa-solid fa-arrow-right text-[10px]"></i>
                  </button>
                </div>
                <span className="text-[9px] font-black text-slate-300 uppercase">{benefitIndex + 1} / {totalPages}</span>
              </div>
            )}
          </div>

          {expanded && (
            <div className="animate-fade-in pt-6 space-y-6 border-t border-slate-100">
              <div>
                <h4 className="text-[10px] font-black text-rose-400 uppercase tracking-widest mb-3">Contraindicaciones</h4>
                <div className="flex flex-wrap gap-2">
                  {supplement.sideEffects.map((eff, i) => (
                    <span key={i} className="text-[10px] font-black text-rose-700 bg-rose-50 px-3 py-1.5 rounded-xl border border-rose-100 uppercase">{eff}</span>
                  ))}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                  <span className="block text-[8px] font-black text-slate-400 uppercase mb-1">Dosis Ideal</span>
                  <span className="text-xs font-black text-slate-900">{supplement.idealDose}</span>
                </div>
                <div className="bg-blue-50 p-4 rounded-2xl border border-blue-100">
                  <span className="block text-[8px] font-black text-blue-600 uppercase mb-1">Timing</span>
                  <span className="text-xs font-black text-slate-900">{supplement.timing || 'No especificado'}</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
      <button onClick={() => setExpanded(!expanded)} className="w-full py-5 bg-slate-50 text-[10px] font-black text-slate-400 uppercase tracking-widest hover:bg-emerald-600 hover:text-white transition-all flex items-center justify-center gap-3">
        {expanded ? 'Contraer' : 'Investigación Completa'} <i className={`fa-solid fa-chevron-${expanded ? 'up' : 'down'}`}></i>
      </button>
    </div>
  );
};

export default App;
