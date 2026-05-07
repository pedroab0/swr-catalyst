import { useCallback, useRef, useState } from "react";

import type { DemoToast, DemoToastVariant } from "../types";

const TOAST_TIMEOUT_MS = 3500;

export function useStatusToasts() {
  const [toasts, setToasts] = useState<DemoToast[]>([]);
  const nextIdRef = useRef(1);

  const dismissToast = useCallback((id: number) => {
    setToasts((current) => current.filter((toast) => toast.id !== id));
  }, []);

  const pushToast = useCallback(
    (variant: DemoToastVariant, message: string) => {
      const id = nextIdRef.current++;

      setToasts((current) => [...current, { id, variant, message }]);

      window.setTimeout(() => {
        dismissToast(id);
      }, TOAST_TIMEOUT_MS);
    },
    [dismissToast]
  );

  return {
    toasts,
    pushToast,
    dismissToast,
  };
}
