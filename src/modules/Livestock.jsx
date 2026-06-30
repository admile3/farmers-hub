import { useEffect, useMemo, useState } from "react";
import {
  Beef,
  CalendarDays,
  CircleHelp,
  ClipboardList,
  DollarSign,
  Edit3,
  PackageCheck,
  Plus,
  RefreshCw,
  Scale,
  ShoppingBag,
  Trash2
} from "lucide-react";

import { useAuth } from "../AuthContext.jsx";
import ActionMenu from "../components/ActionMenu.jsx";
import ConfirmDialog from "../components/ConfirmDialog.jsx";
import EmptyState from "../components/EmptyState.jsx";
import FilterBar from "../components/FilterBar.jsx";
import FormField from "../components/FormField.jsx";
import LivestockGuideContent from "../components/LivestockGuideContent.jsx";
import ModuleGuideModal from "../components/ModuleGuideModal.jsx";
import ModuleHero from "../components/ModuleHero.jsx";
import RecordList from "../components/RecordList.jsx";
import SaveButton from "../components/SaveButton.jsx";
import StatCard from "../components/StatCard.jsx";
import StatusPill from "../components/StatusPill.jsx";
import Toast from "../components/Toast.jsx";
import WorkspacePanel from "../components/WorkspacePanel.jsx";
import { addQuantityToMatchedInventoryItem } from "../services/inventoryService.js";
import { saveProduct } from "../services/productService.js";
import {
  createLivestockBatch,
  deleteLivestockBatch,
  getLivestockBatches,
  updateLivestockBatch
} from "../services/livestockService.js";
import {
  calculateAnimalCostBasis,
  calculateGroupCostBasis,
  getHerdAnimals,
  getHerdGroups,
  saveHerdAnimal,
  saveHerdGroup
} from "../services/herdService.js";
import {
  deleteModuleCalendarEventsForRecord,
  syncModuleCalendarEvents
} from "../services/moduleCalendarService.js";

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

const processingStatusOptions = [
  "Draft",
  "Scheduled",
  "Processing",
  "Processed",
  "Products Built",
  "Inventory Added",
  "Archived"
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
  sourceMode: "manual",
  sourceRecords: [],
  species: "Beef",
  status: "Draft",
  processor: "",
  processingDate: "",
  pickupDate: "",
  headCountProcessed: "",
  liveWeight: "",
  hangingWeight: "",
  packagedWeight: "",
  processingFee: "",
  additionalCost: "",
  costPoolMode: "processed",
  notes: "",
  cuts: []
};

