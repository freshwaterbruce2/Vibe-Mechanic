/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from 'react';
import { Wrench, Camera, CarFront, Gauge, Cog, BookOpen, History as HistoryIcon, Volume2, Droplet } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from './lib/utils';
import PartScanner from './components/PartScanner';
import Troubleshoot from './components/Troubleshoot';
import VehicleSelector from './components/VehicleSelector';
import HistoryTab from './components/HistoryTab';
import Obd2Lookup from './components/Obd2Lookup';
import SpecsAndService from './components/SpecsAndService';
import SoundDiagnose from './components/SoundDiagnose';
import FluidTracker from './components/FluidTracker';
import { ICON_OPTIONS } from './components/AppCustomizer';

export type Vehicle = {
  year: string;
  make: string;
  model: string;
  engine?: string;
};

export default function App() {
  const [vehicle, setVehicle] = useState<Vehicle>({ year: '', make: '', model: '', engine: '' });
  const [activeTab, setActiveTab] = useState<'troubleshoot' | 'sound' | 'scanner' | 'vehicle' | 'history' | 'obd2' | 'specs' | 'fluids'>('vehicle');
  const [currentIconId, setCurrentIconId] = useState<string>('nano_banana');

  useEffect(() => {
    const handleUpdate = () => {
      const savedIconId = localStorage.getItem('vibe_mechanic_icon_id') || 'nano_banana';
      setCurrentIconId(savedIconId);
    };

    // Initialize
    handleUpdate();

    // Listen for custom settings dispatch
    window.addEventListener('vibe_mechanic_settings_updated', handleUpdate);
    return () => {
      window.removeEventListener('vibe_mechanic_settings_updated', handleUpdate);
    };
  }, []);

  const navItems = [
    { id: 'vehicle', label: 'My Vehicle', icon: CarFront },
    { id: 'troubleshoot', label: 'Diagnose', icon: Wrench },
    { id: 'fluids', label: 'Fluids', icon: Droplet },
    { id: 'sound', label: 'Sound', icon: Volume2 },
    { id: 'obd2', label: 'OBD-II Lookup', icon: Gauge },
    { id: 'specs', label: 'Specs & Guides', icon: BookOpen },
    { id: 'scanner', label: 'Part Scanner', icon: Camera },
    { id: 'history', label: 'History', icon: HistoryIcon },
  ];

  return (
    <div className="flex flex-col min-h-screen bg-[#0A0B0E] text-[#E2E8F0] font-sans relative overflow-x-hidden">
      
      {/* Visual background gear-train assembly for authentic mechanic & garage vibes */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0 select-none print:hidden">
        {/* Top right gear assembly */}
        <div className="absolute -top-32 -right-32 text-amber-500/[0.03] md:text-amber-500/[0.02]">
          <Cog className="w-[28rem] h-[28rem] animate-spin-slow" />
        </div>
        <div className="absolute top-48 -right-16 text-zinc-600/[0.03] md:text-zinc-650/[0.015]">
          <Cog className="w-64 h-64 animate-spin-slow-reverse" />
        </div>
        
        {/* Bottom left gear assembly */}
        <div className="absolute -bottom-40 -left-40 text-zinc-600/[0.03] md:text-zinc-650/[0.02]">
          <Cog className="w-[36rem] h-[36rem] animate-spin-slow-reverse" />
        </div>
        <div className="absolute bottom-96 -left-16 text-amber-500/[0.02] md:text-amber-500/[0.01]">
          <Cog className="w-72 h-72 animate-spin-slow" />
        </div>
      </div>

      {/* Header */}
      <header className="h-16 bg-[#0F1115]/90 backdrop-blur-md border-b border-[#1E293B] sticky top-0 z-10 px-4 sm:px-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center relative shadow-lg overflow-hidden bg-black border border-[#1E293B]">
            {ICON_OPTIONS.find(i => i.id === currentIconId)?.svgMarkup || ICON_OPTIONS[0].svgMarkup}
          </div>
          <h1 className="text-lg font-bold tracking-tight uppercase">Vibe <span style={{ color: 'var(--theme-accent, #EAB308)' }}>Mechanics</span></h1>
        </div>
        {(vehicle.year || vehicle.make || vehicle.model) && (
          <div className="hidden sm:flex bg-[#1E293B]/80 px-4 py-1.5 rounded-full border border-[#334155] items-center gap-3">
            <span className="text-xs font-semibold text-[#94A3B8] uppercase tracking-wider">Active Vehicle:</span>
            <span className="text-sm text-white font-mono">
              {vehicle.year} {vehicle.make} {vehicle.model} {vehicle.engine || ''}
            </span>
            <CarFront className="w-4 h-4 text-[#EAB308]" />
          </div>
        )}
      </header>

      {/* Main Content Area */}
      <main className="flex-1 w-full flex flex-col bg-[radial-gradient(circle_at_top_right,_#111827,_#0A0B0E)] relative z-10">
        <div className="w-full max-w-4xl mx-auto p-4 sm:p-6 pb-24 lg:pb-6 flex-1 flex flex-col">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 12, filter: 'blur(2px)' }}
              animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
              exit={{ opacity: 0, y: -12, filter: 'blur(2px)' }}
              transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
              className="w-full flex-1 flex flex-col"
            >
              {activeTab === 'vehicle' && <VehicleSelector vehicle={vehicle} setVehicle={setVehicle} onNavigate={() => setActiveTab('troubleshoot')} />}
              {activeTab === 'troubleshoot' && <Troubleshoot vehicle={vehicle} />}
              {activeTab === 'fluids' && <FluidTracker vehicle={vehicle} />}
              {activeTab === 'sound' && <SoundDiagnose vehicle={vehicle} />}
              {activeTab === 'obd2' && <Obd2Lookup vehicle={vehicle} />}
              {activeTab === 'specs' && <SpecsAndService vehicle={vehicle} />}
              {activeTab === 'scanner' && <PartScanner vehicle={vehicle} />}
              {activeTab === 'history' && <HistoryTab onSelectVehicle={setVehicle} onNavigate={() => setActiveTab('troubleshoot')} />}
            </motion.div>
          </AnimatePresence>
        </div>
      </main>

      {/* Bottom Navigation for Mobile / Side Nav for Desktop via Flex */}
      <nav className="print:hidden fixed bottom-0 left-0 right-0 bg-[#0F1115]/95 backdrop-blur-md border-t border-[#1E293B] lg:sticky lg:bottom-auto lg:top-0 lg:rounded-t-none pb-safe z-10 overflow-x-auto scrollbar-none">
        <div className="max-w-4xl mx-auto flex justify-start lg:justify-around p-1.5 lg:p-0 min-w-max lg:min-w-0">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id as any)}
                className={cn(
                  "flex flex-col items-center justify-center p-2.5 rounded-xl transition-all duration-200 ease-out shrink-0 px-4 sm:px-5 lg:px-6 lg:py-4 lg:flex-row lg:gap-3",
                  isActive
                    ? "text-[#EAB308] lg:bg-transparent lg:border-b-2 lg:border-[#EAB308] lg:rounded-none"
                    : "text-[#94A3B8] hover:bg-[#1E293B]/50 hover:text-white"
                )}
              >
                <Icon className={cn("w-5 h-5 mb-1 lg:mb-0", isActive ? "stroke-[#EAB308]" : "")} />
                <span className={cn("text-[9px] sm:text-xs font-semibold uppercase tracking-wider lg:text-sm", isActive ? "text-[#EAB308]" : "")}>
                  {item.label}
                </span>
              </button>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
