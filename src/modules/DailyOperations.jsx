import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { QRCodeSVG } from "qrcode.react";
import {
  CheckCircle2,
  ClipboardCheck,
  ShoppingCart
} from "lucide-react";

import ModuleHero from "../components/ModuleHero.jsx";
import DailyOperationsCore from "./DailyOperationsCore.jsx";
import DailyOperationsReorder from "./DailyOperationsReorder.jsx";
import "../dailyOperationsReorder.css";
import "../dailyOperationsOverrides.css";
import "../dailyOperationsQr.css";

function DailyOperationsQrPrintLayer() {
  const [target, setTarget] = useState(null);
  const [value, setValue] = useState("");

  useEffect(() => {
    function syncPrintTag() {
      const printTag = document.querySelector(".dailyOpsPrintTag");
      const code = printTag?.querySelector("code")?.textContent?.trim() || "";

      setTarget(printTag || null);
      setValue(code);
    }

    syncPrintTag();

    const observer = new MutationObserver(syncPrintTag);
    observer.observe(document.body, { childList: true, subtree: true });

    return () => observer.disconnect();
  }, []);

  if (!target || !value) return null;

  return createPortal(
    <QRCodeSVG
      className="dailyOpsQrCode"
      value={value}
      size={220}
      level="M"
      marginSize={4}
      boostLevel
      title={`QR code ${value}`}
    />,
    target
  );
}

export default function DailyOperations() {
  const [workspace, setWorkspace] = useState("operations");

  return (
    <div className="dailyOpsWorkspaceShell">
      <ModuleHero
        eyebrow="Daily workflow"
        title="Daily Operations"
        description="Run recurring routines, verify work by barcode or manually, manage supply re-orders, record readings, and see what still needs attention today."
        icon={ClipboardCheck}
        accent="dailyOperations"
      />

      <section className="dailyOpsFocusSection" aria-label="Choose Daily Operations focus">
        <div className="dailyOpsFocusHeading">
          <span />
          <strong>Choose Your Focus</strong>
          <span />
        </div>

        <div className="dailyOpsWorkspaceSwitcher">
          <button
            type="button"
            className={workspace === "operations" ? "active" : ""}
            onClick={() => setWorkspace("operations")}
            aria-pressed={workspace === "operations"}
          >
            <span className="dailyOpsFocusIcon dailyOpsFocusIconOperations">
              <ClipboardCheck size={30} />
            </span>

            <span className="dailyOpsFocusCopy">
              <strong>Operations</strong>
              <small>
                Run daily routines, complete tasks by barcode or manually, record
                readings, and track what is done or overdue.
              </small>
            </span>

            <span className="dailyOpsFocusSelection" aria-hidden="true">
              {workspace === "operations" ? <CheckCircle2 size={27} /> : <span />}
            </span>
          </button>

          <button
            type="button"
            className={workspace === "reorder" ? "active" : ""}
            onClick={() => setWorkspace("reorder")}
            aria-pressed={workspace === "reorder"}
          >
            <span className="dailyOpsFocusIcon dailyOpsFocusIconReorder">
              <ShoppingCart size={30} />
            </span>

            <span className="dailyOpsFocusCopy">
              <strong>Re-Order List</strong>
              <small>
                Scan low-stock supply tags, build a live purchasing list, and check
                items off after they have been ordered.
              </small>
            </span>

            <span className="dailyOpsFocusSelection" aria-hidden="true">
              {workspace === "reorder" ? <CheckCircle2 size={27} /> : <span />}
            </span>
          </button>
        </div>
      </section>

      <div className="dailyOpsWorkspaceContent">
        {workspace === "operations" ? (
          <DailyOperationsCore />
        ) : (
          <div className="dailyOpsReorderPage">
            <DailyOperationsReorder />
          </div>
        )}
      </div>

      <DailyOperationsQrPrintLayer />
    </div>
  );
}
