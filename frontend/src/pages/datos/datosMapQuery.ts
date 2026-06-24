import type { FormMapPointsQuery } from "@/services/api";

export function buildMapPointsQueryFromValidationFilters(
  municipio: string,
  fechaDesde: string,
  fechaHasta: string,
  municipioOptions: string[],
): FormMapPointsQuery {
  const trimmedMunicipio = municipio.trim();
  return {
    municipios:
      trimmedMunicipio !== "" ? [trimmedMunicipio] : [...municipioOptions],
    fecha_desde: fechaDesde.trim(),
    fecha_hasta: fechaHasta.trim(),
  };
}
