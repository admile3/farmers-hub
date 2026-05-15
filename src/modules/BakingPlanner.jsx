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
  LogIn,
  LogOut,
  Cloud,
} from "lucide-react";
import "./bakingPlanner.css";
import { onAuthStateChanged, signInWithPopup, signOut } from "firebase/auth";
import { doc, getDoc, serverTimestamp, setDoc } from "firebase/firestore";
import { auth, db, googleProvider } from "../firebase";

function Card({ children,  = "" }) {
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
      { name: "Whole Wheat Flour", pct: 15 },
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
      coolMin: 120,
    },
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
      coolMin: 60,
    },
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
      coolMin: 45,
    },
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
      { name: "Milk Powder", pct: 3 },
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
      coolMin: 120,
    },
  },
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
};

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

const GRAMS_PER_OUNCE = 28.349523125;

function formatGrams(value) {
  return `${Math.round(Number(value) || 0).toLocaleString("en-US")}g`;
}

function formatOunces(value) {
  return ((Number(value) || 0) / GRAMS_PER_OUNCE).toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
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
    year: "numeric",
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
      ...(recipe.process || {}),
    },
  };
}

function calculateRecipePlan(rawRecipe, quantity, env, settings) {
  const recipe = normalizeRecipe(rawRecipe);
  const qty = Number(quantity) || 0;
  const desiredBakedWeight = qty * recipe.finishedUnitWeight;
  const doughWeight = desiredBakedWeight / (1 - recipe.bakeLossPct / 100);

  const humidityAdj = humidityHydrationAdjustment(
    env.humidityPct,
    settings.baselineHumidityPct
  );
  const altitudeAdj = altitudeBakeAdjustment(settings.altitudeFt);
  const adjustedHydrationPct =
    recipe.hydrationPct + humidityAdj + altitudeAdj.hydrationPct;

  const otherPct = recipe.otherIngredients.reduce(
    (sum, item) => sum + Number(item.pct || 0),
    0
  );

  const formulaTotalPct =
    100 + adjustedHydrationPct + recipe.starterPct + recipe.saltPct + otherPct;

  const baseFlourG = doughWeight / (formulaTotalPct / 100);
  const starterG = (baseFlourG * recipe.starterPct) / 100;
  const waterG = (baseFlourG * adjustedHydrationPct) / 100;
  const saltG = (baseFlourG * recipe.saltPct) / 100;

  const flourBreakdown = recipe.flourTypes.map((f) => ({
    name: f.name,
    grams: (baseFlourG * f.pct) / 100,
    pct: f.pct,
  }));

  const otherBreakdown = recipe.otherIngredients.map((item) => ({
    name: item.name,
    grams: (baseFlourG * item.pct) / 100,
    pct: item.pct,
  }));

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
    waterG,
    saltG,
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
    totalProcessMin,
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
      note,
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
      note,
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
      note,
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
      note,
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
      note,
    });
  };

  sortedPlans.forEach((plan) => {
    const autolyseMin = Number(plan.recipe.process.autolyseMin) || 0;
    let autolyseStart = startMin;
    let autolyseEnd = startMin;

    if (autolyseMin > 0) {
      const autolyseTask = scheduleBakerTask({
        plan,
        name: "Start autolyse",
        earliestStart: startMin,
        duration: autolyseMin,
        note: "",
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
      bakedAt: null,
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
      note: formatWeight(plan.doughWeight, "dough"),
    });

    state.mixEnd = mixTask.end;
    state.bulkStart = mixTask.end;
    state.bulkEnd = state.bulkStart + plan.bulkMin;

    schedulePassiveTask({
      plan,
      name: "Bulk fermentation",
      start: state.bulkStart,
      duration: plan.bulkMin,
      note: "",
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
        duration: foldDuration,
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
        note: "",
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
        note: "",
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
        note: "",
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
        note: "",
      });

      current = shapeTask.end;
    }

    schedulePassiveTask({
      plan,
      name: "Final proof",
      start: current,
      duration: plan.finalProofMin,
      note: "",
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
        note: `${Math.round(plan.bakeTempF)}°F`,
      });

      current = bakeTask.end;
    }

    state.bakedAt = current;

    schedulePassiveTask({
      plan,
      name: "Cool",
      start: current,
      duration: Number(plan.recipe.process.coolMin) || 0,
      note: "",
    });
  });

  return schedule.sort((a, b) => {
    if (a.start !== b.start) return a.start - b.start;

    const resourceOrder = {
      baker: 1,
      mixer: 2,
      passive: 3,
      oven: 4,
    };

    return (resourceOrder[a.resource] || 99) - (resourceOrder[b.resource] || 99);
  });
}

