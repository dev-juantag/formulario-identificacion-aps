import * as z from 'zod'

const noPipes = (val: string) => !val.includes('|')

export const integranteSchema = z.object({
  id: z.string().optional(),
  // IV. DATOS BÁSICOS (Integrante)
  primerNombre: z.string()
    .min(1, 'Requerido')
    .regex(/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/, 'Solo letras')
    .transform(v => v.trim().toLowerCase().replace(/(^\w|\s\w)/g, m => m.toUpperCase())),
  segundoNombre: z.string().optional().nullable()
    .transform(v => v ? v.trim().toLowerCase().replace(/(^\w|\s\w)/g, m => m.toUpperCase()) : v),
  primerApellido: z.string()
    .min(1, 'Requerido')
    .regex(/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/, 'Solo letras')
    .transform(v => v.trim().toLowerCase().replace(/(^\w|\s\w)/g, m => m.toUpperCase())),
  segundoApellido: z.string()
    .min(1, 'Requerido')
    .regex(/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/, 'Solo letras')
    .transform(v => v.trim().toLowerCase().replace(/(^\w|\s\w)/g, m => m.toUpperCase())),
  tipoDoc: z.string().min(1, 'Requerido'),
  numDoc: z.string().min(6, 'Mínimo 6 dígitos').regex(/^\d+$/, 'Solo números'),
  fechaNacimiento: z.string().min(1, 'Requerido'),
  sexo: z.string().min(1, 'Requerido'),
  gestante: z.string().optional().nullable(),
  telefono: z.string()
    .length(10, 'Debe tener exactamente 10 dígitos')
    .regex(/^3\d{9}$/, 'Debe empezar por 3 y ser numérico'),
  estadoCivil: z.string().optional().nullable(),
  parentesco: z.string().min(1, 'Requerido'),
  // Educación y Diferencial
  nivelEducativo: z.string().min(1, 'Requerido'),
  ocupacion: z.string().min(1, 'Requerido'),
  regimen: z.string().min(1, 'Requerido'),
  eapb: z.string().optional().nullable(),
  etnia: z.string().min(1, 'Requerido'),
  puebloIndigena: z.string().optional().nullable(),
  grupoPoblacional: z.array(z.string()).default([]),
  discapacidades: z.array(z.string()).default([]),

  // V. EVALUACIÓN SALUD (Step 5)
  antecedentes: z.record(z.boolean()).optional().default({}),
  antecTransmisibles: z.record(z.boolean()).optional().default({}),
  peso: z.coerce.number().min(0.1, 'Requerido'),
  talla: z.coerce.number().min(0.1, 'Requerido'),
  perimetroBraquial: z.union([z.string(), z.number()]).optional().nullable().transform(v => (v === '' || v == null) ? null : Number(v)),
  diagNutricional: z.string().optional().nullable(),
  practicaDeportiva: z.boolean().optional().default(false),
  lactanciaMaterna: z.boolean().optional().default(false),
  lactanciaMeses: z.coerce.number().optional().nullable(),
  esquemaAtenciones: z.boolean().optional().default(false),
  intervencionesPendientes: z.array(z.string()).optional().default([]),
  enfermedadAguda: z.boolean().optional().default(false),
  recibeAtencionMedica: z.boolean().optional().default(false),
  remisiones: z.array(z.string()).optional().default([]),
})

export const wizardSchema = z.object({
  // STEP 1: Ubicación
  estadoVisita: z.string().default('1'),
  fechaDiligenciamiento: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  departamento: z.string().min(1, 'Requerido').transform(v => v.toUpperCase()),
  municipio: z.string().min(1, 'Requerido').transform(v => v.toUpperCase()),
  centroPoblado: z.string().optional().nullable().transform(v => v?.toUpperCase() || ''),
  descripcionUbicacion: z.string().optional().nullable(),
  direccion: z.string().min(1, 'Requerido').transform(v => v.toUpperCase()),
  uzpe: z.string().optional().nullable(),
  numEBS: z.string().min(1, 'Requerido'),
  prestadorPrimario: z.string().min(1, 'Requerido'),
  tipoDocEncuestador: z.string().min(1, 'Requerido'),
  numDocEncuestador: z.string().min(6, 'Mínimo 6 dígitos').regex(/^\d+$/, 'Solo números'),
  perfilEncuestador: z.string().min(1, 'Requerido'),
  
  // Matrioshka Identificadores Adicionales
  numHogar: z.string().min(1, 'Requerido'),
  numFamilia: z.string().min(1, 'Requerido'),
  codFicha: z.string().min(1, 'Requerido'),
  observacionesRechazo: z.string().optional().nullable(),
  
  // STEP 2: Vivienda
  tipoVivienda: z.string().min(1, 'Requerido'),
  tipoViviendaDesc: z.string().optional().nullable(),
  matParedes: z.string().min(1, 'Requerido'),
  matPisos: z.string().min(1, 'Requerido'),
  matTechos: z.string().min(1, 'Requerido'),
  numHogares: z.string().min(1, 'Requerido'),
  numDormitorios: z.string().min(1, 'Requerido'),
  estratoSocial: z.string().min(1, 'Requerido'),
  hacinamiento: z.boolean().optional().default(false),
  fuenteAgua: z.union([z.boolean(), z.array(z.string()), z.null(), z.undefined()]).transform(v => Array.isArray(v) ? v : []),
  dispExcretas: z.union([z.boolean(), z.array(z.string()), z.null(), z.undefined()]).transform(v => Array.isArray(v) ? v : []),
  aguasResiduales: z.union([z.boolean(), z.array(z.string()), z.null(), z.undefined()]).transform(v => Array.isArray(v) ? v : []),
  dispResiduos: z.union([z.boolean(), z.array(z.string()), z.null(), z.undefined()]).transform(v => Array.isArray(v) ? v : []),
  riesgoAccidente: z.union([z.boolean(), z.array(z.string()), z.null(), z.undefined()]).transform(v => Array.isArray(v) ? v : []),
  fuenteEnergia: z.string().min(1, 'Requerido'),
  presenciaVectores: z.string().min(1, 'Requerido'),
  animales: z.union([z.boolean(), z.array(z.string()), z.null(), z.undefined()])
    .transform(v => Array.isArray(v) ? v : [])
    .refine(val => val.length > 0, 'Requerido'),
  cantAnimales: z.string().optional().nullable(),
  vacunacionMascotas: z.boolean().optional().default(false),

  // STEP 3: Familia
  tipoFamilia: z.string().min(1, 'Requerido'),
  numIntegrantes: z.string().min(1, 'Requerido'),
  apgar: z.string().min(1, 'Requerido'),
  ecomapa: z.string().optional().nullable(),
  cuidadorPrincipal: z.boolean().optional().default(false),
  zarit: z.string().optional().nullable(),
  vulnerabilidades: z.union([z.boolean(), z.array(z.string()), z.null(), z.undefined()]).transform(v => Array.isArray(v) ? v : []),

  // STEP 4 & 5: Integrantes
  integrantes: z.array(integranteSchema).default([]),
}).superRefine((data, ctx) => {
  if (data.estadoVisita === '1' && (!data.integrantes || data.integrantes.length === 0)) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'Debe haber al menos un integrante',
      path: ['integrantes'],
    })
  }
})

export type WizardData = z.infer<typeof wizardSchema>
export type IntegranteData = z.infer<typeof integranteSchema>
