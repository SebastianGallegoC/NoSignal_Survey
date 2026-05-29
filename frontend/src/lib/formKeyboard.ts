import type { KeyboardEvent } from "react";

/**
 * Enter en el formulario de diligenciamiento: no envía el formulario y cierra el teclado
 * táctil (blur del campo activo). En textarea Enter sigue siendo salto de línea.
 */
export function handleDiligenciadoFormEnterKey(
  e: KeyboardEvent<HTMLFormElement | HTMLDivElement>,
): void {
  if (e.key !== "Enter") {
    return;
  }
  const target = e.target;
  if (target instanceof HTMLTextAreaElement) {
    return;
  }
  if (target instanceof HTMLButtonElement) {
    return;
  }
  if (
    target instanceof HTMLInputElement &&
    target.getAttribute("role") === "combobox"
  ) {
    return;
  }
  e.preventDefault();
  const active = document.activeElement;
  if (active instanceof HTMLElement) {
    active.blur();
  }
}
