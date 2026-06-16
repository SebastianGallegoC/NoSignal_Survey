import { render, screen } from "@testing-library/react";
import type { ReactNode } from "react";
import { describe, expect, it, vi } from "vitest";

vi.mock("react-leaflet", () => ({
  MapContainer: ({ children }: { children: ReactNode }) => (
    <div data-testid="map-container">{children}</div>
  ),
  TileLayer: () => <div data-testid="tile-layer" />,
  useMap: () => ({
    addLayer: vi.fn(),
    removeLayer: vi.fn(),
    setView: vi.fn(),
    fitBounds: vi.fn(),
  }),
}));

import { FormulariosMapView } from "@/pages/datos/FormulariosMapView";

describe("FormulariosMapView", () => {
  it("muestra mensaje cuando no hay municipios seleccionados", () => {
    render(
      <FormulariosMapView
        points={[]}
        total={0}
        loadState="needs_municipios"
        error={null}
        onRetry={vi.fn()}
      />,
    );
    expect(
      screen.getByText(/Seleccioná al menos un municipio/i),
    ).toBeInTheDocument();
  });

  it("muestra estado vacío cuando no hay puntos", () => {
    render(
      <FormulariosMapView
        points={[]}
        total={0}
        loadState="ready"
        error={null}
        onRetry={vi.fn()}
      />,
    );
    expect(
      screen.getByText(/No hay formularios con coordenadas válidas/i),
    ).toBeInTheDocument();
  });
});
