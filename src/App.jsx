import { useState } from "react";
import { Link, Route, Routes, useLocation } from "react-router-dom";
import {
  Activity,
  ArrowRight,
  BookOpen,
  Calculator,
  CalendarDays,
  ChefHat,
  ClipboardList,
  FileText,
  Folder,
  Home,
  ListChecks,
  LogIn,
  LogOut,
  PackageCheck,
  Settings,
  Sprout,
  Upload,
  Wheat,
  X
} from "lucide-react";

import SpiceKitchen from "./modules/SpiceKitchen.jsx";
import BakingPlanner from "./modules/BakingPlanner.jsx";
import MarketPrepPlanner from "./modules/MarketPrepPlanner.jsx";
import PricingCalculator from "./modules/PricingCalculator.jsx";
import PermitGrantTracker from "./modules/PermitGrantTracker.jsx";
import Lists from "./modules/Lists.jsx";
import ImportExport from "./modules/ImportExport.jsx";
import AccountSettings from "./modules/AccountSettings.jsx";
import { useAuth } from "./AuthContext.jsx";
import StatCard from "./components/StatCard.jsx";

const modules = [
  {
    title: "Spice Kitchen",
    description:
      "Build seasoning recipes, scale batches, manage ingredients, and calculate production needs.",
    path: "/spice-kitchen",
    icon: ChefHat,
    accent: "spice"
  },
  {
    title: "Baking Planner",
    description:
      "Plan production schedules, baking timelines, dough calculations, and batch workflow.",
    path: "/baking-planner",
    icon: Wheat,
    accent: "sourdough"
  },
  {
    title: "Market Prep Planner",
    description:
      "Estimate harvest, packing, inventory, and product quantities before each market.",
    path: "/market-prep",
    icon: ClipboardList,
    accent: "market"
  },
  {
    title: "Pricing Calculator",
    description:
      "Calculate retail pricing, wholesale pricing, margins, batch costs, and profitability.",
    path: "/pricing",
    icon: Calculator,
    accent: "pricing"
  },
  {
    title: "Permit & Grant Tracker",
    description:
      "Track renewals, permits, grants, deadlines, required documents, and funding opportunities.",
    path: "/permit-grants",
    icon: FileText,
    accent: "grant"
  },
  {
    title: "Lists",
    description:
      "Create reusable checklists for market prep, production, shopping, permits, delivery, and ideas.",
    path: "/lists",
    icon: ListChecks,
    accent: "lists"
  }
];

const dashboardDeadlines = [
  {
    title: "Home-Based Processor Renewal",
    source: "Permit & Grant Tracker",
    due: "Due in 14 days",
    date: "Jun 10",
    accent: "grant"
  },
  {
    title: "Saturday Market Prep Plan",
    source: "Market Prep Planner",
    due: "Due in 21 days",
    date: "Jun 17",
    accent: "market"
  },
  {
    title: "Packaging Supply Checklist",
    source: "Lists",
    due: "Due in 35 days",
    date: "Jul 1",
    accent: "lists"
  }
];

const recentActivity = [
  {
    title: "Updated recipe: Sourdough Loaf",
    source: "Baking Planner",
    time: "2h ago",
    accent: "sourdough"
  },
  {
    title: "Added checklist item: Packaging Supplies",
    source: "Lists",
    time: "5h ago",
    accent: "lists"
  },
  {
    title: "Calculated pricing for Herb Blend",
    source: "Pricing Calculator",
    time: "Yesterday",
    accent: "pricing"
  }
];

