import { useEffect, useMemo, useState } from "react";
import {
  Activity,
  Archive,
  ArrowRight,
  Beef,
  BookOpen,
  Calculator,
  CalendarDays,
  ChefHat,
  CircleHelp,
  ClipboardList,
  DollarSign,
  FileText,
  FlaskConical,
  Flower2,
  Folder,
  Leaf,
  ListChecks,
  PackageCheck,
  PawPrint,
  Printer,
  Sprout,
  Users,
  Check,
  GripVertical,
  Plus,
  Settings2,
  X,
  Wheat
} from "lucide-react";
import { doc, getDoc } from "firebase/firestore";

import { useAuth } from "../AuthContext.jsx";
import { db } from "../firebase";
import StatCard from "../components/StatCard.jsx";
import ModuleHero from "../components/ModuleHero.jsx";
import ModuleGuideModal from "../components/ModuleGuideModal.jsx";
import DashboardGuideContent from "../components/DashboardGuideContent.jsx";
import { getSpiceRecipes } from "../services/spiceKitchenService.js";
import { getPermitGrantItems } from "../services/permitGrantService.js";
import { getLists } from "../services/listsService.js";
import { getCustomers } from "../services/customerService.js";

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
    key: "butcherboard",
    title: "Butcher Board",
    description:
      "Track animal batches, feed costs, processing yields, finished cuts, and meat inventory.",
    path: "/butcherboard",
    icon: Beef,
    accent: "livestock"
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
      "Track individual animals, groups, lots, herd events, costs, locations, health notes, and processing readiness.",
    path: "/herd-tracker",
    icon: PawPrint,
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

const DASHBOARD_STAT_LIMIT = 5;
const DEFAULT_DASHBOARD_STAT_KEYS = [
  "customers",
  "trialDays",
  "savedRecipes",
  "upcomingPermits",
  "openTasks"
];

function getDashboardStatStorageKey(userId) {
  return userId ? `dashboardStatCards_${userId}` : "dashboardStatCards_guest";
}

