import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { DatosReportSection } from "@/pages/datos/DatosReportSection";

describe("DatosReportSection", () => {
  it("permite retraer y desplegar el contenido", () => {
    const onOpenChange = vi.fn();

    render(
      <DatosReportSection
        ariaLabel="Sección de prueba"
        title="Título de prueba"
        description="Descripción de prueba"
        open
        onOpenChange={onOpenChange}
        filters={<p>Filtros</p>}
      >
        <p>Contenido del gráfico</p>
      </DatosReportSection>,
    );

    expect(screen.getByText("Contenido del gráfico")).toBeVisible();

    const details = screen.getByLabelText("Sección de prueba") as HTMLDetailsElement;
    details.open = false;
    fireEvent(details, new Event("toggle", { bubbles: true }));
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it("muestra el título aunque la sección esté retraída", () => {
    render(
      <DatosReportSection
        ariaLabel="Sección de prueba"
        title="Gráfico mensual"
        description="Descripción"
        open={false}
        onOpenChange={vi.fn()}
        filters={<p>Filtros</p>}
      >
        <p>Contenido oculto</p>
      </DatosReportSection>,
    );

    expect(screen.getByText("Gráfico mensual")).toBeInTheDocument();
    expect(
      (screen.getByLabelText("Sección de prueba") as HTMLDetailsElement).open,
    ).toBe(false);
  });
});
