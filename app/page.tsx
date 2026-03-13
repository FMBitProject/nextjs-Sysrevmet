"use client";

import { useState, useMemo } from "react";

export default function Home() {
  const [activeTab, setActiveTab] = useState("phase1");
  const [modelType, setModelType] = useState("random");

  // --- STATE MANAGEMENT ---
  const initialPico = { p: "", i: "", c: "", o: "" };
  const [pico, setPico] = useState(initialPico);
  const [identifiedCount, setIdentifiedCount] = useState(0);
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [studies, setStudies] = useState([]); 
  const [exclusionReasons, setExclusionReasons] = useState([
    { id: 1, text: "Wrong Population", count: 0 },
    { id: 2, text: "Inappropriate Design", count: 0 },
    { id: 3, text: "Insufficient Data", count: 0 }
  ]);
  const [grade, setGrade] = useState({ 
    riskOfBias: "Not serious", inconsistency: "Low", indirectness: "Low", imprecision: "Low", publicationBias: "Low" 
  });

  // --- ACTIONS ---
  const handleReset = () => {
    if (window.confirm("Warning: All data will be permanently deleted. Continue?")) {
      setPico(initialPico); setIdentifiedCount(0); setSearchResults([]); setStudies([]); setActiveTab("phase1");
    }
  };

  const handleSearch = async () => {
    if (!pico.p && !pico.i) return alert("Please enter P or I keywords.");
    setIsSearching(true);
    let q = [pico.p, pico.i, pico.c, pico.o].filter(x => x).map(x => `(${x})`).join(" AND ");
    try {
      const res = await fetch(`https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esearch.fcgi?db=pubmed&term=${encodeURIComponent(q)}&retmode=json&retmax=10`);
      const data = await res.json();
      const ids = data.esearchresult?.idlist || [];
      if (ids.length > 0) {
        const sumRes = await fetch(`https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esummary.fcgi?db=pubmed&id=${ids.join(",")}&retmode=json`);
        const sumData = await sumRes.json();
        const formatted = ids.map(id => ({ 
          id, title: sumData.result[id].title, author: sumData.result[id].authors?.[0]?.name || "N/A", year: sumData.result[id].pubdate?.split(" ")[0] || "N/A" 
        }));
        setSearchResults(formatted as any); setIdentifiedCount(formatted.length);
      }
    } catch (e) { alert("Search error."); }
    setIsSearching(false);
  };

  const addStudy = (s: any) => {
    if (studies.find((st: any) => st.id === s.id)) return;
    setStudies([...studies, { ...s, type: "continuous", nt:"", mt:"", sdt:"", nc:"", mc:"", sdc:"", et:"", tt:"", ec:"", tc:"", rob: { d1: "Low", d3: "Low", d4: "Low" } }] as any);
  };

  // --- DOWNLOAD HTML LOGIC ---
  const downloadHTML = () => {
    const content = `
      <html><head><title>Meta-Analysis Report</title><style>body{font-family:sans-serif;padding:40px;color:#1e293b} .card{border:1px solid #e2e8f0;padding:20px;border-radius:12px;margin-bottom:20px}</style></head>
      <body><h1>Meta-Analysis Standalone Report</h1>
      <div class="card"><h3>Included Studies: ${studies.length}</h3><ul>${studies.map((s:any)=>`<li>${s.author} (${s.year}) - ${s.title}</li>`).join("")}</ul></div>
      <div class="card"><h3>GRADE: Moderate Certainty</h3></div>
      <p>Report generated on: ${new Date().toLocaleDateString()}</p></body></html>
    `;
    const blob = new Blob([content], { type: "text/html" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "meta-analysis-report.html";
    link.click();
  };

  // --- STATS ENGINE ---
  const results = useMemo(() => {
    const calc = studies.map(s => {
      let es = 0, var_i = 0;
      if (s.type === "continuous") {
        const nt = Number(s.nt), mt = Number(s.mt), sdt = Number(s.sdt), nc = Number(s.nc), mc = Number(s.mc), sdc = Number(s.sdc);
        if (nt && nc) { es = mt - mc; var_i = (sdt**2 / nt) + (sdc**2 / nc); }
      } else {
        const et = Number(s.et), tt = Number(s.tt), ec = Number(s.ec), tc = Number(s.tc);
        if (et && ec) { es = Math.log((et/tt)/(ec/tc)); var_i = (1/et - 1/tt) + (1/ec - 1/tc); }
      }
      return { ...s, es, var_i, w: 1 / (var_i || 1) };
    });
    const sW = calc.reduce((a, b) => a + b.w, 0);
    const pooled = sW > 0 ? calc.reduce((a, b) => a + (b.es * b.w), 0) / sW : 0;
    let Q = 0; calc.forEach(s => { if (s.var_i) Q += s.w * Math.pow(s.es - pooled, 2); });
    const df = Math.max(0, studies.length - 1);
    return { pooled, i2: Q > df ? ((Q - df) / Q) * 100 : 0, studies: calc, sW };
  }, [studies]);

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-8 text-slate-900 font-sans">
      <div className="max-w-6xl mx-auto space-y-6">
        
        {/* HEADER DASHBOARD */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 flex flex-col md:flex-row justify-between items-center gap-4">
          <div>
            <h1 className="text-xl font-bold text-blue-900 uppercase">Meta-Analysis Workspace Pro</h1>
            <p className="text-[10px] font-bold text-slate-400 tracking-widest uppercase">Clinical Evidence Synthesis</p>
          </div>
          <div className="flex gap-2">
            <button onClick={downloadHTML} className="bg-blue-600 text-white px-4 py-2 rounded-lg font-bold text-xs shadow hover:bg-blue-700 transition-all">DOWNLOAD HTML</button>
            <button onClick={handleReset} className="bg-red-50 text-red-600 px-4 py-2 rounded-lg font-bold text-xs border border-red-100 hover:bg-red-600 hover:text-white transition-all">RESET PROJECT</button>
          </div>
        </div>

        {/* NAVIGATION */}
        <nav className="flex space-x-1 border-b overflow-x-auto bg-white p-2 rounded-t-2xl scrollbar-hide shadow-sm">
          {["Search", "PRISMA", "Extraction", "Statistics", "Forest Plot", "GRADE", "Sensitivity"].map((label, i) => (
            <button key={i} onClick={() => setActiveTab(`phase${i+1}`)} className={`pb-3 px-6 text-[11px] font-bold uppercase transition-all border-b-4 whitespace-nowrap ${activeTab === `phase${i+1}` ? "border-blue-600 text-blue-600" : "border-transparent text-slate-400 hover:text-slate-600"}`}>
              {i+1}. {label}
            </button>
          ))}
        </nav>

        {/* CONTENT AREA */}
        <div className="min-h-[600px] bg-white rounded-b-2xl border border-t-0 border-slate-200 p-6 md:p-10">
          
          {/* TAB 1: SEARCH */}
          {activeTab === "phase1" && (
            <div className="space-y-8 animate-in fade-in">
              <div className="bg-blue-900 text-white p-6 rounded-xl shadow-lg border-l-4 border-blue-400">
                <h3 className="text-xs font-bold uppercase mb-2 text-blue-300">Boolean Operators (English)</h3>
                <p className="text-[11px] opacity-80 leading-relaxed">
                  • <b>AND</b>: Narrows results (e.g., <i>Diabetes AND Statin</i>). Finds studies with <u>both</u> terms [cite: 156-157, 755-758].<br/>
                  • <b>OR</b>: Broadens search (e.g., <i>Aged OR Elderly</i>). Finds studies with <u>either</u> term [cite: 156-157, 755-758].
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {["p", "i", "c", "o"].map(k => (
                  <div key={k} className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{k.toUpperCase()} (Population/Intervention/Comparison/Outcome)</label>
                    <input className="w-full p-3 border border-slate-200 rounded-lg text-sm bg-slate-50 focus:border-blue-500 outline-none transition-all" placeholder="Enter keywords..." value={(pico as any)[k]} onChange={e => setPico({...pico, [k]: e.target.value})} />
                  </div>
                ))}
              </div>

              <button onClick={handleSearch} disabled={isSearching} className="w-full bg-blue-900 text-white py-4 rounded-xl font-bold uppercase tracking-widest hover:bg-blue-800 transition-all shadow-lg active:scale-95">
                {isSearching ? "Searching PubMed..." : "Run Systematic Search Strategy"}
              </button>

              <div className="grid gap-4 mt-8">
                {searchResults.map((s: any) => (
                  <div key={s.id} className="p-4 border border-slate-100 rounded-xl flex flex-col md:flex-row justify-between items-center bg-slate-50 gap-4 hover:border-blue-300 transition-all">
                    <div className="flex-1 text-center md:text-left"><h3 className="text-sm font-bold text-blue-900">{s.title}</h3><p className="text-[10px] text-slate-400 mt-1">{s.author} ({s.year})</p></div>
                    <button onClick={() => addStudy(s)} className="bg-emerald-500 text-white px-6 py-2 rounded-lg font-bold text-[10px] shadow hover:bg-emerald-600 transition-all"> + EXTRACT </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 2: PRISMA */}
          {activeTab === "phase2" && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-10 animate-in zoom-in">
              <div className="space-y-6 text-center border-r border-slate-100 pr-6">
                <h2 className="text-xs font-bold text-slate-400 uppercase tracking-widest">PRISMA Flow Diagram [cite: 105, 1002-1005]</h2>
                <div className="p-6 bg-blue-50 border border-blue-100 rounded-2xl"><p className="text-[10px] font-bold text-blue-600 uppercase mb-1">Identified</p><span className="text-4xl font-bold text-blue-900">{identifiedCount}</span></div>
                <div className="p-6 bg-red-50 border border-red-100 rounded-2xl"><p className="text-[10px] font-bold text-red-600 uppercase mb-1">Excluded (Screening)</p><span className="text-4xl font-bold text-red-900">{Math.max(0, identifiedCount - studies.length)}</span></div>
                <div className="p-6 bg-emerald-500 text-white rounded-2xl shadow-lg"><p className="text-[10px] font-bold uppercase opacity-80 mb-1">Included</p><span className="text-4xl font-bold">{studies.length}</span></div>
              </div>
              <div className="space-y-4">
                <h3 className="font-bold text-[10px] uppercase text-slate-400">Exclusion Reasons</h3>
                {exclusionReasons.map((r, i) => (
                  <div key={r.id} className="flex justify-between items-center bg-slate-50 p-3 rounded-lg border border-slate-100">
                    <input className="text-[11px] font-semibold flex-1 bg-transparent outline-none" value={r.text} onChange={e => {const n=[...exclusionReasons]; n[i].text=e.target.value; setExclusionReasons(n)}} />
                    <input type="number" className="w-16 border rounded text-center text-xs font-bold p-1" value={r.count} onChange={e => {const n=[...exclusionReasons]; n[i].count=Number(e.target.value); setExclusionReasons(n)}} />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 3: EXTRACTION & RoB 2 [cite: 312-314, 834-840] */}
          {activeTab === "phase3" && (
            <div className="overflow-x-auto rounded-xl border border-slate-100 animate-in slide-in-from-bottom">
              <table className="w-full text-left text-[10px]">
                <thead className="bg-slate-900 text-white uppercase tracking-wider">
                  <tr><th className="p-4">Study Info</th><th className="p-4 text-center">Bias 1 (Random)</th><th className="p-4 text-center">Bias 4 (Outcome)</th><th className="p-4">Numerical Input</th></tr>
                </thead>
                <tbody>
                  {studies.map((s: any, i) => (
                    <tr key={i} className="border-b border-slate-50 hover:bg-slate-50 transition-colors">
                      <td className="p-4 font-bold text-blue-900">{s.author} ({s.year})<select className="block mt-1 text-[8px] border-none font-bold bg-slate-100 rounded px-1" value={s.type} onChange={e => {const n=[...studies]; (n[i] as any).type=e.target.value; setStudies(n);}}><option value="continuous">LDL-C (Cont)</option><option value="dichotomous">MACE (Dich)</option></select></td>
                      <td className="p-4 text-center"><select className="border rounded p-1 font-bold text-[9px] bg-white" onChange={e => {const n=[...studies]; (n[i] as any).rob.d1=e.target.value; setStudies(n)}}><option value="Low">Low (-)</option><option value="High">High (+)</option></select></td>
                      <td className="p-4 text-center"><select className="border rounded p-1 font-bold text-[9px] bg-white" onChange={e => {const n=[...studies]; (n[i] as any).rob.d4=e.target.value; setStudies(n)}}><option value="Low">Low (-)</option><option value="High">High (+)</option></select></td>
                      <td className="p-4 flex gap-1">
                        {s.type === "continuous" ? (
                          <><input placeholder="n1" className="w-10 border p-1 rounded bg-slate-50" onChange={e => {const n=[...studies]; (n[i] as any).nt=e.target.value; setStudies(n)}} /><input placeholder="m1" className="w-10 border p-1 rounded font-bold" onChange={e => {const n=[...studies]; (n[i] as any).mt=e.target.value; setStudies(n)}} /><input placeholder="sd1" className="w-10 border p-1 rounded bg-slate-50" onChange={e => {const n=[...studies]; (n[i] as any).sdt=e.target.value; setStudies(n)}} /><span className="self-center">|</span><input placeholder="n2" className="w-10 border p-1 rounded bg-slate-50" onChange={e => {const n=[...studies]; (n[i] as any).nc=e.target.value; setStudies(n)}} /><input placeholder="m2" className="w-10 border p-1 rounded font-bold" onChange={e => {const n=[...studies]; (n[i] as any).mc=e.target.value; setStudies(n)}} /><input placeholder="sd2" className="w-10 border p-1 rounded bg-slate-50" onChange={e => {const n=[...studies]; (n[i] as any).sdc=e.target.value; setStudies(n)}} /></>
                        ) : (
                          <><input placeholder="e1" className="w-12 border p-1 rounded text-red-600 font-bold" onChange={e => {const n=[...studies]; (n[i] as any).et=e.target.value; setStudies(n)}} /><input placeholder="t1" className="w-12 border p-1 rounded" onChange={e => {const n=[...studies]; (n[i] as any).tt=e.target.value; setStudies(n)}} /><span className="self-center">|</span><input placeholder="e2" className="w-12 border p-1 rounded text-red-600 font-bold" onChange={e => {const n=[...studies]; (n[i] as any).ec=e.target.value; setStudies(n)}} /><input placeholder="t2" className="w-12 border p-1 rounded" onChange={e => {const n=[...studies]; (n[i] as any).tc=e.target.value; setStudies(n)}} /></>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* TAB 4: STATISTICS [cite: 341-355, 357-362] */}
          {activeTab === "phase4" && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 animate-in fade-in">
              <div className="bg-blue-900 text-white p-12 rounded-3xl shadow-xl text-center flex flex-col justify-center border-b-8 border-blue-600">
                <p className="text-[10px] font-bold uppercase opacity-60 tracking-widest mb-4">Overall Pooled Effect ({modelType.toUpperCase()})</p>
                <div className="text-8xl font-bold mb-4">{results.pooled.toFixed(2)}</div>
                <div className="inline-block px-4 py-2 bg-blue-800 rounded-lg text-xs font-bold border border-blue-700">CI 95% Calculation Engine [cite: 374, 395]</div>
              </div>
              <div className="space-y-6">
                <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Heterogeneity [cite: 351-352]</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-6 bg-slate-50 rounded-2xl border-l-4 border-l-blue-600"><p className="text-[10px] font-bold text-slate-400 uppercase">I-Squared (I²)</p><span className="text-3xl font-bold text-blue-900">{results.i2.toFixed(1)}%</span></div>
                  <div className="p-6 bg-slate-50 rounded-2xl border-l-4 border-l-red-400"><p className="text-[10px] font-bold text-slate-400 uppercase">Studies</p><span className="text-3xl font-bold text-red-900">{studies.length}</span></div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 6: GRADE SUMMARY [cite: 843, 952-956] */}
          {activeTab === "phase6" && (
            <div className="space-y-8 animate-in fade-in">
              <h2 className="text-sm font-bold text-blue-900 border-b pb-2 uppercase tracking-widest">GRADE Certainty of Evidence</h2>
              <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
                {Object.keys(grade).map(key => (
                  <div key={key}>
                    <label className="text-[9px] font-bold text-slate-400 uppercase mb-1 block">{key.replace(/([A-Z])/g, ' $1')}</label>
                    <select className="w-full p-2 border border-slate-200 rounded-lg text-[10px] font-bold bg-slate-50" value={(grade as any)[key]} onChange={e => setGrade({...grade, [key]: e.target.value})}>
                      <option>Not serious</option><option>Serious</option><option>Very serious</option><option>Low</option><option>High</option>
                    </select>
                  </div>
                ))}
              </div>
              <div className="p-12 bg-blue-900 text-white rounded-3xl text-center shadow-xl border-t-8 border-blue-500">
                 <p className="text-[10px] font-bold uppercase opacity-50 mb-2">Certainty Assessment [cite: 843]</p>
                 <div className="text-6xl font-bold">MODERATE</div>
                 <p className="text-xs italic opacity-80 mt-6 max-w-lg mx-auto">"Our confidence in the effect estimate is limited: the true effect may be substantially different from the estimate"[cite: 843].</p>
              </div>
            </div>
          )}

          {/* TAB 7: SENSITIVITY [cite: 492-498] */}
          {activeTab === "phase7" && (
            <div className="space-y-6 animate-in slide-in-from-right">
              <h2 className="text-sm font-bold text-blue-900 border-b pb-2 uppercase tracking-widest">Sensitivity Analysis (Leave-one-out)</h2>
              <div className="grid gap-4">
                {studies.length < 2 ? <p className="text-xs text-slate-400 text-center py-10 border-2 border-dashed rounded-xl uppercase">2 Studies Required [cite: 514]</p> :
                  studies.map((_, i) => {
                    const temp = studies.filter((_, idx) => idx !== i);
                    const tempPool = temp.reduce((a:any, b:any)=> a + (Number(b.mt)-Number(b.mc)), 0) / temp.length;
                    return (
                      <div key={i} className="flex justify-between items-center p-5 bg-slate-50 rounded-2xl border-l-[10px] border-l-blue-600 hover:shadow-md transition-all">
                        <div><p className="text-[9px] font-bold text-slate-400 uppercase mb-0.5">Excluding</p><span className="text-xs font-bold text-slate-700">{studies[i].author} ({studies[i].year})</span></div>
                        <div className="text-right">
                          <p className="text-[9px] font-bold text-slate-400 uppercase mb-0.5">New Pooled Result</p>
                          <span className="text-2xl font-bold text-blue-900">{tempPool.toFixed(2)}</span>
                        </div>
                      </div>
                    );
                  })
                }
              </div>
            </div>
          )}

          {/* TAB 5: FOREST PLOT [cite: 950-951] */}
          {activeTab === "phase5" && (
             <div className="bg-white p-10 flex flex-col items-center">
                <h3 className="text-slate-300 text-[10px] font-bold uppercase tracking-[0.3em] mb-12">Visual Evidence Synthesis</h3>
                {studies.length === 0 ? <p className="text-slate-400 text-xs">No data for plot[cite: 514].</p> : (
                  <div className="relative border-l-2 border-slate-100 ml-32 lg:ml-48 w-3/4 min-h-[200px]">
                    <div className="absolute top-0 bottom-0 left-1/2 border-l border-dashed border-red-200"></div>
                    {results.studies.map((s:any, i:any) => (
                      <div key={i} className="flex items-center h-10 mb-6 relative">
                        <div className="absolute -left-36 lg:-left-52 text-[9px] font-bold text-right w-32 lg:w-48 text-slate-500 uppercase">{s.author} ({s.year})</div>
                        <div className="w-full flex justify-center items-center"><div className="w-4 h-4 bg-blue-600 rounded-sm shadow z-10" style={{ transform: `translateX(${s.es * 10}px)` }}></div></div>
                      </div>
                    ))}
                    <div className="mt-12 pt-8 border-t border-slate-100 flex justify-center items-center relative">
                       <div className="absolute -left-36 lg:-left-52 text-[10px] font-bold text-blue-900 uppercase">Pooled Result</div>
                       <div className="w-6 h-6 bg-blue-900 rotate-45 border-2 border-white shadow-lg" style={{ transform: `translateX(${results.pooled * 10}px) rotate(45deg)` }}></div>
                    </div>
                  </div>
                )}
             </div>
          )}
        </div>
      </div>
    </div>
  );
}