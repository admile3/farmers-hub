import { useEffect, useMemo, useRef, useState } from "react";
import {
  CreditCard,
  Download,
  ExternalLink,
  FileJson,
  Import,
  LayoutDashboard,
  LifeBuoy,
  LogOut,
  Save,
  Settings2,
  Shield,
  ShieldAlert,
  Sparkles,
  Trash2,
  Upload,
  User,
  X
} from "lucide-react";
import { useAuth } from "../AuthContext.jsx";
import { updateAccountProfile } from "../services/accountService.js";
import {
  downloadBackupFile,
  exportHubData,
  importHubData
} from "../services/hubBackupService.js";

const defaultSettings = {
  dashboardDensity: "comfortable"
};

function formatStatus(status) {
  if (!status) return "Unknown";
  return status.charAt(0).toUpperCase() + status.slice(1);
}

function formatDate(value) {
  if (!value) return "Not available";

  const date = value.toDate ? value.toDate() : new Date(value);
  if (Number.isNaN(date.getTime())) return "Not available";

  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric"
  });
}

function getAccountInitial(user, displayName) {
  return (displayName || user?.email || "U").charAt(0).toUpperCase();
}

export default function AccountSettings() {
  const {
    user,
    accountProfile,
    accessStatus,
    daysRemaining,
    refreshAccountProfile,
    logout
  } = useAuth();

  const fileInputRef = useRef(null);

  const [saving, setSaving] = useState(false);
  const [billingLoading, setBillingLoading] = useState(false);
  const [backupWorking, setBackupWorking] = useState(false);
  const [displayName, setDisplayName] = useState("");
  const [settings, setSettings] = useState(defaultSettings);
  const [savedSnapshot, setSavedSnapshot] = useState("");
  const [statusMessage, setStatusMessage] = useState("");
  const [statusType, setStatusType] = useState("success");
  const [importFileName, setImportFileName] = useState("");
  const [importData, setImportData] = useState(null);

  const currentSnapshot = useMemo(
    () =>
      JSON.stringify({
        displayName,
        settings
      }),
    [displayName, settings]
  );

  const hasUnsavedChanges = savedSnapshot && currentSnapshot !== savedSnapshot;

  const accountStatusText = useMemo(() => {
    const baseStatus = formatStatus(accessStatus?.status);

    if (accessStatus?.isTrial) {
      return `${baseStatus}, ${daysRemaining} days remaining`;
    }

    return baseStatus;
  }, [accessStatus, daysRemaining]);

  const accountMeta = useMemo(() => {
    return [
      {
        label: "Email",
        value: user?.email || "Not set"
      },
      {
        label: "Access",
        value: accountStatusText
      },
      {
        label: "Plan",
        value:
          accountProfile?.subscriptionPlan ||
          accountProfile?.plan ||
          (accessStatus?.isTrial ? "Trial" : "Not selected")
      },
      {
        label: "Member Since",
        value: formatDate(accountProfile?.createdAt || user?.metadata?.creationTime)
      }
    ];
  }, [user, accountProfile, accessStatus, accountStatusText]);

  useEffect(() => {
    const nextDisplayName = accountProfile?.displayName || user?.displayName || "";
    const nextSettings = {
      ...defaultSettings,
      ...(accountProfile?.settings || {})
    };

    setDisplayName(nextDisplayName);
    setSettings(nextSettings);
    setSavedSnapshot(
      JSON.stringify({
        displayName: nextDisplayName,
        settings: nextSettings
      })
    );
  }, [accountProfile, user]);

  useEffect(() => {
    if (!statusMessage) return undefined;

    const timer = window.setTimeout(() => {
      setStatusMessage("");
    }, 3000);

    return () => window.clearTimeout(timer);
  }, [statusMessage]);

  useEffect(() => {
    function handleBeforeUnload(event) {
      if (!hasUnsavedChanges) return;

      event.preventDefault();
      event.returnValue = "";
    }

    window.addEventListener("beforeunload", handleBeforeUnload);

    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [hasUnsavedChanges]);

  useEffect(() => {
    function handleClick(event) {
      if (!hasUnsavedChanges) return;

      const link = event.target.closest("a");

      if (!link || !link.href) return;

      const isSameOrigin = link.origin === window.location.origin;

      if (!isSameOrigin) return;

      const confirmed = window.confirm(
        "You have unsaved account changes. Leave without saving?"
      );

      if (!confirmed) {
        event.preventDefault();
      }
    }

    document.addEventListener("click", handleClick, true);

    return () => document.removeEventListener("click", handleClick, true);
  }, [hasUnsavedChanges]);

  function showStatus(message, type = "success") {
    setStatusMessage(message);
    setStatusType(type);
  }

  function updateSetting(field, value) {
    setSettings((current) => ({
      ...current,
      [field]: value
    }));
  }

  function getCount(collectionName) {
    return importData?.data?.[collectionName]?.length || 0;
  }

  async function saveSettings() {
    if (!user) return;

    setSaving(true);

    try {
      await updateAccountProfile(user.uid, {
        displayName,
        settings
      });

      await refreshAccountProfile();

      setSavedSnapshot(
        JSON.stringify({
          displayName,
          settings
        })
      );

      showStatus("Account settings saved.");
    } catch (error) {
      console.error(error);
      showStatus("Could not save account settings.", "error");
    } finally {
      setSaving(false);
    }
  }

  async function handleExportHubData() {
    if (!user) {
      showStatus("Sign in before exporting your Hub data.", "error");
      return;
    }

    setBackupWorking(true);

    try {
      const backup = await exportHubData(user.uid, user.email || "");
      downloadBackupFile(backup);
      showStatus("Farmers Hub backup exported.");
    } catch (error) {
      console.error(error);
      showStatus("Could not export Farmers Hub data.", "error");
    } finally {
      setBackupWorking(false);
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
        showStatus("Backup file loaded. Review it, then click Import Backup.");
      } catch (error) {
        console.error(error);
        showStatus("Could not read that backup file.", "error");
      }
    };

    reader.readAsText(file);
  }

  async function handleImportHubData() {
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

    setBackupWorking(true);

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
      setBackupWorking(false);
    }
  }

  async function openBillingPortal() {
    if (!user?.email) {
      showStatus("Please sign in before managing billing.", "error");
      return;
    }

    setBillingLoading(true);

    try {
      const response = await fetch("/api/create-billing-portal-session", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          email: user.email
        })
      });

      const data = await response.json();

      if (!response.ok || !data.url) {
        console.error(data);
        showStatus("Could not open billing portal.", "error");
        return;
      }

      window.location.href = data.url;
    } catch (error) {
      console.error(error);
      showStatus("Could not open billing portal.", "error");
    } finally {
      setBillingLoading(false);
    }
  }

  function openPlanSelection() {
    window.location.href = "/subscribe";
  }

  async function requestAccountDeletion() {
    const confirmed = window.confirm(
      "This will mark your account for deletion. You should export your data first. Continue?"
    );

    if (!confirmed || !user) return;

    try {
      await updateAccountProfile(user.uid, {
        deletionRequestedAt: new Date().toISOString(),
        deletionRequested: true
      });

      showStatus("Your account has been marked for deletion.");
      await logout();
    } catch (error) {
      console.error(error);
      showStatus("Could not request account deletion.", "error");
    }
  }

  return (
    <div className="modulePage accountSettingsPage accountSettingsV2">
      {statusMessage ? (
        <div className={`floatingStatus ${statusType}`}>
          <span>ⓘ</span>
          <span>{statusMessage}</span>
          <button type="button" onClick={() => setStatusMessage("")}>
            <X size={16} />
          </button>
        </div>
      ) : null}

      <section className="accountSettingsHeroPanel accountSettingsHeroCompact">
        <div>
          <p className="eyebrow">Account Settings</p>
          <h2>Manage your account.</h2>
          <p>
            Update your profile, plan, dashboard preferences, backups, and account controls.
          </p>

          {hasUnsavedChanges ? (
            <p className="unsavedNotice">You have unsaved changes.</p>
          ) : null}
        </div>

        <button
          className={`primaryButton accountSettingsHeroSave ${
            hasUnsavedChanges ? "dirtySaveButton" : ""
          }`}
          type="button"
          onClick={saveSettings}
          disabled={saving}
        >
          <Save size={18} />
          {saving ? "Saving..." : hasUnsavedChanges ? "Save Changes" : "Save Settings"}
        </button>
      </section>

      <section className="accountSettingsTopGrid">
        <div className="workspacePanel accountProfileCard">
          <div className="accountProfileHeader">
            {user?.photoURL ? (
              <img src={user.photoURL} alt={displayName || user?.email || "Account"} />
            ) : (
              <div className="accountProfileInitial">
                {getAccountInitial(user, displayName)}
              </div>
            )}

            <div>
              <p className="eyebrow">Profile</p>
              <h3>{displayName || "Your Account"}</h3>
              <span>{user?.email || "No email available"}</span>
            </div>
          </div>

          <label>
            Display Name
            <input
              value={displayName}
              onChange={(event) => setDisplayName(event.target.value)}
              placeholder="Your name"
            />
          </label>
        </div>

        <div className="workspacePanel accountBillingCompactCard">
          <div className="workspaceHeader compactPanelHeader">
            <div>
              <p className="eyebrow">Billing</p>
              <h3>{accessStatus?.isTrial ? "Trial Access" : "Subscription"}</h3>
            </div>
            <CreditCard size={22} />
          </div>

          <div className="accountBillingStatusLine">
            <strong>{accountStatusText}</strong>
            <span>
              {accessStatus?.isTrial
                ? "Choose a plan anytime before your trial ends."
                : "Manage your current billing and plan."}
            </span>
          </div>

          <div className="accountSettingsButtonRow">
            <button
              className="primaryButton compactPrimary"
              type="button"
              onClick={openPlanSelection}
            >
              <Sparkles size={15} />
              View / Change Plan
            </button>

            <button
              className="secondaryButton compactButton"
              type="button"
              onClick={openBillingPortal}
              disabled={billingLoading}
            >
              <ExternalLink size={15} />
              {billingLoading ? "Opening..." : "Manage Billing"}
            </button>
          </div>
        </div>
      </section>

      <section className="accountQuickStats">
        {accountMeta.map((item) => (
          <div key={item.label}>
            <span>{item.label}</span>
            <strong>{item.value}</strong>
          </div>
        ))}
      </section>

      <section className="accountSettingsGrid accountSettingsMainGrid">
        <div className="workspacePanel">
          <div className="workspaceHeader compactPanelHeader">
            <div>
              <p className="eyebrow">Display</p>
              <h3>Workspace Preferences</h3>
            </div>
            <LayoutDashboard size={22} />
          </div>

          <p className="importExportText">
            Choose how much spacing Farmers Hub uses across the dashboard and module pages.
          </p>

          <div className="accountChoiceGrid">
            <button
              type="button"
              className={`accountChoiceCard ${
                settings.dashboardDensity === "comfortable" ? "selected" : ""
              }`}
              onClick={() => updateSetting("dashboardDensity", "comfortable")}
            >
              <Settings2 size={18} />
              <strong>Comfortable</strong>
              <span>More breathing room between cards, fields, and sections.</span>
            </button>

            <button
              type="button"
              className={`accountChoiceCard ${
                settings.dashboardDensity === "compact" ? "selected" : ""
              }`}
              onClick={() => updateSetting("dashboardDensity", "compact")}
            >
              <LayoutDashboard size={18} />
              <strong>Compact</strong>
              <span>Less spacing so more business info stays above the fold.</span>
            </button>
          </div>

          <button
            className={`primaryButton settingsSaveButton ${
              hasUnsavedChanges ? "dirtySaveButton" : ""
            }`}
            type="button"
            onClick={saveSettings}
            disabled={saving}
          >
            <Save size={16} />
            {saving ? "Saving..." : "Save Settings"}
          </button>
        </div>

        <div className="workspacePanel">
          <div className="workspaceHeader compactPanelHeader">
            <div>
              <p className="eyebrow">Help</p>
              <h3>Support & Shortcuts</h3>
            </div>
            <LifeBuoy size={22} />
          </div>

          <p className="importExportText">
            Quick links for common account tasks and navigation.
          </p>

          <div className="accountShortcutGrid">
            <a className="accountShortcutCard" href="/">
              <LayoutDashboard size={18} />
              <span>Back to Dashboard</span>
            </a>

            <a className="accountShortcutCard" href="/subscribe">
              <Sparkles size={18} />
              <span>View Plans</span>
            </a>

            <button className="accountShortcutCard" type="button" onClick={handleExportHubData}>
              <Download size={18} />
              <span>Quick Export</span>
            </button>

            <button className="accountShortcutCard" type="button" onClick={logout}>
              <LogOut size={18} />
              <span>Sign Out</span>
            </button>
          </div>
        </div>

        <div className="workspacePanel accountSettingsWide">
          <div className="workspaceHeader compactPanelHeader">
            <div>
              <p className="eyebrow">Backup</p>
              <h3>Import / Export</h3>
            </div>
            <Download size={22} />
          </div>

          <p className="importExportText">
            Export a full Farmers Hub backup or import a previous backup into this
            signed-in account.
          </p>

          <section className="importExportGrid accountBackupGrid">
            <div className="soft-panel">
              <div className="workspaceHeader compactPanelHeader">
                <div>
                  <p className="eyebrow">Export</p>
                  <h3>Download Backup</h3>
                </div>

                <Download size={22} />
              </div>

              <p className="importExportText">
                Download a JSON backup of your saved Hub data for this account.
              </p>

              <button
                className="primaryButton compactPrimary"
                type="button"
                onClick={handleExportHubData}
                disabled={backupWorking}
              >
                <Download size={15} />
                {backupWorking ? "Working..." : "Export Hub Data"}
              </button>
            </div>

            <div className="soft-panel">
              <div className="workspaceHeader compactPanelHeader">
                <div>
                  <p className="eyebrow">Import</p>
                  <h3>Upload Backup</h3>
                </div>

                <Upload size={22} />
              </div>

              <p className="importExportText">
                Choose a Farmers Hub backup file. Importing adds new records and
                updates records with matching IDs.
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
                onClick={handleImportHubData}
                disabled={backupWorking || !importData}
              >
                <Import size={15} />
                {backupWorking ? "Working..." : "Import Backup"}
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
                  <span>Products</span>
                  <strong>{getCount("products")}</strong>
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

                <div>
                  <span>Customers</span>
                  <strong>{getCount("customers")}</strong>
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

        <div className="workspacePanel dangerSettingsPanel">
          <div className="workspaceHeader compactPanelHeader">
            <div>
              <p className="eyebrow">Security</p>
              <h3>Account Controls</h3>
            </div>
            <Shield size={22} />
          </div>

          <p className="importExportText">
            Sign out or request account deletion. Export your data first if you may need it later.
          </p>

          <div className="settingsInfoList accountSecurityList">
            <div>
              <span>Signed In As</span>
              <strong>{user?.email || "Not set"}</strong>
            </div>

            <div>
              <span>Deletion Status</span>
              <strong>
                {accountProfile?.deletionRequested
                  ? "Deletion requested"
                  : "No deletion request"}
              </strong>
            </div>
          </div>

          <button className="secondaryButton" type="button" onClick={logout}>
            <LogOut size={16} />
            Sign Out
          </button>

          <button className="dangerButton" type="button" onClick={requestAccountDeletion}>
            <Trash2 size={16} />
            Request Account Deletion
          </button>
        </div>
      </section>
    </div>
  );
}
