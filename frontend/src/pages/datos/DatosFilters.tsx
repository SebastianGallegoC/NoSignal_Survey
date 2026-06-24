import { municipioFilterLabel } from "@/constants/formStatsMunicipio";
import {
  RESULTADO_VALIDACION_FILTER_OPTIONS,
  type ResultadoValidacionFilter,
} from "@/constants/validationStatsFilter";
import {
  hasActiveValidationDateFilter,
  mesFiltroLabel,
} from "@/pages/datos/validationDateFilter";

interface DatosFiltersProps {
  municipio: string;
  municipioOptions: string[];
  municipiosLoading?: boolean;
  resultadoValidacion: ResultadoValidacionFilter;
  anioFiltro: number | null;
  mesFiltro: number | null;
  anioOptions: number[];
  aniosLoading?: boolean;
  mesOptions: number[];
  mesesLoading?: boolean;
  onChangeMunicipio: (value: string) => void;
  onChangeResultadoValidacion: (value: ResultadoValidacionFilter) => void;
  onChangeAnioFiltro: (value: number | null) => void;
  onChangeMesFiltro: (value: number | null) => void;
  onClear: () => void;
  disabled?: boolean;
}

export const DatosFilters = ({
  municipio,
  municipioOptions,
  municipiosLoading = false,
  resultadoValidacion,
  anioFiltro,
  mesFiltro,
  anioOptions,
  aniosLoading = false,
  mesOptions,
  mesesLoading = false,
  onChangeMunicipio,
  onChangeResultadoValidacion,
  onChangeAnioFiltro,
  onChangeMesFiltro,
  onClear,
  disabled = false,
}: DatosFiltersProps) => {
  const hasActive =
    municipio !== "" ||
    resultadoValidacion !== "" ||
    hasActiveValidationDateFilter(anioFiltro, mesFiltro);

  const selectDisabled = disabled || municipiosLoading;
  const noMunicipios =
    !municipiosLoading && municipioOptions.length === 0 && !disabled;

  const anioSelectDisabled = disabled || aniosLoading;
  const mesSelectDisabled =
    disabled || anioFiltro == null || mesesLoading || mesOptions.length === 0;

  return (
    <div className="min-w-0 overflow-x-clip">
      <div className="grid min-w-0 grid-cols-1 gap-4">
        <label className="flex min-w-0 max-w-md flex-col text-xs font-medium text-slate-700">
          Municipio
          <select
            value={municipio}
            disabled={selectDisabled || noMunicipios}
            onChange={(e) => onChangeMunicipio(e.target.value)}
            className="mt-1 block w-full rounded-lg border border-slate-200 bg-white px-2 py-2 text-sm text-slate-900 disabled:cursor-not-allowed disabled:bg-slate-100"
          >
            <option value="">
              {municipiosLoading
                ? "Cargando municipios…"
                : noMunicipios
                  ? "Sin municipios en formularios"
                  : "Todos los municipios"}
            </option>
            {municipioOptions.map((name) => (
              <option key={name} value={name}>
                {municipioFilterLabel(name)}
              </option>
            ))}
          </select>
        </label>

        <fieldset
          disabled={disabled}
          className="flex min-w-0 max-w-full flex-col text-xs font-medium text-slate-700 disabled:opacity-60"
        >
          <legend className="mb-2">Resultado de validación</legend>
          <div className="flex flex-wrap gap-2">
            {RESULTADO_VALIDACION_FILTER_OPTIONS.map((option) => {
              const selected = resultadoValidacion === option.value;
              return (
                <button
                  key={option.value || "todos"}
                  type="button"
                  disabled={disabled}
                  onClick={() => onChangeResultadoValidacion(option.value)}
                  className={`rounded-xl border px-3 py-2 text-sm transition disabled:cursor-not-allowed ${
                    selected
                      ? "border-teal-600 bg-teal-50 text-teal-800"
                      : "border-slate-200 bg-white text-slate-700 hover:border-slate-300"
                  }`}
                  aria-pressed={selected}
                >
                  {option.label}
                </button>
              );
            })}
          </div>
        </fieldset>
      </div>

      {noMunicipios ? (
        <p className="mt-1 text-xs text-slate-500">
          Aún no hay formularios sincronizados con municipio registrado.
        </p>
      ) : null}

      <div className="mt-4 border-t border-slate-100 pt-4">
        <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-600">
          Fecha de la visita
        </h3>
        <div className="mt-3 grid min-w-0 grid-cols-1 gap-3 sm:grid-cols-2 sm:items-end">
          <label className="flex min-w-0 max-w-xs flex-col text-xs font-medium text-slate-700">
            Año
            <select
              aria-label="Año para filtro de validación"
              value={anioFiltro ?? ""}
              disabled={anioSelectDisabled}
              onChange={(e) => {
                const raw = e.target.value;
                onChangeAnioFiltro(raw === "" ? null : Number(raw));
              }}
              className="mt-1 block w-full rounded-lg border border-slate-200 bg-white px-2 py-2 text-sm text-slate-900 disabled:cursor-not-allowed disabled:bg-slate-100"
            >
              <option value="">
                {aniosLoading ? "Cargando años…" : "Todos los años"}
              </option>
              {anioOptions.map((y) => (
                <option key={y} value={y}>
                  {y}
                </option>
              ))}
            </select>
          </label>

          {anioFiltro != null ? (
            <label className="flex min-w-0 max-w-xs flex-col text-xs font-medium text-slate-700">
              Mes
              <select
                aria-label="Mes para filtro de validación"
                value={mesFiltro ?? ""}
                disabled={mesSelectDisabled}
                onChange={(e) => {
                  const raw = e.target.value;
                  onChangeMesFiltro(raw === "" ? null : Number(raw));
                }}
                className="mt-1 block w-full rounded-lg border border-slate-200 bg-white px-2 py-2 text-sm text-slate-900 disabled:cursor-not-allowed disabled:bg-slate-100"
              >
                <option value="">
                  {mesesLoading
                    ? "Cargando meses…"
                    : mesOptions.length === 0
                      ? "Sin meses con datos"
                      : "Todos los meses"}
                </option>
                {mesOptions.map((m) => (
                  <option key={m} value={m}>
                    {mesFiltroLabel(m)}
                  </option>
                ))}
              </select>
            </label>
          ) : null}

          <button
            type="button"
            disabled={disabled || !hasActive}
            onClick={onClear}
            className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-medium text-slate-800 hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50 sm:col-span-2 sm:w-fit"
          >
            Limpiar filtros
          </button>
        </div>
      </div>
    </div>
  );
};
