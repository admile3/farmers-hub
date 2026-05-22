import { useEffect, useMemo, useState } from "react";
import { Download, Save, Shield, Trash2 } from "lucide-react";
import { useAuth } from "../AuthContext.jsx";
import { updateAccountProfile } from "../services/accountService.js";

const defaultSettings = {
  temperatureUnit: "fahrenheit",
  weightUnit: "imperial",
  volumeUnit: "us",
  timeFormat: "12-hour",
  dateFormat: "MM/DD/YYYY",
  dashboardDensity: "comfortable"
};

function formatStatus(status) {
  if (!status) return "Unknown";
  return status.charAt(0).toUpperCase() + status.slice(1);
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

  const [saving, setSaving] = useState(false);
  const [billingLoading, setBillingLoading] = useState(false);
  const [displayName, setDisplayName] = useState(accountProfile?.displayName || "");

  const settings = useMemo(
    () => ({
      ...defaultSettings,
      ...(accountProfile?.settings || {})
    }),
    [accountProfile]
  );

  const [form, setForm] = useState(settings);

  useEffect(() => {
    setForm(settings);
    setDisplayName(accountProfile?.displayName || user?.displayName || "");
  }, [settings, accountProfile, user]);

  function updateField(field, value) {
    setForm((current) => ({
      ...current,
      [field]: value
    }));
  }

  async function saveSettings() {
    if (!user) return;

    setSaving(true);

    try {
      await updateAccountProfile(user.uid, {
        displayName,
        settings: form
      });

      await refreshAccountProfile();
      alert("Account settings saved.");
    } catch (error) {
      console.error(error);
      alert("Could not save account settings.");
    } finally {
      setSaving(false);
    }
  }

  function exportAccountData() {
    const data = {
      exportedAt: new Date().toISOString(),
      user: {
        uid: user?.uid || "",
        email: user?.email || "",
        displayName: displayName || ""
      },
      accountProfile,
      settings: form
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], {
      type: "application/json"
    });

    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = url;
    link.download = "farmers-hub-account-backup.json";
    link.click();

    URL.revokeObjectURL(url);
  }

  async function openBillingPortal() {
    if (!user?.email) {
      alert("Please sign in before managing billing.");
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
        alert("Could not open billing portal. If you have not subscribed yet, choose a plan first.");
        return;
      }

      window.location.href = data.url;
    } catch (error) {
      console.error(error);
      alert("Could not open billing portal.");
    } finally {
      setBillingLoading(false);
    }
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

      alert("Your account has been marked for deletion. Cancel billing separately in Stripe if needed.");
      await logout();
    } catch (error) {
      console.error(error);
      alert("Could not request account deletion.");
    }
  }

  return (
    <div className="modulePage accountSettingsPage">
      <section className="moduleHero compactHero accountSettingsHero">
  <div>
    <p className="eyebrow">Account Settings</p>
    <h2>Manage your Farmers Hub account.</h2>
    <p>
      Control billing, display preferences, data backups, and account security
      from one place.
    </p>
  </div>

    </section>
      <section className="accountSettingsGrid">
        <div className="workspacePanel">
          <div className="workspaceHeader compactPanelHeader">
            <div>
              <p className="eyebrow">Overview</p>
              <h3>Account</h3>
            </div>
          </div>

          <div className="settingsFormGrid singleColumnSettings">
            <label>
              Name
              <input
                value={displayName}
                onChange={(event) => setDisplayName(event.target.value)}
                placeholder="Your name"
              />
            </label>
          </div>

          <div className="settingsInfoList">
            <div>
              <span>Email</span>
              <strong>{user?.email || "Not set"}</strong>
            </div>

            <div>
              <span>Status</span>
              <strong>
                {formatStatus(accessStatus?.status)}
                {accessStatus?.isTrial ? `, ${daysRemaining} days remaining` : ""}
              </strong>
            </div>
          </div>
        </div>

        <div className="workspacePanel">
          <div className="workspaceHeader compactPanelHeader">
            <div>
              <p className="eyebrow">Billing</p>
              <h3>Subscription</h3>
            </div>
          </div>

          <p className="importExportText">
            Manage your subscription, payment method, invoices, and cancellation
            through Stripe.
          </p>

          <button
            className="primaryButton"
            type="button"
            onClick={openBillingPortal}
            disabled={billingLoading}
          >
            {billingLoading ? "Opening Billing..." : "Manage Billing"}
          </button>
        </div>

        <div className="workspacePanel accountSettingsWide">
          <div className="workspaceHeader compactPanelHeader">
            <div>
              <p className="eyebrow">Preferences</p>
              <h3>Display & Units</h3>
            </div>
          </div>

          <div className="settingsFormGrid">
            <label>
              Temperature
              <select value={form.temperatureUnit} onChange={(e) => updateField("temperatureUnit", e.target.value)}>
                <option value="fahrenheit">Fahrenheit</option>
                <option value="celsius">Celsius</option>
              </select>
            </label>

            <label>
              Weight
              <select value={form.weightUnit} onChange={(e) => updateField("weightUnit", e.target.value)}>
                <option value="imperial">Imperial, oz/lb</option>
                <option value="metric">Metric, g/kg</option>
              </select>
            </label>

            <label>
              Volume
              <select value={form.volumeUnit} onChange={(e) => updateField("volumeUnit", e.target.value)}>
                <option value="us">US, tsp/tbsp/cups</option>
                <option value="metric">Metric, mL/L</option>
              </select>
            </label>

            <label>
              Time Format
              <select value={form.timeFormat} onChange={(e) => updateField("timeFormat", e.target.value)}>
                <option value="12-hour">12-hour</option>
                <option value="24-hour">24-hour</option>
              </select>
            </label>

            <label>
              Date Format
              <select value={form.dateFormat} onChange={(e) => updateField("dateFormat", e.target.value)}>
                <option value="MM/DD/YYYY">MM/DD/YYYY</option>
                <option value="DD/MM/YYYY">DD/MM/YYYY</option>
                <option value="YYYY-MM-DD">YYYY-MM-DD</option>
              </select>
            </label>

            <label>
              Dashboard Density
              <select value={form.dashboardDensity} onChange={(e) => updateField("dashboardDensity", e.target.value)}>
                <option value="comfortable">Comfortable</option>
                <option value="compact">Compact</option>
              </select>
            </label>
          </div>

          <button className="primaryButton settingsSaveButton" type="button" onClick={saveSettings} disabled={saving}>
            <Save size={16} />
            {saving ? "Saving..." : "Save Settings"}
          </button>
        </div>

        <div className="workspacePanel">
          <div className="workspaceHeader compactPanelHeader">
            <div>
              <p className="eyebrow">Data</p>
              <h3>Backup</h3>
            </div>
            <Download size={22} />
          </div>

          <p className="importExportText">
            Download a backup of your account profile and account-level settings.
          </p>

          <button className="secondaryButton" type="button" onClick={exportAccountData}>
            <Download size={16} />
            Export Account Data
          </button>
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
            Sign out or request account deletion. Cancel billing separately before deleting.
          </p>

          <button className="secondaryButton" type="button" onClick={logout}>
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
