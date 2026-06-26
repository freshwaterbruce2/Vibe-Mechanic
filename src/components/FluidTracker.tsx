import { useState, useEffect } from 'react';
import { Vehicle } from '../App';
import { 
  Droplet, 
  Wrench, 
  Calendar, 
  Gauge, 
  AlertTriangle, 
  CheckCircle2, 
  RefreshCw, 
  Settings, 
  ChevronRight, 
  HelpCircle,
  Clock,
  ShieldCheck,
  Flame,
  Info
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface FluidTrackerProps {
  vehicle: Vehicle;
}

interface FluidCondition {
  id: string;
  name: string;
  iconName: 'oil' | 'coolant' | 'brake' | 'transmission' | 'power_steering' | 'washer';
  level: 'Full' | 'Low' | 'Critical';
  lastChangedMileage: number;
  lastChangedDate: string;
  baseIntervalMiles: number;
  recommendedType: string;
  recommendedCapacity: string;
}

export default function FluidTracker({ vehicle }: FluidTrackerProps) {
  // Odometer reading
  const [currentOdometer, setCurrentOdometer] = useState<number>(100000);
  const [severeConditions, setSevereConditions] = useState<boolean>(false);
  const [specLoading, setSpecLoading] = useState<boolean>(false);
  const [activeAlertsCount, setActiveAlertsCount] = useState<number>(0);
  
  // Create a unique key for the vehicle's fluid logs
  const vehicleKey = `vibe_fluids_${vehicle.year || 'generic'}_${vehicle.make || 'vehicle'}_${vehicle.model || 'model'}`;

  // Default fluid settings
  const defaultFluids: FluidCondition[] = [
    {
      id: 'oil',
      name: 'Engine Oil',
      iconName: 'oil',
      level: 'Full',
      lastChangedMileage: 95000,
      lastChangedDate: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 3 months ago
      baseIntervalMiles: 5000,
      recommendedType: 'SAE 0W-20 (Full Synthetic)',
      recommendedCapacity: '4.5 - 5.5 Quarts'
    },
    {
      id: 'coolant',
      name: 'Engine Coolant',
      iconName: 'coolant',
      level: 'Full',
      lastChangedMileage: 80000,
      lastChangedDate: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 1 year ago
      baseIntervalMiles: 50000,
      recommendedType: 'Long Life Pink/Blue 50/50',
      recommendedCapacity: '1.5 - 2.0 Gallons'
    },
    {
      id: 'brake',
      name: 'Brake Fluid',
      iconName: 'brake',
      level: 'Full',
      lastChangedMileage: 85000,
      lastChangedDate: new Date(Date.now() - 250 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      baseIntervalMiles: 30000,
      recommendedType: 'Heavy Duty DOT 3 or DOT 4',
      recommendedCapacity: '1 - 2 Pints'
    },
    {
      id: 'transmission',
      name: 'Transmission Fluid',
      iconName: 'transmission',
      level: 'Full',
      lastChangedMileage: 60000,
      lastChangedDate: new Date(Date.now() - 730 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      baseIntervalMiles: 60000,
      recommendedType: 'Synthetic Multi-Vehicle ATF / CVT Fluid',
      recommendedCapacity: '5.0 - 8.0 Quarts'
    },
    {
      id: 'power_steering',
      name: 'Power Steering Fluid',
      iconName: 'power_steering',
      level: 'Full',
      lastChangedMileage: 90000,
      lastChangedDate: new Date(Date.now() - 180 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      baseIntervalMiles: 50000,
      recommendedType: 'Power Steering Fluid / Dexron VI ATF',
      recommendedCapacity: '1.0 - 1.5 Quarts'
    },
    {
      id: 'washer',
      name: 'Windshield Washer Fluid',
      iconName: 'washer',
      level: 'Full',
      lastChangedMileage: 99000,
      lastChangedDate: new Date().toISOString().split('T')[0],
      baseIntervalMiles: 0, // No mileage requirement, track level only
      recommendedType: 'All-Season Demisted Washer Fluid (-20°F)',
      recommendedCapacity: '1.0 Gallon'
    }
  ];

  const [fluids, setFluids] = useState<FluidCondition[]>(defaultFluids);

  // Load fluid stats from localStorage
  const loadStoredFluids = () => {
    try {
      const storedOdo = localStorage.getItem(`${vehicleKey}_odometer`);
      const storedFluids = localStorage.getItem(`${vehicleKey}_fluidState`);
      const storedSevere = localStorage.getItem(`${vehicleKey}_severe`);

      if (storedOdo) {
        setCurrentOdometer(parseInt(storedOdo));
      } else {
        const fallbackOdo = (vehicle.year && parseInt(vehicle.year) < 2010) ? 145000 : 82000;
        setCurrentOdometer(fallbackOdo);
      }

      if (storedSevere) {
        setSevereConditions(storedSevere === 'true');
      } else {
        setSevereConditions(false);
      }

      if (storedFluids) {
        setFluids(JSON.parse(storedFluids));
      } else {
        // If no stored state, set initial states with appropriate mileage relative to the loaded odometer
        const activeOdo = storedOdo ? parseInt(storedOdo) : ((vehicle.year && parseInt(vehicle.year) < 2010) ? 145000 : 82000);
        const relativeFluids = defaultFluids.map(f => {
          if (f.id === 'oil') {
            return { ...f, lastChangedMileage: Math.max(0, activeOdo - 3400) };
          }
          if (f.id === 'coolant') {
            return { ...f, lastChangedMileage: Math.max(0, activeOdo - 12000) };
          }
          if (f.id === 'brake') {
            return { ...f, lastChangedMileage: Math.max(0, activeOdo - 18000) };
          }
          if (f.id === 'transmission') {
            return { ...f, lastChangedMileage: Math.max(0, activeOdo - 22000) };
          }
          if (f.id === 'power_steering') {
            return { ...f, lastChangedMileage: Math.max(0, activeOdo - 15000) };
          }
          if (f.id === 'washer') {
            return { ...f, lastChangedMileage: Math.max(0, activeOdo - 500) };
          }
          return f;
        });
        setFluids(relativeFluids);
      }
    } catch (e) {
      console.error("Error reading fluid items", e);
    }
  };

  // Fetch true technical specs from AI endpoint on load and map it to our fluid recommended types and capacities
  const augmentFluidsWithSpecs = async () => {
    if (!vehicle.make || !vehicle.model) return;
    setSpecLoading(true);
    try {
      const response = await fetch('/api/specs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          year: vehicle.year,
          make: vehicle.make,
          model: vehicle.model,
          engine: vehicle.engine
        })
      });

      if (response.ok) {
        const specDetails = await response.json();
        setFluids(prev => prev.map(f => {
          if (f.id === 'oil') {
            return { 
              ...f, 
              recommendedType: specDetails.oil_type || f.recommendedType,
              recommendedCapacity: specDetails.oil_capacity || f.recommendedCapacity
            };
          }
          if (f.id === 'coolant') {
            return { 
              ...f, 
              recommendedType: specDetails.coolant_type || f.recommendedType
            };
          }
          if (f.id === 'brake') {
            return { 
              ...f, 
              recommendedType: specDetails.brake_fluid || f.recommendedType
            };
          }
          if (f.id === 'transmission') {
            return { 
              ...f, 
              recommendedType: specDetails.transmission_fluid || f.recommendedType
            };
          }
          if (f.id === 'power_steering') {
            return { 
              ...f, 
              recommendedType: specDetails.power_steering_fluid || f.recommendedType
            };
          }
          return f;
        }));
      }
    } catch (err) {
      console.warn("Could not enrich fluids with live AI specs, using default database benchmarks.");
    } finally {
      setSpecLoading(false);
    }
  };

  useEffect(() => {
    loadStoredFluids();
  }, [vehicleKey]);

  useEffect(() => {
    // Try to enrich fluid specs after state starts
    if (vehicle.make && vehicle.model) {
      augmentFluidsWithSpecs();
    }
  }, [vehicle.year, vehicle.make, vehicle.model]);

  // Save changes to localStorage whenever currentOdometer, fluids state, or severe toggle changes
  const saveFluidState = (updatedOdo: number, updatedFluids: FluidCondition[], severe: boolean) => {
    localStorage.setItem(`${vehicleKey}_odometer`, updatedOdo.toString());
    localStorage.setItem(`${vehicleKey}_fluidState`, JSON.stringify(updatedFluids));
    localStorage.setItem(`${vehicleKey}_severe`, severe.toString());
  };

  const handleOdometerChange = (val: number) => {
    const freshVal = isNaN(val) ? 0 : val;
    setCurrentOdometer(freshVal);
    saveFluidState(freshVal, fluids, severeConditions);
  };

  const handleLevelChange = (fluidId: string, level: 'Full' | 'Low' | 'Critical') => {
    const updated = fluids.map(f => f.id === fluidId ? { ...f, level } : f);
    setFluids(updated);
    saveFluidState(currentOdometer, updated, severeConditions);
  };

  const handleCustomIntervalChange = (fluidId: string, customInterval: number) => {
    const updated = fluids.map(f => f.id === fluidId ? { ...f, baseIntervalMiles: customInterval } : f);
    setFluids(updated);
    saveFluidState(currentOdometer, updated, severeConditions);
  };

  const handleLogChange = (fluidId: string) => {
    const today = new Date().toISOString().split('T')[0];
    const updated = fluids.map(f => f.id === fluidId ? {
      ...f,
      lastChangedMileage: currentOdometer,
      lastChangedDate: today,
      level: 'Full' as const
    } : f);
    
    setFluids(updated);
    saveFluidState(currentOdometer, updated, severeConditions);
  };

  const toggleSevereDriving = () => {
    const nextSevere = !severeConditions;
    setSevereConditions(nextSevere);
    saveFluidState(currentOdometer, fluids, nextSevere);
  };

  // Helper calculation details
  const getFluidInterval = (fluid: FluidCondition) => {
    if (fluid.baseIntervalMiles === 0) return 0;
    // Severe duty cycle reduces change milestone targets by 30%
    return severeConditions ? Math.round(fluid.baseIntervalMiles * 0.7) : fluid.baseIntervalMiles;
  };

  const getFluidLifeProgress = (fluid: FluidCondition) => {
    const interval = getFluidInterval(fluid);
    if (interval === 0) return 100; // Washers or non mileage items
    const milesDriven = currentOdometer - fluid.lastChangedMileage;
    const remaining = interval - milesDriven;
    
    if (remaining <= 0) return 0;
    return Math.round((remaining / interval) * 100);
  };

  const getFluidStatusLabel = (fluid: FluidCondition) => {
    const progress = getFluidLifeProgress(fluid);
    const interval = getFluidInterval(fluid);

    if (fluid.level === 'Critical') {
      return { label: 'CRITICAL FLUID LEVEL', isAlert: true, colorClass: 'text-red-500 bg-red-500/10 border-red-500/20' };
    }
    if (fluid.level === 'Low') {
      return { label: 'LOW FLUID LEVEL', isAlert: true, colorClass: 'text-amber-500 bg-amber-500/10 border-amber-500/20' };
    }

    if (interval > 0) {
      if (progress === 0 || (currentOdometer - fluid.lastChangedMileage) >= interval) {
        return { label: 'OVERDUE FOR SERVICE', isAlert: true, colorClass: 'text-red-500 bg-red-500/10 border-red-500/20' };
      }
      if (progress < 15) {
        return { label: 'SERVICE DUE SOON', isAlert: true, colorClass: 'text-amber-500 bg-amber-500/10 border-amber-500/20' };
      }
    }

    return { label: 'HEALTHY / FULL', isAlert: false, colorClass: 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20' };
  };

  // Count active diagnostics warnings based on level of fluids or interval overruns
  useEffect(() => {
    let alertCount = 0;
    fluids.forEach(f => {
      const status = getFluidStatusLabel(f);
      if (status.isAlert) alertCount++;
    });
    setActiveAlertsCount(alertCount);
  }, [fluids, currentOdometer, severeConditions]);

  const getFluidIcon = (type: string) => {
    switch (type) {
      case 'oil': return <Flame className="w-5 h-5 text-amber-500 shrink-0" />;
      case 'coolant': return <Droplet className="w-5 h-5 text-cyan-400 shrink-0" />;
      case 'brake': return <ShieldCheck className="w-5 h-5 text-red-500 shrink-0" />;
      case 'transmission': return <Settings className="w-5 h-5 text-indigo-400 shrink-0" />;
      case 'power_steering': return <Wrench className="w-5 h-5 text-pink-400 shrink-0" />;
      default: return <Droplet className="w-5 h-5 text-blue-400 shrink-0" />;
    }
  };

  const getProgressColor = (percent: number) => {
    if (percent < 15) return 'bg-red-500';
    if (percent < 30) return 'bg-amber-500';
    return 'bg-emerald-500';
  };

  return (
    <div className="space-y-6">
      
      {/* Tracker Hero Panel */}
      <div className="bg-[#151921] p-6 rounded-2xl border border-[#1E293B] shadow-lg relative overflow-hidden">
        <div className="absolute right-0 top-0 h-full w-1/3 bg-gradient-to-l from-amber-500/[0.02] to-transparent pointer-events-none" />
        
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-[#334155] pb-5">
          <div className="flex items-center gap-3">
            <div className="bg-amber-500/10 p-3 rounded-full text-amber-500">
              <Droplet className="w-6 h-6 animate-[pulse_2s_infinite]" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                Fluid Vitality & Intervals Tracker
              </h2>
              <p className="text-sm text-[#94A3B8]">
                Log fluid statuses, calculate accurate custom change cycles, and inspect telemetry alerts.
              </p>
            </div>
          </div>

          {/* Connected Vehicle Banner */}
          <div className="bg-black/55 px-4 py-2 rounded-xl border border-zinc-800 flex items-center gap-2">
            <div className={`w-2.5 h-2.5 rounded-full ${vehicle.model ? 'bg-emerald-500 shadow-md shadow-emerald-500/20' : 'bg-amber-500'}`} />
            <span className="text-xs font-mono text-zinc-300">
              {vehicle.make ? `${vehicle.year} ${vehicle.make} ${vehicle.model}` : 'Generic Vehicle Profile'}
            </span>
          </div>
        </div>

        {/* Global Controls Grid */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-5 pt-5 items-center">
          
          {/* Odometer manual setting input */}
          <div className="md:col-span-5 space-y-2">
            <label htmlFor="odometer-input" className="block text-xs font-bold font-mono text-amber-500 uppercase tracking-wider flex items-center gap-1.5">
              <Gauge className="w-4 h-4" /> Current Odometer (Miles)
            </label>
            <div className="relative">
              <input
                id="odometer-input"
                type="number"
                value={currentOdometer === 0 ? '' : currentOdometer}
                onChange={(e) => handleOdometerChange(parseInt(e.target.value) || 0)}
                placeholder="e.g., 120400"
                className="w-full bg-[#1A202C] border border-[#334155] text-white text-base font-mono font-bold rounded-xl focus:ring-amber-500 focus:border-amber-500 px-4 py-3 outline-none"
              />
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-mono text-[#64748B] uppercase select-none">MI</span>
            </div>
            <p className="text-[11px] text-[#64748B] font-sans">
              Enter raw absolute mileage numbers so standard deterioration can calculate properly.
            </p>
          </div>

          {/* Severe Duty Toggle option */}
          <button 
            type="button"
            onClick={toggleSevereDriving}
            className={`md:col-span-4 p-4 rounded-xl border cursor-pointer text-left transition-all duration-200 select-none ${
              severeConditions 
                ? 'bg-amber-500/10 border-amber-500/40 shadow-sm shadow-amber-500/5' 
                : 'bg-[#1A202C]/60 border-[#334155] hover:border-[#475569]'
            }`}
          >
            <div className="flex justify-between items-center mb-1">
              <span className={`text-xs font-bold uppercase tracking-wider font-mono ${severeConditions ? 'text-amber-400' : 'text-zinc-400'}`}>
                Severe Duty Cycle
              </span>
              <div className={`w-8 h-4 rounded-full p-0.5 transition-colors relative ${severeConditions ? 'bg-amber-500' : 'bg-zinc-700'}`}>
                <div className={`w-3 h-3 rounded-full bg-black transition-transform ${severeConditions ? 'translate-x-4' : 'translate-x-0'}`} />
              </div>
            </div>
            <p className="text-[11px] text-[#94A3B8] leading-tight">
              Reduces intervals by 30% for demanding usage (heavy towing, extreme sand/dust, stop-and-go courier, excessive idling).
            </p>
          </button>

          {/* Quick Active Alerts counter board */}
          <div className="md:col-span-3 p-4 bg-[#0F1219] rounded-xl border border-[#1E293B] text-center">
            {activeAlertsCount > 0 ? (
              <div className="space-y-1 animate-[pulse_3s_infinite]">
                <span className="text-2xl font-black font-mono text-red-500 flex items-center justify-center gap-1.5">
                  <AlertTriangle className="w-6 h-6 shrink-0" /> {activeAlertsCount}
                </span>
                <span className="text-[10px] font-bold text-red-400 uppercase tracking-widest block font-mono">
                  ACTIVE FLUID ALERTS
                </span>
              </div>
            ) : (
              <div className="space-y-1">
                <span className="text-2xl font-black font-mono text-emerald-500 flex items-center justify-center gap-1">
                  <CheckCircle2 className="w-5 h-5 shrink-0" /> PASS
                </span>
                <span className="text-[10px] font-bold text-[#94A3B8] uppercase tracking-widest block font-mono">
                  ALL VITAL FLUIDS GOOD
                </span>
              </div>
            )}
          </div>

        </div>
      </div>

      {/* Warning Alert banner if anything is overdue */}
      {activeAlertsCount > 0 && (
        <div className="p-4 bg-red-500/10 border-l-4 border-red-500 rounded-r-xl flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-red-400 font-mono">Imbalance in Fluid Diagnostics Triggered</h4>
            <p className="text-xs text-zinc-300 leading-relaxed mt-1">
              Your vehicle telemetry shows {activeAlertsCount} fluid checkpoint(s) needing attention. Low fluids cause high heat expansion leading to mechanical shear. Perform flushing/top-offs to avoid component damage.
            </p>
          </div>
        </div>
      )}

      {/* Grid of Fluid Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
        {fluids.map((fluid) => {
          const interval = getFluidInterval(fluid);
          const milesSinceChange = currentOdometer - fluid.lastChangedMileage;
          const pct = getFluidLifeProgress(fluid);
          const status = getFluidStatusLabel(fluid);
          const isOverdue = interval > 0 && milesSinceChange >= interval;

          return (
            <div 
              key={fluid.id} 
              className={`bg-[#151921] rounded-2xl border transition-all duration-300 flex flex-col justify-between overflow-hidden relative ${
                status.isAlert 
                  ? 'border-red-500/25 shadow-md shadow-red-500/[0.02]' 
                  : 'border-[#1E293B] hover:border-[#334155]'
              }`}
            >
              
              {/* Card top details banner */}
              <div className="p-5 space-y-4">
                
                {/* Header title/icon */}
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-center gap-2.5">
                    <div className="p-2 bg-black/60 rounded-xl border border-[#1E293B]">
                      {getFluidIcon(fluid.iconName)}
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-[#E2E8F0] tracking-tight">{fluid.name}</h4>
                      <p className="text-[10px] font-mono text-[#94A3B8] font-semibold uppercase mt-0.5 bg-[#1E2941] px-1.5 py-0.5 rounded border border-zinc-800 w-max leading-none">
                        Spec: {fluid.id === 'washer' ? 'Water/Solvent' : 'OEM Specific'}
                      </p>
                    </div>
                  </div>

                  {/* Level status indicator light */}
                  <div className={`px-2 py-1 rounded text-[9px] font-bold uppercase tracking-wider font-mono border ${status.colorClass}`}>
                    {status.label}
                  </div>
                </div>

                {/* Specific recommended types/capacities specs */}
                <div className="bg-[#0F1219] p-3 rounded-xl border border-[#1E293B] space-y-1.5">
                  <span className="text-[8px] uppercase tracking-wider font-bold text-zinc-500 block font-mono">SPECIFICATION CODES:</span>
                  <div className="text-[10px] space-y-1">
                    <div className="flex justify-between text-zinc-400">
                      <span>Standard Type:</span>
                      <span className="text-zinc-200 font-mono font-medium truncate max-w-[170px]" title={fluid.recommendedType}>{fluid.recommendedType}</span>
                    </div>
                    {fluid.recommendedCapacity && (
                      <div className="flex justify-between text-zinc-400">
                        <span>Capacity:</span>
                        <span className="text-zinc-200 font-mono font-medium">{fluid.recommendedCapacity}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Progress bar and math details if mileage based */}
                {interval > 0 ? (
                  <div className="space-y-2">
                    <div className="flex justify-between items-end text-xs">
                      <span className="text-[10px] text-zinc-400 uppercase font-mono tracking-wider font-bold flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5" /> Fluid Lifespan
                      </span>
                      <span className={`font-mono font-bold ${pct < 20 ? 'text-red-400' : 'text-emerald-400'}`}>
                        {pct}% Remaining
                      </span>
                    </div>

                    {/* Bar background */}
                    <div className="w-full h-2 bg-black rounded-full overflow-hidden border border-zinc-800">
                      <div 
                        className={`h-full transition-all duration-500 ${getProgressColor(pct)}`} 
                        style={{ width: `${pct}%` }} 
                      />
                    </div>

                    {/* Numeric tracking readings */}
                    <div className="grid grid-cols-2 gap-2 text-[10px] font-mono border-t border-[#1E293B] pt-2 mt-1">
                      <div>
                        <span className="text-zinc-500 block">LAST FLUSHED:</span>
                        <span className="text-zinc-300 font-bold">{fluid.lastChangedMileage.toLocaleString()} mi</span>
                      </div>
                      <div className="text-right">
                        <span className="text-zinc-500 block">SERVICE TARGET:</span>
                        <span className={`font-bold ${isOverdue ? 'text-red-400' : 'text-zinc-300'}`}>
                          {(fluid.lastChangedMileage + interval).toLocaleString()} mi
                        </span>
                      </div>
                    </div>

                    {/* Date reference */}
                    <div className="text-[9px] text-[#64748B] font-mono flex justify-between">
                      <span>Last Service Date:</span>
                      <span>{fluid.lastChangedDate || 'N/A'}</span>
                    </div>
                  </div>
                ) : (
                  <div className="p-3 bg-blue-950/10 border border-blue-500/10 rounded-xl space-y-1 text-center">
                    <span className="text-[9px] font-mono uppercase tracking-widest text-zinc-500 block">Consumption Level Checked Tab</span>
                    <p className="text-xs text-zinc-300 leading-relaxed font-sans">
                      Washers consumption is fluid-level only. No standard mileage degradation cycle required.
                    </p>
                  </div>
                )}
              </div>

              {/* Card actions bottom bar */}
              <div className="bg-[#0F1219] p-4 border-t border-[#1E293B] space-y-3">
                
                {/* Interactive State modifiers (Level Selector) */}
                <div className="flex flex-col gap-1.5">
                  <span className="text-[8px] uppercase tracking-wider font-bold text-zinc-500 block font-mono">Update State Checked Level:</span>
                  <div className="grid grid-cols-3 gap-1">
                    {(['Full', 'Low', 'Critical'] as const).map((lvl) => {
                      const isActive = fluid.level === lvl;
                      let activeStyle = 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30';
                      if (lvl === 'Low') activeStyle = 'bg-amber-500/10 text-amber-400 border-amber-500/30';
                      if (lvl === 'Critical') activeStyle = 'bg-red-500/10 text-red-500 border-red-500/30';

                      return (
                        <button
                          key={lvl}
                          type="button"
                          onClick={() => handleLevelChange(fluid.id, lvl)}
                          className={`py-1 rounded text-[9px] font-bold font-mono transition-all border ${
                            isActive 
                              ? activeStyle 
                              : 'bg-black/30 border-transparent text-[#64748B] hover:text-zinc-200'
                          }`}
                        >
                          {lvl}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Cycle details customization */}
                {interval > 0 && (
                  <div className="flex items-center justify-between gap-2.5 pt-1 border-t border-zinc-900/60 pb-1">
                    <label htmlFor={`interval-${fluid.id}`} className="text-[9px] uppercase font-bold text-zinc-500 font-mono tracking-wider">Custom Cycle Limit:</label>
                    <div className="flex items-center gap-1">
                      <input
                        id={`interval-${fluid.id}`}
                        type="number"
                        step="500"
                        min="1000"
                        max="150000"
                        value={fluid.baseIntervalMiles}
                        onChange={(e) => handleCustomIntervalChange(fluid.id, Math.max(0, parseInt(e.target.value) || 0))}
                        className="w-16 bg-[#1A202C] border border-zinc-800 text-[10px] font-mono text-zinc-200 text-right px-1.5 py-0.5 rounded"
                      />
                      <span className="text-[8px] font-mono text-zinc-500">mi</span>
                    </div>
                  </div>
                )}

                {/* Primary Action Button: Log Changed */}
                <button
                  onClick={() => handleLogChange(fluid.id)}
                  className="w-full flex items-center justify-center gap-1.5 bg-[#1F2937] hover:bg-amber-500 text-[#94A3B8] hover:text-black hover:border-amber-500 text-[10px] font-bold uppercase tracking-widest py-2 rounded-xl border border-zinc-800 transition-all font-mono"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  Log Fluid Change Flushed
                </button>
              </div>

            </div>
          );
        })}
      </div>

      {/* Safety Advisories footer */}
      <div className="bg-[#151921] p-5 rounded-2xl border border-[#1E293B] space-y-3">
        <h3 className="text-xs font-bold uppercase tracking-wider text-amber-500 font-mono flex items-center gap-1.5">
          <Info className="w-4 h-4" /> Mechanic Safety Advisories
        </h3>
        <ul className="list-disc pl-5 text-xs text-zinc-400 space-y-1.5">
          <li><strong>NEVER</strong> loosen or remove the radiator cap or coolant fluid expansion lid while the engine temperature is hot. Hot pressurized coolant will flash boil instantly causing severe scalding accidents.</li>
          <li><strong>Brake Fluid Contamination Warning:</strong> Brake oil is hygroscopic (absorbs atmospheric moisture easily). Keep reservoir capped at all bounds. Absorbed water flash-boils into gas pockets under emergency braking blocks, causing dangerous soft pedals.</li>
          <li>Dispose of spent motor oil, transmission slurries, and battery cells strictly inside certified local auto collection facilities. Recycling safeguards municipal water tables.</li>
        </ul>
      </div>

    </div>
  );
}
