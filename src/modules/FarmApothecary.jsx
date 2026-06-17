import { useEffect, useMemo, useRef, useState } from "react";
import {
  AlertCircle,
  ArrowUp,
  CalendarDays,
  CircleHelp,
  ClipboardList,
  DollarSign,
  Edit3,
  FlaskConical,
  Leaf,
  PackageCheck,
  Plus,
  Save,
  Search,
  ShoppingBag,
  Trash2,
  X
} from "lucide-react";

import { useAuth } from "../AuthContext.jsx";
import { useUnsavedChanges } from "../UnsavedChangesContext.jsx";
import ModuleHero from "../components/ModuleHero.jsx";
import ModuleGuideModal from "../components/ModuleGuideModal.jsx";
import FarmApothecaryGuideContent from "../components/FarmApothecaryGuideContent.jsx";
import StatCard from "../components/StatCard.jsx";
import { addQuantityToMatchedInventoryItem } from "../services/inventoryService.js";
import { saveProduct } from "../services/productService.js";
import {
  createApothecaryBatch,
  deleteApothecaryBatch,
  getApothecaryBatches,
  updateApothecaryBatch
} from "../services/farmApothecaryService.js";
import {
  deleteModuleCalendarEventsForRecord,
  syncModuleCalendarEvents
} from "../services/moduleCalendarService.js";

const productTypeOptions = ["Soap", "Candle", "Balm / Salve", "Lotion / Cream", "Infused Oil", "Other"];
const statusOptions = ["Planning", "In Production", "Curing", "Setting", "Infusing", "Ready for Sale", "Archived"];
const materialCategories = ["Oil / Butter", "Wax", "Lye / Alkali", "Liquid", "Fragrance / Essential Oil", "Herb / Botanical", "Colorant", "Preservative", "Container", "Label / Packaging", "Other"];
const productUnits = ["each", "bars", "jars", "tins", "bottles", "candles", "oz", "lb"];

const eventTypesByProductType = {
  Soap: ["Mix", "Pour", "Unmold", "Cut", "Cure Started", "Cure Complete", "Package", "Other"],
  Candle: ["Melt Wax", "Add Fragrance", "Pour", "Wick Trim", "Cure Started", "Cure Complete", "Package", "Other"],
  "Balm / Salve": ["Infuse Oil", "Melt", "Pour", "Set", "Label", "Package", "Other"],
  "Lotion / Cream": ["Water Phase", "Oil Phase", "Emulsify", "Cool Down", "Preservative Added", "Package", "Other"],
  "Infused Oil": ["Infusion Started", "Shake / Stir", "Strain", "Bottle", "Label", "Other"],
  Other: ["Start", "Mix", "Pour", "Set", "Package", "Other"]
};

const blankBatch = {
  name: "",
  productType: "Soap",
  status: "Planning",
  batchDate: "",
  targetReadyDate: "",
  actualReadyDate: "",
  targetYield: "",
  actualYield: "",
  yieldUnit: "each",
  cureDays: "",
  shelfLifeDays: "",
  infusionDays: "",
  fragranceLoadPercent: "",
  notes: "",
  materials: [],
  productionEvents: [],
  finishedProducts: []
};

const blankMaterial = {
  id: "",
  date: "",
  category: "Oil / Butter",
  name: "",
  quantity: "",
  unit: "",
  cost: "",
  supplier: ""
};

const blankEvent = {
  id: "",
  date: "",
  eventType: "Mix",
  quantity: "",
  unit: "",
  notes: ""
};

function createBlankProduct() {
  return {
    id: "",
    name: "",
    quantity: "",
    unit: "each",
    costMode: "batchAverage",
    manualCostPerUnit: "",
    retailPrice: "",
    wholesalePrice: "",
    notes: ""
  };
}

