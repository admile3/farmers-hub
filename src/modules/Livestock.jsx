import { useEffect, useMemo, useRef, useState } from "react";
import {
  AlertCircle,
  ArrowUp,
  Beef,
  CalendarDays,
  CircleHelp,
  ClipboardList,
  DollarSign,
  Edit3,
  PackageCheck,
  Plus,
  Save,
  Search,
  Scale,
  ShoppingBag,
  Trash2,
  X
} from "lucide-react";

import { useAuth } from "../AuthContext.jsx";
import { useUnsavedChanges } from "../UnsavedChangesContext.jsx";
import ModuleHero from "../components/ModuleHero.jsx";
import ModuleGuideModal from "../components/ModuleGuideModal.jsx";
import LivestockGuideContent from "../components/LivestockGuideContent.jsx";
import StatCard from "../components/StatCard.jsx";
import { addQuantityToMatchedInventoryItem } from "../services/inventoryService.js";
import { saveProduct } from "../services/productService.js";
import {
  createLivestockBatch,
  deleteLivestockBatch,
  getLivestockBatches,
  updateLivestockBatch
} from "../services/livestockService.js";

const speciesOptions = [
  "Beef",
  "Pork",
  "Chicken",
  "Turkey",
  "Lamb",
  "Goat",
  "Rabbit",
  "Duck",
  "Other"
];

const batchStatusOptions = [
  "Planning",
  "Growing",
  "Processing Scheduled",
  "Partially Processed",
  "Processed",
  "Selling",
  "Sold Out",
  "Archived"
];

const inputCategories = [
  "Animal Purchase",
  "Feed",
  "Hay",
  "Minerals",
  "Bedding",
  "Vet / Health",
  "Processing",
  "Transportation",
  "Packaging",
  "Other"
];

const productUnits = ["lb", "packages", "each"];

const speciesProductCategory = {
  Beef: "Red Meat",
  Pork: "Red Meat",
  Lamb: "Red Meat",
  Goat: "Red Meat",
  Chicken: "Poultry",
  Turkey: "Poultry",
  Duck: "Poultry",
  Rabbit: "Protein",
  Other: "Protein"
};

const blankBatch = {
  name: "",
  species: "Beef",
  breed: "",
  status: "Planning",
  startDate: "",
  processingDate: "",
  pickupDate: "",
  startingHeadCount: "",
  currentHeadCount: "",
  startingWeight: "",
  purchasePricePerHead: "",
  purchaseCost: "",
  notes: "",
  inputs: [],
  processingEvents: [],
  cuts: []
};

const blankInput = {
  id: "",
  date: "",
  category: "Feed",
  description: "",
  quantity: "",
  unit: "",
  cost: ""
};

const blankProcessingEvent = {
  id: "",
  date: "",
  processor: "",
  headCountProcessed: "",
  liveWeight: "",
  hangingWeight: "",
  packagedWeight: "",
  processingFee: "",
  notes: ""
};

