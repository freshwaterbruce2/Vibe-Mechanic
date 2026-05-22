import React, { useState, useEffect } from 'react';
import { Shield, Smartphone, ToggleLeft, Check, Sparkles, Sliders, Palette, RefreshCw } from 'lucide-react';
import { motion } from 'framer-motion';

// Defined theme icons with actual inline SVGs so they can render directly in the preview, and we can export to browser head.
export interface IconOption {
  id: string;
  name: string;
  colorName: string;
  primaryColor: string;
  secondaryColor: string;
  themeClass: string;
  svgMarkup: React.ReactNode;
}

const ICON_OPTIONS: IconOption[] = [
  {
    id: 'obsidian_crest',
    name: 'Obsidian Stealth Crest',
    colorName: 'Luxury Gold & Shield',
    primaryColor: '#F59E0B',
    secondaryColor: '#0E1117',
    themeClass: 'from-amber-500 to-yellow-600',
    svgMarkup: (
      <svg viewBox="0 0 100 100" className="w-full h-full">
        <defs>
          <radialGradient id="goldGlow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#FEF08A" stopOpacity="0.15" />
            <stop offset="100%" stopColor="#F59E0B" stopOpacity="0" />
          </radialGradient>
          <linearGradient id="goldMetallic" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#FDE047" />
            <stop offset="50%" stopColor="#CA8A04" />
            <stop offset="100%" stopColor="#854D0E" />
          </linearGradient>
          <linearGradient id="charcoalMetal" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#1E293B" />
            <stop offset="100%" stopColor="#0F172A" />
          </linearGradient>
        </defs>
        {/* Stealth Luxury Background */}
        <rect width="100" height="100" rx="22" fill="#0C0E14" />
        <rect x="4" y="4" width="92" height="92" rx="18" fill="url(#charcoalMetal)" stroke="#1E293B" strokeWidth="1" />
        <circle cx="50" cy="50" r="40" fill="url(#goldGlow)" />
        
        {/* Tech Grid Overlays */}
        <circle cx="50" cy="50" r="32" fill="none" stroke="#CA8A04" strokeWidth="0.75" strokeDasharray="4 3" opacity="0.3" />
        <circle cx="50" cy="50" r="26" fill="none" stroke="#475569" strokeWidth="0.5" opacity="0.4" />
        
        {/* Interlocking Crest Guard */}
        <path d="M 50,22 L 72,32 L 72,56 C 72,70 50,78 50,78 C 50,78 28,70 28,56 L 28,32 Z" fill="#0F172A" stroke="url(#goldMetallic)" strokeWidth="3.5" strokeLinejoin="round" />
        
        {/* Detail Wrench & Spark inside the crest */}
        <g transform="translate(50, 48) scale(0.72) translate(-50, -50)">
          {/* Chrome Wrench */}
          <path d="M 50,25 L 50,75" stroke="url(#goldMetallic)" strokeWidth="8" strokeLinecap="round" />
          <circle cx="50" cy="28" r="14" fill="#0F172A" stroke="url(#goldMetallic)" strokeWidth="4.5" />
          <polygon points="41,18 59,18 54,34 46,34" fill="#0C0E14" />
          <circle cx="50" cy="74" r="8" fill="url(#goldMetallic)" />
          {/* Floating High Voltage Spark */}
          <path d="M 50,42 L 44,52 L 49,52 L 47,60 L 55,48 L 50,48 Z" fill="#FDE047" />
        </g>
      </svg>
    )
  },
  {
    id: 'cyber_cruiser',
    name: 'Retro Synthwave Grid',
    colorName: 'Cyber Teal & Magenta',
    primaryColor: '#EC4899',
    secondaryColor: '#03000A',
    themeClass: 'from-[#EC4899] to-[#06B6D4]',
    svgMarkup: (
      <svg viewBox="0 0 100 100" className="w-full h-full">
        <defs>
          <linearGradient id="neonPink" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#F43F5E" />
            <stop offset="100%" stopColor="#EC4899" />
          </linearGradient>
          <linearGradient id="neonCyan" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#06B6D4" />
            <stop offset="100%" stopColor="#3B82F6" />
          </linearGradient>
        </defs>
        {/* Dark Retro-wave space background */}
        <rect width="100" height="100" rx="22" fill="#03000A" />
        
        {/* Glowing Horizon sun with horizontal line cuts */}
        <circle cx="50" cy="46" r="28" fill="url(#neonPink)" opacity="0.85" />
        <g fill="#03000A">
          <rect x="10" y="32" width="80" height="2" />
          <rect x="10" y="38" width="80" height="2.5" />
          <rect x="10" y="44" width="80" height="3" />
          <rect x="10" y="50" width="80" height="4" />
          <rect x="10" y="56" width="80" height="5" />
        </g>

        {/* Cyber perspective wireframe grid lines */}
        <path d="M 12,90 L 88,90" stroke="url(#neonCyan)" strokeWidth="2.5" />
        <path d="M 20,90 L 32,58" stroke="url(#neonCyan)" strokeWidth="0.75" opacity="0.6" />
        <path d="M 38,90 L 44,58" stroke="url(#neonCyan)" strokeWidth="0.75" opacity="0.6" />
        <path d="M 62,90 L 56,58" stroke="url(#neonCyan)" strokeWidth="0.75" opacity="0.6" />
        <path d="M 80,90 L 68,58" stroke="url(#neonCyan)" strokeWidth="0.75" opacity="0.6" />
        <path d="M 12,90 L 88,90 M 15,82 L 85,82 M 20,74 L 80,74 M 25,66 L 75,66" stroke="url(#neonCyan)" strokeWidth="0.5" opacity="0.4" />

        {/* Futuristic Supercar silhouette vector */}
        <path d="M 22,76 L 24,71 L 32,69 L 40,60 L 62,60 L 72,69 L 77,71 L 79,76 Z" fill="#03000A" stroke="url(#neonCyan)" strokeWidth="3.5" strokeLinejoin="miter" />
        {/* Magenta taillight bar glow */}
        <path d="M 28,70 L 72,70" stroke="#F43F5E" strokeWidth="2" strokeLinecap="round" />
        <circle cx="34" cy="74" r="3" fill="#06B6D4" />
        <circle cx="66" cy="74" r="3" fill="#06B6D4" />
      </svg>
    )
  },
  {
    id: 'hotrod_vintage',
    name: 'Vintage Piston Power',
    colorName: 'Engine Ruby & Chrome',
    primaryColor: '#EF4444',
    secondaryColor: '#170505',
    themeClass: 'from-red-500 to-red-700',
    svgMarkup: (
      <svg viewBox="0 0 100 100" className="w-full h-full">
        <defs>
          <radialGradient id="rubyBowl" cx="50%" cy="40%" r="60%">
            <stop offset="0%" stopColor="#EF4444" />
            <stop offset="60%" stopColor="#991B1B" />
            <stop offset="100%" stopColor="#1A0505" />
          </radialGradient>
          <linearGradient id="chromeShine" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#FFFFFF" />
            <stop offset="30%" stopColor="#CBD5E1" />
            <stop offset="70%" stopColor="#475569" />
            <stop offset="100%" stopColor="#1E293B" />
          </linearGradient>
        </defs>
        {/* Vintage Hot Rod Deep Red Radial Background */}
        <rect width="100" height="100" rx="22" fill="#170505" />
        <rect x="4" y="4" width="92" height="92" rx="18" fill="url(#rubyBowl)" stroke="#450A0A" strokeWidth="1.5" />
        
        {/* Retro White/Creame outer speed-stripes */}
        <circle cx="50" cy="50" r="41" fill="none" stroke="#FDF4E3" strokeWidth="1.5" opacity="0.35" />
        <circle cx="50" cy="50" r="37" fill="none" stroke="#FDF4E3" strokeWidth="1" strokeDasharray="3 5" opacity="0.25" />

        {/* Bold mechanical interlocking wrench & piston */}
        <g transform="translate(50,54) scale(0.95) translate(-50,-50)">
          {/* Solid Heavy Weight Steel Piston Rod */}
          <path d="M 45,36 L 45,78 C 45,82 47,84 50,84 C 53,84 55,82 55,78 L 55,36 Z" fill="url(#chromeShine)" stroke="#0F172A" strokeWidth="1.5" />
          {/* Piston head crown with compression grooves */}
          <rect x="32" y="18" width="36" height="18" rx="4" fill="url(#chromeShine)" stroke="#0F172A" strokeWidth="2" />
          <line x1="36" y1="24" x2="64" y2="24" stroke="#0F172A" strokeWidth="1.5" />
          <line x1="36" y1="29" x2="64" y2="29" stroke="#0F172A" strokeWidth="1.5" />
          
          {/* Intersecting High Fidelity custom ratcheting open client-wrench */}
          <g transform="translate(50,52) rotate(-35) translate(-50,-50)">
            <path d="M 20,44 L 80,44" stroke="url(#chromeShine)" strokeWidth="6.5" strokeLinecap="round" />
            {/* Wrench jaw details */}
            <circle cx="20" cy="44" r="11" fill="url(#chromeShine)" stroke="#0F172A" strokeWidth="2" />
            <polygon points="10,40 22,34 22,54 10,48" fill="#991B1B" stroke="#0F172A" strokeWidth="1.5" />
          </g>
        </g>
      </svg>
    )
  },
  {
    id: 'retro_spark',
    name: 'Precision Ignition Spark',
    colorName: 'Classic Track Amber',
    primaryColor: '#D97706',
    secondaryColor: '#1E1B4B',
    themeClass: 'from-yellow-500 to-amber-700',
    svgMarkup: (
      <svg viewBox="0 0 100 100" className="w-full h-full">
        <defs>
          <linearGradient id="sixtiesSun" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#F59E0B" />
            <stop offset="100%" stopColor="#B45309" />
          </linearGradient>
        </defs>
        {/* Sunny Deep Blue & Orange Vintage contrast shell */}
        <rect width="100" height="100" rx="22" fill="#0C0A21" />
        <circle cx="50" cy="50" r="42" fill="url(#sixtiesSun)" />
        
        {/* Abstract racing stripes overlay */}
        <path d="M 8,32 L 92,32 M 8,40 L 92,40 M 8,48 L 92,48" stroke="#0C0A21" strokeWidth="3" opacity="0.15" />

        {/* Vector high contrast Sparkplug */}
        <g transform="translate(50,48) scale(0.9) translate(-50,-50)">
          {/* Thread and metal shell */}
          <rect x="42" y="38" width="16" height="20" rx="1" fill="#E2E8F0" stroke="#0C0A21" strokeWidth="2.5" />
          <line x1="42" y1="44" x2="58" y2="44" stroke="#0C0A21" strokeWidth="2" />
          <line x1="42" y1="50" x2="58" y2="50" stroke="#0C0A21" strokeWidth="2" />

          {/* Ceramic ribbed body */}
          <path d="M 44,14 L 56,14 L 54,38 L 46,38 Z" fill="#FFFFFF" stroke="#0C0A21" strokeWidth="2.5" />
          <line x1="45" y1="20" x2="55" y2="20" stroke="#0C0A21" strokeWidth="1.5" />
          <line x1="45" y1="26" x2="55" y2="26" stroke="#0C0A21" strokeWidth="1.5" />
          <line x1="46" y1="32" x2="54" y2="32" stroke="#0C0A21" strokeWidth="1.5" />

          {/* Platinum electrode spark gap with bright cyan lightning */}
          <path d="M 50,58 L 50,68" stroke="#94A3B8" strokeWidth="3.5" strokeLinecap="round" />
          <path d="M 42,68 L 46,68 L 46,74 L 50,74" fill="none" stroke="#94A3B8" strokeWidth="3" strokeLinecap="round" />
          
          {/* Neon Voltage discharge lightning */}
          <path d="M 47,68 L 49,63 L 52,65" fill="none" stroke="#38BDF8" strokeWidth="2" strokeLinecap="round" />
          <circle cx="50" cy="65" r="4.5" fill="#38BDF8" opacity="0.7" />
          <circle cx="50" cy="65" r="1.5" fill="#FFFFFF" />
        </g>
      </svg>
    )
  }
];

