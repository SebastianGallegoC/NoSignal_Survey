import { useEffect } from "react";

import { Button } from "@/components/ui/button";

type Props = {
  open: boolean;
  username: string;
  confirming?: boolean;
  onCancel: () => void;
  onConfirm: () => void;
};

export function ConfirmDeleteUserModal({
  open,
  username,
  confirming = false,
  onCancel,
  onConfirm,
}: Props) {
  useEffect(() => {
    if (!open) {
      return;
    }
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  useEffect(() => {
    if (!open || confirming) {
      return;
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onCancel();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, confirming, onCancel]);

  if (!open) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4" role="presentation">
      <button
        type="button"
        className="absolute inset-0 bg-slate-900/45 backdrop-blur-[1px]"
        aria-label="Cerrar"
        disabled={confirming}
        onClick={() => {
          if (!confirming) {
            onCancel();
          }
        }}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="confirm-delete-user-title"
        className="relative z-10 w-full max-w-md rounded-2xl border border-rose-200 bg-white p-6 shadow-xl ring-1 ring-rose-100"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 id="confirm-delete-user-title" className="text-lg font-semibold text-slate-900">
          ¿Eliminar usuario?
        </h2>
        <p className="mt-3 text-sm leading-relaxed text-slate-600">
          Se eliminará permanentemente la cuenta de <strong>{username}</strong>. Esta acción no se
          puede deshacer.
        </p>
        <div className="mt-6 flex flex-wrap justify-end gap-2">
          <Button type="button" variant="outline" disabled={confirming} onClick={onCancel}>
            Cancelar
          </Button>
          <Button
            type="button"
            disabled={confirming}
            onClick={onConfirm}
            className="border-rose-200 bg-rose-700 text-white hover:bg-rose-800"
          >
            {confirming ? "Eliminando…" : "Eliminar"}
          </Button>
        </div>
      </div>
    </div>
  );
}
