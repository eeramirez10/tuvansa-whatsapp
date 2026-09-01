export interface QuoteProductRequirement {
  family: string
  label: string
  requiredFields: string[]
  requiresUnit?: boolean
  defaultUnit?: string
  conditionalFields?: Array<{
    whenField: string
    contains: string
    requiredField: string
  }>
}

export const QUOTE_PRODUCT_REQUIREMENTS: QuoteProductRequirement[] = [
  { family: 'TUBERIA', label: 'Tuberia', requiredFields: ['material', 'diametro', 'cedula_o_espesor', 'costura'], requiresUnit: true },
  { family: 'CODO', label: 'Codo', requiredFields: ['material', 'diametro', 'cedula_o_clase', 'angulo', 'conexion'], defaultUnit: 'PIEZA' },
  {
    family: 'TEE_YEE_CRUZ',
    label: 'Tee, yee o cruz',
    requiredFields: ['tipo', 'material', 'diametro_principal', 'cedula_o_clase', 'conexion'],
    defaultUnit: 'PIEZA',
    conditionalFields: [{
      whenField: 'tipo',
      contains: 'reduc',
      requiredField: 'diametro_derivacion'
    }]
  },
  { family: 'REDUCCION', label: 'Reduccion', requiredFields: ['tipo', 'material', 'diametro_mayor', 'diametro_menor', 'cedula_o_clase', 'conexion'], defaultUnit: 'PIEZA' },
  { family: 'NIPLE', label: 'Niple', requiredFields: ['material', 'diametro', 'cedula', 'longitud', 'extremos'], defaultUnit: 'PIEZA' },
  { family: 'COPLE_UNION', label: 'Cople o union', requiredFields: ['tipo', 'material', 'diametro', 'cedula_o_clase', 'conexion'], defaultUnit: 'PIEZA' },
  { family: 'ADAPTADOR', label: 'Adaptador', requiredFields: ['tipo', 'diametro_entrada', 'diametro_salida', 'conexiones'], defaultUnit: 'PIEZA' },
  { family: 'TAPON_CAP', label: 'Tapon o cap', requiredFields: ['tipo', 'material', 'diametro', 'cedula_o_clase', 'conexion'], defaultUnit: 'PIEZA' },
  { family: 'PORTABRIDA', label: 'Portabrida', requiredFields: ['material', 'diametro', 'cedula', 'tipo_corto_largo'], defaultUnit: 'PIEZA' },
  { family: 'CONEXION_FORJADA', label: 'Conexion forjada', requiredFields: ['tipo', 'material', 'diametro', 'clase', 'conexion'], defaultUnit: 'PIEZA' },
  { family: 'CONEXION_RANURADA', label: 'Conexion ranurada', requiredFields: ['tipo', 'diametro', 'material', 'presion_o_modelo'], defaultUnit: 'PIEZA' },
  { family: 'BRIDA', label: 'Brida', requiredFields: ['tipo', 'diametro', 'clase', 'cara', 'material'], defaultUnit: 'PIEZA' },
  { family: 'VALVULA', label: 'Valvula', requiredFields: ['tipo', 'diametro', 'clase_o_presion', 'conexion', 'material_cuerpo', 'accionamiento'], defaultUnit: 'PIEZA' },
  { family: 'VALVULA_CONTROL', label: 'Valvula de control', requiredFields: ['tipo', 'diametro', 'clase', 'conexion', 'actuador', 'senal_control'], defaultUnit: 'PIEZA' },
  { family: 'VALVULA_SEGURIDAD', label: 'Valvula de seguridad', requiredFields: ['diametro_entrada', 'diametro_salida', 'presion_ajuste', 'conexion', 'material', 'servicio'], defaultUnit: 'PIEZA' },
  { family: 'ACTUADOR', label: 'Actuador', requiredFields: ['tipo', 'torque', 'alimentacion', 'valvula_compatible'], defaultUnit: 'PIEZA' },
  { family: 'EMPAQUE_JUNTA', label: 'Empaque o junta', requiredFields: ['tipo', 'material', 'diametro', 'clase'], defaultUnit: 'PIEZA' },
  { family: 'TORNILLO_ESPARRAGO', label: 'Tornillo o esparrago', requiredFields: ['tipo', 'diametro', 'longitud', 'grado_o_material'], defaultUnit: 'PIEZA' },
  { family: 'TUERCA', label: 'Tuerca', requiredFields: ['diametro', 'grado_o_material', 'rosca'], defaultUnit: 'PIEZA' },
  { family: 'KIT_TORNILLERIA', label: 'Kit de tornilleria', requiredFields: ['diametro_brida', 'clase_brida', 'grado_o_material', 'componentes'], defaultUnit: 'KIT' },
  { family: 'PLACA', label: 'Placa', requiredFields: ['material', 'espesor', 'ancho', 'largo'], defaultUnit: 'PIEZA' },
  { family: 'LAMINA', label: 'Lamina', requiredFields: ['material', 'calibre_o_espesor', 'ancho', 'largo'], defaultUnit: 'PIEZA' },
  { family: 'VARILLA_BARRA', label: 'Varilla o barra', requiredFields: ['material', 'forma', 'diametro_o_dimensiones', 'longitud'], defaultUnit: 'PIEZA' },
  { family: 'PERFIL_ESTRUCTURAL', label: 'Perfil estructural', requiredFields: ['tipo_perfil', 'dimensiones_o_designacion', 'material', 'longitud'], defaultUnit: 'PIEZA' },
  { family: 'MANGUERA', label: 'Manguera', requiredFields: ['servicio_o_material', 'diametro', 'presion_trabajo', 'longitud', 'conexiones'], defaultUnit: 'PIEZA' },
  { family: 'FILTRO_COLADOR', label: 'Filtro o colador', requiredFields: ['tipo', 'diametro', 'clase_o_presion', 'conexion', 'material'], defaultUnit: 'PIEZA' },
  { family: 'JUNTA_EXPANSION', label: 'Junta de expansion', requiredFields: ['diametro', 'presion', 'longitud', 'movimiento', 'conexiones'], defaultUnit: 'PIEZA' },
  { family: 'TRAMPA_VAPOR', label: 'Trampa de vapor', requiredFields: ['tipo', 'diametro', 'presion_operacion', 'conexion'], defaultUnit: 'PIEZA' },
  { family: 'MANOMETRO', label: 'Manometro', requiredFields: ['rango_presion', 'diametro_conexion', 'posicion_conexion'], defaultUnit: 'PIEZA' },
  { family: 'TERMOMETRO', label: 'Termometro', requiredFields: ['rango_temperatura', 'longitud_vastago', 'conexion'], defaultUnit: 'PIEZA' },
  { family: 'BOMBA', label: 'Bomba', requiredFields: ['fluido', 'caudal', 'carga_o_presion', 'conexiones', 'alimentacion'], defaultUnit: 'PIEZA' }
]

