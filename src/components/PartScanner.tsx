import { useState, useRef, useEffect } from 'react';
import { Vehicle } from '../App';
import { Camera, Image as ImageIcon, Loader2, UploadCloud, CheckCircle2, PlayCircle, ExternalLink, Save, Check, ShoppingCart, Zap, ZapOff, X, Video } from 'lucide-react';
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

  // Live Camera & Flash States
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [flashMode, setFlashMode] = useState<'on' | 'off' | 'auto'>('off');
  const [hasTorch, setHasTorch] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);

  const startCamera = async () => {
    setIsCameraActive(true);
    setCameraError(null);
    setHasTorch(false);
    
    // Stop any existing streams first
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' }
      });
      streamRef.current = stream;
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      
      const track = stream.getVideoTracks()[0];
      if (track) {
        setTimeout(() => {
          try {
            const capabilities = track.getCapabilities() as any;
            if (capabilities && 'torch' in capabilities) {
              setHasTorch(true);
              applyFlashMode(track, flashMode);
            }
          } catch (e) {
            console.log("Torch check failed or unsupported in this device", e);
          }
        }, 300);
      }
    } catch (err: any) {
      console.error("Camera access failed:", err);
      setCameraError(err.message || "Failed to access default camera stream. Make sure camera block permissions are off.");
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setIsCameraActive(false);
  };

  const applyFlashMode = async (track: MediaStreamTrack, mode: 'on' | 'off' | 'auto') => {
    try {
      const capabilities = track.getCapabilities() as any;
      if (capabilities && 'torch' in capabilities) {
        if (mode === 'on') {
          await track.applyConstraints({
            advanced: [{ torch: true } as any]
          });
        } else if (mode === 'off') {
          await track.applyConstraints({
            advanced: [{ torch: false } as any]
          });
        } else {
          // 'auto' mode: keeps torch inactive initially till capture or default
          await track.applyConstraints({
            advanced: [{ torch: false } as any]
          });
        }
      }
    } catch (e) {
      console.error("Updating torch status failed", e);
    }
  };

  const handleFlashToggle = async (mode: 'on' | 'off' | 'auto') => {
    setFlashMode(mode);
    if (streamRef.current) {
      const track = streamRef.current.getVideoTracks()[0];
      if (track) {
        await applyFlashMode(track, mode);
      }
    }
  };

  const capturePhoto = () => {
    if (!videoRef.current) return;
    
    const canvas = document.createElement('canvas');
    const videoWidth = videoRef.current.videoWidth || 640;
    const videoHeight = videoRef.current.videoHeight || 480;
    canvas.width = videoWidth;
    canvas.height = videoHeight;
    
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
      const dataUrl = canvas.toDataURL('image/jpeg');
      setImagePreview(dataUrl);
      setResult(null);
      setQueries([]);
      setSaved(false);
      stopCamera();
    }
  };

  // Gracefully stop camera if component unmounts
  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

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
      const rawQueries = data.youtubeSearchQueries || data.YoutubeSearchQueries || data.youtube_search_queries || data.youtubeSearch || data.youtube || [];
      const ytQueries = Array.isArray(rawQueries) ? rawQueries : [rawQueries].filter(Boolean);
      setQueries(ytQueries.length > 0 ? ytQueries : [`${vehicle.year || ''} ${vehicle.make || ''} ${vehicle.model || ''} ${data.PartName || 'part'} replacement`.trim()]);
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
            {isCameraActive ? (
              <div className="relative w-full rounded-2xl overflow-hidden border-2 border-amber-500/40 bg-black flex flex-col items-center justify-between min-h-[350px] sm:min-h-[400px]">
                {/* HUD Top Bar */}
                <div className="absolute top-0 inset-x-0 bg-black/75 backdrop-blur-md z-10 px-4 py-3 border-b border-[#334155]/60 flex items-center justify-between">
                  <span className="text-xs font-mono font-bold text-amber-500 uppercase tracking-widest flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-ping inline-block" /> Live Scanner Viewport
                  </span>
                  
                  {/* Flash Controls */}
                  <div className="flex items-center gap-1 bg-[#0B0F19] border border-[#334155]/85 p-0.5 rounded-lg">
                    <button
                      type="button"
                      title="Flash Off"
                      onClick={() => handleFlashToggle('off')}
                      className={`p-1.5 rounded-md transition-all ${flashMode === 'off' ? 'bg-amber-500 text-black font-bold' : 'text-[#94A3B8] hover:text-white'}`}
                    >
                      <ZapOff className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      title="Flash On"
                      onClick={() => handleFlashToggle('on')}
                      className={`p-1.5 rounded-md transition-all ${flashMode === 'on' ? 'bg-amber-500 text-black font-bold' : 'text-[#94A3B8] hover:text-white'}`}
                    >
                      <Zap className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      title="Auto Flash Mode"
                      onClick={() => handleFlashToggle('auto')}
                      className={`py-0.5 px-2.5 rounded-md text-xs font-mono font-bold transition-all ${flashMode === 'auto' ? 'bg-amber-500 text-black' : 'text-[#94A3B8] hover:text-white'}`}
                    >
                      Auto
                    </button>
                  </div>
                </div>

                {/* Viewfinder Video Frame with Center Crosshair Grid */}
                <div className="relative flex-1 w-full bg-[#07090E] flex items-center justify-center overflow-hidden min-h-[250px] sm:min-h-[280px]">
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    muted
                    className="w-full h-full object-cover"
                  />
                  
                  {/* Viewfinder Target Crosshairs */}
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <div className="w-48 h-48 border border-dashed border-amber-500/20 rounded-2xl relative">
                      {/* Four Corner brackets */}
                      <span className="absolute top-0 left-0 w-4 h-4 border-t-2 border-l-2 border-amber-500" />
                      <span className="absolute top-0 right-0 w-4 h-4 border-t-2 border-r-2 border-amber-500" />
                      <span className="absolute bottom-0 left-0 w-4 h-4 border-b-2 border-l-2 border-amber-500" />
                      <span className="absolute bottom-0 right-0 w-4 h-4 border-b-2 border-r-2 border-amber-500" />
                    </div>
                  </div>

                  {cameraError && (
                    <div className="absolute inset-x-4 bottom-4 bg-red-900/95 text-red-200 p-3.5 rounded-xl text-xs font-mono border border-red-800/50 backdrop-blur-md">
                      <p className="font-bold uppercase tracking-wider mb-1">Camera Frame Failed</p>
                      <p>{cameraError}</p>
                    </div>
                  )}
                </div>

                {/* Bottom Capture / Controls Bar */}
                <div className="w-full bg-black/85 px-6 py-4 border-t border-[#334155]/70 flex items-center justify-between gap-4">
                  <button
                    type="button"
                    onClick={stopCamera}
                    className="bg-[#1A202C] hover:bg-[#2D3748] border border-[#475569] text-xs font-bold text-white uppercase tracking-wider px-4 py-2 rounded-lg transition-colors flex items-center gap-1.5"
                  >
                    <X className="w-4 h-4" /> Cancel
                  </button>

                  {/* Concentric Capture Button */}
                  <button
                    type="button"
                    onClick={capturePhoto}
                    disabled={!!cameraError}
                    className="w-14 h-14 bg-amber-500 hover:bg-amber-600 rounded-full border-4 border-white/60 hover:scale-105 active:scale-95 transition-all flex items-center justify-center shadow-lg hover:shadow-amber-500/25 disabled:opacity-30 disabled:pointer-events-none"
                    title="Capture Snap"
                  >
                    <div className="w-6 h-6 rounded-full bg-black/15 border border-black/20" />
                  </button>

                  <div className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#94A3B8]">
                    {hasTorch ? '⚡ Flash OK' : '⚡ No Torch'}
                  </div>
                </div>
              </div>
            ) : !imagePreview ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Option 1: Live Interactive Camera Scanner */}
                <button
                  type="button"
                  onClick={startCamera}
                  className="flex flex-col items-center justify-center p-6 bg-gradient-to-b from-[#1A202C] to-[#111520] hover:from-[#1E293B] hover:to-[#172033] border-2 border-dashed border-[#334155] hover:border-amber-500/70 rounded-2xl group transition-all duration-300 min-h-[190px] text-center cursor-pointer"
                >
                  <div className="w-12 h-12 bg-amber-500/10 group-hover:bg-amber-500/15 border border-amber-500/20 group-hover:border-amber-500/40 rounded-full flex items-center justify-center text-amber-500 mb-3 shadow-lg shadow-amber-500/5 group-hover:scale-110 transition-transform">
                    <Video className="w-6 h-6" />
                  </div>
                  <h4 className="text-[#E2E8F0] font-bold text-xs uppercase tracking-wider font-mono text-amber-500 group-hover:text-amber-400 transition-colors">Start Live Scanner</h4>
                  <p className="text-[11px] text-[#94A3B8] max-w-[200px] mt-1.5 leading-relaxed">
                    Capture directly from phone camera with flash mode control and level calibration.
                  </p>
                </button>

                {/* Option 2: Image File Upload Drop Zone */}
                <label className="flex flex-col items-center justify-center p-6 bg-gradient-to-b from-[#1A202C] to-[#111520] hover:from-[#1E293B] hover:to-[#172033] border-2 border-dashed border-[#334155] hover:border-amber-500/70 rounded-2xl group transition-all duration-300 min-h-[190px] text-center cursor-pointer">
                  <div className="w-12 h-12 bg-[#1E293B] group-hover:bg-[#2D3748] border border-[#334155] rounded-full flex items-center justify-center text-[#94A3B8] mb-3 group-hover:scale-110 transition-transform">
                    <UploadCloud className="w-6 h-6" />
                  </div>
                  <h4 className="text-[#E2E8F0] font-bold text-xs uppercase tracking-wider font-mono">Upload Image File</h4>
                  <p className="text-[11px] text-[#64748B] max-w-[200px] mt-1.5 leading-relaxed font-sans">
                    Choose a pre-existing vehicle part photo from memory or photo gallery.
                  </p>
                  <input type="file" className="hidden" accept="image/*" onChange={handleImageChange} />
                </label>
              </div>
            ) : (
              <div className="relative w-full rounded-2xl overflow-hidden border border-[#334155] bg-black flex items-center justify-center h-64">
                <img src={imagePreview} alt="Preview" className="max-h-full max-w-full object-contain" />
                <button 
                  type="button"
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
            <div className="bg-[#1A202C] p-4 rounded-xl border border-[#334155] flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between md:col-span-2">
              <div>
                <p className="text-xs text-[#94A3B8] uppercase tracking-wider font-bold mb-1">Part Name</p>
                <p className="text-[#E2E8F0] font-semibold text-lg">{result.PartName || 'Unknown'}</p>
              </div>
              {result.PartsSearchUrl && (!result.RetailerOptions || result.RetailerOptions.length === 0) && (
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

            {result.RetailerOptions && result.RetailerOptions.length > 0 && (
              <div className="bg-[#1A202C] p-4 rounded-xl border border-[#334155] md:col-span-2">
                <p className="text-xs text-[#94A3B8] uppercase tracking-wider font-bold mb-3 flex items-center gap-2">
                  <ShoppingCart className="w-4 h-4 inline-block" /> Compare Retailers
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {result.RetailerOptions.map((retailer: any, idx: number) => (
                    <a
                      key={idx}
                      href={retailer.Url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="group bg-[#0F1115] border border-[#334155] hover:border-[#F59E0B] p-3 rounded-lg flex flex-col transition-all text-left block"
                    >
                      <span className="text-[#94A3B8] text-xs font-bold uppercase tracking-wider mb-1">{retailer.Retailer}</span>
                      <span className="text-[#E2E8F0] text-lg font-semibold mb-2">{retailer.EstimatedPrice}</span>
                      <span className="text-[#64748B] text-xs flex items-center justify-between group-hover:text-white transition-colors">
                        View Deals <ExternalLink className="w-3.5 h-3.5" />
                      </span>
                    </a>
                  ))}
                </div>
              </div>
            )}
            
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
