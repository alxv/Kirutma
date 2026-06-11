import { StrictMode, useEffect } from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";

function Root() {
  useEffect(() => {
    const blockNativeMenu = (event: MouseEvent) => {
      const target = event.target as HTMLElement | null;
      if (target?.closest("[data-allow-native-menu='true']")) return;
      event.preventDefault();
    };
    document.addEventListener("contextmenu", blockNativeMenu);
    return () => document.removeEventListener("contextmenu", blockNativeMenu);
  }, []);

  return <App />;
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <Root />
  </StrictMode>,
);
