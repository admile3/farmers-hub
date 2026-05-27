import { useState } from "react";
import {
  ArrowRight,
  Calculator,
  ChefHat,
  ClipboardList,
  FileText,
  ListChecks,
  PackageCheck,
  Sparkles,
  Sprout,
  Wheat
} from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../AuthContext.jsx";
import { updateAccountProfile } from "../services/accountService.js";
import { importSampleWorkspace } from "../services/sampleDataService.js";

const onboardingModules = [
  {
    title: "Spice Kitchen",
    icon: ChefHat,
    accent: "spice",
    text:
      "Build seasoning recipes, manage ingredients, scale batches, and keep production notes."
  },
  {
    title: "Baking Planner",
    icon: Wheat,
    accent: "sourdough",
    text:
      "Create recipe formulas, plan bake-day quantities, calculate starter needs, and print production sheets."
  },
  {
    title: "Market Prep Planner",
    icon: ClipboardList,
    accent: "market",
    text:
      "Plan products, units, buffers, pack lists, and market-day prep by date and location."
  },
  {
    title: "Pricing Calculator",
    icon: Calculator,
    accent: "pricing",
    text:
      "Estimate batch costs, labor, packaging, retail pricing, wholesale pricing, and margins."
  },
  {
    title: "Permit & Grant Tracker",
    icon: FileText,
    accent: "grant",
    text:
      "Track permit renewals, insurance, grants, licenses, due dates, documents, and reminders."
  },
  {
    title: "Lists",
    icon: ListChecks,
    accent: "lists",
    text:
      "Create reusable checklists for market prep, shopping, deliveries, production, or business ideas."
  }
];

export default function Onboarding() {
  const { user, accountProfile, refreshAccountProfile } = useAuth();
  const navigate = useNavigate();

  const [displayName, setDisplayName] = useState(
    accountProfile?.displayName || user?.displayName || ""
  );
  const [dashboardDensity, setDashboardDensity] = useState(
    accountProfile?.settings?.dashboardDensity || "comfortable"
  );
  const [sampleChoice, setSampleChoice] = useState("fresh");
  const [saving, setSaving] = useState(false);
  const [statusMessage, setStatusMessage] = useState("");

  async function finishOnboarding() {
    if (!user) return;

    setSaving(true);
    setStatusMessage("");

    try {
      if (sampleChoice === "samples") {
        setStatusMessage("Loading sample workspace...");
        await importSampleWorkspace(user.uid);
      }

      await updateAccountProfile(user.uid, {
        displayName: displayName.trim() || accountProfile?.displayName || "",
        onboardingComplete: true,
        sampleDataImported: sampleChoice === "samples",
        settings: {
          ...(accountProfile?.settings || {}),
          dashboardDensity
        }
      });

      await refreshAccountProfile();

      navigate("/", { replace: true });
    } catch (error) {
      console.error("Could not finish onboarding:", error);
      setStatusMessage("Could not finish setup. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="onboardingPage">
      <section className="moduleHero compactHero noActionHero onboardingHero">
        <div>
          <p className="eyebrow">Welcome to Farmers Hub</p>
          <h2>Set up your workspace.</h2>
          <p>
            Choose how you want to begin. You can start clean, or load editable
            sample records marked with SAMPLE so you can learn each module faster.
          </p>
        </div>
      </section>

      {statusMessage ? (
        <div className="floatingStatus success">
          <span>ⓘ</span>
          <span>{statusMessage}</span>
          <button type="button" onClick={() => setStatusMessage("")}>
            ×
          </button>
        </div>
      ) : null}

      <section className="spiceWorkspace compactWorkspace onboardingWorkspace">
        <div className="workspacePanel compactPanel">
          <div className="workspaceHeader compactPanelHeader">
            <div>
              <p className="eyebrow">Step 1</p>
              <h3>Account basics</h3>
            </div>
          </div>

          <div className="formGrid compactFormGrid">
            <label>
              Display Name
              <input
                value={displayName}
                onChange={(event) => setDisplayName(event.target.value)}
                placeholder="e.g., Adam"
              />
            </label>

            <label>
              Dashboard Density
              <select
                value={dashboardDensity}
                onChange={(event) => setDashboardDensity(event.target.value)}
              >
                <option value="comfortable">Comfortable</option>
                <option value="compact">Compact</option>
              </select>
            </label>
          </div>
        </div>

        <div className="workspacePanel compactPanel">
          <div className="workspaceHeader compactPanelHeader">
            <div>
              <p className="eyebrow">Step 2</p>
              <h3>Choose your starting point</h3>
            </div>
          </div>

          <div className="onboardingChoiceGrid">
            <button
              type="button"
              className={`onboardingChoice ${
                sampleChoice === "fresh" ? "selected" : ""
              }`}
              onClick={() => setSampleChoice("fresh")}
            >
              <Sprout size={22} />
              <strong>Start Fresh</strong>
              <span>
                Begin with empty modules and add your own real products, records,
                recipes, and lists.
              </span>
            </button>

            <button
              type="button"
              className={`onboardingChoice ${
                sampleChoice === "samples" ? "selected" : ""
              }`}
              onClick={() => setSampleChoice("samples")}
            >
              <Sparkles size={22} />
              <strong>Load Sample Workspace</strong>
              <span>
                Add editable sample records to each module. Every sample starts
                with SAMPLE so it is easy to identify, edit, or delete.
              </span>
            </button>
          </div>
        </div>
      </section>

      <section className="workspacePanel compactPanel">
        <div className="workspaceHeader compactPanelHeader">
          <div>
            <p className="eyebrow">Step 3</p>
            <h3>What each module does</h3>
          </div>
        </div>

        <div className="toolGrid compactToolGrid onboardingModuleGrid">
          {onboardingModules.map((module) => {
            const Icon = module.icon;

            return (
              <div
                className={`toolCard compactToolCard onboardingModuleCard ${module.accent}`}
                key={module.title}
              >
                <Icon size={22} />
                <h3>{module.title}</h3>
                <p>{module.text}</p>
              </div>
            );
          })}
        </div>

        <div className="placeholderBox compactPlaceholder">
          <strong>Calendar note:</strong> Calendar does not receive sample data.
          It automatically reflects events and deadlines from the other modules.
        </div>
      </section>

      <section className="dashboardFooterBanner onboardingFooter">
        <div>
          <p className="eyebrow">Finish setup</p>
          <h3>
            {sampleChoice === "samples"
              ? "Load samples and go to dashboard."
              : "Start fresh and go to dashboard."}
          </h3>
          <p>
            You can still change your name, density, and account settings later
            from Account Settings.
          </p>
        </div>

        <div className="button-row">
          <Link to="/account-settings" className="secondaryButton">
            Account Settings
          </Link>

          <button
            className="primaryButton"
            type="button"
            onClick={finishOnboarding}
            disabled={saving}
          >
            {saving ? "Setting up..." : "Finish Setup"}
            <ArrowRight size={18} />
          </button>
        </div>
      </section>
    </div>
  );
}