export const QUOTE_PRODUCT_FAMILIES = QUOTE_PRODUCT_REQUIREMENTS.map(({ family }) => family)

export const QUOTE_PRODUCT_FIELD_LABELS: Record<string, string> = {
  cantidad: 'cantidad',
  unidad: 'unidad',
  material: 'material',
  diametro: 'diametro',
  cedula_o_espesor: 'cedula o espesor',
  costura: 'con costura o sin costura',
  cedula_o_clase: 'cedula o clase',
  angulo: 'angulo',
  conexion: 'tipo de conexion',
  tipo: 'tipo',
  diametro_principal: 'diametro principal',
  diametro_derivacion: 'diametro de derivacion cuando sea reducida',
  diametro_mayor: 'diametro mayor',
  diametro_menor: 'diametro menor',
  cedula: 'cedula',
  longitud: 'longitud',
  extremos: 'tipo de extremos',
  diametro_entrada: 'diametro de entrada',
  diametro_salida: 'diametro de salida',
  conexiones: 'conexiones',
  tipo_corto_largo: 'tipo corto o largo',
  clase: 'clase',
  presion_o_modelo: 'presion o figura/modelo',
  cara: 'cara RF, FF o RTJ',
  clase_o_presion: 'clase o presion',
  material_cuerpo: 'material del cuerpo',
  accionamiento: 'accionamiento',
  actuador: 'actuador',
  senal_control: 'senal de control',
  presion_ajuste: 'presion de ajuste',
  servicio: 'servicio',
  torque: 'torque',
  alimentacion: 'alimentacion o voltaje',
  valvula_compatible: 'valvula compatible',
  grado_o_material: 'grado o material',
  rosca: 'tipo de rosca',
  diametro_brida: 'diametro de la brida',
  clase_brida: 'clase de la brida',
  componentes: 'componentes incluidos',
  espesor: 'espesor',
  ancho: 'ancho',
  largo: 'largo',
  calibre_o_espesor: 'calibre o espesor',
  forma: 'forma',
  diametro_o_dimensiones: 'diametro o dimensiones',
  tipo_perfil: 'tipo de perfil',
  dimensiones_o_designacion: 'dimensiones o designacion',
  servicio_o_material: 'servicio o material',
  presion_trabajo: 'presion de trabajo',
  presion: 'presion',
  movimiento: 'movimiento requerido',
  presion_operacion: 'presion de operacion',
  rango_presion: 'rango de presion',
  diametro_conexion: 'diametro de conexion',
  posicion_conexion: 'posicion de conexion',
  rango_temperatura: 'rango de temperatura',
  longitud_vastago: 'longitud de vastago',
  fluido: 'fluido',
  caudal: 'caudal',
  carga_o_presion: 'carga o presion requerida'
}

export const QUOTE_PRODUCT_REQUIREMENTS_PROMPT = QUOTE_PRODUCT_REQUIREMENTS
  .map((requirement) => {
    const fields = requirement.requiredFields
      .map((field) => `${field} (${QUOTE_PRODUCT_FIELD_LABELS[field] ?? field})`)
      .join(', ')
    const conditional = (requirement.conditionalFields ?? [])
      .map(({ whenField, contains, requiredField }) => `; si ${whenField} contiene "${contains}", pide ${requiredField}`)
      .join('')
    const unit = requirement.requiresUnit ? ', cantidad y unidad' : ', cantidad'
    return `- ${requirement.family} (${requirement.label}): ${fields}${conditional}${unit}.`
  })
  .join('\n')
