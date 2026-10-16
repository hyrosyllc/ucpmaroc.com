// Entry for the sandboxed theme preview (loaded in an iframe with sandbox="allow-scripts", so its origin is opaque).
// It deliberately skips the app shell: no i18n, auth listeners or analytics, only the preview and sample data.
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { MemoryRouter } from "react-router-dom";
import "../index.css";
import StudioPreview from "@/features/theme-studio/pages/StudioPreview";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <MemoryRouter>
      <StudioPreview />
    </MemoryRouter>
  </StrictMode>
);