function uniqueId(prefix) {
  return `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function toNumber(value) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function round(value, places = 2) {
  return Number(value || 0).toFixed(places);
}

function cleanCurrency(value) {
  if (value === "" || value === null || value === undefined) return "";
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed.toFixed(2) : "";
}

function cleanNumber(value, places = 2) {
  if (value === "" || value === null || value === undefined) return "";
  const parsed = Number(value);
  return Number.isFinite(parsed) ? Number(parsed.toFixed(places)).toString() : "";
}

function money(value) {
  return `$${round(value, 2)}`;
}

function getMaterialTotal(batch) {
  return (batch.materials || []).reduce((sum, item) => sum + toNumber(item.cost), 0);
}

function getFinishedQuantityTotal(batch) {
  return (batch.finishedProducts || []).reduce((sum, item) => sum + toNumber(item.quantity), 0);
}

function getBatchAverageUnitCost(batch) {
  const quantity = getFinishedQuantityTotal(batch);
  return quantity ? getMaterialTotal(batch) / quantity : 0;
}

function getProductUnitCost(batch, product) {
  if (product.costMode === "manual") return toNumber(product.manualCostPerUnit);
  return getBatchAverageUnitCost(batch);
}

function getProductAllocatedCost(batch, product) {
  return getProductUnitCost(batch, product) * toNumber(product.quantity);
}

function getTimingField(productType) {
  if (productType === "Infused Oil") return "infusionDays";
  if (productType === "Lotion / Cream") return "shelfLifeDays";
  return "cureDays";
}

function getTimingLabel(productType) {
  if (productType === "Infused Oil") return "Infusion Days";
  if (productType === "Lotion / Cream") return "Shelf Life Days";
  if (productType === "Soap" || productType === "Candle") return "Cure Days";
  return "Rest / Set Days";
}

function addDays(dateValue, daysValue) {
  if (!dateValue || !toNumber(daysValue)) return "";
  const date = new Date(`${dateValue}T00:00:00`);
  if (Number.isNaN(date.getTime())) return "";
  date.setDate(date.getDate() + toNumber(daysValue));
  return date.toISOString().slice(0, 10);
}

function getReadyDate(batch) {
  return (
    batch.actualReadyDate ||
    batch.targetReadyDate ||
    addDays(batch.batchDate, batch[getTimingField(batch.productType)])
  );
}

function getProductCategory(productType) {
  if (productType === "Candle") return "Home Goods";
  if (["Soap", "Balm / Salve", "Lotion / Cream", "Infused Oil"].includes(productType)) return "Body & Home";
  return "Apothecary";
}

function makeProductId(batchId, productName) {
  return `apothecary-${batchId}-${String(productName || "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")}`;
}

function defaultBatchName(productType) {
  return `${productType || "Apothecary"} Batch - ${new Date().getFullYear()}`;
}

function getApothecaryCalendarEvents(batch) {
  if (!batch?.id) return [];

  const batchName = batch.name || defaultBatchName(batch.productType);
  const productType = batch.productType || "Apothecary";
  const events = [];
  const readyDate = getReadyDate(batch);

  if (readyDate) {
    events.push({
      sourceModuleKey: "farm-apothecary",
      sourceModule: "Farm Apothecary",
      sourceRecordId: batch.id,
      sourceEventType: "ready-date",
      title: `Ready: ${batchName}`,
      type: "Production",
      date: readyDate,
      sourcePath: "/farm-apothecary",
      accent: "apothecary",
      notes: batch.notes || "",
      details: {
        batchName,
        productType,
        status: batch.status || "",
        targetYield: batch.targetYield || "",
        actualYield: batch.actualYield || "",
        yieldUnit: batch.yieldUnit || "",
        timingLabel: getTimingLabel(productType),
        readyDate,
        eventLabel: "Ready Date"
      }
    });
  }

  if (batch.targetReadyDate && batch.targetReadyDate !== readyDate) {
    events.push({
      sourceModuleKey: "farm-apothecary",
      sourceModule: "Farm Apothecary",
      sourceRecordId: batch.id,
      sourceEventType: "target-ready-date",
      title: `Target ready: ${batchName}`,
      type: "Production",
      date: batch.targetReadyDate,
      sourcePath: "/farm-apothecary",
      accent: "apothecary",
      notes: batch.notes || "",
      details: {
        batchName,
        productType,
        status: batch.status || "",
        targetYield: batch.targetYield || "",
        yieldUnit: batch.yieldUnit || "",
        eventLabel: "Target Ready Date"
      }
    });
  }

  if (batch.actualReadyDate && batch.actualReadyDate !== readyDate) {
    events.push({
      sourceModuleKey: "farm-apothecary",
      sourceModule: "Farm Apothecary",
      sourceRecordId: batch.id,
      sourceEventType: "actual-ready-date",
      title: `Actually ready: ${batchName}`,
      type: "Production",
      date: batch.actualReadyDate,
      sourcePath: "/farm-apothecary",
      accent: "apothecary",
      notes: batch.notes || "",
      details: {
        batchName,
        productType,
        status: batch.status || "",
        actualYield: batch.actualYield || "",
        yieldUnit: batch.yieldUnit || "",
        eventLabel: "Actual Ready Date"
      }
    });
  }

  (batch.productionEvents || []).forEach((productionEvent, index) => {
    if (!productionEvent.date) return;

    events.push({
      sourceModuleKey: "farm-apothecary",
      sourceModule: "Farm Apothecary",
      sourceRecordId: batch.id,
      sourceEventType: `production-event-${productionEvent.id || index}`,
      title: `${productionEvent.eventType || "Production"}: ${batchName}`,
      type: "Production",
      date: productionEvent.date,
      sourcePath: "/farm-apothecary",
      accent: "apothecary",
      notes: productionEvent.notes || batch.notes || "",
      details: {
        batchName,
        productType,
        status: batch.status || "",
        eventType: productionEvent.eventType || "",
        quantity: productionEvent.quantity || "",
        unit: productionEvent.unit || batch.yieldUnit || "",
        eventLabel: productionEvent.eventType || `Production Event #${index + 1}`
      }
    });
  });

  return events;
}

function normalizeBatch(batch) {
  return {
    ...blankBatch,
    ...batch,
    materials: (batch.materials || batch.ingredients || []).map((item) => ({
      ...blankMaterial,
      ...item,
      id: item.id || uniqueId("material")
    })),
    productionEvents: (batch.productionEvents || []).map((item) => ({
      ...blankEvent,
      ...item,
      id: item.id || uniqueId("event")
    })),
    finishedProducts: (batch.finishedProducts || []).map((item) => ({
      ...createBlankProduct(),
      ...item,
      id: item.id || uniqueId("product")
    }))
  };
}

