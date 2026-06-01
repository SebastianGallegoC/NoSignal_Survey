import { describe, expect, it, vi } from "vitest";

vi.mock("@/config/submitRequirements", () => ({
  SURVEY_TESTING_RELAXED_SUBMIT: false,
}));

import type { RegistroFotoSlot } from "@/config/registroFotografico";
import type { OfflineForm } from "./db";
import { validateFormPayload, isNetworkLikeError, isHttpServerError } from "./sync";

const registroFotosCompletas = () =>
  ([1, 2, 3, 4, 5, 6] as RegistroFotoSlot[]).map((slot) => ({
    nombre_archivo: `f${slot}.jpg`,
    data: "data:image/jpeg;base64,abc",
    slot,
  }));

const baseForm = (): OfflineForm => ({
  id_formulario: "f-1",
  id_perfil_encuestador: 1,
  fecha_hora: "2026-05-04T12:00:00Z",
  gps: { latitud: 1.23, longitud: -76.5, precision: 4 },
  datos_formulario: {},
  fotos: registroFotosCompletas(),
  estado_sincronizacion: "PENDIENTE",
});

describe("validateFormPayload", () => {
  it("acepta payload válido con 6 fotos", () => {
    const errors = validateFormPayload(baseForm());
    expect(errors).toEqual([]);
  });

  it("marca error cuando la precisión GPS supera el umbral", () => {
    const form = baseForm();
    form.gps.precision = 6;
    const errors = validateFormPayload(form);
    expect(errors).toContain("gps_precision");
  });

  it("marca error cuando la precisión GPS es 0 o menor", () => {
    const form = baseForm();
    form.gps.precision = 0;
    const errors = validateFormPayload(form);
    expect(errors).toContain("gps_precision");
  });

  it("marca error cuando faltan fotos del registro", () => {
    const form = baseForm();
    form.fotos = [];
    const errors = validateFormPayload(form);
    expect(errors).toContain("fotos_count");
  });

  it("marca error cuando excede el máximo de fotos", () => {
    const form = baseForm();
    form.fotos = [
      ...registroFotosCompletas(),
      { nombre_archivo: "extra.jpg", data: "data:image/jpeg;base64,abc", slot: 1 },
    ];
    const errors = validateFormPayload(form);
    expect(errors).toContain("fotos_count");
  });

  it("marca error cuando falta algún slot obligatorio", () => {
    const form = baseForm();
    form.fotos = [{ nombre_archivo: "f1.jpg", data: "data:image/jpeg;base64,abc", slot: 1 }];
    const errors = validateFormPayload(form);
    expect(errors).toContain("fotos_slot_required");
  });
});

describe("isNetworkLikeError", () => {
  it("detecta failed to fetch", () => {
    expect(isNetworkLikeError("TypeError: Failed to fetch")).toBe(true);
  });

  it("detecta NetworkError", () => {
    expect(isNetworkLikeError("NetworkError: timeout")).toBe(true);
  });

  it("detecta net::ERR_NAME_NOT_RESOLVED", () => {
    expect(isNetworkLikeError("net::ERR_NAME_NOT_RESOLVED")).toBe(true);
  });

  it("detecta offline en el mensaje", () => {
    expect(isNetworkLikeError("The internet connection appears to be offline")).toBe(true);
  });

  it("clasifica HTTP_503 offline del service worker como error de red", () => {
    expect(isNetworkLikeError("HTTP_503: offline")).toBe(true);
  });

  it("no clasifica HTTP_500 como error de red", () => {
    expect(isNetworkLikeError("HTTP_500: Internal Server Error")).toBe(false);
  });

  it("no clasifica HTTP_502 como error de red", () => {
    expect(isNetworkLikeError("HTTP_502: Bad Gateway")).toBe(false);
  });

  it("no clasifica HTTP_400 como error de red", () => {
    expect(isNetworkLikeError("HTTP_400: Bad Request")).toBe(false);
  });

  it("maneja Error objects correctamente", () => {
    const error = new Error("Failed to fetch");
    expect(isNetworkLikeError(error)).toBe(true);
  });

  it("maneja Error HTTP_503 correctamente", () => {
    const error = new Error("HTTP_503: Service Unavailable");
    expect(isNetworkLikeError(error)).toBe(false);
  });
});

describe("isHttpServerError", () => {
  it("detecta HTTP_500", () => {
    expect(isHttpServerError("HTTP_500: Internal Server Error")).toBe(true);
  });

  it("no trata HTTP_503 offline del SW como error del servidor", () => {
    expect(isHttpServerError("HTTP_503: offline")).toBe(false);
  });

  it("detecta HTTP_503 real del backend (sin marcador offline)", () => {
    expect(isHttpServerError("HTTP_503: Service Unavailable")).toBe(true);
  });

  it("detecta HTTP_502", () => {
    expect(isHttpServerError("HTTP_502: Bad Gateway")).toBe(true);
  });

  it("detecta HTTP_504", () => {
    expect(isHttpServerError("HTTP_504: Gateway Timeout")).toBe(true);
  });

  it("no detecta HTTP_400 como servidor error", () => {
    expect(isHttpServerError("HTTP_400: Bad Request")).toBe(false);
  });

  it("no detecta HTTP_404 como servidor error", () => {
    expect(isHttpServerError("HTTP_404: Not Found")).toBe(false);
  });

  it("no detecta errores de red", () => {
    expect(isHttpServerError("Failed to fetch")).toBe(false);
  });

  it("maneja Error objects correctamente", () => {
    const error = new Error("HTTP_503: Service Unavailable");
    expect(isHttpServerError(error)).toBe(true);
  });
});
