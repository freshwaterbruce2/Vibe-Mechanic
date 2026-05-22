import { useState, useEffect } from 'react';
import { Vehicle } from '../App';
import { 
  BookOpen, 
  HelpCircle, 
  Settings, 
  Wrench, 
  ShieldAlert, 
  CheckCircle, 
  Info, 
  Gauge, 
  Thermometer, 
  Zap, 
  RefreshCw, 
  AlertTriangle, 
  ChevronRight, 
  Compass, 
  FileText, 
  Activity, 
  Eye, 
  Flame 
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { motion, AnimatePresence } from 'framer-motion';

interface SpecsAndServiceProps {
  vehicle: Vehicle;
}

interface SpecData {
  oil_capacity: string;
  oil_type: string;
  spark_plug_gap: string;
  lug_nut_torque: string;
  coolant_type: string;
  transmission_fluid: string;
  brake_fluid: string;
  power_steering_fluid: string;
  tire_pressure_front_rear: string;
  belt_diagram_info: string;
  diy_safety_index: 'Green' | 'Amber' | 'Red' | string;
  expert_tips: string;
}

interface MaintenanceChecklistItem {
  item: string;
  action: string;
  criticality: 'Low' | 'Medium' | 'High';
  diy_difficulty: 'Easy' | 'Medium' | 'Hard';
  why_it_matters: string;
  estimated_diy_time: string;
}

interface MaintenanceData {
  mileage_selected: string;
  urgency: string;
  intro: string;
  checklist: MaintenanceChecklistItem[];
  overall_maintenance_summary: string;
}

const DASH_WARNINGS = [
  {
    title: 'Low Oil Pressure',
    symbol: '🛢️',
    color: 'text-red-500 border-red-500/30 bg-red-500/10',
    description: 'The engine lacks sufficient oil lubrication pressure. Under-lubrication can seize bearings and destroy cylinders within seconds.',
    remedy: 'Pull over safely IMMEDIATELY and shut off the engine. Do not restart. Check oil dipstick level. Add oil if critically low, otherwise call a tow truck.',
    urgency: 'CRITICAL - Stop immediately'
  },
  {
    title: 'Coolant Overheating',
    symbol: '🌡️',
    color: 'text-red-500 border-red-500/30 bg-red-500/10',
    description: 'Engine coolant has exceeded safe operating temperature (typically above 230°F / 110°C). Severe cylinder head cracking risk.',
    remedy: 'Safely pull over. Let engine idle for 2-3 minutes with cabin heater running at full blast, then shut off. NEVER open a hot radiator cap. Wait for 30 minutes before inspecting fluid line levels.',
    urgency: 'CRITICAL - Stop immediately'
  },
  {
    title: 'Battery / Charging Fault',
    symbol: '🔋',
    color: 'text-amber-500 border-amber-500/30 bg-amber-500/10',
    description: 'The alternator is not charging the vehicle battery, or system voltage is dropping below threshold. Car is running purely off battery reserves.',
    remedy: 'Turn off all unnecessary electrical power items (stereo, A/C, heated seats) immediately. Drive directly to a mechanic or auto shop to test your battery or alternator belt condition.',
    urgency: 'MODERATE - Repair within miles'
  },
  {
    title: 'Brake Warning Indicator',
    symbol: '🛑',
    color: 'text-red-500 border-red-500/30 bg-red-500/10',
    description: 'Brake fluid level is dangerously low inside the reservoir, or the parking brake is currently engaged, or there is an electronic brake bias failure.',
    remedy: 'Confirm complete disengagement of mechanical emergency brake. If light stays on, brake response can fail. Check brake reservoir fluid level safely. Tow if pedal is spongy.',
    urgency: 'CRITICAL - Stop immediately'
  },
  {
    title: 'TPMS Low Tire Pressure',
    symbol: '(!)️',
    color: 'text-amber-500 border-amber-500/30 bg-amber-500/10',
    description: 'One or more tires has dropped 25% or more below target manufacturer PSI. High tire blow-out hazard on highway.',
    remedy: 'Slow down. Check tire pressures with a portable mechanical gauge as soon as safe. Visually inspect for punctures, screws, or complete flats. Fill to door placard specifications.',
    urgency: 'RUTINE - Inspect soon'
  },
  {
    title: 'Check Engine (MIL)',
    symbol: '⚙️',
    color: 'text-amber-500 border-amber-500/30 bg-amber-500/10',
    description: 'The powertrain control module (PCM) detected a fault with emissions control or engine performance. Solid = Active DTC present. Flashing = Damaging Misfire.',
    remedy: 'A blinking light indicates a cylinder misfire that can melt catalytic converters - pull over and reduce speed. A solid light can be safely scanned at home using our OBD-II tool.',
    urgency: 'MODERATE - Diagnose code'
  }
];

const UNDER_HOOD_PARTS = [
  {
    id: 'dipstick',
    name: 'Engine Oil Dipstick',
    tag: 'Yellow / Orange Loop Handle',
    location: 'Near center of valve cover',
    howToCheck: 'With engine warm but shut off for 5 mins: Pull ring out, wipe completely clean with lint-free rag, insert fully, pull back out. Ensure level is squarely between the Lower (MIN) and Upper (MAX) marking dots. Never overfill.'
  },
  {
    id: 'coolant',
    name: 'Coolant Expansion Tank',
    tag: 'Translucent plastic bottle with Black/Yellow cap',
    location: 'Mounted near radiator side fender',
    howToCheck: 'Locate the Cold Fill markings on the side of the plastic tank. The level should be between MIN/HOT and MAX limits. NEVER open the pressurized radiator metal cap if the engine is hot; severe boiling steam burns can result.'
  },
  {
    id: 'brake_fluid',
    name: 'Brake Fluid Reservoir',
    tag: 'Translucent yellow-capped master cylinder',
    location: 'Directly in front of driver firewall',
    howToCheck: 'Examine liquid line from side of reservoir. Must sit safely near MAX line. If reservoir level is low, it indicates either worn brake linings (normal caliper extension) or a critical hydraulic line leak. Top off with matching DOT specification.'
  },
  {
    id: 'battery',
    name: '12V Battery Terminals',
    tag: 'Red (+) and Black (-) clamp posts',
    location: 'Engine corner or vehicle trunk area',
    howToCheck: 'Scan battery post clamps for green/white flake corrosion (lead sulfate). Sulfate scaling restricts high starters currents. Clean by disconnecting battery (Negative first) and scrubbing posts with baking soda + warm water paste.'
  },
  {
    id: 'fuse_box',
    name: 'Engine Fuse / Relay Block',
    tag: 'Black plastic rectangular box shell',
    location: 'Engine compartment margin',
    howToCheck: 'If multiple items fail simultaneously (e.g., both horn and headlights), unclip fuse box cover, review layout diagram on underside of cover, pull corresponding fuse with a puller clip, checking for broken connection wires.'
  }
];

export default function SpecsAndService({ vehicle }: SpecsAndServiceProps) {
  const [activeSubTab, setActiveSubTab] = useState<'specs' | 'maintenance' | 'visual'>('specs');
  
  // Specifications states
  const [specLoading, setSpecLoading] = useState(false);
  const [specs, setSpecs] = useState<SpecData | null>(null);
  const [specError, setSpecError] = useState<string | null>(null);

  // Maintenance states
  const [mileageInput, setMileageInput] = useState<string>('30000');
  const [maintenanceLoading, setMaintenanceLoading] = useState(false);
  const [maintData, setMaintData] = useState<MaintenanceData | null>(null);
  const [maintError, setMaintError] = useState<string | null>(null);
  const [checkedItems, setCheckedItems] = useState<Record<string, boolean>>({});

  // Visual state
  const [selectedHoodPart, setSelectedHoodPart] = useState<string>('dipstick');
  const [selectedWarning, setSelectedWarning] = useState<number | null>(null);

  const fetchSpecs = async () => {
    setSpecLoading(true);
    setSpecError(null);
    try {
      const res = await fetch('/api/specs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          year: vehicle.year,
          make: vehicle.make,
          model: vehicle.model,
          engine: vehicle.engine
        })
      });
      if (!res.ok) throw new Error('Failed to fetch specs.');
      const data = await res.json();
      setSpecs(data);
    } catch (err: any) {
      setSpecError(err.message || 'Error pulling diagnostic specifications.');
    } finally {
      setSpecLoading(false);
    }
  };

  const fetchMaintenance = async (mGroup?: string) => {
    const miles = mGroup || mileageInput;
    if (!miles) return;
    
    setMaintenanceLoading(true);
    setMaintError(null);
    setCheckedItems({});
    try {
      const res = await fetch('/api/maintenance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          year: vehicle.year,
          make: vehicle.make,
          model: vehicle.model,
          engine: vehicle.engine,
          mileage: miles
        })
      });
      if (!res.ok) throw new Error('Failed to retrieve maintenance schedule.');
      const data = await res.json();
      setMaintData(data);
    } catch (err: any) {
      setMaintError(err.message || 'Error loading intervals checklist.');
    } finally {
      setMaintenanceLoading(false);
    }
  };

  // Run automatically when the vehicle changes OR component mounts
  useEffect(() => {
    fetchSpecs();
    fetchMaintenance('30000');
  }, [vehicle.year, vehicle.make, vehicle.model]);

  // Calculations for maintenance progress
  const totalTasks = maintData?.checklist?.length || 0;
  const completedTasks = Object.values(checkedItems).filter(Boolean).length;
  const progressPercent = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  const toggleTask = (itemTitle: string) => {
    setCheckedItems(prev => ({
      ...prev,
      [itemTitle]: !prev[itemTitle]
    }));
  };

  // Safety Badge
  const getSafetyBadgeStyle = (index: string) => {
    if (index === 'Green') return 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400';
    if (index === 'Amber') return 'bg-amber-500/10 border-amber-500/30 text-amber-400';
    return 'bg-red-500/10 border-red-500/40 text-red-400 animate-pulse';
  };

  return (
    <div className="space-y-6">
      
      {/* Workshop Navigation Header */}
      <div className="bg-[#111622] rounded-2xl border-2 border-[#1E293B] p-2 flex gap-1 shadow-xl relative overflow-hidden">
        <button
          onClick={() => setActiveSubTab('specs')}
          className={`flex-1 flex items-center justify-center gap-2 py-3 px-1 sm:px-4 rounded-xl text-xs font-mono font-bold uppercase tracking-wider transition-all ${
            activeSubTab === 'specs' 
              ? 'bg-amber-500 text-black shadow-lg shadow-amber-500/15'
              : 'text-[#94A3B8] hover:bg-[#1E293B] hover:text-white'
          }`}
        >
          <BookOpen className="w-4 h-4 shrink-0" /> Fluids & Specs
        </button>
        <button
          onClick={() => setActiveSubTab('maintenance')}
          className={`flex-1 flex items-center justify-center gap-2 py-3 px-1 sm:px-4 rounded-xl text-xs font-mono font-bold uppercase tracking-wider transition-all ${
            activeSubTab === 'maintenance'
              ? 'bg-amber-500 text-black shadow-lg shadow-amber-500/15'
              : 'text-[#94A3B8] hover:bg-[#1E293B] hover:text-white'
          }`}
        >
          <Activity className="w-4 h-4 shrink-0" /> Service Calculator
        </button>
        <button
          onClick={() => setActiveSubTab('visual')}
          className={`flex-1 flex items-center justify-center gap-2 py-3 px-1 sm:px-4 rounded-xl text-xs font-mono font-bold uppercase tracking-wider transition-all ${
            activeSubTab === 'visual'
              ? 'bg-amber-500 text-black shadow-lg shadow-amber-500/15'
              : 'text-[#94A3B8] hover:bg-[#1E293B] hover:text-white'
          }`}
        >
          <Eye className="w-4 h-4 shrink-0" /> Visual Hood & Dash
        </button>
      </div>

      {/* SUB-TAB 1: FLUIDS, TORQUES & MECHANICAL SPECS */}
      <AnimatePresence mode="wait">
        {activeSubTab === 'specs' && (
          <motion.div
            key="specs"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-6"
          >
            {/* Master Spec Sheet Card */}
            <div className="bg-[#151921] border border-[#1E293B] rounded-2xl p-6 shadow-2xl relative">
              <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
                <Settings className="w-32 h-32 animate-spin-slow text-white" />
              </div>

              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-5 border-b border-[#334155]/40 mb-6">
                <div>
                  <h3 className="text-lg font-bold font-mono tracking-tight text-white uppercase flex items-center gap-2">
                    <BookOpen className="text-amber-500 w-5 h-5" /> Fluids & Capacities Database
                  </h3>
                  <p className="text-xs text-[#94A3B8]">
                    Verified technical specifications for DIY servicing, lug torque checks, and gap limits.
                  </p>
                </div>
                
                <button
                  type="button"
                  onClick={fetchSpecs}
                  disabled={specLoading}
                  className="bg-[#1E293B] hover:bg-[#334155] border border-[#475569] text-xs font-bold uppercase font-mono tracking-wider text-white py-2 px-4 rounded-xl transition-all flex items-center gap-1 w-full sm:w-auto justify-center"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${specLoading ? 'animate-spin text-amber-500' : ''}`} /> Update specs
                </button>
              </div>

              {specError && (
                <div className="mb-4 p-4 bg-red-500/10 border border-red-500/20 text-red-400 rounded-xl text-xs">
                  <p className="font-bold mb-1">Retrieval alert</p>
                  <p>{specError}</p>
                </div>
              )}

              {specLoading ? (
                <div className="flex flex-col items-center justify-center py-16 text-center space-y-4">
                  <Wrench className="w-12 h-12 text-amber-500 animate-spin" />
                  <div>
                    <p className="text-sm font-bold font-mono text-white uppercase tracking-wider">Parsing Spec Database...</p>
                    <p className="text-xs text-[#64748B] mt-1">Cross-referencing manufacturer guides & fluid charts</p>
                  </div>
                </div>
              ) : specs ? (
                <div className="space-y-6">
                  {/* Fluid specs Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    
                    {/* Engine Oil info */}
                    <div className="bg-[#0B0F19] p-4.5 rounded-xl border border-[#1E293B] flex flex-col justify-between">
                      <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-[#64748B]">Engine Lubrication</span>
                      <div className="mt-2.5">
                        <p className="text-amber-500 font-bold font-mono text-sm uppercase">{specs.oil_type}</p>
                        <p className="text-xs text-[#94A3B8] font-mono mt-0.5">{specs.oil_capacity}</p>
                      </div>
                    </div>

                    {/* Spark Plug & Gaps */}
                    <div className="bg-[#0B0F19] p-4.5 rounded-xl border border-[#1E293B] flex flex-col justify-between">
                      <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-[#64748B]">Ignition Parameters</span>
                      <div className="mt-2.5">
                        <p className="text-amber-500 font-bold font-mono text-sm uppercase">Gap: {specs.spark_plug_gap}</p>
                        <p className="text-xs text-[#94A3B8] mt-0.5">Plug thread gap clearance specification</p>
                      </div>
                    </div>

                    {/* Lug Nut Torque */}
                    <div className="bg-[#0B0F19] p-4.5 rounded-xl border border-[#1E293B] flex flex-col justify-between">
                      <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-[#64748B]">Wheel Torques</span>
                      <div className="mt-2.5">
                        <p className="text-amber-500 font-bold font-mono text-sm uppercase">{specs.lug_nut_torque}</p>
                        <p className="text-xs text-[#94A3B8] mt-0.5">Lug bolt target rating (Cold stud check)</p>
                      </div>
                    </div>

                    {/* Tire Pressures */}
                    <div className="bg-[#0B0F19] p-4.5 rounded-xl border border-[#1E293B] flex flex-col justify-between">
                      <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-[#64748B]">Tire Operating PSI</span>
                      <div className="mt-2.5">
                        <p className="text-amber-500 font-bold font-mono text-sm uppercase">{specs.tire_pressure_front_rear}</p>
                        <p className="text-xs text-[#94A3B8] mt-0.5">Correct cold inflation benchmark values</p>
                      </div>
                    </div>

                    {/* Coolant parameters */}
                    <div className="bg-[#0B0F19] p-4.5 rounded-xl border border-[#1E293B] flex flex-col justify-between">
                      <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-[#64748B]">Cooling & Radiation</span>
                      <div className="mt-2.5">
                        <p className="text-[#CBD5E1] font-bold text-xs">{specs.coolant_type}</p>
                        <p className="text-[10px] text-[#64748B] font-mono mt-1">Chemical index type formulation</p>
                      </div>
                    </div>

                    {/* Brake fluid */}
                    <div className="bg-[#0B0F19] p-4.5 rounded-xl border border-[#1E293B] flex flex-col justify-between">
                      <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-[#64748B]">Hydraulic Brake Fluid</span>
                      <div className="mt-2.5">
                        <p className="text-[#CBD5E1] font-bold text-xs">{specs.brake_fluid}</p>
                        <p className="text-[10px] text-[#64748B] font-mono mt-1">Glycol-based standard hydraulic fluid</p>
                      </div>
                    </div>

                    {/* Transmission fluid */}
                    <div className="bg-[#0B0F19] p-4.5 rounded-xl border border-[#1E293B] flex flex-col justify-between">
                      <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-[#64748B]">Gearbox & Transmission</span>
                      <div className="mt-2.5">
                        <p className="text-[#CBD5E1] font-bold text-xs truncate" title={specs.transmission_fluid}>{specs.transmission_fluid}</p>
                        <p className="text-[10px] text-[#64748B] font-mono mt-1">Sump exchange capacity</p>
                      </div>
                    </div>

                    {/* Steering fluid */}
                    <div className="bg-[#0B0F19] p-4.5 rounded-xl border border-[#1E293B] flex flex-col justify-between">
                      <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-[#64748B]">Steering Assistance</span>
                      <div className="mt-2.5">
                        <p className="text-[#CBD5E1] font-bold text-xs">{specs.power_steering_fluid || 'N/A'}</p>
                        <p className="text-[10px] text-[#64748B] font-mono mt-1">Type formulation</p>
                      </div>
                    </div>

                  </div>

                  {/* Serpentine belt and Safety Index cards */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="md:col-span-2 bg-[#111520] p-4 rounded-xl border border-[#1E293B]">
                      <h4 className="text-xs font-mono font-bold text-amber-500 uppercase tracking-widest mb-2 flex items-center gap-1.5ClassName mb-2">
                        Serpentine Belt & Accessory Tension Guide
                      </h4>
                      <div className="text-xs text-[#CBD5E1] leading-relaxed prose prose-invert max-w-none text-content font-mono italic-code">
                        <ReactMarkdown>{specs.belt_diagram_info}</ReactMarkdown>
                      </div>
                    </div>

                    <div className={`p-4 rounded-xl border flex flex-col justify-between ${getSafetyBadgeStyle(specs.diy_safety_index)}`}>
                      <div>
                        <span className="text-[10px] font-mono font-bold uppercase tracking-widest opacity-60">DIY Safety Hazard Score</span>
                        <h4 className="text-xl font-bold font-mono mt-2 tracking-wide uppercase">{specs.diy_safety_index} Grade</h4>
                        <p className="text-xs mt-2 leading-relaxed opacity-95">
                          {specs.diy_safety_index === 'Green' ? 'Highly recommended for beginner home repairists. High safety margin.' : 
                           specs.diy_safety_index === 'Amber' ? 'Requires proper car support tooling (axle stands, wheel blocks, socket drivers). Use eye shielding.' : 
                           'High voltage hybrid wiring risk or advanced specialized torque machinery. Expert precautions required.'}
                        </p>
                      </div>
                      <span className="text-[10px] font-mono font-bold uppercase mt-2 tracking-widest opacity-40">Vibe Mechanics safety scale</span>
                    </div>
                  </div>

                  {/* Expert Advice Bulletins */}
                  <div className="bg-[#111520] p-5 rounded-xl border border-dashed border-[#334155] text-xs leading-relaxed text-[#CBD5E1]">
                    <h4 className="text-xs font-mono font-bold text-amber-500 uppercase tracking-widest mb-2 flex items-center gap-1.5">
                      <ShieldAlert className="w-4 h-4 text-amber-500 shrink-0" /> Technical Advisory Bulletins
                    </h4>
                    <div className="prose prose-invert max-w-none text-xs text-[#CBD5E1] prose-p:leading-relaxed">
                      <ReactMarkdown>{specs.expert_tips}</ReactMarkdown>
                    </div>
                  </div>

                </div>
              ) : (
                <div className="text-center py-6 text-xs text-[#64748B]">
                  No active specification profiles loaded yet. Enter your vehicle and click Update.
                </div>
              )}
            </div>
          </motion.div>
        )}

        {/* SUB-TAB 2: MILEAGE INTERVAL ESTIMATOR & SERVICE CALCULATOR */}
        {activeSubTab === 'maintenance' && (
          <motion.div
            key="maintenance"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-6"
          >
            {/* Input Selection Center */}
            <div className="bg-[#151921] border border-[#1E293B] rounded-2xl p-6 shadow-xl">
              <h3 className="text-lg font-bold font-mono tracking-tight text-white uppercase flex items-center gap-2 mb-2">
                <Activity className="text-amber-500 w-5 h-5 animate-pulse" /> Maintenance Interval Service Calculator
              </h3>
              <p className="text-xs text-[#94A3B8] mb-4">
                Calculate necessary vehicle inspections and preventive filter exchanges based on your exact odometer mileage.
              </p>

              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                <div className="flex-1 relative">
                  <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-xs font-mono text-[#64748B] font-bold">
                    ODOMETER MILES:
                  </span>
                  <input
                    type="number"
                    value={mileageInput}
                    onChange={(e) => setMileageInput(e.target.value)}
                    placeholder="e.g., 60000"
                    className="w-full bg-[#1A202C] border-2 border-[#334155] focus:border-amber-500 rounded-xl py-3 pl-32 pr-4 text-white font-mono text-sm uppercase outline-none transition-all placeholder-[#475569]"
                  />
                </div>
                
                <button
                  type="button"
                  onClick={() => fetchMaintenance()}
                  disabled={maintenanceLoading || !mileageInput}
                  className="bg-amber-500 hover:bg-amber-600 active:scale-95 text-black font-bold px-6 py-3 rounded-xl transition-all flex items-center justify-center gap-1.5 text-xs uppercase tracking-wider disabled:opacity-40 shrink-0 font-mono"
                >
                  {maintenanceLoading ? 'Recalculating...' : 'Calculate schedule'}
                </button>
              </div>

              {/* Standard interval shortcuts */}
              <div className="mt-4 flex flex-wrap gap-2 items-center">
                <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-[#64748B]">Quick Milestones:</span>
                {['15000', '30000', '60000', '100000', '120000'].map((mi) => (
                  <button
                    key={mi}
                    type="button"
                    onClick={() => {
                      setMileageInput(mi);
                      fetchMaintenance(mi);
                    }}
                    className={`text-xs py-1.5 px-3 rounded-lg border font-mono transition-colors ${
                      mileageInput === mi
                        ? 'bg-amber-500/10 border-amber-500 text-amber-500 font-bold'
                        : 'bg-[#1E293B] border-[#334155] text-[#94A3B8] hover:text-white'
                    }`}
                  >
                    {parseInt(mi).toLocaleString()} mi
                  </button>
                ))}
              </div>
            </div>

            {maintError && (
              <div className="p-4 bg-red-500/10 border border-red-500/20 text-red-400 rounded-xl text-xs">
                {maintError}
              </div>
            )}

            {maintenanceLoading ? (
              <div className="bg-[#151921] border border-[#1E293B] rounded-2xl p-16 text-center space-y-4">
                <Wrench className="w-12 h-12 text-amber-500 animate-spin mx-auto" />
                <div>
                  <h4 className="text-sm font-bold font-mono text-white uppercase tracking-wider">Compiling Maintenance Matrix...</h4>
                  <p className="text-xs text-[#64748B] mt-1">Simulating lifespan strain curves for this specific mileage range</p>
                </div>
              </div>
            ) : maintData ? (
              <div className="space-y-6">
                
                {/* Odometer Profile Summary Block */}
                <div className="bg-[#151921] border border-[#1E293B] rounded-2xl p-6 shadow-xl relative overflow-hidden">
                  <div className="absolute top-0 left-0 w-2.5 h-full bg-amber-500" />
                  <div className="pl-2 gap-4 flex flex-col md:flex-row md:items-center justify-between">
                    <div>
                      <span className="bg-[#0B0F19] text-amber-500 text-xs font-mono font-extrabold px-3 py-1 rounded border border-[#334155] inline-block tracking-widest uppercase mb-1.5">
                        Interval Target: {parseInt(maintData.mileage_selected || '0').toLocaleString()} Miles
                      </span>
                      <h4 className="text-[#E2E8F0] font-bold text-lg font-mono tracking-tight capitalize mt-1.5">{maintData.urgency || 'Preventive Check'}</h4>
                      <p className="text-xs text-[#94A3B8] leading-relaxed mt-1 max-w-xl">{maintData.intro}</p>
                    </div>

                    {/* Interactive Completion Ring indicator */}
                    <div className="bg-[#0B0F19] border border-[#1E293B] p-4 rounded-xl flex items-center gap-4.5 min-w-[180px]">
                      <div className="relative w-12 h-12 flex items-center justify-center shrink-0">
                        {/* Circular progress bar matching background canvas */}
                        <svg className="w-12 h-12 transform -rotate-90">
                          <circle cx="24" cy="24" r="20" stroke="#1E293B" strokeWidth="4" fill="transparent" />
                          <circle cx="24" cy="24" r="20" stroke="#F59E0B" strokeWidth="4" fill="transparent"
                            strokeDasharray={2 * Math.PI * 20}
                            strokeDashoffset={2 * Math.PI * 20 * (1 - progressPercent / 100)}
                            className="transition-all duration-300"
                          />
                        </svg>
                        <span className="absolute text-[10px] font-mono font-bold text-white justify-center flex">{progressPercent}%</span>
                      </div>
                      <div>
                        <p className="text-[10px] font-mono font-bold text-[#64748B] uppercase tracking-wider">Milestone Checklist</p>
                        <p className="text-xs text-white font-semibold font-mono mt-1">{completedTasks} of {totalTasks} Complete</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Checklist Section */}
                <div className="bg-[#151921] border border-[#1E293B] p-6 rounded-2xl shadow-xl space-y-3">
                  <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-[#94A3B8] mb-4">Inspection checkpoints list:</h4>
                  
                  {maintData.checklist?.map((task, index) => {
                    const isChecked = checkedItems[task.item] || false;
                    return (
                      <div 
                        key={index}
                        onClick={() => toggleTask(task.item)}
                        className={`group p-4 rounded-xl border-2 transition-all cursor-pointer flex items-start gap-4 ${
                          isChecked 
                            ? 'bg-emerald-500/5 border-emerald-500/35 text-[#94A3B8]' 
                            : 'bg-[#0B0F19] border-[#1E293B] text-white hover:border-[#334155]'
                        }`}
                      >
                        {/* Status Checkbox */}
                        <div className={`w-5.5 h-5.5 rounded-md border-2 shrink-0 flex items-center justify-center mt-1 transition-all ${
                          isChecked 
                            ? 'bg-emerald-500 border-emerald-500 text-black' 
                            : 'border-[#475569] bg-[#111622] group-hover:border-amber-500/50'
                        }`}>
                          {isChecked && <CheckCircle className="w-4 h-4" />}
                        </div>

                        {/* Text values */}
                        <div className="flex-1 space-y-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className={`text-xs font-bold font-mono uppercase tracking-wide ${isChecked ? 'line-through text-[#64748B]' : 'text-[#E2E8F0]'}`}>
                              {task.item}
                            </span>
                            
                            {/* Tags */}
                            <div className="flex flex-wrap gap-1 items-center">
                              <span className="bg-[#1E293B] border border-[#334155] text-[#94A3B8] text-[9px] font-mono font-bold uppercase px-1.5 py-0.5 rounded">
                                {task.action}
                              </span>
                              <span className={`text-[9px] font-mono font-bold uppercase px-1.5 py-0.5 rounded ${
                                task.criticality === 'High' ? 'bg-red-500/10 text-red-400 border border-red-500/15' :
                                task.criticality === 'Medium' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/15' :
                                'bg-blue-500/10 text-blue-400 border border-blue-500/15'
                              }`}>
                                {task.criticality} Level
                              </span>
                              <span className="bg-[#1A202C] text-[#CBD5E1] text-[9px] font-mono px-1.5 py-0.5 rounded">
                                DIY Cost: {task.estimated_diy_time}
                              </span>
                            </div>
                          </div>

                          <p className={`text-xs leading-relaxed ${isChecked ? 'text-[#475569]' : 'text-[#94A3B8]'}`}>
                            {task.why_it_matters}
                          </p>
                        </div>
                      </div>
                    );
                  })}

                  <p className="text-[10px] font-mono text-[#64748B] text-center pt-2 italic">
                    Tip: Click individual items to mark checkpoints finished and increment status progress.
                  </p>
                </div>

                {/* Overall Maintenance Summary Advice Text */}
                <div className="bg-[#111520] p-6 rounded-2xl border border-dashed border-[#334155] text-[#CBD5E1] text-xs">
                  <h4 className="text-xs font-mono font-bold text-amber-500 uppercase tracking-widest mb-2 flex items-center gap-1.5">
                    <Info className="w-4.5 h-4.5 text-amber-500 shrink-0" /> Service Advisory Guidelines
                  </h4>
                  <div className="prose prose-invert max-w-none text-xs leading-relaxed prose-p:leading-relaxed text-[#CBD5E1]">
                    <ReactMarkdown>{maintData.overall_maintenance_summary}</ReactMarkdown>
                  </div>
                </div>

              </div>
            ) : (
              <div className="bg-[#151921] text-center py-6 text-xs text-[#64748B] rounded-xl border border-[#1E293B]">
                Specify mileage and select target.
              </div>
            )}
          </motion.div>
        )}

        {/* SUB-TAB 3: INTERACTIVE UNDER THE HOOD BLUEPRINT & ALERT SYMBOLS DECODER */}
        {activeSubTab === 'visual' && (
          <motion.div
            key="visual"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-6"
          >
            {/* Interactive Engine blueprint locator sheet */}
            <div className="bg-[#151921] border border-[#1E293B] rounded-2xl p-6 shadow-xl">
              <h3 className="text-lg font-bold font-mono tracking-tight text-white uppercase flex items-center gap-2 mb-1">
                <Compass className="text-amber-500 w-5 h-5" /> Under-the-Hood Essential Checklist Guide
              </h3>
              <p className="text-xs text-[#94A3B8] mb-6">
                Click major components to inspect visual check intervals, dipstick color readings, and emergency warnings.
              </p>

              <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
                
                {/* Simulated visual layout (Engine Compartment Wireframe Grid list) */}
                <div className="lg:col-span-2 space-y-2">
                  <p className="text-[9px] font-mono font-bold uppercase tracking-widest text-[#64748B] block mb-2">Engine compartment map nodes:</p>
                  
                  {UNDER_HOOD_PARTS.map((part) => (
                    <button
                      key={part.id}
                      type="button"
                      onClick={() => setSelectedHoodPart(part.id)}
                      className={`w-full text-left p-3.5 rounded-xl border font-mono transition-colors flex items-center justify-between group ${
                        selectedHoodPart === part.id
                          ? 'bg-amber-500 text-black border-amber-500'
                          : 'bg-[#0B0F19] border-[#1E293B] text-white hover:border-[#334155]'
                      }`}
                    >
                      <div>
                        <span className="text-[10px] font-bold block uppercase tracking-wider">{part.name}</span>
                        <span className={`text-[9px] block mt-0.5 ${selectedHoodPart === part.id ? 'text-black/80' : 'text-[#64748B]'}`}>{part.tag}</span>
                      </div>
                      <ChevronRight className={`w-4 h-4 transition-transform group-hover:translate-x-0.5 ${selectedHoodPart === part.id ? 'text-black' : 'text-[#64748B]'}`} />
                    </button>
                  ))}
                </div>

                {/* Locator detail display pane */}
                <div className="lg:col-span-3 bg-[#0B0F19] border border-[#1E293B] p-5 rounded-xl flex flex-col justify-between min-h-[250px] relative">
                  <div>
                    <span className="text-[9px] font-mono font-bold text-amber-500 uppercase tracking-widest block mb-2">Selected inspection node details:</span>
                    
                    {(() => {
                      const activePart = UNDER_HOOD_PARTS.find(p => p.id === selectedHoodPart);
                      if (!activePart) return null;
                      return (
                        <div className="space-y-4">
                          <div>
                            <h4 className="text-white text-base font-bold font-mono tracking-tight">{activePart.name}</h4>
                            <span className="text-[10px] font-mono text-amber-500 font-bold block mt-1 uppercase">Mount Location: {activePart.location}</span>
                          </div>

                          <div className="bg-[#111622] p-4 rounded-lg border border-[#334155]/65">
                            <h5 className="text-[11px] font-semibold text-[#CBD5E1] uppercase font-mono tracking-wider mb-1.5 flex items-center gap-1.5">
                              <Wrench className="w-3.5 h-3.5 text-[#64748B]" /> Inspection walkthrough steps:
                            </h5>
                            <p className="text-xs text-[#94A3B8] leading-relaxed italic pr-1">
                              {activePart.howToCheck}
                            </p>
                          </div>
                        </div>
                      );
                    })()}
                  </div>

                  <div className="mt-5 border-t border-[#1E293B] pt-4 flex items-center gap-2 text-[10px] font-mono text-[#64748B]">
                    <AlertTriangle className="w-4 h-4 text-amber-500/80" /> Always wait for engine block temperatures to drop to a safe level before checking.
                  </div>
                </div>

              </div>
            </div>

            {/* Warning indicator alert symbols decoder */}
            <div className="bg-[#151921] border border-[#1E293B] p-6 rounded-2xl shadow-xl">
              <h3 className="text-lg font-bold font-mono tracking-tight text-white uppercase flex items-center gap-2 mb-1.5">
                <Flame className="text-amber-500 w-5 h-5 shrink-0" /> Dashboard Instruments Indicator Codebook
              </h3>
              <p className="text-xs text-[#94A3B8] mb-5">
                Quick decoders for dashboard warnings. Select a system to load emergency countermeasures.
              </p>

              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 mb-6">
                {DASH_WARNINGS.map((warning, wIdx) => (
                  <button
                    key={wIdx}
                    type="button"
                    onClick={() => setSelectedWarning(wIdx)}
                    className={`p-4 rounded-xl border flex flex-col items-center justify-center text-center cursor-pointer transition-all ${
                      selectedWarning === wIdx
                        ? 'border-amber-500 bg-amber-500/10 scale-[1.03] shadow-lg shadow-amber-500/5'
                        : 'border-[#1E293B] bg-[#0B0F19] hover:border-[#334155]'
                    }`}
                  >
                    <span className="text-2xl mb-1.5">{warning.symbol}</span>
                    <span className="text-[10px] font-mono font-bold text-[#E2E8F0] uppercase tracking-wide leading-tight mt-1">{warning.title}</span>
                  </button>
                ))}
              </div>

              {/* Action output card for warning lights */}
              {selectedWarning !== null ? (
                <div className="bg-[#0B0F19] border border-2 border-[#1E293B] p-5 rounded-2xl flex flex-col md:flex-row md:items-start justify-between gap-5 transition-all">
                  <div className="space-y-3.5">
                    <div className="flex items-center gap-3">
                      <span className="text-3xl">{DASH_WARNINGS[selectedWarning].symbol}</span>
                      <div>
                        <h4 className="text-white font-mono font-bold text-base tracking-wide uppercase">{DASH_WARNINGS[selectedWarning].title}</h4>
                        <span className="text-[9px] font-mono font-bold uppercase text-red-400 bg-red-400/10 px-2 py-0.5 rounded border border-red-400/15 inline-block mt-0.5 tracking-widest">{DASH_WARNINGS[selectedWarning].urgency}</span>
                      </div>
                    </div>

                    <div className="space-y-1.5 pr-2">
                      <p className="text-xs text-[#94A3B8] leading-relaxed"><span className="text-[#E2E8F0] font-sans font-bold">What is it:</span> {DASH_WARNINGS[selectedWarning].description}</p>
                      
                      <div className="bg-[#111622] p-4 rounded-xl border border-[#334155]/60 text-xs mt-3">
                        <p className="font-bold text-amber-500 font-mono text-[11px] uppercase tracking-wide mb-1 flex items-center gap-1">
                          <AlertTriangle className="w-3.5 h-3.5" /> Immediately Actionable Remedy:
                        </p>
                        <p className="text-white leading-relaxed font-mono font-medium mt-1">
                          {DASH_WARNINGS[selectedWarning].remedy}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center p-8 bg-[#0B0F19] rounded-xl border border-[#1E293B]/70 text-xs font-mono text-[#64748B]">
                  📋 Click any sensor symbols above to display actionable roadside safety guidelines.
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
