export const MUNICIPIO_SIN_ASOCIAR = "__SIN_ASOCIAR__";
export const MUNICIPIO_SIN_ASOCIAR_LABEL = "Sin asociar";

export function isMunicipioSinAsociar(value: string | null | undefined): boolean {
  return String(value ?? "").trim() === MUNICIPIO_SIN_ASOCIAR;
}

export function municipioFilterLabel(value: string | null | undefined): string {
  return isMunicipioSinAsociar(value)
    ? MUNICIPIO_SIN_ASOCIAR_LABEL
    : String(value ?? "").trim();
}
