import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";

const UnsavedChangesContext = createContext(null);

export function UnsavedChangesProvider({ children }) {
  const [isDirty, setIsDirty] = useState(false);
  const [source, setSource] = useState("");
  const [saveHandler, setSaveHandler] = useState(null);
  const [pendingNavigation, setPendingNavigation] = useState("");

  const markUnsaved = useCallback(({ source = "this page", onSave = null } = {}) => {
    setIsDirty(true);
    setSource(source);

    if (onSave) {
      setSaveHandler(() => onSave);
    }
  }, []);

  const markSaved = useCallback(() => {
    setIsDirty(false);
    setSource("");
    setSaveHandler(null);
    setPendingNavigation("");
  }, []);

  const requestNavigation = useCallback((to) => {
    setPendingNavigation(to);
  }, []);

  const cancelNavigation = useCallback(() => {
    setPendingNavigation("");
  }, []);

  const leaveWithoutSaving = useCallback(() => {
    const target = pendingNavigation;

    setIsDirty(false);
    setSource("");
    setSaveHandler(null);
    setPendingNavigation("");

    return target;
  }, [pendingNavigation]);

  const saveAndContinue = useCallback(async () => {
    const target = pendingNavigation;

    if (saveHandler) {
      await saveHandler();
    }

    setIsDirty(false);
    setSource("");
    setSaveHandler(null);
    setPendingNavigation("");

    return target;
  }, [pendingNavigation, saveHandler]);

  useEffect(() => {
    function handleBeforeUnload(event) {
      if (!isDirty) return;

      event.preventDefault();
      event.returnValue = "";
    }

    window.addEventListener("beforeunload", handleBeforeUnload);

    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [isDirty]);

  const value = useMemo(
    () => ({
      isDirty,
      source,
      sourceName: source,
      saveHandler,
      pendingNavigation,
      markUnsaved,
      markSaved,
      requestNavigation,
      cancelNavigation,
      leaveWithoutSaving,
      saveAndContinue
    }),
    [
      isDirty,
      source,
      saveHandler,
      pendingNavigation,
      markUnsaved,
      markSaved,
      requestNavigation,
      cancelNavigation,
      leaveWithoutSaving,
      saveAndContinue
    ]
  );

  return (
    <UnsavedChangesContext.Provider value={value}>
      {children}
    </UnsavedChangesContext.Provider>
  );
}

export function useUnsavedChanges() {
  const context = useContext(UnsavedChangesContext);

  if (!context) {
    throw new Error("useUnsavedChanges must be used within an UnsavedChangesProvider");
  }

  return context;
}
