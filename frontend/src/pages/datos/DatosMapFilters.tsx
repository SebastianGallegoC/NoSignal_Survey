import { municipioFilterLabel } from "@/constants/formStatsMunicipio";
import { getCurrentMonthIsoDateRange } from "@/pages/datos/datosDateDefaults";

interface DatosMapFiltersProps {
  municipioOptions: string[];
  selectedMunicipios: string[];
  municipiosLoading?: boolean;
  fechaDesde: string;
  fechaHasta: string;
  disabled?: boolean;
  onToggleMunicipio: (municipio: string) => void;
  onSelectAllMunicipios: () => void;
  onClearMunicipios: () => void;
  onChangeFechaDesde: (value: string) => void;
  onChangeFechaHasta: (value: string) => void;
  onClear: () => void;
}

export const DatosMapFilters = ({
  municipioOptions,
  selectedMunicipios,
  municipiosLoading = false,
  fechaDesde,
  fechaHasta,
  disabled = false,
  onToggleMunicipio,
  onSelectAllMunicipios,
  onClearMunicipios,
  onChangeFechaDesde,
  onChangeFechaHasta,
  onClear,
}: DatosMapFiltersProps) => {
  const defaultDates = getCurrentMonthIsoDateRange();
  const allSelected =
    municipioOptions.length > 0 &&
    municipioOptions.every((municipio) => selectedMunicipios.includes(municipio));
  const hasActive =
    !allSelected ||
    fechaDesde !== defaultDates.desde ||
    fechaHasta !== defaultDates.hasta;
  const noMunicipios = !municipiosLoading && municipioOptions.length === 0;
  const municipiosDisabled = disabled || municipiosLoading || noMunicipios;

  return (
    <div className="min-w-0 overflow-x-clip">
      <div>
        <div className="mb-2 flex items-center justify-between gap-3">
          <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-600">
            Municipios
          </h3>
          <div className="flex gap-2">
            <button
              type="button"
              disabled={municipiosDisabled || allSelected}
              onClick={onSelectAllMunicipios}
              className="rounded-md border border-slate-200 px-2 py-1 text-xs text-slate-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Seleccionar todos
            </button>
            <button
              type="button"
              disabled={municipiosDisabled || selectedMunicipios.length === 0}
              onClick={onClearMunicipios}
              className="rounded-md border border-slate-200 px-2 py-1 text-xs text-slate-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Ninguno
            </button>
          </div>
        </div>

        <div className="max-h-44 overflow-y-auto rounded-lg border border-slate-200 bg-white p-2">
          {municipiosLoading ? (
            <p className="text-xs text-slate-500">Cargando municipios…</p>
          ) : null}

          {noMunicipios ? (
            <p className="text-xs text-slate-500">
              Aún no hay formularios sincronizados con municipio registrado.
            </p>
          ) : null}

          {!municipiosLoading && !noMunicipios ? (
            <div className="space-y-1">
              {municipioOptions.map((municipio) => {
                const checked = selectedMunicipios.includes(municipio);
                return (
                  <label
                    key={municipio}
                    className="flex cursor-pointer items-center gap-2 rounded px-2 py-1 text-sm text-slate-700 hover:bg-slate-50"
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      disabled={municipiosDisabled}
                      onChange={() => onToggleMunicipio(municipio)}
                    />
                    <span>{municipioFilterLabel(municipio)}</span>
                  </label>
                );
              })}
            </div>
          ) : null}
        </div>
      </div>

      <div className="mt-4 border-t border-slate-100 pt-4">
        <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-600">
          Fecha de la visita
        </h3>
        <div className="mt-3 grid min-w-0 grid-cols-1 gap-3 sm:flex sm:flex-wrap sm:items-end">
          <label className="flex min-w-0 max-w-full flex-col text-xs font-medium text-slate-700 sm:min-w-[10rem] sm:flex-1">
            Desde
            <input
              type="date"
              value={fechaDesde}
              disabled={disabled}
              onChange={(e) => onChangeFechaDesde(e.target.value)}
              className="form-date-input mt-1 block w-full min-w-0 max-w-full rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-sm text-slate-900 disabled:cursor-not-allowed disabled:bg-slate-100"
            />
          </label>
          <label className="flex min-w-0 max-w-full flex-col text-xs font-medium text-slate-700 sm:min-w-[10rem] sm:flex-1">
            Hasta
            <input
              type="date"
              value={fechaHasta}
              disabled={disabled}
              onChange={(e) => onChangeFechaHasta(e.target.value)}
              className="form-date-input mt-1 block w-full min-w-0 max-w-full rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-sm text-slate-900 disabled:cursor-not-allowed disabled:bg-slate-100"
            />
          </label>
          <button
            type="button"
            disabled={disabled || !hasActive}
            onClick={onClear}
            className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-medium text-slate-800 hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Limpiar filtros
          </button>
        </div>
      </div>
    </div>
  );
};
