import { useEffect, useMemo, useState } from "react";
import {
  Archive,
  Beef,
  Calculator,
  CalendarDays,
  ChefHat,
  ClipboardList,
  DollarSign,
  Eye,
  EyeOff,
  FileText,
  FlaskConical,
  Flower2,
  Home,
  Leaf,
  ListChecks,
  LogIn,
  LogOut,
  Menu,
  PackageCheck,
  Printer,
  Settings,
  Sprout,
  Users,
  Wheat,
  X
} from "lucide-react";
import {
  Navigate,
  Route,
  Routes,
  useLocation,
  useNavigate
} from "react-router-dom";
import SpiceKitchen from "./modules/SpiceKitchen.jsx";
import PreservedFoods from "./modules/PreservedFoods.jsx";
import BakingPlanner from "./modules/BakingPlanner.jsx";
import MarketPrepPlanner from "./modules/MarketPrepPlanner.jsx";
import PricingCalculator from "./modules/PricingCalculator.jsx";
import PermitGrantTracker from "./modules/PermitGrantTracker.jsx";
import Lists from "./modules/Lists.jsx";
import Calendar from "./modules/Calendar.jsx";
import Customers from "./modules/Customers.jsx";
import Orders from "./modules/Orders.jsx";
import Sales from "./modules/Sales.jsx";
import Inventory from "./modules/Inventory.jsx";
import Livestock from "./modules/Livestock.jsx";
import HerdTracker from "./modules/HerdTracker.jsx";
import PlantingScheduler from "./modules/PlantingScheduler.jsx";
import ThermalPrinter from "./modules/ThermalPrinter.jsx";
import AccountSettings from "./modules/AccountSettings.jsx";
import Onboarding from "./modules/Onboarding.jsx";
import Dashboard from "./modules/Dashboard.jsx";
import FlowerStudio from "./modules/FlowerStudio.jsx";
import FarmApothecary from "./modules/FarmApothecary.jsx";
import { useAuth } from "./AuthContext.jsx";
import { useUnsavedChanges } from "./UnsavedChangesContext.jsx";
import DesignSystemPreview from "./modules/DesignSystemPreview.jsx";

const modules = [
  {
    key: "baking",
    title: "Baking Planner",
    description:
      "Plan production schedules, baking timelines, dough calculations, and batch workflow.",
    path: "/baking-planner",
    icon: Wheat,
    accent: "sourdough"
  },
  {
    key: "calendar",
    title: "Calendar",
    description:
      "View market plans, permit deadlines, grant renewals, production dates, and manual events.",
    path: "/calendar",
    icon: CalendarDays,
    accent: "calendar"
  },
  {
    key: "customers",
    title: "Customers",
    description:
      "Track market regulars, wholesale buyers, custom order clients, contact notes, interests, and follow-ups.",
    path: "/customers",
    icon: Users,
    accent: "customers"
  },
  {
    key: "farm-apothecary",
    title: "Farm Apothecary",
    description:
      "Track soap, candle, balm, lotion, and infused product batches, materials, production events, finished products, and inventory.",
    path: "/farm-apothecary",
    icon: Leaf,
    accent: "apothecary"
  },
  {
    key: "flower-studio",
    title: "Flower Studio",
    description:
      "Build flower pantries, import zone-friendly stems, create arrangements, calculate production, and add finished bouquets to inventory.",
    path: "/flower-studio",
    icon: Flower2,
    accent: "flowers"
  },
  {
    key: "herd-tracker",
    title: "Herd Tracker",
    description:
      "Track individual animals from birth or purchase through care, costs, sale, or processing transfer.",
    path: "/herd-tracker",
    icon: Beef,
    accent: "herd"
  },
  {
    key: "inventory",
    title: "Inventory",
    description:
      "Track stock counts, storage locations, reorder points, inventory value, and expiring goods.",
    path: "/inventory",
    icon: Archive,
    accent: "inventory"
  },
  {
    key: "lists",
    title: "Lists",
    description:
      "Create reusable checklists for market prep, production, shopping, permits, delivery, and ideas.",
    path: "/lists",
    icon: ListChecks,
    accent: "lists"
  },
  {
    key: "livestock",
    title: "Livestock",
    description:
      "Track animal batches, feed costs, processing yields, finished cuts, and meat inventory.",
    path: "/livestock",
    icon: Beef,
    accent: "livestock"
  },
  {
    key: "market",
    title: "Market Prep Planner",
    description:
      "Estimate harvest, packing, inventory, and product quantities before each market.",
    path: "/market-prep",
    icon: ClipboardList,
    accent: "market"
  },
  {
    key: "orders",
    title: "Orders",
    description:
      "Create customer orders, add line items, track fulfillment, and manage order totals.",
    path: "/orders",
    icon: PackageCheck,
    accent: "orders"
  },
  {
    key: "permit-grants",
    title: "Permit & Grant Tracker",
    description:
      "Track renewals, permits, grants, deadlines, required documents, and funding opportunities.",
    path: "/permit-grants",
    icon: FileText,
    accent: "grant"
  },
  {
    key: "planting",
    title: "Planting Scheduler",
    description:
      "Create crop templates, schedule planting batches, and track grow tasks from seed to harvest.",
    path: "/planting-scheduler",
    icon: Sprout,
    accent: "planting"
  },
  {
    key: "preserved-foods",
    title: "Preserved Foods",
    description:
      "Build preserved food recipes, calculate brines, log batches, track pH, and add finished jars to inventory.",
    path: "/preserved-foods",
    icon: FlaskConical,
    accent: "preserved"
  },
  {
    key: "pricing",
    title: "Products & Pricing",
    description:
      "Manage your product list, retail prices, wholesale prices, costs, margins, and profitability.",
    path: "/pricing",
    icon: Calculator,
    accent: "pricing"
  },
  {
    key: "sales",
    title: "Sales",
    description:
      "Track product sales, daily totals, completed order revenue, market performance, and revenue trends.",
    path: "/sales",
    icon: DollarSign,
    accent: "sales"
  },
  {
    key: "spice",
    title: "Spice Kitchen",
    description:
      "Build seasoning recipes, scale batches, manage ingredients, and calculate production needs.",
    path: "/spice-kitchen",
    icon: ChefHat,
    accent: "spice"
  },
  {
    key: "thermal-printer",
    title: "Thermal Printer",
    description:
      "Batch upload PNG labels, set quantities, reorder print jobs, and print through universal or direct thermal printer modes.",
    path: "/thermal-printer",
    icon: Printer,
    accent: "thermal"
  }
];

