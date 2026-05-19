/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState } from 'react';
import { Wrench, Camera, CarFront, FileText, History as HistoryIcon } from 'lucide-react';
import { cn } from './lib/utils';
import PartScanner from './components/PartScanner';
import Troubleshoot from './components/Troubleshoot';
import VehicleSelector from './components/VehicleSelector';
import HistoryTab from './components/HistoryTab';

export type Vehicle = {
  year: string;
  make: string;
  model: string;
  engine?: string;
};

export default function App() {
  const [vehicle, setVehicle] = useState<Vehicle>({ year: '', make: '', model: '', engine: '' });
  const [activeTab, setActiveTab] = useState<'troubleshoot' | 'scanner' | 'vehicle' | 'history'>('vehicle');

  const navItems = [
    { id: 'vehicle', label: 'My Vehicle', icon: CarFront },
    { id: 'troubleshoot', label: 'Diagnose', icon: Wrench },
    { id: 'scanner', label: 'Part Scanner', icon: Camera },
    { id: 'history', label: 'History', icon: HistoryIcon },
  ];

  return (
    <div className="flex flex-col min-h-screen bg-[#0A0B0E] text-[#E2E8F0] font-sans">
      {/* Header */}
      <header className="h-16 bg-[#0F1115] border-b border-[#1E293B] sticky top-0 z-10 px-4 sm:px-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-[#F59E0B] rounded flex items-center justify-center">
            <Wrench className="w-5 h-5 text-black" />
          </div>
          <h1 className="text-lg font-bold tracking-tight uppercase">Pocket <span className="text-[#F59E0B]">Mechanic</span></h1>
        </div>
        {(vehicle.year || vehicle.make || vehicle.model) && (
          <div className="hidden sm:flex bg-[#1E293B] px-4 py-1.5 rounded-full border border-[#334155] items-center gap-3">
            <span className="text-xs font-semibold text-[#94A3B8] uppercase tracking-wider">Active Vehicle:</span>
            <span className="text-sm text-white">
              {vehicle.year} {vehicle.make} {vehicle.model} {vehicle.engine || ''}
            </span>
            <CarFront className="w-4 h-4 text-[#F59E0B]" />
          </div>
        )}
      </header>

      {/* Main Content Area */}
      <main className="flex-1 w-full flex flex-col bg-[radial-gradient(circle_at_top_right,_#111827,_#0A0B0E)]">
        <div className="w-full max-w-4xl mx-auto p-4 sm:p-6 pb-24 lg:pb-6 flex-1">
          {activeTab === 'vehicle' && <VehicleSelector vehicle={vehicle} setVehicle={setVehicle} onNavigate={() => setActiveTab('troubleshoot')} />}
          {activeTab === 'troubleshoot' && <Troubleshoot vehicle={vehicle} />}
          {activeTab === 'scanner' && <PartScanner vehicle={vehicle} />}
          {activeTab === 'history' && <HistoryTab onSelectVehicle={setVehicle} onNavigate={() => setActiveTab('troubleshoot')} />}
        </div>
      </main>

      {/* Bottom Navigation for Mobile / Side Nav for Desktop via Flex */}
      <nav className="print:hidden fixed bottom-0 left-0 right-0 bg-[#0F1115] border-t border-[#1E293B] lg:sticky lg:bottom-auto lg:top-0 lg:rounded-t-none pb-safe">
        <div className="max-w-4xl mx-auto flex justify-around p-2 lg:p-0">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id as any)}
                className={cn(
                  "flex flex-col items-center justify-center p-3 rounded-xl transition-all duration-200 ease-out w-full lg:w-auto lg:px-6 lg:py-4 lg:flex-row lg:gap-3",
                  isActive
                    ? "text-[#F59E0B] lg:bg-transparent lg:border-b-2 lg:border-[#F59E0B] lg:rounded-none"
                    : "text-[#94A3B8] hover:bg-[#1E293B] hover:text-white"
                )}
              >
                <Icon className={cn("w-6 h-6 mb-1 lg:mb-0", isActive ? "stroke-[#F59E0B]" : "")} />
                <span className={cn("text-xs font-semibold uppercase tracking-wider lg:text-sm", isActive ? "text-[#F59E0B]" : "")}>
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
