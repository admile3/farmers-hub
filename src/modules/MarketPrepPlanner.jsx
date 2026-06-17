import { useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowUp,
  CalendarDays,
  CircleHelp,
  ClipboardList,
  CloudRain,
  CloudSun,
  Droplets,
  MapPin,
  PackageCheck,
  Plus,
  Printer,
  Save,
  Sprout,
  Thermometer,
  Trash2,
  Wind
} from "lucide-react";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../firebase";
import { useAuth } from "../AuthContext.jsx";
import { useUnsavedChanges } from "../UnsavedChangesContext.jsx";
import StatCard from "../components/StatCard.jsx";
import ModuleGuideModal from "../components/ModuleGuideModal.jsx";
import MarketPrepGuideContent from "../components/MarketPrepGuideContent.jsx";
import {
  deleteMarketPrepPlan,
  getMarketPrepPlans,
  saveMarketPrepPlan
} from "../services/marketPrepService.js";
import { getProducts } from "../services/productService.js";
import { getSpiceRecipes } from "../services/spiceKitchenService.js";
import { getMarketWeatherForecast } from "../services/weatherService.js";

const marketCategories = [
  "Produce",
  "Red Meat",
  "Poultry",
  "Protein",
  "Plant Starts",
  "Bread",
  "Spices",
  "Condiments",
  "Eggs",
  "Dairy",
  "Baked Goods",
  "Prepared Foods",
  "Flowers",
  "Crafts",
  "Other"
];

const starterProducts = [
  {
    id: "sample-produce",
    name: "SAMPLE - Tomatoes",
    category: "Produce",
    unitLabel: "1 lb bag",
    plannedUnits: 12,
    unitAmount: 1,
    amountUnit: "lb",
    bufferPct: 10,
    notes: "Example produce item."
  },
  {
    id: "sample-bread",
    name: "SAMPLE - Sourdough Loaf",
    category: "Bread",
    unitLabel: "loaf",
    plannedUnits: 18,
    unitAmount: 1,
    amountUnit: "loaf",
    bufferPct: 0,
    notes: "Example bread item."
  },
  {
    id: "sample-spice",
    name: "SAMPLE - Seasoning Pouch",
    category: "Spices",
    unitLabel: "0.2 oz pouch",
    plannedUnits: 30,
    unitAmount: 0.2,
    amountUnit: "oz",
    bufferPct: 5,
    notes: "Example spice item."
  },
  {
    id: "sample-eggs",
    name: "SAMPLE - Chicken Eggs",
    category: "Eggs",
    unitLabel: "dozen",
    plannedUnits: 10,
    unitAmount: 1,
    amountUnit: "dozen",
    bufferPct: 0,
    notes: "Example egg item."
  }
];

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

function round(value, digits = 2) {
  const factor = Math.pow(10, digits);
  return Math.round((Number(value) || 0) * factor) / factor;
}

