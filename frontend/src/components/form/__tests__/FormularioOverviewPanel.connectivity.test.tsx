import { act } from "react";
import { createRoot } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mockUseConnectivityStatus = vi.hoisted(() => vi.fn());

vi.mock("@/hooks/useConnectivityStatus", () => ({
  useConnectivityStatus: () => mockUseConnectivityStatus(),
}));

vi.mock("@/components/map/LocationPreviewMap", () => ({
  LocationPreviewMap: ({
    gps,
  }: {
    gps: { latitud: number; longitud: number };
  }) => (
    <div data-testid="location-preview-map">
      {gps.latitud},{gps.longitud}
    </div>
  ),
}));

import { FormularioOverviewPanel } from "../FormularioOverviewPanel";

const defaultProps = {
  estado: "idle" as const,
  progreso: null,
  gps: { latitud: 1, longitud: 2, precision: 5 },
  error: null,
  cargando: false,
  onSolicitarGps: vi.fn(),
  modoCoordenadas: "automatico" as const,
  onChangeModoCoordenadas: vi.fn(),
  buildExternalMapUrl: (lat: number, lon: number) =>
    `https://osm/${lat},${lon}`,
};

describe("FormularioOverviewPanel connectivity", () => {
  beforeEach(() => {
    mockUseConnectivityStatus.mockReset();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it("muestra el mapa embebido también offline", async () => {
    mockUseConnectivityStatus.mockReturnValue(false);

    const container = document.createElement("div");
    document.body.appendChild(container);
    const root = createRoot(container);

    await act(async () => {
      root.render(<FormularioOverviewPanel {...defaultProps} />);
    });

    expect(container.querySelector('[data-testid="location-preview-map"]')).not
      .toBeNull();
    expect(container.querySelector("iframe")).toBeNull();

    act(() => {
      root.unmount();
    });
    container.remove();
  });

  it("cuando está online deshabilita el enlace externo si offline", async () => {
    mockUseConnectivityStatus.mockReturnValue(true);

    const container = document.createElement("div");
    document.body.appendChild(container);
    const root = createRoot(container);

    await act(async () => {
      root.render(<FormularioOverviewPanel {...defaultProps} />);
    });

    const link = container.querySelector("a");
    expect(link?.textContent).toContain("Abrir ubicación en OpenStreetMap");
    expect(link?.getAttribute("href")).toBe("https://osm/1,2");

    act(() => {
      root.unmount();
    });
    container.remove();
  });

  it("offline bloquea el enlace externo a OSM", async () => {
    mockUseConnectivityStatus.mockReturnValue(false);

    const container = document.createElement("div");
    document.body.appendChild(container);
    const root = createRoot(container);

    await act(async () => {
      root.render(<FormularioOverviewPanel {...defaultProps} />);
    });

    const link = container.querySelector("a");
    expect(link?.textContent).toContain("Abrir ubicación (requiere conexión)");
    expect(link?.getAttribute("href")).toBeNull();

    act(() => {
      root.unmount();
    });
    container.remove();
  });
});
