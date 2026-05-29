/** Todas las claves del formulario (persistencia y payload). */
export const REQUIRED_FIELDS = [
  'latitud',
  'longitud',
  'metros_sobre_nivel_mar',
  'autoriza_tratamiento_datos',
  'fecha_visita',
  'municipio',
  'vereda',
  'nombre_predio',
  'datos_encuestado',
  'nombres_apellidos_encuestado',
  'tipo_documento_encuestado',
  'numero_documento_encuestado',
  'telefono_encuestado',
  'edad_encuestado',
  'informacion_vivienda',
  'cuenta_con_cocina',
  'cuenta_con_cocina_otro',
  'resultado_validacion',
  'observaciones',
  'tiempo_desplazamiento_horas',
  'tiempo_desplazamiento_minutos',
  'medio_transporte',
  'comentarios_desplazamiento',
  'nombres_apellidos_encuestador',
  'tipo_documento_encuestador',
  'numero_documento_encuestador',
  'telefono_encuestador',
  'cargo_encuestador',
  'empresa_entidad_encuestador',
  'firma_encuestador',
] as const;

export type FormFieldKey = (typeof REQUIRED_FIELDS)[number];

/** Únicos campos de datos que deben estar completos para guardar / enviar a cola. */
export const FIELDS_REQUIRED_TO_SUBMIT = [
  "nombres_apellidos_encuestado",
] as const satisfies readonly FormFieldKey[];

export type FormValues = Record<FormFieldKey, string>;
