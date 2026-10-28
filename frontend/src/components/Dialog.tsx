import { useEffect, useRef, type ReactNode } from "react";

interface DialogProps {
  label: string;
  onClose: () => void;
  children: ReactNode;
}

export function Dialog({ label, onClose, children }: DialogProps) {
  const dialog = useRef<HTMLDialogElement>(null);
  // Captured during the first render: StrictMode re-runs the effect after focus has already moved into the dialog.
  const opener = useRef(document.activeElement as HTMLElement | null);

  useEffect(() => {
    const el = dialog.current;
    if (el && !el.open) el.showModal();
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
      opener.current?.focus();
    };
  }, []);

  return (
    <dialog
      ref={dialog}
      className="dialog"
      aria-label={label}
      onClose={onClose}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <button className="close" onClick={onClose} aria-label="Close details">
        ×
      </button>
      <div className="dialog-body">{children}</div>
    </dialog>
  );
}