function createBlankCut() {
  return {
    id: uniqueId("cut"),
    name: "",
    quantity: "",
    unit: "lb",
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

function money(value) {
  return `$${round(value, 2)}`;
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

function formatDate(value) {
  if (!value) return "";
  const parsed = new Date(`${value}T00:00:00`);
  if (Number.isNaN(parsed.getTime())) return value;

  return parsed.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric"
  });
}

function getSourceCost(batch) {
  return (batch.sourceRecords || []).reduce((sum, record) => {
    return sum + toNumber(record.costBasis);
  }, 0);
}

function getTotalProcessingCost(batch) {
  return (
    getSourceCost(batch) +
    toNumber(batch.processingFee) +
    toNumber(batch.additionalCost)
  );
}

function getCutQuantity(cut) {
  return toNumber(cut.quantity);
}

function getTotalCutQuantity(batch) {
  return (batch.cuts || []).reduce((sum, cut) => {
    return sum + getCutQuantity(cut);
  }, 0);
}

function getAverageCostPerUnit(batch) {
  const quantity = getTotalCutQuantity(batch);
  if (!quantity) return 0;

  return getTotalProcessingCost(batch) / quantity;
}

function getProductUnitCost(batch, cut) {
  if ((cut.costMode || "allocated") === "manual") {
    return toNumber(cut.manualCostPerUnit);
  }

  return getAverageCostPerUnit(batch);
}

function getProductAllocatedCost(batch, cut) {
  return getProductUnitCost(batch, cut) * getCutQuantity(cut);
}

function getPackagedYield(batch) {
  const hanging = toNumber(batch.hangingWeight);
  const packaged = toNumber(batch.packagedWeight);
  if (!hanging || !packaged) return 0;

  return (packaged / hanging) * 100;
}

function getHangingYield(batch) {
  const live = toNumber(batch.liveWeight);
  const hanging = toNumber(batch.hangingWeight);
  if (!live || !hanging) return 0;

  return (hanging / live) * 100;
}

function getSourceName(record) {
  return record.name || record.tagId || record.groupName || "Unnamed Source";
}

function getReadyHerdSources() {
  const readyAnimals = getHerdAnimals()
    .filter((animal) => animal.status === "Ready for Processing")
    .map((animal) => ({
      sourceType: "animal",
      id: animal.id,
      name: animal.tagId || animal.name || "Unnamed Animal",
      species: animal.species || "Other",
      count: 1,
      status: animal.status,
      costBasis: calculateAnimalCostBasis(animal),
      originalRecord: animal
    }));

  const readyGroups = getHerdGroups()
    .filter((group) => group.status === "Ready for Processing")
    .map((group) => ({
      sourceType: "group",
      id: group.id,
      name: group.name || "Unnamed Group",
      species: group.species || "Other",
      count: toNumber(group.currentCount || group.startingCount) || 1,
      status: group.status,
      costBasis: calculateGroupCostBasis(group),
      originalRecord: group
    }));

  return [...readyAnimals, ...readyGroups];
}

function normalizeBatch(batch) {
  return {
    ...blankBatch,
    ...batch,
    sourceMode: batch.sourceMode || (batch.sourceRecords?.length ? "herd" : "manual"),
    sourceRecords: batch.sourceRecords || [],
    cuts: (batch.cuts || []).map((cut) => ({
      ...createBlankCut(),
      ...cut,
      id: cut.id || uniqueId("cut"),
      costMode: cut.costMode || "allocated"
    }))
  };
}

function makeProductId(batchId, cutName) {
  return `butcher-board-${batchId}-${String(cutName || "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")}`;
}

function defaultBatchName(species) {
  return `${species || "Processing"} Batch - ${new Date().getFullYear()}`;
}

function getButcherBoardCalendarEvents(batch) {
  if (!batch?.id) return [];

  const batchName = batch.name || defaultBatchName(batch.species);
  const events = [];

  if (batch.processingDate) {
    events.push({
      sourceModuleKey: "livestock",
      sourceModule: "Butcher Board",
      sourceRecordId: batch.id,
      sourceEventType: "processing-date",
      title: `Processing: ${batchName}`,
      type: "Production",
      date: batch.processingDate,
      location: batch.processor || "",
      sourcePath: "/livestock",
      accent: "livestock",
      notes: batch.notes || "",
      details: {
        batchName,
        species: batch.species || "",
        processor: batch.processor || "",
        status: batch.status || "",
        eventLabel: "Processing Date"
      }
    });
  }

  if (batch.pickupDate) {
    events.push({
      sourceModuleKey: "livestock",
      sourceModule: "Butcher Board",
      sourceRecordId: batch.id,
      sourceEventType: "pickup-date",
      title: `Pickup: ${batchName}`,
      type: "Production",
      date: batch.pickupDate,
      location: batch.processor || "",
      sourcePath: "/livestock",
      accent: "livestock",
      notes: batch.notes || "",
      details: {
        batchName,
        species: batch.species || "",
        processor: batch.processor || "",
        status: batch.status || "",
        eventLabel: "Pickup Date"
      }
    });
  }

  return events;
}

function getStatusVariant(status) {
  switch (status) {
    case "Scheduled":
    case "Products Built":
    case "Inventory Added":
      return "success";
    case "Processing":
      return "warning";
    case "Processed":
      return "primary";
    case "Archived":
      return "neutral";
    default:
      return "neutral";
  }
}

export default function ButcherBoard() {
  const { user, loginWithGoogle } = useAuth();

  const [batches, setBatches] = useState([]);
  const [readySources, setReadySources] = useState([]);
  const [selectedSourceIds, setSelectedSourceIds] = useState([]);
  const [selectedBatchId, setSelectedBatchId] = useState("");
  const [batchForm, setBatchForm] = useState(blankBatch);
  const [batchSearch, setBatchSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [loading, setLoading] = useState(false);
  const [savingBatch, setSavingBatch] = useState(false);
  const [savingInventory, setSavingInventory] = useState(false);
  const [savingProducts, setSavingProducts] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [saved, setSaved] = useState(false);
  const [saveError, setSaveError] = useState(false);
  const [toast, setToast] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [showGuide, setShowGuide] = useState(false);

  useEffect(() => {
    const guideHidden = localStorage.getItem("hideModuleGuide_livestock") === "true";
    if (!guideHidden) setShowGuide(true);
  }, []);

  useEffect(() => {
    if (user) {
      loadData();
    } else {
      setBatches([]);
      setReadySources([]);
      setSelectedSourceIds([]);
      setSelectedBatchId("");
      setBatchForm(blankBatch);
      setDirty(false);
    }
  }, [user]);

  function showToast(nextToast) {
    setToast(nextToast);

    window.setTimeout(() => {
      setToast(null);
    }, 3000);
  }

  async function loadData() {
    if (!user) return;

    setLoading(true);

    try {
      const loaded = await getLivestockBatches(user.uid);
      setBatches((loaded || []).map(normalizeBatch));
      setReadySources(getReadyHerdSources());
    } catch (error) {
      console.error(error);
      showToast({
        variant: "error",
        title: "Butcher Board could not load",
        message: "Please refresh and try again."
      });
    } finally {
      setLoading(false);
    }
  }

  function markDirty() {
    setDirty(true);
    setSaved(false);
    setSaveError(false);
  }

  function updateBatchField(field, value) {
    markDirty();

    setBatchForm((current) => ({
      ...current,
      [field]: value
    }));
  }

  function toggleReadySource(source) {
    setSelectedSourceIds((current) => {
      const key = `${source.sourceType}:${source.id}`;
      if (current.includes(key)) {
        return current.filter((id) => id !== key);
      }

      return [...current, key];
    });
  }

  function startManualBatch() {
    setSelectedBatchId("");
    setSelectedSourceIds([]);
    setBatchForm({
      ...blankBatch,
      sourceMode: "manual",
      name: defaultBatchName("Beef")
    });
    setDirty(true);
    setSaved(false);
    setSaveError(false);
  }

  function startHerdBatch() {
    const selectedSources = readySources.filter((source) =>
      selectedSourceIds.includes(`${source.sourceType}:${source.id}`)
    );

    if (!selectedSources.length) {
      showToast({
        variant: "warning",
        title: "Select ready animals first",
        message: "Choose one or more ready Herd Tracker records before creating a batch."
      });
      return;
    }

    const firstSpecies = selectedSources[0]?.species || "Beef";
    const totalCount = selectedSources.reduce((sum, source) => sum + toNumber(source.count), 0);

    setSelectedBatchId("");
    setBatchForm({
      ...blankBatch,
      sourceMode: "herd",
      sourceRecords: selectedSources.map((source) => ({
        sourceType: source.sourceType,
        sourceId: source.id,
        name: source.name,
        species: source.species,
        count: source.count,
        costBasis: cleanCurrency(source.costBasis)
      })),
      species: firstSpecies,
      headCountProcessed: cleanWholeNumber(totalCount),
      name: `${firstSpecies} Processing Batch - ${new Date().getFullYear()}`
    });
    setDirty(true);
    setSaved(false);
    setSaveError(false);
  }

  function loadBatch(batch) {
    const normalized = normalizeBatch(batch);
    setSelectedBatchId(normalized.id);
    setBatchForm(normalized);
    setSelectedSourceIds([]);
    setDirty(false);
    setSaved(false);
    setSaveError(false);
  }

  function addCutEntry() {
    markDirty();

    setBatchForm((current) => ({
      ...current,
      cuts: [...(current.cuts || []), createBlankCut()]
    }));
  }

  function updateCutEntry(index, field, value) {
    markDirty();

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
  }

  function removeCutEntry(index) {
    markDirty();

    setBatchForm((current) => ({
      ...current,
      cuts: (current.cuts || []).filter((_, itemIndex) => itemIndex !== index)
    }));
  }

  async function updateHerdStatuses(batch, status) {
    if (!batch.sourceRecords?.length) return;

    batch.sourceRecords.forEach((source) => {
      if (source.sourceType === "animal") {
        const animal = getHerdAnimals().find((item) => item.id === source.sourceId);
        if (animal) {
          saveHerdAnimal({
            ...animal,
            status,
            notes: [
              animal.notes || "",
              status === "Processing"
                ? `Moved to Butcher Board batch ${batch.name}.`
                : `Processed through Butcher Board batch ${batch.name}.`
            ]
              .filter(Boolean)
              .join("\n")
          });
        }
      }

      if (source.sourceType === "group") {
        const group = getHerdGroups().find((item) => item.id === source.sourceId);
        if (group) {
          saveHerdGroup({
            ...group,
            status,
            notes: [
              group.notes || "",
              status === "Processing"
                ? `Moved to Butcher Board batch ${batch.name}.`
                : `Processed through Butcher Board batch ${batch.name}.`
            ]
              .filter(Boolean)
              .join("\n")
          });
        }
      }
    });
  }

  function cleanBatchForSave() {
    return {
      ...batchForm,
      name: batchForm.name.trim() || defaultBatchName(batchForm.species),
      processor: batchForm.processor.trim(),
      status: batchForm.status || "Draft",
      headCountProcessed: cleanWholeNumber(batchForm.headCountProcessed),
      liveWeight: cleanNumber(batchForm.liveWeight, 2),
      hangingWeight: cleanNumber(batchForm.hangingWeight, 2),
      packagedWeight: cleanNumber(batchForm.packagedWeight, 2),
      processingFee: cleanCurrency(batchForm.processingFee),
      additionalCost: cleanCurrency(batchForm.additionalCost),
      notes: batchForm.notes.trim(),
      cuts: (batchForm.cuts || [])
        .filter((cut) => cut.name || cut.quantity)
        .map((cut) => ({
          ...cut,
          id: cut.id || uniqueId("cut"),
          name: cut.name?.trim() || "",
          quantity: cleanNumber(cut.quantity, 2),
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
      setSaveError(true);
      showToast({
        variant: "error",
        title: "Batch name required",
        message: "Add a processing batch name before saving."
      });
      return;
    }

    setSavingBatch(true);
    setSaveError(false);

    try {
      let savedId = cleanBatch.id || selectedBatchId;

      if (savedId) {
        await updateLivestockBatch(user.uid, savedId, cleanBatch);
      } else {
        savedId = await createLivestockBatch(user.uid, cleanBatch);
      }

      const nextBatch = {
        ...cleanBatch,
        id: savedId
      };

      await deleteModuleCalendarEventsForRecord(user.uid, {
        sourceModuleKey: "livestock",
        sourceRecordId: savedId
      });

      await syncModuleCalendarEvents(user.uid, getButcherBoardCalendarEvents(nextBatch));

      if (nextBatch.sourceMode === "herd") {
        await updateHerdStatuses(
          nextBatch,
          nextBatch.status === "Processed" ||
            nextBatch.status === "Products Built" ||
            nextBatch.status === "Inventory Added"
            ? "Processed"
            : "Processing"
        );
      }

      setSelectedBatchId(savedId);
      setBatchForm(nextBatch);
      setDirty(false);
      setSaved(true);

      showToast({
        variant: "success",
        title: "Batch saved",
        message: "Butcher Board batch saved successfully."
      });

      window.setTimeout(() => setSaved(false), 1200);
      await loadData();
    } catch (error) {
      console.error(error);
      setSaveError(true);
      showToast({
        variant: "error",
        title: "Batch could not be saved",
        message: "Please check the batch and try again."
      });
    } finally {
      setSavingBatch(false);
    }
  }

  function requestDeleteBatch(batch) {
    setDeleteTarget(batch);
  }

  async function confirmDeleteBatch() {
    if (!user || !deleteTarget?.id) return;

    try {
      await deleteLivestockBatch(user.uid, deleteTarget.id);
      await deleteModuleCalendarEventsForRecord(user.uid, {
        sourceModuleKey: "livestock",
        sourceRecordId: deleteTarget.id
      });

      if (selectedBatchId === deleteTarget.id) {
        setSelectedBatchId("");
        setBatchForm(blankBatch);
        setDirty(false);
      }

      showToast({
        variant: "success",
        title: "Batch deleted",
        message: "Processing batch deleted."
      });

      setDeleteTarget(null);
      await loadData();
    } catch (error) {
      console.error(error);
      showToast({
        variant: "error",
        title: "Batch could not be deleted",
        message: "Please try again."
      });
    }
  }

  async function addCutsToInventory() {
    if (!user || !batchForm.id) {
      showToast({
        variant: "warning",
        title: "Save batch first",
        message: "Save the batch before adding products to Inventory."
      });
      return;
    }

    const validCuts = (batchForm.cuts || []).filter(
      (cut) => cut.name && getCutQuantity(cut) > 0
    );

    if (!validCuts.length) {
      showToast({
        variant: "warning",
        title: "No products yet",
        message: "Add finished products before sending them to Inventory."
      });
      return;
    }

    if (dirty) {
      showToast({
        variant: "warning",
        title: "Save changes first",
        message: "Save batch changes before adding products to Inventory."
      });
      return;
    }

    setSavingInventory(true);

    try {
      await Promise.all(
        validCuts.map((cut) => {
          const quantity = getCutQuantity(cut);
          const unit = cut.unit || "lb";
          const productId = makeProductId(batchForm.id, cut.name);

          return addQuantityToMatchedInventoryItem({
            userId: user.uid,
            match: {
              productId,
              variantName: unit,
              sourceModule: "Butcher Board"
            },
            itemDefaults: {
              name: `${batchForm.name} - ${cut.name}`,
              category: "Meat & Livestock",
              sourceModule: "Butcher Board",
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
                `Added from Butcher Board batch ${batchForm.name}. Species: ${batchForm.species}.`
            },
            quantityToAdd: quantity
          });
        })
      );

      await updateLivestockBatch(user.uid, batchForm.id, {
        ...batchForm,
        status: "Inventory Added"
      });

      setBatchForm((current) => ({
        ...current,
        status: "Inventory Added"
      }));

      showToast({
        variant: "success",
        title: "Inventory updated",
        message: "Finished products added to Inventory."
      });

      await loadData();
    } catch (error) {
      console.error(error);
      showToast({
        variant: "error",
        title: "Inventory could not update",
        message: "Please try again."
      });
    } finally {
      setSavingInventory(false);
    }
  }

  async function addCutsToProductDirectory() {
    if (!user || !batchForm.id) {
      showToast({
        variant: "warning",
        title: "Save batch first",
        message: "Save the batch before adding products to Products & Pricing."
      });
      return;
    }

    const validCuts = (batchForm.cuts || []).filter(
      (cut) => cut.name && getCutQuantity(cut) > 0
    );

    if (!validCuts.length) {
      showToast({
        variant: "warning",
        title: "No products yet",
        message: "Add finished products before creating Product Directory items."
      });
      return;
    }

    if (dirty) {
      showToast({
        variant: "warning",
        title: "Save changes first",
        message: "Save batch changes before adding products to Products & Pricing."
      });
      return;
    }

    setSavingProducts(true);

    try {
      const category = speciesProductCategory[batchForm.species] || "Protein";

      await Promise.all(
        validCuts.map((cut) => {
          const quantity = getCutQuantity(cut);
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
              `Created from Butcher Board. Batch: ${batchForm.name}. Estimated quantity: ${round(quantity, 2)} ${unit}.`,
            sourceType: "butcher-board",
            sourceLabel: "Butcher Board",
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

      await updateLivestockBatch(user.uid, batchForm.id, {
        ...batchForm,
        status: "Products Built"
      });

      setBatchForm((current) => ({
        ...current,
        status: "Products Built"
      }));

      showToast({
        variant: "success",
        title: "Products created",
        message: "Finished products added to Products & Pricing."
      });

      await loadData();
    } catch (error) {
      console.error(error);
      showToast({
        variant: "error",
        title: "Products could not be created",
        message: "Please try again."
      });
    } finally {
      setSavingProducts(false);
    }
  }

  const filteredBatches = useMemo(() => {
    const search = batchSearch.trim().toLowerCase();

    return batches.filter((batch) => {
      const matchesSearch = search
        ? [
            batch.name,
            batch.species,
            batch.status,
            batch.processor,
            ...(batch.sourceRecords || []).map((source) => source.name)
          ]
            .join(" ")
            .toLowerCase()
            .includes(search)
        : true;

      const matchesStatus = statusFilter === "All" || batch.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [batches, batchSearch, statusFilter]);

  const summary = useMemo(() => {
    const activeBatches = batches.filter(
      (batch) => !["Inventory Added", "Archived"].includes(batch.status)
    );

    const readyProducts = batches.reduce((sum, batch) => {
      return (
        sum +
        (batch.cuts || []).filter((cut) => cut.name && getCutQuantity(cut) > 0).length
      );
    }, 0);

    const totalCost = batches.reduce((sum, batch) => {
      return sum + getTotalProcessingCost(batch);
    }, 0);

    return {
      activeBatches: activeBatches.length,
      readyQueue: readySources.length,
      readyProducts,
      totalCost
    };
  }, [batches, readySources]);

  const batchTotals = useMemo(() => {
    const totalCost = getTotalProcessingCost(batchForm);
    const totalQuantity = getTotalCutQuantity(batchForm);

    return {
      sourceCost: getSourceCost(batchForm),
      totalCost,
      totalQuantity,
      averageCostPerUnit: totalQuantity ? totalCost / totalQuantity : 0,
      hangingYield: getHangingYield(batchForm),
      packagedYield: getPackagedYield(batchForm)
    };
  }, [batchForm]);

  const canPushProducts = Boolean(
    batchForm.id &&
      (batchForm.cuts || []).some((cut) => cut.name && getCutQuantity(cut) > 0)
  );

  function getBatchActions(batch) {
    return [
      {
        label: "Edit",
        icon: Edit3,
        onClick: () => loadBatch(batch)
      },
      {
        divider: true
      },
      {
        label: "Delete",
        icon: Trash2,
        destructive: true,
        onClick: () => requestDeleteBatch(batch)
      }
    ];
  }

  if (!user) {
    return (
      <div className="modulePage livestockModule butcherBoardModule">
        <ModuleHero
          eyebrow="Butcher Board"
          accent="livestock"
          icon={Beef}
          title="Sign in to manage processing batches."
          description="Turn ready animals, groups, or manual processing batches into finished products, inventory, and pricing records."
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
    <div className="modulePage livestockModule butcherBoardModule">
      <ModuleHero
        eyebrow="Butcher Board"
        accent="livestock"
        icon={Beef}
        title="Move animals from processing-ready to finished products."
        description="Select ready Herd Tracker records or create a manual processing batch, then manage weights, processor details, cut yields, costs, inventory, and product pricing."
        actions={[
          {
            label: "Guide",
            icon: CircleHelp,
            variant: "secondary",
            onClick: () => setShowGuide(true)
          },
          {
            label: "Manual Batch",
            icon: Plus,
            onClick: startManualBatch
          }
        ]}
      />

      <section className="hubStatGrid livestockStatGrid">
        <StatCard
          icon={ClipboardList}
          label="Active Batches"
          value={loading ? "..." : summary.activeBatches}
          sub="processing batches"
          accent="livestock"
        />
        <StatCard
          icon={Beef}
          label="Ready Queue"
          value={loading ? "..." : summary.readyQueue}
          sub="from Herd Tracker"
          accent="orders"
        />
        <StatCard
          icon={PackageCheck}
          label="Ready Products"
          value={loading ? "..." : summary.readyProducts}
          sub="finished products"
          accent="inventory"
        />
        <StatCard
          icon={DollarSign}
          label="Total Cost"
          value={loading ? "..." : money(summary.totalCost)}
          sub="source + processing"
          accent="pricing"
        />
      </section>

      <WorkspacePanel
        eyebrow="Herd Tracker"
        title="Ready for Processing Queue"
        description="Select one or more animals or groups from Herd Tracker to create a processing batch."
        actions={[
          {
            label: "Create From Selected",
            icon: Plus,
            onClick: startHerdBatch
          },
          {
            label: "Refresh",
            icon: RefreshCw,
            variant: "secondary",
            onClick: loadData
          }
        ]}
      >
        {readySources.length ? (
          <RecordList
            records={readySources}
            getRecordId={(source) => `${source.sourceType}:${source.id}`}
            selectedRecordId=""
            onRecordClick={toggleReadySource}
            getTitle={getSourceName}
            getSubtitle={(source) =>
              `${source.species || "Animal"} • ${source.count || 1} ${
                source.count === 1 ? "head" : "head"
              }`
            }
            getMeta={(source) => [
              { label: "Type", value: source.sourceType === "animal" ? "Animal" : "Group" },
              { label: "Cost Basis", value: money(source.costBasis) }
            ]}
            renderStatus={(source) => (
              <StatusPill
                label={
                  selectedSourceIds.includes(`${source.sourceType}:${source.id}`)
                    ? "Selected"
                    : "Ready"
                }
                variant={
                  selectedSourceIds.includes(`${source.sourceType}:${source.id}`)
                    ? "primary"
                    : "success"
                }
              />
            )}
          />
        ) : (
          <EmptyState
            icon={Beef}
            title="No ready records"
            message="Animals or groups marked Ready for Processing in Herd Tracker will appear here. You can still use Manual Batch."
            actions={[
              {
                label: "Create Manual Batch",
                icon: Plus,
                onClick: startManualBatch
              }
            ]}
          />
        )}
      </WorkspacePanel>

      <WorkspacePanel
        eyebrow="Directory"
        title="Processing Batches"
        toolbar={
          <FilterBar
            searchValue={batchSearch}
            onSearchChange={setBatchSearch}
            searchPlaceholder="Search batches..."
            filters={[
              {
                label: "Status",
                value: statusFilter,
                onChange: setStatusFilter,
                options: ["All", ...processingStatusOptions]
              }
            ]}
            actions={[
              {
                label: "Manual Batch",
                icon: Plus,
                onClick: startManualBatch
              }
            ]}
          />
        }
      >
        <RecordList
          records={filteredBatches}
          selectedRecordId={selectedBatchId}
          onRecordClick={loadBatch}
          emptyMessage={loading ? "Loading batches..." : "No processing batches found."}
          getTitle={(batch) => batch.name || "Unnamed Batch"}
          getSubtitle={(batch) =>
            [
              batch.species,
              batch.processor,
              batch.processingDate ? formatDate(batch.processingDate) : ""
            ]
              .filter(Boolean)
              .join(" • ")
          }
          getMeta={(batch) => [
            { label: "Source", value: batch.sourceMode === "herd" ? "Herd Tracker" : "Manual" },
            { label: "Total Cost", value: money(getTotalProcessingCost(batch)) },
            { label: "Products", value: `${(batch.cuts || []).length}` }
          ]}
          renderStatus={(batch) => (
            <StatusPill
              label={batch.status || "Draft"}
              variant={getStatusVariant(batch.status)}
            />
          )}
          renderActions={(batch) => <ActionMenu items={getBatchActions(batch)} />}
        />
      </WorkspacePanel>

      <WorkspacePanel
        eyebrow="Editor"
        title={batchForm.id || selectedBatchId ? "Edit Processing Batch" : "Processing Batch"}
        description="Manage processor details, weights, costs, cuts, inventory, and pricing."
        actions={[
          {
            label: "Clear",
            variant: "secondary",
            onClick: () => {
              setBatchForm(blankBatch);
              setSelectedBatchId("");
              setDirty(false);
              setSaved(false);
              setSaveError(false);
            }
          }
        ]}
      >
        <div className="button-row" style={{ justifyContent: "flex-end", marginBottom: "12px" }}>
          <SaveButton
            dirty={dirty || (!batchForm.id && Boolean(batchForm.name))}
            saving={savingBatch}
            saved={saved}
            error={saveError}
            label="Save Batch"
            dirtyLabel="Save Batch"
            onClick={saveBatch}
          />
        </div>

        <div className="formGrid compactFormGrid">
          <FormField label="Batch Name" required>
            <input
              value={batchForm.name}
              onChange={(event) => updateBatchField("name", event.target.value)}
              placeholder="e.g., Beef Processing Batch 2026"
            />
          </FormField>

          <FormField label="Source">
            <select
              value={batchForm.sourceMode}
              onChange={(event) => updateBatchField("sourceMode", event.target.value)}
            >
              <option value="manual">Manual batch</option>
              <option value="herd">Herd Tracker</option>
            </select>
          </FormField>

          <FormField label="Species">
            <select
              value={batchForm.species}
              onChange={(event) => updateBatchField("species", event.target.value)}
            >
              {speciesOptions.map((species) => (
                <option key={species}>{species}</option>
              ))}
            </select>
          </FormField>

          <FormField label="Status">
            <select
              value={batchForm.status}
              onChange={(event) => updateBatchField("status", event.target.value)}
            >
              {processingStatusOptions.map((status) => (
                <option key={status}>{status}</option>
              ))}
            </select>
          </FormField>

          <FormField label="Processor">
            <input
              value={batchForm.processor}
              onChange={(event) => updateBatchField("processor", event.target.value)}
              placeholder="USDA processor, butcher, or facility"
            />
          </FormField>

          <FormField label="Processing Date">
            <input
              type="date"
              value={batchForm.processingDate}
              onChange={(event) => updateBatchField("processingDate", event.target.value)}
            />
          </FormField>

          <FormField label="Pickup Date">
            <input
              type="date"
              value={batchForm.pickupDate}
              onChange={(event) => updateBatchField("pickupDate", event.target.value)}
            />
          </FormField>

          <FormField label="Head Count Processed">
            <input
              type="number"
              min="0"
              step="1"
              value={batchForm.headCountProcessed}
              onChange={(event) =>
                updateBatchField("headCountProcessed", event.target.value)
              }
              onBlur={(event) =>
                updateBatchField("headCountProcessed", cleanWholeNumber(event.target.value))
              }
            />
          </FormField>

          <FormField label="Live Weight">
            <input
              type="number"
              min="0"
              step="0.01"
              value={batchForm.liveWeight}
              onChange={(event) => updateBatchField("liveWeight", event.target.value)}
              onBlur={(event) => updateBatchField("liveWeight", cleanNumber(event.target.value, 2))}
              placeholder="lb"
            />
          </FormField>

          <FormField label="Hanging Weight">
            <input
              type="number"
              min="0"
              step="0.01"
              value={batchForm.hangingWeight}
              onChange={(event) => updateBatchField("hangingWeight", event.target.value)}
              onBlur={(event) =>
                updateBatchField("hangingWeight", cleanNumber(event.target.value, 2))
              }
              placeholder="lb"
            />
          </FormField>

          <FormField label="Packaged Weight">
            <input
              type="number"
              min="0"
              step="0.01"
              value={batchForm.packagedWeight}
              onChange={(event) => updateBatchField("packagedWeight", event.target.value)}
              onBlur={(event) =>
                updateBatchField("packagedWeight", cleanNumber(event.target.value, 2))
              }
              placeholder="lb"
            />
          </FormField>

          <FormField label="Processing Fee">
            <input
              type="number"
              min="0"
              step="0.01"
              value={batchForm.processingFee}
              onChange={(event) => updateBatchField("processingFee", event.target.value)}
              onBlur={(event) =>
                updateBatchField("processingFee", cleanCurrency(event.target.value))
              }
              placeholder="0.00"
            />
          </FormField>

          <FormField label="Additional Cost">
            <input
              type="number"
              min="0"
              step="0.01"
              value={batchForm.additionalCost}
              onChange={(event) => updateBatchField("additionalCost", event.target.value)}
              onBlur={(event) =>
                updateBatchField("additionalCost", cleanCurrency(event.target.value))
              }
              placeholder="packaging, transport, etc."
            />
          </FormField>

          <FormField label="Notes" fullWidth>
            <textarea
              value={batchForm.notes}
              onChange={(event) => updateBatchField("notes", event.target.value)}
              placeholder="Cut sheet notes, processor notes, pickup notes, or internal reminders..."
            />
          </FormField>
        </div>

        {batchForm.sourceRecords?.length ? (
          <div className="placeholderBox compactPlaceholder" style={{ marginTop: "12px" }}>
            Source records:{" "}
            <strong>
              {batchForm.sourceRecords.map((source) => source.name).join(", ")}
            </strong>
          </div>
        ) : null}

        <section className="hubStatGrid livestockYieldGrid" style={{ marginTop: "14px" }}>
          <StatCard
            icon={DollarSign}
            label="Source Cost"
            value={money(batchTotals.sourceCost)}
            sub="from Herd Tracker"
            accent="livestock"
          />
          <StatCard
            icon={DollarSign}
            label="Total Cost"
            value={money(batchTotals.totalCost)}
            sub="source + processing"
            accent="pricing"
          />
          <StatCard
            icon={Scale}
            label="Hanging Yield"
            value={`${round(batchTotals.hangingYield, 1)}%`}
            sub="hanging ÷ live"
            accent="orders"
          />
          <StatCard
            icon={PackageCheck}
            label="Packaged Yield"
            value={`${round(batchTotals.packagedYield, 1)}%`}
            sub="packaged ÷ hanging"
            accent="inventory"
          />
        </section>
      </WorkspacePanel>

      <WorkspacePanel
        eyebrow="Finished Products"
        title="Cuts, Yields, and Product Costs"
        actions={[
          {
            label: "Add Product",
            icon: Plus,
            onClick: addCutEntry
          },
          {
            label: savingProducts ? "Adding..." : "Add to Products",
            icon: ShoppingBag,
            variant: "secondary",
            disabled: !canPushProducts || savingProducts,
            onClick: addCutsToProductDirectory
          },
          {
            label: savingInventory ? "Adding..." : "Add to Inventory",
            icon: PackageCheck,
            disabled: !canPushProducts || savingInventory,
            onClick: addCutsToInventory
          }
        ]}
      >
        {(batchForm.cuts || []).length ? (
          <div className="livestockEditableList">
            {batchForm.cuts.map((cut, index) => {
              const unitCost = getProductUnitCost(batchForm, cut);
              const allocatedCost = getProductAllocatedCost(batchForm, cut);

              return (
                <div className="livestockEditableCard" key={cut.id || index}>
                  <div className="livestockCardHeader">
                    <strong>{cut.name || `Product ${index + 1}`}</strong>
                    <button type="button" onClick={() => removeCutEntry(index)}>
                      <Trash2 size={14} />
                    </button>
                  </div>

                  <div className="formGrid compactFormGrid">
                    <FormField label="Product Name">
                      <input
                        value={cut.name}
                        onChange={(event) => updateCutEntry(index, "name", event.target.value)}
                        placeholder="Ground Beef"
                      />
                    </FormField>

                    <FormField label="Quantity">
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={cut.quantity}
                        onChange={(event) =>
                          updateCutEntry(index, "quantity", event.target.value)
                        }
                        onBlur={(event) =>
                          updateCutEntry(index, "quantity", cleanNumber(event.target.value, 2))
                        }
                        placeholder="120"
                      />
                    </FormField>

                    <FormField label="Unit">
                      <select
                        value={cut.unit}
                        onChange={(event) => updateCutEntry(index, "unit", event.target.value)}
                      >
                        {productUnits.map((unit) => (
                          <option key={unit}>{unit}</option>
                        ))}
                      </select>
                    </FormField>

                    <FormField label="Cost Mode">
                      <select
                        value={cut.costMode || "allocated"}
                        onChange={(event) =>
                          updateCutEntry(index, "costMode", event.target.value)
                        }
                      >
                        <option value="allocated">Average allocated</option>
                        <option value="manual">Manual per unit</option>
                      </select>
                    </FormField>

                    <FormField label="Manual Cost">
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={cut.manualCostPerUnit}
                        disabled={(cut.costMode || "allocated") !== "manual"}
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
                      />
                    </FormField>

                    <FormField label="Retail Price">
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={cut.retailPrice}
                        onChange={(event) =>
                          updateCutEntry(index, "retailPrice", event.target.value)
                        }
                        onBlur={(event) =>
                          updateCutEntry(index, "retailPrice", cleanCurrency(event.target.value))
                        }
                        placeholder="0.00"
                      />
                    </FormField>

                    <FormField label="Wholesale Price">
                      <input
                        type="number"
                        min="0"
                        step="0.01"
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
                    </FormField>

                    <div className="livestockCalculatedField">
                      <span>Estimated Cost</span>
                      <strong>{money(unitCost)}</strong>
                      <small>{money(allocatedCost)} total</small>
                    </div>

                    <FormField label="Notes" fullWidth>
                      <textarea
                        value={cut.notes}
                        onChange={(event) =>
                          updateCutEntry(index, "notes", event.target.value)
                        }
                        placeholder="Packaging, cut notes, product details..."
                      />
                    </FormField>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <EmptyState
            icon={PackageCheck}
            title="No finished products yet"
            message="Add cuts like Ground Beef, Ribeye, Roast, Pork Chops, Sausage, Whole Chicken, Thighs, Bones, Fat, or Organ Meat."
            actions={[
              {
                label: "Add Product",
                icon: Plus,
                onClick: addCutEntry
              }
            ]}
          />
        )}
      </WorkspacePanel>

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        title="Delete Processing Batch?"
        message={`Are you sure you want to delete "${
          deleteTarget?.name || "this batch"
        }"? This action cannot be undone.`}
        confirmLabel="Delete"
        confirmVariant="danger"
        cancelLabel="Cancel"
        onConfirm={confirmDeleteBatch}
        onCancel={() => setDeleteTarget(null)}
      />

      <Toast
        open={Boolean(toast)}
        variant={toast?.variant}
        title={toast?.title}
        message={toast?.message}
        onClose={() => setToast(null)}
      />

      <ModuleGuideModal
        isOpen={showGuide}
        moduleKey="livestock"
        title="How to Use Butcher Board"
        onClose={() => setShowGuide(false)}
      >
        <LivestockGuideContent />
      </ModuleGuideModal>
    </div>
  );
}
