import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";

const UnsavedChangesContext = createContext(null);

export function UnsavedChangesProvider({ children }) {
  const [isDirty, setIsDirty] = useState(false);
  const [sourceName, setSourceName] = useState("");
  const [saveHandler, setSaveHandler] = useState(null);

  const markUnsaved = useCallback(({ source = "this page", onSave = null } = {}) => {
    setIsDirty(true);
    setSourceName(source);
    if (onSave) {
      setSaveHandler(() => onSave);
    }
  }, []);

  const markSaved = useCallback(() => {
    setIsDirty(false);
    setSourceName("");
    setSaveHandler(null);
  }, []);

  const value = useMemo(
    () => ({
      isDirty,
      sourceName,
      saveHandler,
      markUnsaved,
      markSaved
    }),
    [isDirty, sourceName, saveHandler, markUnsaved, markSaved]
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

export function UnsavedChangesGuard() {
  const { isDirty, sourceName, saveHandler, markSaved } = useUnsavedChanges();
  const [pendingPath, setPendingPath] = useState("");
  const [saving, setSaving] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    function handleBeforeUnload(event) {
      if (!isDirty) return;

      event.preventDefault();
      event.returnValue = "";
    }

    window.addEventListener("beforeunload", handleBeforeUnload);

    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [isDirty]);

  useEffect(() => {
    function handleDocumentClick(event) {
      if (!isDirty) return;
      if (event.defaultPrevented) return;
      if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;

      const anchor = event.target.closest?.("a[href]");
      if (!anchor) return;
      if (anchor.target && anchor.target !== "_self") return;
      if (anchor.hasAttribute("download")) return;

      const url = new URL(anchor.href, window.location.origin);
      if (url.origin !== window.location.origin) return;

      const nextPath = `${url.pathname}${url.search}${url.hash}`;
      const currentPath = `${location.pathname}${location.search}${location.hash}`;

      if (nextPath === currentPath) return;

      event.preventDefault();
      setPendingPath(nextPath);
    }

    document.addEventListener("click", handleDocumentClick, true);

    return () => document.removeEventListener("click", handleDocumentClick, true);
  }, [isDirty, location.pathname, location.search, location.hash]);

  async function saveAndLeave() {
    if (!pendingPath || !saveHandler) return;

    setSaving(true);

    try {
      await saveHandler();
      markSaved();
      const target = pendingPath;
      setPendingPath("");
      navigate(target);
    } catch (error) {
      console.error("Could not save before leaving:", error);
      alert("Could not save changes. Please try saving again before leaving.");
    } finally {
      setSaving(false);
    }
  }

  function leaveWithoutSaving() {
    const target = pendingPath;
    markSaved();
    setPendingPath("");
    navigate(target);
  }

  if (!pendingPath) return null;

  return (
    <div className="unsavedChangesOverlay" role="dialog" aria-modal="true">
      <div className="unsavedChangesModal">
        <p className="eyebrow">Unsaved changes</p>
        <h2>Save your changes before leaving?</h2>
        <p>
          You have unsaved changes in {sourceName || "this page"}. Save them before
          switching pages, or leave without saving.
        </p>

        <div className="button-row unsavedChangesActions">
          <button
            className="secondaryButton"
            type="button"
            onClick={() => setPendingPath("")}
            disabled={saving}
          >
            Stay Here
          </button>

          <button
            className="secondaryButton dangerButton"
            type="button"
            onClick={leaveWithoutSaving}
            disabled={saving}
          >
            Leave Without Saving
          </button>

          <button
            className="primaryButton"
            type="button"
            onClick={saveAndLeave}
            disabled={saving || !saveHandler}
          >
            {saving ? "Saving..." : "Save Changes"}
          </button>
        </div>
      </div>
    </div>
  );
}
