import App from "@demo/App";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { SWRConfig } from "swr";
import "./styles.css";

const rootElement = document.getElementById("root");
if (!rootElement) {
  throw new Error("Root element not found.");
}

const root = createRoot(rootElement);

root.render(
  <StrictMode>
    <SWRConfig
      value={{
        dedupingInterval: 0,
        revalidateOnFocus: false,
        shouldRetryOnError: false,
      }}
    >
      <App />
    </SWRConfig>
  </StrictMode>
);
