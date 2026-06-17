import { useEffect, useMemo, useState } from "react";
import {
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Clock,
  HelpCircle,
  Link as LinkIcon,
  Plus,
  Save,
  Trash2,
  X
} from "lucide-react";
import { Link } from "react-router-dom";
import { doc, getDoc } from "firebase/firestore";

import { useAuth } from "../AuthContext.jsx";
import { db } from "../firebase";
import CalendarGuideContent from "../components/CalendarGuideContent.jsx";
import StatCard from "../components/StatCard.jsx";
import {
  deleteCalendarEvent,
  getCalendarEvents,
  saveCalendarEvent
} from "../services/calendarService.js";
import { getMarketPrepPlans } from "../services/marketPrepService.js";
import { getPermitGrantItems } from "../services/permitGrantService.js";

const blankEvent = {
  id: "",
  title: "",
  type: "Market",
  date: "",
  startTime: "",
  endTime: "",
  location: "",
  notes: ""
};

const eventTypes = [
  "Market",
  "Event",
  "Delivery",
  "Production",
  "Deadline",
  "Reminder",
  "Meeting",
  "Other"
];

const defaultBakingSettings = {
  altitudeFt: 980,
  baselineTempF: 72,
  baselineHumidityPct: 55,
  starterHydrationPct: 100,
  levainBufferPct: 10,
  ingredientBufferPct: 3,
  mixerCapacityG: 7000,
  proofingCapacityUnits: 24,
  defaultStartTime: "06:00"
};

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

function monthKey(date) {
  return `${date.getFullYear()}-${date.getMonth()}`;
}

function parseLocalDate(dateString) {
  if (!dateString) return null;

  const [year, month, day] = dateString.split("-").map(Number);
  return new Date(year, month - 1, day);
}

function formatDisplayDate(dateString) {
  const date = parseLocalDate(dateString);
  if (!date) return "";

  return date.toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric"
  });
}

function daysUntil(dateString) {
  const date = parseLocalDate(dateString);
  if (!date) return null;

  const today = parseLocalDate(todayISO());
  return Math.ceil((date.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
}

function formatDue(days) {
  if (days === null) return "";
  if (days < 0) return "Past due";
  if (days === 0) return "Today";
  if (days === 1) return "Tomorrow";
  return `${days} days`;
}

function formatPlainDate(dateString) {
  if (!dateString) return "";
  const date = parseLocalDate(dateString);
  if (!date) return dateString;

  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric"
  });
}

function formatGrams(value) {
  const grams = Math.round(Number(value) || 0);
  return `${grams.toLocaleString("en-US")}g`;
}

function formatKilograms(value) {
  const kg = (Number(value) || 0) / 1000;
  return `${kg.toLocaleString("en-US", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2
  })} kg`;
}

function getMonthDays(viewDate) {
  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();

  const firstDay = new Date(year, month, 1);
  const startDay = firstDay.getDay();

  const gridStart = new Date(year, month, 1 - startDay);
  const days = [];

  for (let index = 0; index < 42; index += 1) {
    const date = new Date(gridStart);
    date.setDate(gridStart.getDate() + index);

    days.push({
      date,
      iso: date.toISOString().slice(0, 10),
      isCurrentMonth: date.getMonth() === month,
      isToday: date.toISOString().slice(0, 10) === todayISO()
    });
  }

  return days;
}

function getWeekDays(viewDate) {
  const start = new Date(viewDate);
  start.setDate(viewDate.getDate() - viewDate.getDay());

  return Array.from({ length: 7 }, (_, index) => {
    const date = new Date(start);
    date.setDate(start.getDate() + index);

    return {
      date,
      iso: date.toISOString().slice(0, 10),
      isCurrentMonth: date.getMonth() === viewDate.getMonth(),
      isToday: date.toISOString().slice(0, 10) === todayISO()
    };
  });
}

function getDayViewDate(viewDate) {
  return [
    {
      date: viewDate,
      iso: viewDate.toISOString().slice(0, 10),
      isCurrentMonth: true,
      isToday: viewDate.toISOString().slice(0, 10) === todayISO()
    }
  ];
}

function getCalendarViewDays(viewDate, viewMode) {
  if (viewMode === "day") return getDayViewDate(viewDate);
  if (viewMode === "week") return getWeekDays(viewDate);
  return getMonthDays(viewDate);
}

function getCalendarViewLabel(viewDate, viewMode) {
  if (viewMode === "day") {
    return viewDate.toLocaleDateString("en-US", {
      weekday: "long",
      month: "long",
      day: "numeric",
      year: "numeric"
    });
  }

  if (viewMode === "week") {
    const days = getWeekDays(viewDate);
    const first = days[0].date;
    const last = days[6].date;

    const firstLabel = first.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric"
    });

    const lastLabel = last.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric"
    });

    return `${firstLabel} - ${lastLabel}`;
  }

  return viewDate.toLocaleDateString("en-US", {
    month: "long",
    year: "numeric"
  });
}

function normalizeRecipe(recipe) {
  return {
    ...recipe,
    flourTypes: recipe.flourTypes || [{ name: "Bread Flour", pct: 100 }],
    otherIngredients: recipe.otherIngredients || [],
    process: {
      autolyseMin: 0,
      mixMin: 0,
      bulkMin: 0,
      foldCount: 0,
      foldIntervalMin: 30,
      foldDurationMin: 5,
      divideAndPreshapeMin: 12,
      benchRestMin: 0,
      finalShapeMin: 10,
      finalProofMin: 0,
      bakeTempF: 400,
      bakeMin: 30,
      coolMin: 60,
      ...(recipe.process || {})
    }
  };
}

