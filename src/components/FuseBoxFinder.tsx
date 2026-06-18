import { useState, useEffect } from 'react';
import { Vehicle } from '../App';
import { 
  Zap, 
  Search, 
  MapPin, 
  HelpCircle, 
  Info, 
  CheckCircle, 
  AlertTriangle, 
  RefreshCw,
  BookOpen,
  Maximize2
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface FuseBoxFinderProps {
  vehicle: Vehicle;
}

interface FuseInfo {
  id: string;
  name: string;
  amperage: string;
  row: number;
  col: number;
  description: string;
}

interface FuseBox {
  name: string;
  location: string;
  fuses: FuseInfo[];
}

interface SuggestionCandidate {
  boxName: string;
  fuseId: string;
  name: string;
  amperage: string;
  description: string;
  actionGuide: string;
}

interface FuseData {
  suggestedCandidate?: SuggestionCandidate;
  boxes: FuseBox[];
  replacementGuide: string[];
}

export default function FuseBoxFinder({ vehicle }: FuseBoxFinderProps) {
  const [systemSearch, setSystemSearch] = useState('');
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<FuseData | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [activeBoxIndex, setActiveBoxIndex] = useState(0);
  const [selectedFuse, setSelectedFuse] = useState<FuseInfo | null>(null);

  const fetchFuseBox = async (systemQuery: string = '') => {
    setLoading(true);
    setErrorMsg(null);
    setSelectedFuse(null);
    try {
      const response = await fetch('/api/fusebox', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          year: vehicle.year,
          make: vehicle.make,
          model: vehicle.model,
          engine: vehicle.engine,
          system: systemQuery
        })
      });

      if (!response.ok) {
        throw new Error("Unable to build electrical schema diagrams");
      }

      const resData = await response.json();
      setData(resData);
      
      // Auto-focus suggested fuse if returned
      if (resData.suggestedCandidate && resData.boxes?.length > 0) {
        const candidate = resData.suggestedCandidate;
        const boxIdx = resData.boxes.findIndex((b: FuseBox) => b.name === candidate.boxName);
        if (boxIdx !== -1) {
          setActiveBoxIndex(boxIdx);
          const foundFuse = resData.boxes[boxIdx].fuses.find((f: FuseInfo) => f.id === candidate.fuseId);
          if (foundFuse) {
            setSelectedFuse(foundFuse);
          }
        }
      }
    } catch (err: any) {
      setErrorMsg(err.message || "Communication failure");
    } finally {
      setLoading(false);
    }
  };

  // Run on mount to initialize some data
  useEffect(() => {
    fetchFuseBox();
  }, [vehicle.year, vehicle.make, vehicle.model]);

  const handleSearchKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      fetchFuseBox(systemSearch);
    }
  };

  const getAmperageColorClass = (amp: string) => {
    const numeric = parseInt(amp) || 10;
    if (numeric <= 7.5) return 'bg-[#78716C] text-white border-stone-850'; // Brown / Gray
    if (numeric === 10) return 'bg-[#DC2626] text-white border-red-800'; // Red
    if (numeric === 15) return 'bg-[#2563EB] text-white border-blue-800'; // Blue
    if (numeric === 20) return 'bg-[#D97706] text-black border-yellow-800'; // Yellow
    if (numeric === 25) return 'bg-[#E2E8F0] text-black border-zinc-400'; // Clear / White
    if (numeric >= 30) return 'bg-[#059669] text-white border-emerald-800'; // Green
    return 'bg-[#475569] text-white border-[#334155]';
  };

  return (
    <div className="space-y-6">
      
      {/* Search Layout block */}
      <div className="bg-[#151921] p-5 rounded-2xl border border-[#1E293B]">
        <div className="flex items-center gap-3 mb-4 border-b border-[#334155] pb-4">
          <div className="bg-[#1E293B] p-2.5 rounded-full text-amber-500">
            <Zap className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-[#F59E0B]">Interactive Fuse Box Finder</h2>
            <p className="text-sm text-[#94A3B8]">Locate and diagnose blown fuses for specific electrical subsystems on demand.</p>
          </div>
        </div>

        {/* Inputs */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <input
              type="text"
              placeholder="Search circuit (e.g. radio, horn, lighter, wiper, starter)..."
              value={systemSearch}
              onChange={(e) => setSystemSearch(e.target.value)}
              onKeyDown={handleSearchKeyPress}
              className="w-full bg-[#1A202C] border border-[#334155] text-white text-sm rounded-xl focus:ring-[#F59E0B] focus:border-[#F59E0B] py-3.5 pl-11 pr-4 outline-none font-mono"
            />
            <Search className="w-5 h-5 text-zinc-500 absolute left-4 top-1/2 -translate-y-1/2" />
          </div>

          <button
            onClick={() => fetchFuseBox(systemSearch)}
            disabled={loading}
            className="bg-[#F59E0B] hover:bg-[#D97706] text-black text-xs font-bold uppercase tracking-widest px-6 py-4 rounded-xl transition-all flex items-center justify-center gap-2"
          >
            {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
            Map Junctions
          </button>
        </div>
      </div>

      {loading && (
        <div className="bg-[#151921] border border-[#334155] rounded-2xl p-16 flex flex-col items-center justify-center space-y-4">
          <RefreshCw className="w-8 h-8 text-amber-500 animate-spin" />
          <div className="text-center font-mono">
            <p className="text-sm text-white">GENERATING VEHICLE JUNCTION BLOCKS...</p>
            <p className="text-xs text-[#94A3B8] mt-1">Prompting specialist electrical diagnostic map...</p>
          </div>
        </div>
      )}

      {errorMsg && (
        <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 text-xs font-semibold text-red-400">
          Error loading diagrams: {errorMsg}. Please try searching again.
        </div>
      )}

      {data && data.boxes && data.boxes.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* Fuse box selection and SVG display column */}
          <div className="lg:col-span-7 space-y-4">
            
            {/* Box Tabs */}
            <div className="flex gap-2">
              {data.boxes.map((box, idx) => (
                <button
                  key={idx}
                  onClick={() => {
                    setActiveBoxIndex(idx);
                    setSelectedFuse(null);
                  }}
                  className={`flex-1 text-center py-2.5 px-3 rounded-lg border text-xs font-bold uppercase tracking-wider transition-all duration-200 ${
                    activeBoxIndex === idx 
                      ? 'bg-amber-500 border-amber-500 text-black font-semibold' 
                      : 'bg-[#151921] border-[#1E293B] text-[#94A3B8] hover:text-white'
                  }`}
                >
                  {box.name.replace('Passenger', '').replace('Compartment', '').trim()}
                </button>
              ))}
            </div>

            {/* Junction block information */}
            <div className="bg-[#151921] p-4 rounded-xl border border-[#1E293B] space-y-2">
              <div className="flex items-start gap-1.5">
                <MapPin className="w-4 h-4 text-emerald-500 mt-0.5 shrink-0" />
                <div>
                  <span className="text-[10px] uppercase font-bold text-zinc-500 block">Junction Block Location:</span>
                  <span className="text-xs text-zinc-300 font-mono leading-relaxed">{data.boxes[activeBoxIndex].location}</span>
                </div>
              </div>
            </div>

            {/* HIGH-CONTRAST VECTOR SCHEMATIC REPRESENTATION */}
            <div className="bg-[#0b0e14] border border-[#1E293B] p-6 rounded-2xl flex flex-col items-center relative overflow-hidden">
              <div className="absolute top-2 left-2 uppercase tracking-wide font-bold font-mono text-[9px] text-[#475569]">
                Vector Layout Schematic
              </div>

              {/* Fuse Grid rendering in SVG/Grid format */}
              <div className="w-full max-w-md pt-4 pb-2">
                <div className="bg-[#151921] border-2 border-dashed border-[#1E293B] rounded-xl p-4 gap-4 grid grid-cols-3">
                  {/* Generate 4 rows x 3 columns items */}
                  {Array.from({ length: 4 }).map((_, rIdx) => {
                    const row = rIdx + 1;
                    return Array.from({ length: 3 }).map((_, cIdx) => {
                      const col = cIdx + 1;
                      const fuse = data.boxes[activeBoxIndex].fuses.find(f => f.row === row && f.col === col);
                      
                      const isSelected = selectedFuse && fuse && selectedFuse.id === fuse.id;
                      const isSuggested = data.suggestedCandidate && fuse && data.suggestedCandidate.fuseId === fuse.id && data.suggestedCandidate.boxName === data.boxes[activeBoxIndex].name;
                      
                      if (!fuse) {
                        return (
                          <div 
                            key={`${row}-${col}`} 
                            className="bg-[#0b0e14]/50 border border-zinc-900 rounded-lg h-20 flex items-center justify-center text-[10px] text-zinc-600 font-mono"
                          >
                            VACANT
                          </div>
                        );
                      }

                      return (
                        <button
                          key={fuse.id}
                          onClick={() => setSelectedFuse(fuse)}
                          className={`relative border-2 rounded-lg h-20 p-2 flex flex-col justify-between text-left transition-all duration-300 transform outline-none hover:scale-102 ${getAmperageColorClass(fuse.amperage)} ${
                            isSelected 
                              ? 'ring-4 ring-amber-500 scale-102 border-amber-500 font-semibold' 
                              : isSuggested
                              ? 'animate-pulse ring-2 ring-[#059669] border-[#059669]'
                              : 'hover:border-white'
                          }`}
                        >
                          <div className="flex justify-between items-start w-full font-bold font-mono text-[10px] leading-none">
                            <span>{fuse.id}</span>
                            <span>{fuse.amperage}</span>
                          </div>

                          <div className="text-[10px] font-bold tracking-tight uppercase leading-none truncate w-full pt-1">
                            {fuse.name}
                          </div>

                          <div className="text-[9px] text-zinc-400 font-mono self-end">
                            R{fuse.row} C{fuse.col}
                          </div>

                          {/* Suggested flag */}
                          {isSuggested && (
                            <div className="absolute -top-2.5 -right-1 bg-emerald-500 border border-black text-black px-1.5 py-0.5 rounded text-[8px] font-bold uppercase tracking-wider font-mono">
                              TARGET
                            </div>
                          )}
                        </button>
                      );
                    });
                  })}
                </div>
              </div>

              {/* Legend bar */}
              <div className="flex flex-wrap gap-3 justify-center mt-4 pt-4 border-t border-[#1E293B] w-full max-w-md font-mono text-[9px] uppercase tracking-wider text-zinc-500">
                <div className="flex items-center gap-1">
                  <span className="w-2.5 h-2.5 rounded bg-[#DC2626]" /> 10A (Red)
                </div>
                <div className="flex items-center gap-1">
                  <span className="w-2.5 h-2.5 rounded bg-[#2563EB]" /> 15A (Blue)
                </div>
                <div className="flex items-center gap-1">
                  <span className="w-2.5 h-2.5 rounded bg-[#D97706]" /> 20A (Yellow)
                </div>
                <div className="flex items-center gap-1">
                  <span className="w-2.5 h-2.5 rounded bg-[#059669]" /> 30A (Green)
                </div>
              </div>
            </div>

          </div>

          {/* Interactive details column */}
          <div className="lg:col-span-5 space-y-4">
            
            {/* Suggested Candidate highlight box */}
            {data.suggestedCandidate && (
              <div className="bg-emerald-950/20 border border-emerald-500/20 rounded-2xl p-4 space-y-3">
                <div className="flex items-center gap-2">
                  <Zap className="w-5 h-5 text-emerald-400 shrink-0" />
                  <span className="text-[10px] uppercase font-bold tracking-widest text-[#059669] font-mono">Primary Diagnostic Target</span>
                </div>
                
                <div>
                  <h4 className="text-white text-sm font-bold flex items-center gap-2 leading-tight">
                    {data.suggestedCandidate.boxName.replace('Compartment', '')} - {data.suggestedCandidate.fuseId} ({data.suggestedCandidate.name})
                  </h4>
                  <p className="text-xs text-zinc-300 leading-normal mt-1">{data.suggestedCandidate.description}</p>
                </div>

                <div className="p-3 bg-black/40 rounded-xl border border-emerald-500/10 text-xs">
                  <span className="font-bold text-emerald-400 uppercase font-mono tracking-wide block mb-1">Blown fuse verification:</span>
                  <p className="text-zinc-300 font-serif leading-relaxed italic">{data.suggestedCandidate.actionGuide}</p>
                </div>
              </div>
            )}

            {/* Selected Fuse view screen */}
            <div className="bg-[#151921] border border-[#1E293B] p-5 rounded-2xl space-y-4">
              <h3 className="text-xs font-bold uppercase tracking-wider text-amber-500 font-mono">Terminal Node Inspection</h3>
              
              {selectedFuse ? (
                <div className="space-y-4">
                  <div className="flex justify-between items-center border-b border-[#1E293B] pb-3">
                    <div>
                      <span className="text-xs font-mono text-[#94A3B8]">{selectedFuse.id}</span>
                      <h4 className="text-base font-bold text-white uppercase">{selectedFuse.name}</h4>
                    </div>
                    <div className={`px-3 py-1 rounded text-xs font-bold ${getAmperageColorClass(selectedFuse.amperage)}`}>
                      {selectedFuse.amperage}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <span className="text-[9px] uppercase font-bold tracking-wider text-zinc-500 block">Junction Block Grid Position:</span>
                    <p className="text-xs font-mono text-zinc-300 bg-[#0F1219] p-2 rounded">
                      Row {selectedFuse.row} | Column {selectedFuse.col}
                    </p>
                  </div>

                  <div className="space-y-2">
                    <span className="text-[9px] uppercase font-bold tracking-wider text-zinc-500 block">Protected Circuits & Description:</span>
                    <p className="text-xs text-zinc-300 leading-relaxed font-sans">{selectedFuse.description}</p>
                  </div>
                </div>
              ) : (
                <div className="p-6 text-center text-xs text-zinc-500 italic bg-[#0F1219]/30 rounded-xl border border-[#192130] font-sans">
                  Tap any single fuse in the vector layout grid to inspect protected circuits, wire loads, and details.
                </div>
              )}
            </div>

            {/* General replacement guide checklist */}
            {data.replacementGuide && data.replacementGuide.length > 0 && (
              <div className="bg-[#151921] border border-[#1E293B] p-5 rounded-2xl">
                <h3 className="text-xs font-bold uppercase tracking-wider text-amber-500 font-mono mb-3.5 flex items-center gap-1.5">
                  <BookOpen className="w-4 h-4" /> Roadside Repair Checklist
                </h3>
                <div className="space-y-3">
                  {data.replacementGuide.map((step, idx) => (
                    <div key={idx} className="flex gap-2.5 items-start">
                      <span className="w-5 h-5 bg-[#0b0e14] border border-[#1E293B] rounded-full text-[10px] text-zinc-400 font-mono font-bold flex items-center justify-center shrink-0">
                        {idx + 1}
                      </span>
                      <p className="text-xs text-zinc-300 leading-relaxed pt-0.5">{step}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

          </div>

        </div>
      )}

    </div>
  );
}