function createBlankCut() {
  return {
    id: "",
    name: "",
    quantity: "",
    unit: "lb",
    yieldPercent: "",
    processingEventId: "",
    costMode: "allocated",
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

function cleanWholeNumber(value) {
  if (value === "" || value === null || value === undefined) return "";
  const parsed = Number(value);
  return Number.isFinite(parsed) ? Math.max(0, Math.round(parsed)).toString() : "";
}

function money(value) {
  return `$${round(value, 2)}`;
}

function getAnimalPurchaseTotal(batch) {
  const pricePerHead = toNumber(batch.purchasePricePerHead);
  const headCount = toNumber(batch.startingHeadCount || batch.currentHeadCount);

  if (pricePerHead && headCount) return pricePerHead * headCount;

  return toNumber(batch.purchaseCost);
}

function getInputTotal(batch) {
  return (batch.inputs || []).reduce((sum, input) => sum + toNumber(input.cost), 0);
}

function getProcessingTotal(batch) {
  return (batch.processingEvents || []).reduce(
    (sum, event) => sum + toNumber(event.processingFee),
    0
  );
}

function getTotalBatchCost(batch) {
  return getAnimalPurchaseTotal(batch) + getInputTotal(batch) + getProcessingTotal(batch);
}

function getProcessedHeadCount(batch) {
  return (batch.processingEvents || []).reduce(
    (sum, event) => sum + toNumber(event.headCountProcessed),
    0
  );
}

function getTotalLiveWeight(batch) {
  return (batch.processingEvents || []).reduce(
    (sum, event) => sum + toNumber(event.liveWeight),
    0
  );
}

function getTotalHangingWeight(batch) {
  return (batch.processingEvents || []).reduce(
    (sum, event) => sum + toNumber(event.hangingWeight),
    0
  );
}

function getTotalPackagedWeight(batch) {
  return (batch.processingEvents || []).reduce(
    (sum, event) => sum + toNumber(event.packagedWeight),
    0
  );
}

function getYieldPercent(numerator, denominator) {
  const top = toNumber(numerator);
  const bottom = toNumber(denominator);

  if (!top || !bottom) return 0;

  return (top / bottom) * 100;
}

function getCostPerPackagedPound(batch) {
  const packagedWeight = getTotalPackagedWeight(batch);
  if (!packagedWeight) return 0;
  return getTotalBatchCost(batch) / packagedWeight;
}

function getBaseCostPerHead(batch) {
  const startingHeadCount = toNumber(batch.startingHeadCount || batch.currentHeadCount);
  if (!startingHeadCount) return 0;

  return (getAnimalPurchaseTotal(batch) + getInputTotal(batch)) / startingHeadCount;
}

function getProcessingEventAllocatedCost(batch, processingEventId) {
  const event = (batch.processingEvents || []).find(
    (item) => item.id === processingEventId
  );

  if (!event) return 0;

  const baseHeadCost = getBaseCostPerHead(batch);
  const processedHeadCount = toNumber(event.headCountProcessed);

  return baseHeadCost * processedHeadCount + toNumber(event.processingFee);
}

function getCutsForProcessingEvent(batch, processingEventId) {
  return (batch.cuts || []).filter((cut) => cut.processingEventId === processingEventId);
}

function getProcessingEventProductQuantityTotal(batch, processingEventId) {
  return getCutsForProcessingEvent(batch, processingEventId).reduce(
    (sum, cut) => sum + getCutQuantity(cut, batch),
    0
  );
}

function getCutUnitCost(batch, cut) {
  const quantity = getCutQuantity(cut, batch);
  if (!quantity) return 0;

  if (cut.processingEventId) {
    const eventCost = getProcessingEventAllocatedCost(batch, cut.processingEventId);
    const eventProductQuantity = getProcessingEventProductQuantityTotal(
      batch,
      cut.processingEventId
    );

    if (eventCost && eventProductQuantity) {
      return eventCost / eventProductQuantity;
    }
  }

  const allProductQuantity = (batch.cuts || []).reduce(
    (sum, item) => sum + getCutQuantity(item, batch),
    0
  );

  if (!allProductQuantity) return 0;

  return getTotalBatchCost(batch) / allProductQuantity;
}

function getCutAllocatedCost(batch, cut) {
  return getCutUnitCost(batch, cut) * getCutQuantity(cut, batch);
}

function getProductCostModeLabel(cut) {
  if (cut.costMode === "manual") return "Manual";
  return "Processing avg";
}

function getProductUnitCost(batch, cut) {
  if (cut.costMode === "manual") {
    return toNumber(cut.manualCostPerUnit);
  }

  return getCutUnitCost(batch, cut);
}

function getProductAllocatedCost(batch, cut) {
  return getProductUnitCost(batch, cut) * getCutQuantity(cut, batch);
}


function getCutQuantity(cut, batch) {
  const directQuantity = toNumber(cut.quantity);

  if (directQuantity) return directQuantity;

  if (cut.unit === "lb" && toNumber(cut.yieldPercent) > 0) {
    return getTotalPackagedWeight(batch) * (toNumber(cut.yieldPercent) / 100);
  }

  return 0;
}

function makeProductId(batchId, cutName) {
  return `livestock-${batchId}-${String(cutName || "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")}`;
}

function defaultBatchName(species) {
  return `${species || "Livestock"} Batch - ${new Date().getFullYear()}`;
}

function normalizeBatch(batch) {
  const legacyProcessing = batch.processing
    ? [
        {
          id: uniqueId("processing"),
          date: batch.pickupDate || batch.processingDate || "",
          processor: batch.processing.processor || "",
          headCountProcessed: "",
          liveWeight: batch.processing.liveWeight || "",
          hangingWeight: batch.processing.hangingWeight || "",
          packagedWeight: batch.processing.packagedWeight || "",
          processingFee: batch.processing.processingFee || "",
          notes: batch.processing.notes || ""
        }
      ].filter((event) => {
        return (
          event.processor ||
          event.liveWeight ||
          event.hangingWeight ||
          event.packagedWeight ||
          event.processingFee ||
          event.notes
        );
      })
    : [];

  return {
    ...blankBatch,
    ...batch,
    inputs: (batch.inputs || []).map((input) => ({
      ...blankInput,
      ...input,
      id: input.id || uniqueId("input")
    })),
    processingEvents: (batch.processingEvents || legacyProcessing).map((event) => ({
      ...blankProcessingEvent,
      ...event,
      id: event.id || uniqueId("processing")
    })),
    cuts: (batch.cuts || batch.processing?.products || []).map((cut) => ({
      ...createBlankCut(),
      ...cut,
      id: cut.id || uniqueId("cut")
    }))
  };
}

export default function Livestock() {
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

  function markLivestockDirty() {
    markUnsaved({
      source: "Livestock",
      onSave: saveBatch
    });
  }

  function scrollToEditor() {
    editorRef.current?.scrollIntoView({
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
    const guideHidden = localStorage.getItem("hideModuleGuide_livestock") === "true";
    if (!guideHidden) setShowGuide(true);
  }, []);

  async function loadData() {
    if (!user) return;

    setLoading(true);

    try {
      const loaded = await getLivestockBatches(user.uid);
      setBatches(loaded.map(normalizeBatch));
    } catch (error) {
      console.error(error);
      showStatus("Could not load Livestock data.", "error");
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

  const selectedSavedBatch = useMemo(() => {
    return batches.find((batch) => batch.id === selectedBatchId) || null;
  }, [batches, selectedBatchId]);

  const filteredBatches = useMemo(() => {
    const search = batchSearch.trim().toLowerCase();

    if (!search) return batches;

    return batches.filter((batch) => {
      return (
        batch.name?.toLowerCase().includes(search) ||
        batch.species?.toLowerCase().includes(search) ||
        batch.breed?.toLowerCase().includes(search) ||
        batch.status?.toLowerCase().includes(search)
      );
    });
  }, [batches, batchSearch]);

  const batchSummary = useMemo(() => {
    return {
      animalCost: getAnimalPurchaseTotal(batchForm),
      inputTotal: getInputTotal(batchForm),
      processingTotal: getProcessingTotal(batchForm),
      totalCost: getTotalBatchCost(batchForm),
      processedHeadCount: getProcessedHeadCount(batchForm),
      liveWeight: getTotalLiveWeight(batchForm),
      hangingWeight: getTotalHangingWeight(batchForm),
      packagedWeight: getTotalPackagedWeight(batchForm),
      hangingYield: getYieldPercent(getTotalHangingWeight(batchForm), getTotalLiveWeight(batchForm)),
      packagedYield: getYieldPercent(
        getTotalPackagedWeight(batchForm),
        getTotalHangingWeight(batchForm)
      ),
      costPerPackagedPound: getCostPerPackagedPound(batchForm)
    };
  }, [batchForm]);

  const livestockSummary = useMemo(() => {
    const activeBatches = batches.filter(
      (batch) => !["Sold Out", "Archived"].includes(batch.status)
    );

    const headCount = activeBatches.reduce(
      (sum, batch) => sum + toNumber(batch.currentHeadCount || batch.startingHeadCount),
      0
    );

    const totalCost = batches.reduce((sum, batch) => sum + getTotalBatchCost(batch), 0);

    const readyProducts = batches.reduce((sum, batch) => {
      return (
        sum +
        (batch.cuts || []).filter((cut) => cut.name && getCutQuantity(cut, batch) > 0).length
      );
    }, 0);

    return {
      activeBatches: activeBatches.length,
      headCount,
      totalCost,
      readyProducts
    };
  }, [batches]);

  const hasSavedBatchContext = Boolean(mode !== "idle");
  const canPushProducts = Boolean(batchForm.id && (batchForm.cuts || []).some(
    (cut) => cut.name && getCutQuantity(cut, batchForm) > 0
  ));

  function startNewBatch() {
    setMode("create");
    setSelectedBatchId("");
    setBatchForm({
      ...blankBatch,
      inputs: [],
      processingEvents: [],
      cuts: []
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
      const next = {
        ...current,
        [field]: value
      };

      if (field === "startingHeadCount" && !current.currentHeadCount) {
        next.currentHeadCount = value;
      }

      return next;
    });

    markLivestockDirty();
  }

  function addInputEntry() {
    setBatchForm((current) => ({
      ...current,
      inputs: [
        ...(current.inputs || []),
        {
          ...blankInput,
          id: uniqueId("input")
        }
      ]
    }));

    markLivestockDirty();
  }

  function updateInputEntry(index, field, value) {
    setBatchForm((current) => {
      const inputs = [...(current.inputs || [])];
      inputs[index] = {
        ...inputs[index],
        [field]: value
      };

      return {
        ...current,
        inputs
      };
    });

    markLivestockDirty();
  }

  function removeInputEntry(index) {
    setBatchForm((current) => ({
      ...current,
      inputs: (current.inputs || []).filter((_, itemIndex) => itemIndex !== index)
    }));

    markLivestockDirty();
  }

  function addProcessingEvent() {
    setBatchForm((current) => ({
      ...current,
      processingEvents: [
        ...(current.processingEvents || []),
        {
          ...blankProcessingEvent,
          id: uniqueId("processing")
        }
      ]
    }));

    markLivestockDirty();
  }

  function updateProcessingEvent(index, field, value) {
    setBatchForm((current) => {
      const processingEvents = [...(current.processingEvents || [])];
      processingEvents[index] = {
        ...processingEvents[index],
        [field]: value
      };

      return {
        ...current,
        processingEvents
      };
    });

    markLivestockDirty();
  }

  function removeProcessingEvent(index) {
    setBatchForm((current) => ({
      ...current,
      processingEvents: (current.processingEvents || []).filter(
        (_, itemIndex) => itemIndex !== index
      )
    }));

    markLivestockDirty();
  }

  function addCutEntry() {
    setBatchForm((current) => ({
      ...current,
      cuts: [
        ...(current.cuts || []),
        {
          ...createBlankCut(),
          id: uniqueId("cut")
        }
      ]
    }));

    markLivestockDirty();
  }

  function updateCutEntry(index, field, value) {
    setBatchForm((current) => {
      const cuts = [...(current.cuts || [])];
      cuts[index] = {
        ...cuts[index],
        [field]: value
      };

      return {
        ...current,
        cuts
      };
    });

    markLivestockDirty();
  }

  function removeCutEntry(index) {
    setBatchForm((current) => ({
      ...current,
      cuts: (current.cuts || []).filter((_, itemIndex) => itemIndex !== index)
    }));

    markLivestockDirty();
  }

  function cleanBatchForSave() {
    const startingHeadCount = cleanWholeNumber(batchForm.startingHeadCount);
    const currentHeadCount = cleanWholeNumber(batchForm.currentHeadCount || startingHeadCount);
    const purchasePricePerHead = cleanCurrency(batchForm.purchasePricePerHead);
    const purchaseCost = cleanCurrency(toNumber(purchasePricePerHead) * toNumber(startingHeadCount));

    return {
      ...batchForm,
      name: batchForm.name.trim() || defaultBatchName(batchForm.species),
      breed: batchForm.breed.trim(),
      startingHeadCount,
      currentHeadCount,
      startingWeight: cleanNumber(batchForm.startingWeight, 2),
      purchasePricePerHead,
      purchaseCost,
      notes: batchForm.notes.trim(),
      inputs: (batchForm.inputs || [])
        .filter((input) => input.description || input.cost || input.category)
        .map((input) => ({
          ...input,
          id: input.id || uniqueId("input"),
          description: input.description?.trim() || "",
          quantity: cleanNumber(input.quantity, 2),
          cost: cleanCurrency(input.cost)
        })),
      processingEvents: (batchForm.processingEvents || [])
        .filter((event) => {
          return (
            event.date ||
            event.processor ||
            event.headCountProcessed ||
            event.liveWeight ||
            event.hangingWeight ||
            event.packagedWeight ||
            event.processingFee ||
            event.notes
          );
        })
        .map((event) => ({
          ...event,
          id: event.id || uniqueId("processing"),
          processor: event.processor?.trim() || "",
          headCountProcessed: cleanWholeNumber(event.headCountProcessed),
          liveWeight: cleanNumber(event.liveWeight, 2),
          hangingWeight: cleanNumber(event.hangingWeight, 2),
          packagedWeight: cleanNumber(event.packagedWeight, 2),
          processingFee: cleanCurrency(event.processingFee),
          notes: event.notes?.trim() || ""
        })),
      cuts: (batchForm.cuts || [])
        .filter((cut) => cut.name || cut.quantity || cut.yieldPercent)
        .map((cut) => ({
          ...cut,
          id: cut.id || uniqueId("cut"),
          name: cut.name?.trim() || "",
          quantity: cleanNumber(cut.quantity, 2),
          yieldPercent: cleanNumber(cut.yieldPercent, 2),
          costMode: cut.costMode || "allocated",
          manualCostPerUnit: cleanCurrency(cut.manualCostPerUnit),
          retailPrice: cleanCurrency(cut.retailPrice),
          wholesalePrice: cleanCurrency(cut.wholesalePrice),
          notes: cut.notes?.trim() || ""
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
        await updateLivestockBatch(user.uid, savedId, cleanBatch);
        showStatus("Batch changes saved.", "success");
      } else {
        savedId = await createLivestockBatch(user.uid, cleanBatch);
        showStatus("New livestock batch saved.", "success");
      }

      const nextBatch = {
        ...cleanBatch,
        id: savedId
      };

      setMode("edit");
      setSelectedBatchId(savedId);
      setBatchForm(nextBatch);
      markSaved();
      await loadData();
    } catch (error) {
      console.error(error);
      showStatus("Could not save livestock batch.", "error");
    }
  }

  async function removeBatch(batchId) {
    if (!user) return;

    const confirmed = window.confirm("Delete this livestock batch? This cannot be undone.");
    if (!confirmed) return;

    try {
      await deleteLivestockBatch(user.uid, batchId);
      showStatus("Livestock batch deleted.", "success");

      if (selectedBatchId === batchId) {
        setSelectedBatchId("");
        setMode("idle");
        setBatchForm(blankBatch);
        markSaved();
      }

      await loadData();
    } catch (error) {
      console.error(error);
      showStatus("Could not delete livestock batch.", "error");
    }
  }

  async function addCutsToInventory() {
    if (!user || !batchForm.id) {
      showStatus("Save the batch before adding products to Inventory.", "error");
      return;
    }

    const validCuts = (batchForm.cuts || []).filter(
      (cut) => cut.name && getCutQuantity(cut, batchForm) > 0
    );

    if (!validCuts.length) {
      showStatus("Add finished products before sending them to Inventory.", "error");
      return;
    }

    if (hasUnsavedChanges) {
      showStatus("Save batch changes before adding products to Inventory.", "error");
      return;
    }

    setSavingInventory(true);

    try {
      await Promise.all(
        validCuts.map((cut) => {
          const quantity = getCutQuantity(cut, batchForm);
          const unit = cut.unit || "lb";
          const productId = makeProductId(batchForm.id, cut.name);

          return addQuantityToMatchedInventoryItem({
            userId: user.uid,
            match: {
              productId,
              variantName: unit,
              sourceModule: "Livestock"
            },
            itemDefaults: {
              name: `${batchForm.name} - ${cut.name}`,
              category: "Meat & Livestock",
              sourceModule: "Livestock",
              productId,
              productName: cut.name,
              recipeId: batchForm.id,
              recipeName: batchForm.name,
              variantId: `${productId}-${unit}`,
              variantName: unit,
              quantityOnHand: 0,
              unit,
              costPerUnit: cleanCurrency(getProductUnitCost(batchForm, cut)),
              retailPrice: cleanCurrency(cut.retailPrice),
              wholesalePrice: cleanCurrency(cut.wholesalePrice),
              status: "In Stock",
              notes:
                cut.notes ||
                `Added from Livestock batch ${batchForm.name}. Species: ${batchForm.species}.`
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

  async function addCutsToProductDirectory() {
    if (!user || !batchForm.id) {
      showStatus("Save the batch before adding products to Products & Pricing.", "error");
      return;
    }

    const validCuts = (batchForm.cuts || []).filter(
      (cut) => cut.name && getCutQuantity(cut, batchForm) > 0
    );

    if (!validCuts.length) {
      showStatus("Add finished products before creating Product Directory items.", "error");
      return;
    }

    if (hasUnsavedChanges) {
      showStatus("Save batch changes before adding products to Products & Pricing.", "error");
      return;
    }

    setSavingProducts(true);

    try {
      const category = speciesProductCategory[batchForm.species] || "Protein";
      await Promise.all(
        validCuts.map((cut) => {
          const quantity = getCutQuantity(cut, batchForm);
          const unit = cut.unit || "lb";
          const productId = makeProductId(batchForm.id, cut.name);

          return saveProduct(user.uid, {
            id: productId,
            name: cut.name,
            category,
            status: "Active",
            sku: "",
            unitLabel: unit,
            description: `${batchForm.species} product from ${batchForm.name}.`,
            retailPrice: cleanCurrency(cut.retailPrice),
            wholesalePrice: cleanCurrency(cut.wholesalePrice),
            targetRetailMargin: 70,
            targetWholesaleMargin: 50,
            batchIngredientCost: cleanCurrency(getProductAllocatedCost(batchForm, cut)),
            batchUnits: cleanNumber(quantity, 2),
            packagingCostPerUnit: "",
            laborHours: "",
            laborRate: "",
            overheadCost: "",
            notes:
              cut.notes ||
              `Created from Livestock. Batch: ${batchForm.name}. Estimated quantity: ${round(quantity, 2)} ${unit}.`,
            sourceType: "livestock",
            sourceLabel: "Livestock",
            sourceBatchId: batchForm.id,
            sourceCutName: cut.name,
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
      description: "Start a clean livestock batch with blank details, costs, processing, and products.",
      icon: Plus,
      action: startNewBatch
    },
    {
      title: "Edit Existing Batch",
      description: "Pick one saved batch and edit all details from one central workspace.",
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
      <div className="modulePage livestockModule">
        <ModuleHero
          eyebrow="Livestock"
          title="Sign in to manage livestock batches."
          description="Track animal groups, input costs, processing events, finished products, and inventory from your Farmers Hub account."
          className="livestockHero"
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
    <div className="modulePage livestockModule">
      {statusMessage ? (
        <div className={`floatingStatus ${statusType}`}>
          <AlertCircle size={18} />
          <span>{statusMessage}</span>
          <button type="button" onClick={() => setStatusMessage("")}>
            <X size={16} />
          </button>
        </div>
      ) : null}

      {loading ? <div className="floatingStatus info">Loading Livestock...</div> : null}

      <ModuleHero
        eyebrow="Livestock"
        title="Track batches, processing events, finished products, and meat inventory."
        description="Create or edit one working batch at a time, then manage details, input costs, processing logs, product yields, and inventory from one central workspace."
        className="livestockHero"
        actions={[
          {
            label: "Guide",
            icon: CircleHelp,
            variant: "secondary",
            onClick: () => setShowGuide(true)
          }
        ]}
      />

      <section className="hubStatGrid livestockStatGrid">
        <StatCard
          icon={Beef}
          label="Active Batches"
          value={livestockSummary.activeBatches}
          sub="groups tracked"
          accent="livestock"
        />

        <StatCard
          icon={ClipboardList}
          label="Head Count"
          value={livestockSummary.headCount}
          sub="active animals"
          accent="market"
        />

        <StatCard
          icon={DollarSign}
          label="Total Cost"
          value={money(livestockSummary.totalCost)}
          sub="batch costs"
          accent="pricing"
        />

        <StatCard
          icon={PackageCheck}
          label="Ready Products"
          value={livestockSummary.readyProducts}
          sub="saved products"
          accent="inventory"
        />
      </section>

      <section className="toolGrid compactToolGrid livestockModeGrid">
        {sectionCards.map((card) => {
          const Icon = card.icon;

          return (
            <button
              className="toolCard compactToolCard clickableToolCard livestockModeCard"
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

      <section className="workspacePanel compactPanel livestockEditorPanel" ref={editorRef}>
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
            <div className="livestockEditorActions">
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
          <div className="livestockSelectPanel">
            <div className="searchBox compactSearch">
              <Search size={17} />
              <input
                value={batchSearch}
                onChange={(event) => setBatchSearch(event.target.value)}
                placeholder="Search saved batches..."
              />
            </div>

            <div className="savedList compactSavedList livestockSavedList">
              {filteredBatches.length ? (
                filteredBatches.map((batch) => (
                  <div
                    className="savedItem compactSavedItem livestockSavedItem clickableLivestockBatch"
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
                        {batch.species}
                        {batch.breed ? ` • ${batch.breed}` : ""}
                        {batch.status ? ` • ${batch.status}` : ""}
                        {batch.currentHeadCount || batch.startingHeadCount
                          ? ` • ${batch.currentHeadCount || batch.startingHeadCount} head`
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
                  No saved livestock batches yet. Use Create New Batch to get started.
                </div>
              )}
            </div>
          </div>
        ) : null}

        {hasSavedBatchContext ? (
          <>
            <section className="livestockWorkingSummary">
              <StatCard
                icon={Beef}
                label="Animal Cost"
                value={money(batchSummary.animalCost)}
                sub="price/head × starting head"
                accent="livestock"
              />

              <StatCard
                icon={ClipboardList}
                label="Inputs"
                value={money(batchSummary.inputTotal)}
                sub="feed, vet, packaging, other"
                accent="market"
              />

              <StatCard
                icon={Scale}
                label="Processed Head"
                value={batchSummary.processedHeadCount}
                sub="from processing events"
                accent="orders"
              />

              <StatCard
                icon={DollarSign}
                label="Cost / Packaged lb"
                value={money(batchSummary.costPerPackagedPound)}
                sub="total cost ÷ packaged weight"
                accent="pricing"
              />
            </section>

            <section className="livestockFlowGrid compactWorkspace">
              <div className="workspacePanel compactPanel livestockSubPanel">
                <div className="workspaceHeader compactPanelHeader">
                  <div>
                    <p className="eyebrow">Batch Details</p>
                    <h3>Animal Batch</h3>
                  </div>
                </div>

                <div className="formGrid compactFormGrid">
                  <label>
                    Batch Name
                    <input
                      value={batchForm.name}
                      onChange={(event) => updateBatchField("name", event.target.value)}
                      placeholder="e.g., Spring 2026 Broilers"
                    />
                  </label>

                  <label>
                    Species
                    <select
                      value={batchForm.species}
                      onChange={(event) => updateBatchField("species", event.target.value)}
                    >
                      {speciesOptions.map((species) => (
                        <option key={species}>{species}</option>
                      ))}
                    </select>
                  </label>

                  <label>
                    Breed / Type
                    <input
                      value={batchForm.breed}
                      onChange={(event) => updateBatchField("breed", event.target.value)}
                      placeholder="e.g., Cornish Cross, Berkshire, Angus"
                    />
                  </label>

                  <label>
                    Status
                    <select
                      value={batchForm.status}
                      onChange={(event) => updateBatchField("status", event.target.value)}
                    >
                      {batchStatusOptions.map((status) => (
                        <option key={status}>{status}</option>
                      ))}
                    </select>
                  </label>

                  <label>
                    Start Date
                    <input
                      type="date"
                      value={batchForm.startDate}
                      onChange={(event) => updateBatchField("startDate", event.target.value)}
                    />
                  </label>

                  <label>
                    Target Processing Date
                    <input
                      type="date"
                      value={batchForm.processingDate}
                      onChange={(event) =>
                        updateBatchField("processingDate", event.target.value)
                      }
                    />
                  </label>

                  <label>
                    Starting Head Count
                    <input
                      type="number"
                      step="1"
                      min="0"
                      value={batchForm.startingHeadCount}
                      onChange={(event) =>
                        updateBatchField("startingHeadCount", event.target.value)
                      }
                      placeholder="e.g., 25"
                    />
                  </label>

                  <label>
                    Current Head Count
                    <input
                      type="number"
                      step="1"
                      min="0"
                      value={batchForm.currentHeadCount}
                      onChange={(event) =>
                        updateBatchField("currentHeadCount", event.target.value)
                      }
                      placeholder="e.g., 25"
                    />
                  </label>

                  <label>
                    Starting Weight
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={batchForm.startingWeight}
                      onChange={(event) =>
                        updateBatchField("startingWeight", event.target.value)
                      }
                      placeholder="Optional total weight"
                    />
                  </label>

                  <label>
                    Purchase Price Per Head
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={batchForm.purchasePricePerHead}
                      onChange={(event) =>
                        updateBatchField("purchasePricePerHead", event.target.value)
                      }
                      onBlur={(event) =>
                        updateBatchField(
                          "purchasePricePerHead",
                          cleanCurrency(event.target.value)
                        )
                      }
                      placeholder="e.g., 75.00"
                    />
                  </label>

                  <div className="livestockCalculatedField">
                    <span>Total Animal Cost</span>
                    <strong>{money(batchSummary.animalCost)}</strong>
                  </div>

                  <label className="fullSpan">
                    Notes
                    <textarea
                      value={batchForm.notes}
                      onChange={(event) => updateBatchField("notes", event.target.value)}
                      placeholder="Pasture group, feed plan, processing notes, customer notes..."
                    />
                  </label>
                </div>
              </div>

              <div className="workspacePanel compactPanel livestockSubPanel">
                <div className="workspaceHeader compactPanelHeader">
                  <div>
                    <p className="eyebrow">Input Cost Log</p>
                    <h3>Costs</h3>
                  </div>

                  <button
                    className="secondaryButton compactButton"
                    type="button"
                    onClick={addInputEntry}
                  >
                    <Plus size={15} />
                    Add Input
                  </button>
                </div>

                {(batchForm.inputs || []).length ? (
                  <div className="livestockTableWrap">
                    <div className="livestockInputTable livestockEditableTable">
                      <div className="livestockTableHeader">
                        <span>Date</span>
                        <span>Category</span>
                        <span>Description</span>
                        <span>Qty</span>
                        <span>Unit</span>
                        <span>Cost</span>
                        <span></span>
                      </div>

                      {batchForm.inputs.map((input, index) => (
                        <div className="livestockTableRow" key={input.id || index}>
                          <input
                            type="date"
                            value={input.date}
                            onChange={(event) =>
                              updateInputEntry(index, "date", event.target.value)
                            }
                          />

                          <select
                            value={input.category}
                            onChange={(event) =>
                              updateInputEntry(index, "category", event.target.value)
                            }
                          >
                            {inputCategories.map((category) => (
                              <option key={category}>{category}</option>
                            ))}
                          </select>

                          <input
                            value={input.description}
                            onChange={(event) =>
                              updateInputEntry(index, "description", event.target.value)
                            }
                            placeholder="e.g., feed, processing deposit, hay"
                          />

                          <input
                            type="number"
                            step="0.01"
                            min="0"
                            value={input.quantity}
                            onChange={(event) =>
                              updateInputEntry(index, "quantity", event.target.value)
                            }
                            placeholder="3"
                          />

                          <input
                            value={input.unit}
                            onChange={(event) =>
                              updateInputEntry(index, "unit", event.target.value)
                            }
                            placeholder="bags"
                          />

                          <input
                            type="number"
                            step="0.01"
                            min="0"
                            value={input.cost}
                            onChange={(event) =>
                              updateInputEntry(index, "cost", event.target.value)
                            }
                            onBlur={(event) =>
                              updateInputEntry(index, "cost", cleanCurrency(event.target.value))
                            }
                            placeholder="84.50"
                          />

                          <button
                            className="iconButton danger"
                            type="button"
                            onClick={() => removeInputEntry(index)}
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>                ) : (
                  <div className="placeholderBox compactPlaceholder">
                    Add feed, hay, bedding, vet, processing, transportation, packaging, or other costs.
                  </div>
                )}
              </div>

              <div className="workspacePanel compactPanel livestockSubPanel">
                <div className="workspaceHeader compactPanelHeader">
                  <div>
                    <p className="eyebrow">Processing Events</p>
                    <h3>Processing & Yield</h3>
                  </div>

                  <button
                    className="secondaryButton compactButton"
                    type="button"
                    onClick={addProcessingEvent}
                  >
                    <Plus size={15} />
                    Add Processing
                  </button>
                </div>

                <div className="hubStatGrid livestockYieldGrid">
                  <StatCard
                    icon={Scale}
                    label="Hanging Yield"
                    value={`${round(batchSummary.hangingYield, 1)}%`}
                    sub="hanging ÷ live"
                    accent="livestock"
                  />

                  <StatCard
                    icon={PackageCheck}
                    label="Packaged Yield"
                    value={`${round(batchSummary.packagedYield, 1)}%`}
                    sub="packaged ÷ hanging"
                    accent="inventory"
                  />

                  <StatCard
                    icon={DollarSign}
                    label="Processing Fees"
                    value={money(batchSummary.processingTotal)}
                    sub="all processing events"
                    accent="pricing"
                  />
                </div>

                {(batchForm.processingEvents || []).length ? (
                  <div className="livestockEditableList">
                    {batchForm.processingEvents.map((processingEvent, index) => (
                      <div className="livestockEditableCard" key={processingEvent.id || index}>
                        <div className="livestockCardHeader">
                          <strong>Processing #{index + 1}</strong>
                          <button type="button" onClick={() => removeProcessingEvent(index)}>
                            <Trash2 size={14} />
                          </button>
                        </div>

                        <div className="formGrid compactFormGrid">
                          <label>
                            Date
                            <input
                              type="date"
                              value={processingEvent.date}
                              onChange={(event) =>
                                updateProcessingEvent(index, "date", event.target.value)
                              }
                            />
                          </label>

                          <label>
                            Processor
                            <input
                              value={processingEvent.processor}
                              onChange={(event) =>
                                updateProcessingEvent(index, "processor", event.target.value)
                              }
                              placeholder="e.g., USDA processor"
                            />
                          </label>

                          <label>
                            Head Count Processed
                            <input
                              type="number"
                              step="1"
                              min="0"
                              value={processingEvent.headCountProcessed}
                              onChange={(event) =>
                                updateProcessingEvent(
                                  index,
                                  "headCountProcessed",
                                  event.target.value
                                )
                              }
                              placeholder="e.g., 1500"
                            />
                          </label>

                          <label>
                            Live Weight
                            <input
                              type="number"
                              step="0.01"
                              min="0"
                              value={processingEvent.liveWeight}
                              onChange={(event) =>
                                updateProcessingEvent(index, "liveWeight", event.target.value)
                              }
                              placeholder="Optional lbs"
                            />
                          </label>

                          <label>
                            Hanging Weight
                            <input
                              type="number"
                              step="0.01"
                              min="0"
                              value={processingEvent.hangingWeight}
                              onChange={(event) =>
                                updateProcessingEvent(index, "hangingWeight", event.target.value)
                              }
                              placeholder="Optional lbs"
                            />
                          </label>

                          <label>
                            Packaged Weight
                            <input
                              type="number"
                              step="0.01"
                              min="0"
                              value={processingEvent.packagedWeight}
                              onChange={(event) =>
                                updateProcessingEvent(index, "packagedWeight", event.target.value)
                              }
                              placeholder="Optional lbs"
                            />
                          </label>

                          <label>
                            Processing Fee
                            <input
                              type="number"
                              step="0.01"
                              min="0"
                              value={processingEvent.processingFee}
                              onChange={(event) =>
                                updateProcessingEvent(index, "processingFee", event.target.value)
                              }
                              onBlur={(event) =>
                                updateProcessingEvent(
                                  index,
                                  "processingFee",
                                  cleanCurrency(event.target.value)
                                )
                              }
                              placeholder="e.g., 325.00"
                            />
                          </label>

                          <label className="fullSpan">
                            Notes
                            <textarea
                              value={processingEvent.notes}
                              onChange={(event) =>
                                updateProcessingEvent(index, "notes", event.target.value)
                              }
                              placeholder="Cut sheet notes, pickup notes, packaging notes..."
                            />
                          </label>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="placeholderBox compactPlaceholder">
                    Add one or more processing events. This supports partial processing, like two 1,500-bird appointments from one 3,000-bird batch.
                  </div>
                )}
              </div>

              <div className="workspacePanel compactPanel livestockSubPanel">
                <div className="workspaceHeader compactPanelHeader">
                  <div>
                    <p className="eyebrow">Finished Products</p>
                    <h3>Product Yield</h3>
                  </div>

                  <div className="livestockHeaderActions">
                    <button
                      className="secondaryButton compactButton"
                      type="button"
                      onClick={addCutEntry}
                    >
                      <Plus size={15} />
                      Add Product
                    </button>

                    <button
                      className="secondaryButton compactButton"
                      type="button"
                      onClick={addCutsToProductDirectory}
                      disabled={!canPushProducts || savingProducts}
                    >
                      <ShoppingBag size={15} />
                      {savingProducts ? "Adding..." : "Add to Products"}
                    </button>

                    <button
                      className={`primaryButton compactPrimary ${
                        hasUnsavedChanges ? "dirtySaveButton" : ""
                      }`}
                      type="button"
                      onClick={addCutsToInventory}
                      disabled={!canPushProducts || savingInventory}
                    >
                      <PackageCheck size={15} />
                      {savingInventory ? "Adding..." : "Add to Inventory"}
                    </button>
                  </div>
                </div>

                {(batchForm.cuts || []).length ? (
                  <div className="livestockTableWrap">
                    <div className="livestockProductTable livestockEditableTable">
                      <div className="livestockTableHeader">
                        <span>Product</span>
                        <span>Qty</span>
                        <span>Unit</span>
                        <span>Source</span>
                        <span>Cost Mode</span>
                        <span>Manual Cost</span>
                        <span>Retail</span>
                        <span>Wholesale</span>
                        <span>Est. Cost</span>
                        <span></span>
                      </div>

                      {batchForm.cuts.map((cut, index) => {
                        const quantity = getCutQuantity(cut, batchForm);

                        return (
                          <div className="livestockTableRow" key={cut.id || index}>
                            <input
                              value={cut.name}
                              onChange={(event) =>
                                updateCutEntry(index, "name", event.target.value)
                              }
                              placeholder="Ground Beef"
                            />

                            <input
                              type="number"
                              step="0.01"
                              min="0"
                              value={cut.quantity}
                              onChange={(event) =>
                                updateCutEntry(index, "quantity", event.target.value)
                              }
                              placeholder="120"
                            />

                            <select
                              value={cut.unit}
                              onChange={(event) =>
                                updateCutEntry(index, "unit", event.target.value)
                              }
                            >
                              {productUnits.map((unit) => (
                                <option key={unit}>{unit}</option>
                              ))}
                            </select>

                            <select
                              value={cut.processingEventId || ""}
                              onChange={(event) =>
                                updateCutEntry(index, "processingEventId", event.target.value)
                              }
                            >
                              <option value="">Whole batch</option>
                              {(batchForm.processingEvents || []).map((event, eventIndex) => (
                                <option key={event.id} value={event.id}>
                                  Processing #{eventIndex + 1}
                                  {event.headCountProcessed
                                    ? `, ${event.headCountProcessed} head`
                                    : ""}
                                </option>
                              ))}
                            </select>

                            <select
                              value={cut.costMode || "allocated"}
                              onChange={(event) =>
                                updateCutEntry(index, "costMode", event.target.value)
                              }
                            >
                              <option value="allocated">Processing avg</option>
                              <option value="manual">Manual per unit</option>
                            </select>

                            <input
                              type="number"
                              step="0.01"
                              min="0"
                              value={cut.manualCostPerUnit || ""}
                              onChange={(event) =>
                                updateCutEntry(index, "manualCostPerUnit", event.target.value)
                              }
                              onBlur={(event) =>
                                updateCutEntry(
                                  index,
                                  "manualCostPerUnit",
                                  cleanCurrency(event.target.value)
                                )
                              }
                              placeholder="0.00"
                              disabled={(cut.costMode || "allocated") !== "manual"}
                            />

                            <input
                              type="number"
                              step="0.01"
                              min="0"
                              value={cut.retailPrice}
                              onChange={(event) =>
                                updateCutEntry(index, "retailPrice", event.target.value)
                              }
                              onBlur={(event) =>
                                updateCutEntry(index, "retailPrice", cleanCurrency(event.target.value))
                              }
                              placeholder="0.00"
                            />

                            <input
                              type="number"
                              step="0.01"
                              min="0"
                              value={cut.wholesalePrice}
                              onChange={(event) =>
                                updateCutEntry(index, "wholesalePrice", event.target.value)
                              }
                              onBlur={(event) =>
                                updateCutEntry(
                                  index,
                                  "wholesalePrice",
                                  cleanCurrency(event.target.value)
                                )
                              }
                              placeholder="0.00"
                            />

                            <div className="livestockTableCost">
                              <strong>{money(getProductUnitCost(batchForm, cut))}</strong>
                              <span>
                                {round(quantity, 2)} {cut.unit}
                              </span>
                            </div>

                            <button
                              className="iconButton danger"
                              type="button"
                              onClick={() => removeCutEntry(index)}
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  </div>                ) : (
                  <div className="placeholderBox compactPlaceholder">
                    Add finished products like Ground Beef, Ribeye, Pork Chops, Sausage, Whole Chicken, Chicken Thighs, or Stew Meat.
                  </div>
                )}
              </div>
            </section>

            <section className="workspacePanel compactPanel livestockBatchLog">
              <div className="workspaceHeader compactPanelHeader">
                <div>
                  <p className="eyebrow">Batch Log</p>
                  <h3>{batchForm.name || "Current Batch"} Summary</h3>
                </div>
              </div>

              <div className="livestockLogGrid">
                <div>
                  <h4>Inputs</h4>
                  {(batchForm.inputs || []).length ? (
                    batchForm.inputs.map((input) => (
                      <p key={input.id}>
                        {input.date || "No date"} • {input.category} •{" "}
                        {input.description || "No description"} • {money(input.cost)}
                      </p>
                    ))
                  ) : (
                    <p>No inputs logged.</p>
                  )}
                </div>

                <div>
                  <h4>Processing</h4>
                  {(batchForm.processingEvents || []).length ? (
                    batchForm.processingEvents.map((event) => (
                      <p key={event.id}>
                        {event.date || "No date"} • {event.processor || "No processor"} •{" "}
                        {event.headCountProcessed || 0} head • {money(event.processingFee)}
                      </p>
                    ))
                  ) : (
                    <p>No processing events logged.</p>
                  )}
                </div>

                <div>
                  <h4>Products</h4>
                  {(batchForm.cuts || []).length ? (
                    batchForm.cuts.map((cut) => (
                      <p key={cut.id}>
                        {cut.name || "Unnamed product"} • {round(getCutQuantity(cut, batchForm), 2)}{" "}
                        {cut.unit}
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
        moduleKey="livestock"
        title="How to Use Livestock"
        onClose={() => setShowGuide(false)}
      >
        <LivestockGuideContent />
      </ModuleGuideModal>
    </div>
  );
}
