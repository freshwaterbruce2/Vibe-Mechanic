import { useState } from 'react';
import { Vehicle } from '../App';
import { 
  AlertTriangle, 
  Wrench, 
  Search, 
  Sparkles, 
  PlayCircle, 
  Activity, 
  Printer, 
  ShoppingCart, 
  ExternalLink, 
  Save, 
  Check, 
  HelpCircle,
  AlertOctagon,
  Gauge,
  Info
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { motion, AnimatePresence } from 'framer-motion';
import { saveHistory } from '../lib/history';

interface Obd2LookupProps {
  vehicle: Vehicle;
}

interface Obd2Result {
  Code: string;
  Definition: string;
  Severity: 'Low' | 'Moderate' | 'Severe' | 'Critical';
  Explanation: string;
  CommonSymptoms: string[];
  PossibleCauses: string[];
  RecommendedFixes: string[];
  EstimatedRepairCost: string;
  PartsSearchUrl: string;
  RetailerOptions?: {
    Retailer: string;
    Url: string;
    EstimatedPrice: string;
  }[];
  youtubeSearchQueries: string[];
}

const COMMON_CODES = [
  { code: 'P0171', desc: 'System Too Lean (Bank 1)' },
  { code: 'P0300', desc: 'Random Cylinder Misfire' },
  { code: 'P0420', desc: 'Catalyst Efficiency Below Limit' },
  { code: 'P0455', desc: 'EVAP System Large Leak' },
  { code: 'P0128', desc: 'Coolant Temp Below Thermostat' },
  { code: 'P0340', desc: 'Camshaft Position Sensor Circuit' }
];

export default function Obd2Lookup({ vehicle }: Obd2LookupProps) {
  const [codeQuery, setCodeQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<Obd2Result | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSaved, setIsSaved] = useState(false);
  const [showLocator, setShowLocator] = useState(false);

  const handleSearch = async (codeStr: string) => {
    const codeToSearch = codeStr.trim();
    if (!codeToSearch) return;

    setIsLoading(true);
    setError(null);
    setIsSaved(false);

    try {
      const response = await fetch('/api/obd2', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          code: codeToSearch,
          year: vehicle.year,
          make: vehicle.make,
          model: vehicle.model,
          engine: vehicle.engine,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to retrieve OBD-II diagnostics. Please check internet connection.');
      }

      const data = await response.json();
      // Normalize youtubeSearchQueries for robustness
      const rawQueries = data.youtubeSearchQueries || data.YoutubeSearchQueries || data.youtube_search_queries || data.youtubeSearch || data.youtube || [];
      data.youtubeSearchQueries = Array.isArray(rawQueries) ? rawQueries : [rawQueries].filter(Boolean);
      if (data.youtubeSearchQueries.length === 0) {
        data.youtubeSearchQueries = [`how to fix ${data.Code || codeToSearch} ${vehicle.year || ''} ${vehicle.make || ''} ${vehicle.model || ''}`.trim()];
      }
      setResult(data);
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'An unexpected error occurred parsing the code.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleSearch(codeQuery);
  };

  const handleSaveResult = () => {
    if (!result) return;
    const markdownResult = `
### **DTC Diagnostic Details**
**Code:** \`${result.Code}\`  
**Definition:** *${result.Definition}*  
**Severity Level:** **${result.Severity}**

---

#### 📋 Technical Explanation & Analysis
${result.Explanation}

---

#### ⚠️ Associated Symptoms
${result.CommonSymptoms?.map(s => `- ${s}`).join('\n') || '*No standard symptoms reported.*'}

---

#### 🛠️ Potential Root Causes
${result.PossibleCauses?.map(c => `- ${c}`).join('\n') || '*No default causes specified.*'}

---

#### ⚙️ Recommended Diagnostic & Repair Steps
${result.RecommendedFixes?.map((f, i) => `${i + 1}. ${f}`).join('\n') || '*No diagnostic steps recorded.*'}

---

#### 💵 Estimated Cost Breakdown
${result.EstimatedRepairCost || '*Information varies by repair shop.*'}
`;

    saveHistory({
      vehicle,
      type: 'obd2',
      query: `OBD-II Code: ${result.Code} - ${result.Definition}`,
      result: markdownResult,
      queries: result.youtubeSearchQueries || [],
    });
    setIsSaved(true);
  };

  const handlePrint = () => {
    window.print();
  };

  // Styles for severity levels
  const getSeverityBadge = (severity: string) => {
    switch (severity) {
      case 'Low':
        return {
          bg: 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400',
          label: 'Low Severity (Sensor Fault / Diagnostic Code)',
          desc: 'Safe to drive home or to a local repair garage. Clean or inspect connections.'
        };
      case 'Moderate':
        return {
          bg: 'bg-amber-500/10 border-amber-500/20 text-amber-400',
          label: 'Moderate Severity (Performance Issue)',
          desc: 'Vehicle runs but performance or fuel economy is affected. Address soon to prevent extra wear.'
        };
      case 'Severe':
        return {
          bg: 'bg-orange-500/10 border-orange-500/20 text-orange-400',
          label: 'Severe Severity (Engine Risk)',
          desc: 'Avoid long road trips. Component risk exists. Drive carefully directly to a local mechanic.'
        };
      case 'Critical':
        return {
          bg: 'bg-red-500/10 border-red-500/30 text-red-500 animate-pulse',
          label: 'CRITICAL WARNING (Catastrophic Failure Risk)',
          desc: 'STOP DRIVING immediately if engine is misfiring or flashing. Risk of catalytic melt or internal engine wreckage.'
        };
      default:
        return {
          bg: 'bg-blue-500/10 border-blue-500/20 text-blue-400',
          label: 'Moderate Severity',
          desc: 'Diagnose and repair as normal.'
        };
    }
  };

  const severityMeta = result ? getSeverityBadge(result.Severity) : null;

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      
      {/* Intro Dashboard Card with Mechanic Vibe */}
      <div className="bg-[#111622] p-6 rounded-2xl shadow-2xl border-2 border-[#1E293B] relative overflow-hidden">
        {/* Subtle decorative hazard background stripes or border details */}
        <div className="absolute top-0 left-0 w-2 h-full bg-amber-500" />
        
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-center gap-4 pl-2">
            <div className="bg-amber-500/15 p-3 rounded-xl text-amber-500 border border-amber-500/20">
              <Gauge className="w-8 h-8" />
            </div>
            <div>
              <h2 className="text-xl font-bold font-mono tracking-tight text-white uppercase flex items-center gap-2">
                OBD-II Code Diagnostician Key
              </h2>
              <p className="text-sm text-[#94A3B8]">
                Translate check engine codes and find custom parts, severity warnings, and easy walk-throughs.
              </p>
            </div>
          </div>
          <button
            onClick={() => setShowLocator(!showLocator)}
            className="flex items-center gap-1.5 bg-[#1E293B] hover:bg-[#334155] border border-[#475569] text-xs font-bold uppercase tracking-wider py-2 px-3 rounded-lg transition-colors text-white self-end md:self-auto"
          >
            <Info className="w-4 h-4 text-amber-500" /> OBD-II Port Locator
          </button>
        </div>

        {/* OBD-II Interactive Graphic and Locator guidelines */}
        <AnimatePresence>
          {showLocator && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mt-5 pt-5 border-t border-[#334155] overflow-hidden"
            >
              <div className="bg-[#0B0F19] p-4 rounded-xl border border-[#1E293B] grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h4 className="text-sm font-bold text-amber-500 uppercase font-mono tracking-wide mb-2 flex items-center gap-1.5">
                    Where is my OBD-II port?
                  </h4>
                  <p className="text-xs text-[#94A3B8] leading-relaxed">
                    By federal standard, the OBD-II 16-pin connector is universally located **within 3 feet of the driver steering column**, often tucked directly under the driver-side dashboard, above the gas pedal, or behind an ash-tray panel.
                  </p>
                  <ul className="mt-3 space-y-1.5 text-xs text-[#E2E8F0]">
                    <li className="flex items-center gap-2"><span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span> Look directly above the brake & clutch pedals.</li>
                    <li className="flex items-center gap-2"><span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span> Check under the dashboard trim panels.</li>
                    <li className="flex items-center gap-2"><span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span> Sometimes behind the center console drawer.</li>
                  </ul>
                </div>
                
                {/* Visual OBD-II connector diagram built with CSS/SVG style */}
                <div className="flex flex-col items-center justify-center p-3 bg-[#111622] rounded-xl border border-[#334155]/60 relative">
                  <span className="text-[10px] font-mono font-bold text-[#64748B] uppercase tracking-widest mb-2">Standard 16-Pin Connector Layout</span>
                  
                  {/* Trapezoid Port shape */}
                  <div className="w-44 h-16 bg-[#1A202C] border-2 border-[#475569] rounded-b-xl rounded-t-sm p-2 flex flex-col justify-between relative shadow-inner">
                    {/* Pins 1 to 8 */}
                    <div className="flex justify-between px-2">
                      {Array.from({ length: 8 }).map((_, i) => (
                        <div key={i} className="w-2.5 h-2.5 bg-[#0F1115] border border-amber-500/45 rounded-sm flex items-center justify-center text-[7px] font-mono text-amber-500 font-bold select-none cursor-help" title={`Pin ${i + 1}`}>
                          {i+1}
                        </div>
                      ))}
                    </div>
                    {/* Pins 9 to 16 */}
                    <div className="flex justify-between px-3">
                      {Array.from({ length: 8 }).map((_, i) => (
                        <div key={i + 8} className="w-2.5 h-2.5 bg-[#0F1115] border border-amber-500/45 rounded-sm flex items-center justify-center text-[7px] font-mono text-amber-500 font-bold select-none cursor-help" title={`Pin ${i + 9}`}>
                          {i+9}
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  <span className="text-[9px] font-mono text-amber-500/70 mt-2 text-center">Pin 4: Chassis Ground | Pin 16: Constant Battery 12V</span>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Main search form */}
      <div className="bg-[#151921] p-6 rounded-2xl shadow-xl border border-[#1E293B]">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-mono font-bold uppercase tracking-wider text-[#94A3B8] mb-1.5">
              Enter Diagnostic Trouble Code (DTC)
            </label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#64748B]">
                  <Search className="w-5 h-5 focus-within:text-amber-500" />
                </div>
                <input
                  type="text"
                  placeholder="e.g. P0171, P0300, C0045"
                  value={codeQuery}
                  onChange={(e) => setCodeQuery(e.target.value)}
                  className="w-full bg-[#1A202C] border-2 border-[#334155] focus:border-amber-500 rounded-xl py-3 pl-11 pr-4 text-white font-mono placeholder-[#64748B] text-lg uppercase outline-none transition-all"
                />
              </div>
              <button
                type="submit"
                disabled={isLoading || !codeQuery.trim()}
                className="bg-amber-500 hover:bg-amber-600 active:scale-95 text-black font-bold px-6 rounded-xl transition-all flex items-center gap-1.5 text-sm uppercase tracking-wider disabled:opacity-40"
              >
                {isLoading ? (
                  <>
                    <Wrench className="w-4 h-4 animate-spin" /> Analyzing...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" /> Diagnose
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Quick tags of standard codes */}
          <div>
            <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-[#64748B] block mb-2">Popular Codes:</span>
            <div className="flex flex-wrap gap-1.5">
              {COMMON_CODES.map((item) => (
                <button
                  key={item.code}
                  type="button"
                  onClick={() => {
                    setCodeQuery(item.code);
                    handleSearch(item.code);
                  }}
                  className="bg-[#1E293B] hover:bg-[#334155] text-xs py-1.5 px-3 rounded-lg border border-[#334155]/60 text-white font-mono hover:border-amber-500/50 transition-colors flex items-center gap-1"
                >
                  <span className="font-bold text-amber-500">{item.code}</span>
                  <span className="opacity-60 text-[10px] hidden sm:inline">| {item.desc}</span>
                </button>
              ))}
            </div>
          </div>
        </form>

        {error && (
          <div className="mt-4 p-4 bg-red-500/10 border border-red-500/20 text-red-400 rounded-xl text-xs flex gap-2">
            <AlertTriangle className="w-5 h-5 shrink-0" />
            <div>
              <p className="font-bold">Diagnostics Error</p>
              <p>{error}</p>
            </div>
          </div>
        )}
      </div>

      {/* Main diagnostic result dashboard */}
      <AnimatePresence mode="wait">
        {result && !error && (
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            className="space-y-6"
          >
            {/* Header Banner representing the diagnostic dashboard */}
            <div className="bg-[#151921] border border-[#1E293B] rounded-2xl overflow-hidden shadow-2xl">
              
              {/* Top Warning Strip */}
              {severityMeta && (
                <div className={`p-4 border-b border-[#334155]/40 flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${severityMeta.bg}`}>
                  <div className="flex items-center gap-3">
                    <AlertOctagon className="w-6 h-6 shrink-0" />
                    <div>
                      <h4 className="font-bold font-mono text-sm tracking-wide uppercase">{severityMeta.label}</h4>
                      <p className="text-xs opacity-90 mt-0.5">{severityMeta.desc}</p>
                    </div>
                  </div>
                  
                  {/* Action buttons on print / export */}
                  <div className="print:hidden flex items-center gap-2">
                    <button
                      onClick={handleSaveResult}
                      disabled={isSaved}
                      className={`flex items-center gap-1.5 text-xs font-bold uppercase py-1.5 px-3 rounded-lg transition-colors ${
                        isSaved ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-[#1E293B] hover:bg-[#334155] border border-[#475569] text-white'
                      }`}
                    >
                      {isSaved ? (
                        <>
                          <Check className="w-3.5 h-3.5" /> Saved to Logs
                        </>
                      ) : (
                        <>
                          <Save className="w-3.5 h-3.5" /> Save Log
                        </>
                      )}
                    </button>
                    <button
                      onClick={handlePrint}
                      className="bg-[#1E293B] hover:bg-[#334155] border border-[#475569] text-white text-xs font-bold uppercase py-1.5 px-3 rounded-lg transition-colors flex items-center gap-1.5"
                    >
                      <Printer className="w-3.5 h-3.5" /> Print
                    </button>
                  </div>
                </div>
              )}

              {/* Core Details (Code & Definition) */}
              <div className="p-6 border-b border-[#334155]/50 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-3">
                    <span className="bg-[#0B0F19] text-amber-500 font-mono text-3xl font-extrabold px-4 py-1.5 rounded-lg border border-[#334155] tracking-wide inline-block shadow-inner">
                      {result.Code}
                    </span>
                    <div>
                      <h3 className="text-xl font-bold text-white tracking-tight">{result.Definition}</h3>
                      {vehicle.year && (
                        <p className="text-xs text-[#94A3B8] mt-0.5 uppercase tracking-wider font-mono">
                          Specific vehicle profile: <span className="text-amber-500">{vehicle.year} {vehicle.make} {vehicle.model}</span>
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                <div className="bg-[#1A202C] px-5 py-3 rounded-xl border border-[#334155]/60 w-full md:w-auto">
                  <p className="text-[10px] font-mono text-[#94A3B8] uppercase font-bold tracking-wider">Estimated Cost Breakdown</p>
                  <p className="text-lg font-bold font-mono text-white mt-1">{result.EstimatedRepairCost || 'Varies'}</p>
                </div>
              </div>

              {/* Explanation (Markdown) */}
              <div className="p-6 prose prose-invert max-w-none text-[#E2E8F0] tracking-wide text-sm prose-p:leading-relaxed prose-headings:text-amber-500 prose-headings:font-mono prose-a:text-amber-400">
                <h4 className="text-amber-500 uppercase tracking-wide font-mono text-xs font-bold mb-3 flex items-center gap-1.5 border-b border-[#1E293B] pb-2">
                  <HelpCircle className="w-4 h-4" /> Technical Explanation & Analysis
                </h4>
                <div className="bg-[#0F1115] p-5 rounded-xl border border-[#1E293B] mb-6 shadow-inner italic-code">
                  <ReactMarkdown>{result.Explanation}</ReactMarkdown>
                </div>

                {/* Grid for Causes and Symptoms */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
                  
                  {/* Common Symptoms */}
                  <div className="bg-[#111622] p-5 rounded-xl border border-[#1E293B]">
                    <h5 className="text-sm font-bold text-amber-500 hover:text-white transition-colors uppercase font-mono tracking-wide mb-3 flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-orange-500 animate-pulse inline-block" />
                      Associated Symptoms
                    </h5>
                    <ul className="space-y-2">
                      {result.CommonSymptoms?.map((symptom, sIdx) => (
                        <li key={sIdx} className="text-xs text-[#CBD5E1] flex items-start gap-2 leading-relaxed">
                          <span className="text-orange-500 font-bold shrink-0 mt-0.5">•</span>
                          {symptom}
                        </li>
                      ))}
                      {(!result.CommonSymptoms || result.CommonSymptoms.length === 0) && (
                        <li className="text-xs text-[#64748B] italic">No symptoms specified.</li>
                      )}
                    </ul>
                  </div>

                  {/* Possible Causes */}
                  <div className="bg-[#111622] p-5 rounded-xl border border-[#1E293B]">
                    <h5 className="text-sm font-bold text-amber-500 hover:text-white transition-colors uppercase font-mono tracking-wide mb-3 flex items-center gap-2">
                      <Wrench className="w-4 h-4 text-[#94A3B8]" />
                      Potential Root Causes
                    </h5>
                    <ul className="space-y-2">
                      {result.PossibleCauses?.map((cause, cIdx) => (
                        <li key={cIdx} className="text-xs text-[#CBD5E1] flex items-start gap-2 leading-relaxed">
                          <span className="text-[#94A3B8] font-bold shrink-0 mt-0.5">&gt;</span>
                          {cause}
                        </li>
                      ))}
                      {(!result.PossibleCauses || result.PossibleCauses.length === 0) && (
                        <li className="text-xs text-[#64748B] italic">No causes specified.</li>
                      )}
                    </ul>
                  </div>

                </div>

                {/* Practical fixes checklist */}
                <div className="mt-6 bg-[#0B0F19] p-5 rounded-xl border border-[#1E293B]">
                  <h4 className="text-sm font-bold text-amber-500 uppercase font-mono tracking-wide mb-4 flex items-center gap-2">
                    <Check className="w-4 h-4 text-emerald-500" />
                    Recommended Diagnostic & Repair Steps
                  </h4>
                  <div className="space-y-3">
                    {result.RecommendedFixes?.map((fix, fIdx) => (
                      <div key={fIdx} className="bg-[#1A202C] p-3 rounded-lg border border-[#334155]/60 text-xs flex items-start gap-3 text-[#E2E8F0]">
                        <span className="bg-[#0F1115] text-amber-500 font-mono font-bold w-5 h-5 rounded flex items-center justify-center shrink-0 border border-[#334155] text-[10px]">
                          {fIdx + 1}
                        </span>
                        <p className="leading-relaxed">{fix}</p>
                      </div>
                    ))}
                    {(!result.RecommendedFixes || result.RecommendedFixes.length === 0) && (
                      <p className="text-xs text-[#64748B] italic">No detailed steps returned.</p>
                    )}
                  </div>
                </div>

                {/* Part Search/Retailer comparison */}
                {result.RetailerOptions && result.RetailerOptions.length > 0 && (
                  <div className="mt-6 bg-[#111622] p-5 rounded-xl border border-[#1E293B]">
                    <span className="text-xs font-mono font-bold uppercase tracking-wider text-amber-500 block mb-3 flex items-center gap-2">
                      <ShoppingCart className="w-4 h-4" /> Compare Replacement Parts
                    </span>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                      {result.RetailerOptions.map((retailer, idx) => (
                        <a
                          key={idx}
                          href={retailer.Url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="group bg-[#0B0F19] border border-[#334155] hover:border-amber-500 p-3 rounded-lg flex flex-col justify-between transition-all"
                        >
                          <div>
                            <span className="text-[10px] font-mono text-[#94A3B8] uppercase font-bold tracking-widest block">{retailer.Retailer}</span>
                            <span className="text-white text-base font-semibold block mt-1">{retailer.EstimatedPrice}</span>
                          </div>
                          <span className="text-[10px] text-amber-500 font-mono uppercase mt-2 group-hover:text-white transition-colors flex items-center justify-between">
                            Shop Deals <ExternalLink className="w-3 h-3 ml-1" />
                          </span>
                        </a>
                      ))}
                    </div>
                  </div>
                )}

                {/* YouTube Walkthrough search suggestions */}
                {result.youtubeSearchQueries && result.youtubeSearchQueries.length > 0 && (
                  <div className="mt-6 border-t border-[#1E293B] pt-5">
                    <p className="text-xs font-mono font-bold text-[#94A3B8] uppercase tracking-wide mb-3 flex items-center gap-1.5">
                      <PlayCircle className="w-4 h-4 text-red-500" /> YouTube Repair Walkthroughs
                    </p>
                    <div className="space-y-2">
                      {result.youtubeSearchQueries.map((queryText, qIdx) => (
                        <a
                          key={qIdx}
                          href={`https://www.youtube.com/results?search_query=${encodeURIComponent(queryText)}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center justify-between bg-[#1A202C] hover:bg-[#1E293B] border border-[#334155] p-3.5 rounded-xl group transition-all"
                        >
                          <div className="flex items-center gap-3">
                            <div className="bg-red-500/10 p-2 rounded-lg text-red-500 border border-red-500/20 group-hover:scale-105 transition-transform">
                              <PlayCircle className="w-5 h-5" />
                            </div>
                            <div>
                              <p className="text-xs text-white font-bold tracking-wide italic">"{queryText}"</p>
                              <p className="text-[10px] text-[#64748B] mt-0.5">Search video guides on YouTube</p>
                            </div>
                          </div>
                          <ExternalLink className="w-4 h-4 text-[#64748B] group-hover:text-amber-500 transition-colors" />
                        </a>
                      ))}
                    </div>
                  </div>
                )}

              </div>

            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