function StatCard({ icon: Icon, label, value, sub }) {
  return (
    <Card className="stat-card">
      <CardContent className="stat-card-content">
        <div className="icon-badge">
          <Icon size={20} />
        </div>
        <div>
          <p className="muted small">{label}</p>
          <p className="stat-value">{value}</p>
          {sub && <p className="muted tiny">{sub}</p>}
        </div>
      </CardContent>
    </Card>
  );
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
  const [activeTab, setActiveTab] = useState("planner");
  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [cloudLoading, setCloudLoading] = useState(false);
  const [cloudStatus, setCloudStatus] = useState("Local only");

  const [recipes, setRecipes] = useState(() =>
    loadFromStorage("bakingPlannerRecipes", initialRecipes).map(normalizeRecipe)
  );
  const [settings, setSettings] = useState(() =>
    loadFromStorage("bakingPlannerSettings", defaultSettings)
  );
  const [env, setEnv] = useState(() =>
    loadFromStorage("bakingPlannerEnv", { tempF: 74, humidityPct: 52 })
  );
  const [productionDate, setProductionDate] = useState(() =>
    loadFromStorage("bakingPlannerProductionDate", getTodayISODate())
  );
  const [productionItems, setProductionItems] = useState(() =>
    loadFromStorage("bakingPlannerProductionItems", [])
  );
  const [selectedRecipeId, setSelectedRecipeId] = useState(
    recipes[0]?.id || initialRecipes[0].id
  );
  const [lastSavedAt, setLastSavedAt] = useState("");

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      setAuthLoading(false);

      if (!currentUser) {
        setCloudStatus("Local only");
        return;
      }

      setCloudLoading(true);
      setCloudStatus("Loading cloud data...");

      try {
        const ref = doc(db, "users", currentUser.uid, "bakingPlanner", "main");
        const snapshot = await getDoc(ref);

        if (snapshot.exists()) {
          const data = snapshot.data();

          if (Array.isArray(data.recipes)) {
            setRecipes(data.recipes.map(normalizeRecipe));
            setSelectedRecipeId(data.recipes[0]?.id || initialRecipes[0].id);
          }

          if (data.settings) setSettings({ ...defaultSettings, ...data.settings });
          if (data.env) setEnv(data.env);
          if (data.productionDate) setProductionDate(data.productionDate);
          if (Array.isArray(data.productionItems)) {
            setProductionItems(data.productionItems);
          }

          setCloudStatus("Cloud data loaded");
        } else {
          setCloudStatus("No cloud save yet");
        }
      } catch (error) {
        console.error(error);
        setCloudStatus("Cloud load failed");
      } finally {
        setCloudLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

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
      bufferedSaltG: saltG * ingredientBuffer,
    };
  }, [plans, settings]);

  const levain = useMemo(() => {
    const totalLevain = totals.bufferedStarterG;
    const hydration = settings.starterHydrationPct / 100;
    const flour = totalLevain / (1 + hydration);
    const water = totalLevain - flour;
    const seedStarter = totalLevain * 0.2;
    return { totalLevain, flour, water, seedStarter };
  }, [totals.bufferedStarterG, settings.starterHydrationPct]);

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
    recipes.find((r) => r.id === selectedRecipeId) || recipes[0];

  const availableRecipesForCycle = useMemo(() => {
    const usedIds = new Set(productionItems.map((item) => item.recipeId));
    return recipes.filter((recipe) => !usedIds.has(recipe.id));
  }, [recipes, productionItems]);

  async function handleSignIn() {
    try {
      setCloudStatus("Signing in...");
      await signInWithPopup(auth, googleProvider);
    } catch (error) {
      console.error(error);
      setCloudStatus("Sign in failed");
    }
  }

  async function handleSignOut() {
    try {
      await signOut(auth);
      setCloudStatus("Local only");
    } catch (error) {
      console.error(error);
      setCloudStatus("Sign out failed");
    }
  }

  async function savePlannerData() {
    const normalizedRecipes = recipes.map(normalizeRecipe);

    saveToStorage("bakingPlannerRecipes", normalizedRecipes);
    saveToStorage("bakingPlannerSettings", settings);
    saveToStorage("bakingPlannerEnv", env);
    saveToStorage("bakingPlannerProductionDate", productionDate);
    saveToStorage("bakingPlannerProductionItems", productionItems);

    const savedTime = new Date().toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
    });

    setLastSavedAt(savedTime);

    if (!user) {
      setCloudStatus("Saved locally");
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
          productionDate,
          productionItems,
          updatedAt: serverTimestamp(),
        },
        { merge: true }
      );

      setCloudStatus(`Cloud saved at ${savedTime}`);
    } catch (error) {
      console.error(error);
      setCloudStatus("Cloud save failed");
    } finally {
      setCloudLoading(false);
    }
  }

  function updateRecipeField(field, value) {
    setRecipes((prev) =>
      prev.map((r) => (r.id === selectedRecipe.id ? { ...r, [field]: value } : r))
    );
  }

  function updateRecipeProcess(field, value) {
    setRecipes((prev) =>
      prev.map((r) =>
        r.id === selectedRecipe.id
          ? {
              ...r,
              process: {
                ...normalizeRecipe(r).process,
                [field]: Number(value) || 0,
              },
            }
          : r
      )
    );
  }

  function updateFlourType(index, field, value) {
    setRecipes((prev) =>
      prev.map((recipe) => {
        if (recipe.id !== selectedRecipe.id) return recipe;

        const flourTypes = recipe.flourTypes.map((item, itemIndex) =>
          itemIndex === index
            ? {
                ...item,
                [field]: field === "pct" ? Number(value) : value,
              }
            : item
        );

        return { ...recipe, flourTypes };
      })
    );
  }

  function addFlourType() {
    setRecipes((prev) =>
      prev.map((recipe) =>
        recipe.id === selectedRecipe.id
          ? {
              ...recipe,
              flourTypes: [...recipe.flourTypes, { name: "New Flour", pct: 0 }],
            }
          : recipe
      )
    );
  }

  function deleteFlourType(index) {
    setRecipes((prev) =>
      prev.map((recipe) => {
        if (recipe.id !== selectedRecipe.id) return recipe;

        const flourTypes = recipe.flourTypes.filter((_, itemIndex) => itemIndex !== index);

        return {
          ...recipe,
          flourTypes: flourTypes.length
            ? flourTypes
            : [{ name: "Bread Flour", pct: 100 }],
        };
      })
    );
  }

  function updateOtherIngredient(index, field, value) {
    setRecipes((prev) =>
      prev.map((recipe) => {
        if (recipe.id !== selectedRecipe.id) return recipe;

        const otherIngredients = recipe.otherIngredients.map((item, itemIndex) =>
          itemIndex === index
            ? {
                ...item,
                [field]: field === "pct" ? Number(value) : value,
              }
            : item
        );

        return { ...recipe, otherIngredients };
      })
    );
  }

  function addOtherIngredient() {
    setRecipes((prev) =>
      prev.map((recipe) =>
        recipe.id === selectedRecipe.id
          ? {
              ...recipe,
              otherIngredients: [
                ...recipe.otherIngredients,
                { name: "New Ingredient", pct: 1 },
              ],
            }
          : recipe
      )
    );
  }

  function deleteOtherIngredient(index) {
    setRecipes((prev) =>
      prev.map((recipe) =>
        recipe.id === selectedRecipe.id
          ? {
              ...recipe,
              otherIngredients: recipe.otherIngredients.filter(
                (_, itemIndex) => itemIndex !== index
              ),
            }
          : recipe
      )
    );
  }

  function addRecipeToCycle(recipeId) {
    if (!recipeId) return;

    setProductionItems((prev) => {
      if (prev.some((item) => item.recipeId === recipeId)) return prev;
      return [...prev, { recipeId, quantity: 0 }];
    });
  }

  function updateCycleQuantity(recipeId, quantity) {
    setProductionItems((prev) =>
      prev.map((item) =>
        item.recipeId === recipeId
          ? { ...item, quantity: Number(quantity) }
          : item
      )
    );
  }

  function removeRecipeFromCycle(recipeId) {
    setProductionItems((prev) => prev.filter((item) => item.recipeId !== recipeId));
  }

  function clearCycle() {
    setProductionItems([]);
  }

  function addRecipe() {
    const id = `recipe-${Date.now()}`;
    const base = normalizeRecipe({
      ...initialRecipes[0],
      id,
      name: "New Recipe",
      category: "Custom",
      unitsLabel: "units",
      vesselType: "Tray / Pan",
      flourTypes: [{ name: "Bread Flour", pct: 100 }],
      otherIngredients: [],
    });
    setRecipes((prev) => [...prev, base]);
    setSelectedRecipeId(id);
    setActiveTab("recipes");
  }

  function duplicateRecipe() {
    const id = `${selectedRecipe.id}-copy-${Date.now()}`;
    setRecipes((prev) => [
      ...prev,
      normalizeRecipe({ ...selectedRecipe, id, name: `${selectedRecipe.name} Copy` }),
    ]);
    setSelectedRecipeId(id);
  }

  function deleteRecipe(id) {
    if (recipes.length <= 1) return;
    setRecipes((prev) => prev.filter((r) => r.id !== id));
    setProductionItems((prev) => prev.filter((item) => item.recipeId !== id));
    setSelectedRecipeId(recipes.find((r) => r.id !== id)?.id || recipes[0].id);
  }

  const tabButton = (id, label, Icon) => (
    <button
      onClick={() => setActiveTab(id)}
      className={activeTab === id ? "tab active" : "tab"}
    >
      <Icon size={16} /> {label}
    </button>
  );

  return (
    <div className="bakingPlanner">
      <div className="page">
        <header className="hero">
          <div className="hero-inner">
            <div>
              <div className="eyebrow">
                <Wheat size={16} /> Baking Planner
              </div>
              <h1>Plan consistent baking days with fewer surprises.</h1>
              <p>
                Scale baking recipes by finished goods, adjust for temperature,
                humidity, and altitude, then generate a practical production
                sheet for your bake day.
              </p>
              <div className="button-row" style={{ marginTop: "14px" }}>
                {user ? (
                  <>
                    <Button variant="outline" onClick={savePlannerData} disabled={cloudLoading}>
                      <Cloud size={16} /> {cloudLoading ? "Syncing..." : "Save / Sync"}
                    </Button>
                    <Button variant="outline" onClick={handleSignOut}>
                      <LogOut size={16} /> Sign Out
                    </Button>
                    <span className="pill">
                      {user.displayName || user.email} • {cloudStatus}
                    </span>
                  </>
                ) : (
                  <>
                    <Button onClick={handleSignIn} disabled={authLoading}>
                      <LogIn size={16} /> Sign in with Google
                    </Button>
                    <span className="pill">{cloudStatus}</span>
                  </>
                )}
              </div>
            </div>
            <div className="hero-stats">
              <div>
                <p>Products</p>
                <strong>{recipes.length}</strong>
              </div>
              <div>
                <p>Planned Units</p>
                <strong>{round(totals.units)}</strong>
              </div>
            </div>
          </div>
        </header>

        <nav className="tabs">
          {tabButton("planner", "Bake Plan", ClipboardList)}
          {tabButton("recipes", "Recipes", BookOpen)}
          {tabButton("starter", "Starter", FlaskConical)}
          {tabButton("sheet", "Production Sheet", Printer)}
          {tabButton("settings", "Settings", Settings)}
        </nav>

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
                              {recipe.finishedUnitWeight}g finished weight •{" "}
                              {recipe.hydrationPct}% base hydration •{" "}
                              {recipe.starterPct}% starter • {recipe.vesselType}
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
              />
              <StatCard
                icon={Wheat}
                label="Preferment Needed"
                value={formatWeight(totals.bufferedStarterG)}
                sub={`includes ${settings.levainBufferPct}% preferment buffer`}
              />
              <StatCard
                icon={Clock}
                label="Longest Product Window"
                value={minutesToLabel(totals.maxProcess)}
                sub={`starting near ${addMinutesToTime(settings.defaultStartTime, 0)}`}
              />
              <StatCard
                icon={Mountain}
                label="Altitude Setting"
                value={`${settings.altitudeFt} ft`}
                sub="saved as a permanent variable"
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
                    >
                      <p>{recipe.name}</p>
                      <span>{recipe.category}</span>
                    </button>
                  ))}
                </div>
              </CardContent>
            </Card>

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
                    <Button onClick={savePlannerData}>
                      <Save size={16} /> Save
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
                    label="Finished Unit Weight"
                    value={selectedRecipe.finishedUnitWeight}
                    onChange={(v) =>
                      updateRecipeField("finishedUnitWeight", Number(v))
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

                  <NumberInput
                    label="Base Hydration"
                    value={selectedRecipe.hydrationPct}
                    onChange={(v) =>
                      updateRecipeField("hydrationPct", Number(v))
                    }
                    suffix="%"
                  />

                  <NumberInput
                    label="Starter / Levain"
                    value={selectedRecipe.starterPct}
                    onChange={(v) =>
                      updateRecipeField("starterPct", Number(v))
                    }
                    suffix="%"
                  />

                  <NumberInput
                    label="Salt"
                    value={selectedRecipe.saltPct}
                    onChange={(v) => updateRecipeField("saltPct", Number(v))}
                    suffix="%"
                  />

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
                      <h3>Flour Formula</h3>
                      <p className="muted small">
                        These percentages should usually total 100%.
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
                          label="Percent"
                          value={flour.pct}
                          onChange={(v) => updateFlourType(index, "pct", v)}
                          suffix="%"
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

                <div className="soft-panel">
                  <div className="section-head">
                    <div>
                      <h3>Added Ingredients</h3>
                      <p className="muted small">
                        Add ingredients as baker’s percentages based on total
                        flour weight. Examples: chocolate chips, olive oil,
                        honey, butter, milk powder, herbs, seeds.
                      </p>
                    </div>
                    <Button onClick={addOtherIngredient}>
                      <Plus size={16} /> Add Ingredient
                    </Button>
                  </div>

                  <div className="stack">
                    {selectedRecipe.otherIngredients.length === 0 && (
                      <p className="muted small">
                        No added ingredients yet.
                      </p>
                    )}

                    {selectedRecipe.otherIngredients.map((ingredient, index) => (
                      <div
                        key={`ingredient-${index}`}
                        className="recipe-row editable-row"
                      >
                        <TextInput
                          label="Ingredient Name"
                          value={ingredient.name}
                          onChange={(v) =>
                            updateOtherIngredient(index, "name", v)
                          }
                        />
                        <NumberInput
                          label="Percent"
                          value={ingredient.pct}
                          onChange={(v) =>
                            updateOtherIngredient(index, "pct", v)
                          }
                          suffix="%"
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
                      label="Autolyse"
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
          </div>
        )}

        {activeTab === "starter" && (
          <div className="layout two-col">
            <Card>
              <CardContent className="panel">
                <h2>Starter / Preferment Builder</h2>
                <p>
                  This uses the total starter or preferment required across the active bake
                  plan and adds your saved buffer.
                </p>

                <div className="stack">
                  <NumberInput
                    label="Starter Hydration"
                    value={settings.starterHydrationPct}
                    onChange={(v) =>
                      setSettings((p) => ({
                        ...p,
                        starterHydrationPct: Number(v),
                      }))
                    }
                    suffix="%"
                  />
                  <NumberInput
                    label="Preferment Buffer"
                    value={settings.levainBufferPct}
                    onChange={(v) =>
                      setSettings((p) => ({
                        ...p,
                        levainBufferPct: Number(v),
                      }))
                    }
                    suffix="%"
                  />
                </div>
              </CardContent>
            </Card>

            <div className="grid two">
              <StatCard
                icon={FlaskConical}
                label="Total Mature Preferment"
                value={formatWeight(levain.totalLevain)}
                sub="including buffer"
              />
              <StatCard
                icon={Wheat}
                label="Flour for Levain"
                value={formatWeight(levain.flour)}
                sub={`${settings.starterHydrationPct}% hydration`}
              />
              <StatCard
                icon={Droplets}
                label="Water for Levain"
                value={formatWeight(levain.water)}
                sub="for preferment build"
              />
              <StatCard
                icon={ChefHat}
                label="Seed Starter / Preferment Estimate"
                value={formatWeight(levain.seedStarter)}
                sub="editable later as preferment ratios are added"
              />
            </div>
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

                <div className="grid four production-stats-grid">
                  <StatCard
                    icon={Scale}
                    label="Total Dough"
                    value={`${round(totals.doughWeight / 1000, 2)} kg`}
                  />
                  <StatCard
                    icon={ChefHat}
                    label="Finished Units"
                    value={round(totals.units)}
                  />
                  <StatCard
                    icon={Thermometer}
                    label="Room Temp"
                    value={`${env.tempF}°F`}
                  />
                  <StatCard
                    icon={Droplets}
                    label="Humidity"
                    value={`${env.humidityPct}%`}
                  />
                </div>

                <div className="grid two">
                  <div className="soft-panel">
                    <h3>Ingredient Pull List</h3>
                    <div>
                      {Object.entries(totals.bufferedFlourMap).map(
                        ([name, grams]) => (
                          <div key={name} className="line-item">
                            <span>{name}</span>
                            <strong>{formatWeight(grams)}</strong>
                          </div>
                        )
                      )}
                      <div className="line-item">
                        <span>Water</span>
                        <strong>{formatWeight(totals.bufferedWaterG)}</strong>
                      </div>
                      <div className="line-item">
                        <span>Mature Starter / Preferment</span>
                        <strong>{formatWeight(totals.bufferedStarterG)}</strong>
                      </div>
                      <div className="line-item">
                        <span>Salt</span>
                        <strong>{formatWeight(totals.bufferedSaltG)}</strong>
                      </div>
                      {Object.entries(totals.otherMap).map(([name, grams]) => (
                        <div key={name} className="line-item">
                          <span>{name}</span>
                          <strong>
                            {formatWeight(grams * (1 + settings.ingredientBufferPct / 100))}
                          </strong>
                        </div>
                      ))}
                    </div>
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
                      {plans.map((plan, idx) => (
                        <tr key={plan.recipe.id} className={idx % 2 ? "" : "alt"}>
                          <td>
                            <strong>{plan.recipe.name}</strong>
                          </td>
                          <td>{plan.quantity}</td>
                          <td>{formatWeight(plan.doughWeight)}</td>
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

                <div className="grid three">
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
                        baselineHumidityPct: Number(v),
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
                        proofingCapacityUnits: Number(v),
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
                        ingredientBufferPct: Number(v),
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
                          defaultStartTime: e.target.value,
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
