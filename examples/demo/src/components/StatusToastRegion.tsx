import type { DemoToast } from "../types";

type StatusToastRegionProps = {
  toasts: DemoToast[];
  onDismiss: (id: number) => void;
};

export function StatusToastRegion({
  toasts,
  onDismiss,
}: StatusToastRegionProps) {
  if (toasts.length === 0) {
    return null;
  }

  return (
    <div aria-live="polite" className="toastRegion">
      {toasts.map((toast) => (
        <article className={`toast toast-${toast.variant}`} key={toast.id}>
          <p>{toast.message}</p>
          <button onClick={() => onDismiss(toast.id)} type="button">
            Dismiss
          </button>
        </article>
      ))}
    </div>
  );
}
