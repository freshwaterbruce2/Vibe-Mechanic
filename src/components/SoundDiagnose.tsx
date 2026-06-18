import { useState, useEffect } from 'react';
import { Vehicle } from '../App';
import { 
  Volume2, 
  Square, 
  Play, 
  HelpCircle, 
  CheckCircle, 
  AlertTriangle, 
  Wrench, 
  Clock, 
  Activity, 
  ShieldAlert, 
  ExternalLink,
  ChevronRight,
  RefreshCw,
  Search
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import ReactMarkdown from 'react-markdown';
import { playSoundSimulation, stopSoundSimulation, getActivePlayingType } from '../lib/audioSynth';

interface SoundDiagnoseProps {
  vehicle: Vehicle;
}

interface SoundItem {
  id: 'belt' | 'lifter' | 'rod' | 'exhaust';
  title: string;
  subtitle: string;
  description: string;
  troubleSigns: string[];
}

const CLASSIC_SOUNDS: SoundItem[] = [
  {
    id: 'belt',
    title: "High-Pitched Squeal",
    subtitle: "Dry Accessory Belt Friction",
    description: "A piercing high-pitched squealing or chirping noise coming from the front accessories area, usually fluctuating with RPM and colder mornings.",
    troubleSigns: ["Loose automatic tensioner spring", "Worn EPDM serpentine belt ribs", "Seized idle pulley bearing"]
  },
  {
    id: 'lifter',
    title: "Metallic Rhythmic Tick",
    subtitle: "Hydraulic Valve Lifter Tapping",
    description: "A rapid, rhythmic 'tick-tick-tick-tick' sound from the upper cylinder head area. Tapping speed matches half of engine RPM exactly.",
    troubleSigns: ["Collapsed lifter oil plunger", "Low engine oil pressure level", "Sludge clogging lifter oil feed ports"]
  },
  {
    id: 'rod',
    title: "Heavy Rhythmic Knock",
    subtitle: "Crankshaft Connecting Rod Knock",
    description: "A deep, hollow, drumming metallic hammer-like double thud. Changes directly under acceleration load and is extremely critical.",
    troubleSigns: ["Spun connecting rod journal bearing", "Oil starvation cylinder wear", "Excessive clearances between parts"]
  },
  {
    id: 'exhaust',
    title: "Metallic Buzz & Rattle",
    subtitle: "Exhaust Heat Shield Vibration",
    description: "A harsh, chaotic buzzing or tinny scraping shake, most noticeable when the vehicle passes specific RPM nodes or under load.",
    troubleSigns: ["Corroded catalytic converter shields", "Broken structural rubber exhaust hanger", "Split baffle chamber inside muffler"]
  }
];

interface SoundDiagnosisResult {
  LikelyIssue: string;
  AcousticReasoning: string;
  Severity: 'Low' | 'Moderate' | 'High' | 'Critical' | string;
  DiyTest: string;
  RequiredTools: string[];
  SafetyWarnings: string[];
  EstimatedTime: string;
  EstimatedCost: { Parts: string; Labor: string; Total: string };
  StepByStepGuide: string[];
  youtubeSearchQueries: string[];
}

export default function SoundDiagnose({ vehicle }: SoundDiagnoseProps) {
  const [playingId, setPlayingId] = useState<'belt' | 'lifter' | 'rod' | 'exhaust' | null>(null);
  const [typedContext, setTypedContext] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<SoundDiagnosisResult | null>(null);
  const [errorCode, setErrorCode] = useState<string | null>(null);

  // Clean up sounds when component unmounts
  useEffect(() => {
    return () => {
      stopSoundSimulation();
    };
  }, []);

  const handleTogglePlay = (id: 'belt' | 'lifter' | 'rod' | 'exhaust') => {
    if (playingId === id) {
      stopSoundSimulation();
      setPlayingId(null);
    } else {
      const started = playSoundSimulation(id);
      if (started) {
        setPlayingId(id);
      }
    }
  };

  const handleDiagnoseSound = async (selectedId: string | null) => {
    setLoading(true);
    setResult(null);
    setErrorCode(null);

    const soundLabel = selectedId 
      ? CLASSIC_SOUNDS.find(s => s.id === selectedId)?.title || selectedId
      : "Vague custom acoustic vibration";

    try {
      const response = await fetch('/api/diagnose-sound', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          year: vehicle.year,
          make: vehicle.make,
          model: vehicle.model,
          engine: vehicle.engine,
          soundType: soundLabel,
          context: typedContext || "The driver is checking this abnormal vehicle sound directly to identify failure components."
        })
      });

      if (!response.ok) {
        throw new Error("Diagnosis service offline");
      }

      const data = await response.json();
      setResult(data);
    } catch (err: any) {
      setErrorCode(err.message || "Failed to query Gemini model");
    } finally {
      setLoading(false);
    }
  };

  const getSeverityColor = (sev: string) => {
    const s = (sev || '').toLowerCase();
    if (s.includes('critical')) return 'text-red-500 border-red-500/30 bg-red-500/10';
    if (s.includes('high')) return 'text-orange-500 border-orange-500/30 bg-orange-500/10';
    if (s.includes('moderate')) return 'text-amber-500 border-amber-500/30 bg-amber-500/10';
    return 'text-green-500 border-green-500/30 bg-green-500/10';
  };

  return (
    <div className="space-y-8">
      
      {/* Intro block */}
      <div className="bg-[#151921] p-6 rounded-2xl border border-[#1E293B]">
        <div className="flex items-center gap-3 mb-3 border-b border-[#334155] pb-4">
          <div className="bg-[#1E293B] p-2.5 rounded-full text-amber-500">
            <Volume2 className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-[#F59E0B] flex items-center gap-2">
              The Ear of a Master Mechanic
            </h2>
            <p className="text-sm text-[#94A3B8]">Match your vehicle's engine noises to high-fidelity audio baselines for precise troubleshooting.</p>
          </div>
        </div>

        {/* Dynamic Warning for running vehicle selection */}
        {!(vehicle.make && vehicle.model) && (
          <div className="p-3.5 bg-[#1E293B] border-l-4 border-amber-500 text-amber-400 text-xs rounded-r-xl flex items-center gap-2 mb-4 font-semibold uppercase tracking-wider">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            Tip: Active vehicle is empty. Select a car in 'My Vehicle' for hyper-specific diagnostics.
          </div>
        )}

        <p className="text-xs text-zinc-400 mb-6 font-mono">
          Click PLAY to synthesize specific mechanical failure acoustic models. These models use real-time Web Audio frequency generators matching bearing rotation slips, lifter intervals, and shield rattles.
        </p>

        {/* Sounds grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {CLASSIC_SOUNDS.map((sound) => {
            const isPlaying = playingId === sound.id;
            return (
              <div 
                key={sound.id} 
                className={`relative flex flex-col justify-between p-5 rounded-xl border transition-all duration-300 ${
                  isPlaying 
                    ? 'bg-[#1E2430] border-amber-500/50 shadow-md shadow-amber-500/5' 
                    : 'bg-[#0F1219] border-[#1E293B] hover:border-[#334155]'
                }`}
              >
                <div>
                  <div className="flex items-start justify-between gap-4 mb-2">
                    <div>
                      <h3 className="text-sm font-bold text-[#E2E8F0] tracking-tight">{sound.title}</h3>
                      <span className="text-[10px] font-mono text-[#94A3B8] uppercase block mt-0.5">{sound.subtitle}</span>
                    </div>

                    <button
                      onClick={() => handleTogglePlay(sound.id)}
                      className={`p-2.5 rounded-full transition-all shrink-0 flex items-center justify-center ${
                        isPlaying 
                          ? 'bg-amber-500 text-black hover:bg-amber-400 pulse-glow' 
                          : 'bg-[#1A202C] text-[#94A3B8] hover:text-white hover:bg-[#2D3748]'
                      }`}
                      title={isPlaying ? "Stop Loop" : "Play Baseline"}
                    >
                      {isPlaying ? <Square className="w-4 h-4 fill-black" /> : <Play className="w-4 h-4 fill-[#94A3B8]" />}
                    </button>
                  </div>

                  <p className="text-xs text-[#94A3B8] leading-relaxed mb-4">{sound.description}</p>
                </div>

                {/* Trouble triggers */}
                <div className="pt-3 border-t border-[#1E293B] space-y-1.5">
                  <span className="text-[9px] uppercase tracking-wider font-bold text-zinc-500 block">Likely Causes:</span>
                  <div className="flex flex-wrap gap-1.5">
                    {sound.troubleSigns.map((sign, idx) => (
                      <span key={idx} className="bg-[#1A202C] text-zinc-300 text-[10px] px-2 py-0.5 rounded font-medium border border-zinc-700/50">
                        {sign}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Animated Equalizer Wave when playing */}
                {isPlaying && (
                  <div className="absolute right-16 top-6 flex items-end gap-0.5 h-6">
                    <span className="w-0.75 bg-amber-500 rounded-sm animate-[equalizer_0.6s_ease-in-out_infinite_alternate]" style={{ animationDelay: '0.1s' }} />
                    <span className="w-0.75 bg-amber-500 rounded-sm h-4 animate-[equalizer_0.7s_ease-in-out_infinite_alternate]" style={{ animationDelay: '0.3s' }} />
                    <span className="w-0.75 bg-amber-500 rounded-sm h-5 animate-[equalizer_0.5s_ease-in-out_infinite_alternate]" style={{ animationDelay: '0.2s' }} />
                    <span className="w-0.75 bg-amber-500 rounded-sm h-3 animate-[equalizer_0.8s_ease-in-out_infinite_alternate]" style={{ animationDelay: '0.4s' }} />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Advanced Custom Sound Input form below catalog */}
      <div className="bg-[#151921] p-6 rounded-2xl border border-[#1E293B] space-y-4">
        <h3 className="text-sm font-bold text-[#E2E8F0] uppercase tracking-wider text-[10px] flex items-center gap-2">
          <Activity className="w-4 h-4 text-amber-500" /> Diagnose Selected or Custom Noise Signature
        </h3>

        <div>
          <label htmlFor="soundContext" className="block text-xs font-bold text-[#94A3B8] mb-1.5 uppercase">When does it generate the sound?</label>
          <p className="text-[11px] text-[#64748B] mb-2">Provide any additional symptoms, the RPM range, the engine temperatur (cold start vs warm idle) or location details.</p>
          <textarea
            id="soundContext"
            placeholder="e.g., The squeal triggers only for the first 3 minutes of cold start in damp weather. It quietens down after idling..."
            value={typedContext}
            onChange={(e) => setTypedContext(e.target.value)}
            className="w-full bg-[#1A202C] border border-[#334155] text-white text-sm rounded-xl focus:ring-amber-500 focus:border-amber-500 p-4 min-h-[90px] outline-none resize-y"
          />
        </div>

        {/* Fast Action Buttons */}
        <div className="flex flex-wrap gap-2.5 pt-2">
          {playingId ? (
            <button
              onClick={() => handleDiagnoseSound(playingId)}
              disabled={loading}
              className="flex-1 flex items-center justify-center gap-2 bg-amber-500 hover:bg-amber-600 disabled:opacity-50 text-black font-bold uppercase tracking-widest text-xs py-3 rounded-xl transition-all shadow-lg shadow-amber-500/10"
            >
              {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
              Diagnose "{CLASSIC_SOUNDS.find(s => s.id === playingId)?.title}"
            </button>
          ) : (
            <button
              onClick={() => handleDiagnoseSound(null)}
              disabled={loading || !typedContext.trim()}
              className="flex-1 flex items-center justify-center gap-2 bg-amber-500/20 text-amber-400 hover:bg-amber-500 hover:text-black disabled:opacity-50 font-bold uppercase tracking-widest text-xs py-3 rounded-xl transition-all border border-amber-500/30"
            >
              {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
              Submit Custom Symptom Description
            </button>
          )}
        </div>
      </div>

      {/* AI NVH Model Assessment Results */}
      {loading && (
        <div className="bg-[#1A202C] border border-[#334155] rounded-2xl p-12 flex flex-col items-center justify-center space-y-4">
          <RefreshCw className="w-8 h-8 text-amber-500 animate-spin" />
          <div className="text-center">
            <span className="text-sm font-semibold text-white block">Analyzing Acoustic Signature Patterns...</span>
            <span className="text-xs text-[#94A3B8]">Requesting diagnosis from Gemini specialist block...</span>
          </div>
        </div>
      )}

      {result && (
        <motion.div 
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-[#151921] border border-[#334155] p-6 rounded-2xl shadow-xl space-y-6"
        >
          {/* Diagnostic Header */}
          <div className="border-b border-[#334155] pb-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
            <div>
              <span className="text-[9px] uppercase tracking-wider font-bold text-amber-500 block mb-1">Acoustic NVH Classification Profile</span>
              <h3 className="text-lg font-bold text-white">{result.LikelyIssue}</h3>
            </div>
            
            <div className={`px-3 py-1.5 rounded-full border text-xs font-bold uppercase tracking-wider ${getSeverityColor(result.Severity)}`}>
              {result.Severity} Severity
            </div>
          </div>

          {/* Reasoning */}
          <div className="prose prose-invert prose-sm max-w-none text-zinc-300">
            <h4 className="text-xs font-bold uppercase tracking-wider text-amber-400 mb-2">Mechanical Signature Reasoning</h4>
            <ReactMarkdown>{result.AcousticReasoning}</ReactMarkdown>
          </div>

          {/* DIY Test */}
          {result.DiyTest && (
            <div className="bg-amber-500/5 border border-amber-500/10 p-4 rounded-xl">
              <h4 className="text-xs font-bold uppercase tracking-wider text-amber-400 mb-1 flex items-center gap-2">
                <HelpCircle className="w-4 h-4" /> Physical Verification Test
              </h4>
              <p className="text-xs text-zinc-300 leading-relaxed">{result.DiyTest}</p>
            </div>
          )}

          {/* Quick Estimates */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {result.EstimatedTime && (
              <div className="bg-[#0F1219] p-4 rounded-xl border border-[#1E293B]">
                <p className="text-[10px] text-[#94A3B8] uppercase tracking-wider font-bold mb-1 flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5 text-zinc-400" /> Estimated Labor Duration
                </p>
                <p className="text-[#E2E8F0] text-sm font-semibold">{result.EstimatedTime}</p>
              </div>
            )}
            {result.EstimatedCost && (
              <div className="bg-[#0F1219] p-4 rounded-xl border border-[#1E293B]">
                <p className="text-[10px] text-[#94A3B8] uppercase tracking-wider font-bold mb-1 flex items-center gap-1">
                  <Wrench className="w-3.5 h-3.5 text-zinc-400" /> Cost Estimates (DIY vs Garage)
                </p>
                <p className="text-white text-sm font-semibold">{result.EstimatedCost.Total || 'Varies'}</p>
                <p className="text-[10px] text-[#64748B] mt-0.5">
                  Parts: {result.EstimatedCost.Parts || 'Unknown'} | Shop Labor: {result.EstimatedCost.Labor || 'Unknown'}
                </p>
              </div>
            )}
          </div>

          {/* Required Tools */}
          {result.RequiredTools && result.RequiredTools.length > 0 && (
            <div className="bg-[#0F1219] p-4 rounded-xl border border-[#1E293B]">
              <p className="text-xs text-[#94A3B8] uppercase tracking-wider font-bold mb-2.5">Recommended Diagnostics Tools</p>
              <div className="flex flex-wrap gap-1.5">
                {result.RequiredTools.map((t, idx) => (
                  <span key={idx} className="bg-[#1A202C] border border-[#334155] text-zinc-300 text-xs px-2.5 py-1 rounded">
                    {t}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Alerts */}
          {result.SafetyWarnings && result.SafetyWarnings.length > 0 && (
            <div className="bg-red-500/10 p-4 rounded-xl border border-red-500/20">
              <p className="text-xs text-red-400 uppercase tracking-wider font-bold mb-2 flex items-center gap-1.5">
                <ShieldAlert className="w-4 h-4" /> Safety Instructions
              </p>
              <ul className="list-disc pl-5 text-xs text-red-200/90 space-y-1">
                {result.SafetyWarnings.map((w, idx) => (
                  <li key={idx}>{w}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Steps */}
          {result.StepByStepGuide && result.StepByStepGuide.length > 0 && (
            <div className="space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-amber-400">Step-by-Step Resolution Guide</h4>
              <div className="space-y-3">
                {result.StepByStepGuide.map((step, idx) => (
                  <div key={idx} className="flex gap-3 bg-[#0F1219] border border-[#1E293B] p-3 rounded-lg">
                    <span className="w-5 h-5 bg-[#1E293B] rounded-full text-amber-500 font-mono text-xs flex items-center justify-center shrink-0">
                      {idx + 1}
                    </span>
                    <p className="text-xs text-[#E2E8F0] pt-0.5 leading-relaxed">{step}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* YouTube Guides */}
          {result.youtubeSearchQueries && result.youtubeSearchQueries.length > 0 && (
            <div className="pt-4 border-t border-[#334155] space-y-3">
              <p className="text-xs font-bold text-amber-400 uppercase tracking-wider">Acoustic Training Video Resources</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {result.youtubeSearchQueries.map((query, idx) => (
                  <a
                    key={idx}
                    href={`https://www.youtube.com/results?search_query=${encodeURIComponent(query)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-between p-3 bg-[#0F1219] hover:bg-[#1E2430] border border-[#1E293B] hover:border-[#334155] rounded-xl transition-all group"
                  >
                    <div className="flex items-center gap-2">
                      <Volume2 className="w-4 h-4 text-red-500 shrink-0" />
                      <span className="text-xs text-[#94A3B8] group-hover:text-white transition-colors truncate max-w-[200px]">{query}</span>
                    </div>
                    <ExternalLink className="w-3.5 h-3.5 text-zinc-500 group-hover:text-amber-500 transition-colors shrink-0" />
                  </a>
                ))}
              </div>
            </div>
          )}

        </motion.div>
      )}

    </div>
  );
}
