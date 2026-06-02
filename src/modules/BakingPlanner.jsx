import React, { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  Plus,
  Trash2,
  Printer,
  Wheat,
  Thermometer,
  Droplets,
  Mountain,
  Clock,
  AlertTriangle,
  CheckCircle2,
  Scale,
  ChefHat,
  Settings,
  BookOpen,
  ClipboardList,
  FlaskConical,
  Save,
  Copy,
  Cloud,
  Package
} from "lucide-react";
import "./bakingPlanner.css";
import { doc, getDoc, serverTimestamp, setDoc } from "firebase/firestore";
import { db } from "../firebase";
import { useAuth } from "../AuthContext.jsx";
import { useUnsavedChanges } from "../UnsavedChangesContext.jsx";
import StatCard from "../components/StatCard.jsx";

function Card({ children, className = "" }) {
  return <div className={`card ${className}`}>{children}</div>;
}

function CardContent({ children, className = "" }) {
  return <div className={className}>{children}</div>;
}

function Button({ children, onClick, className = "", variant, size, disabled }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`btn ${variant || ""} ${size || ""} ${className}`}
      type="button"
    >
      {children}
    </button>
  );
}

const initialRecipes = [
  {
    id: "rustic-loaf",
    name: "Rustic Sourdough Loaf",
    category: "Loaf",
    unitsLabel: "loaves",
    vesselType: "Banneton / Dutch Oven",
    finishedUnitWeight: 680,
    bakeLossPct: 12,
    batchMaxDoughG: 7200,
    ovenCapacityUnits: 8,
    flourTypes: [
      { name: "Bread Flour", pct: 85 },
      { name: "Whole Wheat Flour", pct: 15 }
    ],
    hydrationPct: 78,
    starterPct: 22,
    starterHydrationPct: 100,
    saltPct: 2.1,
    otherIngredients: [],
    process: {
      autolyseMin: 30,
      mixMin: 12,
      bulkMin: 300,
      foldCount: 4,
      foldIntervalMin: 30,
      foldDurationMin: 5,
      divideAndPreshapeMin: 12,
      benchRestMin: 20,
      finalShapeMin: 18,
      finalProofMin: 180,
      bakeTempF: 475,
      bakeMin: 42,
      coolMin: 120
    }
  },
  {
    id: "ciabatta",
    name: "Ciabatta",
    category: "High Hydration",
    unitsLabel: "pieces",
    vesselType: "Sheet Pan",
    finishedUnitWeight: 280,
    bakeLossPct: 14,
    batchMaxDoughG: 6500,
    ovenCapacityUnits: 30,
    flourTypes: [{ name: "Bread Flour", pct: 100 }],
    hydrationPct: 88,
    starterPct: 18,
    starterHydrationPct: 100,
    saltPct: 2.2,
    otherIngredients: [{ name: "Olive Oil", pct: 2 }],
    process: {
      autolyseMin: 20,
      mixMin: 10,
      bulkMin: 240,
      foldCount: 4,
      foldIntervalMin: 25,
      foldDurationMin: 5,
      divideAndPreshapeMin: 0,
      benchRestMin: 0,
      finalShapeMin: 12,
      finalProofMin: 60,
      bakeTempF: 460,
      bakeMin: 24,
      coolMin: 60
    }
  },
  {
    id: "baguette",
    name: "Baguette",
    category: "Baguette",
    unitsLabel: "baguettes",
    vesselType: "Baguette Tray / Stone",
    finishedUnitWeight: 300,
    bakeLossPct: 13,
    batchMaxDoughG: 6000,
    ovenCapacityUnits: 18,
    flourTypes: [{ name: "Bread Flour", pct: 100 }],
    hydrationPct: 72,
    starterPct: 20,
    starterHydrationPct: 100,
    saltPct: 2,
    otherIngredients: [],
    process: {
      autolyseMin: 25,
      mixMin: 10,
      bulkMin: 210,
      foldCount: 3,
      foldIntervalMin: 30,
      foldDurationMin: 5,
      divideAndPreshapeMin: 10,
      benchRestMin: 20,
      finalShapeMin: 20,
      finalProofMin: 75,
      bakeTempF: 480,
      bakeMin: 22,
      coolMin: 45
    }
  },
  {
    id: "sandwich-loaf",
    name: "Sandwich Loaf",
    category: "Pan Loaf",
    unitsLabel: "loaves",
    vesselType: "Sandwich Loaf Pan",
    finishedUnitWeight: 720,
    bakeLossPct: 10,
    batchMaxDoughG: 7800,
    ovenCapacityUnits: 12,
    flourTypes: [{ name: "Bread Flour", pct: 100 }],
    hydrationPct: 68,
    starterPct: 18,
    starterHydrationPct: 100,
    saltPct: 2,
    otherIngredients: [
      { name: "Honey / Sugar", pct: 5 },
      { name: "Butter / Oil", pct: 6 },
      { name: "Milk Powder", pct: 3 }
    ],
    process: {
      autolyseMin: 0,
      mixMin: 14,
      bulkMin: 240,
      foldCount: 2,
      foldIntervalMin: 35,
      foldDurationMin: 5,
      divideAndPreshapeMin: 8,
      benchRestMin: 15,
      finalShapeMin: 12,
      finalProofMin: 150,
      bakeTempF: 385,
      bakeMin: 38,
      coolMin: 120
    }
  }
];

const defaultSettings = {
  altitudeFt: 980,
  baselineTempF: 72,
  baselineHumidityPct: 55,
  starterHydrationPct: 100,
  levainBufferPct: 10,
  ingredientBufferPct: 3,
  mixerCapacityG: 7000,
  proofingCapacityUnits: 24,
  defaultStartTime: "06:00",
  bakingPlannerMode: "",
  starterName: "",
  useStarterNameInLabels: false,
  starterFeedingPreset: "1:2:2",
  starterSeedParts: 1,
  starterFlourParts: 2,
  starterWaterParts: 2
};

const starterFeedingPresets = {
  "1:1:1": { seed: 1, flour: 1, water: 1 },
  "1:2:2": { seed: 1, flour: 2, water: 2 },
  "1:3:3": { seed: 1, flour: 3, water: 3 },
  "1:5:5": { seed: 1, flour: 5, water: 5 }
};

const pantryCategories = [
  "Flour",
  "Grain",
  "Starter",
  "Sweetener",
  "Fat",
  "Salt",
  "Dairy",
  "Add-In",
  "Seed",
  "Spice",
  "Packaging",
  "Other"
];

const pantryUnits = ["g", "kg", "oz", "lb"];

const blankPantryItem = {
  id: "",
  name: "",
  category: "Flour",
  source: "",
  packageSize: "",
  packageUnit: "lb",
  packageCost: "",
  trackInventory: false,
  quantityOnHand: "",
  onHandUnit: "lb",
  lowStockThreshold: "",
  lowStockAlertMode: "weight",
  lowStockPackageThreshold: "",
  notes: ""
};

const unitToGrams = {
  g: 1,
  kg: 1000,
  oz: 28.349523125,
  lb: 453.59237
};

