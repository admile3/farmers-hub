import { Link, Route, Routes } from "react-router-dom";
import {
  ArrowRight,
  ChefHat,
  ClipboardList,
  DollarSign,
  FileText,
  LogIn,
  LogOut,
  Sprout,
  Wheat
} from "lucide-react";

import SpiceKitchen from "./modules/SpiceKitchen.jsx";
import BakingPlanner from "./modules/BakingPlanner.jsx";
import { useAuth } from "./AuthContext.jsx";

const modules = [
  {
    title: "Spice Kitchen",
    description:
      "Build seasoning recipes, scale batches, manage ingredients, and calculate production needs.",
    path: "/spice-kitchen",
    icon: ChefHat,
    status: "Ready",
    accent: "spice"
  },
  {
    title: "Baking Planner",
    description:
      "Plan production schedules, baking timelines, dough calculations, and batch workflow.",
    path: "/baking-planner",
    icon: Wheat,
    status: "Ready",
    accent: "sourdough"
  },
  {
    title: "Market Prep Planner",
    description:
      "Estimate harvest, packing, inventory, and product quantities before each market.",
    path: "#",
    icon: ClipboardList,
    status: "Coming Soon",
    accent: "market"
  },
  {
    title: "Pricing Calculator",
    description:
      "Calculate retail pricing, wholesale pricing, margins, batch costs, and profitability.",
    path: "#",
    icon: DollarSign,
    status: "Coming Soon",
    accent: "pricing"
  },
  {
    title: "Permit & Grant Tracker",
    description:
      "Track renewals, permits, grants, deadlines, required documents, and funding opportunities.",
    path: "#",
    icon: FileText,
    status: "Coming Soon",
    accent: "grant"
  }
];

function AppShell({ children }) {
  const { user, loginWithGoogle, logout, authLoading } = useAuth();

  return (
    <div className="app">
      <aside className="sidebar">
        <Link to="/" className="brand">
          <div className="brandIcon">
            <Sprout size={26} />
          </div>

          <div>
            <h1>Farmers Hub</h1>
            <p>Vendor tools</p>
          </div>
        </Link>

        <nav className="nav">
          <Link to="/" className="navLink">
            Dashboard
          </Link>

          <Link to="/spice-kitchen" className="navLink">
            Spice Kitchen
          </Link>

          <Link to="/baking-planner" className="navLink">
            Baking Planner
          </Link>

          <span className="navLink disabled">Market Prep</span>
          <span className="navLink disabled">Pricing</span>
        </nav>

        <div className="authCard">
          {authLoading ? (
            <p>Checking sign-in...</p>
          ) : user ? (
            <>
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

              <button className="secondaryButton" onClick={logout}>
                <LogOut size={16} />
                Sign out
              </button>
            </>
          ) : (
            <>
              <p className="eyebrow">Account</p>

              <h3>Save your work</h3>

              <p>
                Sign in once to use Farmers Hub tools and save your data.
              </p>

              <button
                className="primaryButton fullButton"
                onClick={loginWithGoogle}
              >
                <LogIn size={16} />
                Sign in with Google
              </button>
            </>
          )}
        </div>

        <div className="sidebarCard">
          <p className="eyebrow">Current build</p>

          <h3>Foundation</h3>

          <p>
            Modular dashboard structure ready for future sub-apps.
          </p>
        </div>
      </aside>

      <main className="main">{children}</main>
    </div>
  );
}

function Dashboard() {
  return (
    <AppShell>
      <section className="hero">
        <div>
          <p className="eyebrow">Farmers market vendor SaaS</p>

          <h2>
            One hub for the tools that keep small food businesses moving.
          </h2>

          <p className="heroText">
            Farmers Hub is built as a parent dashboard for standalone vendor
            tools. Start with Spice Kitchen and Baking Planner, then expand into
            market prep, pricing, permits, grants, and more without rebuilding
            the foundation.
          </p>
        </div>

        <div className="heroPanel">
          <div>
            <p className="eyebrow">Newest module</p>

            <h3>Baking Planner</h3>

            <p>
              Production schedules, dough planning, batch calculations, and
              baking workflow management.
            </p>
          </div>

          <Link to="/baking-planner" className="primaryButton">
            Open Baking Planner
            <ArrowRight size={18} />
          </Link>
        </div>
      </section>

      <section className="sectionHeader">
        <div>
          <p className="eyebrow">Modules</p>
          <h2>Choose a workspace</h2>
        </div>
      </section>

      <section className="moduleGrid">
        {modules.map((module) => {
          const Icon = module.icon;
          const isReady = module.status === "Ready";

          const cardContent = (
            <div className={`moduleCard ${module.accent}`}>
              <div className="moduleTop">
                <div className="moduleIcon">
                  <Icon size={24} />
                </div>

                <span className={isReady ? "status ready" : "status"}>
                  {module.status}
                </span>
              </div>

              <h3>{module.title}</h3>

              <p>{module.description}</p>

              <div className="moduleFooter">
                <span>{isReady ? "Open module" : "Planned module"}</span>
                <ArrowRight size={18} />
              </div>
            </div>
          );

          return isReady ? (
            <Link key={module.title} to={module.path} className="cardLink">
              {cardContent}
            </Link>
          ) : (
            <div key={module.title} className="cardLink inactive">
              {cardContent}
            </div>
          );
        })}
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
        path="/spice-kitchen"
        element={
          <AppShell>
            <SpiceKitchen />
          </AppShell>
        }
      />

      <Route
        path="/baking-planner"
        element={
          <AppShell>
            <BakingPlanner />
          </AppShell>
        }
      />

      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}
