import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { FormularioRespuestaReadOnly } from "@/components/form/FormularioRespuestaReadOnly";

describe("FormularioRespuestaReadOnly — encuestador", () => {
  it("muestra solo el nombre del perfil aunque no esté en datos_formulario", () => {
    render(
      <FormularioRespuestaReadOnly
        snapshot={{
          id_perfil_encuestador: 2,
          encuestador_perfil_nombre: "María López",
          datos_formulario: {
            nombres_apellidos_encuestado: "Juan Beneficiario",
          },
          gps: null,
          fotos: [],
        }}
      />,
    );

    expect(screen.getByText("Encuestador")).toBeInTheDocument();
    expect(screen.getByText("María López")).toBeInTheDocument();
    expect(screen.queryByText("ID de perfil relacionado: 2")).not.toBeInTheDocument();
  });

  it("muestra guión en encuestador sin perfil asignado", () => {
    render(
      <FormularioRespuestaReadOnly
        snapshot={{
          id_perfil_encuestador: null,
          datos_formulario: {
            nombres_apellidos_encuestado: "Juan Beneficiario",
          },
          gps: null,
          fotos: [],
        }}
      />,
    );

    const encuestadorSection = screen.getByText("Encuestador").closest("details");
    expect(encuestadorSection).toBeTruthy();
    expect(encuestadorSection?.textContent).toContain("—");
  });

  it("agrupa fotos en un bloque retraído por defecto", () => {
    render(
      <FormularioRespuestaReadOnly
        snapshot={{
          datos_formulario: { nombres_apellidos_encuestado: "Juan" },
          gps: null,
          fotos: [
            {
              nombre_archivo: "f1.jpg",
              data: "data:image/jpeg;base64,abc",
              slot: 1,
            },
          ],
        }}
      />,
    );

    const group = screen.getByText("Registro fotográfico (1)").closest("details");
    expect(group).toBeTruthy();
    expect((group as HTMLDetailsElement).open).toBe(false);
  });
});
