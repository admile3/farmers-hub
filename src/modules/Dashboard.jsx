import { useEffect, useMemo, useState } from "react";
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
  ListChecks,
  Users,
  Wheat
} from "lucide-react";
import { doc, getDoc } from "firebase/firestore";

import { useAuth } from "../AuthContext.jsx";
import { db } from "../firebase";
import StatCard from "../components/StatCard.jsx";
import { getSpiceRecipes } from "../services/spiceKitchenService.js";
import { getPermitGrantItems } from "../services/permitGrantService.js";
import { getLists } from "../services/listsService.js";
import { getCustomers } from "../services/customerService.js";

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

export default function Dashboard({
  AppShell,
  GuardedLink,
  WelcomePricingModal
}) {
  const {
    user,
    accountProfile,
    authLoading,
    accountLoading,
    daysRemaining,
    isTrial,
    accessStatus
  } = useAuth();

  const [showWelcomePricing, setShowWelcomePricing] = useState(true);
  const [dashboardData, setDashboardData] = useState({
    spiceRecipes: [],
    bakingRecipes: [],
    permitItems: [],
    lists: [],
    customers: [],
    loading: false
  });

  const shouldShowWelcomePricing =
    !authLoading && !accountLoading && !user && showWelcomePricing;

  useEffect(() => {
    async function loadDashboardData() {
      if (!user) {
        setDashboardData({
          spiceRecipes: [],
          bakingRecipes: [],
          permitItems: [],
          lists: [],
          customers: [],
          loading: false
        });
        return;
      }

      setDashboardData((current) => ({ ...current, loading: true }));

      try {
        const [spiceRecipes, permitItems, lists, customers, bakingSnapshot] =
          await Promise.all([
            getSpiceRecipes(user.uid),
            getPermitGrantItems(user.uid),
            getLists(user.uid),
            getCustomers(user.uid),
            getDoc(doc(db, "users", user.uid, "bakingPlanner", "main"))
          ]);

        const bakingData = bakingSnapshot.exists() ? bakingSnapshot.data() : {};
        const bakingRecipes = Array.isArray(bakingData.recipes)
          ? bakingData.recipes
          : [];

        setDashboardData({
          spiceRecipes: Array.isArray(spiceRecipes) ? spiceRecipes : [],
          bakingRecipes,
          permitItems: Array.isArray(permitItems) ? permitItems : [],
          lists: Array.isArray(lists) ? lists : [],
          customers: Array.isArray(customers) ? customers : [],
          loading: false
        });
      } catch (error) {
        console.error("Could not load dashboard data:", error);
        setDashboardData((current) => ({ ...current, loading: false }));
      }
    }

    loadDashboardData();
  }, [user]);

  const displayName =
    accountProfile?.displayName?.trim() ||
    user?.displayName ||
    user?.email?.split("@")[0] ||
    "there";

  const trialDaysDisplay =
    isTrial ? daysRemaining : accessStatus.status === "active" ? "Active" : "15";

  const savedRecipeCount =
    dashboardData.spiceRecipes.length + dashboardData.bakingRecipes.length;

  const openTaskCount = dashboardData.lists.reduce((sum, list) => {
    const total = Number(list.itemCount) || 0;
    const checked = Number(list.checkedCount) || 0;
    return sum + Math.max(0, total - checked);
  }, 0);

  const upcomingPermitsCount = useMemo(() => {
    return dashboardData.permitItems.filter((item) => {
      const relevantDate = toDate(item.renewalDate || item.dueDate);
      const days = daysUntil(relevantDate);
      return days !== null && days >= 0 && days <= 60;
    }).length;
  }, [dashboardData.permitItems]);

  const dashboardDeadlines = useMemo(() => {
    return dashboardData.permitItems
      .map((item) => {
        const relevantDate = toDate(item.renewalDate || item.dueDate);
        const days = daysUntil(relevantDate);

        return {
          id: item.id || "",
          title: item.name || "Untitled Record",
          source: item.type || "Permit & Grant Tracker",
          due: formatDueLabel(days),
          date: formatShortDate(relevantDate),
          days,
          accent: "grant"
        };
      })
      .filter((item) => item.days !== null && item.days >= 0 && item.days <= 60)
      .sort((a, b) => a.days - b.days)
      .slice(0, 3);
  }, [dashboardData.permitItems]);

  const recentActivity = useMemo(() => {
    const activity = [];

    dashboardData.spiceRecipes.forEach((recipe) => {
      const date = toDate(recipe.updatedAt || recipe.createdAt);

      if (date) {
        activity.push({
          title: `Updated recipe: ${recipe.name || "Spice recipe"}`,
          source: "Spice Kitchen",
          time: formatActivityTime(date),
          timestamp: date.getTime(),
          accent: "spice",
          path: "/spice-kitchen"
        });
      }
    });

    dashboardData.bakingRecipes.forEach((recipe) => {
      activity.push({
        title: `Saved recipe: ${recipe.name || "Baking recipe"}`,
        source: "Baking Planner",
        time: "Recently",
        timestamp: 0,
        accent: "sourdough",
        path: "/baking-planner"
      });
    });

    dashboardData.permitItems.forEach((item) => {
      const date = toDate(item.updatedAt || item.createdAt);

      if (date) {
        activity.push({
          title: `Updated record: ${item.name || "Permit or grant"}`,
          source: "Permit & Grant Tracker",
          time: formatActivityTime(date),
          timestamp: date.getTime(),
          accent: "grant",
          path: `/permit-grants?record=${encodeURIComponent(item.id || "")}`
        });
      }
    });

    dashboardData.lists.forEach((list) => {
      const date = toDate(list.updatedAt || list.createdAt);

      if (date) {
        activity.push({
          title: `Updated list: ${list.name || "Checklist"}`,
          source: "Lists",
          time: formatActivityTime(date),
          timestamp: date.getTime(),
          accent: "lists",
          path: "/lists"
        });
      }
    });

    dashboardData.customers.forEach((customer) => {
      const date = toDate(customer.updatedAt || customer.createdAt);

      if (date) {
        activity.push({
          title: `Updated customer: ${customer.name || "Customer"}`,
          source: "Customers",
          time: formatActivityTime(date),
          timestamp: date.getTime(),
          accent: "customers",
          path: `/customers?customer=${encodeURIComponent(customer.id || "")}`
        });
      }
    });

    return activity.sort((a, b) => b.timestamp - a.timestamp).slice(0, 3);
  }, [
    dashboardData.spiceRecipes,
    dashboardData.bakingRecipes,
    dashboardData.permitItems,
    dashboardData.lists,
    dashboardData.customers
  ]);

  const shellContent = (
    <>
      {shouldShowWelcomePricing && WelcomePricingModal ? (
        <WelcomePricingModal onClose={() => setShowWelcomePricing(false)} />
      ) : null}

      <section className="modernHero dashboardHeroV2">
        <div className="modernHeroMain dashboardHeroMainV2">
          <p className="eyebrow">Your business command center</p>

          <h2>{user ? `Welcome back, ${displayName}` : "One hub for market vendors."}</h2>

          <p className="heroText">
            Manage recipes, products, pricing, customers, deadlines, prep plans,
            and business activity from one dashboard.
          </p>
        </div>

        <div className="heroPanel modernAccessPanel dashboardDatePanel">
          <div>
            <h3>{isTrial ? `${daysRemaining} trial days left` : "15-day free trial"}</h3>
            <p>
              {user
                ? "Manage account, subscription, and saved tools."
                : "Try every Farmers Hub tool before choosing a plan."}
            </p>
          </div>

          <GuardedLink to={user ? "/account-settings" : "/subscribe"} className="primaryButton">
            {user ? "Manage Account" : "View Plans"}
            <ArrowRight size={18} />
          </GuardedLink>
        </div>
      </section>

      <section className="dashboardOverviewGrid">
        <StatCard
          icon={Users}
          label="Customers"
          value={dashboardData.loading ? "..." : dashboardData.customers.length}
          sub="saved contacts"
          accent="customers"
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
          value={dashboardData.loading ? "..." : savedRecipeCount}
          sub="Spice Kitchen + Baking Planner"
          accent="market"
        />

        <StatCard
          icon={FileText}
          label="Upcoming Permits"
          value={dashboardData.loading ? "..." : upcomingPermitsCount}
          sub="next 60 days"
          accent="grant"
        />

        <StatCard
          icon={Folder}
          label="Open Tasks"
          value={dashboardData.loading ? "..." : openTaskCount}
          sub="unchecked list items"
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

                  <GuardedLink to={module.path} className="dashboardRowTextLink">
                    <h4>{module.title}</h4>
                    <p>{module.description}</p>
                  </GuardedLink>

                  <GuardedLink to={module.path} className="secondaryButton compactButton">
                    Open
                  </GuardedLink>
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
                <h2>
                  Upcoming{" "}
                  <span className="dashboardHeadingMeta">(next 60 days)</span>
                </h2>
              </div>
            </div>

            <div className="dashboardList">
              {dashboardDeadlines.length ? (
                dashboardDeadlines.map((item) => (
                  <div className="dashboardRow compactDashboardRow" key={item.id || item.title}>
                    <div className={`dashboardRowIcon ${item.accent}`}>
                      <CalendarDays size={18} />
                    </div>

                    <GuardedLink
                      to={`/permit-grants?record=${encodeURIComponent(item.id)}`}
                      className="dashboardRowTextLink"
                    >
                      <h4>{item.title}</h4>
                      <p>{item.source}</p>
                    </GuardedLink>

                    <div className="dashboardRightMeta">
                      <span className="dashboardDuePill">{item.due}</span>
                      <small>{item.date}</small>
                    </div>
                  </div>
                ))
              ) : (
                <p className="dashboardEmpty">No upcoming deadlines found.</p>
              )}
            </div>

            <div className="dashboardPanelFooter">
              <GuardedLink to="/permit-grants" className="secondaryButton compactButton">
                View all
              </GuardedLink>
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
              {recentActivity.length ? (
                recentActivity.map((item) => (
                  <div className="dashboardRow compactDashboardRow" key={`${item.title}-${item.time}`}>
                    <div className={`dashboardRowIcon ${item.accent}`}>
                      <Activity size={18} />
                    </div>

                    <GuardedLink to={item.path || "/"} className="dashboardRowTextLink">
                      <h4>{item.title}</h4>
                      <p>{item.source}</p>
                    </GuardedLink>

                    <small className="dashboardTime">{item.time}</small>
                  </div>
                ))
              ) : (
                <p className="dashboardEmpty">
                  Recent activity will appear after saved updates.
                </p>
              )}
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
          <GuardedLink to="/account-settings" className="secondaryButton">
            Manage Subscription
          </GuardedLink>

          <GuardedLink to="/subscribe" className="primaryButton">
            Upgrade Now
          </GuardedLink>
        </div>
      </section>
    </>
  );

  if (AppShell) {
    return <AppShell>{shellContent}</AppShell>;
  }

  return shellContent;
}

export { modules as dashboardModules };