function makeId(prefix = "item") {
  return `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function convertToGrams(size, unit) {
  return (Number(size) || 0) * (unitToGrams[unit] || 1);
}

function formatMoney(value, digits = 4) {
  const number = Number(value) || 0;

  return number.toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: number > 0 && number < 1 ? digits : 2,
    maximumFractionDigits: number > 0 && number < 1 ? digits : 2
  });
}

function normalizePantryItem(item = {}) {
  const packageSize = item.packageSize === "" ? "" : Number(item.packageSize) || 0;
  const packageCost = item.packageCost === "" ? "" : Number(item.packageCost) || 0;
  const packageUnit = pantryUnits.includes(item.packageUnit) ? item.packageUnit : "lb";
  const onHandUnit = pantryUnits.includes(item.onHandUnit) ? item.onHandUnit : packageUnit;
  const quantityOnHand =
    item.quantityOnHand === "" ? "" : Number(item.quantityOnHand) || 0;
  const lowStockThreshold =
    item.lowStockThreshold === "" ? "" : Number(item.lowStockThreshold) || 0;
  const lowStockAlertMode = item.lowStockAlertMode === "package" ? "package" : "weight";
  const lowStockPackageThreshold =
    item.lowStockPackageThreshold === "" ? "" : Number(item.lowStockPackageThreshold) || 0;
  const packageGrams = convertToGrams(packageSize, packageUnit);
  const quantityOnHandGrams = convertToGrams(quantityOnHand, onHandUnit);
  const lowStockThresholdGrams =
    lowStockAlertMode === "package"
      ? packageGrams * (Number(lowStockPackageThreshold) || 0)
      : convertToGrams(lowStockThreshold, onHandUnit);
  const costPerGram =
    packageGrams > 0 && Number(packageCost) > 0
      ? Number(packageCost) / packageGrams
      : 0;

  return {
    ...blankPantryItem,
    ...item,
    id: item.id || makeId("pantry"),
    packageSize,
    packageUnit,
    packageCost,
    trackInventory: Boolean(item.trackInventory),
    quantityOnHand,
    onHandUnit,
    lowStockThreshold,
    lowStockAlertMode,
    lowStockPackageThreshold,
    packageGrams,
    quantityOnHandGrams,
    lowStockThresholdGrams,
    costPerGram,
    costPerOunce: costPerGram * 28.349523125,
    costPerPound: costPerGram * 453.59237
  };
}

function formatLowStockAlert(item) {
  if (!item?.trackInventory) return "None";

  if (item.lowStockAlertMode === "package") {
    const threshold = Number(item.lowStockPackageThreshold) || 0;
    if (threshold <= 0) return "None";
    const label = threshold === 1 ? "package" : "packages";
    return `Below ${formatNumber(threshold, 2)} ${label}`;
  }

  return Number(item.lowStockThresholdGrams) > 0
    ? formatSmartWeight(item.lowStockThresholdGrams)
    : "None";
}

function getRemainingPackageCount(item) {
  const packageGrams = Number(item?.packageGrams) || 0;
  const onHand = Number(item?.quantityOnHandGrams) || 0;

  return packageGrams > 0 ? onHand / packageGrams : 0;
}

function normalizeIngredientName(value) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function findPantryMatch(ingredientName, pantryItems) {
  const target = normalizeIngredientName(ingredientName);
  if (!target) return null;

  const normalizedPantry = pantryItems.map((item) => ({
    item,
    name: normalizeIngredientName(item.name)
  }));

  const exactMatch = normalizedPantry.find(({ name }) => name === target);
  if (exactMatch) return exactMatch.item;

  const containedMatch = normalizedPantry.find(({ name }) => {
    if (!name) return false;
    return name.includes(target) || target.includes(name);
  });

  return containedMatch?.item || null;
}

function getInventoryStatus(row) {
  const item = row?.pantryItem;

  if (!item?.trackInventory) {
    return {
      status: "not-tracked",
      label: "Current inventory not tracked",
      className: "muted tiny"
    };
  }

  const onHand = Number(item.quantityOnHandGrams) || 0;
  const needed = Number(row.grams) || 0;
  const lowThreshold = Number(item.lowStockThresholdGrams) || 0;
  const lowPackageThreshold = Number(item.lowStockPackageThreshold) || 0;
  const remainingAfterPull = onHand - needed;
  const remainingPackagesAfterPull =
    Number(item.packageGrams) > 0 ? remainingAfterPull / Number(item.packageGrams) : 0;

  if (needed > onHand) {
    return {
      status: "short",
      label: `Short ${formatSmartWeight(needed - onHand)}`,
      className: "warning-text tiny"
    };
  }

  if (
    item.lowStockAlertMode === "package" &&
    lowPackageThreshold > 0 &&
    remainingPackagesAfterPull <= lowPackageThreshold
  ) {
    return {
      status: "low",
      label: `Low after pull, ${formatNumber(remainingPackagesAfterPull, 2)} package${remainingPackagesAfterPull === 1 ? "" : "s"} left`,
      className: "warning-text tiny"
    };
  }

  if (item.lowStockAlertMode !== "package" && lowThreshold > 0 && remainingAfterPull <= lowThreshold) {
    return {
      status: "low",
      label: `Low after pull, ${formatSmartWeight(remainingAfterPull)} left`,
      className: "warning-text tiny"
    };
  }

  return {
    status: "ok",
    label: `${formatSmartWeight(remainingAfterPull)} left after pull`,
    className: "muted tiny"
  };
}


function formatSmartWeight(value, label = "") {
  const grams = Number(value) || 0;
  let base = formatGrams(grams);

  if (grams >= 453.59237) {
    base = `${(grams / 453.59237).toLocaleString("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    })} lb (${formatGrams(grams)})`;
  } else if (grams > GRAMS_PER_OUNCE) {
    base = `${formatOunces(grams)} oz (${formatGrams(grams)})`;
  }

  return label ? `${base} ${label}` : base;
}


function formatPullWeight(value) {
  const grams = Number(value) || 0;
  const roundedGrams = Math.round(grams).toLocaleString("en-US");

  if (grams >= 453.59237) {
    const pounds = (grams / 453.59237).toLocaleString("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });

    return `${pounds} lb (${roundedGrams} g)`;
  }

  if (grams >= GRAMS_PER_OUNCE) {
    const ounces = (grams / GRAMS_PER_OUNCE).toLocaleString("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });

    return `${ounces} oz (${roundedGrams} g)`;
  }

  return `${roundedGrams} g`;
}

function formatCompactPackagePull(row) {
  if (row?.isNonCosted) return "N/A";
  if (!row?.pantryItem?.packageGrams || !row.packageCount) return "No match";

  const item = row.pantryItem;
  const packageSize = formatNumber(item.packageSize, 2);
  const packageCount = row.packageCount.toLocaleString("en-US", {
    minimumFractionDigits: row.packageCount < 1 ? 2 : 1,
    maximumFractionDigits: 2
  });

  return `${packageCount} × ${packageSize}${item.packageUnit}`;
}

function buildIngredientPullRow(name, grams, pantryItems, options = {}) {
  const isNonCosted = Boolean(options.isNonCosted);
  const pantryItem = isNonCosted ? null : findPantryMatch(name, pantryItems);
  const amount = Number(grams) || 0;
  const estimatedCost = pantryItem?.costPerGram ? amount * pantryItem.costPerGram : 0;
  const packageCount = pantryItem?.packageGrams ? amount / pantryItem.packageGrams : 0;

  return {
    name,
    grams: amount,
    pantryItem,
    estimatedCost,
    packageCount,
    isNonCosted
  };
}

function formatPackagePull(row) {
  if (!row?.pantryItem?.packageGrams || !row.packageCount) return "";

  const item = row.pantryItem;
  const packageSize = formatNumber(item.packageSize, 2);
  const packageCount = row.packageCount.toLocaleString("en-US", {
    minimumFractionDigits: row.packageCount < 1 ? 2 : 1,
    maximumFractionDigits: 2
  });

  return `Pull ${packageCount} × ${packageSize}${item.packageUnit} package${row.packageCount === 1 ? "" : "s"}`;
}


function buildPlanCostRows(plan, pantryItems, starterLabel, includeBuffer = false, ingredientBufferPct = 0) {
  if (!plan) return [];

  const multiplier = includeBuffer ? 1 + (Number(ingredientBufferPct) || 0) / 100 : 1;
  const rows = [];

  plan.flourBreakdown.forEach((flour) => {
    rows.push(buildIngredientPullRow(flour.name, flour.grams * multiplier, pantryItems));
  });

  rows.push(
    buildIngredientPullRow("Water", plan.waterG * multiplier, pantryItems, {
      isNonCosted: true
    })
  );

  if (plan.bassinageWaterG > 0) {
    rows.push(
      buildIngredientPullRow(
        "Bassinage Water",
        plan.bassinageWaterG * multiplier,
        pantryItems,
        { isNonCosted: true }
      )
    );
  }

  rows.push(
    buildIngredientPullRow(starterLabel, plan.starterG * multiplier, pantryItems, {
      isNonCosted: true
    })
  );
  rows.push(buildIngredientPullRow("Salt", plan.saltG * multiplier, pantryItems));

  plan.otherBreakdown.forEach((ingredient) => {
    rows.push(buildIngredientPullRow(ingredient.name, ingredient.grams * multiplier, pantryItems));
  });

  return rows.filter((row) => row.grams > 0);
}

function calculatePlanIngredientCost(plan, pantryItems, starterLabel, includeBuffer = false, ingredientBufferPct = 0) {
  const rows = buildPlanCostRows(
    plan,
    pantryItems,
    starterLabel,
    includeBuffer,
    ingredientBufferPct
  );

  const totalCost = rows.reduce((sum, row) => sum + (row.estimatedCost || 0), 0);
  const costedRows = rows.filter((row) => !row.isNonCosted);
  const matchedRows = costedRows.filter((row) => row.pantryItem).length;
  const totalRows = costedRows.length;
  const unmatchedRows = costedRows.filter((row) => !row.pantryItem);

  return {
    rows,
    totalCost,
    costPerUnit: plan?.quantity ? totalCost / plan.quantity : totalCost,
    matchedRows,
    totalRows,
    unmatchedRows
  };
}


function loadFromStorage(key, fallback) {
  try {
    const saved = localStorage.getItem(key);
    return saved ? JSON.parse(saved) : fallback;
  } catch {
    return fallback;
  }
}

function saveToStorage(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

function round(value, digits = 0) {
  const factor = Math.pow(10, digits);
  return Math.round((Number(value) || 0) * factor) / factor;
}

function formatNumber(value, digits = 2) {
  const rounded = round(value, digits);
  return Number.isInteger(rounded) ? String(rounded) : String(rounded);
}

const GRAMS_PER_OUNCE = 28.349523125;

function formatGrams(value) {
  return `${Math.round(Number(value) || 0).toLocaleString("en-US")}g`;
}

function formatOunces(value) {
  return ((Number(value) || 0) / GRAMS_PER_OUNCE).toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
}

function formatWeight(value, label = "") {
  const grams = Number(value) || 0;
  const base =
    grams > GRAMS_PER_OUNCE
      ? `${formatGrams(grams)}/${formatOunces(grams)}oz`
      : formatGrams(grams);

  return label ? `${base} ${label}` : base;
}

function getRecipeIngredientMode(recipe) {
  return recipe?.ingredientMode === "weight" ? "weight" : "percentage";
}

function getIngredientModeLabel(mode) {
  return mode === "weight" ? "Fixed Weights" : "Baker's Percentages";
}

function getOtherIngredientPctValue(ingredient) {
  return Number(ingredient?.pct) || 0;
}

function getOtherIngredientWeightValue(ingredient) {
  return Number(ingredient?.grams) || 0;
}

function getSaltWeightValue(recipe) {
  return Number(recipe?.saltWeightG) || 0;
}

function getHydrationWeightValue(recipe) {
  return Number(recipe?.hydrationWeightG) || 0;
}

function getInitialHydrationWeightValue(recipe) {
  return Number(recipe?.initialHydrationWeightG) || 0;
}

function getBassinageWeightValue(recipe) {
  return Number(recipe?.bassinageWeightG) || 0;
}

function getStarterWeightValue(recipe) {
  return Number(recipe?.starterWeightG) || 0;
}

function getFlourPctValue(flour) {
  return Number(flour?.pct) || 0;
}

function getFlourWeightValue(flour) {
  return Number(flour?.grams) || 0;
}

function roundRecipeValue(value, digits = 1) {
  const factor = Math.pow(10, digits);
  return Math.round((Number(value) || 0) * factor) / factor;
}

function formatIngredientCompanion(value, mode) {
  if (mode === "weight") {
    return `${formatNumber(value, 2)}%`;
  }

  return formatGrams(value);
}

function minutesToLabel(minutes) {
  const h = Math.floor(minutes / 60);
  const m = Math.round(minutes % 60);
  if (h <= 0) return `${m} min`;
  if (m === 0) return `${h} hr`;
  return `${h} hr ${m} min`;
}

function timeToMinutes(time) {
  const [h, m] = time.split(":").map(Number);
  return h * 60 + m;
}

function minutesToClock(totalMinutes) {
  const dayMin = ((Math.round(totalMinutes) % 1440) + 1440) % 1440;
  const hour24 = Math.floor(dayMin / 60);
  const minute = dayMin % 60;
  const ampm = hour24 >= 12 ? "PM" : "AM";
  let hour12 = hour24 % 12;
  if (hour12 === 0) hour12 = 12;
  return `${hour12}:${String(minute).padStart(2, "0")} ${ampm}`;
}

function addMinutesToTime(time, minutes) {
  return minutesToClock(timeToMinutes(time) + Math.round(minutes));
}

function getTodayISODate() {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function formatDisplayDate(dateString) {
  if (!dateString) return "";
  const [year, month, day] = dateString.split("-").map(Number);
  const date = new Date(year, month - 1, day);

  return date.toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric"
  });
}

function resourceLabel(resource) {
  if (!resource) return "";
  return resource.charAt(0).toUpperCase() + resource.slice(1);
}

function tempFermentationFactor(tempF, baselineF) {
  const diff = tempF - baselineF;
  const factor = 1 - diff * 0.035;
  return Math.min(1.35, Math.max(0.62, factor));
}

function humidityHydrationAdjustment(humidityPct, baselineHumidityPct) {
  const diff = humidityPct - baselineHumidityPct;
  if (diff <= -20) return 1.5;
  if (diff <= -10) return 0.8;
  if (diff >= 20) return -1.0;
  if (diff >= 10) return -0.5;
  return 0;
}

function altitudeBakeAdjustment(altitudeFt) {
  if (altitudeFt < 1500) return { tempF: 0, timePct: 0, hydrationPct: 0 };
  if (altitudeFt < 3000) return { tempF: 5, timePct: 3, hydrationPct: 0.5 };
  if (altitudeFt < 5000) return { tempF: 10, timePct: 6, hydrationPct: 1 };
  return { tempF: 15, timePct: 10, hydrationPct: 1.5 };
}

function normalizeRecipe(recipe) {
  const bakeLossPct = Number(recipe.bakeLossPct) || 0;
  const preBakeUnitWeight =
    Number(recipe.preBakeUnitWeight) ||
    (Number(recipe.finishedUnitWeight)
      ? Number(recipe.finishedUnitWeight) / (1 - bakeLossPct / 100)
      : 500);
  const finishedUnitWeight =
    Number(recipe.finishedUnitWeight) ||
    preBakeUnitWeight * (1 - bakeLossPct / 100);
  const bassinagePct = Number(recipe.bassinagePct) || 0;
  const hydrationPct = Number(recipe.hydrationPct) || 0;
  const initialHydrationPct =
    recipe.initialHydrationPct !== undefined
      ? Number(recipe.initialHydrationPct) || 0
      : Math.max(0, hydrationPct - bassinagePct);

  return {
    ...recipe,
    preBakeUnitWeight,
    finishedUnitWeight,
    listInProductDirectory: Boolean(recipe.listInProductDirectory),
    productDirectory: {
      productName: recipe.productDirectory?.productName || recipe.name || "",
      sellingUnit: recipe.productDirectory?.sellingUnit || recipe.unitsLabel || "unit",
      unitsPerBatch:
        recipe.productDirectory?.unitsPerBatch !== undefined
          ? Number(recipe.productDirectory.unitsPerBatch) || 0
          : Number(recipe.ovenCapacityUnits) || 1,
      laborHoursPerBatch:
        recipe.productDirectory?.laborHoursPerBatch !== undefined
          ? Number(recipe.productDirectory.laborHoursPerBatch) || 0
          : 0,
      notes: recipe.productDirectory?.notes || ""
    },
    ingredientMode: getRecipeIngredientMode(recipe),
    hydrationWeightG:
      recipe.hydrationWeightG !== undefined
        ? Number(recipe.hydrationWeightG) || 0
        : 0,
    initialHydrationWeightG:
      recipe.initialHydrationWeightG !== undefined
        ? Number(recipe.initialHydrationWeightG) || 0
        : 0,
    bassinageWeightG:
      recipe.bassinageWeightG !== undefined
        ? Number(recipe.bassinageWeightG) || 0
        : 0,
    starterWeightG:
      recipe.starterWeightG !== undefined
        ? Number(recipe.starterWeightG) || 0
        : 0,
    saltWeightG:
      recipe.saltWeightG !== undefined
        ? Number(recipe.saltWeightG) || 0
        : 0,
    mixingMethod:
      recipe.mixingMethod ||
      (Number(recipe.process?.autolyseMin) > 0 ? "autolyse" : "straight"),
    useBassinage: Boolean(recipe.useBassinage),
    initialHydrationPct,
    bassinagePct,
    flourTypes: (recipe.flourTypes || [{ name: "Bread Flour", pct: 100 }]).map((flour) => ({
      ...flour,
      pct: flour.pct !== undefined ? Number(flour.pct) || 0 : 0,
      grams: flour.grams !== undefined ? Number(flour.grams) || 0 : 0
    })),
    otherIngredients: (recipe.otherIngredients || []).map((ingredient) => ({
      ...ingredient,
      pct: ingredient.pct !== undefined ? Number(ingredient.pct) || 0 : 0,
      grams: ingredient.grams !== undefined ? Number(ingredient.grams) || 0 : 0
    })),
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

function calculateRecipePlan(rawRecipe, quantity, env, settings) {
  const recipe = normalizeRecipe(rawRecipe);
  const qty = Number(quantity) || 0;
  const ingredientMode = getRecipeIngredientMode(recipe);
  const percentageMode = ingredientMode === "percentage";

  const rawHydrationPct = recipe.useBassinage
    ? Number(recipe.initialHydrationPct || 0) + Number(recipe.bassinagePct || 0)
    : Number(recipe.hydrationPct) || 0;

  const humidityAdj = humidityHydrationAdjustment(
    env.humidityPct,
    settings.baselineHumidityPct
  );
  const altitudeAdj = altitudeBakeAdjustment(settings.altitudeFt);
  const hydrationAdjustmentPct = humidityAdj + altitudeAdj.hydrationPct;

  const rawOtherPct = recipe.otherIngredients.reduce(
    (sum, item) => sum + getOtherIngredientPctValue(item),
    0
  );

  const fallbackFormulaTotalPct =
    100 + rawHydrationPct + Number(recipe.starterPct || 0) +
    Number(recipe.saltPct || 0) + rawOtherPct;
  const fallbackBaseFlourPerUnit =
    fallbackFormulaTotalPct > 0
      ? Number(recipe.preBakeUnitWeight || 0) / (fallbackFormulaTotalPct / 100)
      : 0;

  let doughWeight = qty * recipe.preBakeUnitWeight;
  let baseFlourG = 0;
  let starterG = 0;
  let waterG = 0;
  let initialWaterG = 0;
  let bassinageWaterG = 0;
  let saltG = 0;
  let adjustedHydrationPct = rawHydrationPct + hydrationAdjustmentPct;
  let adjustedInitialHydrationPct = recipe.useBassinage
    ? Number(recipe.initialHydrationPct || 0) + hydrationAdjustmentPct
    : adjustedHydrationPct;
  let adjustedBassinagePct = recipe.useBassinage ? Number(recipe.bassinagePct || 0) : 0;
  let effectiveStarterPct = Number(recipe.starterPct) || 0;
  let effectiveSaltPct = Number(recipe.saltPct) || 0;
  let flourBreakdown = [];
  let otherBreakdown = [];

  if (percentageMode) {
    const formulaTotalPct =
      100 + adjustedHydrationPct + effectiveStarterPct + effectiveSaltPct + rawOtherPct;

    baseFlourG = formulaTotalPct > 0 ? doughWeight / (formulaTotalPct / 100) : 0;
    starterG = (baseFlourG * effectiveStarterPct) / 100;
    waterG = (baseFlourG * adjustedHydrationPct) / 100;
    initialWaterG = (baseFlourG * adjustedInitialHydrationPct) / 100;
    bassinageWaterG = (baseFlourG * adjustedBassinagePct) / 100;
    saltG = (baseFlourG * effectiveSaltPct) / 100;

    flourBreakdown = recipe.flourTypes.map((f) => ({
      name: f.name,
      grams: (baseFlourG * getFlourPctValue(f)) / 100,
      pct: getFlourPctValue(f)
    }));

    otherBreakdown = recipe.otherIngredients.map((item) => {
      const pct = getOtherIngredientPctValue(item);

      return {
        name: item.name,
        grams: (baseFlourG * pct) / 100,
        pct
      };
    });
  } else {
    const flourPerUnitRows = recipe.flourTypes.map((flour) => {
      const fallbackGrams = (fallbackBaseFlourPerUnit * getFlourPctValue(flour)) / 100;
      const grams = getFlourWeightValue(flour) || fallbackGrams;

      return {
        name: flour.name,
        grams
      };
    });

    const flourPerUnitTotal = flourPerUnitRows.reduce(
      (sum, flour) => sum + (Number(flour.grams) || 0),
      0
    );
    const hydrationPerUnitFallback = (fallbackBaseFlourPerUnit * Number(recipe.hydrationPct || 0)) / 100;
    const initialHydrationPerUnitFallback =
      (fallbackBaseFlourPerUnit * Number(recipe.initialHydrationPct || 0)) / 100;
    const bassinagePerUnitFallback =
      (fallbackBaseFlourPerUnit * Number(recipe.bassinagePct || 0)) / 100;
    const starterPerUnitFallback = (fallbackBaseFlourPerUnit * Number(recipe.starterPct || 0)) / 100;
    const saltPerUnitFallback = (fallbackBaseFlourPerUnit * Number(recipe.saltPct || 0)) / 100;

    const baseInitialWaterPerUnit = recipe.useBassinage
      ? getInitialHydrationWeightValue(recipe) || initialHydrationPerUnitFallback
      : getHydrationWeightValue(recipe) || hydrationPerUnitFallback;
    const baseBassinageWaterPerUnit = recipe.useBassinage
      ? getBassinageWeightValue(recipe) || bassinagePerUnitFallback
      : 0;
    const waterAdjustmentPerUnit = (flourPerUnitTotal * hydrationAdjustmentPct) / 100;
    const starterPerUnit = getStarterWeightValue(recipe) || starterPerUnitFallback;
    const saltPerUnit = getSaltWeightValue(recipe) || saltPerUnitFallback;

    const otherPerUnitRows = recipe.otherIngredients.map((item) => {
      const fallbackGrams = (fallbackBaseFlourPerUnit * getOtherIngredientPctValue(item)) / 100;
      const grams = getOtherIngredientWeightValue(item) || fallbackGrams;

      return {
        name: item.name,
        grams
      };
    });

    baseFlourG = flourPerUnitTotal * qty;
    initialWaterG = (baseInitialWaterPerUnit + waterAdjustmentPerUnit) * qty;
    bassinageWaterG = baseBassinageWaterPerUnit * qty;
    waterG = initialWaterG + bassinageWaterG;
    starterG = starterPerUnit * qty;
    saltG = saltPerUnit * qty;
    otherBreakdown = otherPerUnitRows.map((item) => {
      const grams = item.grams * qty;
      const pct = baseFlourG > 0 ? (grams / baseFlourG) * 100 : 0;

      return {
        name: item.name,
        grams,
        pct
      };
    });
    flourBreakdown = flourPerUnitRows.map((flour) => {
      const grams = flour.grams * qty;
      const pct = baseFlourG > 0 ? (grams / baseFlourG) * 100 : 0;

      return {
        name: flour.name,
        grams,
        pct
      };
    });

    const fixedOtherG = otherBreakdown.reduce((sum, item) => sum + item.grams, 0);
    doughWeight = baseFlourG + waterG + starterG + saltG + fixedOtherG;
    adjustedHydrationPct = baseFlourG > 0 ? (waterG / baseFlourG) * 100 : 0;
    adjustedInitialHydrationPct = baseFlourG > 0 ? (initialWaterG / baseFlourG) * 100 : 0;
    adjustedBassinagePct = baseFlourG > 0 ? (bassinageWaterG / baseFlourG) * 100 : 0;
    effectiveStarterPct = baseFlourG > 0 ? (starterG / baseFlourG) * 100 : 0;
    effectiveSaltPct = baseFlourG > 0 ? (saltG / baseFlourG) * 100 : 0;
  }

  const desiredBakedWeight = doughWeight * (1 - recipe.bakeLossPct / 100);

  const fermentationFactor = tempFermentationFactor(
    env.tempF,
    settings.baselineTempF
  );

  const bulkMin = recipe.process.bulkMin * fermentationFactor;
  const finalProofMin = recipe.process.finalProofMin * fermentationFactor;
  const bakeMin = recipe.process.bakeMin * (1 + altitudeAdj.timePct / 100);
  const bakeTempF = recipe.process.bakeTempF + altitudeAdj.tempF;

  const batchesByMixer = Math.ceil(
    doughWeight / Math.min(recipe.batchMaxDoughG, settings.mixerCapacityG)
  );

  const recipeOvenCapacity = Math.max(1, Number(recipe.ovenCapacityUnits) || 1);
  const ovenLoads = Math.ceil(qty / recipeOvenCapacity);

  const totalProcessMin =
    recipe.process.autolyseMin +
    recipe.process.mixMin +
    bulkMin +
    recipe.process.divideAndPreshapeMin +
    recipe.process.benchRestMin +
    recipe.process.finalShapeMin +
    finalProofMin +
    bakeMin * ovenLoads +
    recipe.process.coolMin;

  return {
    recipe,
    quantity: qty,
    desiredBakedWeight,
    doughWeight,
    baseFlourG,
    starterG,
    starterPct: effectiveStarterPct,
    waterG,
    initialWaterG,
    bassinageWaterG,
    saltG,
    saltPct: effectiveSaltPct,
    ingredientMode,
    flourBreakdown,
    otherBreakdown,
    adjustedHydrationPct,
    humidityAdj,
    altitudeAdj,
    fermentationFactor,
    bulkMin,
    finalProofMin,
    bakeMin,
    bakeTempF,
    batchesByMixer,
    ovenLoads,
    recipeOvenCapacity,
    totalProcessMin
  };
}

function buildProductionSchedule(plans, settings) {
  const startMin = timeToMinutes(settings.defaultStartTime || "06:00");

  let bakerAvailableAt = startMin;
  let mixerAvailableAt = startMin;
  let ovenAvailableAt = startMin;

  const schedule = [];
  const productStates = new Map();

  const sortedPlans = [...plans].sort((a, b) => {
    const aAutolyse = Number(a.recipe.process.autolyseMin) || 0;
    const bAutolyse = Number(b.recipe.process.autolyseMin) || 0;

    if (bAutolyse !== aAutolyse) return bAutolyse - aAutolyse;

    const aLead = a.bulkMin + a.finalProofMin;
    const bLead = b.bulkMin + b.finalProofMin;

    return bLead - aLead;
  });

  const pushTask = ({ plan, name, resource, start, duration, note = "" }) => {
    const task = {
      product: plan.recipe.name,
      qty: plan.quantity,
      name,
      resource,
      start,
      end: start + duration,
      duration,
      note
    };

    schedule.push(task);
    return task;
  };

  const scheduleBakerTask = ({ plan, name, earliestStart, duration, note = "" }) => {
    const start = Math.max(earliestStart, bakerAvailableAt);
    const task = pushTask({
      plan,
      name,
      resource: "baker",
      start,
      duration,
      note
    });

    bakerAvailableAt = task.end;
    return task;
  };

  const scheduleMixerTask = ({ plan, name, earliestStart, duration, note = "" }) => {
    const start = Math.max(earliestStart, bakerAvailableAt, mixerAvailableAt);
    const task = pushTask({
      plan,
      name,
      resource: "mixer",
      start,
      duration,
      note
    });

    bakerAvailableAt = task.end;
    mixerAvailableAt = task.end;
    return task;
  };

  const scheduleOvenTask = ({ plan, name, earliestStart, duration, note = "" }) => {
    const start = Math.max(earliestStart, bakerAvailableAt, ovenAvailableAt);
    const task = pushTask({
      plan,
      name,
      resource: "oven",
      start,
      duration,
      note
    });

    ovenAvailableAt = task.end;
    bakerAvailableAt = start + Math.min(duration, 8);
    return task;
  };

  const schedulePassiveTask = ({ plan, name, start, duration, note = "" }) => {
    return pushTask({
      plan,
      name,
      resource: "passive",
      start,
      duration,
      note
    });
  };

  sortedPlans.forEach((plan) => {
    const mixingMethod = plan.recipe.mixingMethod || "straight";
    const autolyseMin =
      mixingMethod === "straight" ? 0 : Number(plan.recipe.process.autolyseMin) || 0;
    const methodLabels = {
      autolyse: "Start autolyse",
      fermentolyse: "Start fermentolyse",
      saltolyse: "Start saltolyse",
      straight: "Straight mix"
    };
    let autolyseStart = startMin;
    let autolyseEnd = startMin;

    if (autolyseMin > 0) {
      const autolyseTask = scheduleBakerTask({
        plan,
        name: methodLabels[mixingMethod] || "Start method rest",
        earliestStart: startMin,
        duration: autolyseMin,
        note: ""
      });

      autolyseStart = autolyseTask.start;
      autolyseEnd = autolyseTask.end;
    }

    productStates.set(plan.recipe.id, {
      plan,
      autolyseStart,
      autolyseEnd,
      mixEnd: null,
      bulkStart: null,
      bulkEnd: null,
      readyForShapeAt: null,
      readyForBakeAt: null,
      bakedAt: null
    });
  });

  const mixQueue = Array.from(productStates.values()).sort((a, b) => {
    if (a.autolyseEnd !== b.autolyseEnd) return a.autolyseEnd - b.autolyseEnd;
    return b.plan.bulkMin - a.plan.bulkMin;
  });

  mixQueue.forEach((state) => {
    const plan = state.plan;
    const process = plan.recipe.process;

    const mixTask = scheduleMixerTask({
      plan,
      name: "Mix dough",
      earliestStart: state.autolyseEnd,
      duration: Number(process.mixMin) || 0,
      note: formatWeight(plan.doughWeight, "dough")
    });

    state.mixEnd = mixTask.end;
    state.bulkStart = mixTask.end;
    state.bulkEnd = state.bulkStart + plan.bulkMin;

    schedulePassiveTask({
      plan,
      name: "Bulk fermentation",
      start: state.bulkStart,
      duration: plan.bulkMin,
      note: ""
    });

    state.readyForShapeAt = state.bulkEnd;
  });

  const foldTasks = [];

  Array.from(productStates.values()).forEach((state) => {
    const plan = state.plan;
    const process = plan.recipe.process;
    const foldCount = Number(process.foldCount) || 0;
    const foldInterval = Number(process.foldIntervalMin) || 30;
    const foldDuration = Number(process.foldDurationMin) || 5;

    for (let i = 1; i <= foldCount; i++) {
      const targetStart = state.bulkStart + i * foldInterval;

      foldTasks.push({
        plan,
        name: `Fold ${i}`,
        earliestStart: targetStart,
        duration: foldDuration
      });
    }
  });

  foldTasks
    .sort((a, b) => {
      if (a.earliestStart !== b.earliestStart) {
        return a.earliestStart - b.earliestStart;
      }

      return a.plan.recipe.name.localeCompare(b.plan.recipe.name);
    })
    .forEach((fold) => {
      scheduleBakerTask({
        plan: fold.plan,
        name: fold.name,
        earliestStart: fold.earliestStart,
        duration: fold.duration,
        note: ""
      });
    });

  const shapingQueue = Array.from(productStates.values()).sort(
    (a, b) => a.readyForShapeAt - b.readyForShapeAt
  );

  shapingQueue.forEach((state) => {
    const plan = state.plan;
    const process = plan.recipe.process;

    let current = state.readyForShapeAt;

    const divideAndPreshapeMin = Number(process.divideAndPreshapeMin) || 0;

    if (divideAndPreshapeMin > 0) {
      const divideTask = scheduleBakerTask({
        plan,
        name: "Divide and pre-shape",
        earliestStart: current,
        duration: divideAndPreshapeMin,
        note: ""
      });

      current = divideTask.end;
    }

    const benchRestMin = Number(process.benchRestMin) || 0;

    if (benchRestMin > 0) {
      schedulePassiveTask({
        plan,
        name: "Bench rest",
        start: current,
        duration: benchRestMin,
        note: ""
      });

      current += benchRestMin;
    }

    const finalShapeMin = Number(process.finalShapeMin) || 0;

    if (finalShapeMin > 0) {
      const shapeTask = scheduleBakerTask({
        plan,
        name: "Final shape",
        earliestStart: current,
        duration: finalShapeMin,
        note: ""
      });

      current = shapeTask.end;
    }

    schedulePassiveTask({
      plan,
      name: "Final proof",
      start: current,
      duration: plan.finalProofMin,
      note: ""
    });

    state.readyForBakeAt = current + plan.finalProofMin;
  });

  const bakeQueue = Array.from(productStates.values()).sort(
    (a, b) => a.readyForBakeAt - b.readyForBakeAt
  );

  bakeQueue.forEach((state) => {
    const plan = state.plan;
    let current = state.readyForBakeAt;

    for (let load = 1; load <= plan.ovenLoads; load++) {
      const bakeTask = scheduleOvenTask({
        plan,
        name: plan.ovenLoads > 1 ? `Bake load ${load}` : "Bake",
        earliestStart: current,
        duration: plan.bakeMin,
        note: `${Math.round(plan.bakeTempF)}°F`
      });

      current = bakeTask.end;
    }

    state.bakedAt = current;

    schedulePassiveTask({
      plan,
      name: "Cool",
      start: current,
      duration: Number(plan.recipe.process.coolMin) || 0,
      note: ""
    });
  });

  return schedule.sort((a, b) => {
    if (a.start !== b.start) return a.start - b.start;

    const resourceOrder = {
      baker: 1,
      mixer: 2,
      passive: 3,
      oven: 4
    };

    return (resourceOrder[a.resource] || 99) - (resourceOrder[b.resource] || 99);
  });
}

function ProgressBar({ label, value, max, suffix = "", warningAt = 90 }) {
  const pct = max > 0 ? Math.min(100, (value / max) * 100) : 0;
  const isWarn = pct >= warningAt;

  return (
    <div className="progress-wrap">
      <div className="progress-head">
        <span>{label}</span>
        <span className={isWarn ? "warning-text" : "muted"}>
          {round(value)} / {round(max)}
          {suffix}
        </span>
      </div>
      <div className="progress-track">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.7 }}
          className={isWarn ? "progress-fill warning" : "progress-fill"}
        />
      </div>
    </div>
  );
}

function NumberInput({ label, value, onChange, suffix, min = 0, step = "any" }) {
  return (
    <label className="field">
      <span>{label}</span>
      <div className="input-wrap">
        <input
          type="number"
          min={min}
          step={step}
          value={value}
          onChange={(e) => onChange(e.target.value)}
        />
        {suffix && <span className="suffix">{suffix}</span>}
      </div>
    </label>
  );
}

function TextInput({ label, value, onChange, placeholder = "" }) {
  return (
    <label className="field">
      <span>{label}</span>
      <input
        className="text-field"
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
      />
    </label>
  );
}

export default function BakingPlanner() {
  const { user } = useAuth();
  const { isDirty: hasUnsavedChanges, markUnsaved, markSaved } = useUnsavedChanges();

  const [activeTab, setActiveTab] = useState("recipes");
  const [cloudLoading, setCloudLoading] = useState(false);
  const [cloudStatus, setCloudStatus] = useState("Local only");

  const [recipes, setRecipes] = useState(() =>
    loadFromStorage("bakingPlannerRecipes", []).map(normalizeRecipe)
  );
  const [settings, setSettings] = useState(() =>
    loadFromStorage("bakingPlannerSettings", defaultSettings)
  );
  const [env, setEnv] = useState(() =>
    loadFromStorage("bakingPlannerEnv", { tempF: 74, humidityPct: 52 })
  );
  const [productionDate, setProductionDate] = useState(() =>
    loadFromStorage("bakingPlannerProductionDate", "")
  );
  const [productionItems, setProductionItems] = useState(() =>
    loadFromStorage("bakingPlannerProductionItems", [])
  );
  const [pantryItems, setPantryItems] = useState(() =>
    loadFromStorage("bakingPlannerPantryItems", []).map(normalizePantryItem)
  );
  const [pantryDraft, setPantryDraft] = useState(blankPantryItem);
  const [quickRecipeIngredient, setQuickRecipeIngredient] = useState(blankPantryItem);
  const [showQuickRecipeIngredient, setShowQuickRecipeIngredient] = useState(false);
  const [activePantryEditId, setActivePantryEditId] = useState("");
  const [selectedRecipeId, setSelectedRecipeId] = useState(
    recipes[0]?.id || ""
  );
  const [lastSavedAt, setLastSavedAt] = useState("");

  function markBakingDirty() {
    markUnsaved({
      source: "Baking Planner",
      onSave: savePlannerData
    });
  }

  useEffect(() => {
    async function loadCloudData() {
      if (!user) {
        setCloudStatus("Local only");
        return;
      }

      setCloudLoading(true);
      setCloudStatus("Loading cloud data...");

      try {
        const ref = doc(db, "users", user.uid, "bakingPlanner", "main");
        const snapshot = await getDoc(ref);

        if (snapshot.exists()) {
          const data = snapshot.data();

          if (Array.isArray(data.recipes)) {
            const cloudRecipes = data.recipes.map(normalizeRecipe);
            setRecipes(cloudRecipes);
            setSelectedRecipeId(cloudRecipes[0]?.id || "");
          } else {
            setRecipes([]);
            setSelectedRecipeId("");
          }

          if (data.settings) setSettings({ ...defaultSettings, ...data.settings });
          if (data.env) setEnv(data.env);
          setProductionDate(data.productionDate || "");
          if (Array.isArray(data.productionItems)) {
            setProductionItems(data.productionItems);
          } else {
            setProductionItems([]);
          }

          if (Array.isArray(data.pantryItems)) {
            setPantryItems(data.pantryItems.map(normalizePantryItem));
          } else {
            setPantryItems([]);
          }

          setCloudStatus("Cloud data loaded");
        } else {
          setRecipes([]);
          setSelectedRecipeId("");
          setProductionItems([]);
          setPantryItems([]);
          setCloudStatus("No cloud save yet");
        }
      } catch (error) {
        console.error(error);
        setCloudStatus("Cloud load failed");
      } finally {
        setCloudLoading(false);
      }
    }

    loadCloudData();
  }, [user]);

  const productionRecipes = useMemo(() => {
    return productionItems
      .map((item) => {
        const recipe = recipes.find((r) => r.id === item.recipeId);
        if (!recipe) return null;
        return { recipe, quantity: Number(item.quantity) || 0 };
      })
      .filter(Boolean);
  }, [productionItems, recipes]);

  const plans = useMemo(() => {
    return productionRecipes
      .map(({ recipe, quantity }) =>
        calculateRecipePlan(recipe, quantity, env, settings)
      )
      .filter((plan) => plan.quantity > 0);
  }, [productionRecipes, env, settings]);

  const productionSchedule = useMemo(() => {
    return buildProductionSchedule(plans, settings);
  }, [plans, settings]);

  const totals = useMemo(() => {
    const flourMap = {};
    const otherMap = {};
    let doughWeight = 0;
    let starterG = 0;
    let waterG = 0;
    let saltG = 0;
    let units = 0;
    let maxProcess = 0;

    plans.forEach((plan) => {
      doughWeight += plan.doughWeight;
      starterG += plan.starterG;
      waterG += plan.waterG;
      saltG += plan.saltG;
      units += plan.quantity;
      maxProcess = Math.max(maxProcess, plan.totalProcessMin);

      plan.flourBreakdown.forEach((f) => {
        flourMap[f.name] = (flourMap[f.name] || 0) + f.grams;
      });

      plan.otherBreakdown.forEach((item) => {
        otherMap[item.name] = (otherMap[item.name] || 0) + item.grams;
      });
    });

    const ingredientBuffer = 1 + settings.ingredientBufferPct / 100;

    return {
      doughWeight,
      starterG,
      waterG,
      saltG,
      units,
      maxProcess,
      flourMap,
      otherMap,
      bufferedStarterG: starterG * (1 + settings.levainBufferPct / 100),
      bufferedFlourMap: Object.fromEntries(
        Object.entries(flourMap).map(([k, v]) => [k, v * ingredientBuffer])
      ),
      bufferedWaterG: waterG * ingredientBuffer,
      bufferedSaltG: saltG * ingredientBuffer
    };
  }, [plans, settings]);

  const levain = useMemo(() => {
    const totalLevain = totals.bufferedStarterG;
    const preset = starterFeedingPresets[settings.starterFeedingPreset];
    const seedParts = Math.max(0, Number(preset?.seed ?? settings.starterSeedParts) || 0);
    const flourParts = Math.max(0, Number(preset?.flour ?? settings.starterFlourParts) || 0);
    const waterParts = Math.max(0, Number(preset?.water ?? settings.starterWaterParts) || 0);
    const totalParts = seedParts + flourParts + waterParts;

    if (totalParts <= 0 || totalLevain <= 0) {
      return {
        totalLevain,
        flour: 0,
        water: 0,
        seedStarter: 0,
        seedParts,
        flourParts,
        waterParts,
        ratioLabel: `${seedParts}:${flourParts}:${waterParts}`
      };
    }

    const seedStarter = (totalLevain * seedParts) / totalParts;
    const flour = (totalLevain * flourParts) / totalParts;
    const water = (totalLevain * waterParts) / totalParts;

    return {
      totalLevain,
      flour,
      water,
      seedStarter,
      seedParts,
      flourParts,
      waterParts,
      ratioLabel: `${seedParts}:${flourParts}:${waterParts}`
    };
  }, [
    totals.bufferedStarterG,
    settings.starterFeedingPreset,
    settings.starterSeedParts,
    settings.starterFlourParts,
    settings.starterWaterParts
  ]);

  const warnings = useMemo(() => {
    const list = [];
    const totalOvenLoads = plans.reduce((sum, p) => sum + p.ovenLoads, 0);
    const maxUnitsAtOnce = plans.reduce((sum, p) => sum + p.quantity, 0);
    const maxBatch = plans.some((p) => p.batchesByMixer > 1);

    if (maxBatch) {
      list.push(
        "One or more products exceed mixer or recipe batch capacity and need split batches."
      );
    }

    if (maxUnitsAtOnce > settings.proofingCapacityUnits) {
      list.push(
        "Planned unit count exceeds saved proofing capacity. Stagger production or add proofing space."
      );
    }

    if (totalOvenLoads > 6) {
      list.push(
        "Oven schedule may be long. Consider staggering mix times or reducing same-day variety count."
      );
    }

    if (env.tempF >= settings.baselineTempF + 6) {
      list.push("Room is warm compared with baseline. Watch bulk fermentation closely.");
    }

    if (env.tempF <= settings.baselineTempF - 6) {
      list.push("Room is cool compared with baseline. Expect slower fermentation.");
    }

    return list;
  }, [plans, settings, env]);

  const selectedRecipe =
    recipes.find((r) => r.id === selectedRecipeId) || recipes[0] || null;

  const activePantryEditItem =
    pantryItems.find((item) => item.id === activePantryEditId) || null;

  function getRecipeIngredientPantryId(ingredient) {
    if (ingredient?.pantryItemId) return ingredient.pantryItemId;

    const match = findPantryMatch(ingredient?.name, pantryItems);
    return match?.id || "";
  }

  const availableRecipesForCycle = useMemo(() => {
    const usedIds = new Set(productionItems.map((item) => item.recipeId));
    return recipes.filter((recipe) => !usedIds.has(recipe.id));
  }, [recipes, productionItems]);

  function setBakingPlannerMode(mode) {
    markBakingDirty();
    setSettings((previous) => {
      const next = {
        ...previous,
        bakingPlannerMode: mode
      };

      saveToStorage("bakingPlannerSettings", next);
      return next;
    });
  }

  const isAdvancedMode = settings.bakingPlannerMode === "advanced";
  const trimmedStarterName = String(settings.starterName || "").trim();
  const shouldUseStarterName = Boolean(
    trimmedStarterName && settings.useStarterNameInLabels
  );
  const starterDisplayName = shouldUseStarterName
    ? trimmedStarterName
    : "Preferment";
  const starterRecipeLabel = shouldUseStarterName
    ? trimmedStarterName
    : "Starter / Levain";
  const starterNeededLabel = shouldUseStarterName
    ? `${trimmedStarterName} Needed`
    : "Preferment Needed";
  const starterBufferSub = shouldUseStarterName
    ? `includes ${settings.levainBufferPct}% ${trimmedStarterName} buffer`
    : `includes ${settings.levainBufferPct}% preferment buffer`;
  const starterBuilderTitle = shouldUseStarterName
    ? `${trimmedStarterName} Builder`
    : "Starter / Preferment Builder";
  const starterBuilderDescription = shouldUseStarterName
    ? `This uses the total ${trimmedStarterName} required across the active bake plan and adds your saved buffer.`
    : "This uses the total starter or preferment required across the active bake plan and adds your saved buffer.";
  const starterHydrationLabel = shouldUseStarterName
    ? `${trimmedStarterName} Hydration`
    : "Starter Hydration";
  const starterBufferLabel = shouldUseStarterName
    ? `${trimmedStarterName} Buffer`
    : "Preferment Buffer";
  const matureStarterPullLabel = shouldUseStarterName
    ? `Mature ${trimmedStarterName}`
    : "Mature Starter / Preferment";
  const starterSeedLabel = shouldUseStarterName
    ? `Seed ${trimmedStarterName} Estimate`
    : "Seed Starter / Preferment Estimate";
  const starterFlourSub = shouldUseStarterName
    ? `for ${trimmedStarterName} at ${settings.starterHydrationPct}% hydration`
    : `${settings.starterHydrationPct}% hydration`;
  const starterWaterSub = shouldUseStarterName
    ? `for ${trimmedStarterName}`
    : "for preferment build";
  const starterFeedRatioLabel = `Feeding ratio ${levain.ratioLabel || "1:2:2"}`;
  const starterFlourLabel = shouldUseStarterName
    ? `Flour to Feed ${trimmedStarterName}`
    : "Flour to Feed";
  const starterWaterLabel = shouldUseStarterName
    ? `Water to Feed ${trimmedStarterName}`
    : "Water to Feed";

  const ingredientPullRows = useMemo(() => {
    const rows = [];
    const ingredientBuffer = 1 + settings.ingredientBufferPct / 100;

    Object.entries(totals.bufferedFlourMap).forEach(([name, grams]) => {
      rows.push(buildIngredientPullRow(name, grams, pantryItems));
    });

    rows.push(
      buildIngredientPullRow("Water", totals.bufferedWaterG, pantryItems, {
        isNonCosted: true
      })
    );

    const bassinageWaterG = plans.reduce(
      (sum, plan) => sum + (plan.bassinageWaterG || 0),
      0
    ) * ingredientBuffer;

    if (bassinageWaterG > 0) {
      rows.push(
        buildIngredientPullRow("Bassinage Water", bassinageWaterG, pantryItems, {
          isNonCosted: true
        })
      );
    }

    rows.push(
      buildIngredientPullRow(
        matureStarterPullLabel,
        totals.bufferedStarterG,
        pantryItems,
        { isNonCosted: true }
      )
    );

    rows.push(buildIngredientPullRow("Salt", totals.bufferedSaltG, pantryItems));

    Object.entries(totals.otherMap).forEach(([name, grams]) => {
      rows.push(buildIngredientPullRow(name, grams * ingredientBuffer, pantryItems));
    });

    return rows.filter((row) => row.grams > 0);
  }, [
    totals.bufferedFlourMap,
    totals.bufferedWaterG,
    totals.bufferedStarterG,
    totals.bufferedSaltG,
    totals.otherMap,
    plans,
    settings.ingredientBufferPct,
    pantryItems,
    matureStarterPullLabel
  ]);

  const ingredientPullTotalCost = ingredientPullRows.reduce(
    (sum, row) => sum + (row.estimatedCost || 0),
    0
  );

  const inventoryAlerts = ingredientPullRows
    .filter((row) => row.pantryItem?.trackInventory)
    .map((row) => ({
      row,
      inventory: getInventoryStatus(row)
    }))
    .filter(({ inventory }) => inventory.status === "short" || inventory.status === "low");

  const lowStockPantryItems = pantryItems
    .filter((item) => item.trackInventory)
    .filter((item) => {
      const onHand = Number(item.quantityOnHandGrams) || 0;
      if (onHand <= 0) return false;

      if (item.lowStockAlertMode === "package") {
        const threshold = Number(item.lowStockPackageThreshold) || 0;
        return threshold > 0 && getRemainingPackageCount(item) <= threshold;
      }

      return (
        Number(item.lowStockThresholdGrams) > 0 &&
        onHand <= Number(item.lowStockThresholdGrams)
      );
    });

  const planCostRows = useMemo(() => {
    return plans.map((plan) => ({
      plan,
      cost: calculatePlanIngredientCost(
        plan,
        pantryItems,
        matureStarterPullLabel,
        false,
        settings.ingredientBufferPct
      )
    }));
  }, [plans, pantryItems, matureStarterPullLabel, settings.ingredientBufferPct]);

  const bakeCycleIngredientCost = planCostRows.reduce(
    (sum, row) => sum + (row.cost.totalCost || 0),
    0
  );

  const bakeCycleMatchedIngredientCount = planCostRows.reduce(
    (sum, row) => sum + row.cost.matchedRows,
    0
  );

  const bakeCycleIngredientCount = planCostRows.reduce(
    (sum, row) => sum + row.cost.totalRows,
    0
  );

  const averageIngredientCostPerUnit =
    totals.units > 0 ? bakeCycleIngredientCost / totals.units : 0;

  const selectedRecipePreviewPlan = useMemo(() => {
    if (!selectedRecipe) return null;

    return calculateRecipePlan(selectedRecipe, 1, env, settings);
  }, [selectedRecipe, env, settings]);

  const selectedRecipeCostPreview = useMemo(() => {
    if (!selectedRecipePreviewPlan) return null;

    return calculatePlanIngredientCost(
      selectedRecipePreviewPlan,
      pantryItems,
      matureStarterPullLabel,
      false,
      settings.ingredientBufferPct
    );
  }, [selectedRecipePreviewPlan, pantryItems, matureStarterPullLabel, settings.ingredientBufferPct]);

  function updateSettingField(field, value) {
    markBakingDirty();
    setSettings((previous) => ({
      ...previous,
      [field]: value
    }));
  }

  function updateStarterFeedingPreset(value) {
    markBakingDirty();
    const preset = starterFeedingPresets[value];

    setSettings((previous) => ({
      ...previous,
      starterFeedingPreset: value,
      starterSeedParts: preset ? preset.seed : previous.starterSeedParts,
      starterFlourParts: preset ? preset.flour : previous.starterFlourParts,
      starterWaterParts: preset ? preset.water : previous.starterWaterParts
    }));
  }

  async function savePlannerData() {
    const normalizedRecipes = recipes.map(normalizeRecipe);

    saveToStorage("bakingPlannerRecipes", normalizedRecipes);
    saveToStorage("bakingPlannerSettings", settings);
    saveToStorage("bakingPlannerEnv", env);
    saveToStorage("bakingPlannerProductionDate", productionItems.length ? productionDate : "");
    saveToStorage("bakingPlannerProductionItems", productionItems);
    saveToStorage("bakingPlannerPantryItems", pantryItems.map(normalizePantryItem));

    const savedTime = new Date().toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit"
    });

    setLastSavedAt(savedTime);

    if (!user) {
      setCloudStatus("Saved locally");
      markSaved();
      return;
    }

    setCloudLoading(true);
    setCloudStatus("Saving to cloud...");

    try {
      const ref = doc(db, "users", user.uid, "bakingPlanner", "main");

      await setDoc(
        ref,
        {
          recipes: normalizedRecipes,
          settings,
          env,
          productionDate: productionItems.length ? productionDate : "",
          productionItems,
          pantryItems: pantryItems.map(normalizePantryItem),
          updatedAt: serverTimestamp()
        },
        { merge: true }
      );

      setCloudStatus(`Cloud saved at ${savedTime}`);
      markSaved();
    } catch (error) {
      console.error(error);
      setCloudStatus("Cloud save failed");
    } finally {
      setCloudLoading(false);
    }
  }

  function updateRecipeIngredientMode(mode) {
    markBakingDirty();
    if (!selectedRecipe) return;

    const nextMode = mode === "weight" ? "weight" : "percentage";
    const currentMode = getRecipeIngredientMode(selectedRecipe);

    if (currentMode === nextMode) return;

    const previewPlan = calculateRecipePlan(selectedRecipe, 1, env, settings);
    const flourByName = new Map(
      previewPlan.flourBreakdown.map((flour) => [flour.name, flour])
    );
    const otherByName = new Map(
      previewPlan.otherBreakdown.map((ingredient) => [ingredient.name, ingredient])
    );

    setRecipes((prev) =>
      prev.map((recipe) => {
        if (recipe.id !== selectedRecipe.id) return recipe;

        const normalized = normalizeRecipe(recipe);

        if (nextMode === "weight") {
          return {
            ...normalized,
            ingredientMode: "weight",
            hydrationWeightG: roundRecipeValue(previewPlan.waterG, 1),
            initialHydrationWeightG: roundRecipeValue(previewPlan.initialWaterG, 1),
            bassinageWeightG: roundRecipeValue(previewPlan.bassinageWaterG, 1),
            starterWeightG: roundRecipeValue(previewPlan.starterG, 1),
            saltWeightG: roundRecipeValue(previewPlan.saltG, 1),
            flourTypes: normalized.flourTypes.map((flour) => {
              const preview = flourByName.get(flour.name);

              return {
                ...flour,
                grams: roundRecipeValue(preview?.grams || 0, 1)
              };
            }),
            otherIngredients: normalized.otherIngredients.map((ingredient) => {
              const preview = otherByName.get(ingredient.name);

              return {
                ...ingredient,
                grams: roundRecipeValue(preview?.grams || 0, 1)
              };
            })
          };
        }

        return {
          ...normalized,
          ingredientMode: "percentage",
          hydrationPct: roundRecipeValue(previewPlan.adjustedHydrationPct || 0, 2),
          initialHydrationPct: roundRecipeValue(previewPlan.adjustedInitialHydrationPct || 0, 2),
          bassinagePct: roundRecipeValue(previewPlan.adjustedBassinagePct || 0, 2),
          starterPct: roundRecipeValue(previewPlan.starterPct || 0, 2),
          saltPct: roundRecipeValue(previewPlan.saltPct || 0, 2),
          flourTypes: normalized.flourTypes.map((flour) => {
            const preview = flourByName.get(flour.name);

            return {
              ...flour,
              pct: roundRecipeValue(preview?.pct || 0, 2)
            };
          }),
          otherIngredients: normalized.otherIngredients.map((ingredient) => {
            const preview = otherByName.get(ingredient.name);

            return {
              ...ingredient,
              pct: roundRecipeValue(preview?.pct || 0, 2)
            };
          })
        };
      })
    );
  }

  function updateRecipeField(field, value) {
    markBakingDirty();
    if (!selectedRecipe) return;

    setRecipes((prev) =>
      prev.map((r) => {
        if (r.id !== selectedRecipe.id) return r;

        const next = { ...r, [field]: value };

        if (field === "preBakeUnitWeight" || field === "bakeLossPct") {
          const preBake =
            field === "preBakeUnitWeight"
              ? Number(value) || 0
              : Number(next.preBakeUnitWeight) || 0;
          const bakeLoss =
            field === "bakeLossPct"
              ? Number(value) || 0
              : Number(next.bakeLossPct) || 0;

          next.finishedUnitWeight = preBake * (1 - bakeLoss / 100);
        }

        if (field === "initialHydrationPct" || field === "bassinagePct") {
          const initial =
            field === "initialHydrationPct"
              ? Number(value) || 0
              : Number(next.initialHydrationPct) || 0;
          const bassinage =
            field === "bassinagePct"
              ? Number(value) || 0
              : Number(next.bassinagePct) || 0;

          next.hydrationPct = initial + bassinage;
        }

        if (field === "hydrationPct") {
          next.initialHydrationPct = Number(value) || 0;
          next.bassinagePct = 0;
          next.useBassinage = false;
        }

        return next;
      })
    );
  }

  function updateRecipeProductDirectoryField(field, value) {
    markBakingDirty();
    if (!selectedRecipe) return;

    setRecipes((prev) =>
      prev.map((recipe) =>
        recipe.id === selectedRecipe.id
          ? {
              ...recipe,
              productDirectory: {
                ...(recipe.productDirectory || {}),
                [field]: value
              }
            }
          : recipe
      )
    );
  }

  function toggleRecipeProductDirectory(value) {
    markBakingDirty();
    if (!selectedRecipe) return;

    setRecipes((prev) =>
      prev.map((recipe) => {
        if (recipe.id !== selectedRecipe.id) return recipe;

        return {
          ...recipe,
          listInProductDirectory: value,
          productDirectory: {
            productName: recipe.productDirectory?.productName || recipe.name || "",
            sellingUnit: recipe.productDirectory?.sellingUnit || recipe.unitsLabel || "unit",
            unitsPerBatch:
              recipe.productDirectory?.unitsPerBatch !== undefined
                ? Number(recipe.productDirectory.unitsPerBatch) || 0
                : Number(recipe.ovenCapacityUnits) || 1,
            laborHoursPerBatch:
              recipe.productDirectory?.laborHoursPerBatch !== undefined
                ? Number(recipe.productDirectory.laborHoursPerBatch) || 0
                : 0,
            notes: recipe.productDirectory?.notes || ""
          }
        };
      })
    );
  }

  function updateRecipeProcess(field, value) {
    markBakingDirty();
    setRecipes((prev) =>
      prev.map((r) =>
        r.id === selectedRecipe.id
          ? {
              ...r,
              process: {
                ...normalizeRecipe(r).process,
                [field]: Number(value) || 0
              }
            }
          : r
      )
    );
  }

  function updateFlourType(index, field, value) {
    markBakingDirty();
    setRecipes((prev) =>
      prev.map((recipe) => {
        if (recipe.id !== selectedRecipe.id) return recipe;

        const flourTypes = recipe.flourTypes.map((item, itemIndex) =>
          itemIndex === index
            ? {
                ...item,
                [field]: field === "pct" || field === "grams" ? Number(value) : value
              }
            : item
        );

        return { ...recipe, flourTypes };
      })
    );
  }

  function addFlourType() {
    markBakingDirty();
    setRecipes((prev) =>
      prev.map((recipe) =>
        recipe.id === selectedRecipe.id
          ? {
              ...recipe,
              flourTypes: [...recipe.flourTypes, { name: "New Flour", pct: 0, grams: 0 }]
            }
          : recipe
      )
    );
  }

  function deleteFlourType(index) {
    markBakingDirty();
    setRecipes((prev) =>
      prev.map((recipe) => {
        if (recipe.id !== selectedRecipe.id) return recipe;

        const flourTypes = recipe.flourTypes.filter((_, itemIndex) => itemIndex !== index);

        return {
          ...recipe,
          flourTypes: flourTypes.length
            ? flourTypes
            : [{ name: "Bread Flour", pct: 100, grams: 0 }]
        };
      })
    );
  }

  function updateOtherIngredient(index, field, value) {
    markBakingDirty();
    if (!selectedRecipe) return;

    setRecipes((prev) =>
      prev.map((recipe) => {
        if (recipe.id !== selectedRecipe.id) return recipe;

        const otherIngredients = recipe.otherIngredients.map((item, itemIndex) => {
          if (itemIndex !== index) return item;

          if (field === "pantryItemId") {
            const pantryItem = pantryItems.find((saved) => saved.id === value);

            return {
              ...item,
              pantryItemId: value,
              name: pantryItem?.name || item.name || ""
            };
          }

          return {
            ...item,
            [field]: field === "pct" || field === "grams" ? Number(value) : value
          };
        });

        return { ...recipe, otherIngredients };
      })
    );
  }

  function addOtherIngredient() {
    markBakingDirty();
    if (!selectedRecipe) return;

    const firstPantryItem = pantryItems[0] || null;

    setRecipes((prev) =>
      prev.map((recipe) =>
        recipe.id === selectedRecipe.id
          ? {
              ...recipe,
              otherIngredients: [
                ...recipe.otherIngredients,
                {
                  pantryItemId: firstPantryItem?.id || "",
                  name: firstPantryItem?.name || "",
                  pct: 1,
                  grams: 0
                }
              ]
            }
          : recipe
      )
    );
  }

  function updateQuickRecipeIngredient(field, value) {
    setQuickRecipeIngredient((previous) => ({
      ...previous,
      [field]: value
    }));
  }

  function quickAddRecipeIngredient() {
    const cleanName = String(quickRecipeIngredient.name || "").trim();

    if (!cleanName || !selectedRecipe) return;

    markBakingDirty();

    const item = normalizePantryItem({
      ...quickRecipeIngredient,
      id: makeId("pantry"),
      name: cleanName,
      source: String(quickRecipeIngredient.source || "").trim(),
      notes: String(quickRecipeIngredient.notes || "").trim()
    });

    setPantryItems((previous) =>
      [...previous, item].sort((a, b) => a.name.localeCompare(b.name))
    );

    setRecipes((prev) =>
      prev.map((recipe) =>
        recipe.id === selectedRecipe.id
          ? {
              ...recipe,
              otherIngredients: [
                ...recipe.otherIngredients,
                {
                  pantryItemId: item.id,
                  name: item.name,
                  pct: 1,
                  grams: 0
                }
              ]
            }
          : recipe
      )
    );

    setQuickRecipeIngredient(blankPantryItem);
    setShowQuickRecipeIngredient(false);
  }

  function deleteOtherIngredient(index) {
    markBakingDirty();
    setRecipes((prev) =>
      prev.map((recipe) =>
        recipe.id === selectedRecipe.id
          ? {
              ...recipe,
              otherIngredients: recipe.otherIngredients.filter(
                (_, itemIndex) => itemIndex !== index
              )
            }
          : recipe
      )
    );
  }

  function addRecipeToCycle(recipeId) {
    markBakingDirty();
    if (!recipeId) return;

    setProductionItems((prev) => {
      if (prev.some((item) => item.recipeId === recipeId)) return prev;
      return [...prev, { recipeId, quantity: 0 }];
    });
  }

  function updateCycleQuantity(recipeId, quantity) {
    markBakingDirty();
    setProductionItems((prev) =>
      prev.map((item) =>
        item.recipeId === recipeId
          ? { ...item, quantity: Number(quantity) }
          : item
      )
    );
  }

  function removeRecipeFromCycle(recipeId) {
    markBakingDirty();
    setProductionItems((prev) => prev.filter((item) => item.recipeId !== recipeId));
  }

  function clearCycle() {
    markBakingDirty();
    setProductionItems([]);
  }

  function addRecipe() {
    markBakingDirty();
    const id = `recipe-${Date.now()}`;

    const base = normalizeRecipe({
      id,
      name: "New Recipe",
      category: "Custom",
      unitsLabel: "units",
      vesselType: "Tray / Pan",
      preBakeUnitWeight: 560,
      finishedUnitWeight: 504,
      bakeLossPct: 10,
      mixingMethod: "straight",
      useBassinage: false,
      initialHydrationPct: 70,
      bassinagePct: 0,
      batchMaxDoughG: settings.mixerCapacityG || 7000,
      ovenCapacityUnits: 12,
      flourTypes: [{ name: "Bread Flour", pct: 100, grams: 0 }],
      hydrationPct: 70,
      hydrationWeightG: 0,
      initialHydrationWeightG: 0,
      bassinageWeightG: 0,
      starterPct: 20,
      starterWeightG: 0,
      starterHydrationPct: settings.starterHydrationPct || 100,
      ingredientMode: "percentage",
      saltPct: 2,
      saltWeightG: 0,
      otherIngredients: [],
      process: {
        autolyseMin: 0,
        mixMin: 10,
        bulkMin: 240,
        foldCount: 2,
        foldIntervalMin: 30,
        foldDurationMin: 5,
        divideAndPreshapeMin: 10,
        benchRestMin: 20,
        finalShapeMin: 10,
        finalProofMin: 90,
        bakeTempF: 425,
        bakeMin: 30,
        coolMin: 60
      }
    });

    setRecipes((prev) => [...prev, base]);
    setSelectedRecipeId(id);
    setActiveTab("recipes");
  }

  function duplicateRecipe() {
    markBakingDirty();
    const id = `${selectedRecipe.id}-copy-${Date.now()}`;
    setRecipes((prev) => [
      ...prev,
      normalizeRecipe({ ...selectedRecipe, id, name: `${selectedRecipe.name} Copy` })
    ]);
    setSelectedRecipeId(id);
  }

  function deleteRecipe(id) {
    markBakingDirty();
    const remainingRecipes = recipes.filter((r) => r.id !== id);

    setRecipes(remainingRecipes);
    setProductionItems((prev) => prev.filter((item) => item.recipeId !== id));
    setSelectedRecipeId(remainingRecipes[0]?.id || "");
  }

  function updatePantryDraft(field, value) {
    setPantryDraft((previous) => ({
      ...previous,
      [field]: value
    }));
  }

  function addPantryItem() {
    const cleanName = String(pantryDraft.name || "").trim();

    if (!cleanName) return;

    markBakingDirty();

    const item = normalizePantryItem({
      ...pantryDraft,
      id: makeId("pantry"),
      name: cleanName,
      source: String(pantryDraft.source || "").trim(),
      notes: String(pantryDraft.notes || "").trim()
    });

    setPantryItems((previous) =>
      [...previous, item].sort((a, b) => a.name.localeCompare(b.name))
    );
    setPantryDraft(blankPantryItem);
  }

  function updatePantryItem(itemId, field, value) {
    markBakingDirty();

    setPantryItems((previous) =>
      previous.map((item) =>
        item.id === itemId
          ? normalizePantryItem({
              ...item,
              [field]: value
            })
          : item
      )
    );
  }

  function deletePantryItem(itemId) {
    markBakingDirty();
    setPantryItems((previous) => previous.filter((item) => item.id !== itemId));

    if (activePantryEditId === itemId) {
      setActivePantryEditId("");
    }
  }

  function openPantryEditorFromPull(row) {
    if (row?.pantryItem?.id) {
      setActivePantryEditId(row.pantryItem.id);
      return;
    }

    if (!row?.isNonCosted) {
      setActiveTab("pantry");
      setPantryDraft((previous) => ({
        ...previous,
        name: row?.name || ""
      }));
    }
  }

  const tabButton = (id, label, Icon) => (
    <button
      onClick={() => setActiveTab(id)}
      className={activeTab === id ? "tab active" : "tab"}
      type="button"
    >
      <Icon size={18} /> {label}
    </button>
  );

  return (
    <div className="bakingPlanner" onChangeCapture={markBakingDirty}>
      {!cloudLoading && !settings.bakingPlannerMode ? (
        <div className="bakingModeOverlay" role="dialog" aria-modal="true">
          <div className="bakingModeModal">
            <p className="eyebrow">Baking Planner Setup</p>
            <h2>Choose your baking workflow.</h2>
            <p>
              Pick the setup that matches how you bake. You can change this later
              in Settings.
            </p>

            <div className="bakingModeGrid">
              <button
                type="button"
                className="bakingModeCard"
                onClick={() => setBakingPlannerMode("basic")}
              >
                <strong>Basic</strong>
                <span>
                  Best for small operations, simple loaves, cookies, muffins, and
                  straightforward production planning.
                </span>
                <small>
                  Shows core recipe, dough weight, hydration, starter, salt, timing,
                  and bake-day planning fields.
                </small>
              </button>

              <button
                type="button"
                className="bakingModeCard featured"
                onClick={() => setBakingPlannerMode("advanced")}
              >
                <strong>Advanced / Professional</strong>
                <span>
                  Best for bakers who use detailed fermentation and mixing methods.
                </span>
                <small>
                  Adds straight mix, autolyse, fermentolyse, saltolyse, bassinage,
                  initial hydration, and bassinage water fields.
                </small>
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {activePantryEditItem ? (
        <div className="pantryEditOverlay" role="dialog" aria-modal="true">
          <div className="pantryEditModal">
            <div className="section-head">
              <div>
                <p className="eyebrow">Pantry Item</p>
                <h2>Edit {activePantryEditItem.name}</h2>
                <p className="muted small">
                  Changes here update the Pantry and the Ingredient Pull List.
                </p>
              </div>
              <button
                className="iconButton"
                type="button"
                onClick={() => setActivePantryEditId("")}
                aria-label="Close pantry editor"
              >
                ×
              </button>
            </div>

            <div className="grid two">
              <TextInput
                label="Ingredient Name"
                value={activePantryEditItem.name}
                onChange={(value) =>
                  updatePantryItem(activePantryEditItem.id, "name", value)
                }
              />

              <label className="field">
                <span>Category</span>
                <select
                  className="text-field"
                  value={activePantryEditItem.category}
                  onChange={(event) =>
                    updatePantryItem(activePantryEditItem.id, "category", event.target.value)
                  }
                >
                  {pantryCategories.map((category) => (
                    <option key={category}>{category}</option>
                  ))}
                </select>
              </label>

              <TextInput
                label="Source / Vendor"
                value={activePantryEditItem.source}
                onChange={(value) =>
                  updatePantryItem(activePantryEditItem.id, "source", value)
                }
                placeholder="Restaurant Depot, Azure, Costco"
              />

              <NumberInput
                label="Package Size"
                value={activePantryEditItem.packageSize}
                onChange={(value) =>
                  updatePantryItem(activePantryEditItem.id, "packageSize", Number(value))
                }
                min={0}
              />

              <label className="field">
                <span>Package Unit</span>
                <select
                  className="text-field"
                  value={activePantryEditItem.packageUnit}
                  onChange={(event) =>
                    updatePantryItem(activePantryEditItem.id, "packageUnit", event.target.value)
                  }
                >
                  {pantryUnits.map((unit) => (
                    <option key={unit} value={unit}>
                      {unit}
                    </option>
                  ))}
                </select>
              </label>

              <NumberInput
                label="Package Cost"
                value={activePantryEditItem.packageCost}
                onChange={(value) =>
                  updatePantryItem(activePantryEditItem.id, "packageCost", Number(value))
                }
                min={0}
                step="0.01"
                suffix="$"
              />

              <label className="field">
                <span>Track Inventory</span>
                <select
                  className="text-field"
                  value={activePantryEditItem.trackInventory ? "yes" : "no"}
                  onChange={(event) =>
                    updatePantryItem(
                      activePantryEditItem.id,
                      "trackInventory",
                      event.target.value === "yes"
                    )
                  }
                >
                  <option value="no">No</option>
                  <option value="yes">Yes</option>
                </select>
              </label>

              <NumberInput
                label="Quantity On Hand"
                value={activePantryEditItem.quantityOnHand}
                onChange={(value) =>
                  updatePantryItem(activePantryEditItem.id, "quantityOnHand", Number(value))
                }
                min={0}
              />

              <label className="field">
                <span>On Hand Unit</span>
                <select
                  className="text-field"
                  value={activePantryEditItem.onHandUnit}
                  onChange={(event) =>
                    updatePantryItem(activePantryEditItem.id, "onHandUnit", event.target.value)
                  }
                >
                  {pantryUnits.map((unit) => (
                    <option key={unit} value={unit}>
                      {unit}
                    </option>
                  ))}
                </select>
              </label>

              <label className="field">
                <span>Low Stock Alert Mode</span>
                <select
                  className="text-field"
                  value={activePantryEditItem.lowStockAlertMode || "weight"}
                  onChange={(event) =>
                    updatePantryItem(activePantryEditItem.id, "lowStockAlertMode", event.target.value)
                  }
                >
                  <option value="weight">By remaining weight</option>
                  <option value="package">By remaining package count</option>
                </select>
              </label>

              {activePantryEditItem.lowStockAlertMode === "package" ? (
                <NumberInput
                  label="Alert Below Packages"
                  value={activePantryEditItem.lowStockPackageThreshold}
                  onChange={(value) =>
                    updatePantryItem(activePantryEditItem.id, "lowStockPackageThreshold", Number(value))
                  }
                  min={0}
                  step="0.25"
                />
              ) : (
                <NumberInput
                  label="Low Stock Alert"
                  value={activePantryEditItem.lowStockThreshold}
                  onChange={(value) =>
                    updatePantryItem(activePantryEditItem.id, "lowStockThreshold", Number(value))
                  }
                  min={0}
                />
              )}

              <label className="field span-two">
                <span>Notes</span>
                <textarea
                  className="text-field"
                  value={activePantryEditItem.notes}
                  onChange={(event) =>
                    updatePantryItem(activePantryEditItem.id, "notes", event.target.value)
                  }
                />
              </label>
            </div>

            <div className="button-row pantryEditActions">
              <Button variant="outline" onClick={() => setActivePantryEditId("")}>
                Close
              </Button>
              <Button
                className={hasUnsavedChanges ? "dirtySaveButton" : ""}
                onClick={savePlannerData}
                disabled={cloudLoading}
              >
                <Save size={16} /> {cloudLoading ? "Saving..." : "Save Changes"}
              </Button>
            </div>
          </div>
        </div>
      ) : null}

      <div className="page">
        <header className="hero">
          <div className="hero-inner">
            <div className="hero-copy">
              <div className="eyebrow">
                <Wheat size={16} /> Baking Planner
              </div>
              <h1>Plan consistent baking days with fewer surprises.</h1>
              <p>
                Scale baking recipes by pre-baked dough weight, adjust for temperature,
                humidity, and altitude, then generate a practical production
                sheet for your bake day.
              </p>
              <div className="button-row heroButtonRow" style={{ marginTop: "14px" }}>
                <Button
                  variant="outline"
                  className={hasUnsavedChanges ? "dirtySaveButton" : ""}
                  onClick={savePlannerData}
                  disabled={cloudLoading}
                >
                  <Cloud size={16} /> {cloudLoading ? "Syncing..." : hasUnsavedChanges ? "Save Changes" : "Save / Sync"}
                </Button>
                <Button
                  variant="outline"
                  className={activeTab === "settings" ? "activeHeroSettingsButton" : ""}
                  onClick={() => setActiveTab("settings")}
                >
                  <Settings size={16} /> Settings
                </Button>
                <span className="pill heroCloudStatus">
                  {user?.displayName || user?.email || "Local user"} • {cloudStatus}
                </span>
              </div>
            </div>
          </div>
        </header>

        <div className="mobileTabShell">
          <span className="mobileTabArrow" aria-hidden="true">
            ‹
          </span>

          <nav className="tabs" aria-label="Baking planner sections">
            {tabButton("pantry", "Pantry", Package)}
            {tabButton("recipes", "Recipes", BookOpen)}
            {tabButton("starter", "Starter", FlaskConical)}
            {tabButton("planner", "Bake Plan", ClipboardList)}
            {tabButton("sheet", "Production Sheet", Printer)}
          </nav>

          <span className="mobileTabArrow" aria-hidden="true">
            ›
          </span>
        </div>

        {activeTab === "planner" && (
          <div className="layout two-col">
            <div className="stack">
              <Card>
                <CardContent className="panel">
                  <div className="section-head">
                    <div>
                      <h2>Production Quantities</h2>
                      <p>
                        Add only the recipes you want for this specific bake
                        cycle. This does not change your saved Recipe Library.
                      </p>
                    </div>
                    <div className="button-row">
                      <Button onClick={() => addRecipeToCycle(availableRecipesForCycle[0]?.id)}>
                        <Plus size={16} /> Add Product
                      </Button>
                      <Button variant="outline" onClick={clearCycle}>
                        <Trash2 size={16} /> Clear Cycle
                      </Button>
                    </div>
                  </div>

                  <div className="soft-panel">
                    <div className="grid two">
                      <label className="field">
                        <span>Add Recipe to This Bake Cycle</span>
                        <select
                          className="text-field"
                          value=""
                          onChange={(e) => addRecipeToCycle(e.target.value)}
                        >
                          <option value="">Select a recipe...</option>
                          {availableRecipesForCycle.map((recipe) => (
                            <option key={recipe.id} value={recipe.id}>
                              {recipe.name}
                            </option>
                          ))}
                        </select>
                      </label>

                      <div className="field">
                        <span>Cycle Status</span>
                        <div className="pill">
                          {productionItems.length === 0
                            ? "No products added to this bake cycle yet."
                            : `${productionItems.length} product${
                                productionItems.length === 1 ? "" : "s"
                              } in this bake cycle.`}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="stack">
                    {productionItems.length === 0 && (
                      <div className="soft-panel">
                        <h3>No Products Added Yet</h3>
                        <p className="muted small">
                          Use the dropdown above to add recipes from your Recipe
                          Library into this specific bake cycle.
                        </p>
                      </div>
                    )}

                    {productionItems.map((item) => {
                      const recipe = recipes.find((r) => r.id === item.recipeId);
                      if (!recipe) return null;

                      return (
                        <div key={item.recipeId} className="recipe-row editable-row">
                          <div>
                            <p className="recipe-title">{recipe.name}</p>
                            <p className="muted small">
                              {formatNumber(recipe.preBakeUnitWeight, 2)}g dough weight •{" "}
                              {recipe.hydrationPct}% final hydration •{" "}
                              {recipe.starterPct}% {shouldUseStarterName ? trimmedStarterName : "starter"} • {recipe.vesselType}
                            </p>
                          </div>

                          <NumberInput
                            label={`Qty (${recipe.unitsLabel})`}
                            value={item.quantity}
                            onChange={(v) => updateCycleQuantity(recipe.id, v)}
                          />

                          <Button
                            variant="outline"
                            onClick={() => removeRecipeFromCycle(recipe.id)}
                          >
                            <Trash2 size={16} /> Remove
                          </Button>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="panel">
                  <h2>Current Bake Conditions</h2>
                  <div className="grid two">
                    <NumberInput
                      label="Room Temperature"
                      value={env.tempF}
                      onChange={(v) =>
                        setEnv((p) => ({ ...p, tempF: Number(v) }))
                      }
                      suffix="°F"
                    />
                    <NumberInput
                      label="Room Humidity"
                      value={env.humidityPct}
                      onChange={(v) =>
                        setEnv((p) => ({ ...p, humidityPct: Number(v) }))
                      }
                      suffix="%"
                    />
                  </div>

                  <div className="grid three">
                    <ProgressBar
                      label="Fermentation Speed"
                      value={round(100 / (plans[0]?.fermentationFactor || 1))}
                      max={160}
                      suffix="%"
                      warningAt={120}
                    />
                    <ProgressBar
                      label="Proofing Capacity"
                      value={totals.units}
                      max={settings.proofingCapacityUnits}
                      suffix=" units"
                      warningAt={90}
                    />
                    <ProgressBar
                      label="Mixer Load"
                      value={Math.max(
                        ...plans.map((p) =>
                          Math.min(p.doughWeight, settings.mixerCapacityG)
                        ),
                        0
                      )}
                      max={settings.mixerCapacityG}
                      suffix="g"
                      warningAt={90}
                    />
                  </div>
                </CardContent>
              </Card>
            </div>

            <aside className="stack">
              <StatCard
                icon={Scale}
                label="Total Dough"
                value={`${round(totals.doughWeight / 1000, 1)} kg`}
                sub="before bake loss"
                accent="sourdough"
              />
              <StatCard
                icon={Wheat}
                label={starterNeededLabel}
                value={formatWeight(totals.bufferedStarterG)}
                sub={starterBufferSub}
                accent="market"
              />
              <StatCard
                icon={Clock}
                label="Longest Product Window"
                value={minutesToLabel(totals.maxProcess)}
                sub={`starting near ${addMinutesToTime(settings.defaultStartTime, 0)}`}
                accent="pricing"
              />
              <StatCard
                icon={Mountain}
                label="Altitude Setting"
                value={`${settings.altitudeFt} ft`}
                sub="saved as a permanent variable"
                accent="grant"
              />

              <Card>
                <CardContent className="panel">
                  <div className="inline-head">
                    {warnings.length ? (
                      <AlertTriangle size={20} className="amber" />
                    ) : (
                      <CheckCircle2 size={20} className="green" />
                    )}
                    <h3>Plan Check</h3>
                  </div>

                  {warnings.length ? (
                    <div className="stack">
                      {warnings.map((w, idx) => (
                        <p key={idx} className="notice warning-box">
                          {w}
                        </p>
                      ))}
                    </div>
                  ) : (
                    <p className="notice good-box">
                      No major production conflicts found.
                    </p>
                  )}
                </CardContent>
              </Card>
            </aside>
          </div>
        )}

        {activeTab === "recipes" && (
          <div className="layout recipe-layout">
            <Card>
              <CardContent className="panel">
                <div className="section-head">
                  <h2>Recipe Library</h2>
                  <Button onClick={addRecipe}>
                    <Plus size={16} />
                  </Button>
                </div>

                <div className="stack">
                  {recipes.map((recipe) => (
                    <button
                      key={recipe.id}
                      onClick={() => setSelectedRecipeId(recipe.id)}
                      className={
                        selectedRecipeId === recipe.id
                          ? "recipe-select active"
                          : "recipe-select"
                      }
                      type="button"
                    >
                      <p>{recipe.name}</p>
                      <span>
                        {recipe.category}
                        {recipe.listInProductDirectory
                          ? " • Listed in Product Directory"
                          : ""}
                      </span>
                    </button>
                  ))}
                </div>
              </CardContent>
            </Card>

            {selectedRecipe ? (
              <Card>
                <CardContent className="panel">
                  <div className="section-head">
                    <div>
                      <h2>Edit Recipe</h2>
                    <p>
                      Build the full recipe formula, including flour types,
                      added ingredients, dish type, yield, timing, and oven
                      capacity.
                    </p>
                    {lastSavedAt && (
                      <p className="saved-status">Saved at {lastSavedAt}</p>
                    )}
                  </div>
                  <div className="button-row">
                    <label className="bakingModeSwitch">
                      <span>Fixed Weights</span>
                      <button
                        type="button"
                        className={
                          getRecipeIngredientMode(selectedRecipe) === "weight"
                            ? "bakingToggleSwitch active"
                            : "bakingToggleSwitch"
                        }
                        onClick={() =>
                          updateRecipeIngredientMode(
                            getRecipeIngredientMode(selectedRecipe) === "weight"
                              ? "percentage"
                              : "weight"
                          )
                        }
                        aria-pressed={getRecipeIngredientMode(selectedRecipe) === "weight"}
                      >
                        <span />
                      </button>
                      <span>Percentages</span>
                    </label>

                    <Button
                      className={hasUnsavedChanges ? "dirtySaveButton" : ""}
                      onClick={savePlannerData}
                    >
                      <Save size={16} /> {hasUnsavedChanges ? "Save Changes" : "Save"}
                    </Button>
                    <Button variant="outline" onClick={duplicateRecipe}>
                      <Copy size={16} /> Duplicate
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => deleteRecipe(selectedRecipe.id)}
                    >
                      <Trash2 size={16} /> Delete
                    </Button>
                  </div>
                </div>

                <div className="grid two">
                  <label className="field span-two">
                    <span>Product Name</span>
                    <input
                      className="text-field"
                      value={selectedRecipe.name}
                      onChange={(e) =>
                        updateRecipeField("name", e.target.value)
                      }
                    />
                  </label>

                  <TextInput
                    label="Category"
                    value={selectedRecipe.category}
                    onChange={(v) => updateRecipeField("category", v)}
                    placeholder="Loaf, Cookie, Muffin, Pastry, etc."
                  />

                  <TextInput
                    label="Unit Label"
                    value={selectedRecipe.unitsLabel}
                    onChange={(v) => updateRecipeField("unitsLabel", v)}
                    placeholder="loaves, cookies, pieces, trays"
                  />

                  <TextInput
                    label="Dish / Vessel Type"
                    value={selectedRecipe.vesselType || ""}
                    onChange={(v) => updateRecipeField("vesselType", v)}
                    placeholder="Loaf pan, sheet pan, banneton, muffin tin"
                  />

                  <NumberInput
                    label="Pre-Baked Unit Dough Weight"
                    value={formatNumber(selectedRecipe.preBakeUnitWeight, 2)}
                    onChange={(v) =>
                      updateRecipeField("preBakeUnitWeight", Number(v))
                    }
                    suffix="g"
                  />

                  <NumberInput
                    label="Bake Loss"
                    value={selectedRecipe.bakeLossPct}
                    onChange={(v) =>
                      updateRecipeField("bakeLossPct", Number(v))
                    }
                    suffix="%"
                  />

                  <label className="field">
                    <span>Estimated Finished Unit Weight</span>
                    <div className="pill">
                      {formatWeight(selectedRecipe.finishedUnitWeight)}
                    </div>
                  </label>


                  <NumberInput
                    label={
                      selectedRecipePreviewPlan
                        ? `${getRecipeIngredientMode(selectedRecipe) === "weight" ? "Base Water" : "Base Hydration"} (${
                            getRecipeIngredientMode(selectedRecipe) === "weight"
                              ? formatIngredientCompanion(selectedRecipePreviewPlan.adjustedHydrationPct, "weight")
                              : formatIngredientCompanion(selectedRecipePreviewPlan.waterG, "percentage")
                          })`
                        : getRecipeIngredientMode(selectedRecipe) === "weight"
                          ? "Base Water"
                          : "Base Hydration"
                    }
                    value={
                      getRecipeIngredientMode(selectedRecipe) === "weight"
                        ? selectedRecipe.hydrationWeightG || 0
                        : selectedRecipe.hydrationPct
                    }
                    onChange={(v) =>
                      updateRecipeField(
                        getRecipeIngredientMode(selectedRecipe) === "weight"
                          ? "hydrationWeightG"
                          : "hydrationPct",
                        Number(v)
                      )
                    }
                    suffix={getRecipeIngredientMode(selectedRecipe) === "weight" ? "g" : "%"}
                  />

                  <NumberInput
                    label={
                      selectedRecipePreviewPlan
                        ? `${starterRecipeLabel} (${
                            getRecipeIngredientMode(selectedRecipe) === "weight"
                              ? formatIngredientCompanion(selectedRecipePreviewPlan.starterPct, "weight")
                              : formatIngredientCompanion(selectedRecipePreviewPlan.starterG, "percentage")
                          })`
                        : starterRecipeLabel
                    }
                    value={
                      getRecipeIngredientMode(selectedRecipe) === "weight"
                        ? selectedRecipe.starterWeightG || 0
                        : selectedRecipe.starterPct
                    }
                    onChange={(v) =>
                      updateRecipeField(
                        getRecipeIngredientMode(selectedRecipe) === "weight"
                          ? "starterWeightG"
                          : "starterPct",
                        Number(v)
                      )
                    }
                    suffix={getRecipeIngredientMode(selectedRecipe) === "weight" ? "g" : "%"}
                  />

                  <NumberInput
                    label={
                      selectedRecipePreviewPlan
                        ? `Salt (${
                            getRecipeIngredientMode(selectedRecipe) === "weight"
                              ? formatIngredientCompanion(selectedRecipePreviewPlan.saltPct, "weight")
                              : formatIngredientCompanion(selectedRecipePreviewPlan.saltG, "percentage")
                          })`
                        : "Salt"
                    }
                    value={
                      getRecipeIngredientMode(selectedRecipe) === "weight"
                        ? selectedRecipe.saltWeightG || 0
                        : selectedRecipe.saltPct
                    }
                    onChange={(v) =>
                      updateRecipeField(
                        getRecipeIngredientMode(selectedRecipe) === "weight"
                          ? "saltWeightG"
                          : "saltPct",
                        Number(v)
                      )
                    }
                    suffix={getRecipeIngredientMode(selectedRecipe) === "weight" ? "g" : "%"}
                  />

                  {isAdvancedMode ? (
                    <>
                      <label className="field">
                        <span>Mixing Method</span>
                        <select
                          className="text-field"
                          value={selectedRecipe.mixingMethod || "straight"}
                          onChange={(e) =>
                            updateRecipeField("mixingMethod", e.target.value)
                          }
                        >
                          <option value="straight">Straight Mix</option>
                          <option value="autolyse">Autolyse</option>
                          <option value="fermentolyse">Fermentolyse</option>
                          <option value="saltolyse">Saltolyse</option>
                        </select>
                      </label>

                      <label className="field">
                        <span>Use Bassinage</span>
                        <select
                          className="text-field"
                          value={selectedRecipe.useBassinage ? "yes" : "no"}
                          onChange={(e) =>
                            updateRecipeField("useBassinage", e.target.value === "yes")
                          }
                        >
                          <option value="no">No</option>
                          <option value="yes">Yes</option>
                        </select>
                      </label>

                      {selectedRecipe.useBassinage ? (
                        <>
                          <NumberInput
                            label={
                              selectedRecipePreviewPlan
                                ? `Initial Water (${
                                    getRecipeIngredientMode(selectedRecipe) === "weight"
                                      ? formatIngredientCompanion(selectedRecipePreviewPlan.adjustedInitialHydrationPct, "weight")
                                      : formatIngredientCompanion(selectedRecipePreviewPlan.initialWaterG, "percentage")
                                  })`
                                : getRecipeIngredientMode(selectedRecipe) === "weight"
                                  ? "Initial Water"
                                  : "Initial Hydration"
                            }
                            value={
                              getRecipeIngredientMode(selectedRecipe) === "weight"
                                ? selectedRecipe.initialHydrationWeightG || 0
                                : selectedRecipe.initialHydrationPct
                            }
                            onChange={(v) =>
                              updateRecipeField(
                                getRecipeIngredientMode(selectedRecipe) === "weight"
                                  ? "initialHydrationWeightG"
                                  : "initialHydrationPct",
                                Number(v)
                              )
                            }
                            suffix={getRecipeIngredientMode(selectedRecipe) === "weight" ? "g" : "%"}
                          />

                          <NumberInput
                            label={
                              selectedRecipePreviewPlan
                                ? `Bassinage Water (${
                                    getRecipeIngredientMode(selectedRecipe) === "weight"
                                      ? formatIngredientCompanion(selectedRecipePreviewPlan.adjustedBassinagePct, "weight")
                                      : formatIngredientCompanion(selectedRecipePreviewPlan.bassinageWaterG, "percentage")
                                  })`
                                : "Bassinage Water"
                            }
                            value={
                              getRecipeIngredientMode(selectedRecipe) === "weight"
                                ? selectedRecipe.bassinageWeightG || 0
                                : selectedRecipe.bassinagePct
                            }
                            onChange={(v) =>
                              updateRecipeField(
                                getRecipeIngredientMode(selectedRecipe) === "weight"
                                  ? "bassinageWeightG"
                                  : "bassinagePct",
                                Number(v)
                              )
                            }
                            suffix={getRecipeIngredientMode(selectedRecipe) === "weight" ? "g" : "%"}
                          />
                        </>
                      ) : null}
                    </>
                  ) : null}

                  <NumberInput
                    label="Max Dough Per Mixer Batch"
                    value={selectedRecipe.batchMaxDoughG}
                    onChange={(v) =>
                      updateRecipeField("batchMaxDoughG", Number(v))
                    }
                    suffix="g"
                  />

                  <NumberInput
                    label="Oven Capacity Per Load"
                    value={selectedRecipe.ovenCapacityUnits}
                    onChange={(v) =>
                      updateRecipeField("ovenCapacityUnits", Number(v))
                    }
                    suffix={selectedRecipe.unitsLabel}
                  />
                </div>

                <div className="soft-panel">
                  <div className="section-head">
                    <div>
                      <h3>Recipe Cost Preview</h3>
                      <p className="muted small">
                        Ingredient-only estimate for one {selectedRecipe.unitsLabel || "unit"} using Pantry matches.
                      </p>
                    </div>
                    <span className="pill">
                      {selectedRecipeCostPreview
                        ? `${formatMoney(selectedRecipeCostPreview.totalCost, 2)} / ${selectedRecipe.unitsLabel || "unit"}`
                        : "Add pantry items to estimate cost"}
                    </span>
                  </div>

                  {selectedRecipeCostPreview ? (
                    <div className="grid three">
                      <div className="pill">
                        <strong>{formatMoney(selectedRecipeCostPreview.totalCost, 2)}</strong>
                        <br />
                        <span className="muted tiny">Estimated ingredient cost per unit</span>
                      </div>
                      <div className="pill">
                        <strong>
                          {selectedRecipeCostPreview.matchedRows} / {selectedRecipeCostPreview.totalRows}
                        </strong>
                        <br />
                        <span className="muted tiny">Ingredients matched to Pantry</span>
                      </div>
                      <div className="pill">
                        <strong>
                          {selectedRecipeCostPreview.unmatchedRows.length
                            ? selectedRecipeCostPreview.unmatchedRows.map((row) => row.name).join(", ")
                            : "All matched"}
                        </strong>
                        <br />
                        <span className="muted tiny">Missing Pantry matches</span>
                      </div>
                    </div>
                  ) : null}
                </div>

                <div className="soft-panel bakingProductDirectoryPanel">
                  <div className="section-head">
                    <div>
                      <h3>Product Directory</h3>
                      <p className="muted small">
                        List this saved recipe in Products & Pricing when it is ready to sell.
                        Ingredient cost comes from the recipe formula and Pantry matches.
                      </p>
                    </div>

                    <label className="bakingProductDirectoryToggle">
                      <input
                        type="checkbox"
                        checked={Boolean(selectedRecipe.listInProductDirectory)}
                        onChange={(event) =>
                          toggleRecipeProductDirectory(event.target.checked)
                        }
                      />
                      <span>List in Product Directory</span>
                    </label>
                  </div>

                  {selectedRecipe.listInProductDirectory ? (
                    <div className="grid two">
                      <TextInput
                        label="Product Directory Name"
                        value={
                          selectedRecipe.productDirectory?.productName ||
                          selectedRecipe.name ||
                          ""
                        }
                        onChange={(value) =>
                          updateRecipeProductDirectoryField("productName", value)
                        }
                        placeholder="e.g., Country Sourdough Loaf"
                      />

                      <TextInput
                        label="Selling Unit"
                        value={
                          selectedRecipe.productDirectory?.sellingUnit ||
                          selectedRecipe.unitsLabel ||
                          "unit"
                        }
                        onChange={(value) =>
                          updateRecipeProductDirectoryField("sellingUnit", value)
                        }
                        placeholder="loaf, each, dozen, 6-pack"
                      />

                      <NumberInput
                        label="Units Per Batch"
                        value={
                          selectedRecipe.productDirectory?.unitsPerBatch ??
                          selectedRecipe.ovenCapacityUnits ??
                          1
                        }
                        onChange={(value) =>
                          updateRecipeProductDirectoryField(
                            "unitsPerBatch",
                            Number(value)
                          )
                        }
                        min={0}
                      />

                      <NumberInput
                        label="Labor Hours Per Batch"
                        value={selectedRecipe.productDirectory?.laborHoursPerBatch ?? 0}
                        onChange={(value) =>
                          updateRecipeProductDirectoryField(
                            "laborHoursPerBatch",
                            Number(value)
                          )
                        }
                        min={0}
                        step="0.25"
                      />

                      <label className="field span-two">
                        <span>Product Notes</span>
                        <textarea
                          className="text-field"
                          value={selectedRecipe.productDirectory?.notes || ""}
                          onChange={(event) =>
                            updateRecipeProductDirectoryField(
                              "notes",
                              event.target.value
                            )
                          }
                          placeholder="Optional pricing, packaging, or sales notes for this product."
                        />
                      </label>

                      <div className="pill">
                        <strong>
                          {selectedRecipeCostPreview
                            ? formatMoney(selectedRecipeCostPreview.totalCost, 2)
                            : "No pantry cost"}
                        </strong>
                        <br />
                        <span className="muted tiny">Ingredient cost per selling unit</span>
                      </div>

                      <div className="pill">
                        <strong>
                          {selectedRecipe.productDirectory?.unitsPerBatch ||
                            selectedRecipe.ovenCapacityUnits ||
                            1}{" "}
                          {selectedRecipe.productDirectory?.sellingUnit ||
                            selectedRecipe.unitsLabel ||
                            "units"}
                        </strong>
                        <br />
                        <span className="muted tiny">Default batch yield for Products & Pricing</span>
                      </div>
                    </div>
                  ) : (
                    <p className="notice good-box">
                      This recipe stays in the Recipe Library only and will not appear in the Product Directory.
                    </p>
                  )}
                </div>

                <div className="soft-panel">
                  <div className="section-head">
                    <div>
                      <h3>Flour Formula</h3>
                      <p className="muted small">
                        Use the recipe entry mode to enter flour as percentages or fixed grams per finished unit. The alternate value is shown beside each field.
                      </p>
                    </div>
                    <Button onClick={addFlourType}>
                      <Plus size={16} /> Add Flour
                    </Button>
                  </div>

                  <div className="stack">
                    {selectedRecipe.flourTypes.map((flour, index) => (
                      <div key={`flour-${index}`} className="recipe-row editable-row">
                        <TextInput
                          label="Flour Name"
                          value={flour.name}
                          onChange={(v) => updateFlourType(index, "name", v)}
                        />
                        <NumberInput
                          label={
                            selectedRecipePreviewPlan?.flourBreakdown?.[index]
                              ? `${
                                  getRecipeIngredientMode(selectedRecipe) === "weight"
                                    ? "Weight"
                                    : "Percent"
                                } (${
                                  getRecipeIngredientMode(selectedRecipe) === "weight"
                                    ? formatIngredientCompanion(
                                        selectedRecipePreviewPlan.flourBreakdown[index].pct,
                                        "weight"
                                      )
                                    : formatIngredientCompanion(
                                        selectedRecipePreviewPlan.flourBreakdown[index].grams,
                                        "percentage"
                                      )
                                })`
                              : getRecipeIngredientMode(selectedRecipe) === "weight"
                                ? "Weight"
                                : "Percent"
                          }
                          value={
                            getRecipeIngredientMode(selectedRecipe) === "weight"
                              ? flour.grams || 0
                              : flour.pct
                          }
                          onChange={(v) =>
                            updateFlourType(
                              index,
                              getRecipeIngredientMode(selectedRecipe) === "weight" ? "grams" : "pct",
                              v
                            )
                          }
                          suffix={getRecipeIngredientMode(selectedRecipe) === "weight" ? "g" : "%"}
                        />
                        <Button
                          variant="outline"
                          onClick={() => deleteFlourType(index)}
                        >
                          <Trash2 size={16} /> Remove
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="soft-panel bakingRecipeIngredientsPanel">
                  <div className="section-head">
                    <div>
                      <h3>Added Ingredients</h3>
                      <p className="muted small">
                        Add ingredients using the recipe's selected entry mode. Percentage mode scales from flour weight. Fixed weight mode uses grams per finished unit and still shows the equivalent baker's percentage.
                      </p>
                    </div>

                    <div className="button-row">
                      <Button onClick={addOtherIngredient} disabled={!pantryItems.length}>
                        <Plus size={16} /> Add Pantry Ingredient
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() =>
                          setShowQuickRecipeIngredient((current) => !current)
                        }
                      >
                        <Plus size={16} /> Quick Add
                      </Button>
                    </div>
                  </div>

                  {!pantryItems.length ? (
                    <p className="notice warning-box">
                      Add pantry items first, or use Quick Add to create a pantry item while building this recipe.
                    </p>
                  ) : null}

                  {showQuickRecipeIngredient ? (
                    <div className="soft-panel bakingQuickIngredientPanel">
                      <div className="section-head">
                        <div>
                          <h3>Quick Add Pantry Ingredient</h3>
                          <p className="muted small">
                            This creates a Pantry item and immediately adds it to this recipe.
                          </p>
                        </div>
                      </div>

                      <div className="grid three">
                        <TextInput
                          label="Ingredient Name"
                          value={quickRecipeIngredient.name}
                          onChange={(value) =>
                            updateQuickRecipeIngredient("name", value)
                          }
                          placeholder="Chocolate chips, olive oil, sesame seeds"
                        />

                        <label className="field">
                          <span>Category</span>
                          <select
                            className="text-field"
                            value={quickRecipeIngredient.category}
                            onChange={(event) =>
                              updateQuickRecipeIngredient(
                                "category",
                                event.target.value
                              )
                            }
                          >
                            {pantryCategories.map((category) => (
                              <option key={category}>{category}</option>
                            ))}
                          </select>
                        </label>

                        <TextInput
                          label="Source / Vendor"
                          value={quickRecipeIngredient.source}
                          onChange={(value) =>
                            updateQuickRecipeIngredient("source", value)
                          }
                          placeholder="Restaurant Depot, Costco, Azure"
                        />

                        <NumberInput
                          label="Package Size"
                          value={quickRecipeIngredient.packageSize}
                          onChange={(value) =>
                            updateQuickRecipeIngredient("packageSize", Number(value))
                          }
                          min={0}
                        />

                        <label className="field">
                          <span>Package Unit</span>
                          <select
                            className="text-field"
                            value={quickRecipeIngredient.packageUnit}
                            onChange={(event) =>
                              updateQuickRecipeIngredient(
                                "packageUnit",
                                event.target.value
                              )
                            }
                          >
                            {pantryUnits.map((unit) => (
                              <option key={unit} value={unit}>
                                {unit}
                              </option>
                            ))}
                          </select>
                        </label>

                        <NumberInput
                          label="Package Cost"
                          value={quickRecipeIngredient.packageCost}
                          onChange={(value) =>
                            updateQuickRecipeIngredient("packageCost", Number(value))
                          }
                          min={0}
                          step="0.01"
                          suffix="$"
                        />
                      </div>

                      <div className="button-row" style={{ marginTop: "14px" }}>
                        <Button onClick={quickAddRecipeIngredient}>
                          <Plus size={16} /> Add to Pantry and Recipe
                        </Button>
                        <Button
                          variant="outline"
                          onClick={() => {
                            setQuickRecipeIngredient(blankPantryItem);
                            setShowQuickRecipeIngredient(false);
                          }}
                        >
                          Cancel
                        </Button>
                      </div>
                    </div>
                  ) : null}

                  <div className="stack">
                    {selectedRecipe.otherIngredients.length === 0 && (
                      <p className="muted small">
                        No added ingredients yet.
                      </p>
                    )}

                    {selectedRecipe.otherIngredients.map((ingredient, index) => (
                      <div
                        key={`ingredient-${index}`}
                        className="recipe-row editable-row bakingIngredientRow"
                      >
                        <label className="field">
                          <span>Pantry Ingredient</span>
                          <select
                            className="text-field"
                            value={getRecipeIngredientPantryId(ingredient)}
                            onChange={(event) =>
                              updateOtherIngredient(
                                index,
                                "pantryItemId",
                                event.target.value
                              )
                            }
                          >
                            <option value="">Select pantry ingredient...</option>
                            {pantryItems.map((item) => (
                              <option key={item.id} value={item.id}>
                                {item.name}
                              </option>
                            ))}
                          </select>
                        </label>

                        <NumberInput
                          label={
                            selectedRecipePreviewPlan?.otherBreakdown?.[index]
                              ? `${
                                  getRecipeIngredientMode(selectedRecipe) === "weight"
                                    ? "Weight"
                                    : "Percent"
                                } (${
                                  getRecipeIngredientMode(selectedRecipe) === "weight"
                                    ? formatIngredientCompanion(
                                        selectedRecipePreviewPlan.otherBreakdown[index].pct,
                                        "weight"
                                      )
                                    : formatIngredientCompanion(
                                        selectedRecipePreviewPlan.otherBreakdown[index].grams,
                                        "percentage"
                                      )
                                })`
                              : getRecipeIngredientMode(selectedRecipe) === "weight"
                                ? "Weight"
                                : "Percent"
                          }
                          value={
                            getRecipeIngredientMode(selectedRecipe) === "weight"
                              ? ingredient.grams || 0
                              : ingredient.pct
                          }
                          onChange={(v) =>
                            updateOtherIngredient(
                              index,
                              getRecipeIngredientMode(selectedRecipe) === "weight" ? "grams" : "pct",
                              v
                            )
                          }
                          suffix={getRecipeIngredientMode(selectedRecipe) === "weight" ? "g" : "%"}
                        />

                        <Button
                          variant="outline"
                          onClick={() => deleteOtherIngredient(index)}
                        >
                          <Trash2 size={16} /> Remove
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <h3>Process Timing</h3>
                  <div className="grid four">
                    <NumberInput
                      label={
                        isAdvancedMode && selectedRecipe.mixingMethod !== "straight"
                          ? "Method Rest"
                          : "Autolyse / Rest"
                      }
                      value={selectedRecipe.process.autolyseMin}
                      onChange={(v) => updateRecipeProcess("autolyseMin", v)}
                      suffix="min"
                    />
                    <NumberInput
                      label="Mix"
                      value={selectedRecipe.process.mixMin}
                      onChange={(v) => updateRecipeProcess("mixMin", v)}
                      suffix="min"
                    />
                    <NumberInput
                      label="Bulk"
                      value={selectedRecipe.process.bulkMin}
                      onChange={(v) => updateRecipeProcess("bulkMin", v)}
                      suffix="min"
                    />
                    <NumberInput
                      label="Fold Count"
                      value={selectedRecipe.process.foldCount}
                      onChange={(v) => updateRecipeProcess("foldCount", v)}
                      suffix="folds"
                    />
                    <NumberInput
                      label="Fold Interval"
                      value={selectedRecipe.process.foldIntervalMin}
                      onChange={(v) =>
                        updateRecipeProcess("foldIntervalMin", v)
                      }
                      suffix="min"
                    />
                    <NumberInput
                      label="Fold Duration"
                      value={selectedRecipe.process.foldDurationMin}
                      onChange={(v) =>
                        updateRecipeProcess("foldDurationMin", v)
                      }
                      suffix="min"
                    />
                    <NumberInput
                      label="Divide / Pre-shape"
                      value={selectedRecipe.process.divideAndPreshapeMin}
                      onChange={(v) =>
                        updateRecipeProcess("divideAndPreshapeMin", v)
                      }
                      suffix="min"
                    />
                    <NumberInput
                      label="Bench Rest"
                      value={selectedRecipe.process.benchRestMin}
                      onChange={(v) => updateRecipeProcess("benchRestMin", v)}
                      suffix="min"
                    />
                    <NumberInput
                      label="Final Shape"
                      value={selectedRecipe.process.finalShapeMin}
                      onChange={(v) => updateRecipeProcess("finalShapeMin", v)}
                      suffix="min"
                    />
                    <NumberInput
                      label="Final Proof"
                      value={selectedRecipe.process.finalProofMin}
                      onChange={(v) => updateRecipeProcess("finalProofMin", v)}
                      suffix="min"
                    />
                    <NumberInput
                      label="Bake Temp"
                      value={selectedRecipe.process.bakeTempF}
                      onChange={(v) => updateRecipeProcess("bakeTempF", v)}
                      suffix="°F"
                    />
                    <NumberInput
                      label="Bake Time"
                      value={selectedRecipe.process.bakeMin}
                      onChange={(v) => updateRecipeProcess("bakeMin", v)}
                      suffix="min"
                    />
                    <NumberInput
                      label="Cool Time"
                      value={selectedRecipe.process.coolMin}
                      onChange={(v) => updateRecipeProcess("coolMin", v)}
                      suffix="min"
                    />
                  </div>
                </div>
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardContent className="panel">
                  <h2>No recipes yet</h2>
                  <p className="muted small">
                    Create your first recipe from scratch, or later choose to import sample recipes.
                  </p>

                  <Button onClick={addRecipe}>
                    <Plus size={16} /> Create Recipe
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>
        )}

        {activeTab === "starter" && (
          <div className="layout starterLayout">
            <Card className="starterSettingsCard">
              <CardContent className="panel">
                <h2>{starterBuilderTitle}</h2>
                <p>{starterBuilderDescription}</p>

                <div className="stack">
                  <TextInput
                    label="Starter Name"
                    value={settings.starterName || ""}
                    onChange={(v) =>
                      updateSettingField("starterName", v)
                    }
                    placeholder="Optional, e.g. Doughlene, Bertha, Bready Mercury"
                  />

                  <label className="field">
                    <span>Use Starter Name in Labels</span>
                    <select
                      className="text-field"
                      value={settings.useStarterNameInLabels ? "yes" : "no"}
                      onChange={(e) =>
                        updateSettingField("useStarterNameInLabels", e.target.value === "yes")
                      }
                    >
                      <option value="no">No, keep standard labels</option>
                      <option value="yes">Yes, use the starter name</option>
                    </select>
                  </label>

                  <NumberInput
                    label={starterHydrationLabel}
                    value={settings.starterHydrationPct}
                    onChange={(v) =>
                      updateSettingField("starterHydrationPct", Number(v))
                    }
                    suffix="%"
                  />
                  <NumberInput
                    label={starterBufferLabel}
                    value={settings.levainBufferPct}
                    onChange={(v) =>
                      updateSettingField("levainBufferPct", Number(v))
                    }
                    suffix="%"
                  />

                  <label className="field">
                    <span>Feeding Ratio</span>
                    <select
                      className="text-field"
                      value={settings.starterFeedingPreset || "custom"}
                      onChange={(e) => updateStarterFeedingPreset(e.target.value)}
                    >
                      <option value="1:1:1">1:1:1</option>
                      <option value="1:2:2">1:2:2</option>
                      <option value="1:3:3">1:3:3</option>
                      <option value="1:5:5">1:5:5</option>
                      <option value="custom">Custom</option>
                    </select>
                  </label>

                  <div className="grid three">
                    <NumberInput
                      label="Seed Parts"
                      value={settings.starterSeedParts}
                      onChange={(v) => {
                        updateSettingField("starterFeedingPreset", "custom");
                        updateSettingField("starterSeedParts", Number(v));
                      }}
                      min={0}
                    />
                    <NumberInput
                      label="Flour Parts"
                      value={settings.starterFlourParts}
                      onChange={(v) => {
                        updateSettingField("starterFeedingPreset", "custom");
                        updateSettingField("starterFlourParts", Number(v));
                      }}
                      min={0}
                    />
                    <NumberInput
                      label="Water Parts"
                      value={settings.starterWaterParts}
                      onChange={(v) => {
                        updateSettingField("starterFeedingPreset", "custom");
                        updateSettingField("starterWaterParts", Number(v));
                      }}
                      min={0}
                    />
                  </div>

                  <p className="pill">
                    Current feed: <strong>{levain.ratioLabel}</strong> seed : flour : water
                  </p>
                </div>
              </CardContent>
            </Card>

            <div className="hubStatGrid starterStatsGrid">
              <StatCard
                icon={FlaskConical}
                label={`Total Mature ${starterDisplayName}`}
                value={formatWeight(levain.totalLevain)}
                sub="including buffer"
                accent="sourdough"
              />
              <StatCard
                icon={Wheat}
                label={starterFlourLabel}
                value={formatWeight(levain.flour)}
                sub={starterFeedRatioLabel}
                accent="market"
              />
              <StatCard
                icon={Droplets}
                label={starterWaterLabel}
                value={formatWeight(levain.water)}
                sub={starterFeedRatioLabel}
                accent="pricing"
              />
              <StatCard
                icon={ChefHat}
                label={starterSeedLabel}
                value={formatWeight(levain.seedStarter)}
                sub={starterFeedRatioLabel}
                accent="grant"
              />
            </div>
          </div>
        )}

        {activeTab === "pantry" && (
          <div className="layout">
            <Card>
              <CardContent className="panel">
                <div className="section-head">
                  <div>
                    <h2>Pantry</h2>
                    <p>
                      Save ingredient package sizes, sources, and costs. This will
                      become the foundation for package pull estimates and batch costing.
                    </p>
                  </div>

                  <Button
                    className={hasUnsavedChanges ? "dirtySaveButton" : ""}
                    onClick={savePlannerData}
                    disabled={cloudLoading}
                  >
                    <Save size={16} /> {hasUnsavedChanges ? "Save Changes" : "Save"}
                  </Button>
                </div>

                <div className="soft-panel">
                  <h3>Add Pantry Item</h3>
                  <div className="grid three">
                    <TextInput
                      label="Ingredient Name"
                      value={pantryDraft.name}
                      onChange={(value) => updatePantryDraft("name", value)}
                      placeholder="Bread Flour"
                    />

                    <label className="field">
                      <span>Category</span>
                      <select
                        className="text-field"
                        value={pantryDraft.category}
                        onChange={(event) =>
                          updatePantryDraft("category", event.target.value)
                        }
                      >
                        {pantryCategories.map((category) => (
                          <option key={category}>{category}</option>
                        ))}
                      </select>
                    </label>

                    <TextInput
                      label="Source / Vendor"
                      value={pantryDraft.source}
                      onChange={(value) => updatePantryDraft("source", value)}
                      placeholder="Restaurant Depot, Azure, Costco"
                    />

                    <NumberInput
                      label="Package Size"
                      value={pantryDraft.packageSize}
                      onChange={(value) =>
                        updatePantryDraft("packageSize", Number(value))
                      }
                      min={0}
                    />

                    <label className="field">
                      <span>Package Unit</span>
                      <select
                        className="text-field"
                        value={pantryDraft.packageUnit}
                        onChange={(event) =>
                          updatePantryDraft("packageUnit", event.target.value)
                        }
                      >
                        {pantryUnits.map((unit) => (
                          <option key={unit} value={unit}>
                            {unit}
                          </option>
                        ))}
                      </select>
                    </label>

                    <NumberInput
                      label="Package Cost"
                      value={pantryDraft.packageCost}
                      onChange={(value) =>
                        updatePantryDraft("packageCost", Number(value))
                      }
                      min={0}
                      step="0.01"
                      suffix="$"
                    />

                    <label className="field">
                      <span>Track Inventory</span>
                      <select
                        className="text-field"
                        value={pantryDraft.trackInventory ? "yes" : "no"}
                        onChange={(event) =>
                          updatePantryDraft("trackInventory", event.target.value === "yes")
                        }
                      >
                        <option value="no">No</option>
                        <option value="yes">Yes</option>
                      </select>
                    </label>

                    <NumberInput
                      label="Quantity On Hand"
                      value={pantryDraft.quantityOnHand}
                      onChange={(value) =>
                        updatePantryDraft("quantityOnHand", Number(value))
                      }
                      min={0}
                    />

                    <label className="field">
                      <span>On Hand Unit</span>
                      <select
                        className="text-field"
                        value={pantryDraft.onHandUnit}
                        onChange={(event) =>
                          updatePantryDraft("onHandUnit", event.target.value)
                        }
                      >
                        {pantryUnits.map((unit) => (
                          <option key={unit} value={unit}>
                            {unit}
                          </option>
                        ))}
                      </select>
                    </label>

                    <label className="field">
                      <span>Low Stock Alert Mode</span>
                      <select
                        className="text-field"
                        value={pantryDraft.lowStockAlertMode || "weight"}
                        onChange={(event) =>
                          updatePantryDraft("lowStockAlertMode", event.target.value)
                        }
                      >
                        <option value="weight">By remaining weight</option>
                        <option value="package">By remaining package count</option>
                      </select>
                    </label>

                    {pantryDraft.lowStockAlertMode === "package" ? (
                      <NumberInput
                        label="Alert Below Packages"
                        value={pantryDraft.lowStockPackageThreshold}
                        onChange={(value) =>
                          updatePantryDraft("lowStockPackageThreshold", Number(value))
                        }
                        min={0}
                        step="0.25"
                      />
                    ) : (
                      <NumberInput
                        label="Low Stock Alert"
                        value={pantryDraft.lowStockThreshold}
                        onChange={(value) =>
                          updatePantryDraft("lowStockThreshold", Number(value))
                        }
                        min={0}
                      />
                    )}

                    <label className="field span-two">
                      <span>Notes</span>
                      <textarea
                        className="text-field"
                        value={pantryDraft.notes}
                        onChange={(event) =>
                          updatePantryDraft("notes", event.target.value)
                        }
                        placeholder="Optional SKU, brand, protein %, storage note, or preferred use."
                      />
                    </label>

                    <div className="field">
                      <span>Calculated Cost</span>
                      <div className="pill">
                        {(() => {
                          const preview = normalizePantryItem(pantryDraft);
                          return preview.costPerGram
                            ? `${formatMoney(preview.costPerPound, 2)} / lb`
                            : "Enter size and cost";
                        })()}
                      </div>
                    </div>
                  </div>

                  <div className="button-row" style={{ marginTop: "16px" }}>
                    <Button onClick={addPantryItem}>
                      <Plus size={16} /> Add to Pantry
                    </Button>
                  </div>
                </div>

                <div className="soft-panel">
                  <div className="section-head">
                    <div>
                      <h3>Saved Pantry Items</h3>
                      <p className="muted small">
                        Edit package sizes, units, source, and costs here. Cost
                        per ounce and pound updates automatically.
                      </p>
                    </div>
                    <span className="pill">
                      {pantryItems.length} item{pantryItems.length === 1 ? "" : "s"}
                    </span>
                  </div>

                  {pantryItems.length ? (
                    <div className="bakingPantryCards" aria-label="Saved pantry items">
                      {pantryItems.map((item) => {
                        const packageLabel = item.packageSize
                          ? `${formatNumber(item.packageSize, 2)} ${item.packageUnit}`
                          : "No package size";
                        const packageCostLabel = Number(item.packageCost)
                          ? formatMoney(item.packageCost, 2)
                          : "No cost saved";
                        const inventoryLabel = item.trackInventory
                          ? formatSmartWeight(item.quantityOnHandGrams)
                          : "Not tracked";
                        const lowAlertLabel = formatLowStockAlert(item);
                        const packageCountLabel =
                          item.trackInventory && Number(item.packageGrams) > 0
                            ? `${formatNumber(getRemainingPackageCount(item), 2)} package${getRemainingPackageCount(item) === 1 ? "" : "s"}`
                            : "N/A";
                        const sourceLabel = item.source || "No source saved";

                        return (
                          <article className="bakingPantryCard" key={item.id}>
                            <div className="bakingPantryCardTop">
                              <div className="bakingPantryCardTitle">
                                <p className="eyebrow">{item.category || "Other"}</p>
                                <h3>{item.name || "Unnamed Ingredient"}</h3>
                                <p className="muted small">{sourceLabel}</p>
                              </div>

                              <div className="bakingPantryCardActions">
                                <Button
                                  variant="outline"
                                  onClick={() => setActivePantryEditId(item.id)}
                                >
                                  Edit
                                </Button>
                                <Button
                                  variant="outline"
                                  onClick={() => deletePantryItem(item.id)}
                                >
                                  <Trash2 size={16} /> Delete
                                </Button>
                              </div>
                            </div>

                            <div className="bakingPantrySummaryGrid">
                              <div className="pill">
                                <strong>{packageLabel}</strong>
                                <br />
                                <span className="muted tiny">Package size</span>
                              </div>

                              <div className="pill">
                                <strong>{packageCostLabel}</strong>
                                <br />
                                <span className="muted tiny">Package cost</span>
                              </div>

                              <div className="pill">
                                <strong>{formatMoney(item.costPerPound, 2)}</strong>
                                <br />
                                <span className="muted tiny">Cost / lb</span>
                              </div>

                              <div className="pill">
                                <strong>{formatMoney(item.costPerOunce, 4)}</strong>
                                <br />
                                <span className="muted tiny">Cost / oz</span>
                              </div>


                              <div className="pill weightPill">
                                <strong>{inventoryLabel}</strong>
                                <br />
                                <span className="muted tiny">Current Inventory</span>
                              </div>

                              <div className="pill">
                                <strong>{packageCountLabel}</strong>
                                <br />
                                <span className="muted tiny">Remaining Packages</span>
                              </div>

                              <div className="pill">
                                <strong>{lowAlertLabel}</strong>
                                <br />
                                <span className="muted tiny">Low alert</span>
                              </div>

                              <div className="pill">
                                <strong>{item.trackInventory ? "Tracked" : "Not tracked"}</strong>
                                <br />
                                <span className="muted tiny">Status</span>
                              </div>
                            </div>

                            {item.notes ? (
                              <div className="bakingPantryNotes">
                                <span className="muted tiny">Notes</span>
                                <p className="muted small">{item.notes}</p>
                              </div>
                            ) : null}
                          </article>
                        );
                      })}
                    </div>                  ) : (
                    <p className="notice good-box">
                      No pantry items yet. Add flour, salt, sugar, butter, seeds,
                      packaging, or other recurring baking supplies above.
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {activeTab === "sheet" && (
          <div className="layout">
            <Card>
              <CardContent className="panel">
                <div className="section-head production-sheet-head">
                  <div>
                    <h2>Bake Day Production Sheet</h2>
                    <p className="production-date-display">
                      {formatDisplayDate(productionDate)}
                    </p>
                    <p>
                      Generated from current recipes, quantities, conditions, and
                      settings.
                    </p>
                  </div>

                  <div className="production-actions">
                    <label className="field production-date-field">
                      <span>Production Date</span>
                      <input
                        className="text-field"
                        type="date"
                        value={productionDate}
                        onChange={(e) => setProductionDate(e.target.value)}
                      />
                    </label>

                    <Button onClick={() => window.print()}>
                      <Printer size={16} /> Print
                    </Button>
                  </div>
                </div>

                <div className="hubStatGrid production-stats-grid">
                  <StatCard
                    icon={Scale}
                    label="Total Dough"
                    value={`${round(totals.doughWeight / 1000, 2)} kg`}
                    accent="sourdough"
                  />
                  <StatCard
                    icon={ChefHat}
                    label="Finished Units"
                    value={round(totals.units)}
                    accent="market"
                  />
                  <StatCard
                    icon={Thermometer}
                    label="Room Temp"
                    value={`${env.tempF}°F`}
                    accent="spice"
                  />
                  <StatCard
                    icon={Droplets}
                    label="Humidity"
                    value={`${env.humidityPct}%`}
                    accent="pricing"
                  />
                  <StatCard
                    icon={Package}
                    label="Bake Cycle Cost"
                    value={formatMoney(bakeCycleIngredientCost, 2)}
                    sub="ingredient cost only"
                    accent="grant"
                  />
                  <StatCard
                    icon={Scale}
                    label="Average Cost / Unit"
                    value={formatMoney(averageIngredientCostPerUnit, 2)}
                    sub={`${bakeCycleMatchedIngredientCount}/${bakeCycleIngredientCount} ingredients matched`}
                    accent="market"
                  />
                </div>

                <div className="grid two">
                  <div className="soft-panel">
                    <div className="section-head">
                      <div>
                        <h3>Ingredient Pull List</h3>
                        <p className="muted small">
                          Pantry matches add package pull estimates and ingredient cost.
                        </p>
                      </div>
                      <span className="pill">
                        Estimated cost: {formatMoney(ingredientPullTotalCost, 2)}
                      </span>
                    </div>

                    {ingredientPullRows.length ? (
                      <div className="table-wrap pullListWrap">
                        <table className="pullListTable">
                          <thead>
                            <tr>
                              <th>Ingredient</th>
                              <th>Amount</th>
                              <th>Pantry Match</th>
                              <th>Package Pull</th>
                              <th>Current Inventory</th>
                              <th>Cost</th>
                            </tr>
                          </thead>
                          <tbody>
                            {ingredientPullRows.map((row, index) => {
                              const inventory = row.pantryItem
                                ? getInventoryStatus(row)
                                : null;

                              return (
                                <tr key={row.name} className={index % 2 ? "" : "alt"}>
                                  <td>
                                    <button
                                      className={row.pantryItem || !row.isNonCosted ? "pullIngredientButton" : "pullIngredientButton disabled"}
                                      type="button"
                                      onClick={() => openPantryEditorFromPull(row)}
                                      disabled={row.isNonCosted && !row.pantryItem}
                                      title={
                                        row.pantryItem
                                          ? "Edit this pantry item"
                                          : row.isNonCosted
                                            ? "No pantry item needed"
                                            : "Create or match a pantry item"
                                      }
                                    >
                                      {row.name}
                                    </button>
                                  </td>
                                  <td className="pullAmountCell">{formatPullWeight(row.grams)}</td>
                                  <td>
                                    {row.pantryItem ? (
                                      <>
                                        <strong>{row.pantryItem.name}</strong>
                                        <br />
                                        <span className="muted tiny">
                                          {row.pantryItem.source || "No source"}
                                          {row.pantryItem.packageSize
                                            ? ` • ${formatNumber(row.pantryItem.packageSize, 2)}${row.pantryItem.packageUnit}`
                                            : ""}
                                        </span>
                                      </>
                                    ) : row.isNonCosted ? (
                                      <span className="muted tiny">No pantry item needed</span>
                                    ) : (
                                      <span className="warning-text tiny">Missing pantry match</span>
                                    )}
                                  </td>
                                  <td className="pullPackageCell">{formatCompactPackagePull(row)}</td>
                                  <td>
                                    {row.pantryItem?.trackInventory ? (
                                      <span className={inventory.className}>{inventory.label}</span>
                                    ) : row.pantryItem ? (
                                      <span className="muted tiny">Not tracked</span>
                                    ) : (
                                      <span className="muted tiny">N/A</span>
                                    )}
                                  </td>
                                  <td>
                                    {row.isNonCosted
                                      ? "Not costed"
                                      : row.estimatedCost
                                        ? formatMoney(row.estimatedCost, 2)
                                        : "No cost"}
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    ) : (
                      <p className="notice good-box">
                        Add products to the bake plan to generate an ingredient pull list.
                      </p>
                    )}
                  </div>

                  <div className="soft-panel">
                    <h3>Environmental Adjustments</h3>
                    <p className="pill">
                      Fermentation timing factor:{" "}
                      <strong>
                        {round((plans[0]?.fermentationFactor || 1) * 100)}%
                      </strong>{" "}
                      of baseline.
                    </p>
                    <p className="pill">
                      Humidity hydration adjustment:{" "}
                      <strong>
                        {plans[0]?.humidityAdj > 0 ? "+" : ""}
                        {round(plans[0]?.humidityAdj || 0, 1)}%
                      </strong>
                      .
                    </p>
                    <p className="pill">
                      Altitude adjustment:{" "}
                      <strong>+{plans[0]?.altitudeAdj.tempF || 0}°F bake temp</strong>
                      ,{" "}
                      <strong>+{plans[0]?.altitudeAdj.timePct || 0}% bake time</strong>
                      .
                    </p>
                  </div>
                </div>

                <div className="soft-panel">
                  <div className="section-head">
                    <div>
                      <h3>Bake Cycle Costing</h3>
                      <p className="muted small">
                        These are ingredient-only estimates from Pantry. Labor, packaging, overhead, and market fees can be added in a later pricing phase.
                      </p>
                    </div>
                    <span className="pill">
                      Total formula cost: {formatMoney(bakeCycleIngredientCost, 2)}
                    </span>
                  </div>

                  <div className="grid three">
                    <div className="pill">
                      <strong>{formatMoney(bakeCycleIngredientCost, 2)}</strong>
                      <br />
                      <span className="muted tiny">Total ingredient cost</span>
                    </div>
                    <div className="pill">
                      <strong>{formatMoney(averageIngredientCostPerUnit, 2)}</strong>
                      <br />
                      <span className="muted tiny">Average ingredient cost per unit</span>
                    </div>
                    <div className="pill">
                      <strong>
                        {bakeCycleMatchedIngredientCount} / {bakeCycleIngredientCount}
                      </strong>
                      <br />
                      <span className="muted tiny">Ingredient rows matched to Pantry</span>
                    </div>
                  </div>
                </div>

                <div className="soft-panel">
                  <div className="section-head">
                    <div>
                      <h3>Inventory Alerts</h3>
                      <p className="muted small">
                        Pantry items marked as tracked will warn you when this bake cycle exceeds what is on hand or drops below the low-stock alert.
                      </p>
                    </div>
                    <span className="pill">
                      {inventoryAlerts.length + lowStockPantryItems.length} alert{inventoryAlerts.length + lowStockPantryItems.length === 1 ? "" : "s"}
                    </span>
                  </div>

                  {inventoryAlerts.length || lowStockPantryItems.length ? (
                    <div className="stack">
                      {inventoryAlerts.map(({ row, inventory }) => (
                        <p key={`pull-${row.name}`} className="notice warning-box">
                          <strong>{row.pantryItem.name}</strong>: {inventory.label}. Needed for this bake cycle: {formatSmartWeight(row.grams)}.
                        </p>
                      ))}

                      {lowStockPantryItems.map((item) => (
                        <p key={`low-${item.id}`} className="notice warning-box">
                          <strong>{item.name}</strong> is at or below its low-stock alert. Current amount: {formatSmartWeight(item.quantityOnHandGrams)}{item.lowStockAlertMode === "package" && Number(item.packageGrams) > 0 ? ` (${formatNumber(getRemainingPackageCount(item), 2)} packages)` : ""}.
                        </p>
                      ))}
                    </div>
                  ) : (
                    <p className="notice good-box">
                      No inventory shortages or low-stock alerts found for tracked pantry items.
                    </p>
                  )}
                </div>

                <div className="soft-panel">
                  <h3>Resource-Aware Production Timeline</h3>
                  <p className="muted small">
                    This schedule prioritizes shared phases: all autolyse steps
                    first, all mixing next, then folding, shaping, proofing, and
                    baking while preventing mixer, oven, and hands-on baker
                    conflicts.
                  </p>
                </div>

                <div className="table-wrap">
                  <table>
                    <thead>
                      <tr>
                        <th>Start</th>
                        <th>End</th>
                        <th>Product</th>
                        <th>Task</th>
                        <th>Resource</th>
                        <th>Duration</th>
                        <th>Note</th>
                      </tr>
                    </thead>
                    <tbody>
                      {productionSchedule.map((task, idx) => (
                        <tr
                          key={`${task.product}-${task.name}-${idx}`}
                          className={idx % 2 ? "" : "alt"}
                        >
                          <td>{minutesToClock(task.start)}</td>
                          <td>{minutesToClock(task.end)}</td>
                          <td>
                            <strong>{task.product}</strong>
                          </td>
                          <td>{task.name}</td>
                          <td>{resourceLabel(task.resource)}</td>
                          <td>{minutesToLabel(task.duration)}</td>
                          <td className="tiny">{task.note}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="table-wrap">
                  <table>
                    <thead>
                      <tr>
                        <th>Product</th>
                        <th>Qty</th>
                        <th>Total Dough</th>
                        <th>Ingredient Cost</th>
                        <th>Cost / Unit</th>
                        <th>Mixer Batches</th>
                        <th>Dish / Vessel</th>
                        <th>Oven Capacity</th>
                        <th>Oven Loads</th>
                        <th>Bulk</th>
                        <th>Proof</th>
                        <th>Bake</th>
                      </tr>
                    </thead>
                    <tbody>
                      {planCostRows.map(({ plan, cost }, idx) => (
                        <tr key={plan.recipe.id} className={idx % 2 ? "" : "alt"}>
                          <td>
                            <strong>{plan.recipe.name}</strong>
                          </td>
                          <td>{plan.quantity}</td>
                          <td>{formatWeight(plan.doughWeight)}</td>
                          <td>
                            {cost.totalCost
                              ? formatMoney(cost.totalCost, 2)
                              : "No pantry cost"}
                          </td>
                          <td>
                            {cost.costPerUnit
                              ? formatMoney(cost.costPerUnit, 2)
                              : "No pantry cost"}
                          </td>
                          <td>{plan.batchesByMixer}</td>
                          <td>{plan.recipe.vesselType || ""}</td>
                          <td>
                            {plan.recipeOvenCapacity} {plan.recipe.unitsLabel}
                          </td>
                          <td>{plan.ovenLoads}</td>
                          <td>{minutesToLabel(plan.bulkMin)}</td>
                          <td>{minutesToLabel(plan.finalProofMin)}</td>
                          <td>
                            {round(plan.bakeTempF)}°F / {minutesToLabel(plan.bakeMin)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {activeTab === "settings" && (
          <div className="layout">
            <Card>
              <CardContent className="panel">
                <div>
                  <h2>Permanent Settings</h2>
                  <p>
                    These stay saved as assumptions for your regular bake location
                    and equipment. Recipe-specific oven capacity and dish type
                    are handled inside each recipe.
                  </p>
                </div>

                <div className="soft-panel">
                  <div className="section-head">
                    <div>
                      <h3>Baking Planner Mode</h3>
                      <p className="muted small">
                        Basic keeps the module simple. Advanced unlocks professional
                        mixing methods and bassinage fields.
                      </p>
                    </div>
                  </div>

                  <div className="grid two">
                    <label className="field">
                      <span>Mode</span>
                      <select
                        className="text-field"
                        value={settings.bakingPlannerMode || "basic"}
                        onChange={(e) => setBakingPlannerMode(e.target.value)}
                      >
                        <option value="basic">Basic</option>
                        <option value="advanced">Advanced / Professional</option>
                      </select>
                    </label>
                  </div>
                </div>

                <div className="grid settingsGrid">
                  <NumberInput
                    label="Altitude"
                    value={settings.altitudeFt}
                    onChange={(v) =>
                      setSettings((p) => ({ ...p, altitudeFt: Number(v) }))
                    }
                    suffix="ft"
                  />
                  <NumberInput
                    label="Baseline Temperature"
                    value={settings.baselineTempF}
                    onChange={(v) =>
                      setSettings((p) => ({ ...p, baselineTempF: Number(v) }))
                    }
                    suffix="°F"
                  />
                  <NumberInput
                    label="Baseline Humidity"
                    value={settings.baselineHumidityPct}
                    onChange={(v) =>
                      setSettings((p) => ({
                        ...p,
                        baselineHumidityPct: Number(v)
                      }))
                    }
                    suffix="%"
                  />
                  <NumberInput
                    label="Mixer Capacity"
                    value={settings.mixerCapacityG}
                    onChange={(v) =>
                      setSettings((p) => ({ ...p, mixerCapacityG: Number(v) }))
                    }
                    suffix="g dough"
                  />
                  <NumberInput
                    label="Proofing Capacity"
                    value={settings.proofingCapacityUnits}
                    onChange={(v) =>
                      setSettings((p) => ({
                        ...p,
                        proofingCapacityUnits: Number(v)
                      }))
                    }
                    suffix="units"
                  />
                  <NumberInput
                    label="Ingredient Buffer"
                    value={settings.ingredientBufferPct}
                    onChange={(v) =>
                      setSettings((p) => ({
                        ...p,
                        ingredientBufferPct: Number(v)
                      }))
                    }
                    suffix="%"
                  />
                  <label className="field">
                    <span>Default Start Time</span>
                    <input
                      className="text-field"
                      type="time"
                      value={settings.defaultStartTime}
                      onChange={(e) =>
                        setSettings((p) => ({
                          ...p,
                          defaultStartTime: e.target.value
                        }))
                      }
                    />
                  </label>
                </div>

                <div className="soft-panel">
                  <div className="inline-head">
                    <Save size={16} />
                    <strong>Cloud Sync Active</strong>
                  </div>
                  {user
                    ? "Signed in data can now be saved to Firestore and opened from another device after signing into the same Google account."
                    : "Sign in with Google to save recipes, settings, and bake cycles to the cloud."}
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