export default function AppCustomizer() {
  const [useCustomIcon, setUseCustomIcon] = useState<boolean>(true);
  const [selectedIcon, setSelectedIcon] = useState<string>('obsidian_crest');
  const [accentColor, setAccentColor] = useState<string>('#F59E0B');
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  // Load preferences from localStorage on mount
  useEffect(() => {
    const savedIconId = localStorage.getItem('vibe_mechanic_icon_id');
    const savedUseCustom = localStorage.getItem('vibe_mechanic_use_custom_icon');
    const savedAccent = localStorage.getItem('vibe_mechanic_accent');

    if (savedIconId) setSelectedIcon(savedIconId);
    if (savedUseCustom) setUseCustomIcon(savedUseCustom === 'true');
    if (savedAccent) {
      setAccentColor(savedAccent);
      document.documentElement.style.setProperty('--theme-accent', savedAccent);
    }
  }, []);

  // Update dynamic document headers and HTML elements on setting updates
  const applySettings = (iconId: string, customEnabled: boolean, accent: string) => {
    localStorage.setItem('vibe_mechanic_icon_id', iconId);
    localStorage.setItem('vibe_mechanic_use_custom_icon', String(customEnabled));
    localStorage.setItem('vibe_mechanic_accent', accent);
    
    // Dynamic color accent injection
    setAccentColor(accent);
    document.documentElement.style.setProperty('--theme-accent', accent);

    // Dynamic favicon updates in Head for actual browser tabs!
    const link: HTMLLinkElement | null = document.querySelector("link[rel*='icon']");
    if (link) {
      if (customEnabled) {
        // Simple canvas generator to build high-def dynamic favicons in browser on the fly
        const canvas = document.createElement('canvas');
        canvas.width = 64;
        canvas.height = 64;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          // Determine custom theme matching styling colors
          let bg = '#0C0E14';
          let primary = '#F59E0B';
          if (iconId === 'cyber_cruiser') {
            bg = '#03000A';
            primary = '#EC4899';
          } else if (iconId === 'hotrod_vintage') {
            bg = '#170505';
            primary = '#EF4444';
          } else if (iconId === 'retro_spark') {
            bg = '#0C0A21';
            primary = '#D97706';
          }
          
          ctx.fillStyle = bg;
          ctx.beginPath();
          ctx.arc(32, 32, 32, 0, 2 * Math.PI);
          ctx.fill();
          
          ctx.fillStyle = primary;
          ctx.beginPath();
          ctx.arc(32, 32, 12, 0, 2 * Math.PI);
          ctx.fill();
          
          link.href = canvas.toDataURL();
        }
      } else {
        link.href = "/icon.svg"; // standard default fallback
      }
    }

    setToastMsg("Preferences successfully configured!");
    setTimeout(() => setToastMsg(null), 3000);
  };

  const currentIcon = ICON_OPTIONS.find(i => i.id === selectedIcon) || ICON_OPTIONS[0];

  return (
    <div className="bg-[#151921] p-6 rounded-2xl border border-[#1E293B] shadow-2xl relative">
      <div className="flex items-center gap-3 mb-6 border-b border-[#334155]/60 pb-4">
        <div className="bg-amber-500/10 p-2.5 rounded-full text-amber-500">
          <Palette className="w-5 h-5" />
        </div>
        <div>
          <h3 className="text-lg font-bold text-white font-mono uppercase tracking-tight">App Interface & Icon Settings</h3>
          <p className="text-xs text-[#94A3B8]">Preview and personalize your mobile launcher icon and visual vibe.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
        
        {/* LEFT COLUMN: Controls & Selections */}
        <div className="space-y-6">
          
          {/* Toggle Choice of Customizing Icon */}
          <div className="bg-[#0B0F19] p-4.5 rounded-xl border border-[#1E293B] flex items-center justify-between">
            <div className="space-y-0.5 max-w-[70%]">
              <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-amber-500 flex items-center gap-1">
                <Shield className="w-3.5 h-3.5" /> PWA Launcher Customization
              </span>
              <p className="text-xs font-bold text-[#E2E8F0] mt-1">Use Personalized App Icon</p>
              <p className="text-[10px] text-[#64748B]">Activate custom theme matching on your mobile home screen launcher.</p>
            </div>
            
            <button
              type="button"
              onClick={() => {
                const checked = !useCustomIcon;
                setUseCustomIcon(checked);
                applySettings(selectedIcon, checked, checked ? currentIcon.primaryColor : '#F59E0B');
              }}
              className={`w-12 h-6.5 rounded-full p-1 transition-all ${useCustomIcon ? 'bg-amber-500 text-black' : 'bg-[#1A202C]'}`}
            >
              <div className={`w-4.5 h-4.5 rounded-full bg-white transition-all transform ${useCustomIcon ? 'translate-x-5.5' : 'translate-x-0'}`} />
            </button>
          </div>

          {/* Icon design library selections */}
          {useCustomIcon && (
            <div className="space-y-4 animate-in fade-in slide-in-from-top-3 duration-350">
              <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-amber-500">
                Choose Launcher Design:
              </span>
              
              <div className="space-y-2.5">
                {ICON_OPTIONS.map((opt) => (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => {
                      setSelectedIcon(opt.id);
                      applySettings(opt.id, useCustomIcon, opt.primaryColor);
                    }}
                    className={`w-full text-left p-3.5 rounded-xl border transition-all flex items-center gap-4 ${
                      selectedIcon === opt.id 
                        ? 'bg-amber-500/10 border-amber-500 text-white' 
                        : 'bg-[#0B0F19] border-[#1E293B] hover:border-[#334155] text-[#94A3B8]'
                    }`}
                  >
                    <div className="w-11 h-11 shrink-0 bg-[#000] rounded-xl overflow-hidden skeleton border border-[#1E293B]">
                      {opt.svgMarkup}
                    </div>
                    <div className="flex-1">
                      <p className="text-xs font-bold font-mono text-white flex items-center gap-1.5 justify-between">
                        {opt.name}
                        {selectedIcon === opt.id && <Check className="w-4 h-4 text-amber-500 shrink-0" />}
                      </p>
                      <p className="text-[10px] text-[#64748B] mt-0.5">Accented with {opt.colorName} highlight colors</p>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Toast feedback notifications */}
          {toastMsg && (
            <div className="p-3 bg-emerald-500/10 border border-emerald-500/25 rounded-xl text-emerald-400 text-xs font-mono flex items-center gap-2">
              <Sparkles className="w-4 h-4" /> {toastMsg}
            </div>
          )}
        </div>

        {/* RIGHT COLUMN: Realistic Android Dock Smartphone Mockup */}
        <div className="bg-[#0B0F19] border border-[#1E293B] p-6 rounded-2xl flex flex-col items-center justify-center relative">
          <span className="absolute top-3 left-4 text-[9px] font-mono text-amber-500/40 uppercase tracking-widest">
            Smartphone Home Screen Mockup
          </span>
          
          {/* Minimalist device housing shell */}
          <div className="w-[180px] h-[340px] bg-black border-4 border-[#334155] rounded-[28px] p-2 relative shadow-2xl flex flex-col justify-between overflow-hidden relative">
            
            {/* Camera island on device notch top */}
            <div className="absolute top-1 right-[30%] left-[30%] h-3.5 bg-black rounded-b-xl z-20 flex justify-center items-center">
              <div className="w-1.5 h-1.5 bg-[#111827] rounded-full" />
            </div>

            {/* Simulated Desktop Dynamic Wallpaper */}
            <div className="absolute inset-0 z-0 bg-gradient-to-tr from-[#1E1B4B] via-[#881337] to-[#111827] opacity-90" />

            {/* Desktop Widget Clock */}
            <div className="relative z-10 text-center mt-7">
              <p className="text-[20px] font-bold tracking-tight text-white font-mono">10:42</p>
              <p className="text-[8px] text-zinc-300 font-semibold uppercase tracking-wider">Friday, May 22</p>
            </div>

            {/* Interactive Desktop Icons and App placement */}
            <div className="relative z-10 flex flex-col justify-end h-full py-1 gap-4 select-none">
              
              {/* Launcher custom placement */}
              <div className="grid grid-cols-3 gap-2 text-center justify-center items-center">
                
                {/* Simulated Dummy Icon 1 */}
                <div className="flex flex-col items-center opacity-40">
                  <div className="w-8 h-8 rounded-lg bg-zinc-800 flex items-center justify-center text-[10px]">📞</div>
                  <span className="text-[7px] text-white font-medium mt-1 truncate max-w-full">Phone</span>
                </div>

                {/* Vibe Mechanics actual custom selector icon! */}
                <motion.div 
                  key={selectedIcon}
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ type: "spring", stiffness: 300, damping: 20 }}
                  className="flex flex-col items-center relative"
                >
                  <div className="w-11 h-11 rounded-[10px] overflow-hidden bg-black shadow-lg border border-[#F59E0B]/20 relative">
                    {useCustomIcon ? currentIcon.svgMarkup : (
                      <div className="w-full h-full bg-[#1A1D24] flex items-center justify-center text-xs">🛠️</div>
                    )}
                  </div>
                  <span className="text-[8px] text-amber-400 font-extrabold mt-1 tracking-tight truncate max-w-full">
                    VibeMech
                  </span>
                  
                  {/* Glowing installation ring badge */}
                  <span className="absolute -top-1 -right-1.5 bg-amber-500 text-black text-[6px] font-extrabold px-1 py-0.2 rounded-full border border-black animate-pulse">
                    PWA
                  </span>
                </motion.div>

                {/* Simulated Dummy Icon 2 */}
                <div className="flex flex-col items-center opacity-40">
                  <div className="w-8 h-8 rounded-lg bg-zinc-800 flex items-center justify-center text-[10px]">📷</div>
                  <span className="text-[7px] text-white font-medium mt-1 truncate max-w-full">Camera</span>
                </div>

              </div>

              {/* Home swipe indicator bar */}
              <div className="w-14 h-1 bg-white/40 rounded-full mx-auto mt-2" />
            </div>
            
          </div>

          {/* Quick installer card instructions */}
          <div className="mt-5 text-center text-[10px] text-[#64748B] flex items-center gap-1">
            <Smartphone className="w-3.5 h-3.5 text-amber-500 shrink-0" />
            <span>Click <b>Share</b> in your mobile Chrome to install this on your home screen dock.</span>
          </div>
        </div>

      </div>
    </div>
  );
}
