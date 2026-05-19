import { Vehicle } from '../App';

export type SavedVehicle = Vehicle & { id: string };

const STORAGE_KEY = 'pocket_mechanic_vehicles';

export function getSavedVehicles(): SavedVehicle[] {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  } catch (e) {
    return [];
  }
}

export function saveVehicle(vehicle: Vehicle): SavedVehicle {
  const current = getSavedVehicles();
  const newVehicle: SavedVehicle = {
    ...vehicle,
    id: Math.random().toString(36).substring(2, 9),
  };
  localStorage.setItem(STORAGE_KEY, JSON.stringify([newVehicle, ...current]));
  return newVehicle;
}

export function deleteVehicle(id: string) {
  const current = getSavedVehicles();
  localStorage.setItem(STORAGE_KEY, JSON.stringify(current.filter(v => v.id !== id)));
}
