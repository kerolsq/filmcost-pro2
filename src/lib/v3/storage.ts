import type { Machine, Material, Recipe, ProductionRun, CalibrationResult } from './calculations';

const K = {
  machines: 'fc_v3_machines',
  materials: 'fc_v3_materials',
  recipes: 'fc_v3_recipes',
  runs: 'fc_v3_runs',
  calibrations: 'fc_v3_calibrations',
  activeMachine: 'fc_v3_active_machine',
  onboarding: 'fc_v3_onboarding',
};

function get<T>(key: string, fallback: T): T {
  try {
    const d = localStorage.getItem(key);
    return d ? JSON.parse(d) : fallback;
  } catch { return fallback; }
}
function set(key: string, val: unknown) {
  localStorage.setItem(key, JSON.stringify(val));
}

export const getMachines = (): Machine[] => get(K.machines, []);
export const saveMachines = (v: Machine[]) => set(K.machines, v);
export const getActiveMachineId = (): string | null => localStorage.getItem(K.activeMachine);
export const setActiveMachineId = (id: string) => localStorage.setItem(K.activeMachine, id);

export const getMaterials = (): Material[] => get(K.materials, []);
export const saveMaterials = (v: Material[]) => set(K.materials, v);

export const getRecipes = (): Recipe[] => get(K.recipes, []);
export const saveRecipes = (v: Recipe[]) => set(K.recipes, v);

export const getRuns = (): ProductionRun[] => get(K.runs, []);
export const saveRun = (run: ProductionRun) => {
  const runs = getRuns();
  const i = runs.findIndex(r => r.id === run.id);
  if (i >= 0) runs[i] = run; else runs.unshift(run);
  if (runs.length > 500) runs.pop();
  set(K.runs, runs);
};

export const getCalibrations = (): CalibrationResult[] => get(K.calibrations, []);
export const getCalibration = (machineId: string) =>
  getCalibrations().find(c => c.machineId === machineId);
export const saveCalibration = (cal: CalibrationResult) => {
  const cals = getCalibrations();
  const i = cals.findIndex(c => c.machineId === cal.machineId);
  if (i >= 0) cals[i] = cal; else cals.push(cal);
  set(K.calibrations, cals);
};

export const isOnboardingDone = () => localStorage.getItem(K.onboarding) === 'true';
export const markOnboardingDone = () => localStorage.setItem(K.onboarding, 'true');

export function initStorage() {
  if (getMachines().length > 0) return;
  saveMachines([{
    id: 'machine_default',
    name: 'ماكينة 1',
    brand: 'YE',
    model: 'ABA 55/45',
    type: 'ABA',
    screwA_mm: 45,
    screwB_mm: 55,
    dieWidth_mm: 600,
  }]);
  setActiveMachineId('machine_default');
  saveMaterials([
    { id: 'm1', name: 'سابك', nameEn: 'SABIC PE', category: 'LDPE', pricePerKg: 102 },
    { id: 'm2', name: 'مخرز', nameEn: 'Recycled PE', category: 'Recycle', pricePerKg: 65 },
    { id: 'm3', name: 'لو', nameEn: 'LDPE Low', category: 'LDPE', pricePerKg: 95 },
    { id: 'm4', name: 'لينير', nameEn: 'LLDPE', category: 'LLDPE', pricePerKg: 110 },
    { id: 'm5', name: 'أوميا', nameEn: 'Omya CaCO3', category: 'CaCO3', pricePerKg: 23 },
    { id: 'm6', name: 'صبغة سوداء', nameEn: 'Black MB', category: 'Masterbatch', pricePerKg: 140 },
  ]);
}
