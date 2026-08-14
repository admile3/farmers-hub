import { useState } from "react";
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
    </div>
  );
}