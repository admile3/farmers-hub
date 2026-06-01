import { useEffect, useMemo, useState } from "react";
import {
  Navigate,
  Route,
  Routes,
  useLocation,
  useNavigate
} from "react-router-dom";
import {
  Activity,
  ArrowRight,
  BookOpen,
  Calculator,
  CalendarDays,
  ChefHat,
  ClipboardList,
  Eye,
  EyeOff,
  FileText,
  Folder,
  Home,
  ListChecks,
  LogIn,
  LogOut,
  PackageCheck,
  Settings,
  Sprout,
  Users,
  Wheat,
  X
} from "lucide-react";
import { doc, getDoc } from "firebase/firestore";

import SpiceKitchen from "./modules/SpiceKitchen.jsx";
import BakingPlanner from "./modules/BakingPlanner.jsx";
import MarketPrepPlanner from "./modules/MarketPrepPlanner.jsx";
import PricingCalculator from "./modules/PricingCalculator.jsx";
import PermitGrantTracker from "./modules/PermitGrantTracker.jsx";
import Lists from "./modules/Lists.jsx";
import Calendar from "./modules/Calendar.jsx";
import Customers from "./modules/Customers.jsx";
import AccountSettings from "./modules/AccountSettings.jsx";
import Onboarding from "./modules/Onboarding.jsx";
import Dashboard from "./modules/Dashboard.jsx";
import { useAuth } from "./AuthContext.jsx";
import { useUnsavedChanges } from "./UnsavedChangesContext.jsx";
import { db } from "./firebase";
import StatCard from "./components/StatCard.jsx";
import { getSpiceRecipes } from "./services/spiceKitchenService.js";
import { getPermitGrantItems } from "./services/permitGrantService.js";
import { getLists } from "./services/listsService.js";
import { getCustomers } from "./services/customerService.js";

const modules = [
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
    key: "baking",
    title: "Baking Planner",
    description:
      "Plan production schedules, baking timelines, dough calculations, and batch workflow.",
    path: "/baking-planner",
    icon: Wheat,
    accent: "sourdough"
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
    key: "customers",
    title: "Customers",
    description:
      "Track market regulars, wholesale buyers, custom order clients, contact notes, interests, and follow-ups.",
    path: "/customers",
    icon: Users,
    accent: "customers"
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
    key: "permit-grants",
    title: "Permit & Grant Tracker",
    description:
      "Track renewals, permits, grants, deadlines, required documents, and funding opportunities.",
    path: "/permit-grants",
    icon: FileText,
    accent: "grant"
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
    key: "calendar",
    title: "Calendar",
    description:
      "View market plans, permit deadlines, grant renewals, production dates, and manual events.",
    path: "/calendar",
    icon: CalendarDays,
    accent: "calendar"
  }
];