async function startStripeCheckout(plan, email, setCheckoutLoading) {
  try {
    setCheckoutLoading(plan);

    const response = await fetch("/api/create-checkout-session", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        plan,
        email: email || null
      })
    });

    const data = await response.json();

    if (!response.ok || !data.url) {
      console.error("Stripe checkout response:", data);
      alert("Could not start checkout. Please try again.");
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

function PricingCards({ checkoutLoading, setCheckoutLoading }) {
  const { user } = useAuth();

  return (
    <section className="pricingPlanGrid">
      <div className="workspacePanel compactPanel">
        <p className="eyebrow">Monthly</p>
        <h3>$10/month</h3>
        <p className="importExportText">
          Includes a 15-day free trial. Best for trying Farmers Hub month-to-month.
        </p>

        <button
          className="primaryButton compactPrimary"
          type="button"
          onClick={() =>
            startStripeCheckout("monthly", user?.email || null, setCheckoutLoading)
          }
          disabled={checkoutLoading === "monthly"}
        >
          {checkoutLoading === "monthly" ? "Opening Checkout..." : "Start Monthly Trial"}
        </button>
      </div>

      <div className="workspacePanel compactPanel">
        <p className="eyebrow">Yearly</p>
        <h3>$110/year</h3>
        <p className="importExportText">
          Includes a 15-day free trial. Save compared to monthly billing.
        </p>

        <button
          className="primaryButton compactPrimary"
          type="button"
          onClick={() =>
            startStripeCheckout("annual", user?.email || null, setCheckoutLoading)
          }
          disabled={checkoutLoading === "annual"}
        >
          {checkoutLoading === "annual" ? "Opening Checkout..." : "Start Yearly Trial"}
        </button>
      </div>
    </section>
  );
}

function WelcomePricingModal({ onClose }) {
  const { loginWithGoogle } = useAuth();
  const [checkoutLoading, setCheckoutLoading] = useState("");

  return (
    <div className="pricingModalOverlay">
      <div className="pricingModal">
        <button className="modalCloseButton" type="button" onClick={onClose}>
          <X size={18} />
        </button>

        <div className="pricingModalHeader">
          <p className="eyebrow">Welcome to Farmers Hub</p>
          <h2>Simple tools for farmers market vendors.</h2>
          <p>
            Start with a 15-day free trial. Farmers Hub helps small vendors stay
            organized, plan smarter, price confidently, and keep important business
            details in one place.
          </p>
        </div>

        <div className="pricingFeatureGrid">
          <div>
            <strong>Plan your market day</strong>
            <span>Prep lists, packing quantities, harvest needs, and reusable checklists.</span>
          </div>

          <div>
            <strong>Price with confidence</strong>
            <span>Calculate costs, margins, retail prices, wholesale prices, and profitability.</span>
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
          checkoutLoading={checkoutLoading}
          setCheckoutLoading={setCheckoutLoading}
        />

        <div className="pricingModalFooter">
          <button className="secondaryButton" type="button" onClick={loginWithGoogle}>
            <LogIn size={16} />
            Already have an account? Sign in
          </button>

          <button className="textButton" type="button" onClick={onClose}>
            Continue browsing
          </button>
        </div>
      </div>
    </div>
  );
}

function AccountStatusCard() {
  const {
    user,
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
        <h3>Save your work</h3>
        <p>Sign in once to use Farmers Hub tools and save your data.</p>

        <button className="primaryButton fullButton" onClick={loginWithGoogle}>
          <LogIn size={16} />
          Sign in with Google
        </button>

        <Link to="/subscribe" className="secondaryButton fullButton">
          View Plans
        </Link>
      </div>
    );
  }

  return (
    <div className="authCard">
      <p className="eyebrow">Account</p>

      <div className="userRow">
        {user.photoURL ? (
          <img src={user.photoURL} alt={user.displayName || "User"} />
        ) : (
          <div className="userInitial">
            {(user.displayName || user.email || "U").charAt(0)}
          </div>
        )}

        <div>
          <strong>{user.displayName || "Signed in"}</strong>
          <p>{user.email}</p>
        </div>
      </div>

      <div className={`accountStatusPill ${accessStatus.status}`}>
        {isAdmin ? "Admin access" : null}
        {isTrial ? `${daysRemaining} trial days left` : null}
        {accessStatus.status === "active" ? "Active subscription" : null}
        {isExpired ? "Subscription required" : null}
      </div>

      {isExpired ? (
        <Link to="/subscribe" className="primaryButton fullButton">
          Upgrade Account
        </Link>
      ) : null}

      <Link to="/account-settings" className="secondaryButton fullButton">
        <Settings size={16} />
        Account Settings
      </Link>

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
        <Link to="/" className="brand">
          <div className="brandIcon">
            <Sprout size={26} />
          </div>

          <div>
            <h1>Farmers Hub</h1>
            <p>Vendor tools</p>
          </div>
        </Link>

        <nav className="nav modernNav">
          <Link
            to="/"
            className={`navLink modernNavLink dashboardNav ${
              location.pathname === "/" ? "active" : ""
            }`}
          >
            <Home size={18} />
            Dashboard
          </Link>

          {modules.map((module) => {
            const Icon = module.icon;

            return (
              <Link
                key={module.path}
                to={module.path}
                className={`navLink modernNavLink moduleNav ${module.accent} ${
                  location.pathname === module.path ? "active" : ""
                }`}
              >
                <Icon size={18} />
                {module.title}
              </Link>
            );
          })}
        </nav>

        <AccountStatusCard />

        <div className="sidebarCard importExportSidebarCard">
          <p className="eyebrow">Backup</p>
          <h3>Import / Export</h3>
          <p>Move saved Hub data between accounts.</p>

          <Link to="/import-export" className="secondaryButton fullButton">
            <Upload size={16} />
            Import / Export
          </Link>
        </div>

        <div className="sidebarCard">
          <p className="eyebrow">Current build</p>
          <h3>Foundation</h3>
          <p>Modular dashboard structure ready for future sub-apps.</p>
        </div>
      </aside>

      <main className="main modernMain">{children}</main>
    </div>
  );
}

