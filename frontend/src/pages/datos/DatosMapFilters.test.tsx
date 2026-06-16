import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { DatosMapFilters } from "@/pages/datos/DatosMapFilters";

describe("DatosMapFilters", () => {
  it("permite seleccionar y limpiar municipios", () => {
    const onToggleMunicipio = vi.fn();
    const onSelectAllMunicipios = vi.fn();
    const onClearMunicipios = vi.fn();

    render(
      <DatosMapFilters
        municipioOptions={["Cúcuta", "Medellín"]}
        selectedMunicipios={["Cúcuta"]}
        fechaDesde="2026-06-01"
        fechaHasta="2026-06-30"
        onToggleMunicipio={onToggleMunicipio}
        onSelectAllMunicipios={onSelectAllMunicipios}
        onClearMunicipios={onClearMunicipios}
        onChangeFechaDesde={vi.fn()}
        onChangeFechaHasta={vi.fn()}
        onClear={vi.fn()}
      />,
    );

    fireEvent.click(screen.getByLabelText("Medellín"));
    expect(onToggleMunicipio).toHaveBeenCalledWith("Medellín");

    fireEvent.click(screen.getByRole("button", { name: /Seleccionar todos/i }));
    expect(onSelectAllMunicipios).toHaveBeenCalledTimes(1);

    fireEvent.click(screen.getByRole("button", { name: /Ninguno/i }));
    expect(onClearMunicipios).toHaveBeenCalledTimes(1);
  });
});