const pricingPlans = [
  {
    plan: "basic",
    eyebrow: "Basic",
    price: "$5/month",
    description:
      "Choose 1 module after your trial. Best for vendors who only need one focused tool.",
    feature: "1 module"
  },
  {
    plan: "growth",
    eyebrow: "Growth",
    price: "$10/month",
    description:
      "Choose 3 modules after your trial. Best for vendors managing regular production.",
    feature: "3 modules"
  },
  {
    plan: "pro",
    eyebrow: "Pro",
    price: "$15/month",
    description:
      "Unlock every Farmers Hub module after your trial. Best for full business management.",
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
          >
            <Icon size={16} />
            <span>{module.title}</span>
          </button>
        );
      })}
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

      if (selectedModules.length !== 1) {
        alert("Please choose 1 module for the Basic plan.");
        return;
      }
    }

    if (plan === "growth") {
      selectedModules = growthModules;

      if (selectedModules.length !== 3) {
        alert("Please choose 3 modules for the Growth plan.");
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
    <section className="pricingPlanGrid">
      {pricingPlans.map((plan) => {
        const isBasic = plan.plan === "basic";
        const isGrowth = plan.plan === "growth";
        const isPro = plan.plan === "pro";

        return (
          <div className="workspacePanel compactPanel" key={plan.plan}>
            <p className="eyebrow">{plan.eyebrow}</p>
            <h3>{plan.price}</h3>
            <p className="importExportText">{plan.description}</p>
            <p className="importExportText">
              <strong>{plan.feature}</strong>
            </p>

            {mode === "checkout" && isBasic ? (
              <>
                <p className="modulePickerHint">Select 1 module:</p>
                <ModuleSelector
                  selectedModules={basicModules}
                  setSelectedModules={setBasicModules}
                  limit={1}
                />
              </>
            ) : null}

            {mode === "checkout" && isGrowth ? (
              <>
                <p className="modulePickerHint">Select 3 modules:</p>
                <ModuleSelector
                  selectedModules={growthModules}
                  setSelectedModules={setGrowthModules}
                  limit={3}
                />
              </>
            ) : null}

            {mode === "checkout" && isPro ? (
              <div className="planModulePicker proIncludedModules">
                {modules.map((module) => {
                  const Icon = module.icon;

                  return (
                    <div
                      key={module.key}
                      className={`planModuleButton ${module.accent} selected`}
                    >
                      <Icon size={16} />
                      <span>{module.title}</span>
                    </div>
                  );
                })}
              </div>
            ) : null}

            {mode === "checkout" ? (
              <button
                className="primaryButton compactPrimary"
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
            <p className="eyebrow">Welcome to Farmers Hub</p>
            <h2>Start with full access for 15 days.</h2>
            <p>
              Create your account to try every Farmers Hub module free for 15 days.
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

function AccountStatusCard() {
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
    return (
      <div className="authCard">
        <p>Checking sign-in...</p>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="authCard">
        <p className="eyebrow">Account</p>
        <h3>Start your free trial</h3>
        <p>Sign in once to start your 15-day trial and save your Farmers Hub data.</p>

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

  return (
    <div className="authCard">
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
  const { accountProfile } = useAuth();
  const location = useLocation();

  const densityClass =
    accountProfile?.settings?.dashboardDensity === "compact"
      ? "compactDensity"
      : "comfortableDensity";

  return (
    <div className={`app ${densityClass}`}>
      <aside className="sidebar modernSidebar">
        <GuardedLink to="/" className="brand">
          <div className="brandIcon">
            <Sprout size={26} />
          </div>

          <div>
            <h1>Farmers Hub</h1>
            <p>Vendor tools</p>
          </div>
        </GuardedLink>

        <nav className="nav modernNav">
          <GuardedLink
            to="/"
            className={`navLink modernNavLink dashboardNav ${
              location.pathname === "/" ? "active" : ""
            }`}
          >
            <Home size={18} />
            Dashboard
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
                {module.title}
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
          <p>Please wait while Farmers Hub verifies your trial or subscription.</p>
        </div>
      </AppShell>
    );
  }

  if (!user) {
    return (
      <AppShell>
        <div className="emptyState">
          <h2>Start your 15-day trial</h2>
          <p>Create an account to use every Farmers Hub module free for 15 days.</p>

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
          <p>Please wait while Farmers Hub checks your account.</p>
        </div>
      </AppShell>
    );
  }

  if (!user) {
    return (
      <AppShell>
        <div className="emptyState">
          <h2>Create an account to set up Farmers Hub</h2>
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
            <h2>Try every Farmers Hub module before choosing a plan.</h2>
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
          <h2>Keep Farmers Hub active after your trial.</h2>
          <p>
            Choose the plan that fits your workflow. Basic includes 1 module, Growth
            includes 3 modules, and Pro unlocks every Farmers Hub module.
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
          <p>Please wait while Farmers Hub checks your account setup.</p>
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
        <Route path="/baking-planner" element={<AccessGate><BakingPlanner /></AccessGate>} />
        <Route path="/market-prep" element={<AccessGate><MarketPrepPlanner /></AccessGate>} />
        <Route path="/pricing" element={<AccessGate><PricingCalculator /></AccessGate>} />
        <Route path="/permit-grants" element={<AccessGate><PermitGrantTracker /></AccessGate>} />
        <Route path="/lists" element={<AccessGate><Lists /></AccessGate>} />
        <Route path="/calendar" element={<AccessGate><Calendar /></AccessGate>} />
        <Route path="/customers" element={<AccessGate><Customers /></AccessGate>} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </>
  );
}