function calculateBakingRecipePlan(rawRecipe, quantity, settings) {
  const recipe = normalizeRecipe(rawRecipe);
  const qty = Number(quantity) || 0;

  if (qty <= 0) {
    return null;
  }

  const finishedUnitWeight = Number(recipe.finishedUnitWeight) || 0;
  const bakeLossPct = Number(recipe.bakeLossPct) || 0;
  const desiredBakedWeight = qty * finishedUnitWeight;
  const doughWeight =
    bakeLossPct >= 100
      ? desiredBakedWeight
      : desiredBakedWeight / (1 - bakeLossPct / 100);

  const otherPct = (recipe.otherIngredients || []).reduce(
    (sum, item) => sum + (Number(item.pct) || 0),
    0
  );

  const hydrationPct = Number(recipe.hydrationPct) || 0;
  const starterPct = Number(recipe.starterPct) || 0;
  const saltPct = Number(recipe.saltPct) || 0;
  const formulaTotalPct = 100 + hydrationPct + starterPct + saltPct + otherPct;

  const baseFlourG = formulaTotalPct > 0 ? doughWeight / (formulaTotalPct / 100) : 0;
  const starterG = (baseFlourG * starterPct) / 100;

  const mixerCapacity = Number(settings.mixerCapacityG) || 1;
  const recipeBatchMax = Number(recipe.batchMaxDoughG) || mixerCapacity;
  const maxBatchSize = Math.max(1, Math.min(recipeBatchMax, mixerCapacity));
  const mixerBatches = Math.ceil(doughWeight / maxBatchSize);

  const ovenCapacity = Math.max(1, Number(recipe.ovenCapacityUnits) || 1);
  const ovenLoads = Math.ceil(qty / ovenCapacity);

  return {
    recipe,
    quantity: qty,
    doughWeight,
    starterG,
    mixerBatches,
    ovenLoads
  };
}

function getBakingPlanDetails(bakingData) {
  const settings = {
    ...defaultBakingSettings,
    ...(bakingData.settings || {})
  };

  const recipes = Array.isArray(bakingData.recipes)
    ? bakingData.recipes.map(normalizeRecipe)
    : [];

  const productionItems = Array.isArray(bakingData.productionItems)
    ? bakingData.productionItems
    : [];

  const plans = productionItems
    .map((item) => {
      const recipe = recipes.find((savedRecipe) => savedRecipe.id === item.recipeId);
      if (!recipe) return null;
      return calculateBakingRecipePlan(recipe, item.quantity, settings);
    })
    .filter(Boolean);

  const plannedProducts = plans.length;
  const plannedUnits = plans.reduce((sum, plan) => sum + plan.quantity, 0);
  const totalDoughG = plans.reduce((sum, plan) => sum + plan.doughWeight, 0);
  const starterNeededG =
    plans.reduce((sum, plan) => sum + plan.starterG, 0) *
    (1 + (Number(settings.levainBufferPct) || 0) / 100);
  const mixerBatches = plans.reduce((sum, plan) => sum + plan.mixerBatches, 0);
  const ovenLoads = plans.reduce((sum, plan) => sum + plan.ovenLoads, 0);

  const productSummary = plans
    .map((plan) => `${plan.recipe.name}: ${plan.quantity} ${plan.recipe.unitsLabel || "units"}`)
    .join(", ");

  return {
    productionDate: bakingData.productionDate || "",
    defaultStartTime: settings.defaultStartTime || "",
    plannedProducts,
    plannedUnits,
    totalDoughG,
    starterNeededG,
    mixerBatches,
    ovenLoads,
    productSummary,
    mixerCapacityG: settings.mixerCapacityG || "",
    proofingCapacityUnits: settings.proofingCapacityUnits || ""
  };
}

function getPermitDetails(item) {
  return {
    name: item.name || "",
    type: item.type || "",
    organization: item.organization || item.agency || "",
    status: item.status || "",
    priority: item.priority || "",
    issueDate: item.issueDate || "",
    dueDate: item.dueDate || "",
    renewalDate: item.renewalDate || "",
    reminderDays: item.reminderDays || item.reminder || "",
    documentName: item.documentName || item.documentFileName || "",
    documentUrl: item.documentUrl || "",
    notes: item.notes || ""
  };
}

function getMarketPlanDetails(plan) {
  return {
    name: plan.marketName || "Market Plan",
    marketDate: plan.marketDate || "",
    location: plan.location || "",
    weatherNotes: plan.weatherNotes || "",
    notes: plan.notes || "",
    productsCount: Array.isArray(plan.products) ? plan.products.length : "",
    totalUnits: plan.totalUnits || "",
    totalRevenue: plan.totalRevenue || ""
  };
}

function isModuleSyncedEvent(event) {
  return Boolean(
    event?.sourceModuleKey ||
      event?.sourceModule ||
      event?.sourceRecordId ||
      event?.sourceEventType
  );
}

const MODULE_EVENT_ACCENTS = {
  bakingPlanner: {
    className: "sourdough",
    background: "#c48a53",
    border: "#9f6d3c",
    text: "#1f150d"
  },
  calendar: {
    className: "calendar",
    background: "#7a8f97",
    border: "#5e737c",
    text: "#ffffff"
  },
  customers: {
    className: "customers",
    background: "#6f8f77",
    border: "#56735d",
    text: "#ffffff"
  },
  grant: {
    className: "grant",
    background: "#9a846f",
    border: "#796653",
    text: "#ffffff"
  },
  inventory: {
    className: "inventory",
    background: "#6d8792",
    border: "#566e77",
    text: "#ffffff"
  },
  livestock: {
    className: "livestock",
    background: "#8f5f34",
    border: "#704723",
    text: "#ffffff"
  },
  market: {
    className: "market",
    background: "#6a9a6d",
    border: "#4f7952",
    text: "#ffffff"
  },
  marketPrep: {
    className: "market",
    background: "#6a9a6d",
    border: "#4f7952",
    text: "#ffffff"
  },
  orders: {
    className: "orders",
    background: "#7b70b3",
    border: "#615796",
    text: "#ffffff"
  },
  permitGrant: {
    className: "grant",
    background: "#9a846f",
    border: "#796653",
    text: "#ffffff"
  },
  planting: {
    className: "planting",
    background: "#5c8f45",
    border: "#456d33",
    text: "#ffffff"
  },
  plantingScheduler: {
    className: "planting",
    background: "#5c8f45",
    border: "#456d33",
    text: "#ffffff"
  },
  pricing: {
    className: "pricing",
    background: "#5f91a5",
    border: "#456f80",
    text: "#ffffff"
  },
  spice: {
    className: "spice",
    background: "#c45f45",
    border: "#9e4935",
    text: "#ffffff"
  }
};

