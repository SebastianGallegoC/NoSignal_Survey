import type { ReactNode } from "react";

interface DatosReportSectionProps {
  title: string;
  description: string;
  ariaLabel: string;
  filters: ReactNode;
  filtersLabel?: string;
  children: ReactNode;
}

export const DatosReportSection = ({
  title,
  description,
  ariaLabel,
  filters,
  filtersLabel = "Filtros de este gráfico",
  children,
}: DatosReportSectionProps) => {
  return (
    <section
      aria-label={ariaLabel}
      className="mb-8 overflow-hidden rounded-2xl border border-slate-200 bg-white/95 shadow-sm"
    >
      <header className="border-b border-slate-100 bg-slate-50/50 px-4 py-3 sm:px-6">
        <h2 className="text-base font-semibold text-slate-900">{title}</h2>
        <p className="mt-1 text-xs leading-relaxed text-slate-600">{description}</p>
      </header>

      <div className="border-b border-slate-100 px-4 py-4 sm:px-6">
        <p className="mb-3 text-[11px] font-semibold uppercase tracking-wide text-slate-500">
          {filtersLabel}
        </p>
        {filters}
      </div>

      <div className="px-4 py-4 sm:px-6 sm:py-5">{children}</div>
    </section>
  );
};
