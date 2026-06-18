import { useState, useRef } from 'react';
import { Vehicle } from '../App';
import { Wrench, Loader2, PlayCircle, AlertTriangle, ExternalLink, Save, Check, Printer, Mic, Square, ShoppingCart, Volume2 } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { motion } from 'framer-motion';
import { saveHistory } from '../lib/history';
import SoundDiagnose from './SoundDiagnose';

export default function Troubleshoot({ vehicle }: { vehicle: Vehicle }) {
  const [symptoms, setSymptoms] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any | null>(null);
  const [queries, setQueries] = useState<string[]>([]);
  const [saved, setSaved] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const recognitionRef = useRef<any>(null);

  const toggleRecording = () => {
    if (isRecording) {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      setIsRecording(false);
      return;
    }
    
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert("Your browser does not support Speech Recognition.");
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = 'en-US';

    recognition.onstart = () => {
      setIsRecording(true);
    };

    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      setSymptoms((prev) => (prev ? `${prev} ${transcript}` : transcript));
    };

    recognition.onerror = (event: any) => {
      console.error("Speech recognition error", event.error);
      setIsRecording(false);
    };

    recognition.onend = () => {
      setIsRecording(false);
    };

    recognitionRef.current = recognition;
    recognition.start();
  };

  const handleDiagnose = async () => {
    if (!symptoms.trim()) return;
    
    setLoading(true);
    setResult(null);
    setQueries([]);
    setSaved(false);

    try {
      const response = await fetch('/api/diagnose', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          year: vehicle.year,
          make: vehicle.make,
          model: vehicle.model,
          engine: vehicle.engine,
          symptoms
        }),
      });

      const data = await response.json();
      if (data.error) throw new Error(data.error);

      setResult(data);
      const rawQueries = data.youtubeSearchQueries || data.YoutubeSearchQueries || data.youtube_search_queries || data.youtubeSearch || data.youtube || [];
      const ytQueries = Array.isArray(rawQueries) ? rawQueries : [rawQueries].filter(Boolean);
      setQueries(ytQueries.length > 0 ? ytQueries : [`${vehicle.year || ''} ${vehicle.make || ''} ${vehicle.model || ''} ${symptoms || 'diagnose'}`.trim()]);
    } catch (err: any) {
      setResult({ DiagnosisInfo: `**Error:** ${err.message || 'Something went wrong.'}` });
    } finally {
      setLoading(false);
    }
  };

  const handleSave = () => {
    if (result) {
      const markdownResult = `
### Diagnostic Report
${result.DiagnosisInfo || 'N/A'}

${result.EstimatedTime ? `**Estimated Time:** ${result.EstimatedTime}` : ''}

${result.EstimatedCostBreakdown && typeof result.EstimatedCostBreakdown === 'object' ? `**Estimated Cost:** ${result.EstimatedCostBreakdown.Total || 'Unknown'}
- Parts: ${result.EstimatedCostBreakdown.Parts || 'Unknown'}
- Labor: ${result.EstimatedCostBreakdown.Labor || 'Unknown'}\n` : ''}
${Array.isArray(result.RequiredTools) && result.RequiredTools.length > 0 ? `**Required Tools:**\n${result.RequiredTools.map((t: string) => `- ${t}`).join('\n')}` : ''}

${Array.isArray(result.SafetyWarnings) && result.SafetyWarnings.length > 0 ? `**Safety Warnings:**\n${result.SafetyWarnings.map((w: string) => `- ${w}`).join('\n')}` : ''}

${Array.isArray(result.StepByStepGuide) && result.StepByStepGuide.length > 0 ? `**Repair Procedure:**\n${result.StepByStepGuide.map((s: string, i: number) => `${i + 1}. ${typeof s === 'string' ? s : JSON.stringify(s)}`).join('\n')}` : ''}
      `.trim();

      saveHistory({
        vehicle,
        type: 'diagnostic',
        query: symptoms,
        result: markdownResult,
        queries,
      });
      setSaved(true);
    }
  };

  const [activeMode, setActiveMode] = useState<'guided' | 'sound'>('guided');

  return (
    <div className="space-y-6">
      {/* Switcher Tab bar */}
      <div className="flex border-b border-[#1E293B] pb-2 gap-4">
        <button
          onClick={() => setActiveMode('guided')}
          className={`pb-2.5 px-1 text-xs sm:text-sm font-bold uppercase tracking-wider transition-all border-b-2 ${
            activeMode === 'guided' 
              ? 'text-[#F59E0B] border-[#F59E0B]' 
              : 'text-[#94A3B8] border-transparent hover:text-white'
          }`}
        >
          💬 Guided Symptoms
        </button>
        <button
          onClick={() => setActiveMode('sound')}
          className={`pb-2.5 px-1 text-xs sm:text-sm font-bold uppercase tracking-wider transition-all border-b-2 ${
            activeMode === 'sound' 
              ? 'text-[#F59E0B] border-[#F59E0B]' 
              : 'text-[#94A3B8] border-transparent hover:text-white'
          }`}
        >
          🔊 Listen & Diagnose
        </button>
      </div>

      {activeMode === 'sound' ? (
        <SoundDiagnose vehicle={vehicle} />
      ) : (
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-2xl mx-auto space-y-6"
        >
          <div className="print:hidden bg-[#151921] p-6 rounded-2xl shadow-xl border border-[#1E293B]">
        <div className="flex items-center gap-3 mb-6 border-b border-[#334155] pb-4">
          <div className="bg-[#1E293B] p-2.5 rounded-full text-[#94A3B8]">
            <Wrench className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-[#F59E0B]">Guided Diagnostics</h2>
            <p className="text-sm text-[#94A3B8]">Describe the issue and get step-by-step troubleshooting.</p>
          </div>
        </div>

        <div className="space-y-6">
          <div>
            <label htmlFor="symptoms" className="block text-sm font-bold text-[#E2E8F0] mb-1.5 uppercase tracking-wider text-[10px]">What seems to be the problem?</label>
            <p className="text-xs text-[#64748B] mb-3">Be as specific as possible. Include sounds, smells, when it happens, and dashboard warning lights.</p>
            <div className="relative">
              <textarea
                id="symptoms"
                placeholder="e.g., The engine makes a clicking sound when I try to start it, and the lights are dim..."
                value={symptoms}
                onChange={(e) => setSymptoms(e.target.value)}
                className="w-full bg-[#1A202C] border border-[#334155] text-white text-sm rounded-xl focus:ring-[#F59E0B] focus:border-[#F59E0B] p-4 pr-12 outline-none transition-colors min-h-[120px] resize-y"
              />
              <button
                onClick={toggleRecording}
                type="button"
                className={`absolute bottom-3 right-3 p-2 rounded-full transition-colors ${
                  isRecording 
                    ? 'bg-red-500/20 text-red-500 hover:bg-red-500/30 animate-pulse' 
                    : 'bg-[#334155] text-[#94A3B8] hover:bg-[#475569] hover:text-white'
                }`}
                title={isRecording ? "Recording... Click to stop" : "Use Microphone"}
              >
                {isRecording ? <Square className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <button
            onClick={handleDiagnose}
            disabled={!symptoms.trim() || loading}
            className="w-full flex items-center justify-center gap-2 bg-[#F59E0B] hover:bg-[#D97706] disabled:opacity-50 disabled:hover:bg-[#F59E0B] text-black font-bold uppercase tracking-widest text-xs py-3.5 px-6 rounded-xl transition-all shadow-lg shadow-[#F59E0B]/20"
          >
            {loading ? <><Loader2 className="w-5 h-5 animate-spin" /> Analyzing Symptoms...</> : <><AlertTriangle className="w-5 h-5" /> Diagnose Issue</>}
          </button>
        </div>
      </div>

      {result && (
        <motion.div 
          initial={{ opacity: 0, height: 0 }} 
          animate={{ opacity: 1, height: 'auto' }} 
          className="bg-[#1E293B] border border-[#334155] p-6 rounded-2xl overflow-hidden shadow-xl print:shadow-none print:border-none print:bg-transparent print:p-0"
        >
          <div className="prose prose-invert prose-sm max-w-none prose-p:leading-relaxed prose-li:my-1 prose-headings:text-[#FCD34D] text-[#E2E8F0] print:prose-p:text-black print:prose-li:text-black print:prose-headings:text-black">
            <ReactMarkdown>{result.DiagnosisInfo || result.diagnosisInfo || result.markdown || result.diagnosis || result.error || (typeof result === 'string' ? result : (result.text || JSON.stringify(result, null, 2)))}</ReactMarkdown>
          </div>
          
          {(Array.isArray(result.RequiredTools || result.requiredTools) && (result.RequiredTools || result.requiredTools).length > 0 || result.EstimatedTime || result.estimatedTime || ((result.EstimatedCostBreakdown || result.estimatedCostBreakdown) && typeof (result.EstimatedCostBreakdown || result.estimatedCostBreakdown) === 'object') || Array.isArray(result.SafetyWarnings || result.safetyWarnings) && (result.SafetyWarnings || result.safetyWarnings).length > 0 || Array.isArray(result.StepByStepGuide || result.stepByStepGuide) && (result.StepByStepGuide || result.stepByStepGuide).length > 0) && (
            <div className="mt-8 space-y-6">
              <div className="flex flex-col sm:flex-row gap-4">
                {(result.EstimatedTime || result.estimatedTime) && (
                  <div className="flex-1 bg-[#1A202C] p-4 rounded-xl border border-[#334155] print:border-gray-300 print:bg-white">
                    <p className="text-xs text-[#94A3B8] print:text-gray-500 uppercase tracking-wider font-bold mb-1">Estimated Time</p>
                    <p className="text-[#E2E8F0] print:text-black font-semibold">{result.EstimatedTime || result.estimatedTime}</p>
                  </div>
                )}
                {(result.EstimatedCostBreakdown || result.estimatedCostBreakdown) && typeof (result.EstimatedCostBreakdown || result.estimatedCostBreakdown) === 'object' && (
                  <div className="flex-1 bg-[#1A202C] p-4 rounded-xl border border-[#334155] print:border-gray-300 print:bg-white flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
                    <div>
                      <p className="text-xs text-[#94A3B8] print:text-gray-500 uppercase tracking-wider font-bold mb-1">Estimated Cost</p>
                      <p className="text-[#E2E8F0] print:text-black font-semibold">{(result.EstimatedCostBreakdown || result.estimatedCostBreakdown).Total || 'N/A'}</p>
                      <p className="text-xs text-[#64748B] print:text-gray-600 mt-1">
                        Parts: {(result.EstimatedCostBreakdown || result.estimatedCostBreakdown).Parts || 'N/A'} | Labor: {(result.EstimatedCostBreakdown || result.estimatedCostBreakdown).Labor || 'N/A'}
                      </p>
                    </div>
                    {((result.PartsSearchUrl || result.partsSearchUrl) || ((result.EstimatedCostBreakdown || result.estimatedCostBreakdown).PartsSearchUrl)) && (
                      <a 
                        href={(result.PartsSearchUrl || result.partsSearchUrl) || ((result.EstimatedCostBreakdown || result.estimatedCostBreakdown).PartsSearchUrl)} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="print:hidden flex items-center justify-center gap-1.5 bg-[#475569] hover:bg-[#64748B] text-white px-3 py-2 rounded-lg text-xs font-bold transition-colors w-full sm:w-auto mt-2 sm:mt-0"
                      >
                        <ShoppingCart className="w-3.5 h-3.5" /> Find Parts Online
                      </a>
                    )}
                  </div>
                )}
              </div>
              
              {Array.isArray(result.RequiredTools || result.requiredTools) && (result.RequiredTools || result.requiredTools).length > 0 && (
                <div className="bg-[#1A202C] p-4 rounded-xl border border-[#334155] print:border-gray-300 print:bg-white">
                  <p className="text-xs text-[#94A3B8] print:text-gray-500 uppercase tracking-wider font-bold mb-3">Required Tools</p>
                  <div className="flex flex-wrap gap-2">
                    {(result.RequiredTools || result.requiredTools).map((tool: string, index: number) => (
                      <span key={index} className="bg-[#0F1115] border border-[#334155] print:border-gray-300 print:bg-gray-100 print:text-black text-[#E2E8F0] text-xs px-3 py-1.5 rounded-md">
                        {tool}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {Array.isArray(result.SafetyWarnings || result.safetyWarnings) && (result.SafetyWarnings || result.safetyWarnings).length > 0 && (
                <div className="bg-red-500/10 p-4 rounded-xl border border-red-500/20 print:border-red-300 print:bg-red-50">
                  <p className="text-xs text-red-400 print:text-red-700 uppercase tracking-wider font-bold mb-3 flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4" /> Safety Warnings
                  </p>
                  <ul className="list-disc pl-5 space-y-1 text-red-200 print:text-red-900 text-sm">
                    {(result.SafetyWarnings || result.safetyWarnings).map((warning: string, index: number) => (
                      <li key={index}>{warning}</li>
                    ))}
                  </ul>
                </div>
              )}

              {Array.isArray(result.StepByStepGuide || result.stepByStepGuide) && (result.StepByStepGuide || result.stepByStepGuide).length > 0 && (
                <div className="bg-[#1A202C] p-5 rounded-xl border border-[#334155] print:border-none print:shadow-none print:bg-white print:p-0">
                  <p className="text-xs text-[#FCD34D] print:text-black uppercase tracking-wider font-bold mb-4 print:mb-2">Step-by-Step Repair Guide</p>
                  <div className="space-y-4">
                    {(result.StepByStepGuide || result.stepByStepGuide).map((step: string, index: number) => (
                      <div key={index} className="flex gap-4">
                        <div className="flex-shrink-0 w-8 h-8 bg-[#1E293B] border border-[#334155] print:bg-gray-200 print:border-gray-300 print:text-black rounded-full flex items-center justify-center text-[#FCD34D] font-bold text-sm">
                          {index + 1}
                        </div>
                        <div className="flex-1 pt-1 prose prose-invert prose-sm max-w-none prose-p:leading-relaxed text-[#E2E8F0] print:text-black print:prose-p:text-black">
                          <ReactMarkdown>{typeof step === 'string' ? step : JSON.stringify(step)}</ReactMarkdown>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
          
          <div className="print:hidden mt-8 pt-6 border-t border-[#334155]">
            <h4 className="font-bold text-[#FCD34D] mb-3 flex items-center gap-2">
              <PlayCircle className="w-4 h-4" /> Recommended Tutorials
            </h4>
            {Array.isArray(queries) && queries.length > 0 ? (
              <div className="space-y-3">
                {queries.map((query, index) => (
                  <a
                    key={index}
                    href={`https://www.youtube.com/results?search_query=${encodeURIComponent(query)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-3 bg-[#1A202C] hover:bg-[#1E293B] border border-[#334155] p-3 rounded-lg transition-colors group"
                  >
                    <div className="w-10 h-10 bg-red-500/10 text-red-500 rounded flex items-center justify-center shrink-0">
                      <PlayCircle className="w-5 h-5" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-semibold text-[#E2E8F0] group-hover:text-white transition-colors">{query}</p>
                      <p className="text-xs text-[#64748B]">Search on YouTube</p>
                    </div>
                    <ExternalLink className="w-4 h-4 text-[#64748B] group-hover:text-white transition-colors" />
                  </a>
                ))}
              </div>
            ) : (
              <div className="bg-[#1A202C] rounded-xl p-4 border border-[#334155] text-sm italic text-[#94A3B8] text-center">
                Search queries for tutorials will appear here.
              </div>
            )}
            
            <div className="print:hidden mt-6 pt-6 border-t border-[#334155] flex flex-col sm:flex-row gap-3">
              <button
                onClick={handleSave}
                disabled={saved}
                className="flex-1 flex items-center justify-center gap-2 bg-[#1E293B] hover:bg-[#334155] disabled:opacity-50 disabled:hover:bg-[#1E293B] text-white font-bold tracking-widest text-sm py-3 px-6 rounded-xl transition-all border border-[#475569]"
              >
                {saved ? <><Check className="w-4 h-4 text-green-400" /> Saved to History</> : <><Save className="w-4 h-4" /> Save Diagnostic Session</>}
              </button>
              <button
                onClick={() => window.print()}
                className="flex items-center justify-center gap-2 bg-[#1E293B] hover:bg-[#334155] text-white font-bold tracking-widest text-sm py-3 px-6 rounded-xl transition-all border border-[#475569]"
              >
                <Printer className="w-4 h-4" /> Print / PDF
              </button>
            </div>
          </div>
        </motion.div>
      )}
        </motion.div>
      )}
    </div>
  );
}
