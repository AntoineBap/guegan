import React, { useCallback, useEffect, useRef, useState } from "react";

// Petite notification non bloquante, à la place des alert()
const useToast = () => {
  const [toast, setToast] = useState(null);
  const timer = useRef(null);

  const show = useCallback((message, type = "info") => {
    clearTimeout(timer.current);
    setToast({ message, type });
    timer.current = setTimeout(() => setToast(null), 3500);
  }, []);

  useEffect(() => () => clearTimeout(timer.current), []);

  const node = toast ? (
    <div className={`toast ${toast.type === "error" ? "is-error" : ""}`} role="status">
      {toast.message}
    </div>
  ) : null;

  return [show, node];
};

export default useToast;