const DETAIL_FIELD_ORDER = [
  "eventLabel",
  "batchName",
  "orderNumber",
  "customerName",
  "businessName",
  "cropName",
  "variety",
  "species",
  "breed",
  "category",
  "growingMethod",
  "plantingDate",
  "germinationDate",
  "moveToLightDate",
  "transplantDate",
  "targetHarvestDate",
  "fulfillmentType",
  "quantity",
  "quantityUnit",
  "startingHeadCount",
  "currentHeadCount",
  "headCountProcessed",
  "liveWeight",
  "hangingWeight",
  "packagedWeight",
  "processor",
  "processingFee",
  "total",
  "balanceDue",
  "status",
  "priority"
];

function normalizeModuleSource(value) {
  const compactValue = String(value || "")
    .trim()
    .replace(/[^a-zA-Z0-9]+/g, " ");

  if (!compactValue) return "";

  return compactValue
    .split(" ")
    .filter(Boolean)
    .map((word, index) => {
      const lower = word.toLowerCase();
      return index === 0 ? lower : lower.charAt(0).toUpperCase() + lower.slice(1);
    })
    .join("");
}

function getModuleAccentKey(event) {
  const sourceKey =
    event?.accent ||
    event?.sourceModuleKey ||
    event?.source ||
    normalizeModuleSource(event?.sourceModule) ||
    "calendar";

  if (MODULE_EVENT_ACCENTS[sourceKey]) return sourceKey;

  const normalized = normalizeModuleSource(sourceKey);
  if (MODULE_EVENT_ACCENTS[normalized]) return normalized;

  if (normalized.includes("livestock")) return "livestock";
  if (normalized.includes("planting")) return "planting";
  if (normalized.includes("order")) return "orders";
  if (normalized.includes("market")) return "market";
  if (normalized.includes("permit") || normalized.includes("grant")) return "grant";
  if (normalized.includes("baking")) return "bakingPlanner";
  if (normalized.includes("spice")) return "spice";
  if (normalized.includes("inventory")) return "inventory";
  if (normalized.includes("customer")) return "customers";
  if (normalized.includes("pricing") || normalized.includes("product")) return "pricing";

  return "calendar";
}

function getCalendarEventClassName(event) {
  const accentKey = getModuleAccentKey(event);
  return MODULE_EVENT_ACCENTS[accentKey]?.className || accentKey || "calendar";
}

function getCalendarEventStyle(event) {
  const accent = MODULE_EVENT_ACCENTS[getModuleAccentKey(event)];
  if (!accent) return undefined;

  return {
    backgroundColor: accent.background,
    borderColor: accent.border,
    color: accent.text
  };
}

function cleanCalendarTitle(title) {
  return String(title || "")
    .replace(/^Target processing:\s*/i, "Process: ")
    .replace(/^Processing #(\d+):\s*/i, "Process $1: ")
    .replace(/^Pickup:\s*/i, "Pickup: ")
    .replace(/^Plant\s+/i, "Plant: ")
    .replace(/^Check germination:\s*/i, "Germination: ")
    .replace(/^Move to light:\s*/i, "Move: ")
    .replace(/^Transplant\s+/i, "Transplant: ")
    .replace(/^Harvest\s+/i, "Harvest: ")
    .replace(/^Order due:\s*/i, "Order: ")
    .trim();
}

function getCalendarEventDisplayTitle(event) {
  const details = event?.details || {};
  const title = cleanCalendarTitle(event?.title || "");

  if (event?.sourceModuleKey === "livestock" || event?.source === "livestock") {
    if (event?.sourceEventType === "target-processing-date") {
      return `Process: ${details.batchName || title.replace(/^Process:\s*/i, "")}`;
    }

    if (String(event?.sourceEventType || "").startsWith("processing-event")) {
      return title;
    }

    if (event?.sourceEventType === "pickup-date") {
      return `Pickup: ${details.batchName || title.replace(/^Pickup:\s*/i, "")}`;
    }
  }

  if (event?.sourceModuleKey === "orders" || event?.source === "orders") {
    return details.orderNumber
      ? `Order: ${details.orderNumber}`
      : title;
  }

  if (event?.sourceModuleKey === "plantingScheduler" || event?.source === "plantingScheduler") {
    return title
      .replace(/^Plant:\s*/i, "Plant: ")
      .replace(/^Harvest:\s*/i, "Harvest: ");
  }

  return title || "Calendar event";
}

function normalizeStoredModuleEvent(event) {
  const sourceModuleKey =
    event.sourceModuleKey ||
    event.source ||
    normalizeModuleSource(event.sourceModule) ||
    "module";

  const normalizedEvent = {
    ...event,
    source: sourceModuleKey,
    sourceModuleKey,
    sourceModule: event.sourceModule || sourceModuleKey,
    sourcePath: event.sourcePath || "",
    details: event.details || {}
  };

  const accentKey = getModuleAccentKey(normalizedEvent);

  return {
    ...normalizedEvent,
    accent: getCalendarEventClassName({
      ...normalizedEvent,
      accent: event.accent || accentKey
    }),
    displayTitle: getCalendarEventDisplayTitle(normalizedEvent)
  };
}

function formatDetailLabel(key) {
  return String(key || "")
    .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/^./, (match) => match.toUpperCase());
}