function normalizeDashboardStatKeys(savedKeys, availableKeys, fallbackToDefaults = true) {
  const unique = Array.isArray(savedKeys)
    ? savedKeys.filter((key, index, array) => (
        availableKeys.includes(key) && array.indexOf(key) === index
      ))
    : [];

  if (unique.length || !fallbackToDefaults) {
    return unique.slice(0, DASHBOARD_STAT_LIMIT);
  }

  return DEFAULT_DASHBOARD_STAT_KEYS
    .filter((key) => availableKeys.includes(key))
    .slice(0, DASHBOARD_STAT_LIMIT);
}



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
  const [showGuide, setShowGuide] = useState(false);
  const [showStatPicker, setShowStatPicker] = useState(false);
  const [selectedStatKeys, setSelectedStatKeys] = useState(DEFAULT_DASHBOARD_STAT_KEYS);
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
    if (!user || shouldShowWelcomePricing) return;

    const guideHidden = localStorage.getItem("hideModuleGuide_dashboard") === "true";

    if (!guideHidden) {
      setShowGuide(true);
    }
  }, [user, shouldShowWelcomePricing]);

  useEffect(() => {
    const availableKeys = [
      "customers",
      "trialDays",
      "savedRecipes",
      "upcomingPermits",
      "openTasks",
      "spiceRecipes",
      "bakingRecipes",
      "lists",
      "permitRecords",
      "recentActivity",
      "bakingPlanner",
      "butcherBoard",
      "calendar",
      "farmApothecary",
      "flowerStudio",
      "herdTracker",
      "inventory",
      "marketPrep",
      "orders",
      "plantingScheduler",
      "preservedFoods",
      "productsPricing",
      "sales",
      "thermalPrinter"
    ];
    const storageKey = getDashboardStatStorageKey(user?.uid || "guest");

    try {
      const saved = window.localStorage.getItem(storageKey);
      const parsed = saved ? JSON.parse(saved) : null;
      setSelectedStatKeys(normalizeDashboardStatKeys(parsed, availableKeys));
    } catch (error) {
      console.warn("Could not load dashboard stat card preferences:", error);
      setSelectedStatKeys(normalizeDashboardStatKeys(DEFAULT_DASHBOARD_STAT_KEYS, availableKeys));
    }
  }, [user?.uid]);

  useEffect(() => {
    const storageKey = getDashboardStatStorageKey(user?.uid || "guest");

    try {
      window.localStorage.setItem(storageKey, JSON.stringify(selectedStatKeys));
    } catch (error) {
      console.warn("Could not save dashboard stat card preferences:", error);
    }
  }, [selectedStatKeys, user?.uid]);

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
      .slice(0, 4);
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

    return activity.sort((a, b) => b.timestamp - a.timestamp).slice(0, 4);
  }, [
    dashboardData.spiceRecipes,
    dashboardData.bakingRecipes,
    dashboardData.permitItems,
    dashboardData.lists,
    dashboardData.customers
  ]);


  const dashboardStatOptions = useMemo(
    () => [
      {
        key: "customers",
        icon: Users,
        label: "Customers",
        value: dashboardData.loading ? "..." : dashboardData.customers.length,
        sub: "saved contacts",
        accent: "customers",
        source: "Customers"
      },
      {
        key: "trialDays",
        icon: CalendarDays,
        label: "Trial Days",
        value: trialDaysDisplay,
        sub: isTrial ? "days remaining" : "available to new users",
        accent: "sourdough",
        source: "Account"
      },
      {
        key: "savedRecipes",
        icon: BookOpen,
        label: "Saved Recipes",
        value: dashboardData.loading ? "..." : savedRecipeCount,
        sub: "Spice Kitchen + Baking Planner",
        accent: "market",
        source: "Recipes"
      },
      {
        key: "upcomingPermits",
        icon: FileText,
        label: "Upcoming Permits",
        value: dashboardData.loading ? "..." : upcomingPermitsCount,
        sub: "next 60 days",
        accent: "grant",
        source: "Permit & Grant Tracker"
      },
      {
        key: "openTasks",
        icon: Folder,
        label: "Open Tasks",
        value: dashboardData.loading ? "..." : openTaskCount,
        sub: "unchecked list items",
        accent: "lists",
        source: "Lists"
      },
      {
        key: "spiceRecipes",
        icon: ChefHat,
        label: "Spice Recipes",
        value: dashboardData.loading ? "..." : dashboardData.spiceRecipes.length,
        sub: "seasoning formulas",
        accent: "spice",
        source: "Spice Kitchen"
      },
      {
        key: "bakingRecipes",
        icon: Wheat,
        label: "Baking Recipes",
        value: dashboardData.loading ? "..." : dashboardData.bakingRecipes.length,
        sub: "saved bake formulas",
        accent: "sourdough",
        source: "Baking Planner"
      },
      {
        key: "lists",
        icon: ListChecks,
        label: "Saved Lists",
        value: dashboardData.loading ? "..." : dashboardData.lists.length,
        sub: "checklists",
        accent: "lists",
        source: "Lists"
      },
      {
        key: "permitRecords",
        icon: FileText,
        label: "Permit Records",
        value: dashboardData.loading ? "..." : dashboardData.permitItems.length,
        sub: "tracked records",
        accent: "grant",
        source: "Permit & Grant Tracker"
      },
      {
        key: "recentActivity",
        icon: Activity,
        label: "Recent Activity",
        value: dashboardData.loading ? "..." : recentActivity.length,
        sub: "latest updates",
        accent: "orders",
        source: "Dashboard"
      },
      {
        key: "bakingPlanner",
        icon: Wheat,
        label: "Baking Planner",
        value: dashboardData.loading ? "..." : dashboardData.bakingRecipes.length,
        sub: "saved recipes",
        accent: "sourdough",
        source: "Baking Planner"
      },
      {
        key: "butcherBoard",
        icon: Beef,
        label: "Butcher Board",
        value: "Ready",
        sub: "processing workspace",
        accent: "livestock",
        source: "Butcher Board"
      },
      {
        key: "calendar",
        icon: CalendarDays,
        label: "Calendar",
        value: upcomingPermitsCount,
        sub: "upcoming deadlines",
        accent: "calendar",
        source: "Calendar"
      },
      {
        key: "farmApothecary",
        icon: Leaf,
        label: "Farm Apothecary",
        value: "Ready",
        sub: "batch workspace",
        accent: "apothecary",
        source: "Farm Apothecary"
      },
      {
        key: "flowerStudio",
        icon: Flower2,
        label: "Flower Studio",
        value: "Ready",
        sub: "arrangement workspace",
        accent: "flowers",
        source: "Flower Studio"
      },
      {
        key: "herdTracker",
        icon: PawPrint,
        label: "Herd Tracker",
        value: "Ready",
        sub: "animal records",
        accent: "herd",
        source: "Herd Tracker"
      },
      {
        key: "inventory",
        icon: Archive,
        label: "Inventory",
        value: "Ready",
        sub: "stock tracking",
        accent: "inventory",
        source: "Inventory"
      },
      {
        key: "marketPrep",
        icon: ClipboardList,
        label: "Market Prep",
        value: "Ready",
        sub: "packing plans",
        accent: "market",
        source: "Market Prep Planner"
      },
      {
        key: "orders",
        icon: PackageCheck,
        label: "Orders",
        value: "Ready",
        sub: "order tracking",
        accent: "orders",
        source: "Orders"
      },
      {
        key: "plantingScheduler",
        icon: Sprout,
        label: "Planting Scheduler",
        value: "Ready",
        sub: "crop planning",
        accent: "planting",
        source: "Planting Scheduler"
      },
      {
        key: "preservedFoods",
        icon: FlaskConical,
        label: "Preserved Foods",
        value: "Ready",
        sub: "recipe + batch logs",
        accent: "preserved",
        source: "Preserved Foods"
      },
      {
        key: "productsPricing",
        icon: Calculator,
        label: "Products & Pricing",
        value: "Ready",
        sub: "margin workspace",
        accent: "pricing",
        source: "Products & Pricing"
      },
      {
        key: "sales",
        icon: DollarSign,
        label: "Sales",
        value: "Ready",
        sub: "revenue tracking",
        accent: "sales",
        source: "Sales"
      },
      {
        key: "thermalPrinter",
        icon: Printer,
        label: "Thermal Printer",
        value: "Ready",
        sub: "label printing",
        accent: "thermal",
        source: "Thermal Printer"
      }
    ],
    [
      dashboardData.loading,
      dashboardData.customers.length,
      dashboardData.spiceRecipes.length,
      dashboardData.bakingRecipes.length,
      dashboardData.lists.length,
      dashboardData.permitItems.length,
      trialDaysDisplay,
      isTrial,
      savedRecipeCount,
      upcomingPermitsCount,
      openTaskCount,
      recentActivity.length
    ]
  );

  const availableDashboardStatKeys = useMemo(
    () => dashboardStatOptions.map((option) => option.key),
    [dashboardStatOptions]
  );

  const normalizedSelectedStatKeys = useMemo(
    () => normalizeDashboardStatKeys(
      selectedStatKeys,
      availableDashboardStatKeys,
      false
    ),
    [selectedStatKeys, availableDashboardStatKeys]
  );

  const selectedDashboardStats = useMemo(() => {
    return normalizedSelectedStatKeys
      .map((key) => dashboardStatOptions.find((option) => option.key === key))
      .filter(Boolean);
  }, [normalizedSelectedStatKeys, dashboardStatOptions]);

  function toggleDashboardStat(statKey) {
    setSelectedStatKeys((current) => {
      const normalized = normalizeDashboardStatKeys(
        current,
        availableDashboardStatKeys,
        false
      );

      if (normalized.includes(statKey)) {
        return normalized.filter((key) => key !== statKey);
      }

      if (normalized.length >= DASHBOARD_STAT_LIMIT) {
        return normalized;
      }

      return [...normalized, statKey];
    });
  }

  function moveDashboardStat(statKey, direction) {
    setSelectedStatKeys((current) => {
      const normalized = normalizeDashboardStatKeys(
        current,
        availableDashboardStatKeys,
        false
      );
      const currentIndex = normalized.indexOf(statKey);

      if (currentIndex < 0) return normalized;

      const nextIndex = direction === "left" ? currentIndex - 1 : currentIndex + 1;
      if (nextIndex < 0 || nextIndex >= normalized.length) return normalized;

      const updated = [...normalized];
      const [moved] = updated.splice(currentIndex, 1);
      updated.splice(nextIndex, 0, moved);

      return updated;
    });
  }

  function resetDashboardStats() {
    setSelectedStatKeys(
      normalizeDashboardStatKeys(
        DEFAULT_DASHBOARD_STAT_KEYS,
        availableDashboardStatKeys
      )
    );
  }

  const shellContent = (
    <>
      {shouldShowWelcomePricing && WelcomePricingModal ? (
        <WelcomePricingModal onClose={() => setShowWelcomePricing(false)} />
      ) : null}

      <ModuleGuideModal
        isOpen={Boolean(user) && !shouldShowWelcomePricing && showGuide}
        moduleKey="dashboard"
        title="How to Use the Dashboard"
        onClose={() => setShowGuide(false)}
      >
        <DashboardGuideContent />
      </ModuleGuideModal>

      {showStatPicker ? (
        <div className="dashboardStatPickerOverlay" role="dialog" aria-modal="true">
          <div className="workspacePanel compactPanel dashboardStatPickerModal">
            <div className="workspaceHeader compactPanelHeader">
              <div>
                <p className="eyebrow">Dashboard Stats</p>
                <h3>Choose up to 5 stat cards</h3>
                <p className="dashboardStatPickerHint">
                  Pick the cards that match the modules you actually use. Your choices are saved on this device.
                </p>
              </div>

              <button
                className="iconButton"
                type="button"
                onClick={() => setShowStatPicker(false)}
                aria-label="Close stat picker"
              >
                <X size={17} />
              </button>
            </div>

            <div className="dashboardStatPickerCounter">
              <strong>{selectedDashboardStats.length}</strong>
              <span>of {DASHBOARD_STAT_LIMIT} selected</span>
            </div>

            <div className="dashboardStatPickerGrid">
              {dashboardStatOptions.map((stat) => {
                const isSelected = normalizedSelectedStatKeys.includes(stat.key);
                const isDisabled =
                  !isSelected && selectedDashboardStats.length >= DASHBOARD_STAT_LIMIT;
                const Icon = stat.icon;

                return (
                  <button
                    key={stat.key}
                    type="button"
                    className={`dashboardStatPickerOption ${stat.accent} ${
                      isSelected ? "selected" : ""
                    }`}
                    onClick={() => toggleDashboardStat(stat.key)}
                    disabled={isDisabled}
                    aria-pressed={isSelected}
                  >
                    <span className={`dashboardStatPickerIcon ${stat.accent}`}>
                      <Icon size={18} />
                    </span>

                    <span className="dashboardStatPickerText">
                      <strong>{stat.label}</strong>
                      <small>{stat.source}</small>
                    </span>

                    <span className="dashboardStatPickerValue">
                      {stat.value}
                    </span>

                    {isSelected ? (
                      <span className="dashboardStatPickerCheck">
                        <Check size={15} />
                      </span>
                    ) : null}
                  </button>
                );
              })}
            </div>

            <div className="dashboardStatPickerActions">
              <button
                className="secondaryButton compactButton"
                type="button"
                onClick={resetDashboardStats}
              >
                Reset Defaults
              </button>

              <button
                className="primaryButton compactPrimary"
                type="button"
                onClick={() => setShowStatPicker(false)}
              >
                Done
              </button>
            </div>
          </div>
        </div>
      ) : null}

      <section className="dashboardHeroRow">
        <ModuleHero
          eyebrow="Market Vendor Toolkit"
          title={user ? `Welcome back, ${displayName}` : "One toolkit for market vendors."}
          description="Manage recipes, products, pricing, customers, deadlines, prep plans, inventory, production records, and business activity from one dashboard."
          icon={Sprout}
          accent="dashboardHero"
          className="dashboardSharedHero"
          actions={[
            {
              label: "Guide",
              icon: CircleHelp,
              variant: "secondary",
              onClick: () => setShowGuide(true)
            }
          ]}
        />

        <div className="workspacePanel compactPanel dashboardAccountSummaryPanel">
          <div>
            <p className="eyebrow">Account</p>
            <h3>{isTrial ? `${daysRemaining} trial days left` : "15-day free trial"}</h3>
            <p>
              {user
                ? "Manage account, subscription, and saved tools."
                : "Try every Market Vendor Toolkit tool before choosing a plan."}
            </p>
          </div>

          <GuardedLink to={user ? "/account-settings" : "/subscribe"} className="primaryButton compactPrimary">
            {user ? "Manage Account" : "View Plans"}
            <ArrowRight size={16} />
          </GuardedLink>
        </div>
      </section>

      <section className="dashboardOverviewGrid dashboardOverviewGridOptimized dashboardCustomStatGrid">
        {selectedDashboardStats.map((stat, index) => (
          <div className="dashboardStatSlot" key={stat.key}>
            <StatCard
              icon={stat.icon}
              label={stat.label}
              value={stat.value}
              sub={stat.sub}
              accent={stat.accent}
            />

            <div className="dashboardStatSlotActions">
              <button
                type="button"
                onClick={() => moveDashboardStat(stat.key, "left")}
                disabled={index === 0}
                aria-label={`Move ${stat.label} left`}
                title="Move left"
              >
                ←
              </button>

              <button
                type="button"
                onClick={() => moveDashboardStat(stat.key, "right")}
                disabled={index === selectedDashboardStats.length - 1}
                aria-label={`Move ${stat.label} right`}
                title="Move right"
              >
                →
              </button>

              <button
                type="button"
                onClick={() => toggleDashboardStat(stat.key)}
                aria-label={`Remove ${stat.label}`}
                title="Remove"
              >
                ×
              </button>
            </div>
          </div>
        ))}

        {selectedDashboardStats.length < DASHBOARD_STAT_LIMIT ? (
          <button
            className="dashboardAddStatCard"
            type="button"
            onClick={() => setShowStatPicker(true)}
          >
            <Plus size={24} />
            <span>Add Stat</span>
          </button>
        ) : null}

        <button
          className="dashboardCustomizeStatsButton"
          type="button"
          onClick={() => setShowStatPicker(true)}
        >
          <Settings2 size={15} />
          Customize
        </button>
      </section>

      <section className="dashboardPanel dashboardWorkspacesPanel">
        <div className="sectionHeader dashboardPanelHeader">
          <div>
            <p className="eyebrow">Workspaces</p>
            <h2>Jump back in</h2>
          </div>
        </div>

        <div className="dashboardWorkspaceGrid">
          {modules.map((module) => {
            const Icon = module.icon;

            return (
              <GuardedLink
                to={module.path}
                className={`dashboardWorkspaceCard ${module.accent}`}
                key={module.path}
              >
                <span className="dashboardWorkspaceAccent" />

                <div className={`dashboardWorkspaceIcon ${module.accent}`}>
                  <Icon size={24} />
                </div>

                <div className="dashboardWorkspaceText">
                  <h3>{module.title}</h3>
                  <p>{module.description}</p>
                </div>

                <span className="dashboardWorkspaceArrow">
                  <ArrowRight size={18} />
                </span>
              </GuardedLink>
            );
          })}
        </div>
      </section>

      <section className="dashboardActionGrid">
        <div className="dashboardPanel dashboardActionPanel">
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

        <div className="dashboardPanel dashboardActionPanel">
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
      </section>

      <section className="dashboardFooterBanner dashboardSubscriptionBanner">
        <div className="dashboardFooterCopy">
          <p className="eyebrow">Subscription</p>
          <h3>{isTrial ? "Need more time?" : "Keep your Market Vendor Toolkit active."}</h3>
          <p>
            Manage your subscription or upgrade anytime to keep your saved tools,
            workflows, and records available.
          </p>
        </div>

        <div className="button-row dashboardFooterActions">
          <GuardedLink to="/account-settings" className="secondaryButton dashboardFooterButton">
            Manage Subscription
          </GuardedLink>

          <GuardedLink to="/subscribe" className="primaryButton dashboardFooterButton">
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
