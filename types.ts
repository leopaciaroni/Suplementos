
export enum CategoryId {
  REJUVENATION = 'rejuvenecimiento',
  HORMONAL_MEN = 'hormonales-hombres',
  HORMONAL_WOMEN = 'hormonales-mujeres',
  ANTIOXIDANTS = 'antioxidantes',
  NOOTROPICS = 'nootropicos',
  PHYSICAL_PERFORMANCE = 'desempeno-fisico',
  IMMUNITY = 'inmunidad',
  METABOLISM = 'metabolismo'
}

export interface Supplement {
  id: string;
  name: string;
  description: string;
  category: CategoryId;
  goals: string[];
  positiveEffects: string[];
  sideEffects: string[];
  minDose: string;
  idealDose: string;
  timing?: string;
  source: 'local' | 'ai';
}

export interface Category {
  id: CategoryId;
  name: string;
  icon: string;
  color: string;
  subcategories: string[];
}

export interface GeneratedStack {
  title: string;
  description: string;
  items: {
    supplement: string;
    dosage: string;
    timing: string;
    reason: string;
  }[];
  precautions: string;
}
