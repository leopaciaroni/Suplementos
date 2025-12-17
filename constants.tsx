
import { Category, CategoryId, Supplement } from './types';

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
  // TELÓMEROS / REJUVENECIMIENTO
  {
    id: 'ta-65',
    name: 'TA-65 (Extracto de Astragalus)',
    description: 'Activador de telomerasa purificado derivado de la raíz de Astragalus membranaceus.',
    category: CategoryId.REJUVENATION,
    goals: ['Telómeros', 'Longevidad Celular'],
    positiveEffects: [
      'Activa la enzima telomerasa',
      'Alarga telómeros cortos en células T',
      'Mejora la respuesta inmune adaptativa',
      'Mejora marcadores metabólicos',
      'Protección celular avanzada',
      'Promueve reparación de ADN'
    ],
    sideEffects: ['Seguro en dosis estudiadas', 'Posible interacción con inmunosupresores'],
    minDose: '250 Unidades/día',
    idealDose: '500 - 1000 Unidades/día',
    timing: 'En ayunas o lejos de las comidas',
    source: 'local'
  },
  // HORMONALES HOMBRES / ANGIOGÉNESIS / ERECCIÓN
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
    sideEffects: ['Pocos efectos secundarios reportados en dosis terapéuticas', 'Investigación en humanos aún emergente'],
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
    goals: ['Libido', 'Erección', 'Testosterona', 'Salud Cardiovascular'],
    positiveEffects: [
      'Mejora la dureza y calidad de la erección',
      'Aumenta la expresión de eNOS (óxido nítrico)',
      'Efecto mimético de la testosterona',
      'Neuroprotección vascular',
      'Soporte a la densidad ósea'
    ],
    sideEffects: ['Aumento de la frecuencia cardíaca', 'Sed excesiva'],
    minDose: '250mg (extracto estandarizado)',
    idealDose: '500mg - 750mg/día',
    timing: 'Mañana o antes de la actividad',
    source: 'local'
  },
  {
    id: 'l-citrulline-pure',
    name: 'L-Citrulina Malato (2:1)',
    description: 'Precursor de arginina para la vasodilatación masiva.',
    category: CategoryId.PHYSICAL_PERFORMANCE,
    goals: ['Vasodilatación', 'Resistencia', 'Erección', 'Salud Cardiovascular'],
    positiveEffects: [
      'Optimiza el flujo sanguíneo cavernoso',
      'Mejora la dureza eréctil',
      'Aumenta la resistencia al ejercicio',
      'Reduce el dolor muscular',
      'Aumenta la síntesis de óxido nítrico'
    ],
    sideEffects: ['Malestar gástrico leve'],
    minDose: '3000mg/día',
    idealDose: '6000mg - 8000mg/día',
    timing: '45-60 min antes de la actividad',
    source: 'local'
  },
  // NOOTRÓPICOS
  {
    id: 'lions-mane',
    name: 'Melena de León (Hericium erinaceus)',
    description: 'Hongo que estimula el factor de crecimiento nervioso (NGF).',
    category: CategoryId.NOOTROPICS,
    goals: ['Memoria', 'Neuroplasticidad', 'Enfoque'],
    positiveEffects: [
      'Mejora memoria a corto plazo',
      'Reparación neuronal activa',
      'Reduce niebla mental',
      'Protección contra neurodegeneración',
      'Mejora estado de ánimo'
    ],
    sideEffects: ['Alergias'],
    minDose: '500mg/día',
    idealDose: '1000mg - 3000mg/día',
    timing: 'Mañana',
    source: 'local'
  },
  // METABOLISMO
  {
    id: 'berberine-hcl',
    name: 'Berberina HCl',
    description: 'Activador de AMPK y optimizador de glucosa.',
    category: CategoryId.METABOLISM,
    goals: ['Sensibilidad Insulina', 'Activación AMPK', 'Quema de Grasa'],
    positiveEffects: [
      'Control glucémico potente',
      'Optimización lipídica (colesterol)',
      'Pérdida de grasa visceral',
      'Activación de vías de longevidad',
      'Salud intestinal'
    ],
    sideEffects: ['Estreñimiento'],
    minDose: '500mg/día',
    idealDose: '1500mg/día',
    timing: 'Antes de comidas ricas en carbohidratos',
    source: 'local'
  }
];
