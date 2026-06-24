import type { ReactNode } from "react";
import { ChevronDown } from "lucide-react";

import { cn } from "@/lib/utils";

interface DatosReportSectionProps {
  title: string;
  description: string;
  ariaLabel: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  filters?: ReactNode;
  filtersLabel?: string;
  children: ReactNode;
}

export const DatosReportSection = ({
  title,
  description,
  ariaLabel,
  open,
  onOpenChange,
  filters,
  filtersLabel = "Filtros de este gráfico",
  children,
}: DatosReportSectionProps) => {
  return (
    <details
      open={open}
      onToggle={(event) => {
        onOpenChange((event.currentTarget as HTMLDetailsElement).open);
      }}
      aria-label={ariaLabel}
      className="form-section-panel group mb-8"
    >
      <summary className="cursor-pointer list-none [&::-webkit-details-marker]:hidden">
        <div className="flex items-start gap-3">
          <ChevronDown
            aria-hidden
            className={cn(
              "mt-0.5 h-4 w-4 shrink-0 text-slate-500 transition-transform duration-200",
              open && "rotate-180",
            )}
          />
          <div className="min-w-0 flex-1">
            <h2 className="text-base font-semibold text-slate-900">{title}</h2>
            <p className="mt-1 text-xs leading-relaxed text-slate-600">{description}</p>
          </div>
        </div>
      </summary>

      {filters ? (
        <div className="mt-4 border-t border-slate-100 pt-4">
          <p className="mb-3 text-[11px] font-semibold uppercase tracking-wide text-slate-500">
            {filtersLabel}
          </p>
          {filters}
        </div>
      ) : null}

      <div className="mt-4 px-0 py-1 sm:py-2">{children}</div>
    </details>
  );
};
