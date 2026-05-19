import { useState } from 'react';
import { Vehicle } from '../App';
import { Camera, Image as ImageIcon, Loader2, UploadCloud, CheckCircle2, PlayCircle, ExternalLink, Save, Check, ShoppingCart } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { motion } from 'framer-motion';
import { saveHistory } from '../lib/history';

export default function PartScanner({ vehicle }: { vehicle: Vehicle }) {
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [userContext, setUserContext] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any | null>(null);
  const [queries, setQueries] = useState<string[]>([]);
  const [saved, setSaved] = useState(false);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      setImagePreview(reader.result as string);
      setResult(null); // Clear previous result
      setQueries([]);
      setSaved(false);
    };
    reader.readAsDataURL(file);
  };

  const handleScan = async () => {
    if (!imagePreview) return;
    
    setLoading(true);
    setResult(null);
    setQueries([]);
    setSaved(false);

    try {
      const response = await fetch('/api/vision', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageBase64: imagePreview,
          mimeType: imagePreview.substring(5, imagePreview.indexOf(';')),
          year: vehicle.year,
          make: vehicle.make,
          model: vehicle.model,
          engine: vehicle.engine,
          context: userContext
        }),
      });

      const data = await response.json();
      if (data.error) throw new Error(data.error);

      setResult(data);
      setQueries(data.youtubeSearchQueries || []);
    } catch (err: any) {
      setResult({ PartName: 'Error', PrimaryFunction: err.message || 'Something went wrong.', VisibleCondition: 'N/A', ReplacementDifficulty: 0, ImmediateNextSteps: 'Please try again.' });
    } finally {
      setLoading(false);
    }
  };

  const handleSave = () => {
    if (result) {
      const markdownResult = `
### Part Identification: ${result.PartName || 'Unknown'}
**Difficulty:** ${result.ReplacementDifficulty ? `${result.ReplacementDifficulty}/5` : 'N/A'}

**Primary Function:**
${result.PrimaryFunction || 'N/A'}

**Visible Condition:**
${result.VisibleCondition || 'N/A'}

**Immediate Next Steps:**
${result.ImmediateNextSteps || 'N/A'}
      `.trim();

      saveHistory({
        vehicle,
        type: 'vision',
        query: userContext || 'Visual scan without additional context',
        result: markdownResult,
        queries,
      });
      setSaved(true);
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-2xl mx-auto space-y-6"
    >
      <div className="bg-[#151921] p-6 rounded-2xl shadow-xl border border-[#1E293B]">
        <div className="flex items-center gap-3 mb-6 border-b border-[#334155] pb-4">
          <div className="bg-[#1E293B] p-2.5 rounded-full text-[#94A3B8]">
            <Camera className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-[#F59E0B]">AI Vision Scanner</h2>
            <p className="text-sm text-[#94A3B8]">Upload a photo to identify a part or assess visible damage.</p>
          </div>
        </div>

        <div className="space-y-6">
          {/* Image Upload Area */}
          <div>
            {!imagePreview ? (
              <label className="flex flex-col items-center justify-center w-full h-56 border-2 border-[#334155] border-dashed rounded-2xl cursor-pointer bg-[#1A202C] hover:bg-[#1E293B] transition-colors">
                <div className="flex flex-col items-center justify-center pt-5 pb-6">
                  <UploadCloud className="w-10 h-10 text-[#64748B] mb-3" />
                  <p className="mb-2 text-sm text-[#E2E8F0]"><span className="font-bold">Click to upload</span> or drag and drop</p>
                  <p className="text-xs text-[#64748B]">PNG, JPG or JPEG up to 10MB</p>
                </div>
                <input type="file" className="hidden" accept="image/*" onChange={handleImageChange} />
              </label>
            ) : (
              <div className="relative w-full rounded-2xl overflow-hidden border border-[#334155] bg-black flex items-center justify-center h-64">
                <img src={imagePreview} alt="Preview" className="max-h-full max-w-full object-contain" />
                <button 
                  onClick={() => setImagePreview(null)}
                  className="absolute top-3 right-3 bg-[#0A0B0E]/80 text-[#E2E8F0] text-xs px-3 py-1.5 rounded-full backdrop-blur-md hover:bg-black transition-colors font-bold border border-[#334155]"
                >
                  Change Image
                </button>
              </div>
            )}
          </div>

          {/* Additional Context */}
          <div>
            <label htmlFor="context" className="block text-sm font-bold text-[#E2E8F0] mb-1.5 uppercase tracking-wider text-[10px]">Where is this located or what is wrong? (Optional)</label>
            <textarea
              id="context"
              placeholder="e.g., Found leaking near the front passenger side tire..."
              value={userContext}
              onChange={(e) => setUserContext(e.target.value)}
              className="w-full bg-[#1A202C] border border-[#334155] text-white text-sm rounded-xl focus:ring-[#F59E0B] focus:border-[#F59E0B] p-3 outline-none transition-colors min-h-[80px]"
            />
          </div>

          <button
            onClick={handleScan}
            disabled={!imagePreview || loading}
            className="w-full flex items-center justify-center gap-2 bg-[#F59E0B] hover:bg-[#D97706] disabled:opacity-50 disabled:hover:bg-[#F59E0B] text-black font-bold uppercase tracking-widest text-xs py-3.5 px-6 rounded-xl transition-all shadow-lg shadow-[#F59E0B]/20"
          >
            {loading ? <><Loader2 className="w-5 h-5 animate-spin" /> Analyzing Image...</> : <><Camera className="w-5 h-5" /> Identify & Assess Part</>}
          </button>
        </div>
      </div>

      {result && (
        <motion.div 
          initial={{ opacity: 0, height: 0 }} 
          animate={{ opacity: 1, height: 'auto' }} 
          className="bg-[#1E293B] border border-[#334155] p-6 rounded-2xl overflow-hidden shadow-xl"
        >
          <div className="flex gap-2 items-center text-[#FCD34D] font-bold mb-4">
            <CheckCircle2 className="w-5 h-5" />
            <h3>Analysis Complete</h3>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div className="bg-[#1A202C] p-4 rounded-xl border border-[#334155] flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
              <div>
                <p className="text-xs text-[#94A3B8] uppercase tracking-wider font-bold mb-1">Part Name</p>
                <p className="text-[#E2E8F0] font-semibold text-lg">{result.PartName || 'Unknown'}</p>
              </div>
              {result.PartsSearchUrl && (
                <a 
                  href={result.PartsSearchUrl} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-1.5 bg-[#475569] hover:bg-[#64748B] text-white px-3 py-2 rounded-lg text-xs font-bold transition-colors w-full sm:w-auto mt-2 sm:mt-0 shadow-sm"
                >
                  <ShoppingCart className="w-3.5 h-3.5" /> Find Parts Online
                </a>
              )}
            </div>
            
            <div className="bg-[#1A202C] p-4 rounded-xl border border-[#334155]">
              <p className="text-xs text-[#94A3B8] uppercase tracking-wider font-bold mb-1">Replacement Difficulty</p>
              <div className="flex items-center gap-1 mt-1.5">
                {[1, 2, 3, 4, 5].map(num => (
                  <div key={num} className={`h-2.5 flex-1 rounded-sm ${num <= (result.ReplacementDifficulty || 0) ? (num > 3 ? 'bg-red-500' : num > 2 ? 'bg-yellow-500' : 'bg-green-500') : 'bg-[#334155]'}`} />
                ))}
              </div>
              <p className="text-xs text-[#64748B] mt-2 font-medium">{result.ReplacementDifficulty ? `${result.ReplacementDifficulty}/5 Difficulty` : 'N/A'}</p>
            </div>

            <div className="bg-[#1A202C] p-4 rounded-xl border border-[#334155] md:col-span-2">
              <p className="text-xs text-[#94A3B8] uppercase tracking-wider font-bold mb-1">Primary Function</p>
              <p className="text-[#E2E8F0] text-sm leading-relaxed">{result.PrimaryFunction || 'N/A'}</p>
            </div>
            
            <div className="bg-[#1A202C] p-4 rounded-xl border border-[#334155]">
              <p className="text-xs text-[#94A3B8] uppercase tracking-wider font-bold mb-1">Visible Condition</p>
              <p className="text-[#E2E8F0] text-sm leading-relaxed">{result.VisibleCondition || 'N/A'}</p>
            </div>
            
            <div className="bg-[#1A202C] p-4 rounded-xl border border-[#334155]">
              <p className="text-xs text-[#94A3B8] uppercase tracking-wider font-bold mb-1">Immediate Next Steps</p>
              <p className="text-[#E2E8F0] text-sm leading-relaxed">{result.ImmediateNextSteps || 'N/A'}</p>
            </div>
          </div>
          
          <div className="mt-8 pt-6 border-t border-[#334155]">
            <h4 className="font-bold text-[#FCD34D] mb-3 flex items-center gap-2">
              <PlayCircle className="w-4 h-4" /> Recommended Tutorials
            </h4>
            {queries.length > 0 ? (
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
            
            <div className="mt-6 pt-6 border-t border-[#334155]">
              <button
                onClick={handleSave}
                disabled={saved}
                className="w-full flex items-center justify-center gap-2 bg-[#1E293B] hover:bg-[#334155] disabled:opacity-50 disabled:hover:bg-[#1E293B] text-white font-bold tracking-widest text-sm py-3 px-6 rounded-xl transition-all border border-[#475569]"
              >
                {saved ? <><Check className="w-4 h-4 text-green-400" /> Saved to History</> : <><Save className="w-4 h-4" /> Save Diagnostic Session</>}
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </motion.div>
  );
}
