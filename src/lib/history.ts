import { Vehicle } from '../App';

export type DiagnosticHistory = {
  id: string;
  date: string;
  vehicle: Vehicle;
  type: 'diagnostic' | 'vision';
  query: string;
  result: string;
  queries: string[];
};

const STORAGE_KEY = 'pocket_mechanic_history';

export function getHistory(): DiagnosticHistory[] {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  } catch (e) {
    return [];
  }
}

export function saveHistory(entry: Omit<DiagnosticHistory, 'id' | 'date'>) {
  try {
    const current = getHistory();
    const newEntry: DiagnosticHistory = {
      ...entry,
      id: Math.random().toString(36).substring(2, 9),
      date: new Date().toISOString(),
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify([newEntry, ...current]));
  } catch (e) {
    console.error("Failed to save history", e);
  }
}
