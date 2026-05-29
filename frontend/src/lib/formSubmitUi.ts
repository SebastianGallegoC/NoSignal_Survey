/** Texto y habilitación del botón principal de guardar/actualizar en FormularioPage. */
export function getFormSubmitButtonState(
  isEditMode: boolean,
  hasEditChanges: boolean,
  enviando: boolean,
): {
  label: string;
  disabled: boolean;
  showNoChangesHint: boolean;
} {
  const disabled = enviando || (isEditMode && !hasEditChanges);
  const label = enviando
    ? isEditMode
      ? "Actualizando…"
      : "Guardando…"
    : isEditMode
      ? "Actualizar"
      : "Guardar / enviar";
  return {
    label,
    disabled,
    showNoChangesHint: isEditMode && !hasEditChanges && !enviando,
  };
}
