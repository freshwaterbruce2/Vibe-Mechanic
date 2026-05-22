import { useState, useEffect } from 'react';
import { Vehicle } from '../App';
import { Car, AlertCircle, Plus, Trash2, CheckCircle2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { getSavedVehicles, saveVehicle, SavedVehicle, deleteVehicle } from '../lib/vehicles';
import AppCustomizer from './AppCustomizer';

interface VehicleSelectorProps {
  vehicle: Vehicle;
  setVehicle: (vehicle: Vehicle) => void;
  onNavigate: () => void;
}

const CURRENT_YEAR = new Date().getFullYear();
const YEARS = Array.from({ length: 40 }, (_, i) => String(CURRENT_YEAR - i));

// Basic common makes for the dropdown
const MAKES = [
  "Acura", "Audi", "BMW", "Chevrolet", "Chrysler", "Dodge", "Ford",
  "GMC", "Honda", "Hyundai", "Jeep", "Kia", "Lexus", "Mazda",
  "Mercedes-Benz", "Nissan", "Subaru", "Toyota", "Volkswagen", "Volvo"
];

export default function VehicleSelector({ vehicle, setVehicle, onNavigate }: VehicleSelectorProps) {

  const [savedVehicles, setSavedVehicles] = useState<SavedVehicle[]>([]);
  const [isAddingNew, setIsAddingNew] = useState(false);

  useEffect(() => {
    const loaded = getSavedVehicles();
    setSavedVehicles(loaded);
    if (loaded.length === 0) {
      setIsAddingNew(true);
    }
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement | HTMLInputElement>) => {
    setVehicle({ ...vehicle, [e.target.name]: e.target.value });
  };

  const isComplete = vehicle.year && vehicle.make && vehicle.model;

  const handleSaveNewAndContinue = () => {
    saveVehicle(vehicle);
    setSavedVehicles(getSavedVehicles());
    setIsAddingNew(false);
    onNavigate();
  };

  const handleSelectSaved = (v: SavedVehicle) => {
    setVehicle({ year: v.year, make: v.make, model: v.model, engine: v.engine });
    onNavigate();
  };

  const handleDelete = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    deleteVehicle(id);
    const updated = getSavedVehicles();
    setSavedVehicles(updated);
    if (updated.length === 0) setIsAddingNew(true);
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-xl mx-auto space-y-6"
    >
      <div className="bg-[#151921] p-6 rounded-2xl shadow-xl border border-[#1E293B]">
        <div className="flex items-center justify-between mb-6 border-b border-[#334155] pb-4">
          <div className="flex items-center gap-3">
            <div className="bg-[#1E293B] p-2.5 rounded-full text-[#94A3B8]">
              <Car className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-[#F59E0B]">Virtual Garage</h2>
              <p className="text-sm text-[#94A3B8]">{isAddingNew ? "Add a new vehicle to your garage." : "Select a vehicle to continue."}</p>
            </div>
          </div>
          {!isAddingNew && savedVehicles.length > 0 && (
            <button 
              onClick={() => setIsAddingNew(true)}
              className="flex items-center gap-1.5 bg-[#1E293B] hover:bg-[#334155] text-white text-xs font-bold uppercase tracking-wider py-2 px-3 rounded-lg transition-colors border border-[#475569]"
            >
              <Plus className="w-4 h-4" /> Add New
            </button>
          )}
        </div>

        {!isAddingNew && savedVehicles.length > 0 && (
          <div className="space-y-4">
            {savedVehicles.map(v => (
              <div 
                key={v.id} 
                onClick={() => handleSelectSaved(v)}
                className="bg-[#1A202C] hover:bg-[#1E293B] border border-[#334155] hover:border-[#F59E0B] p-4 rounded-xl cursor-pointer transition-all flex items-center justify-between group"
              >
                <div>
                  <h3 className="text-lg font-bold text-[#E2E8F0] group-hover:text-white flex items-center gap-2">
                    {vehicle.year === v.year && vehicle.make === v.make && vehicle.model === v.model && <CheckCircle2 className="w-4 h-4 text-green-500" />}
                    {v.year} {v.make} {v.model}
                  </h3>
                  {v.engine && <p className="text-sm text-[#94A3B8] mt-1">{v.engine}</p>}
                </div>
                <button 
                  onClick={(e) => handleDelete(e, v.id)}
                  className="p-2 text-[#64748B] hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-colors"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
              </div>
            ))}
          </div>
        )}

        {isAddingNew && (
          <div className="space-y-5 animate-in fade-in slide-in-from-top-4 duration-300">
            {savedVehicles.length > 0 && (
              <button 
                onClick={() => setIsAddingNew(false)}
                className="text-xs text-[#94A3B8] hover:text-white uppercase tracking-wider font-bold mb-4 flex items-center gap-1"
              >
                &larr; Back to Garage
              </button>
            )}
            <div>
              <label htmlFor="year" className="block text-sm font-bold text-[#E2E8F0] mb-1.5 uppercase tracking-wider text-[10px]">Year</label>
              <select
                id="year"
                name="year"
                value={vehicle.year}
                onChange={handleChange}
                className="w-full bg-[#1A202C] border border-[#334155] text-white text-sm rounded-xl focus:ring-[#F59E0B] focus:border-[#F59E0B] p-3 outline-none transition-colors"
              >
                <option value="">Select Year...</option>
                {YEARS.map(y => <option key={y} value={y}>{y}</option>)}
              </select>
            </div>

            <div>
              <label htmlFor="make" className="block text-sm font-bold text-[#E2E8F0] mb-1.5 uppercase tracking-wider text-[10px]">Make</label>
              <select
                id="make"
                name="make"
                value={vehicle.make}
                onChange={handleChange}
                className="w-full bg-[#1A202C] border border-[#334155] text-white text-sm rounded-xl focus:ring-[#F59E0B] focus:border-[#F59E0B] p-3 outline-none transition-colors"
              >
                <option value="">Select Make...</option>
                {MAKES.map(m => <option key={m} value={m}>{m}</option>)}
                <option value="Other">Other...</option>
              </select>
              {vehicle.make === 'Other' && (
                <input 
                  type="text" 
                  name="make" 
                  placeholder="Enter custom make"
                  className="mt-2 w-full bg-[#1A202C] border border-[#334155] text-white text-sm rounded-xl focus:ring-[#F59E0B] focus:border-[#F59E0B] p-3 outline-none transition-colors"
                  onChange={handleChange} 
                />
              )}
            </div>

            <div>
              <label htmlFor="model" className="block text-sm font-bold text-[#E2E8F0] mb-1.5 uppercase tracking-wider text-[10px]">Model</label>
              <input
                type="text"
                id="model"
                name="model"
                placeholder="e.g. Camry, F-150, Civic"
                value={vehicle.model}
                onChange={handleChange}
                className="w-full bg-[#1A202C] border border-[#334155] text-white text-sm rounded-xl focus:ring-[#F59E0B] focus:border-[#F59E0B] p-3 outline-none transition-colors"
              />
            </div>

            <div>
              <label htmlFor="engine" className="block text-sm font-bold text-[#E2E8F0] mb-1.5 uppercase tracking-wider text-[10px]">Engine Size / Trim (Optional)</label>
              <input
                type="text"
                id="engine"
                name="engine"
                placeholder="e.g. 2.0L, V6, XLE, Lariat"
                value={vehicle.engine || ''}
                onChange={handleChange}
                className="w-full bg-[#1A202C] border border-[#334155] text-white text-sm rounded-xl focus:ring-[#F59E0B] focus:border-[#F59E0B] p-3 outline-none transition-colors"
              />
            </div>
            
            <div className="mt-8">
              <button
                onClick={handleSaveNewAndContinue}
                disabled={!isComplete}
                className="w-full flex items-center justify-center gap-2 bg-[#F59E0B] hover:bg-[#D97706] disabled:opacity-50 disabled:hover:bg-[#F59E0B] text-black font-bold uppercase tracking-widest text-xs py-3.5 px-6 rounded-xl transition-all shadow-lg shadow-[#F59E0B]/20"
              >
                Save to Garage & Continue
              </button>
              {!isComplete && (
                <p className="text-center text-xs text-[#64748B] flex items-center justify-center gap-1 mt-4">
                  <AlertCircle className="w-3.5 h-3.5" /> Please complete all fields to continue
                </p>
              )}
            </div>
          </div>
        )}

      </div>
      
      <AppCustomizer />
    </motion.div>
  );
}