function formatDetailValue(value) {
  if (value === undefined || value === null || value === "") return "";
  if (typeof value === "number") return value.toLocaleString("en-US");
  if (Array.isArray(value)) return value.filter(Boolean).join(", ");
  if (typeof value === "object") return "";
  return String(value);
}

function getGenericDetailEntries(details = {}, selectedEvent = {}) {
  const hiddenKeys = new Set([
    "notes",
    "documentUrl",
    "documentName",
    "location",
    "organization"
  ]);

  if (selectedEvent?.details?.status) {
    hiddenKeys.add("status");
  }

  return Object.entries(details)
    .filter(([key, value]) => !hiddenKeys.has(key) && formatDetailValue(value))
    .map(([key, value]) => ({
      key,
      label: formatDetailLabel(key),
      value: formatDetailValue(value),
      order:
        DETAIL_FIELD_ORDER.includes(key)
          ? DETAIL_FIELD_ORDER.indexOf(key)
          : DETAIL_FIELD_ORDER.length + 1
    }))
    .sort((a, b) => {
      if (a.order !== b.order) return a.order - b.order;
      return a.label.localeCompare(b.label);
    });
}

function normalizeImportedEvents({ marketPlans, permitItems, bakingData }) {
  const events = [];

  marketPlans.forEach((plan) => {
    if (!plan.marketDate) return;

    events.push({
      id: `market-${plan.id}`,
      title: plan.marketName || "Market Plan",
      type: "Market Prep",
      date: plan.marketDate,
      startTime: "",
      endTime: "",
      location: plan.location || "",
      notes: plan.weatherNotes || plan.notes || "",
      source: "marketPrep",
      sourcePath: "/market-prep",
      accent: "market",
      details: getMarketPlanDetails(plan)
    });
  });

  permitItems.forEach((item) => {
    const renewalDate = item.renewalDate || "";
    const dueDate = item.dueDate || "";
    const details = getPermitDetails(item);

    if (renewalDate) {
      events.push({
        id: `permit-renewal-${item.id}`,
        title: `${item.name || "Permit"} renewal`,
        type: item.type || "Permit",
        date: renewalDate,
        startTime: "",
        endTime: "",
        location: item.organization || item.agency || "",
        notes: item.notes || "",
        source: "permitGrant",
        sourcePath: `/permit-grants?record=${encodeURIComponent(item.id || "")}`,
        accent: "grant",
        details
      });
    }

    if (dueDate && dueDate !== renewalDate) {
      events.push({
        id: `permit-due-${item.id}`,
        title: `${item.name || "Permit"} deadline`,
        type: item.type || "Permit",
        date: dueDate,
        startTime: "",
        endTime: "",
        location: item.organization || item.agency || "",
        notes: item.notes || "",
        source: "permitGrant",
        sourcePath: `/permit-grants?record=${encodeURIComponent(item.id || "")}`,
        accent: "grant",
        details
      });
    }
  });

  if (bakingData?.productionDate) {
    const details = getBakingPlanDetails(bakingData);

    events.push({
      id: "baking-production-date",
      title: "Baking production day",
      type: "Production",
      date: bakingData.productionDate,
      startTime: details.defaultStartTime || "",
      endTime: "",
      location: "",
      notes: "Generated from Baking Planner production date.",
      source: "bakingPlanner",
      sourcePath: "/baking-planner",
      accent: "sourdough",
      details
    });
  }

  return events;
}

