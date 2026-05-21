import { useEffect, useRef, useState } from "react";
import {
  Download,
  FileJson,
  Import,
  ShieldAlert,
  Upload,
  X
} from "lucide-react";
import { useAuth } from "../AuthContext.jsx";
import {
  downloadBackupFile,
  exportHubData,
  importHubData
} from "../services/hubBackupService.js";

export default function ImportExport() {
  const { user, loginWithGoogle } = useAuth();
  const fileInputRef = useRef(null);

  const [statusMessage, setStatusMessage] = useState("");
  const [statusType, setStatusType] = useState("success");
  const [importFileName, setImportFileName] = useState("");
  const [importData, setImportData] = useState(null);
  const [working, setWorking] = useState(false);

  function showStatus(message, type = "success") {
    setStatusMessage(message);
    setStatusType(type);
  }

  useEffect(() => {
    if (!statusMessage) return;

    const timer = window.setTimeout(() => {
      setStatusMessage("");
    }, 3000);

    return () => window.clearTimeout(timer);
  }, [statusMessage]);

  async function handleExport() {
    if (!user) {
      showStatus("Sign in before exporting your Hub data.", "error");
      return;
    }

    setWorking(true);

    try {
      const backup = await exportHubData(user.uid, user.email || "");
      downloadBackupFile(backup);
      showStatus("Farmers Hub backup exported.");
    } catch (error) {
      console.error(error);
      showStatus("Could not export Farmers Hub data.", "error");
    } finally {
      setWorking(false);
    }
  }

  function handleImportFile(event) {
    const file = event.target.files?.[0];

    if (!file) return;

    const reader = new FileReader();

    reader.onload = () => {
      try {
        const parsed = JSON.parse(reader.result);

        if (!parsed?.data || parsed?.app !== "Farmers Hub") {
          showStatus("That file does not look like a Farmers Hub backup.", "error");
          return;
        }

        setImportFileName(file.name);
        setImportData(parsed);
        showStatus("Backup file loaded. Review, then click Import Backup.");
      } catch (error) {
        console.error(error);
        showStatus("Could not read that backup file.", "error");
      }
    };

    reader.readAsText(file);
  }

  async function handleImport() {
    if (!user) {
      showStatus("Sign in before importing Hub data.", "error");
      return;
    }

    if (!importData) {
      showStatus("Choose a Farmers Hub backup file first.", "error");
      return;
    }

    const confirmed = window.confirm(
      "Import this backup into the currently signed-in account? Matching saved item IDs will be updated, and new items will be added."
    );

    if (!confirmed) return;

    setWorking(true);

    try {
      await importHubData(user.uid, importData);
      showStatus("Backup imported successfully.");
      setImportData(null);
      setImportFileName("");

      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    } catch (error) {
      console.error(error);
      showStatus("Could not import Farmers Hub backup.", "error");
    } finally {
      setWorking(false);
    }
  }

  function getCount(collectionName) {
    return importData?.data?.[collectionName]?.length || 0;
  }

  if (!user) {
    return (
      <div className="importExportModule">
        <section className="moduleHero compactHero">
          <div>
            <p className="eyebrow">Import / Export</p>
            <h2>Sign in to move your Farmers Hub data.</h2>
            <p>
              Export your saved tools from one account, then import them into another
              signed-in account.
            </p>
          </div>

          <button className="primaryButton" onClick={loginWithGoogle}>
            Sign in with Google
          </button>
        </section>
      </div>
    );
  }

  return (
    <div className="importExportModule">
      {statusMessage ? (
        <div className={`floatingStatus ${statusType}`}>
          <span>ⓘ</span>
          <span>{statusMessage}</span>
          <button type="button" onClick={() => setStatusMessage("")}>
            <X size={16} />
          </button>
        </div>
      ) : null}

      <section className="moduleHero compactHero noActionHero">
        <div>
          <p className="eyebrow">Import / Export</p>
          <h2>Move your Farmers Hub data between accounts.</h2>
          <p>
            Export a full backup from one signed-in account, then sign into another
            account and import the same backup file.
          </p>
        </div>
      </section>

      <section className="importExportGrid">
        <div className="workspacePanel compactPanel">
          <div className="workspaceHeader compactPanelHeader">
            <div>
              <p className="eyebrow">Export</p>
              <h3>Download Backup</h3>
            </div>

            <Download size={22} />
          </div>

          <p className="importExportText">
            This creates a JSON backup of your saved Spice Kitchen, Market Prep,
            Pricing, Permit & Grant, and Lists data for the currently signed-in account.
          </p>

          <button
            className="primaryButton compactPrimary"
            type="button"
            onClick={handleExport}
            disabled={working}
          >
            <Download size={15} />
            {working ? "Working..." : "Export Hub Data"}
          </button>
        </div>

        <div className="workspacePanel compactPanel">
          <div className="workspaceHeader compactPanelHeader">
            <div>
              <p className="eyebrow">Import</p>
              <h3>Upload Backup</h3>
            </div>

            <Upload size={22} />
          </div>

          <p className="importExportText">
            Choose a Farmers Hub backup file. Importing will add new records and update
            records with matching IDs in the currently signed-in account.
          </p>

          <input
            ref={fileInputRef}
            type="file"
            accept="application/json,.json"
            onChange={handleImportFile}
          />

          {importFileName ? (
            <div className="importFileNotice">
              <FileJson size={18} />
              <span>{importFileName}</span>
            </div>
          ) : null}

          <button
            className="primaryButton compactPrimary"
            type="button"
            onClick={handleImport}
            disabled={working || !importData}
          >
            <Import size={15} />
            {working ? "Working..." : "Import Backup"}
          </button>
        </div>
      </section>

      {importData ? (
        <section className="workspacePanel compactPanel importReviewPanel">
          <div className="workspaceHeader compactPanelHeader">
            <div>
              <p className="eyebrow">Review</p>
              <h3>Backup Contents</h3>
            </div>

            <ShieldAlert size={22} />
          </div>

          <div className="backupSummaryGrid">
            <div>
              <span>Spice Ingredients</span>
              <strong>{getCount("spiceIngredients")}</strong>
            </div>

            <div>
              <span>Spice Recipes</span>
              <strong>{getCount("spiceRecipes")}</strong>
            </div>

            <div>
              <span>Market Prep Plans</span>
              <strong>{getCount("marketPrepPlans")}</strong>
            </div>

            <div>
              <span>Pricing Sheets</span>
              <strong>{getCount("pricingCalculations")}</strong>
            </div>

            <div>
              <span>Permit / Grant Records</span>
              <strong>{getCount("permitGrantItems")}</strong>
            </div>

            <div>
              <span>Lists</span>
              <strong>{getCount("lists")}</strong>
            </div>
          </div>

          <p className="importExportText">
            Exported from: <strong>{importData.exportedFrom || "Unknown"}</strong>
            <br />
            Exported at: <strong>{importData.exportedAt || "Unknown"}</strong>
          </p>
        </section>
      ) : null}
    </div>
  );
}
