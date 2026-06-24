export const MES_FILTRO_LABELS = [
  "Enero",
  "Febrero",
  "Marzo",
  "Abril",
  "Mayo",
  "Junio",
  "Julio",
  "Agosto",
  "Septiembre",
  "Octubre",
  "Noviembre",
  "Diciembre",
] as const;

export function mesFiltroLabel(mes: number): string {
  if (mes >= 1 && mes <= 12) {
    return MES_FILTRO_LABELS[mes - 1];
  }
  return String(mes);
}

export function buildValidationDateRange(
  anioFiltro: number | null,
  mesFiltro: number | null,
): { fechaDesde: string; fechaHasta: string } {
  if (anioFiltro == null) {
    return { fechaDesde: "", fechaHasta: "" };
  }
  if (mesFiltro == null) {
    return {
      fechaDesde: `${anioFiltro}-01-01`,
      fechaHasta: `${anioFiltro}-12-31`,
    };
  }
  const mm = String(mesFiltro).padStart(2, "0");
  const lastDay = new Date(anioFiltro, mesFiltro, 0).getDate();
  const dd = String(lastDay).padStart(2, "0");
  return {
    fechaDesde: `${anioFiltro}-${mm}-01`,
    fechaHasta: `${anioFiltro}-${mm}-${dd}`,
  };
}

export function inferAnioMesFromDateRange(
  fechaDesde: string,
  fechaHasta: string,
): { anioFiltro: number | null; mesFiltro: number | null } {
  if (!fechaDesde.trim() || !fechaHasta.trim()) {
    return { anioFiltro: null, mesFiltro: null };
  }
  const anio = Number(fechaDesde.slice(0, 4));
  if (!Number.isFinite(anio) || fechaDesde.slice(0, 4) !== fechaHasta.slice(0, 4)) {
    return { anioFiltro: anio, mesFiltro: null };
  }
  if (fechaDesde === `${anio}-01-01` && fechaHasta === `${anio}-12-31`) {
    return { anioFiltro: anio, mesFiltro: null };
  }
  const mes = Number(fechaDesde.slice(5, 7));
  if (
    Number.isFinite(mes) &&
    mes >= 1 &&
    mes <= 12 &&
    fechaDesde.slice(5, 7) === fechaHasta.slice(5, 7) &&
    fechaDesde.endsWith("-01")
  ) {
    return { anioFiltro: anio, mesFiltro: mes };
  }
  return { anioFiltro: anio, mesFiltro: null };
}

export function hasActiveValidationDateFilter(
  anioFiltro: number | null,
  mesFiltro: number | null,
): boolean {
  return anioFiltro != null || mesFiltro != null;
}
