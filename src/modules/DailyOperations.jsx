import { useState } from "react";
import { ClipboardCheck, ShoppingCart } from "lucide-react";

import ModuleHero from "../components/ModuleHero.jsx";
import DailyOperationsCore from "./DailyOperationsCore.jsx";
import DailyOperationsReorder from "./DailyOperationsReorder.jsx";
import "../dailyOperationsReorder.css";

export default function DailyOperations() {
  const [workspace, setWorkspace] = useState("operations");

  return (
    <div className="dailyOpsWorkspaceShell">
      <div className="dailyOpsWorkspaceSwitcher" aria-label="Daily Operations workspace">
        <button
          type="button"
          className={workspace === "operations" ? "active" : ""}
          onClick={() => setWorkspace("operations")}
        >
          <ClipboardCheck size={17} />
          Operations
        </button>

        <button
          type="button"
          className={workspace === "reorder" ? "active" : ""}
          onClick={() => setWorkspace("reorder")}
        >
          <ShoppingCart size={17} />
          Re-Order List
        </button>
      </div>

      {workspace === "operations" ? (
        <DailyOperationsCore />
      ) : (
        <div className="dailyOpsReorderPage">
          <ModuleHero
            eyebrow="Supply workflow"
            title="Re-Order List"
            description="Create reusable supply tags, scan them when stock is getting low, and keep a live list of what still needs to be ordered."
            icon={ShoppingCart}
            accent="dailyOperations"
          />

          <DailyOperationsReorder />
        </div>
      )}
    </div>
  );
}
