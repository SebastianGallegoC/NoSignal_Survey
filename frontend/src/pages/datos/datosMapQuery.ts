import type { FormMapPointsQuery } from "@/services/api";
import type { ResultadoValidacionFilter } from "@/constants/validationStatsFilter";

export function buildMapPointsQueryFromValidationFilters(
  municipio: string,
  fechaDesde: string,
  fechaHasta: string,
  municipioOptions: string[],
  resultadoValidacion: ResultadoValidacionFilter = "",
): FormMapPointsQuery {
  const trimmedMunicipio = municipio.trim();
  const query: FormMapPointsQuery = {
    municipios:
      trimmedMunicipio !== "" ? [trimmedMunicipio] : [...municipioOptions],
    fecha_desde: fechaDesde.trim(),
    fecha_hasta: fechaHasta.trim(),
  };
  if (resultadoValidacion === "CUMPLE" || resultadoValidacion === "NO CUMPLE") {
    query.resultado_validacion = resultadoValidacion;
  }
  return query;
}
