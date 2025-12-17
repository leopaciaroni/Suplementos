
import { Category, CategoryId, Supplement } from './types.ts';

export const CATEGORIES: Category[] = [
  {
    id: CategoryId.REJUVENATION,
    name: 'Rejuvenecimiento',
    icon: 'fa-seedling',
    color: 'bg-emerald-100 text-emerald-700',
    subcategories: ['Longevidad Celular', 'Senolíticos', 'NAD+ Boosters', 'Telómeros', 'Colágeno']
  },
  {
    id: CategoryId.HORMONAL_MEN,
    name: 'Hormonales Hombres',
    icon: 'fa-mars',
    color: 'bg-blue-100 text-blue-700',
    subcategories: ['Testosterona', 'Optimización de SHBG', 'Libido', 'Salud de Próstata', 'Angiogénesis']
  },
  {
    id: CategoryId.HORMONAL_WOMEN,
    name: 'Hormonales Mujeres',
    icon: 'fa-venus',
    color: 'bg-pink-100 text-pink-700',
    subcategories: ['SOP/Inositol', 'Menopausia', 'Equilibrio Estrogénico', 'Ciclo Menstrual']
  },
  {
    id: CategoryId.ANTIOXIDANTS,
    name: 'Antioxidantes',
    icon: 'fa-shield-halved',
    color: 'bg-orange-100 text-orange-700',
    subcategories: ['Mitocondrial', 'Glutatión', 'Protección Cardiovascular']
  },
  {
    id: CategoryId.NOOTROPICS,
    name: 'Nootrópicos',
    icon: 'fa-brain',
    color: 'bg-indigo-100 text-indigo-700',
    subcategories: ['Enfoque', 'Neuroplasticidad', 'Adaptógenos', 'Estado de Ánimo', 'Memoria']
  },
  {
    id: CategoryId.PHYSICAL_PERFORMANCE,
    name: 'Desempeño Físico',
    icon: 'fa-dumbbell',
    color: 'bg-red-100 text-red-700',
    subcategories: ['Fuerza', 'Hipertrofia', 'Resistencia', 'Vasodilatación']
  },
  {
    id: CategoryId.IMMUNITY,
    name: 'Inmunidad',
    icon: 'fa-virus-slash',
    color: 'bg-teal-100 text-teal-700',
    subcategories: ['Antiviral', 'Inmunomodulación', 'Salud de Barrera']
  },
  {
    id: CategoryId.METABOLISM,
    name: 'Metabolismo',
    icon: 'fa-bolt',
    color: 'bg-amber-100 text-amber-700',
    subcategories: ['Sensibilidad Insulina', 'Activación AMPK', 'Quema de Grasa']
  }
];

export const INITIAL_SUPPLEMENTS: Supplement[] = [
  {
    id: 'bpc-157-oral',
    name: 'BPC-157 (Cápsulas Arginato)',
    description: 'Péptido gástrico estable que promueve la angiogénesis (formación de nuevos vasos sanguíneos) y regeneración de tejidos nerviosos y vasculares.',
    category: CategoryId.HORMONAL_MEN,
    goals: ['Angiogénesis', 'Regeneración', 'Salud Vascular', 'Angiogénesis nerviosa', 'Erección'],
    positiveEffects: [
      'Estimulación de la angiogénesis nerviosa',
      'Acelera la curación de tejidos blandos',
      'Protección del endotelio vascular',
      'Efecto citoprotector sistémico',
      'Mejora la microcirculación local'
    ],
    sideEffects: ['Investigación en humanos aún emergente'],
    minDose: '200mcg/día',
    idealDose: '500mcg/día',
    timing: 'Con o sin comida',
    source: 'local'
  },
  {
    id: 'icariin-60',
    name: 'Icariina (Horny Goat Weed 60%)',
    description: 'Fitoestrógeno que actúa como inhibidor suave de la PDE5 y promueve la síntesis de óxido nítrico.',
    category: CategoryId.HORMONAL_MEN,
    goals: ['Libido', 'Erección', 'Testosterona', 'Salud Cardiovascular', 'Angiogénesis'],
    positiveEffects: [
      'Mejora la dureza y calidad de la erección',
      'Aumenta la expresión de eNOS (óxido nítrico)',
      'Efecto mimético de la testosterona',
      'Neuroprotección vascular',
      'Soporte a la densidad ósea'
    ],
    sideEffects: ['Aumento de la frecuencia cardíaca'],
    minDose: '250mg',
    idealDose: '500mg - 750mg/día',
    timing: 'Mañana',
    source: 'local'
  },
  {
    id: 'ta-65',
    name: 'TA-65 (Extracto de Astragalus)',
    description: 'Activador de telomerasa purificado para longevidad celular.',
    category: CategoryId.REJUVENATION,
    goals: ['Telómeros', 'Longevidad Celular'],
    positiveEffects: [
      'Activa la enzima telomerasa',
      'Alarga telómeros cortos',
      'Mejora la respuesta inmune',
      'Protección celular avanzada'
    ],
    sideEffects: ['Seguro en dosis estudiadas'],
    minDose: '250 Unidades',
    idealDose: '500 - 1000 Unidades',
    timing: 'En ayunas',
    source: 'local'
  }
];