function makeId() {
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function createBlankPlan() {
  return {
    id: "",
    marketName: "Farmers Market",
    marketDate: todayISO(),
    location: "",
    zipCode: "",
    weatherNotes: "",
    weatherForecast: null,
    products: []
  };
}

function createSampleProducts() {
  return starterProducts.map((product) => ({
    ...product,
    id: `${product.id}-${Date.now()}-${Math.random().toString(16).slice(2)}`,
    packed: false
  }));
}

function formatPackageSize(size, unit) {
  const amount = Number(size) || 0;
  if (!amount) return "";
  return `${Number(amount.toFixed(3)).toString()} ${unit || ""}`.trim();
}

function cleanNumber(value, fallback = "") {
  if (value === "" || value === null || value === undefined) return fallback;
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
}

function inferAmountUnit(unitLabel = "") {
  const clean = String(unitLabel).toLowerCase();

  if (clean.includes("oz")) return "oz";
  if (clean.includes("lb")) return "lb";
  if (clean.includes("dozen")) return "dozen";
  if (clean.includes("tray")) return "tray";
  if (clean.includes("loaf")) return "loaf";
  if (clean.includes("pouch")) return "pouch";
  if (clean.includes("bag")) return "bag";
  if (clean.includes("bunch")) return "bunch";
  if (clean.includes("jar")) return "jar";

  return "each";
}

function inferUnitAmount(option = {}) {
  if (Number(option.unitAmount)) return Number(option.unitAmount);
  if (Number(option.packageOunces)) return Number(option.packageOunces);
  if (Number(option.size)) return Number(option.size);

  const unitLabel = String(option.unitLabel || option.name || "");
  const match = unitLabel.match(/(\d+(\.\d+)?)/);

  return match ? Number(match[1]) : 1;
}

function getProductTotals(product) {
  const plannedUnits = Number(product.plannedUnits) || 0;
  const unitAmount = Number(product.unitAmount) || 0;
  const bufferPct = Number(product.bufferPct) || 0;

  const plannedAmount = plannedUnits * unitAmount;
  const finalAmount = plannedAmount * (1 + bufferPct / 100);

  return {
    plannedUnits,
    plannedAmount,
    finalAmount
  };
}

function formatAmount(value, unit) {
  const cleanUnit = unit ? ` ${unit}` : "";
  return `${round(value)}${cleanUnit}`;
}

function productSummaryLine(product) {
  const totals = getProductTotals(product);
  const unit = product.amountUnit || "";

  return `${totals.plannedUnits} ${product.unitLabel || "units"} • Target ${formatAmount(
    totals.finalAmount,
    unit
  )}`;
}

function buildManualProductOptions(products = []) {
  return products.map((product) => ({
    id: `manual-${product.id}`,
    sourceType: "manual",
    sourceLabel: "Products & Pricing",
    sourceProductId: product.id,
    label: `${product.name || "Untitled Product"} (${product.unitLabel || "unit"})`,
    name: product.name || "Untitled Product",
    category: product.category || "Other",
    unitLabel: product.unitLabel || "unit",
    unitAmount: inferUnitAmount(product),
    amountUnit: product.amountUnit || inferAmountUnit(product.unitLabel),
    notes: product.notes || product.description || ""
  }));
}

function buildSpiceProductOptions(spiceRecipes = []) {
  const options = [];

  spiceRecipes
    .filter((recipe) => recipe?.listInProductDirectory)
    .forEach((recipe) => {
      const packages = Array.isArray(recipe.productPackages)
        ? recipe.productPackages
        : [];

      packages.forEach((packageItem, index) => {
        const packageName =
          packageItem.name ||
          formatPackageSize(packageItem.size, packageItem.unit) ||
          `Package ${index + 1}`;

        const packageOunces =
          cleanNumber(packageItem.packageOunces, "") ||
          (String(packageItem.unit || "").toLowerCase().includes("oz")
            ? cleanNumber(packageItem.size, "")
            : "");

        options.push({
          id: `spice-${recipe.id}-${index}`,
          sourceType: "spice",
          sourceLabel: "Spice Kitchen",
          sourceProductId: recipe.id,
          sourceVariantIndex: index,
          label: `${recipe.name || "Untitled Spice Blend"} - ${packageName}`,
          name: recipe.name || "Untitled Spice Blend",
          category: "Spices",
          unitLabel: packageName,
          unitAmount: packageOunces || cleanNumber(packageItem.size, 1),
          amountUnit: packageOunces ? "oz" : packageItem.unit || inferAmountUnit(packageName),
          notes: recipe.notes || ""
        });
      });
    });

  return options;
}

function buildBakingProductOptions(bakingRecipes = []) {
  return bakingRecipes
    .filter((recipe) => recipe?.listInProductDirectory)
    .map((recipe) => {
      const directory = recipe.productDirectory || {};
      const productName = directory.productName || recipe.name || "Untitled Baking Product";
      const unitLabel = directory.sellingUnit || recipe.unitsLabel || "unit";

      return {
        id: `baking-${recipe.id}`,
        sourceType: "baking",
        sourceLabel: "Baking Planner",
        sourceProductId: recipe.id,
        label: `${productName} (${unitLabel})`,
        name: productName,
        category:
          recipe.category === "Loaf" ||
          recipe.category === "Baguette" ||
          recipe.category === "Pan Loaf"
            ? "Bread"
            : "Baked Goods",
        unitLabel,
        unitAmount: cleanNumber(directory.unitAmount, 1),
        amountUnit: directory.amountUnit || inferAmountUnit(unitLabel),
        notes: directory.notes || ""
      };
    });
}

function WeatherMetricCard({ icon: Icon, label, value, detail }) {
  return (
    <div className="marketWeatherCard">
      <div className="marketWeatherIcon">
        <Icon size={18} />
      </div>
      <div>
        <span>{label}</span>
        <strong>{value}</strong>
        {detail ? <small>{detail}</small> : null}
      </div>
    </div>
  );
}

function WeatherPreview({ forecast }) {
  if (!forecast) return null;

  if (!forecast.available) {
    return <p className="marketWeatherUnavailable">{forecast.message}</p>;
  }

  return (
    <div className="marketWeatherGrid">
      <WeatherMetricCard
        icon={MapPin}
        label="Location"
        value={forecast.locationName || "Forecast location"}
      />
      <WeatherMetricCard
        icon={CloudSun}
        label="Conditions"
        value={forecast.conditions || "Forecast available"}
      />
      <WeatherMetricCard
        icon={Thermometer}
        label="Temp"
        value={`${forecast.highTemp}°F / ${forecast.lowTemp}°F`}
        detail="High / low"
      />
      <WeatherMetricCard
        icon={CloudRain}
        label="Rain Chance"
        value={`${forecast.precipitationChance ?? "N/A"}%`}
        detail={forecast.precipitationSum ? `${forecast.precipitationSum} in expected` : "Daily max"}
      />
      <WeatherMetricCard
        icon={Droplets}
        label="Humidity"
        value={forecast.humidity ? `${forecast.humidity}%` : "N/A"}
        detail="Daily average"
      />
      <WeatherMetricCard
        icon={Wind}
        label="Wind"
        value={`${forecast.windSpeedMax ?? "N/A"} mph`}
        detail="Max gust estimate"
      />
    </div>
  );
}

export default function MarketPrepPlanner() {
  const { user, loginWithGoogle } = useAuth();
  const { isDirty: hasUnsavedChanges, markUnsaved, markSaved } = useUnsavedChanges();

  const setupRef = useRef(null);
  const forecastRef = useRef(null);
  const packListRef = useRef(null);
  const savedPlansRef = useRef(null);

  const [planId, setPlanId] = useState("");
  const [marketName, setMarketName] = useState("Farmers Market");
  const [marketDate, setMarketDate] = useState(todayISO());
  const [location, setLocation] = useState("");
  const [zipCode, setZipCode] = useState("");
  const [weatherNotes, setWeatherNotes] = useState("");
  const [weatherForecast, setWeatherForecast] = useState(null);
  const [products, setProducts] = useState([]);
  const [savedPlans, setSavedPlans] = useState([]);
  const [productOptions, setProductOptions] = useState([]);
  const [selectedProductOptionId, setSelectedProductOptionId] = useState("");
  const [statusMessage, setStatusMessage] = useState("");
  const [loadingPlans, setLoadingPlans] = useState(false);
  const [loadingProducts, setLoadingProducts] = useState(false);
  const [loadingWeather, setLoadingWeather] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showBackToTop, setShowBackToTop] = useState(false);
  const [showGuide, setShowGuide] = useState(false);

  const [newProduct, setNewProduct] = useState({
    name: "",
    category: "Produce",
    unitLabel: "",
    plannedUnits: "",
    unitAmount: "",
    amountUnit: "",
    bufferPct: 0,
    notes: ""
  });

  function markMarketPrepDirty() {
    markUnsaved({
      source: "Market Prep Planner",
      onSave: savePlan
    });
  }

  useEffect(() => {
    function handleScroll() {
      setShowBackToTop(window.scrollY > 50);
    }

    window.addEventListener("scroll", handleScroll);
    handleScroll();

    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    if (!statusMessage) return undefined;

    const timer = window.setTimeout(() => {
      setStatusMessage("");
    }, 3000);

    return () => window.clearTimeout(timer);
  }, [statusMessage]);

  useEffect(() => {
    if (!user) return;

    const guideHidden = localStorage.getItem("hideModuleGuide_marketPrep") === "true";

    if (!guideHidden) {
      setShowGuide(true);
    }
  }, [user]);

  function scrollToSection(ref) {
    ref.current?.scrollIntoView({
      behavior: "smooth",
      block: "start"
    });
  }

  function scrollToTop() {
    window.scrollTo({
      top: 0,
      behavior: "smooth"
    });
  }

  const totals = useMemo(() => {
    return products.reduce(
      (sum, product) => {
        const productTotals = getProductTotals(product);

        return {
          productCount: sum.productCount + 1,
          plannedUnits: sum.plannedUnits + productTotals.plannedUnits,
          lineItemsWithBuffer:
            sum.lineItemsWithBuffer + (Number(product.bufferPct) > 0 ? 1 : 0)
        };
      },
      {
        productCount: 0,
        plannedUnits: 0,
        lineItemsWithBuffer: 0
      }
    );
  }, [products]);

  const categorySummary = useMemo(() => {
    return products.reduce((summary, product) => {
      const category = product.category || "Other";
      const productTotals = getProductTotals(product);

      if (!summary[category]) {
        summary[category] = {
          units: 0,
          items: 0
        };
      }

      summary[category].units += productTotals.plannedUnits;
      summary[category].items += 1;

      return summary;
    }, {});
  }, [products]);

  async function loadSavedPlans() {
    if (!user) return;

    setLoadingPlans(true);

    try {
      const plans = await getMarketPrepPlans(user.uid);
      setSavedPlans(plans);
    } catch (error) {
      console.error(error);
      setStatusMessage("Could not load saved market plans.");
    } finally {
      setLoadingPlans(false);
    }
  }

  async function loadProductOptions() {
    if (!user) return;

    setLoadingProducts(true);

    try {
      const [manualProducts, spiceRecipes, bakingSnapshot] = await Promise.all([
        getProducts(user.uid).catch((error) => {
          console.error(error);
          return [];
        }),
        getSpiceRecipes(user.uid).catch((error) => {
          console.error(error);
          return [];
        }),
        getDoc(doc(db, "users", user.uid, "bakingPlanner", "main")).catch((error) => {
          console.error(error);
          return null;
        })
      ]);

      const bakingRecipes = bakingSnapshot?.exists?.()
        ? bakingSnapshot.data()?.recipes || []
        : [];

      const options = [
        ...buildManualProductOptions(manualProducts),
        ...buildSpiceProductOptions(spiceRecipes),
        ...buildBakingProductOptions(bakingRecipes)
      ].sort((a, b) => a.label.localeCompare(b.label));

      setProductOptions(options);
    } catch (error) {
      console.error(error);
      setStatusMessage("Could not load products from linked modules.");
    } finally {
      setLoadingProducts(false);
    }
  }

  useEffect(() => {
    if (user) {
      loadSavedPlans();
      loadProductOptions();
    } else {
      setSavedPlans([]);
      setProductOptions([]);
    }
  }, [user]);

  function hydratePlan(plan) {
    markSaved();
    setPlanId(plan.id || "");
    setMarketName(plan.marketName || "Farmers Market");
    setMarketDate(plan.marketDate || todayISO());
    setLocation(plan.location || "");
    setZipCode(plan.zipCode || "");
    setWeatherNotes(plan.weatherNotes || "");
    setWeatherForecast(plan.weatherForecast || null);
    setProducts(Array.isArray(plan.products) ? plan.products : []);
    setStatusMessage("Loaded saved market plan.");
    scrollToSection(setupRef);
  }

  function startNewPlan() {
    markMarketPrepDirty();
    const blank = createBlankPlan();
    setPlanId(blank.id);
    setMarketName(blank.marketName);
    setMarketDate(blank.marketDate);
    setLocation(blank.location);
    setZipCode(blank.zipCode);
    setWeatherNotes(blank.weatherNotes);
    setWeatherForecast(blank.weatherForecast);
    setProducts(blank.products);
    setStatusMessage("Started a new empty market plan.");
    scrollToTop();
  }

  function loadSampleProducts() {
    markMarketPrepDirty();
    if (products.length > 0) {
      const confirmed = window.confirm(
        "This will add sample products to the current plan. Continue?"
      );

      if (!confirmed) return;
    }

    setProducts((current) => [...current, ...createSampleProducts()]);
    setStatusMessage("Sample products added. You can edit or delete them anytime.");
    scrollToSection(packListRef);
  }

  async function loadWeatherForecast() {
    if (!zipCode || !marketDate) {
      setStatusMessage("Enter a zip code and market date first.");
      return;
    }

    setLoadingWeather(true);

    try {
      const forecast = await getMarketWeatherForecast(zipCode, marketDate);
      setWeatherForecast(forecast);
      if (!forecast.available) setStatusMessage(forecast.message);
    } catch (error) {
      console.error(error);
      setWeatherForecast({
        available: false,
        message: "Could not load weather forecast."
      });
      setStatusMessage("Could not load weather forecast.");
    } finally {
      setLoadingWeather(false);
    }
  }

  async function savePlan() {
    if (!user) {
      setStatusMessage("Sign in from the Farmers Hub sidebar to save market plans.");
      return;
    }

    setSaving(true);

    const plan = {
      id: planId,
      marketName,
      marketDate,
      location,
      zipCode,
      weatherNotes,
      weatherForecast,
      products,
      totals
    };

    try {
      const savedId = await saveMarketPrepPlan(user.uid, plan);
      setPlanId(savedId);
      markSaved();
      setStatusMessage("Market prep plan saved.");
      await loadSavedPlans();
    } catch (error) {
      console.error(error);
      setStatusMessage("Could not save market prep plan.");
    } finally {
      setSaving(false);
    }
  }

  async function removeSavedPlan(id) {
    if (!user) return;

    try {
      await deleteMarketPrepPlan(user.uid, id);

      if (planId === id) {
        const blank = createBlankPlan();

        setPlanId(blank.id);
        setMarketName(blank.marketName);
        setMarketDate(blank.marketDate);
        setLocation(blank.location);
        setZipCode(blank.zipCode);
        setWeatherNotes(blank.weatherNotes);
        setWeatherForecast(blank.weatherForecast);
        setProducts(blank.products);
      }

      markSaved();
      setStatusMessage("Saved plan deleted.");
      await loadSavedPlans();
    } catch (error) {
      console.error(error);
      setStatusMessage("Could not delete saved plan.");
    }
  }

  function updateProduct(id, field, value) {
    markMarketPrepDirty();
    setProducts((current) =>
      current.map((product) =>
        product.id === id ? { ...product, [field]: value } : product
      )
    );
  }

  function togglePacked(id) {
    markMarketPrepDirty();
    setProducts((current) =>
      current.map((product) =>
        product.id === id ? { ...product, packed: !product.packed } : product
      )
    );
  }

  function removeProduct(id) {
    markMarketPrepDirty();
    setProducts((current) => current.filter((product) => product.id !== id));
  }

  function applyProductOption(optionId) {
    setSelectedProductOptionId(optionId);

    if (!optionId) return;

    const option = productOptions.find((item) => item.id === optionId);
    if (!option) return;

    setNewProduct((current) => ({
      ...current,
      name: option.name,
      category: option.category || "Other",
      unitLabel: option.unitLabel || "",
      unitAmount: option.unitAmount || 1,
      amountUnit: option.amountUnit || inferAmountUnit(option.unitLabel),
      notes: option.notes || "",
      sourceType: option.sourceType,
      sourceLabel: option.sourceLabel,
      sourceProductId: option.sourceProductId,
      sourceVariantIndex: option.sourceVariantIndex ?? ""
    }));
  }

  function addProduct(event) {
    markMarketPrepDirty();
    event.preventDefault();

    if (!newProduct.name.trim()) {
      setStatusMessage("Product name is required.");
      return;
    }

    if (!newProduct.unitLabel.trim()) {
      setStatusMessage("Unit label is required.");
      return;
    }

    setProducts((current) => [
      ...current,
      {
        id: makeId(),
        name: newProduct.name.trim(),
        category: newProduct.category,
        unitLabel: newProduct.unitLabel.trim(),
        plannedUnits: Number(newProduct.plannedUnits) || 0,
        unitAmount: Number(newProduct.unitAmount) || 0,
        amountUnit: newProduct.amountUnit.trim(),
        bufferPct: Number(newProduct.bufferPct) || 0,
        notes: newProduct.notes.trim(),
        sourceType: newProduct.sourceType || "",
        sourceLabel: newProduct.sourceLabel || "",
        sourceProductId: newProduct.sourceProductId || "",
        sourceVariantIndex: newProduct.sourceVariantIndex ?? "",
        packed: false
      }
    ]);

    setNewProduct({
      name: "",
      category: "Produce",
      unitLabel: "",
      plannedUnits: "",
      unitAmount: "",
      amountUnit: "",
      bufferPct: 0,
      notes: ""
    });
    setSelectedProductOptionId("");

    setStatusMessage("Product added to market plan.");
    scrollToSection(packListRef);
  }

  function printPlan() {
    window.print();
  }

  const sectionCards = [
    {
      title: "Market Setup",
      description: "Set date, location, weather notes, and market context.",
      icon: CalendarDays,
      ref: setupRef
    },
    {
      title: "Product Forecast",
      description: "Plan any vendor product using custom units and categories.",
      icon: Sprout,
      ref: forecastRef
    },
    {
      title: "Pack List",
      description: "Calculate planned units and prep targets by product.",
      icon: PackageCheck,
      ref: packListRef
    },
    {
      title: "Saved Plans",
      description: "Load, update, print, and reuse market prep plans.",
      icon: ClipboardList,
      ref: savedPlansRef
    }
  ];

  if (!user) {
    return (
      <div className="modulePage marketPrepPage compactSpicePage" onChangeCapture={(event) => {
        if (event.target.closest(".moduleGuideOverlay")) return;
        markMarketPrepDirty();
      }}>
        <section className="farmModuleHero marketPrepHero">
          <div className="farmModuleHeroText">
            <p className="eyebrow">Market Prep Planner</p>
            <h2>Sign in to save market prep plans.</h2>
            <p>
              Build generalized product forecasts and pack lists locally, then sign in
              to save market plans to your Farmers Hub account.
            </p>
          </div>

          <div className="farmModuleHeroActions">
            <button className="primaryButton compactPrimary farmHeroAction" onClick={loginWithGoogle}>
              Sign in with Google
            </button>
          </div>
        </section>
      </div>
    );
  }

  return (
    <div className="modulePage marketPrepPage compactSpicePage" onChangeCapture={(event) => {
        if (event.target.closest(".moduleGuideOverlay")) return;
        markMarketPrepDirty();
      }}>
      <section className="farmModuleHero marketPrepHero marketPrepNoPrint">
        <div className="farmModuleHeroText">
          <p className="eyebrow">Market Prep Planner</p>
          <h2>Plan packing, prep quantities, and inventory before market day.</h2>
          <p>
            Build a market plan by location and date, define your own unit labels,
            estimate product quantities, add buffers, save plans, and print a working
            prep sheet.
          </p>
        </div>

        <div className="farmModuleHeroActions marketPrepHeroActions">
  <button
    className="primaryButton compactPrimary farmHeroAction"
    type="button"
    onClick={startNewPlan}
  >
    <Plus size={15} />
    New Plan
  </button>

  <button
    className="secondaryButton compactButton farmHeroAction"
    type="button"
    onClick={loadSampleProducts}
  >
    <Sprout size={15} />
    Load Samples
  </button>

  <button
    className="secondaryButton compactButton farmHeroAction"
    type="button"
    onClick={() => setShowGuide(true)}
  >
    <CircleHelp size={15} />
    Guide
  </button>

  <button
    className="secondaryButton compactButton farmHeroAction"
    type="button"
    onClick={printPlan}
  >
    <Printer size={15} />
    Print
  </button>

  <button
    className={`secondaryButton compactButton farmHeroAction ${
      hasUnsavedChanges ? "dirtySaveButton" : ""
    }`}
    type="button"
    onClick={savePlan}
    disabled={saving}
  >
    <Save size={15} />
    {saving ? "Saving..." : hasUnsavedChanges ? "Save Changes" : "Save"}
  </button>
</div>
      </section>

      {statusMessage ? (
        <div className="floatingStatus success marketPrepNoPrint">
          <span>ⓘ</span>
          <span>{statusMessage}</span>
          <button type="button" onClick={() => setStatusMessage("")}>
            ×
          </button>
        </div>
      ) : null}

      <section className="toolGrid compactToolGrid marketPrepNoPrint">
        {sectionCards.map((card) => {
          const Icon = card.icon;

          return (
            <button
              className="toolCard compactToolCard clickableToolCard"
              key={card.title}
              type="button"
              onClick={() => scrollToSection(card.ref)}
            >
              <Icon size={22} />
              <h3>{card.title}</h3>
              <p>{card.description}</p>
            </button>
          );
        })}
      </section>

      <section className="marketPrepTopGrid compactWorkspace">
        <div className="workspacePanel compactPanel scrollAnchor marketPrepPrintDetails" ref={setupRef}>
          <div className="workspaceHeader compactPanelHeader">
            <div>
              <p className="eyebrow">Setup</p>
              <h3>Market Details</h3>
            </div>

          </div>

          <div className="formGrid compactFormGrid marketPrepNoPrint">
            <label>
              Market Name
              <input
                value={marketName}
                onChange={(event) => setMarketName(event.target.value)}
                placeholder="e.g., Downtown Farmers Market"
              />
            </label>

            <label>
              Market Date
              <input
                type="date"
                value={marketDate}
                onChange={(event) => {
                  setMarketDate(event.target.value);
                  setWeatherForecast(null);
                }}
              />
            </label>

            <label>
              Location
              <input
                value={location}
                onChange={(event) => setLocation(event.target.value)}
                placeholder="e.g., Pavilion, Main Street, South Lot"
              />
            </label>

            <label>
              Market Zip Code
              <input
                value={zipCode}
                onChange={(event) => {
                  setZipCode(event.target.value);
                  setWeatherForecast(null);
                }}
                placeholder="e.g., 40508"
              />
            </label>

            <label className="fullSpan">
              Weather / Demand Notes
              <input
                value={weatherNotes}
                onChange={(event) => setWeatherNotes(event.target.value)}
                placeholder="e.g., Hot day, holiday weekend, rain possible"
              />
            </label>
          </div>

          <div className="placeholderBox compactPlaceholder marketPrepNoPrint marketWeatherPanel">
            <div className="marketWeatherHeader">
              <div>
                <strong>Weather Preview</strong>
                <p>
                  Forecast data is only available for nearby dates. For markets farther out,
                  save the zip code and refresh weather closer to market day.
                </p>
              </div>

              <button
                className="secondaryButton compactButton marketWeatherButton"
                type="button"
                onClick={loadWeatherForecast}
                disabled={loadingWeather}
              >
                <CloudSun size={15} />
                {loadingWeather ? "Checking..." : "Check Weather"}
              </button>
            </div>

            <WeatherPreview forecast={weatherForecast} />
          </div>

          <div className="hubStatGrid marketPrepStatsGrid marketPrepNoPrint">
            <StatCard icon={PackageCheck} label="Products" value={totals.productCount} sub="Line items in this plan" accent="market" />
            <StatCard icon={ClipboardList} label="Planned Units" value={totals.plannedUnits} sub="Total units before buffers" accent="pricing" />
            <StatCard icon={Sprout} label="Buffered Items" value={totals.lineItemsWithBuffer} sub="Products with extra prep added" accent="sourdough" />
          </div>

          <div className="marketPrepMobileSummary marketPrepNoPrint">
            <div>
              <span>Products</span>
              <strong>{totals.productCount}</strong>
            </div>
            <div>
              <span>Units</span>
              <strong>{totals.plannedUnits}</strong>
            </div>
            <div>
              <span>Buffered</span>
              <strong>{totals.lineItemsWithBuffer}</strong>
            </div>
          </div>

          <div className="placeholderBox compactPlaceholder marketPrepNoPrint">
            <strong>{marketName}</strong>
            {location ? (
              <>
                {" "}
                at <strong>{location}</strong>
              </>
            ) : null}{" "}
            on <strong>{marketDate}</strong>
            {zipCode ? ` • ${zipCode}` : ""}
            {weatherNotes ? ` • ${weatherNotes}` : ""}
          </div>

          <div className="marketPrepPrintOnly marketPrepPrintDetailsCard">
            <div>
              <span>Market</span>
              <strong>{marketName || "Farmers Market"}</strong>
            </div>

            <div>
              <span>Date</span>
              <strong>{marketDate || "No date selected"}</strong>
            </div>

            {location ? (
              <div>
                <span>Location</span>
                <strong>{location}</strong>
              </div>
            ) : null}

            {zipCode ? (
              <div>
                <span>Zip Code</span>
                <strong>{zipCode}</strong>
              </div>
            ) : null}

            {weatherNotes ? (
              <div>
                <span>Weather / Demand Notes</span>
                <strong>{weatherNotes}</strong>
              </div>
            ) : null}
          </div>
        </div>

        <div className="workspacePanel compactPanel scrollAnchor marketPrepNoPrint" ref={savedPlansRef}>
          <div className="workspaceHeader compactPanelHeader">
            <div>
              <p className="eyebrow">Saved</p>
              <h3>Saved Market Plans</h3>
            </div>
          </div>

          <div className="savedList compactSavedList">
            {loadingPlans ? (
              <div className="placeholderBox compactPlaceholder">Loading saved plans...</div>
            ) : savedPlans.length ? (
              savedPlans.map((plan) => (
                <div className="savedItem compactSavedItem" key={plan.id}>
                  <div>
                    <h4>
                      <button type="button" className="savedItemLink" onClick={() => hydratePlan(plan)}>
                        {plan.marketName || "Market Plan"}
                      </button>
                    </h4>
                    <p>
                      {plan.marketDate || "No date"} • {plan.location || "No location"}
                    </p>
                  </div>

                  <div className="itemActions">
                    <button type="button" onClick={() => hydratePlan(plan)}>
                      Load
                    </button>
                    <button type="button" onClick={() => removeSavedPlan(plan.id)}>
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <div className="placeholderBox compactPlaceholder">No saved market plans yet.</div>
            )}
          </div>
        </div>
      </section>

      <section className="marketPrepForecastGrid compactWorkspace">
        <div className="workspacePanel compactPanel scrollAnchor marketPrepNoPrint" ref={forecastRef}>
          <div className="workspaceHeader compactPanelHeader">
            <div>
              <p className="eyebrow">Add Product</p>
              <h3>Product Forecast</h3>
            </div>

            <div className="formActions compactActions">
              <button className="secondaryButton compactButton" type="button" onClick={loadProductOptions}>
                {loadingProducts ? "Refreshing..." : "Refresh Products"}
              </button>
            </div>
          </div>

          <form className="formGrid compactFormGrid marketPrepAddProductForm" onSubmit={addProduct}>
            <label className="fullSpan">
              Select Existing Product / Variant
              <select
                value={selectedProductOptionId}
                onChange={(event) => applyProductOption(event.target.value)}
              >
                <option value="">
                  {loadingProducts ? "Loading products..." : "Choose a product or enter one manually"}
                </option>
                {productOptions.map((option) => (
                  <option key={option.id} value={option.id}>
                    {option.label} • {option.sourceLabel}
                  </option>
                ))}
              </select>
            </label>

            <label>
              Product / Item
              <input
                value={newProduct.name}
                onChange={(event) =>
                  setNewProduct((current) => ({ ...current, name: event.target.value }))
                }
                placeholder="e.g., Tomatoes, Eggs, Loaf, Starter Tray"
              />
            </label>

            <label>
              Category
              <select
                value={newProduct.category}
                onChange={(event) =>
                  setNewProduct((current) => ({
                    ...current,
                    category: event.target.value
                  }))
                }
              >
                {marketCategories.map((category) => (
                  <option key={category}>{category}</option>
                ))}
              </select>
            </label>

            <label>
              Unit Label
              <input
                value={newProduct.unitLabel}
                onChange={(event) =>
                  setNewProduct((current) => ({
                    ...current,
                    unitLabel: event.target.value
                  }))
                }
                placeholder="e.g., 1 lb bag, dozen, loaf, 4-pack, 0.2 oz pouch"
              />
            </label>

            <label>
              Planned Units
              <input
                type="number"
                value={newProduct.plannedUnits}
                onChange={(event) =>
                  setNewProduct((current) => ({
                    ...current,
                    plannedUnits: event.target.value
                  }))
                }
                placeholder="e.g., 24"
              />
            </label>

            <label>
              Amount Per Unit
              <input
                type="number"
                step="0.0001"
                value={newProduct.unitAmount}
                onChange={(event) =>
                  setNewProduct((current) => ({
                    ...current,
                    unitAmount: event.target.value
                  }))
                }
                placeholder="e.g., 1, 0.2, 12"
              />
            </label>

            <label>
              Amount Unit
              <input
                value={newProduct.amountUnit}
                onChange={(event) =>
                  setNewProduct((current) => ({
                    ...current,
                    amountUnit: event.target.value
                  }))
                }
                placeholder="e.g., lb, oz, dozen, each, tray"
              />
            </label>

            <label>
              Buffer %
              <input
                type="number"
                value={newProduct.bufferPct}
                onChange={(event) =>
                  setNewProduct((current) => ({
                    ...current,
                    bufferPct: event.target.value
                  }))
                }
                placeholder="e.g., 10"
              />
            </label>

            <label>
              Notes
              <input
                value={newProduct.notes}
                onChange={(event) =>
                  setNewProduct((current) => ({ ...current, notes: event.target.value }))
                }
                placeholder="e.g., Best seller, sample item, keep cold"
              />
            </label>

            <div className="formActions fullSpan compactActions">
              <button className="primaryButton compactPrimary" type="submit">
                <Plus size={15} />
                Add Product
              </button>
            </div>
          </form>
        </div>

        <div className="workspacePanel compactPanel marketPrepPrintSummary">
          <div className="workspaceHeader compactPanelHeader">
            <div>
              <p className="eyebrow">Summary</p>
              <h3>Category Summary</h3>
            </div>
          </div>

          <div className="savedList compactSavedList">
            {Object.keys(categorySummary).length ? (
              Object.entries(categorySummary).map(([category, summary]) => (
                <div className="savedItem compactSavedItem" key={category}>
                  <div>
                    <h4>{category}</h4>
                    <p>
                      {summary.items} items • {summary.units} planned units
                    </p>
                  </div>
                </div>
              ))
            ) : (
              <div className="placeholderBox compactPlaceholder">
                Add products or load sample products to see category totals.
              </div>
            )}
          </div>
        </div>
      </section>

      <section className="workspacePanel compactPanel scrollAnchor marketPrepPrintPackList" ref={packListRef}>
        <div className="workspaceHeader compactPanelHeader">
          <div>
            <p className="eyebrow">Pack List</p>
            <h3>Market Pack + Prep Plan</h3>
          </div>

          <div className="formActions compactActions marketPrepNoPrint">
            <button className="secondaryButton compactButton" type="button" onClick={loadSampleProducts}>
              <Sprout size={15} />
              Load Samples
            </button>

            <button className="secondaryButton compactButton" type="button" onClick={printPlan}>
              <Printer size={15} />
              Print
            </button>

            <button
              className={`primaryButton compactPrimary ${hasUnsavedChanges ? "dirtySaveButton" : ""}`}
              type="button"
              onClick={savePlan}
              disabled={saving}
            >
              <Save size={15} />
              {saving ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </div>

        <div className="marketPrepPrintHeader">
          <h2>{marketName}</h2>
          <p>
            {marketDate}
            {location ? ` • ${location}` : ""}
            {zipCode ? ` • ${zipCode}` : ""}
            {weatherNotes ? ` • ${weatherNotes}` : ""}
          </p>
        </div>

        <div className="marketPrepMobilePackCards marketPrepNoPrint">
          {products.length ? (
            products.map((product) => {
              const productTotals = getProductTotals(product);

              return (
                <article className="marketPrepMobilePackCard" key={`mobile-${product.id}`}>
                  <div className="marketPrepMobilePackHeader">
                    <label className="marketPrepMobileDone">
                      <input
                        type="checkbox"
                        checked={Boolean(product.packed)}
                        onChange={() => togglePacked(product.id)}
                      />
                      <span>{product.packed ? "Packed" : "Pack"}</span>
                    </label>

                    <button
                      className="iconButton danger"
                      type="button"
                      onClick={() => removeProduct(product.id)}
                      aria-label={`Remove ${product.name || "product"}`}
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>

                  <div className="marketPrepMobileProductTitle">
                    <strong>{product.name || "Untitled product"}</strong>
                    <span>{productSummaryLine(product)}</span>
                  </div>

                  <div className="marketPrepMobileCardGrid">
                    <label>
                      Product
                      <input
                        value={product.name}
                        onChange={(event) => updateProduct(product.id, "name", event.target.value)}
                      />
                    </label>

                    <label>
                      Category
                      <select
                        value={product.category}
                        onChange={(event) => updateProduct(product.id, "category", event.target.value)}
                      >
                        {marketCategories.map((category) => (
                          <option key={category}>{category}</option>
                        ))}
                      </select>
                    </label>

                    <label>
                      Unit
                      <input
                        value={product.unitLabel}
                        onChange={(event) => updateProduct(product.id, "unitLabel", event.target.value)}
                      />
                    </label>

                    <label>
                      Qty
                      <input
                        type="number"
                        value={product.plannedUnits}
                        onChange={(event) => updateProduct(product.id, "plannedUnits", event.target.value)}
                      />
                    </label>

                    <label>
                      Amount
                      <input
                        type="number"
                        step="0.0001"
                        value={product.unitAmount}
                        onChange={(event) => updateProduct(product.id, "unitAmount", event.target.value)}
                      />
                    </label>

                    <label>
                      Amount Unit
                      <input
                        value={product.amountUnit}
                        onChange={(event) => updateProduct(product.id, "amountUnit", event.target.value)}
                      />
                    </label>

                    <label>
                      Buffer %
                      <input
                        type="number"
                        value={product.bufferPct}
                        onChange={(event) => updateProduct(product.id, "bufferPct", event.target.value)}
                      />
                    </label>

                    <label>
                      Notes
                      <input
                        value={product.notes}
                        onChange={(event) => updateProduct(product.id, "notes", event.target.value)}
                      />
                    </label>
                  </div>

                  <div className="marketPrepMobileTargets">
                    <div>
                      <span>Total</span>
                      <strong>{formatAmount(productTotals.plannedAmount, product.amountUnit)}</strong>
                    </div>
                    <div>
                      <span>Target</span>
                      <strong>{formatAmount(productTotals.finalAmount, product.amountUnit)}</strong>
                    </div>
                  </div>
                </article>
              );
            })
          ) : (
            <div className="placeholderBox compactPlaceholder">
              No products in this market plan yet. Add a product above, or use
              Load Samples to add editable sample products.
            </div>
          )}
        </div>

        <div className="batchTable compactBatchTable marketPrepCompactTable">
          <div className="batchTableHeader marketPrepCompactHeader">
            <span>Done</span>
            <span>Product</span>
            <span>Category</span>
            <span>Unit</span>
            <span>Qty</span>
            <span>Amt / Unit</span>
            <span>Total</span>
            <span>Target</span>
            <span>Notes</span>
            <span className="marketPrepNoPrint"></span>
          </div>

          {products.length ? (
            products.map((product) => {
              const productTotals = getProductTotals(product);

              return (
                <div className="batchTableRow marketPrepCompactRow" key={product.id}>
                  <span className="marketPrepCheckCell">
                    <input
                      type="checkbox"
                      checked={Boolean(product.packed)}
                      onChange={() => togglePacked(product.id)}
                    />
                  </span>

                  <span>
                    <input
                      value={product.name}
                      onChange={(event) => updateProduct(product.id, "name", event.target.value)}
                    />
                  </span>

                  <span>
                    <select
                      value={product.category}
                      onChange={(event) => updateProduct(product.id, "category", event.target.value)}
                    >
                      {marketCategories.map((category) => (
                        <option key={category}>{category}</option>
                      ))}
                    </select>
                  </span>

                  <span>
                    <input
                      value={product.unitLabel}
                      onChange={(event) => updateProduct(product.id, "unitLabel", event.target.value)}
                    />
                  </span>

                  <span>
                    <input
                      type="number"
                      value={product.plannedUnits}
                      onChange={(event) => updateProduct(product.id, "plannedUnits", event.target.value)}
                    />
                  </span>

                  <span>
                    <div className="amountUnitInline">
                      <input
                        type="number"
                        step="0.0001"
                        value={product.unitAmount}
                        onChange={(event) => updateProduct(product.id, "unitAmount", event.target.value)}
                      />
                      <input
                        value={product.amountUnit}
                        onChange={(event) => updateProduct(product.id, "amountUnit", event.target.value)}
                      />
                    </div>
                  </span>

                  <span className="marketPrepCalculated">
                    {round(productTotals.plannedAmount)} {product.amountUnit}
                  </span>

                  <span className="marketPrepCalculated">
                    {round(productTotals.finalAmount)} {product.amountUnit}
                    {Number(product.bufferPct) > 0 ? (
                      <small>{product.bufferPct}% buffer</small>
                    ) : null}
                  </span>

                  <span>
                    <input
                      value={product.notes}
                      onChange={(event) => updateProduct(product.id, "notes", event.target.value)}
                    />
                  </span>

                  <span className="marketPrepNoPrint">
                    <button
                      className="iconButton danger"
                      type="button"
                      onClick={() => removeProduct(product.id)}
                    >
                      <Trash2 size={15} />
                    </button>
                  </span>
                </div>
              );
            })
          ) : (
            <div className="placeholderBox compactPlaceholder">
              No products in this market plan yet. Add a product above, or use
              Load Samples to add editable sample products.
            </div>
          )}
        </div>
      </section>

      <section className="marketPrepPrintSheet" aria-hidden="true">
        <header className="marketPrepPrintSheetHeader">
          <p className="eyebrow">Market Prep Plan</p>
          <h1>{marketName || "Farmers Market"}</h1>
          <p>
            {marketDate || "No date selected"}
            {location ? ` • ${location}` : ""}
            {zipCode ? ` • ${zipCode}` : ""}
            {weatherNotes ? ` • ${weatherNotes}` : ""}
          </p>
        </header>

        <section className="marketPrepPrintSection">
          <h2>Market Details</h2>
          <div className="marketPrepPrintDetailsGrid">
            <div>
              <span>Market</span>
              <strong>{marketName || "Farmers Market"}</strong>
            </div>
            <div>
              <span>Date</span>
              <strong>{marketDate || "No date selected"}</strong>
            </div>
            <div>
              <span>Location</span>
              <strong>{location || "No location listed"}</strong>
            </div>
            <div>
              <span>Zip Code</span>
              <strong>{zipCode || "No zip code listed"}</strong>
            </div>
            <div>
              <span>Weather / Demand Notes</span>
              <strong>{weatherNotes || "No notes listed"}</strong>
            </div>
            <div>
              <span>Forecast</span>
              <strong>
                {weatherForecast?.available
                  ? `${weatherForecast.conditions}, ${weatherForecast.highTemp}°F / ${weatherForecast.lowTemp}°F`
                  : weatherForecast?.message || "No forecast saved"}
              </strong>
            </div>
          </div>
        </section>

        <section className="marketPrepPrintSection">
          <h2>Category Summary</h2>
          {Object.keys(categorySummary).length ? (
            <div className="marketPrepPrintSummaryGrid">
              {Object.entries(categorySummary).map(([category, summary]) => (
                <div key={category}>
                  <strong>{category}</strong>
                  <span>
                    {summary.items} items • {summary.units} planned units
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="marketPrepPrintEmpty">No category totals yet.</p>
          )}
        </section>

        <section className="marketPrepPrintSection">
          <h2>Pack List</h2>
          {products.length ? (
            <table className="marketPrepPrintTable">
              <thead>
                <tr>
                  <th>Done</th>
                  <th>Product</th>
                  <th>Category</th>
                  <th>Unit</th>
                  <th>Qty</th>
                  <th>Amount / Unit</th>
                  <th>Total</th>
                  <th>Target</th>
                  <th>Notes</th>
                </tr>
              </thead>
              <tbody>
                {products.map((product) => {
                  const productTotals = getProductTotals(product);

                  return (
                    <tr key={product.id}>
                      <td>□</td>
                      <td>{product.name}</td>
                      <td>{product.category}</td>
                      <td>{product.unitLabel}</td>
                      <td>{productTotals.plannedUnits}</td>
                      <td>
                        {product.unitAmount} {product.amountUnit}
                      </td>
                      <td>
                        {round(productTotals.plannedAmount)} {product.amountUnit}
                      </td>
                      <td>
                        {round(productTotals.finalAmount)} {product.amountUnit}
                        {Number(product.bufferPct) > 0
                          ? ` (${product.bufferPct}% buffer)`
                          : ""}
                      </td>
                      <td>{product.notes}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          ) : (
            <p className="marketPrepPrintEmpty">No products in this market plan yet.</p>
          )}
        </section>
      </section>

      <ModuleGuideModal
        isOpen={showGuide}
        moduleKey="marketPrep"
        title="How to Use Market Prep Planner"
        onClose={() => setShowGuide(false)}
      >
        <MarketPrepGuideContent />
      </ModuleGuideModal>

      {showBackToTop ? (
        <button className="backToTopButton" type="button" onClick={scrollToTop}>
          <ArrowUp size={18} />
          Top
        </button>
      ) : null}
    </div>
  );
}