function AccessGate({ children }) {
  const { user, authLoading, accountLoading, loginWithGoogle, hasAccess, isExpired } =
    useAuth();

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
          <h2>Sign in to continue</h2>
          <p>Farmers Hub tools require an account so your data can be saved securely.</p>

          <button className="primaryButton" onClick={loginWithGoogle}>
            <LogIn size={16} />
            Sign in with Google
          </button>
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

  return <AppShell>{children}</AppShell>;
}

function Subscribe() {
  const [checkoutLoading, setCheckoutLoading] = useState("");

  return (
    <div className="subscribePage">
      <section className="moduleHero compactHero noActionHero">
        <div>
          <p className="eyebrow">Subscription Required</p>
          <h2>Choose your Farmers Hub plan.</h2>
          <p>
            Start with a 15-day free trial. Upgrade to continue accessing your saved
            tools, recipes, pricing sheets, market plans, permit records, and lists.
          </p>
        </div>
      </section>

      <PricingCards
        checkoutLoading={checkoutLoading}
        setCheckoutLoading={setCheckoutLoading}
      />
    </div>
  );
}

function Dashboard() {
  const {
    user,
    authLoading,
    accountLoading,
    daysRemaining,
    isTrial,
    accessStatus
  } = useAuth();

  const [showWelcomePricing, setShowWelcomePricing] = useState(true);

  const shouldShowWelcomePricing =
    !authLoading && !accountLoading && !user && showWelcomePricing;

  const displayName = user?.displayName || "ArMi Farms";
  const trialDaysDisplay =
    isTrial ? daysRemaining : accessStatus.status === "active" ? "Active" : "15";

  return (
    <AppShell>
      {shouldShowWelcomePricing ? (
        <WelcomePricingModal onClose={() => setShowWelcomePricing(false)} />
      ) : null}

      <section className="modernHero dashboardHeroV2">
        <div className="modernHeroMain dashboardHeroMainV2">
          <p className="eyebrow">Farmers market vendor SaaS</p>

          <h2>{user ? `Welcome back, ${displayName}` : "One hub for market vendors."}</h2>

          <p className="heroText">
            Track your vendor tools, upcoming deadlines, saved workflows, recipes,
            pricing, prep plans, and business activity from one clean dashboard.
          </p>
        </div>

        <div className="heroPanel modernAccessPanel dashboardDatePanel">
          <div>
            <p className="eyebrow">Access</p>
            <h3>{isTrial ? `${daysRemaining}-day trial` : "15-day free trial"}</h3>
            <p>
              {user
                ? "Manage your subscription, saved tools, and account details."
                : "New users get 15 days to try Farmers Hub."}
            </p>
          </div>

          <Link to={user ? "/account-settings" : "/subscribe"} className="primaryButton">
            {user ? "Manage Account" : "View Plans"}
            <ArrowRight size={18} />
          </Link>
        </div>
      </section>

      <section className="dashboardOverviewGrid">
        <StatCard
          icon={PackageCheck}
          label="Active Modules"
          value={`${modules.length} / ${modules.length}`}
          sub="All workspaces ready"
          accent="pricing"
        />

        <StatCard
          icon={CalendarDays}
          label="Trial Days"
          value={trialDaysDisplay}
          sub={isTrial ? "days remaining" : "available to new users"}
          accent="sourdough"
        />

        <StatCard
          icon={BookOpen}
          label="Saved Recipes"
          value="12"
          sub="across recipe tools"
          accent="market"
        />

        <StatCard
          icon={FileText}
          label="Upcoming Permits"
          value="2"
          sub="need attention"
          accent="grant"
        />

        <StatCard
          icon={Folder}
          label="Open Tasks"
          value="7"
          sub="checklist items"
          accent="lists"
        />
      </section>

      <section className="dashboardTwoColumn">
        <div className="dashboardPanel">
          <div className="sectionHeader dashboardPanelHeader">
            <div>
              <p className="eyebrow">Workspaces</p>
              <h2>Jump back in</h2>
            </div>
          </div>

          <div className="dashboardList">
            {modules.map((module) => {
              const Icon = module.icon;

              return (
                <div className="dashboardRow" key={module.path}>
                  <div className={`dashboardRowIcon ${module.accent}`}>
                    <Icon size={20} />
                  </div>

                  <div>
                    <h4>{module.title}</h4>
                    <p>{module.description}</p>
                  </div>

                  <Link to={module.path} className="secondaryButton compactButton">
                    Open
                  </Link>
                </div>
              );
            })}
          </div>
        </div>

        <div className="dashboardSideStack">
          <div className="dashboardPanel">
            <div className="sectionHeader dashboardPanelHeader">
              <div>
                <p className="eyebrow">Deadlines</p>
                <h2>Upcoming</h2>
              </div>
            </div>

            <div className="dashboardList">
              {dashboardDeadlines.map((item) => (
                <div className="dashboardRow compactDashboardRow" key={item.title}>
                  <div className={`dashboardRowIcon ${item.accent}`}>
                    <CalendarDays size={18} />
                  </div>

                  <div>
                    <h4>{item.title}</h4>
                    <p>{item.source}</p>
                  </div>

                  <div className="dashboardRightMeta">
                    <span className="dashboardDuePill">{item.due}</span>
                    <small>{item.date}</small>
                  </div>
                </div>
              ))}
            </div>

            <div className="dashboardPanelFooter">
              <Link to="/permit-grants" className="secondaryButton compactButton">
                View all
              </Link>
            </div>
          </div>

          <div className="dashboardPanel">
            <div className="sectionHeader dashboardPanelHeader">
              <div>
                <p className="eyebrow">Activity</p>
                <h2>Recent Activity</h2>
              </div>
            </div>

            <div className="dashboardList">
              {recentActivity.map((item) => (
                <div className="dashboardRow compactDashboardRow" key={item.title}>
                  <div className={`dashboardRowIcon ${item.accent}`}>
                    <Activity size={18} />
                  </div>

                  <div>
                    <h4>{item.title}</h4>
                    <p>{item.source}</p>
                  </div>

                  <small className="dashboardTime">{item.time}</small>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="dashboardFooterBanner">
        <div>
          <p className="eyebrow">Subscription</p>
          <h3>{isTrial ? "Need more time?" : "Keep your vendor tools active."}</h3>
          <p>
            Manage your subscription or upgrade anytime to keep your saved tools,
            workflows, and records available.
          </p>
        </div>

        <div className="button-row">
          <Link to="/account-settings" className="secondaryButton">
            Manage Subscription
          </Link>

          <Link to="/subscribe" className="primaryButton">
            Upgrade Now
          </Link>
        </div>
      </section>
    </AppShell>
  );
}

function NotFound() {
  return (
    <AppShell>
      <div className="emptyState">
        <h2>Page not found</h2>
        <p>This module does not exist yet.</p>

        <Link to="/" className="primaryButton">
          Back to Dashboard
        </Link>
      </div>
    </AppShell>
  );
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Dashboard />} />

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
      <Route path="/import-export" element={<AccessGate><ImportExport /></AccessGate>} />

      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}