function DetailCard({ label, value }) {
  if (value === undefined || value === null || value === "") return null;

  return (
    <div>
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

export default function Calendar() {
  const { user, loginWithGoogle } = useAuth();

  const [viewDate, setViewDate] = useState(() => new Date());
  const [calendarView, setCalendarView] = useState("month");
  const [manualEvents, setManualEvents] = useState([]);
  const [syncedModuleEvents, setSyncedModuleEvents] = useState([]);
  const [importedEvents, setImportedEvents] = useState([]);
  const [selectedDate, setSelectedDate] = useState(todayISO());
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [isEventFormOpen, setIsEventFormOpen] = useState(false);
  const [isGuideOpen, setIsGuideOpen] = useState(false);
  const [eventForm, setEventForm] = useState({ ...blankEvent, date: todayISO() });
  const [statusMessage, setStatusMessage] = useState("");
  const [loading, setLoading] = useState(false);

  async function loadCalendarData() {
    if (!user) return;

    setLoading(true);

    try {
      const [savedEvents, marketPlans, permitItems, bakingSnapshot] =
        await Promise.all([
          getCalendarEvents(user.uid),
          getMarketPrepPlans(user.uid),
          getPermitGrantItems(user.uid),
          getDoc(doc(db, "users", user.uid, "bakingPlanner", "main"))
        ]);

      const bakingData = bakingSnapshot.exists() ? bakingSnapshot.data() : {};

      const savedCalendarEvents = Array.isArray(savedEvents) ? savedEvents : [];

      setManualEvents(
        savedCalendarEvents
          .filter((event) => !isModuleSyncedEvent(event))
          .map((event) => ({
            ...event,
            source: "manual",
            accent: "calendar",
            details: event.details || {}
          }))
      );

      setSyncedModuleEvents(
        savedCalendarEvents
          .filter(isModuleSyncedEvent)
          .map(normalizeStoredModuleEvent)
      );

      setImportedEvents(
        normalizeImportedEvents({
          marketPlans: Array.isArray(marketPlans) ? marketPlans : [],
          permitItems: Array.isArray(permitItems) ? permitItems : [],
          bakingData
        })
      );
    } catch (error) {
      console.error(error);
      setStatusMessage("Could not load calendar.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (user) {
      loadCalendarData();
    } else {
      setManualEvents([]);
      setSyncedModuleEvents([]);
      setImportedEvents([]);
    }
  }, [user]);

  useEffect(() => {
    if (!statusMessage) return;

    const timer = window.setTimeout(() => {
      setStatusMessage("");
    }, 3000);

    return () => window.clearTimeout(timer);
  }, [statusMessage]);

  useEffect(() => {
    if (!user) return;

    const hasSeenGuide = window.localStorage.getItem("farmersHubCalendarGuideSeen");

    if (!hasSeenGuide) {
      setIsGuideOpen(true);
      window.localStorage.setItem("farmersHubCalendarGuideSeen", "true");
    }
  }, [user]);

  const allEvents = useMemo(() => {
    return [...manualEvents, ...syncedModuleEvents, ...importedEvents].sort((a, b) => {
      const dateCompare = String(a.date || "").localeCompare(String(b.date || ""));
      if (dateCompare !== 0) return dateCompare;

      return String(a.startTime || "").localeCompare(String(b.startTime || ""));
    });
  }, [manualEvents, syncedModuleEvents, importedEvents]);

  const calendarDays = useMemo(
    () => getCalendarViewDays(viewDate, calendarView),
    [viewDate, calendarView]
  );

  const eventsByDate = useMemo(() => {
    return allEvents.reduce((map, event) => {
      if (!event.date) return map;

      if (!map[event.date]) {
        map[event.date] = [];
      }

      map[event.date].push(event);

      return map;
    }, {});
  }, [allEvents]);

  const selectedDateEvents = eventsByDate[selectedDate] || [];

  const upcomingEvents = useMemo(() => {
    return allEvents
      .map((event) => ({
        ...event,
        days: daysUntil(event.date)
      }))
      .filter((event) => event.days !== null && event.days >= 0)
      .sort((a, b) => a.days - b.days)
      .slice(0, 8);
  }, [allEvents]);

  const monthEventsCount = useMemo(() => {
    const key = monthKey(viewDate);

    return allEvents.filter((event) => {
      const date = parseLocalDate(event.date);
      return date && monthKey(date) === key;
    }).length;
  }, [allEvents, viewDate]);

  function shiftCalendar(direction) {
    setViewDate((current) => {
      const next = new Date(current);

      if (calendarView === "day") {
        next.setDate(current.getDate() + direction);
        setSelectedDate(next.toISOString().slice(0, 10));
        return next;
      }

      if (calendarView === "week") {
        next.setDate(current.getDate() + direction * 7);
        setSelectedDate(next.toISOString().slice(0, 10));
        return next;
      }

      next.setMonth(current.getMonth() + direction);
      return next;
    });
  }

  function goToToday() {
    const today = new Date();
    setViewDate(today);
    setSelectedDate(todayISO());
  }

  function changeCalendarView(nextView) {
    setCalendarView(nextView);

    const selected = parseLocalDate(selectedDate);
    if (selected) {
      setViewDate(selected);
    }
  }

  function openNewEvent(date = selectedDate) {
    setEventForm({
      ...blankEvent,
      date: date || todayISO()
    });
    setSelectedEvent(null);
    setIsEventFormOpen(true);
  }

  function openEditEvent(event) {
    if (event.source !== "manual") {
      setSelectedEvent(event);
      return;
    }

    setEventForm({
      id: event.id || "",
      title: event.title || "",
      type: event.type || "Market",
      date: event.date || todayISO(),
      startTime: event.startTime || "",
      endTime: event.endTime || "",
      location: event.location || "",
      notes: event.notes || ""
    });

    setSelectedEvent(event);
    setIsEventFormOpen(true);
  }

  function openCalendarEventFromName(event, domEvent) {
    domEvent?.stopPropagation?.();
    setSelectedDate(event.date || selectedDate);
    openEditEvent(event);
  }

  async function saveEvent(event) {
    event.preventDefault();

    if (!user) return;

    if (!eventForm.title.trim() || !eventForm.date) {
      setStatusMessage("Event title and date are required.");
      return;
    }

    try {
      await saveCalendarEvent(user.uid, {
        ...eventForm,
        title: eventForm.title.trim(),
        location: eventForm.location.trim(),
        notes: eventForm.notes.trim()
      });

      setStatusMessage("Calendar event saved.");
      setIsEventFormOpen(false);
      setEventForm({ ...blankEvent, date: todayISO() });
      await loadCalendarData();
    } catch (error) {
      console.error(error);
      setStatusMessage("Could not save calendar event.");
    }
  }

  async function removeEvent(eventId) {
    if (!user || !eventId) return;

    try {
      await deleteCalendarEvent(user.uid, eventId);
      setStatusMessage("Calendar event deleted.");
      setIsEventFormOpen(false);
      setSelectedEvent(null);
      await loadCalendarData();
    } catch (error) {
      console.error(error);
      setStatusMessage("Could not delete calendar event.");
    }
  }

  const calendarViewLabel = getCalendarViewLabel(viewDate, calendarView);

  if (!user) {
    return (
      <div className="calendarModule">
        <section className="farmModuleHero">
          <div className="farmModuleHeroText">
            <p className="eyebrow">Calendar</p>
            <h2>Sign in to view your vendor calendar.</h2>
            <p>
              Calendar events are built from your market plans, permits, grants,
              baking schedule, and manually added events.
            </p>
          </div>

          <div className="farmModuleHeroActions">
            <button
              className="primaryButton compactPrimary farmHeroAction"
              type="button"
              onClick={loginWithGoogle}
            >
              Sign in with Google
            </button>
          </div>
        </section>
      </div>
    );
  }

  return (
    <div className="calendarModule">
      {statusMessage ? (
        <div className="floatingStatus success">
          <span>ⓘ</span>
          <span>{statusMessage}</span>
          <button type="button" onClick={() => setStatusMessage("")}>
            ×
          </button>
        </div>
      ) : null}

      <section className="farmModuleHero">
        <div className="farmModuleHeroText">
          <p className="eyebrow">Calendar</p>
          <h2>See every dated vendor task in one place.</h2>
          <p>
            Market plans, permit deadlines, grant renewals, baking production dates,
            synced module tasks, and manually added events appear together on your calendar.
          </p>
        </div>

        <div className="farmModuleHeroActions">
          <button
            className="secondaryButton compactButton farmHeroAction"
            type="button"
            onClick={() => setIsGuideOpen(true)}
          >
            <HelpCircle size={18} />
            Guide
          </button>

          <button
            className="primaryButton compactPrimary farmHeroAction"
            type="button"
            onClick={() => openNewEvent()}
          >
            <Plus size={16} />
            Add Event
          </button>
        </div>
      </section>

      <section className="hubStatGrid calendarStatGrid">
        <StatCard
          icon={CalendarDays}
          label="This Month"
          value={loading ? "..." : monthEventsCount}
          sub="calendar items"
          accent="calendar"
        />

        <StatCard
          icon={Clock}
          label="Upcoming"
          value={loading ? "..." : upcomingEvents.length}
          sub="next visible events"
          accent="sourdough"
        />

        <StatCard
          icon={LinkIcon}
          label="Imported"
          value={loading ? "..." : syncedModuleEvents.length + importedEvents.length}
          sub="from other modules"
          accent="market"
        />

        <StatCard
          icon={Plus}
          label="Manual"
          value={loading ? "..." : manualEvents.length}
          sub="custom calendar events"
          accent="pricing"
        />
      </section>

      <section className="calendarLayout">
        <div className="calendarPanel calendarMainPanel">
          <div className="calendarToolbar calendarToolbarV2">
            <div className="calendarToolbarTitle">
              <p className="eyebrow">
                {calendarView === "day"
                  ? "Day View"
                  : calendarView === "week"
                    ? "Week View"
                    : "Month View"}
              </p>
              <h3>{calendarViewLabel}</h3>
            </div>

            <div className="calendarToolbarControls">
              <div className="calendarViewToggle" aria-label="Calendar view">
                {["day", "week", "month"].map((view) => (
                  <button
                    key={view}
                    type="button"
                    className={calendarView === view ? "selected" : ""}
                    onClick={() => changeCalendarView(view)}
                  >
                    {view.charAt(0).toUpperCase() + view.slice(1)}
                  </button>
                ))}
              </div>

              <div className="calendarToolbarActions">
                <button
                  type="button"
                  className="secondaryButton compactButton"
                  onClick={() => shiftCalendar(-1)}
                  aria-label="Previous calendar period"
                >
                  <ChevronLeft size={16} />
                </button>

                <button
                  type="button"
                  className="secondaryButton compactButton"
                  onClick={goToToday}
                >
                  Today
                </button>

                <button
                  type="button"
                  className="secondaryButton compactButton"
                  onClick={() => shiftCalendar(1)}
                  aria-label="Next calendar period"
                >
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>
          </div>

          {calendarView !== "day" ? (
            <div className="calendarWeekHeader">
              {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
                <span key={day}>{day}</span>
              ))}
            </div>
          ) : null}

          <div className={`calendarGrid calendarGrid-${calendarView}`}>
            {calendarDays.map((day) => {
              const dayEvents = eventsByDate[day.iso] || [];
              const isSelected = selectedDate === day.iso;

              return (
                <button
                  type="button"
                  key={day.iso}
                  className={[
                    "calendarDay",
                    day.isCurrentMonth ? "" : "muted",
                    day.isToday ? "today" : "",
                    isSelected ? "selected" : ""
                  ]
                    .filter(Boolean)
                    .join(" ")}
                  onClick={() => {
                    setSelectedDate(day.iso);
                    if (calendarView === "day") {
                      setViewDate(day.date);
                    }
                  }}
                  onDoubleClick={() => openNewEvent(day.iso)}
                >
                  <span className="calendarDayNumber">
                    {calendarView === "month"
                      ? day.date.getDate()
                      : day.date.toLocaleDateString("en-US", {
                          weekday: "short",
                          month: "short",
                          day: "numeric"
                        })}
                  </span>

                  <div className="calendarDayEvents">
                    {dayEvents.slice(0, calendarView === "month" ? 3 : 8).map((event) => (
                      <button
                        key={event.id}
                        type="button"
                        className={`calendarEventDot clickableName ${getCalendarEventClassName(event)}`}
                        style={getCalendarEventStyle(event)}
                        title={event.title}
                        onClick={(clickEvent) =>
                          openCalendarEventFromName(event, clickEvent)
                        }
                      >
                        {event.displayTitle || getCalendarEventDisplayTitle(event)}
                      </button>
                    ))}

                    {dayEvents.length > (calendarView === "month" ? 3 : 8) ? (
                      <small>
                        +{dayEvents.length - (calendarView === "month" ? 3 : 8)} more
                      </small>
                    ) : null}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        <aside className="calendarSideStack">
          <div className="calendarPanel">
            <div className="calendarPanelHeader">
              <div>
                <p className="eyebrow">Selected Day</p>
                <h3>{formatDisplayDate(selectedDate)}</h3>
              </div>

              <button
                className="secondaryButton compactButton"
                type="button"
                onClick={() => openNewEvent(selectedDate)}
              >
                <Plus size={15} />
                Add
              </button>
            </div>

            <div className="calendarAgendaList">
              {selectedDateEvents.length ? (
                selectedDateEvents.map((event) => (
                  <button
                    type="button"
                    key={event.id}
                    className="calendarAgendaItem"
                    onClick={() => openEditEvent(event)}
                  >
                    <span className={`calendarAgendaColor ${getCalendarEventClassName(event)}`} style={getCalendarEventStyle(event)} />

                    <div>
                      <strong className="clickableNameText">{event.displayTitle || getCalendarEventDisplayTitle(event)}</strong>
                      <p>
                        {event.startTime
                          ? `${event.startTime}${event.endTime ? ` - ${event.endTime}` : ""}`
                          : event.type}
                      </p>
                    </div>
                  </button>
                ))
              ) : (
                <p className="dashboardEmpty">No events for this day.</p>
              )}
            </div>
          </div>

          <div className="calendarPanel">
            <div className="calendarPanelHeader">
              <div>
                <p className="eyebrow">Agenda</p>
                <h3>Upcoming</h3>
              </div>
            </div>

            <div className="calendarAgendaList">
              {upcomingEvents.length ? (
                upcomingEvents.map((event) => (
                  <button
                    type="button"
                    key={event.id}
                    className="calendarAgendaItem"
                    onClick={() => openEditEvent(event)}
                  >
                    <span className={`calendarAgendaColor ${getCalendarEventClassName(event)}`} style={getCalendarEventStyle(event)} />

                    <div>
                      <strong className="clickableNameText">{event.displayTitle || getCalendarEventDisplayTitle(event)}</strong>
                      <p>
                        {formatDisplayDate(event.date)} • {formatDue(event.days)}
                      </p>
                    </div>
                  </button>
                ))
              ) : (
                <p className="dashboardEmpty">No upcoming events found.</p>
              )}
            </div>
          </div>
        </aside>
      </section>

      {selectedEvent && !isEventFormOpen ? (
        <div className="permitModalOverlay" role="dialog" aria-modal="true">
          <div className="permitModal calendarModal">
            <div className="permitModalHeader">
              <h3>{selectedEvent.displayTitle || getCalendarEventDisplayTitle(selectedEvent)}</h3>

              <button type="button" onClick={() => setSelectedEvent(null)}>
                <X size={20} />
              </button>
            </div>

            <div className="calendarEventDetail calendarEventDetailV2">
              <div className="calendarDetailGrid">
                <DetailCard label="Type" value={selectedEvent.type || "Event"} />
                <DetailCard label="Date" value={formatDisplayDate(selectedEvent.date)} />

                {selectedEvent.startTime && selectedEvent.source !== "bakingPlanner" ? (
                  <DetailCard
                    label="Time"
                    value={`${selectedEvent.startTime}${
                      selectedEvent.endTime ? ` - ${selectedEvent.endTime}` : ""
                    }`}
                  />
                ) : null}

                <DetailCard
                  label={
                    selectedEvent.source === "permitGrant"
                      ? "Organization"
                      : "Location"
                  }
                  value={
                    selectedEvent.details?.organization ||
                    selectedEvent.details?.location ||
                    selectedEvent.location
                  }
                />

                <DetailCard label="Status" value={selectedEvent.details?.status} />
                <DetailCard label="Priority" value={selectedEvent.details?.priority} />
                <DetailCard
                  label="Issue Date"
                  value={formatPlainDate(selectedEvent.details?.issueDate)}
                />
                <DetailCard
                  label="Due Date"
                  value={formatPlainDate(selectedEvent.details?.dueDate)}
                />
                <DetailCard
                  label="Renewal Date"
                  value={formatPlainDate(selectedEvent.details?.renewalDate)}
                />
                <DetailCard
                  label="Reminder"
                  value={
                    selectedEvent.details?.reminderDays
                      ? `${selectedEvent.details.reminderDays} days before`
                      : ""
                  }
                />
                <DetailCard
                  label="Document"
                  value={selectedEvent.details?.documentName}
                />

                {selectedEvent.source === "marketPrep" ? (
                  <>
                    <DetailCard
                      label="Products"
                      value={selectedEvent.details?.productsCount}
                    />
                    <DetailCard
                      label="Total Units"
                      value={selectedEvent.details?.totalUnits}
                    />
                    <DetailCard
                      label="Projected Revenue"
                      value={selectedEvent.details?.totalRevenue}
                    />
                  </>
                ) : null}

                {selectedEvent.source === "bakingPlanner" ? (
                  <>
                    <DetailCard
                      label="Start Time"
                      value={selectedEvent.details?.defaultStartTime}
                    />
                    <DetailCard
                      label="Products / Recipes"
                      value={selectedEvent.details?.plannedProducts}
                    />
                    <DetailCard
                      label="Planned Units"
                      value={selectedEvent.details?.plannedUnits}
                    />
                    <DetailCard
                      label="Total Dough"
                      value={
                        selectedEvent.details?.totalDoughG
                          ? formatKilograms(selectedEvent.details.totalDoughG)
                          : ""
                      }
                    />
                    <DetailCard
                      label="Preferment Needed"
                      value={
                        selectedEvent.details?.starterNeededG
                          ? formatGrams(selectedEvent.details.starterNeededG)
                          : ""
                      }
                    />
                    <DetailCard
                      label="Mixer Batches"
                      value={selectedEvent.details?.mixerBatches}
                    />
                    <DetailCard
                      label="Oven Loads"
                      value={selectedEvent.details?.ovenLoads}
                    />
                    <DetailCard
                      label="Mixer Capacity"
                      value={
                        selectedEvent.details?.mixerCapacityG
                          ? `${selectedEvent.details.mixerCapacityG}g dough`
                          : ""
                      }
                    />
                    <DetailCard
                      label="Proofing Capacity"
                      value={
                        selectedEvent.details?.proofingCapacityUnits
                          ? `${selectedEvent.details.proofingCapacityUnits} units`
                          : ""
                      }
                    />
                  </>
                ) : null}

                {selectedEvent.sourceModuleKey ? (
                  <>
                    <DetailCard label="Source" value={selectedEvent.sourceModule} />
                    {getGenericDetailEntries(selectedEvent.details, selectedEvent).map((detail) => (
                      <DetailCard
                        key={detail.key}
                        label={detail.label}
                        value={detail.value}
                      />
                    ))}
                  </>
                ) : null}
              </div>

              {selectedEvent.source === "bakingPlanner" &&
              selectedEvent.details?.productSummary ? (
                <div className="calendarDetailNotes">
                  <span>Products</span>
                  <p>{selectedEvent.details.productSummary}</p>
                </div>
              ) : null}

              {selectedEvent.notes || selectedEvent.details?.notes ? (
                <div className="calendarDetailNotes">
                  <span>Notes</span>
                  <p>{selectedEvent.notes || selectedEvent.details.notes}</p>
                </div>
              ) : null}

              <div className="calendarDetailActions">
                {selectedEvent.details?.documentUrl ? (
                  <a
                    href={selectedEvent.details.documentUrl}
                    className="secondaryButton compactButton"
                    target="_blank"
                    rel="noreferrer"
                  >
                    Open Document
                  </a>
                ) : null}

                {selectedEvent.sourcePath ? (
                  <Link
                    to={selectedEvent.sourcePath}
                    className="primaryButton compactPrimary"
                  >
                    Open Source
                  </Link>
                ) : null}

                {selectedEvent.source === "manual" ? (
                  <button
                    type="button"
                    className="secondaryButton compactButton"
                    onClick={() => {
                      setEventForm({
                        id: selectedEvent.id || "",
                        title: selectedEvent.title || "",
                        type: selectedEvent.type || "Market",
                        date: selectedEvent.date || todayISO(),
                        startTime: selectedEvent.startTime || "",
                        endTime: selectedEvent.endTime || "",
                        location: selectedEvent.location || "",
                        notes: selectedEvent.notes || ""
                      });
                      setIsEventFormOpen(true);
                    }}
                  >
                    Edit Event
                  </button>
                ) : null}
              </div>
            </div>
          </div>
        </div>
      ) : null}

      {isEventFormOpen ? (
        <div className="permitModalOverlay" role="dialog" aria-modal="true">
          <div className="permitModal calendarModal">
            <div className="permitModalHeader">
              <h3>{eventForm.id ? "Edit Calendar Event" : "Add Calendar Event"}</h3>

              <button type="button" onClick={() => setIsEventFormOpen(false)}>
                <X size={20} />
              </button>
            </div>

            <form className="permitModalForm" onSubmit={saveEvent}>
              <label className="permitFull">
                Title *
                <input
                  value={eventForm.title}
                  onChange={(event) =>
                    setEventForm((current) => ({
                      ...current,
                      title: event.target.value
                    }))
                  }
                  placeholder="e.g., Southland Market"
                />
              </label>

              <label>
                Type
                <select
                  value={eventForm.type}
                  onChange={(event) =>
                    setEventForm((current) => ({
                      ...current,
                      type: event.target.value
                    }))
                  }
                >
                  {eventTypes.map((type) => (
                    <option key={type}>{type}</option>
                  ))}
                </select>
              </label>

              <label>
                Date *
                <input
                  type="date"
                  value={eventForm.date}
                  onChange={(event) =>
                    setEventForm((current) => ({
                      ...current,
                      date: event.target.value
                    }))
                  }
                />
              </label>

              <label>
                Start Time
                <input
                  type="time"
                  value={eventForm.startTime}
                  onChange={(event) =>
                    setEventForm((current) => ({
                      ...current,
                      startTime: event.target.value
                    }))
                  }
                />
              </label>

              <label>
                End Time
                <input
                  type="time"
                  value={eventForm.endTime}
                  onChange={(event) =>
                    setEventForm((current) => ({
                      ...current,
                      endTime: event.target.value
                    }))
                  }
                />
              </label>

              <label className="permitFull">
                Location
                <input
                  value={eventForm.location}
                  onChange={(event) =>
                    setEventForm((current) => ({
                      ...current,
                      location: event.target.value
                    }))
                  }
                  placeholder="Market location, venue, or delivery area"
                />
              </label>

              <label className="permitFull">
                Notes
                <textarea
                  value={eventForm.notes}
                  onChange={(event) =>
                    setEventForm((current) => ({
                      ...current,
                      notes: event.target.value
                    }))
                  }
                  placeholder="Optional details..."
                />
              </label>

              <div className="permitModalActions permitFull">
                {eventForm.id ? (
                  <button
                    className="secondaryButton compactButton dangerButton"
                    type="button"
                    onClick={() => removeEvent(eventForm.id)}
                  >
                    <Trash2 size={15} />
                    Delete
                  </button>
                ) : null}

                <button
                  className="secondaryButton compactButton"
                  type="button"
                  onClick={() => setIsEventFormOpen(false)}
                >
                  Cancel
                </button>

                <button className="primaryButton compactPrimary" type="submit">
                  <Save size={15} />
                  Save Event
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}

      {isGuideOpen ? (
        <div className="moduleGuideOverlay" role="dialog" aria-modal="true">
          <div className="moduleGuideModal">
            <div className="moduleGuideHeader">
              <div>
                <p className="eyebrow">Module Guide</p>
                <h2>Calendar Guide</h2>
              </div>

              <button
                className="moduleGuideCloseButton"
                type="button"
                onClick={() => setIsGuideOpen(false)}
              >
                <X size={20} />
              </button>
            </div>

            <div className="moduleGuideBody">
              <CalendarGuideContent />
            </div>

            <div className="moduleGuideFooter">
              <span className="moduleGuideDismiss">
                Use this guide anytime from the Guide button.
              </span>

              <button
                className="primaryButton"
                type="button"
                onClick={() => setIsGuideOpen(false)}
              >
                Got it
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
