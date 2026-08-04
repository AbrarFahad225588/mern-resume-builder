import { createContext, useContext } from "react";

// The context object and its hook live outside ResumeContex.jsx on purpose:
// Vite's Fast Refresh only works when a module exports components exclusively,
// so keeping these non-component exports here lets the provider file hot-reload
// instead of forcing a full page refresh on every edit.
export const ResumeContext = createContext(null);

export const useResume = () => {
  const context = useContext(ResumeContext);
  if (!context) {
    // Far easier to diagnose than the "cannot read property of null" that
    // would otherwise surface deep inside whichever component called this.
    throw new Error("useResume must be used within a <ResumeProvider>");
  }
  return context;
};