const pricingPlans = [
  {
    plan: "basic",
    eyebrow: "Basic",
    price: "$5/month",
    description:
      "Includes 2 modules after your trial. Best for vendors who only need a couple of essential tools."
  },
  {
    plan: "growth",
    eyebrow: "Growth",
    price: "$10/month",
    description:
      "Includes 4 modules after your trial. Best for vendors managing regular production."
  },
  {
    plan: "pro",
    eyebrow: "Pro",
    price: "$15/month",
    description:
      "Unlock every Market Vendor Toolkit module after your trial. Best for full business management.",
    feature: "All modules"
  }
];

function toDate(value) {
  if (!value) return null;
  if (value.toDate) return value.toDate();

  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function daysUntil(date) {
  if (!date) return null;

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const target = new Date(date);
  target.setHours(0, 0, 0, 0);

  return Math.ceil((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
}

function formatShortDate(date) {
  if (!date) return "";

  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric"
  });
}

function formatDueLabel(days) {
  if (days === null) return "No date";
  if (days < 0) return "Past due";
  if (days === 0) return "Due today";
  if (days === 1) return "Due in 1 day";
  return `Due in ${days} days`;
}

function formatActivityTime(date) {
  if (!date) return "";

  const diffMs = Date.now() - date.getTime();
  const diffMinutes = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMinutes / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMinutes < 1) return "Just now";
  if (diffMinutes < 60) return `${diffMinutes}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7) return `${diffDays}d ago`;

  return formatShortDate(date);
}

function friendlyAuthError(error) {
  const code = error?.code || "";

  if (code.includes("email-already-in-use")) {
    return "That email already has an account. Try signing in instead.";
  }

  if (code.includes("invalid-email")) {
    return "Please enter a valid email address.";
  }

  if (code.includes("weak-password")) {
    return "Please use a stronger password, at least 6 characters.";
  }

  if (code.includes("wrong-password") || code.includes("invalid-credential")) {
    return "The email or password was not correct.";
  }

  if (code.includes("user-not-found")) {
    return "No account was found with that email. Try creating an account.";
  }

  return "Something went wrong. Please try again.";
}

async function startStripeCheckout({
  plan,
  user,
  selectedModules,
  setCheckoutLoading
}) {
  try {
    setCheckoutLoading(plan);

    const response = await fetch("/api/create-checkout-session", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        plan,
        uid: user?.uid || null,
        email: user?.email || null,
        selectedModules: selectedModules || []
      })
    });

    const data = await response.json();

    if (!response.ok || !data.url) {
      console.error("Stripe checkout response:", data);
      alert(data.error || "Could not start checkout. Please try again.");
      return;
    }

    window.location.href = data.url;
  } catch (error) {
    console.error("Stripe checkout error:", error);
    alert("Could not start checkout session. Please try again.");
  } finally {
    setCheckoutLoading("");
  }
}

function GuardedLink({ to, children, onClick, ...props }) {
  const navigate = useNavigate();
  const { isDirty, requestNavigation } = useUnsavedChanges();

  function handleClick(event) {
    if (onClick) onClick(event);
    if (event.defaultPrevented) return;

    if (
      event.metaKey ||
      event.ctrlKey ||
      event.shiftKey ||
      event.altKey ||
      event.button !== 0
    ) {
      return;
    }

    event.preventDefault();

    if (isDirty) {
      requestNavigation(to);
      return;
    }

    navigate(to);
  }

  return (
    <a href={to} onClick={handleClick} {...props}>
      {children}
    </a>
  );
}

function UnsavedChangesPrompt() {
  const navigate = useNavigate();
  const {
    isDirty,
    source,
    pendingNavigation,
    cancelNavigation,
    leaveWithoutSaving,
    saveAndContinue
  } = useUnsavedChanges();

  if (!isDirty || !pendingNavigation) return null;

  async function handleSaveAndContinue() {
    const nextPath = await saveAndContinue();
    if (nextPath) navigate(nextPath);
  }

  function handleLeaveWithoutSaving() {
    const nextPath = leaveWithoutSaving();
    if (nextPath) navigate(nextPath);
  }

  return (
    <div className="unsavedPromptOverlay" role="dialog" aria-modal="true">
      <div className="unsavedPrompt">
        <p className="eyebrow">Unsaved changes</p>
        <h2>Leave without saving?</h2>
        <p>
          You have unsaved changes in {source || "this module"}. Save before
          leaving, discard your changes, or stay on this page.
        </p>

        <div className="unsavedPromptActions">
          <button className="secondaryButton" type="button" onClick={cancelNavigation}>
            Stay Here
          </button>
          <button
            className="secondaryButton dangerButton"
            type="button"
            onClick={handleLeaveWithoutSaving}
          >
            Leave Without Saving
          </button>
          <button className="primaryButton" type="button" onClick={handleSaveAndContinue}>
            Save Changes
          </button>
        </div>
      </div>
    </div>
  );
}

function ScrollToTop() {
  const location = useLocation();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [location.pathname]);

  return null;
}

function getCurrentModuleTitle(pathname) {
  if (pathname === "/") return "Dashboard";
  if (pathname === "/subscribe") return "Plans";
  if (pathname === "/account-settings") return "Account";
  if (pathname === "/onboarding") return "Setup";

  return modules.find((module) => module.path === pathname)?.title || "Market Vendor Toolkit";
}

function TrialSignupBox() {
  const { loginWithGoogle, createAccountWithEmail, loginWithEmail } = useAuth();

  const [authMode, setAuthMode] = useState("create");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [authActionLoading, setAuthActionLoading] = useState("");
  const [authError, setAuthError] = useState("");

  async function handleGoogle() {
    try {
      setAuthError("");
      setAuthActionLoading("google");
      await loginWithGoogle();
    } catch (error) {
      console.error("Google sign-in error:", error);
      setAuthError(friendlyAuthError(error));
    } finally {
      setAuthActionLoading("");
    }
  }

  async function handleEmailAuth(event) {
    event.preventDefault();

    try {
      setAuthError("");
      setAuthActionLoading("email");

      if (authMode === "create") {
        await createAccountWithEmail(email, password);
      } else {
        await loginWithEmail(email, password);
      }
    } catch (error) {
      console.error("Email auth error:", error);
      setAuthError(friendlyAuthError(error));
    } finally {
      setAuthActionLoading("");
    }
  }

  return (
    <div className="workspacePanel compactPanel trialSignupBox">
      <p className="eyebrow">Start your trial</p>
      <h3>Create your account</h3>
      <p className="importExportText">
        Start with 15 days of full access. No subscription is required today.
      </p>

      <button
        className="primaryButton fullButton"
        type="button"
        onClick={handleGoogle}
        disabled={authActionLoading === "google"}
      >
        <LogIn size={16} />
        {authActionLoading === "google" ? "Opening Google..." : "Continue with Google"}
      </button>

      <form className="trialEmailForm" onSubmit={handleEmailAuth}>
        <label>
          Email
          <input
            type="email"
            value={email}
            autoComplete="email"
            onChange={(event) => setEmail(event.target.value)}
            required
          />
        </label>

        <label>
          Password
          <div className="passwordInputWrap">
            <input
              type={showPassword ? "text" : "password"}
              value={password}
              autoComplete={authMode === "create" ? "new-password" : "current-password"}
              onChange={(event) => setPassword(event.target.value)}
              required
              minLength={6}
            />

            <button
              className="passwordVisibilityButton"
              type="button"
              onClick={() => setShowPassword((current) => !current)}
              aria-label={showPassword ? "Hide password" : "Show password"}
            >
              {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              <span>{showPassword ? "Hide" : "Show"}</span>
            </button>
          </div>
        </label>

        {authError ? <p className="authErrorText">{authError}</p> : null}

        <button
          className="secondaryButton fullButton"
          type="submit"
          disabled={authActionLoading === "email"}
        >
          {authActionLoading === "email"
            ? "Working..."
            : authMode === "create"
              ? "Create account and start trial"
              : "Sign in with email"}
        </button>
      </form>

      <button
        className="textButton authSwitchButton"
        type="button"
        onClick={() => {
          setAuthError("");
          setAuthMode(authMode === "create" ? "signin" : "create");
        }}
      >
        {authMode === "create"
          ? "Already have an account? Sign in"
          : "Need an account? Create one"}
      </button>
    </div>
  );
}

function ModuleSelector({ selectedModules, setSelectedModules, limit }) {
  const selectedCount = selectedModules.length;
  const remainingCount = Math.max(limit - selectedCount, 0);
  const isComplete = selectedCount === limit;

  function toggleModule(moduleKey) {
    const alreadySelected = selectedModules.includes(moduleKey);

    if (alreadySelected) {
      setSelectedModules(selectedModules.filter((key) => key !== moduleKey));
      return;
    }

    if (selectedModules.length >= limit) return;

    setSelectedModules([...selectedModules, moduleKey]);
  }

  return (
    <div className="modulePickerBlock">
      <div className={`modulePickerProgress ${isComplete ? "complete" : ""}`}>
        <span>{selectedCount} of {limit} selected</span>
        <strong>
          {isComplete
            ? "Ready to choose plan"
            : `${remainingCount} more ${remainingCount === 1 ? "module" : "modules"} needed`}
        </strong>
      </div>

      <div className="planModulePicker">
        {modules.map((module) => {
          const Icon = module.icon;
          const isSelected = selectedModules.includes(module.key);
          const isDisabled = !isSelected && selectedModules.length >= limit;

          return (
            <button
              key={module.key}
              type="button"
              className={`planModuleButton ${module.accent} ${
                isSelected ? "selected" : ""
              } ${isDisabled ? "disabled" : ""}`}
              onClick={() => toggleModule(module.key)}
              disabled={isDisabled}
              aria-pressed={isSelected}
              title={
                isSelected
                  ? `${module.title} selected`
                  : isDisabled
                    ? `Deselect another module before choosing ${module.title}`
                    : `Select ${module.title}`
              }
            >
              <Icon size={16} />
              <span>{module.title}</span>
              {isSelected ? <strong className="moduleSelectedCheck">Selected</strong> : null}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function PricingCards({
  mode = "trial",
  checkoutLoading,
  setCheckoutLoading
}) {
  const { user, loginWithGoogle } = useAuth();
  const [basicModules, setBasicModules] = useState([]);
  const [growthModules, setGrowthModules] = useState([]);

  async function handlePlanClick(plan) {
    if (mode === "trial") {
      await loginWithGoogle();
      return;
    }

    if (!user) {
      await loginWithGoogle();
      return;
    }

    let selectedModules = [];

    if (plan === "basic") {
      selectedModules = basicModules;

      if (selectedModules.length !== 2) {
        alert("Please choose 2 modules for the Basic plan.");
        return;
      }
    }

    if (plan === "growth") {
      selectedModules = growthModules;

      if (selectedModules.length !== 4) {
        alert("Please choose 4 modules for the Growth plan.");
        return;
      }
    }

    if (plan === "pro") {
      selectedModules = modules.map((module) => module.key);
    }

    await startStripeCheckout({
      plan,
      user,
      selectedModules,
      setCheckoutLoading
    });
  }

  return (
    <section className="pricingPlanGrid subscriptionPricingGrid">
      {pricingPlans.map((plan) => {
        const isBasic = plan.plan === "basic";
        const isGrowth = plan.plan === "growth";
        const isPro = plan.plan === "pro";

        return (
          <div
            className={`workspacePanel compactPanel subscriptionPlanCard subscriptionPlanCard-${plan.plan}`}
            key={plan.plan}
          >
            <div className="subscriptionPlanIntro">
              <p className="eyebrow">{plan.eyebrow}</p>
              <h3>{plan.price}</h3>
              <p className="importExportText">{plan.description}</p>
            </div>

            {mode === "checkout" && isBasic ? (
              <>
                <p className="modulePickerHint">Choose your modules:</p>
                <ModuleSelector
                  selectedModules={basicModules}
                  setSelectedModules={setBasicModules}
                  limit={2}
                />
              </>
            ) : null}

            {mode === "checkout" && isGrowth ? (
              <>
                <p className="modulePickerHint">Choose your modules:</p>
                <ModuleSelector
                  selectedModules={growthModules}
                  setSelectedModules={setGrowthModules}
                  limit={4}
                />
              </>
            ) : null}

            {mode === "checkout" && isPro ? (
              <>
                <p className="modulePickerHint">Included modules:</p>

                <div className="modulePickerBlock proModulePickerBlock">
                  <div className="modulePickerProgress complete">
                    <span>{modules.length} of {modules.length} included</span>
                    <strong>All modules included</strong>
                  </div>

                  <div className="planModulePicker proIncludedModules">
                    {modules.map((module) => {
                      const Icon = module.icon;

                      return (
                        <div
                          key={module.key}
                          className={`planModuleButton ${module.accent} selected proIncludedModule`}
                        >
                          <Icon size={16} />
                          <span>{module.title}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </>
            ) : null}

            {mode === "checkout" ? (
              <button
                className="primaryButton compactPrimary subscriptionChooseButton"
                type="button"
                onClick={() => handlePlanClick(plan.plan)}
                disabled={checkoutLoading === plan.plan}
              >
                {checkoutLoading === plan.plan ? "Opening Checkout..." : "Choose Plan"}
              </button>
            ) : null}
          </div>
        );
      })}
    </section>
  );
}

function WelcomePricingModal({ onClose }) {
  const [checkoutLoading, setCheckoutLoading] = useState("");

  return (
    <div className="pricingModalOverlay">
      <div className="pricingModal pricingModalCompact">
        <button className="modalCloseButton" type="button" onClick={onClose}>
          <X size={18} />
        </button>

        <div className="pricingModalScroll">
          <div className="pricingModalHeader compactSignupHeader">
            <p className="eyebrow">Welcome to Market Vendor Toolkit</p>
            <h2>Start with full access for 15 days.</h2>
            <p>
              Create your account to try every Market Vendor Toolkit module free for 15 days.
              No subscription is required to start. After the trial, choose the plan
              that fits how many tools you want to keep using.
            </p>
          </div>

          <div className="pricingFeatureGrid compactFeatureGrid">
            <div>
              <strong>Plan your market day</strong>
              <span>Prep lists, packing quantities, harvest needs, and reusable checklists.</span>
            </div>

            <div>
              <strong>Price with confidence</strong>
              <span>Manage products, costs, margins, retail prices, wholesale prices, and profitability.</span>
            </div>

            <div>
              <strong>Manage recipes and products</strong>
              <span>Build seasoning recipes, scale batches, and organize production notes.</span>
            </div>

            <div>
              <strong>Track business details</strong>
              <span>Keep permits, grants, deadlines, documents, lists, and backups organized.</span>
            </div>
          </div>

          <PricingCards
            mode="trial"
            checkoutLoading={checkoutLoading}
            setCheckoutLoading={setCheckoutLoading}
          />

          <TrialSignupBox />
        </div>
      </div>
    </div>
  );
}

function AccountStatusCard({ compact = false }) {
  const {
    user,
    accountProfile,
    loginWithGoogle,
    logout,
    authLoading,
    accountLoading,
    accessStatus,
    isAdmin,
    isTrial,
    isExpired,
    daysRemaining
  } = useAuth();

  if (authLoading || accountLoading) {
    if (compact) {
      return (
        <div className="mobileAccountPill loading">
          Checking...
        </div>
      );
    }

    return (
      <div className="authCard">
        <p>Checking sign-in...</p>
      </div>
    );
  }

  if (!user) {
    if (compact) {
      return (
        <button className="mobileAccountPill" type="button" onClick={loginWithGoogle}>
          <LogIn size={15} />
          Account
        </button>
      );
    }

    return (
      <div className="authCard">
        <p className="eyebrow">Account</p>
        <h3>Start your free trial</h3>
        <p>Sign in once to start your 15-day trial and save your Market Vendor Toolkit data.</p>

        <button className="primaryButton fullButton" onClick={loginWithGoogle}>
          <LogIn size={16} />
          Start with Google
        </button>

        <GuardedLink to="/subscribe" className="secondaryButton fullButton">
          View Plans
        </GuardedLink>
      </div>
    );
  }

  const displayName =
    accountProfile?.displayName?.trim() ||
    user.displayName ||
    "Signed in";

  const statusLabel = isAdmin
    ? "Admin"
    : isTrial
      ? `${daysRemaining}d trial`
      : accessStatus.status === "active"
        ? "Active"
        : isExpired
          ? "Upgrade"
          : "Account";

  if (compact) {
    return (
      <GuardedLink
        to="/account-settings"
        className={`mobileAccountPill ${accessStatus.status}`}
        title={user.email || displayName}
      >
        {user.photoURL ? (
          <img src={user.photoURL} alt={displayName} />
        ) : (
          <span className="mobileAccountInitial">
            {(displayName || user.email || "U").charAt(0)}
          </span>
        )}
        <span>{statusLabel}</span>
      </GuardedLink>
    );
  }

  return (
    <div className="authCard desktopAccountCard">
      <p className="eyebrow">Account</p>

      <div className="userRow">
        {user.photoURL ? (
          <img src={user.photoURL} alt={displayName} />
        ) : (
          <div className="userInitial">
            {(displayName || user.email || "U").charAt(0)}
          </div>
        )}

        <div>
          <strong>{displayName}</strong>
          <p>{user.email}</p>
        </div>
      </div>

      <div className={`accountStatusPill ${accessStatus.status}`}>
        {isAdmin ? "Admin access" : null}
        {isTrial ? `${daysRemaining} trial days left` : null}
        {accessStatus.status === "active" ? "Active subscription" : null}
        {isExpired ? "Subscription required" : null}
      </div>

      {accountProfile?.onboardingComplete ? null : (
        <GuardedLink to="/onboarding" className="primaryButton fullButton">
          Finish Setup
        </GuardedLink>
      )}

      {isExpired ? (
        <GuardedLink to="/subscribe" className="primaryButton fullButton">
          Upgrade Account
        </GuardedLink>
      ) : null}

      <GuardedLink to="/account-settings" className="secondaryButton fullButton">
        <Settings size={16} />
        Account Settings
      </GuardedLink>

      <button className="secondaryButton" onClick={logout}>
        <LogOut size={16} />
        Sign out
      </button>
    </div>
  );
}

function AppShell({ children }) {
  const { accountProfile, authLoading, accountLoading } = useAuth();

  if (authLoading || accountLoading) {
    return (
      <div className="appLoadingScreen">
        <div className="appLoadingCard">
          <h2>Loading Market Vendor Toolkit...</h2>
          <p>Checking your account and workspace settings.</p>
        </div>
      </div>
    );
  }

  const location = useLocation();
  const [mobileModulesOpen, setMobileModulesOpen] = useState(false);

  const densityClass =
    accountProfile?.settings?.dashboardDensity === "compact"
      ? "compactDensity"
      : "comfortableDensity";

  const currentTitle = getCurrentModuleTitle(location.pathname);

  useEffect(() => {
    setMobileModulesOpen(false);
  }, [location.pathname]);

  return (
    <div className={`app ${densityClass}`}>
      <aside className="sidebar modernSidebar">
        <div className="mobileTopBar">
          <GuardedLink to="/" className="brand mobileBrand">
            <div className="brandIcon">
              <Sprout size={23} />
            </div>

            <div>
              <h1>Market Vendor Toolkit</h1>
              <p>{currentTitle}</p>
            </div>
          </GuardedLink>

          <div className="mobileTopActions">
            <button
              className="mobileModulesToggle"
              type="button"
              onClick={() => setMobileModulesOpen((current) => !current)}
              aria-expanded={mobileModulesOpen}
              aria-controls="farmers-hub-mobile-nav"
            >
              <Menu size={16} />
              Modules
            </button>

            <AccountStatusCard compact />
          </div>
        </div>

        <GuardedLink to="/" className="brand desktopBrand">
          <div className="brandIcon">
            <Sprout size={26} />
          </div>

          <div>
            <h1>Market Vendor Toolkit</h1>
            <p>Vendor tools</p>
          </div>
        </GuardedLink>

        <nav
          id="farmers-hub-mobile-nav"
          className={`nav modernNav ${mobileModulesOpen ? "mobileOpen" : ""}`}
        >
          <GuardedLink
            to="/"
            className={`navLink modernNavLink dashboardNav ${
              location.pathname === "/" ? "active" : ""
            }`}
          >
            <Home size={18} />
            <span>Dashboard</span>
          </GuardedLink>

          {modules.map((module) => {
            const Icon = module.icon;

            return (
              <GuardedLink
                key={module.path}
                to={module.path}
                className={`navLink modernNavLink moduleNav ${module.accent} ${
                  location.pathname === module.path ? "active" : ""
                }`}
              >
                <Icon size={18} />
                <span>{module.title}</span>
              </GuardedLink>
            );
          })}
        </nav>

        <AccountStatusCard />
      </aside>

      <main className="main modernMain">{children}</main>
    </div>
  );
}

function AccessGate({ children }) {
  const {
    user,
    authLoading,
    accountLoading,
    accountProfile,
    loginWithGoogle,
    hasAccess,
    isExpired
  } = useAuth();

  const location = useLocation();

  if (authLoading || accountLoading) {
    return (
      <AppShell>
        <div className="emptyState">
          <h2>Checking account access...</h2>
          <p>Please wait while Market Vendor Toolkit verifies your trial or subscription.</p>
        </div>
      </AppShell>
    );
  }

  if (!user) {
    return (
      <AppShell>
        <div className="emptyState">
          <h2>Start your 15-day trial</h2>
          <p>Create an account to use every Market Vendor Toolkit module free for 15 days.</p>

          <button className="primaryButton" onClick={loginWithGoogle}>
            <LogIn size={16} />
            Start with Google
          </button>

          <GuardedLink to="/subscribe" className="secondaryButton">
            View all sign-in options
          </GuardedLink>
        </div>
      </AppShell>
    );
  }

  if (!hasAccess || isExpired) {
    return (
      <AppShell>
        <Subscribe />
      </AppShell>
    );
  }

  const canSkipOnboardingRedirect =
    location.pathname === "/onboarding" ||
    location.pathname === "/account-settings" ||
    location.pathname === "/subscribe";

  if (!accountProfile?.onboardingComplete && !canSkipOnboardingRedirect) {
    return <Navigate to="/onboarding" replace />;
  }

  return <AppShell>{children}</AppShell>;
}

function OnboardingRoute() {
  const {
    user,
    authLoading,
    accountLoading,
    accountProfile,
    loginWithGoogle,
    hasAccess,
    isExpired
  } = useAuth();

  if (authLoading || accountLoading) {
    return (
      <AppShell>
        <div className="emptyState">
          <h2>Loading setup...</h2>
          <p>Please wait while Market Vendor Toolkit checks your account.</p>
        </div>
      </AppShell>
    );
  }

  if (!user) {
    return (
      <AppShell>
        <div className="emptyState">
          <h2>Create an account to set up Market Vendor Toolkit</h2>
          <p>Start your 15-day trial, then choose whether to begin fresh or load sample data.</p>

          <button className="primaryButton" onClick={loginWithGoogle}>
            <LogIn size={16} />
            Start with Google
          </button>

          <GuardedLink to="/subscribe" className="secondaryButton">
            View all sign-in options
          </GuardedLink>
        </div>
      </AppShell>
    );
  }

  if (!hasAccess || isExpired) {
    return (
      <AppShell>
        <Subscribe />
      </AppShell>
    );
  }

  if (accountProfile?.onboardingComplete) {
    return <Navigate to="/" replace />;
  }

  return (
    <AppShell>
      <Onboarding />
    </AppShell>
  );
}

function Subscribe() {
  const { user } = useAuth();
  const [checkoutLoading, setCheckoutLoading] = useState("");

  if (!user) {
    return (
      <div className="subscribePage">
        <section className="moduleHero compactHero noActionHero">
          <div>
            <p className="eyebrow">15-day free trial</p>
            <h2>Try every Market Vendor Toolkit module before choosing a plan.</h2>
            <p>
              Create an account to start your free trial. You will not need to pick
              a paid plan until the trial ends or you decide to upgrade early.
            </p>
          </div>
        </section>

        <PricingCards
          mode="trial"
          checkoutLoading={checkoutLoading}
          setCheckoutLoading={setCheckoutLoading}
        />

        <TrialSignupBox />
      </div>
    );
  }

  return (
    <div className="subscribePage">
      <section className="moduleHero compactHero noActionHero">
        <div>
          <p className="eyebrow">Choose your plan</p>
          <h2>Keep Market Vendor Toolkit active after your trial.</h2>
          <p>
            Choose the plan that fits your workflow. Basic includes 2 modules, Growth
            includes 4 modules, and Pro unlocks every Market Vendor Toolkit module.
          </p>
        </div>
      </section>

      <PricingCards
        mode="checkout"
        checkoutLoading={checkoutLoading}
        setCheckoutLoading={setCheckoutLoading}
      />
    </div>
  );
}

function DashboardRoute() {
  const { user, authLoading, accountLoading, accountProfile } = useAuth();

  if (authLoading || accountLoading) {
    return (
      <AppShell>
        <div className="emptyState">
          <h2>Loading dashboard...</h2>
          <p>Please wait while Market Vendor Toolkit checks your account setup.</p>
        </div>
      </AppShell>
    );
  }

  if (user && accountProfile && !accountProfile.onboardingComplete) {
    return <Navigate to="/onboarding" replace />;
  }

  return (
    <Dashboard
      AppShell={AppShell}
      GuardedLink={GuardedLink}
      WelcomePricingModal={WelcomePricingModal}
    />
  );
}

function NotFound() {
  return (
    <AppShell>
      <div className="emptyState">
        <h2>Page not found</h2>
        <p>This module does not exist yet.</p>

        <GuardedLink to="/" className="primaryButton">
          Back to Dashboard
        </GuardedLink>
      </div>
    </AppShell>
  );
}

export default function App() {
  return (
    <>
      <ScrollToTop />
      <UnsavedChangesPrompt />

      <Routes>
        <Route path="/" element={<DashboardRoute />} />

        <Route path="/onboarding" element={<OnboardingRoute />} />

        <Route
          path="/subscribe"
          element={
            <AppShell>
              <Subscribe />
            </AppShell>
          }
        />

        <Route
          path="/account-settings"
          element={
            <AccessGate>
              <AccountSettings />
            </AccessGate>
          }
        />

        <Route path="/spice-kitchen" element={<AccessGate><SpiceKitchen /></AccessGate>} />
        <Route path="/preserved-foods" element={<AccessGate><PreservedFoods /></AccessGate>} />
        <Route path="/farm-apothecary" element={<AccessGate><FarmApothecary /></AccessGate>} />
        <Route path="/flower-studio" element={<AccessGate><FlowerStudio /></AccessGate>} />
        <Route path="/baking-planner" element={<AccessGate><BakingPlanner /></AccessGate>} />
        <Route path="/market-prep" element={<AccessGate><MarketPrepPlanner /></AccessGate>} />
        <Route path="/planting-scheduler" element={<AccessGate><PlantingScheduler /></AccessGate>} />
        <Route path="/pricing" element={<AccessGate><PricingCalculator /></AccessGate>} />
        <Route path="/permit-grants" element={<AccessGate><PermitGrantTracker /></AccessGate>} />
        <Route path="/lists" element={<AccessGate><Lists /></AccessGate>} />
        <Route path="/calendar" element={<AccessGate><Calendar /></AccessGate>} />
        <Route path="/customers" element={<AccessGate><Customers /></AccessGate>} />
        <Route path="/orders" element={<AccessGate><Orders /></AccessGate>} />
        <Route path="/sales" element={<AccessGate><Sales /></AccessGate>} />
        <Route path="/inventory" element={<AccessGate><Inventory /></AccessGate>} />
        <Route path="/herd-tracker" element={<AccessGate><HerdTracker /></AccessGate>} />
        <Route path="/livestock" element={<AccessGate><Livestock /></AccessGate>} />
        <Route path="/thermal-printer" element={<AccessGate><ThermalPrinter /></AccessGate>} />
        <Route path="/design-system-preview" element={<AccessGate><DesignSystemPreview /></AccessGate>} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </>
  );
}
