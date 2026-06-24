import {
  Cell,
  Legend,
  Pie,
  PieChart,
  Tooltip,
} from "recharts";

import {
  CUMPLE_DETALLE_CARD_CLASSES,
  CUMPLE_DETALLE_COLORS,
  CUMPLE_DETALLE_LABELS,
} from "@/constants/validationStatsFilter";
import { ResponsiveChartBox } from "@/pages/datos/ResponsiveChartBox";
import type { FormStatsCumpleDetalle, FormStatsResponse } from "@/services/api";

const RESUMEN_COLORS = {
  cumple: "#0d9488",
  no_cumple: "#e11d48",
  sin_resultado: "#94a3b8",
} as const;

type ChartSlice = {
  name: string;
  value: number;
  key: string;
  color: string;
};

function buildResumenChartData(stats: FormStatsResponse): ChartSlice[] {
  return [
    { name: "Cumple", value: stats.cumple, key: "cumple", color: RESUMEN_COLORS.cumple },
    {
      name: "No cumple",
      value: stats.no_cumple,
      key: "no_cumple",
      color: RESUMEN_COLORS.no_cumple,
    },
    {
      name: "Sin resultado",
      value: stats.sin_resultado,
      key: "sin_resultado",
      color: RESUMEN_COLORS.sin_resultado,
    },
  ].filter((entry) => entry.value > 0);
}

function buildCumpleDetalleChartData(
  detalle: FormStatsCumpleDetalle,
): ChartSlice[] {
  return (
    Object.keys(CUMPLE_DETALLE_LABELS) as Array<keyof FormStatsCumpleDetalle>
  )
    .map((key) => ({
      name: CUMPLE_DETALLE_LABELS[key],
      value: detalle[key],
      key,
      color: CUMPLE_DETALLE_COLORS[key],
    }))
    .filter((entry) => entry.value > 0);
}

function StatsPieChart({
  chartData,
  total,
  ariaLabel,
}: {
  chartData: ChartSlice[];
  total: number;
  ariaLabel: string;
}) {
  return (
    <ResponsiveChartBox className="h-64 min-h-[16rem]" aria-label={ariaLabel}>
      {(size) => (
        <PieChart width={size.width} height={size.height}>
          <Pie
            data={chartData}
            dataKey="value"
            nameKey="name"
            cx="50%"
            cy="50%"
            innerRadius="52%"
            outerRadius="78%"
            paddingAngle={chartData.length > 1 ? 2 : 0}
          >
            {chartData.map((entry) => (
              <Cell key={entry.key} fill={entry.color} />
            ))}
          </Pie>
          <Tooltip
            formatter={(value, name) => {
              const n = typeof value === "number" ? value : Number(value ?? 0);
              const pct = total > 0 ? Math.round((n / total) * 100) : 0;
              return [`${n} (${pct}%)`, String(name ?? "")];
            }}
          />
          <Legend />
        </PieChart>
      )}
    </ResponsiveChartBox>
  );
}

function StatCard({
  label,
  value,
  className,
}: {
  label: string;
  value: number;
  className: string;
}) {
  return (
    <div className={`rounded-lg border px-3 py-2 ${className}`}>
      <dt className="text-xs font-medium uppercase tracking-wide">{label}</dt>
      <dd className="text-2xl font-semibold">{value}</dd>
    </div>
  );
}

interface ValidationStatsChartProps {
  stats: FormStatsResponse;
}

export const ValidationStatsChart = ({ stats }: ValidationStatsChartProps) => {
  if (stats.total === 0) {
    return (
      <p className="rounded-xl border border-dashed border-slate-200 bg-slate-50/80 px-4 py-8 text-center text-sm text-slate-600">
        No hay formularios sincronizados que coincidan con los filtros seleccionados.
      </p>
    );
  }

  if (stats.vista === "no_cumple") {
    return (
      <div className="grid min-w-0 gap-4 lg:grid-cols-[1fr_minmax(12rem,16rem)] lg:items-center">
        <div className="flex h-64 min-h-[16rem] items-center justify-center rounded-xl border border-rose-100 bg-rose-50/50">
          <div className="text-center">
            <p className="text-sm font-medium text-rose-800">No cumplen</p>
            <p className="mt-2 text-5xl font-semibold text-rose-900">{stats.no_cumple}</p>
            <p className="mt-2 text-xs text-rose-700">formularios en el período filtrado</p>
          </div>
        </div>
        <dl className="grid grid-cols-1 gap-3 text-sm">
          <StatCard
            label="No cumple"
            value={stats.no_cumple}
            className="border-rose-100 bg-rose-50/60 text-rose-900"
          />
          <StatCard
            label="Total"
            value={stats.total}
            className="border-slate-200 bg-white text-slate-900"
          />
        </dl>
      </div>
    );
  }

  if (stats.vista === "cumple_detalle" && stats.cumple_detalle) {
    const chartData = buildCumpleDetalleChartData(stats.cumple_detalle);
    return (
      <div className="grid min-w-0 gap-4 lg:grid-cols-[1fr_minmax(12rem,16rem)] lg:items-center">
        <StatsPieChart
          chartData={chartData}
          total={stats.total}
          ariaLabel={`Gráfico de formularios que cumplen por tipo de servicio de energía, total ${stats.total}`}
        />
        <dl className="grid grid-cols-1 gap-3 text-sm">
          {chartData.map((entry) => (
            <StatCard
              key={entry.key}
              label={entry.name}
              value={entry.value}
              className={
                CUMPLE_DETALLE_CARD_CLASSES[
                  entry.key as keyof typeof CUMPLE_DETALLE_LABELS
                ]
              }
            />
          ))}
          <StatCard
            label="Total"
            value={stats.total}
            className="border-slate-200 bg-slate-100 text-slate-900"
          />
        </dl>
      </div>
    );
  }

  const chartData = buildResumenChartData(stats);

  return (
    <div className="grid min-w-0 gap-4 lg:grid-cols-[1fr_minmax(12rem,16rem)] lg:items-center">
      <StatsPieChart
        chartData={chartData}
        total={stats.total}
        ariaLabel={`Gráfico de validación: ${stats.cumple} cumple, ${stats.no_cumple} no cumple, ${stats.sin_resultado} sin resultado`}
      />
      <dl className="grid grid-cols-2 gap-3 text-sm lg:grid-cols-1">
        <StatCard
          label="Cumple"
          value={stats.cumple}
          className="border-teal-100 bg-teal-50/60 text-teal-900"
        />
        <StatCard
          label="No cumple"
          value={stats.no_cumple}
          className="border-rose-100 bg-rose-50/60 text-rose-900"
        />
        <StatCard
          label="Sin resultado"
          value={stats.sin_resultado}
          className="border-slate-200 bg-slate-50/80 text-slate-900"
        />
        <StatCard
          label="Total"
          value={stats.total}
          className="border-slate-200 bg-white text-slate-900"
        />
      </dl>
    </div>
  );
};