export default function FarmApothecary() {
  const { user, loginWithGoogle } = useAuth();
  const { isDirty: hasUnsavedChanges, markUnsaved, markSaved } = useUnsavedChanges();

  const editorRef = useRef(null);
  const [batches, setBatches] = useState([]);
  const [mode, setMode] = useState("idle");
  const [selectedBatchId, setSelectedBatchId] = useState("");
  const [batchForm, setBatchForm] = useState(blankBatch);
  const [batchSearch, setBatchSearch] = useState("");
  const [statusMessage, setStatusMessage] = useState("");
  const [statusType, setStatusType] = useState("info");
  const [loading, setLoading] = useState(false);
  const [savingInventory, setSavingInventory] = useState(false);
  const [savingProducts, setSavingProducts] = useState(false);
  const [showBackToTop, setShowBackToTop] = useState(false);
  const [showGuide, setShowGuide] = useState(false);

  function showStatus(message, type = "info") {
    setStatusMessage(message);
    setStatusType(type);
  }

  function markApothecaryDirty() {
    markUnsaved({
      source: "Farm Apothecary",
      onSave: saveBatch
    });
  }

  function scrollToEditor() {
    editorRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  function scrollToTop() {
    window.scrollTo({ top: 0, behavior: "smooth" });
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

    const timer = window.setTimeout(() => setStatusMessage(""), 3000);
    return () => window.clearTimeout(timer);
  }, [statusMessage]);

  useEffect(() => {
    const guideHidden = localStorage.getItem("hideModuleGuide_farm-apothecary") === "true";
    if (!guideHidden) setShowGuide(true);
  }, []);

  async function loadData() {
    if (!user) return;

    setLoading(true);

    try {
      const loaded = await getApothecaryBatches(user.uid);
      setBatches(loaded.map(normalizeBatch));
    } catch (error) {
      console.error(error);
      showStatus("Could not load Farm Apothecary data.", "error");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (user) {
      loadData();
    } else {
      setBatches([]);
      setSelectedBatchId("");
      setBatchForm(blankBatch);
      setMode("idle");
    }
  }, [user]);

  const filteredBatches = useMemo(() => {
    const search = batchSearch.trim().toLowerCase();

    if (!search) return batches;

    return batches.filter((batch) => {
      return (
        batch.name?.toLowerCase().includes(search) ||
        batch.productType?.toLowerCase().includes(search) ||
        batch.status?.toLowerCase().includes(search)
      );
    });
  }, [batches, batchSearch]);

  const eventTypes = eventTypesByProductType[batchForm.productType] || eventTypesByProductType.Other;
  const hasBatchContext = mode !== "idle";

  const batchSummary = useMemo(() => {
    return {
      materialCost: getMaterialTotal(batchForm),
      finishedQuantity: getFinishedQuantityTotal(batchForm),
      unitCost: getBatchAverageUnitCost(batchForm),
      readyDate: getReadyDate(batchForm)
    };
  }, [batchForm]);

  const moduleSummary = useMemo(() => {
    const activeBatches = batches.filter((batch) => batch.status !== "Archived");
    const materialCost = batches.reduce((sum, batch) => sum + getMaterialTotal(batch), 0);
    const finishedProducts = batches.reduce(
      (sum, batch) => sum + (batch.finishedProducts || []).filter((item) => item.name && toNumber(item.quantity) > 0).length,
      0
    );
    const readyBatches = batches.filter((batch) => batch.status === "Ready for Sale").length;

    return {
      activeBatches: activeBatches.length,
      materialCost,
      finishedProducts,
      readyBatches
    };
  }, [batches]);

  const canPushProducts = Boolean(
    batchForm.id &&
      (batchForm.finishedProducts || []).some((product) => product.name && toNumber(product.quantity) > 0)
  );

  function startNewBatch() {
    setMode("create");
    setSelectedBatchId("");
    setBatchForm({
      ...blankBatch,
      materials: [],
      productionEvents: [],
      finishedProducts: []
    });
    markSaved();
    window.setTimeout(scrollToEditor, 50);
  }

  function chooseExistingBatch(batchId) {
    setSelectedBatchId(batchId);

    const batch = batches.find((item) => item.id === batchId);

    if (!batch) {
      setMode("idle");
      setBatchForm(blankBatch);
      markSaved();
      return;
    }

    setMode("edit");
    setBatchForm(normalizeBatch(batch));
    markSaved();
    window.setTimeout(scrollToEditor, 50);
  }

  function updateBatchField(field, value) {
    setBatchForm((current) => {
      const next = { ...current, [field]: value };

      if (field === "productType") {
        const nextEventType = (eventTypesByProductType[value] || eventTypesByProductType.Other)[0];
        next.productionEvents = (current.productionEvents || []).map((item) => ({
          ...item,
          eventType: item.eventType || nextEventType
        }));
      }

      return next;
    });

    markApothecaryDirty();
  }

  function addMaterial() {
    setBatchForm((current) => ({
      ...current,
      materials: [...(current.materials || []), { ...blankMaterial, id: uniqueId("material") }]
    }));
    markApothecaryDirty();
  }

  function updateMaterial(index, field, value) {
    setBatchForm((current) => {
      const materials = [...(current.materials || [])];
      materials[index] = { ...materials[index], [field]: value };
      return { ...current, materials };
    });
    markApothecaryDirty();
  }

  function removeMaterial(index) {
    setBatchForm((current) => ({
      ...current,
      materials: (current.materials || []).filter((_, itemIndex) => itemIndex !== index)
    }));
    markApothecaryDirty();
  }

  function addEvent() {
    setBatchForm((current) => ({
      ...current,
      productionEvents: [
        ...(current.productionEvents || []),
        {
          ...blankEvent,
          id: uniqueId("event"),
          eventType: (eventTypesByProductType[current.productType] || eventTypesByProductType.Other)[0],
          unit: current.yieldUnit || "each"
        }
      ]
    }));
    markApothecaryDirty();
  }

  function updateEvent(index, field, value) {
    setBatchForm((current) => {
      const productionEvents = [...(current.productionEvents || [])];
      productionEvents[index] = { ...productionEvents[index], [field]: value };
      return { ...current, productionEvents };
    });
    markApothecaryDirty();
  }

  function removeEvent(index) {
    setBatchForm((current) => ({
      ...current,
      productionEvents: (current.productionEvents || []).filter((_, itemIndex) => itemIndex !== index)
    }));
    markApothecaryDirty();
  }

  function addProduct() {
    setBatchForm((current) => ({
      ...current,
      finishedProducts: [
        ...(current.finishedProducts || []),
        { ...createBlankProduct(), id: uniqueId("product"), unit: current.yieldUnit || "each" }
      ]
    }));
    markApothecaryDirty();
  }

  function updateProduct(index, field, value) {
    setBatchForm((current) => {
      const finishedProducts = [...(current.finishedProducts || [])];
      finishedProducts[index] = { ...finishedProducts[index], [field]: value };
      return { ...current, finishedProducts };
    });
    markApothecaryDirty();
  }

  function removeProduct(index) {
    setBatchForm((current) => ({
      ...current,
      finishedProducts: (current.finishedProducts || []).filter((_, itemIndex) => itemIndex !== index)
    }));
    markApothecaryDirty();
  }

  function cleanBatchForSave() {
    return {
      ...batchForm,
      name: batchForm.name.trim() || defaultBatchName(batchForm.productType),
      targetYield: cleanNumber(batchForm.targetYield, 2),
      actualYield: cleanNumber(batchForm.actualYield, 2),
      cureDays: cleanNumber(batchForm.cureDays, 0),
      shelfLifeDays: cleanNumber(batchForm.shelfLifeDays, 0),
      infusionDays: cleanNumber(batchForm.infusionDays, 0),
      fragranceLoadPercent: cleanNumber(batchForm.fragranceLoadPercent, 2),
      notes: batchForm.notes.trim(),
      materials: (batchForm.materials || [])
        .filter((item) => item.name || item.cost || item.category)
        .map((item) => ({
          ...item,
          id: item.id || uniqueId("material"),
          name: item.name?.trim() || "",
          quantity: cleanNumber(item.quantity, 3),
          cost: cleanCurrency(item.cost),
          supplier: item.supplier?.trim() || ""
        })),
      productionEvents: (batchForm.productionEvents || [])
        .filter((item) => item.date || item.eventType || item.quantity || item.notes)
        .map((item) => ({
          ...item,
          id: item.id || uniqueId("event"),
          quantity: cleanNumber(item.quantity, 2),
          notes: item.notes?.trim() || ""
        })),
      finishedProducts: (batchForm.finishedProducts || [])
        .filter((item) => item.name || item.quantity)
        .map((item) => ({
          ...item,
          id: item.id || uniqueId("product"),
          name: item.name?.trim() || "",
          quantity: cleanNumber(item.quantity, 2),
          costMode: item.costMode || "batchAverage",
          manualCostPerUnit: cleanCurrency(item.manualCostPerUnit),
          retailPrice: cleanCurrency(item.retailPrice),
          wholesalePrice: cleanCurrency(item.wholesalePrice),
          notes: item.notes?.trim() || ""
        }))
    };
  }

  async function saveBatch(event) {
    event?.preventDefault?.();

    if (!user) return;

    const cleanBatch = cleanBatchForSave();

    if (!cleanBatch.name.trim()) {
      showStatus("Batch name is required.", "error");
      return;
    }

    try {
      let savedId = cleanBatch.id || selectedBatchId;

      if (mode === "edit" && savedId) {
        await updateApothecaryBatch(user.uid, savedId, cleanBatch);
        showStatus("Batch changes saved.", "success");
      } else {
        savedId = await createApothecaryBatch(user.uid, cleanBatch);
        showStatus("New apothecary batch saved.", "success");
      }

      const nextBatch = { ...cleanBatch, id: savedId };

      await deleteModuleCalendarEventsForRecord(user.uid, {
        sourceModuleKey: "farm-apothecary",
        sourceRecordId: savedId
      });

      await syncModuleCalendarEvents(user.uid, getApothecaryCalendarEvents(nextBatch));

      setMode("edit");
      setSelectedBatchId(savedId);
      setBatchForm(nextBatch);
      markSaved();
      await loadData();
    } catch (error) {
      console.error(error);
      showStatus("Could not save apothecary batch.", "error");
    }
  }

  async function removeBatch(batchId) {
    if (!user) return;

    const confirmed = window.confirm("Delete this apothecary batch? This cannot be undone.");
    if (!confirmed) return;

    try {
      await deleteApothecaryBatch(user.uid, batchId);
      await deleteModuleCalendarEventsForRecord(user.uid, {
        sourceModuleKey: "farm-apothecary",
        sourceRecordId: batchId
      });
      showStatus("Apothecary batch deleted.", "success");

      if (selectedBatchId === batchId) {
        setSelectedBatchId("");
        setMode("idle");
        setBatchForm(blankBatch);
        markSaved();
      }

      await loadData();
    } catch (error) {
      console.error(error);
      showStatus("Could not delete apothecary batch.", "error");
    }
  }

  async function addProductsToInventory() {
    if (!user || !batchForm.id) {
      showStatus("Save the batch before adding products to Inventory.", "error");
      return;
    }

    if (hasUnsavedChanges) {
      showStatus("Save batch changes before adding products to Inventory.", "error");
      return;
    }

    const validProducts = (batchForm.finishedProducts || []).filter(
      (product) => product.name && toNumber(product.quantity) > 0
    );

    if (!validProducts.length) {
      showStatus("Add finished products before sending them to Inventory.", "error");
      return;
    }

    setSavingInventory(true);

    try {
      await Promise.all(
        validProducts.map((product) => {
          const quantity = toNumber(product.quantity);
          const unit = product.unit || "each";
          const productId = makeProductId(batchForm.id, product.name);

          return addQuantityToMatchedInventoryItem({
            userId: user.uid,
            match: {
              productId,
              variantName: unit,
              sourceModule: "Farm Apothecary"
            },
            itemDefaults: {
              name: `${batchForm.name} - ${product.name}`,
              category: getProductCategory(batchForm.productType),
              sourceModule: "Farm Apothecary",
              productId,
              productName: product.name,
              recipeId: batchForm.id,
              recipeName: batchForm.name,
              variantId: `${productId}-${unit}`,
              variantName: unit,
              quantityOnHand: 0,
              unit,
              costPerUnit: cleanCurrency(getProductUnitCost(batchForm, product)),
              retailPrice: cleanCurrency(product.retailPrice),
              wholesalePrice: cleanCurrency(product.wholesalePrice),
              status: "In Stock",
              notes:
                product.notes ||
                `Added from Farm Apothecary batch ${batchForm.name}. Product type: ${batchForm.productType}.`
            },
            quantityToAdd: quantity
          });
        })
      );

      showStatus("Finished products added to Inventory.", "success");
    } catch (error) {
      console.error(error);
      showStatus("Could not add products to Inventory.", "error");
    } finally {
      setSavingInventory(false);
    }
  }

  async function addProductsToProductDirectory() {
    if (!user || !batchForm.id) {
      showStatus("Save the batch before adding products to Products & Pricing.", "error");
      return;
    }

    if (hasUnsavedChanges) {
      showStatus("Save batch changes before adding products to Products & Pricing.", "error");
      return;
    }

    const validProducts = (batchForm.finishedProducts || []).filter(
      (product) => product.name && toNumber(product.quantity) > 0
    );

    if (!validProducts.length) {
      showStatus("Add finished products before creating Product Directory items.", "error");
      return;
    }

    setSavingProducts(true);

    try {
      await Promise.all(
        validProducts.map((product) => {
          const quantity = toNumber(product.quantity);
          const unit = product.unit || "each";
          const productId = makeProductId(batchForm.id, product.name);

          return saveProduct(user.uid, {
            id: productId,
            name: product.name,
            category: getProductCategory(batchForm.productType),
            status: "Active",
            sku: "",
            unitLabel: unit,
            description: `${batchForm.productType} product from ${batchForm.name}.`,
            retailPrice: cleanCurrency(product.retailPrice),
            wholesalePrice: cleanCurrency(product.wholesalePrice),
            targetRetailMargin: 70,
            targetWholesaleMargin: 50,
            batchIngredientCost: cleanCurrency(getProductAllocatedCost(batchForm, product)),
            batchUnits: cleanNumber(quantity, 2),
            packagingCostPerUnit: "",
            laborHours: "",
            laborRate: "",
            overheadCost: "",
            notes:
              product.notes ||
              `Created from Farm Apothecary. Batch: ${batchForm.name}. Estimated quantity: ${round(quantity, 2)} ${unit}.`,
            sourceType: "farm-apothecary",
            sourceLabel: "Farm Apothecary",
            sourceBatchId: batchForm.id,
            sourceProductName: product.name,
            generatedVariants: [],
            imageUrl: "",
            imagePath: "",
            selectedVariantId: "",
            selectedVariantName: ""
          });
        })
      );

      showStatus("Finished products added to Products & Pricing.", "success");
    } catch (error) {
      console.error(error);
      showStatus("Could not add products to Products & Pricing.", "error");
    } finally {
      setSavingProducts(false);
    }
  }

  const sectionCards = [
    {
      title: "Create New Batch",
      description: "Start a soap, candle, balm, lotion, infused oil, or other apothecary batch.",
      icon: Plus,
      action: startNewBatch
    },
    {
      title: "Edit Existing Batch",
      description: "Pick one saved batch and edit details, materials, events, and products.",
      icon: Edit3,
      action: () => {
        setMode("select");
        setBatchForm(blankBatch);
        setSelectedBatchId("");
        markSaved();
        window.setTimeout(scrollToEditor, 50);
      }
    }
  ];

  if (!user) {
    return (
      <div className="modulePage apothecaryModule">
        <ModuleHero
          eyebrow="Farm Apothecary"
          title="Sign in to manage apothecary batches."
          description="Track soaps, candles, balms, lotions, infused oils, materials, production events, finished products, and inventory from your Market Vendor Toolkit account."
          className="apothecaryHero"
          actions={[
            {
              label: "Sign in with Google",
              onClick: loginWithGoogle
            }
          ]}
        />
      </div>
    );
  }

  return (
    <div className="modulePage apothecaryModule">
      {statusMessage ? (
        <div className={`floatingStatus ${statusType}`}>
          <AlertCircle size={18} />
          <span>{statusMessage}</span>
          <button type="button" onClick={() => setStatusMessage("")}>
            <X size={16} />
          </button>
        </div>
      ) : null}

      {loading ? <div className="floatingStatus info">Loading Farm Apothecary...</div> : null}

      <ModuleHero
        eyebrow="Farm Apothecary"
        title="Track soap, candle, balm, lotion, and infused product batches."
        description="Create or edit one working batch at a time, then manage materials, production events, finished products, pricing, and inventory from one central workspace."
        className="apothecaryHero"
        actions={[
          {
            label: "Guide",
            icon: CircleHelp,
            variant: "secondary",
            onClick: () => setShowGuide(true)
          }
        ]}
      />

      <section className="hubStatGrid apothecaryStatGrid">
        <StatCard
          icon={Leaf}
          label="Active Batches"
          value={moduleSummary.activeBatches}
          sub="batches tracked"
          accent="apothecary"
        />

        <StatCard
          icon={ClipboardList}
          label="Material Cost"
          value={money(moduleSummary.materialCost)}
          sub="saved materials"
          accent="pricing"
        />

        <StatCard
          icon={PackageCheck}
          label="Finished Products"
          value={moduleSummary.finishedProducts}
          sub="saved products"
          accent="inventory"
        />

        <StatCard
          icon={CalendarDays}
          label="Ready Batches"
          value={moduleSummary.readyBatches}
          sub="ready for sale"
          accent="market"
        />
      </section>

      <section className="toolGrid compactToolGrid apothecaryModeGrid">
        {sectionCards.map((card) => {
          const Icon = card.icon;

          return (
            <button
              className="toolCard compactToolCard clickableToolCard apothecaryModeCard"
              key={card.title}
              type="button"
              onClick={card.action}
            >
              <Icon size={22} />
              <h3>{card.title}</h3>
              <p>{card.description}</p>
            </button>
          );
        })}
      </section>

      <section className="workspacePanel compactPanel apothecaryEditorPanel" ref={editorRef}>
        <div className="workspaceHeader compactPanelHeader">
          <div>
            <p className="eyebrow">Working Batch</p>
            <h3>
              {mode === "create"
                ? "Create New Batch"
                : mode === "edit"
                  ? `Editing ${batchForm.name || "Saved Batch"}`
                  : "Select or create a batch"}
            </h3>
          </div>

          {mode === "edit" || mode === "create" ? (
            <div className="apothecaryEditorActions">
              <button
                className={`primaryButton compactPrimary ${
                  hasUnsavedChanges ? "dirtySaveButton" : ""
                }`}
                type="button"
                onClick={saveBatch}
              >
                <Save size={15} />
                {mode === "create" ? "Save Batch" : "Save Changes"}
              </button>

              <button
                className="secondaryButton compactButton"
                type="button"
                onClick={() => {
                  setMode("idle");
                  setSelectedBatchId("");
                  setBatchForm(blankBatch);
                  markSaved();
                }}
              >
                Clear
              </button>
            </div>
          ) : null}
        </div>

        {mode === "select" || mode === "idle" ? (
          <div className="apothecarySelectPanel">
            <div className="searchBox compactSearch">
              <Search size={17} />
              <input
                value={batchSearch}
                onChange={(event) => setBatchSearch(event.target.value)}
                placeholder="Search saved batches..."
              />
            </div>

            <div className="savedList compactSavedList apothecarySavedList">
              {filteredBatches.length ? (
                filteredBatches.map((batch) => (
                  <div
                    className="savedItem compactSavedItem apothecarySavedItem clickableApothecaryBatch"
                    key={batch.id}
                    role="button"
                    tabIndex={0}
                    onClick={() => chooseExistingBatch(batch.id)}
                    onKeyDown={(event) => {
                      if (event.key === "Enter" || event.key === " ") {
                        event.preventDefault();
                        chooseExistingBatch(batch.id);
                      }
                    }}
                  >
                    <div>
                      <h4>{batch.name}</h4>
                      <p>
                        {batch.productType}
                        {batch.status ? ` • ${batch.status}` : ""}
                        {batch.actualYield || batch.targetYield
                          ? ` • ${batch.actualYield || batch.targetYield} ${batch.yieldUnit}`
                          : ""}
                      </p>
                    </div>

                    <div className="itemActions">
                      <button
                        type="button"
                        onClick={(event) => {
                          event.stopPropagation();
                          chooseExistingBatch(batch.id);
                        }}
                      >
                        <Edit3 size={14} />
                      </button>

                      <button
                        type="button"
                        onClick={(event) => {
                          event.stopPropagation();
                          removeBatch(batch.id);
                        }}
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                ))
              ) : (
                <div className="placeholderBox compactPlaceholder">
                  No saved apothecary batches yet. Use Create New Batch to get started.
                </div>
              )}
            </div>
          </div>
        ) : null}

        {hasBatchContext ? (
          <>
            <section className="apothecaryWorkingSummary">
              <StatCard
                icon={DollarSign}
                label="Material Cost"
                value={money(batchSummary.materialCost)}
                sub="ingredients + supplies"
                accent="pricing"
              />

              <StatCard
                icon={PackageCheck}
                label="Finished Qty"
                value={round(batchSummary.finishedQuantity, 2)}
                sub={batchForm.yieldUnit || "units"}
                accent="inventory"
              />

              <StatCard
                icon={FlaskConical}
                label="Cost / Unit"
                value={money(batchSummary.unitCost)}
                sub="batch average"
                accent="apothecary"
              />

              <StatCard
                icon={CalendarDays}
                label="Ready Date"
                value={batchSummary.readyDate || "Not set"}
                sub={getTimingLabel(batchForm.productType)}
                accent="market"
              />
            </section>

            <section className="apothecaryFlowGrid compactWorkspace">
              <div className="workspacePanel compactPanel apothecarySubPanel">
                <div className="workspaceHeader compactPanelHeader">
                  <div>
                    <p className="eyebrow">Batch Details</p>
                    <h3>Product Batch</h3>
                  </div>
                </div>

                <div className="formGrid compactFormGrid">
                  <label>
                    Batch Name
                    <input
                      value={batchForm.name}
                      onChange={(event) => updateBatchField("name", event.target.value)}
                      placeholder="e.g., Lavender Goat Milk Soap"
                    />
                  </label>

                  <label>
                    Product Type
                    <select
                      value={batchForm.productType}
                      onChange={(event) => updateBatchField("productType", event.target.value)}
                    >
                      {productTypeOptions.map((productType) => (
                        <option key={productType}>{productType}</option>
                      ))}
                    </select>
                  </label>

                  <label>
                    Status
                    <select
                      value={batchForm.status}
                      onChange={(event) => updateBatchField("status", event.target.value)}
                    >
                      {statusOptions.map((status) => (
                        <option key={status}>{status}</option>
                      ))}
                    </select>
                  </label>

                  <label>
                    Batch Date
                    <input
                      type="date"
                      value={batchForm.batchDate}
                      onChange={(event) => updateBatchField("batchDate", event.target.value)}
                    />
                  </label>

                  <label>
                    Target Ready Date
                    <input
                      type="date"
                      value={batchForm.targetReadyDate}
                      onChange={(event) =>
                        updateBatchField("targetReadyDate", event.target.value)
                      }
                    />
                  </label>

                  <label>
                    Actual Ready Date
                    <input
                      type="date"
                      value={batchForm.actualReadyDate}
                      onChange={(event) =>
                        updateBatchField("actualReadyDate", event.target.value)
                      }
                    />
                  </label>

                  <label>
                    Target Yield
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={batchForm.targetYield}
                      onChange={(event) => updateBatchField("targetYield", event.target.value)}
                      placeholder="e.g., 48"
                    />
                  </label>

                  <label>
                    Actual Yield
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={batchForm.actualYield}
                      onChange={(event) => updateBatchField("actualYield", event.target.value)}
                      placeholder="e.g., 46"
                    />
                  </label>

                  <label>
                    Yield Unit
                    <select
                      value={batchForm.yieldUnit}
                      onChange={(event) => updateBatchField("yieldUnit", event.target.value)}
                    >
                      {productUnits.map((unit) => (
                        <option key={unit}>{unit}</option>
                      ))}
                    </select>
                  </label>

                  <label>
                    {getTimingLabel(batchForm.productType)}
                    <input
                      type="number"
                      step="1"
                      min="0"
                      value={batchForm[getTimingField(batchForm.productType)]}
                      onChange={(event) =>
                        updateBatchField(getTimingField(batchForm.productType), event.target.value)
                      }
                      placeholder="e.g., 28"
                    />
                  </label>

                  {batchForm.productType === "Candle" ? (
                    <label>
                      Fragrance Load %
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        value={batchForm.fragranceLoadPercent}
                        onChange={(event) =>
                          updateBatchField("fragranceLoadPercent", event.target.value)
                        }
                        placeholder="e.g., 8"
                      />
                    </label>
                  ) : null}

                  <div className="apothecaryCalculatedField">
                    <span>Estimated Ready Date</span>
                    <strong>{batchSummary.readyDate || "Not set"}</strong>
                  </div>

                  <label className="fullSpan">
                    Notes
                    <textarea
                      value={batchForm.notes}
                      onChange={(event) => updateBatchField("notes", event.target.value)}
                      placeholder="Recipe notes, safety notes, scent blend, label notes..."
                    />
                  </label>
                </div>
              </div>

              <div className="workspacePanel compactPanel apothecarySubPanel">
                <div className="workspaceHeader compactPanelHeader">
                  <div>
                    <p className="eyebrow">Ingredient & Supply Log</p>
                    <h3>Materials</h3>
                  </div>

                  <button className="secondaryButton compactButton" type="button" onClick={addMaterial}>
                    <Plus size={15} />
                    Add Material
                  </button>
                </div>

                {(batchForm.materials || []).length ? (
                  <div className="apothecaryTableWrap">
                    <div className="apothecaryIngredientTable apothecaryEditableTable">
                      <div className="apothecaryTableHeader">
                        <span>Date</span>
                        <span>Category</span>
                        <span>Material</span>
                        <span>Qty</span>
                        <span>Unit</span>
                        <span>Cost</span>
                        <span>Supplier</span>
                        <span></span>
                      </div>

                      {batchForm.materials.map((material, index) => (
                        <div className="apothecaryTableRow" key={material.id || index}>
                          <input
                            type="date"
                            value={material.date}
                            onChange={(event) => updateMaterial(index, "date", event.target.value)}
                          />

                          <select
                            value={material.category}
                            onChange={(event) => updateMaterial(index, "category", event.target.value)}
                          >
                            {materialCategories.map((category) => (
                              <option key={category}>{category}</option>
                            ))}
                          </select>

                          <input
                            value={material.name}
                            onChange={(event) => updateMaterial(index, "name", event.target.value)}
                            placeholder="e.g., olive oil, soy wax, jar"
                          />

                          <input
                            type="number"
                            step="0.001"
                            min="0"
                            value={material.quantity}
                            onChange={(event) => updateMaterial(index, "quantity", event.target.value)}
                            placeholder="24"
                          />

                          <input
                            value={material.unit}
                            onChange={(event) => updateMaterial(index, "unit", event.target.value)}
                            placeholder="oz"
                          />

                          <input
                            type="number"
                            step="0.01"
                            min="0"
                            value={material.cost}
                            onChange={(event) => updateMaterial(index, "cost", event.target.value)}
                            onBlur={(event) => updateMaterial(index, "cost", cleanCurrency(event.target.value))}
                            placeholder="5.25"
                          />

                          <input
                            value={material.supplier}
                            onChange={(event) => updateMaterial(index, "supplier", event.target.value)}
                            placeholder="Optional"
                          />

                          <button className="iconButton danger" type="button" onClick={() => removeMaterial(index)}>
                            <Trash2 size={14} />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="placeholderBox compactPlaceholder">
                    Add oils, waxes, butters, herbs, fragrance, containers, labels, and packaging.
                  </div>
                )}
              </div>

              <div className="workspacePanel compactPanel apothecarySubPanel">
                <div className="workspaceHeader compactPanelHeader">
                  <div>
                    <p className="eyebrow">Production Events</p>
                    <h3>Process Log</h3>
                  </div>

                  <button className="secondaryButton compactButton" type="button" onClick={addEvent}>
                    <Plus size={15} />
                    Add Event
                  </button>
                </div>

                {(batchForm.productionEvents || []).length ? (
                  <div className="apothecaryTableWrap">
                    <div className="apothecaryEventTable apothecaryEditableTable">
                      <div className="apothecaryTableHeader">
                        <span>Date</span>
                        <span>Event</span>
                        <span>Qty</span>
                        <span>Unit</span>
                        <span>Notes</span>
                        <span></span>
                      </div>

                      {batchForm.productionEvents.map((processEvent, index) => (
                        <div className="apothecaryTableRow" key={processEvent.id || index}>
                          <input
                            type="date"
                            value={processEvent.date}
                            onChange={(event) => updateEvent(index, "date", event.target.value)}
                          />

                          <select
                            value={processEvent.eventType}
                            onChange={(event) => updateEvent(index, "eventType", event.target.value)}
                          >
                            {eventTypes.map((eventType) => (
                              <option key={eventType}>{eventType}</option>
                            ))}
                          </select>

                          <input
                            type="number"
                            step="0.01"
                            min="0"
                            value={processEvent.quantity}
                            onChange={(event) => updateEvent(index, "quantity", event.target.value)}
                            placeholder="Optional"
                          />

                          <input
                            value={processEvent.unit}
                            onChange={(event) => updateEvent(index, "unit", event.target.value)}
                            placeholder={batchForm.yieldUnit || "each"}
                          />

                          <input
                            value={processEvent.notes}
                            onChange={(event) => updateEvent(index, "notes", event.target.value)}
                            placeholder="Process notes"
                          />

                          <button className="iconButton danger" type="button" onClick={() => removeEvent(index)}>
                            <Trash2 size={14} />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="placeholderBox compactPlaceholder">
                    Add process events like pour, cut, cure complete, wick trim, bottle, label, or package.
                  </div>
                )}
              </div>

              <div className="workspacePanel compactPanel apothecarySubPanel">
                <div className="workspaceHeader compactPanelHeader">
                  <div>
                    <p className="eyebrow">Finished Products</p>
                    <h3>Product Yield</h3>
                  </div>

                  <div className="apothecaryHeaderActions">
                    <button className="secondaryButton compactButton" type="button" onClick={addProduct}>
                      <Plus size={15} />
                      Add Product
                    </button>

                    <button
                      className="secondaryButton compactButton"
                      type="button"
                      onClick={addProductsToProductDirectory}
                      disabled={!canPushProducts || savingProducts}
                    >
                      <ShoppingBag size={15} />
                      {savingProducts ? "Adding..." : "Add to Products"}
                    </button>

                    <button
                      className={`primaryButton compactPrimary ${hasUnsavedChanges ? "dirtySaveButton" : ""}`}
                      type="button"
                      onClick={addProductsToInventory}
                      disabled={!canPushProducts || savingInventory}
                    >
                      <PackageCheck size={15} />
                      {savingInventory ? "Adding..." : "Add to Inventory"}
                    </button>
                  </div>
                </div>

                {(batchForm.finishedProducts || []).length ? (
                  <div className="apothecaryTableWrap">
                    <div className="apothecaryProductTable apothecaryEditableTable">
                      <div className="apothecaryTableHeader">
                        <span>Product</span>
                        <span>Qty</span>
                        <span>Unit</span>
                        <span>Cost Mode</span>
                        <span>Manual Cost</span>
                        <span>Retail</span>
                        <span>Wholesale</span>
                        <span>Est. Cost</span>
                        <span></span>
                      </div>

                      {batchForm.finishedProducts.map((product, index) => (
                        <div className="apothecaryTableRow" key={product.id || index}>
                          <input
                            value={product.name}
                            onChange={(event) => updateProduct(index, "name", event.target.value)}
                            placeholder="Lavender Soap Bar"
                          />

                          <input
                            type="number"
                            step="0.01"
                            min="0"
                            value={product.quantity}
                            onChange={(event) => updateProduct(index, "quantity", event.target.value)}
                            placeholder="48"
                          />

                          <select
                            value={product.unit}
                            onChange={(event) => updateProduct(index, "unit", event.target.value)}
                          >
                            {productUnits.map((unit) => (
                              <option key={unit}>{unit}</option>
                            ))}
                          </select>

                          <select
                            value={product.costMode || "batchAverage"}
                            onChange={(event) => updateProduct(index, "costMode", event.target.value)}
                          >
                            <option value="batchAverage">Batch average</option>
                            <option value="manual">Manual per unit</option>
                          </select>

                          <input
                            type="number"
                            step="0.01"
                            min="0"
                            value={product.manualCostPerUnit || ""}
                            onChange={(event) => updateProduct(index, "manualCostPerUnit", event.target.value)}
                            onBlur={(event) =>
                              updateProduct(index, "manualCostPerUnit", cleanCurrency(event.target.value))
                            }
                            placeholder="0.00"
                            disabled={(product.costMode || "batchAverage") !== "manual"}
                          />

                          <input
                            type="number"
                            step="0.01"
                            min="0"
                            value={product.retailPrice}
                            onChange={(event) => updateProduct(index, "retailPrice", event.target.value)}
                            onBlur={(event) => updateProduct(index, "retailPrice", cleanCurrency(event.target.value))}
                            placeholder="0.00"
                          />

                          <input
                            type="number"
                            step="0.01"
                            min="0"
                            value={product.wholesalePrice}
                            onChange={(event) => updateProduct(index, "wholesalePrice", event.target.value)}
                            onBlur={(event) =>
                              updateProduct(index, "wholesalePrice", cleanCurrency(event.target.value))
                            }
                            placeholder="0.00"
                          />

                          <div className="apothecaryTableCost">
                            <strong>{money(getProductUnitCost(batchForm, product))}</strong>
                            <span>
                              {round(toNumber(product.quantity), 2)} {product.unit}
                            </span>
                          </div>

                          <button className="iconButton danger" type="button" onClick={() => removeProduct(index)}>
                            <Trash2 size={14} />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="placeholderBox compactPlaceholder">
                    Add finished products like soap bars, candles, salve tins, lotion bottles, or infused oil bottles.
                  </div>
                )}
              </div>
            </section>

            <section className="workspacePanel compactPanel apothecaryBatchLog">
              <div className="workspaceHeader compactPanelHeader">
                <div>
                  <p className="eyebrow">Batch Log</p>
                  <h3>{batchForm.name || "Current Batch"} Summary</h3>
                </div>
              </div>

              <div className="apothecaryLogGrid">
                <div>
                  <h4>Materials</h4>
                  {(batchForm.materials || []).length ? (
                    batchForm.materials.map((material) => (
                      <p key={material.id}>
                        {material.date || "No date"} • {material.category} • {material.name || "No material"} • {money(material.cost)}
                      </p>
                    ))
                  ) : (
                    <p>No materials logged.</p>
                  )}
                </div>

                <div>
                  <h4>Events</h4>
                  {(batchForm.productionEvents || []).length ? (
                    batchForm.productionEvents.map((item) => (
                      <p key={item.id}>
                        {item.date || "No date"} • {item.eventType} • {item.quantity || 0} {item.unit || batchForm.yieldUnit}
                      </p>
                    ))
                  ) : (
                    <p>No production events logged.</p>
                  )}
                </div>

                <div>
                  <h4>Products</h4>
                  {(batchForm.finishedProducts || []).length ? (
                    batchForm.finishedProducts.map((product) => (
                      <p key={product.id}>
                        {product.name || "Unnamed product"} • {product.quantity || 0} {product.unit}
                      </p>
                    ))
                  ) : (
                    <p>No products logged.</p>
                  )}
                </div>
              </div>
            </section>
          </>
        ) : null}
      </section>

      {showBackToTop ? (
        <button className="backToTopButton" type="button" onClick={scrollToTop}>
          <ArrowUp size={18} />
          Top
        </button>
      ) : null}

      <ModuleGuideModal
        isOpen={showGuide}
        moduleKey="farm-apothecary"
        title="How to Use Farm Apothecary"
        onClose={() => setShowGuide(false)}
      >
        <FarmApothecaryGuideContent />
      </ModuleGuideModal>
    </div>
  );
}
