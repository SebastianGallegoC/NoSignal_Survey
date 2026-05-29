import { describe, expect, it } from "vitest";

import {
  GMS_DATOS_KEYS,
  stripGmsKeysFromDatos,
} from "./stripGmsFromDatos";

describe("stripGmsKeysFromDatos", () => {
  it("elimina las seis claves GMS y conserva el resto", () => {
    const datos = {
      latitud: "4.6",
      longitud: "-74.0",
      metros_sobre_nivel_mar: "2600",
      x_grados: "73",
      x_minutos: "17",
      x_segundos: "47",
      y_grados: "8",
      y_minutos: "19",
      y_segundos: "11",
      entidad_aportante: "CENS",
    };
    const out = stripGmsKeysFromDatos(datos);
    for (const k of GMS_DATOS_KEYS) {
      expect(out).not.toHaveProperty(k);
    }
    expect(out.latitud).toBe("4.6");
    expect(out.metros_sobre_nivel_mar).toBe("2600");
    expect(out.entidad_aportante).toBe("CENS");
  });

  it("devuelve objeto vacío si datos es null/undefined", () => {
    expect(stripGmsKeysFromDatos(null)).toEqual({});
    expect(stripGmsKeysFromDatos(undefined)).toEqual({});
  });
});
