import { useEffect, useMemo, useRef, useState } from "react";
import {
  AlertCircle,
  ArrowUp,
  Beef,
  Calculator,
  CircleHelp,
  ClipboardList,
  DollarSign,
  Edit3,
  PackageCheck,
  Plus,
  Save,
  Search,
  Scale,
  Trash2,
  X
} from "lucide-react";
import { useAuth } from "../AuthContext.jsx";
import { useUnsavedChanges } from "../UnsavedChangesContext.jsx";
import StatCard from "../components/StatCard.jsx";
import ModuleGuideModal from "../components/ModuleGuideModal.jsx";
import LivestockGuideContent from "../components/LivestockGuideContent.jsx";
import { addQuantityToMatchedInventoryItem } from "../services/inventoryService.js";
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
  "Processed",
  "Sold Out",
  "Archived"
];

const inputCategories = [
  "Feed",
  "Hay",
  "Minerals",
  "Bedding",
  "Animal Purchase",
  "Vet / Health",
  "Processing",
  "Transportation",
  "Packaging",
  "Other"
];

const productUnits = ["lb", "packages", "each"];

const emptyBatch = {
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
  processing: {
    processor: "",
    liveWeight: "",
    hangingWeight: "",
    packagedWeight: "",
    processingFee: "",
    products: []
  }
};

const emptyInput = {
  date: "",
  category: "Feed",
  description: "",
  quantity: "",
  unit: "",
  cost: ""
};

function createBlankProduct() {
  return {
    name: "",
    quantity: "",
    unit: "lb",
    notes: ""
  };
}

function toNumber(value) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function round(value, places = 2) {
  return Number(value || 0).toFixed(places);
}

function cleanCurrencyInput(value) {
  if (value === "" || value === null || value === undefined) return "";
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed.toFixed(2) : "";
}

function cleanNumberInput(value, places = 2) {
  if (value === "" || value === null || value === undefined) return "";
  const parsed = Number(value);
  return Number.isFinite(parsed) ? Number(parsed.toFixed(places)).toString() : "";
}

function formatCurrency(value) {
  return `$${round(value, 2)}`;
}

function getBatchInputTotal(batch) {
  return (batch.inputs || []).reduce((sum, item) => sum + toNumber(item.cost), 0);
}

function getAnimalPurchaseTotal(batch) {
  const pricePerHead = toNumber(batch.purchasePricePerHead);
  const headCount = toNumber(batch.startingHeadCount || batch.currentHeadCount);

  if (pricePerHead && headCount) {
    return pricePerHead * headCount;
  }

  return toNumber(batch.purchaseCost);
}

function getProcessingFee(batch) {
  return toNumber(batch.processing?.processingFee);
}

function getBatchTotalCost(batch) {
  return getAnimalPurchaseTotal(batch) + getBatchInputTotal(batch) + getProcessingFee(batch);
}

function getPackagedWeight(batch) {
  return toNumber(batch.processing?.packagedWeight);
}

function getCostPerPackagedPound(batch) {
  const packagedWeight = getPackagedWeight(batch);
  if (!packagedWeight) return 0;
  return getBatchTotalCost(batch) / packagedWeight;
}

function getYieldPercent(numerator, denominator) {
  const top = toNumber(numerator);
  const bottom = toNumber(denominator);
  if (!top || !bottom) return 0;
  return (top / bottom) * 100;
}

function getProductQuantityTotal(products = []) {
  return products.reduce((sum, product) => {
    if (product.unit === "lb") return sum + toNumber(product.quantity);
    return sum;
  }, 0);
}

function getDefaultBatchName(species) {
  const year = new Date().getFullYear();
  return `${species || "Livestock"} Batch - ${year}`;
}

export default function Livestock() {
  const { user, loginWithGoogle } = useAuth();
  const { isDirty: hasUnsavedChanges, markUnsaved, markSaved } = useUnsavedChanges();

  const batchesRef = useRef(null);
  const inputsRef = useRef(null);
  const processingRef = useRef(null);
  const productsRef = useRef(null);

  const [batches, setBatches] = useState([]);
  const [batchForm, setBatchForm] = useState(emptyBatch);
  const [editingBatchId, setEditingBatchId] = useState(null);
  const [selectedBatchId, setSelectedBatchId] = useState("");
  const [inputForm, setInputForm] = useState(emptyInput);
  const [batchSearch, setBatchSearch] = useState("");
  const [statusMessage, setStatusMessage] = useState("");
  const [statusType, setStatusType] = useState("info");
  const [loading, setLoading] = useState(false);
  const [inventorySaving, setInventorySaving] = useState(false);
  const [showBackToTop, setShowBackToTop] = useState(false);
  const [showGuide, setShowGuide] = useState(false);

  function markLivestockDirty() {
    markUnsaved({
      source: "Livestock",
      onSave: savePendingLivestockChanges
    });
  }

  function showStatus(message, type = "info") {
    setStatusMessage(message);
    setStatusType(type);
  }

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

  async function savePendingLivestockChanges() {
    if (!user) return;

    if (editingBatchId || batchFormHasValues()) {
      await saveBatch();
      return;
    }

    markSaved();
  }

  function batchFormHasValues() {
    return Object.entries(batchForm).some(([key, value]) => {
      if (key === "species" || key === "status") return false;
      if (Array.isArray(value)) return value.length > 0;
      if (typeof value === "object" && value !== null) {
        return Object.values(value).some((nestedValue) => {
          if (Array.isArray(nestedValue)) return nestedValue.length > 0;
          return String(nestedValue || "").trim() !== "";
        });
      }
      return String(value || "").trim() !== "";
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

    if (!guideHidden) {
      setShowGuide(true);
    }
  }, []);

  async function loadData() {
    if (!user) return;

    setLoading(true);

    try {
      const loadedBatches = await getLivestockBatches(user.uid);
      setBatches(loadedBatches);

      if (!selectedBatchId && loadedBatches.length) {
        setSelectedBatchId(loadedBatches[0].id);
      }
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
    }
  }, [user]);

  const selectedBatch = useMemo(() => {
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

  const livestockSummary = useMemo(() => {
    const activeBatches = batches.filter(
      (batch) => !["Sold Out", "Archived"].includes(batch.status)
    );

    const headCount = activeBatches.reduce(
      (sum, batch) => sum + toNumber(batch.currentHeadCount || batch.startingHeadCount),
      0
    );

    const totalCost = batches.reduce((sum, batch) => sum + getBatchTotalCost(batch), 0);

    const packagedWeight = batches.reduce(
      (sum, batch) => sum + getPackagedWeight(batch),
      0
    );

    const inventoryReady = batches.filter(
      (batch) => (batch.processing?.products || []).some((product) => toNumber(product.quantity) > 0)
    ).length;

    return {
      activeBatches: activeBatches.length,
      headCount,
      totalCost,
      costPerPound: packagedWeight ? totalCost / packagedWeight : 0,
      inventoryReady
    };
  }, [batches]);

  const selectedBatchSummary = useMemo(() => {
    if (!selectedBatch) {
      return {
        inputTotal: 0,
        totalCost: 0,
        packagedWeight: 0,
        costPerPackagedPound: 0,
        hangingYield: 0,
        packagedYield: 0,
        productPounds: 0
      };
    }

    return {
      inputTotal: getBatchInputTotal(selectedBatch),
      totalCost: getBatchTotalCost(selectedBatch),
      packagedWeight: getPackagedWeight(selectedBatch),
      costPerPackagedPound: getCostPerPackagedPound(selectedBatch),
      hangingYield: getYieldPercent(
        selectedBatch.processing?.hangingWeight,
        selectedBatch.processing?.liveWeight
      ),
      packagedYield: getYieldPercent(
        selectedBatch.processing?.packagedWeight,
        selectedBatch.processing?.hangingWeight
      ),
      productPounds: getProductQuantityTotal(selectedBatch.processing?.products || [])
    };
  }, [selectedBatch]);

  const processingPreviewBatch = useMemo(() => {
    if (editingBatchId) return batchForm;
    return selectedBatch;
  }, [batchForm, editingBatchId, selectedBatch]);

  const processingPreviewSummary = useMemo(() => {
    if (!processingPreviewBatch) {
      return {
        hangingYield: 0,
        packagedYield: 0,
        costPerPackagedPound: 0
      };
    }

    return {
      hangingYield: getYieldPercent(
        processingPreviewBatch.processing?.hangingWeight,
        processingPreviewBatch.processing?.liveWeight
      ),
      packagedYield: getYieldPercent(
        processingPreviewBatch.processing?.packagedWeight,
        processingPreviewBatch.processing?.hangingWeight
      ),
      costPerPackagedPound: getCostPerPackagedPound(processingPreviewBatch)
    };
  }, [processingPreviewBatch]);

  const hasUnsavedProductChanges = useMemo(() => {
    if (!editingBatchId) return false;

    const productLines = batchForm.processing?.products || [];

    return productLines.some((product) => {
      return (
        product.name?.trim() ||
        toNumber(product.quantity) > 0 ||
        product.notes?.trim()
      );
    });
  }, [batchForm.processing?.products, editingBatchId]);

  function updateBatchField(field, value) {
    markLivestockDirty();

    setBatchForm((current) => ({
      ...current,
      [field]: value
    }));
  }

  function updateProcessingField(field, value) {
    markLivestockDirty();

    setBatchForm((current) => ({
      ...current,
      processing: {
        ...current.processing,
        [field]: value
      }
    }));
  }

  function updateInputField(field, value) {
    setInputForm((current) => ({
      ...current,
      [field]: value
    }));
  }

  function addProductLine() {
    markLivestockDirty();

    setBatchForm((current) => ({
      ...current,
      processing: {
        ...current.processing,
        products: [...(current.processing?.products || []), createBlankProduct()]
      }
    }));
  }

  function updateProductLine(index, field, value) {
    markLivestockDirty();

    setBatchForm((current) => {
      const products = [...(current.processing?.products || [])];
      products[index] = {
        ...products[index],
        [field]: value
      };

      return {
        ...current,
        processing: {
          ...current.processing,
          products
        }
      };
    });
  }

  function removeProductLine(index) {
    markLivestockDirty();

    setBatchForm((current) => ({
      ...current,
      processing: {
        ...current.processing,
        products: (current.processing?.products || []).filter(
          (_, productIndex) => productIndex !== index
        )
      }
    }));
  }

  function clearBatchDraft() {
    setBatchForm(emptyBatch);
    setEditingBatchId(null);
    markSaved();
  }

  async function saveBatch(event) {
    event?.preventDefault?.();

    if (!user) return;

    const cleanBatch = {
      ...batchForm,
      name: batchForm.name.trim() || getDefaultBatchName(batchForm.species),
      breed: batchForm.breed.trim(),
      startingHeadCount: cleanNumberInput(batchForm.startingHeadCount, 0),
      currentHeadCount: cleanNumberInput(
        batchForm.currentHeadCount || batchForm.startingHeadCount,
        0
      ),
      startingWeight: cleanNumberInput(batchForm.startingWeight, 2),
      purchasePricePerHead: cleanCurrencyInput(batchForm.purchasePricePerHead),
      purchaseCost: cleanCurrencyInput(
        toNumber(batchForm.purchasePricePerHead) *
          toNumber(batchForm.startingHeadCount || batchForm.currentHeadCount)
      ),
      notes: batchForm.notes.trim(),
      inputs: (batchForm.inputs || []).map((input) => ({
        ...input,
        description: input.description?.trim() || "",
        quantity: cleanNumberInput(input.quantity, 2),
        cost: cleanCurrencyInput(input.cost)
      })),
      processing: {
        ...batchForm.processing,
        processor: batchForm.processing?.processor?.trim() || "",
        liveWeight: cleanNumberInput(batchForm.processing?.liveWeight, 2),
        hangingWeight: cleanNumberInput(batchForm.processing?.hangingWeight, 2),
        packagedWeight: cleanNumberInput(batchForm.processing?.packagedWeight, 2),
        processingFee: cleanCurrencyInput(batchForm.processing?.processingFee),
        products: (batchForm.processing?.products || [])
          .filter((product) => product.name.trim() && toNumber(product.quantity) > 0)
          .map((product) => ({
            ...product,
            name: product.name.trim(),
            quantity: cleanNumberInput(product.quantity, 2),
            notes: product.notes?.trim() || ""
          }))
      }
    };

    if (!cleanBatch.name) {
      showStatus("Batch name is required.", "error");
      return;
    }

    try {
      let savedId = editingBatchId;

      if (editingBatchId) {
        await updateLivestockBatch(user.uid, editingBatchId, cleanBatch);
        showStatus("Livestock batch updated.", "success");
      } else {
        savedId = await createLivestockBatch(user.uid, cleanBatch);
        showStatus("Livestock batch saved.", "success");
      }

      setSelectedBatchId(savedId);
      setBatchForm(emptyBatch);
      setEditingBatchId(null);
      markSaved();
      await loadData();
    } catch (error) {
      console.error(error);
      showStatus("Could not save livestock batch.", "error");
    }
  }

  function editBatch(batch) {
    setEditingBatchId(batch.id);
    setBatchForm({
      ...emptyBatch,
      ...batch,
      inputs: batch.inputs || [],
      processing: {
        ...emptyBatch.processing,
        ...(batch.processing || {}),
        products: batch.processing?.products || []
      }
    });
    scrollToSection(batchesRef);
  }

  async function removeBatch(batchId) {
    if (!user) return;

    const confirmed = window.confirm("Delete this livestock batch? This cannot be undone.");
    if (!confirmed) return;

    try {
      await deleteLivestockBatch(user.uid, batchId);
      showStatus("Livestock batch deleted.", "success");

      if (selectedBatchId === batchId) setSelectedBatchId("");
      if (editingBatchId === batchId) clearBatchDraft();

      await loadData();
    } catch (error) {
      console.error(error);
      showStatus("Could not delete livestock batch.", "error");
    }
  }

  async function addInputToSelectedBatch(event) {
    event?.preventDefault?.();

    if (!user || !selectedBatch) {
      showStatus("Select a saved batch before adding input costs.", "error");
      return;
    }

    const cleanInput = {
      ...inputForm,
      description: inputForm.description.trim(),
      quantity: cleanNumberInput(inputForm.quantity, 2),
      cost: cleanCurrencyInput(inputForm.cost)
    };

    if (!cleanInput.description && !cleanInput.cost) {
      showStatus("Add a description or cost before saving an input.", "error");
      return;
    }

    try {
      const nextInputs = [...(selectedBatch.inputs || []), cleanInput];

      await updateLivestockBatch(user.uid, selectedBatch.id, {
        inputs: nextInputs
      });

      setInputForm(emptyInput);
      showStatus("Input cost added.", "success");
      await loadData();
    } catch (error) {
      console.error(error);
      showStatus("Could not add input cost.", "error");
    }
  }

  async function removeInputFromSelectedBatch(index) {
    if (!user || !selectedBatch) return;

    try {
      const nextInputs = (selectedBatch.inputs || []).filter(
        (_, inputIndex) => inputIndex !== index
      );

      await updateLivestockBatch(user.uid, selectedBatch.id, {
        inputs: nextInputs
      });

      showStatus("Input cost removed.", "success");
      await loadData();
    } catch (error) {
      console.error(error);
      showStatus("Could not remove input cost.", "error");
    }
  }

  function handleProcessingBatchChange(batchId) {
    setSelectedBatchId(batchId);

    const batch = batches.find((item) => item.id === batchId);

    if (!batch) {
      clearBatchDraft();
      return;
    }

    setEditingBatchId(batch.id);
    setBatchForm({
      ...emptyBatch,
      ...batch,
      inputs: batch.inputs || [],
      processing: {
        ...emptyBatch.processing,
        ...(batch.processing || {}),
        products: batch.processing?.products || []
      }
    });
  }

  function loadSelectedBatchIntoProcessingForm() {
    if (!selectedBatch) {
      showStatus("Select a saved batch first.", "error");
      return;
    }

    editBatch(selectedBatch);
    scrollToSection(processingRef);
  }

  async function addProductsToInventory() {
    if (!user || !selectedBatch) return;

    const products = (selectedBatch.processing?.products || []).filter(
      (product) => product.name && toNumber(product.quantity) > 0
    );

    if (!products.length) {
      showStatus("Add finished product yields before sending to inventory.", "error");
      return;
    }

    setInventorySaving(true);

    try {
      const costPerPound = getCostPerPackagedPound(selectedBatch);

      await Promise.all(
        products.map((product) => {
          const quantity = toNumber(product.quantity);
          const unit = product.unit || "lb";
          const isPoundBased = unit === "lb";

          return addQuantityToMatchedInventoryItem({
            userId: user.uid,
            match: {
              productId: `livestock-${selectedBatch.id}-${product.name}`,
              variantName: unit,
              sourceModule: "Livestock"
            },
            itemDefaults: {
              name: `${selectedBatch.name} - ${product.name}`,
              category: "Meat & Livestock",
              sourceModule: "Livestock",
              productId: `livestock-${selectedBatch.id}-${product.name}`,
              productName: selectedBatch.name,
              recipeId: selectedBatch.id,
              recipeName: selectedBatch.name,
              variantId: `livestock-${selectedBatch.id}-${product.name}-${unit}`,
              variantName: unit,
              quantityOnHand: 0,
              unit,
              costPerUnit: isPoundBased ? costPerPound : "",
              retailPrice: "",
              wholesalePrice: "",
              status: "In Stock",
              notes:
                product.notes ||
                `Added from Livestock processing yield. Species: ${selectedBatch.species}.`
            },
            quantityToAdd: quantity
          });
        })
      );

      showStatus("Finished livestock products added to inventory.", "success");
    } catch (error) {
      console.error(error);
      showStatus("Could not add products to inventory.", "error");
    } finally {
      setInventorySaving(false);
    }
  }

  const sectionCards = [
    {
      title: "Animal Batches",
      description: "Track livestock groups without managing every animal individually.",
      icon: Beef,
      ref: batchesRef
    },
    {
      title: "Feed & Inputs",
      description: "Log feed, hay, minerals, vet costs, processing, and other expenses.",
      icon: ClipboardList,
      ref: inputsRef
    },
    {
      title: "Processing",
      description: "Record live, hanging, packaged weights, processor, dates, and fees.",
      icon: Scale,
      ref: processingRef
    },
    {
      title: "Finished Products",
      description: "Create cut yields and send pounds or packages to Inventory.",
      icon: PackageCheck,
      ref: productsRef
    }
  ];

  if (!user) {
    return (
      <div className="modulePage livestockPage">
        <section className="farmModuleHero livestockHero">
          <div className="farmModuleHeroText">
            <p className="eyebrow">Livestock</p>
            <h2>Sign in to manage livestock batches.</h2>
            <p>
              Track animal groups, input costs, processing yields, and finished meat
              inventory from your Farmers Hub account.
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
    <div className="modulePage livestockPage">
      <section className="farmModuleHero livestockHero moduleHeroWithActions">
        <div className="farmModuleHeroText">
          <p className="eyebrow">Livestock</p>
          <h2>Track animal batches, processing yields, and meat inventory.</h2>
          <p>
            Keep livestock records simple by managing batches, logging feed and input
            costs, calculating processing yields, and sending finished cuts to Inventory.
          </p>
        </div>

        <div className="farmModuleHeroActions">
          <button
            className="secondaryButton compactButton moduleGuideButton"
            type="button"
            onClick={() => setShowGuide(true)}
          >
            <CircleHelp size={15} />
            Guide
          </button>
        </div>
      </section>

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

      <section className="hubStatGrid livestockStatGrid">
        <StatCard
          icon={Beef}
          label="Active Batches"
          value={livestockSummary.activeBatches}
          sub="Groups currently tracked"
          accent="livestock"
        />

        <StatCard
          icon={ClipboardList}
          label="Head Count"
          value={livestockSummary.headCount}
          sub="Active animals"
          accent="market"
        />

        <StatCard
          icon={DollarSign}
          label="Total Cost"
          value={formatCurrency(livestockSummary.totalCost)}
          sub="Animal, inputs, and processing"
          accent="pricing"
        />

        <StatCard
          icon={PackageCheck}
          label="Inventory Ready"
          value={livestockSummary.inventoryReady}
          sub="Batches with finished products"
          accent="inventory"
        />
      </section>

      <section className="toolGrid compactToolGrid">
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

      <section className="livestockFlowGrid compactWorkspace">
        <div className="workspacePanel compactPanel scrollAnchor" ref={batchesRef}>
          <div className="workspaceHeader compactPanelHeader">
            <div>
              <p className="eyebrow">Batch Manager</p>
              <h3>Animal Batches</h3>
            </div>

            <div className="searchBox compactSearch">
              <Search size={17} />
              <input
                value={batchSearch}
                onChange={(event) => setBatchSearch(event.target.value)}
                placeholder="Search batches..."
              />
            </div>
          </div>

          <form className="formGrid compactFormGrid" onSubmit={saveBatch}>
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
              Processing Date
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
                    cleanCurrencyInput(event.target.value)
                  )
                }
                placeholder="e.g., 75.00"
              />
            </label>

            <div className="livestockCalculatedField">
              <span>Total Animal Cost</span>
              <strong>{formatCurrency(getAnimalPurchaseTotal(batchForm))}</strong>
            </div>

            <label className="fullSpan">
              Notes
              <textarea
                value={batchForm.notes}
                onChange={(event) => updateBatchField("notes", event.target.value)}
                placeholder="Pasture group, feed plan, processing notes, customer notes"
              />
            </label>

            <div className="formActions fullSpan compactActions">
              <button
                className={`primaryButton compactPrimary ${
                  hasUnsavedChanges ? "dirtySaveButton" : ""
                }`}
                type="submit"
              >
                <Save size={15} />
                {editingBatchId ? "Update Batch" : "Save Batch"}
              </button>

              <button
                className="secondaryButton compactButton"
                type="button"
                onClick={clearBatchDraft}
              >
                Clear
              </button>
            </div>
          </form>

          <div className="savedList compactSavedList livestockBatchList">
            <h4 className="smallSectionTitle">Saved Batches</h4>

            {filteredBatches.length ? (
              filteredBatches.map((batch) => {
                const isSelected = selectedBatchId === batch.id;

                return (
                  <div
                    className={`savedItem compactSavedItem livestockBatchItem ${
                      isSelected ? "selected" : ""
                    }`}
                    key={batch.id}
                  >
                    <div>
                      <h4>
                        <button
                          type="button"
                          className="savedItemLink"
                          onClick={() => setSelectedBatchId(batch.id)}
                        >
                          {batch.name}
                        </button>
                      </h4>
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
                      <button type="button" onClick={() => editBatch(batch)}>
                        <Edit3 size={14} />
                      </button>

                      <button type="button" onClick={() => removeBatch(batch.id)}>
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="placeholderBox compactPlaceholder">
                No livestock batches saved yet.
              </div>
            )}
          </div>
        </div>

        <div className="workspacePanel compactPanel scrollAnchor" ref={inputsRef}>
          <div className="workspaceHeader compactPanelHeader">
            <div>
              <p className="eyebrow">Feed & Inputs</p>
              <h3>Input Cost Log</h3>
            </div>

            <select
              className="compactSelect"
              value={selectedBatchId}
              onChange={(event) => setSelectedBatchId(event.target.value)}
            >
              <option value="">Select batch</option>
              {batches.map((batch) => (
                <option key={batch.id} value={batch.id}>
                  {batch.name}
                </option>
              ))}
            </select>
          </div>

          {selectedBatch ? (
            <>
              <form className="formGrid compactFormGrid" onSubmit={addInputToSelectedBatch}>
                <label>
                  Date
                  <input
                    type="date"
                    value={inputForm.date}
                    onChange={(event) => updateInputField("date", event.target.value)}
                  />
                </label>

                <label>
                  Category
                  <select
                    value={inputForm.category}
                    onChange={(event) =>
                      updateInputField("category", event.target.value)
                    }
                  >
                    {inputCategories.map((category) => (
                      <option key={category}>{category}</option>
                    ))}
                  </select>
                </label>

                <label className="fullSpan">
                  Description
                  <input
                    value={inputForm.description}
                    onChange={(event) =>
                      updateInputField("description", event.target.value)
                    }
                    placeholder="e.g., 50 lb organic feed, butcher deposit, hay"
                  />
                </label>

                <label>
                  Quantity
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={inputForm.quantity}
                    onChange={(event) => updateInputField("quantity", event.target.value)}
                    placeholder="e.g., 3"
                  />
                </label>

                <label>
                  Unit
                  <input
                    value={inputForm.unit}
                    onChange={(event) => updateInputField("unit", event.target.value)}
                    placeholder="e.g., bags, bales, miles"
                  />
                </label>

                <label>
                  Cost
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={inputForm.cost}
                    onChange={(event) => updateInputField("cost", event.target.value)}
                    onBlur={(event) =>
                      updateInputField("cost", cleanCurrencyInput(event.target.value))
                    }
                    placeholder="e.g., 84.50"
                  />
                </label>

                <div className="formActions fullSpan compactActions">
                  <button className="primaryButton compactPrimary" type="submit">
                    <Plus size={15} />
                    Add Input
                  </button>
                </div>
              </form>

              <div className="inventoryDetailGrid livestockCostSummary">
                <div>
                  <span>Animal Cost</span>
                  <strong>{formatCurrency(getAnimalPurchaseTotal(selectedBatch))}</strong>
                </div>

                <div>
                  <span>Input Cost</span>
                  <strong>{formatCurrency(selectedBatchSummary.inputTotal)}</strong>
                </div>

                <div>
                  <span>Total Batch Cost</span>
                  <strong>{formatCurrency(selectedBatchSummary.totalCost)}</strong>
                </div>

                <div>
                  <span>Cost / Packaged lb</span>
                  <strong>{formatCurrency(selectedBatchSummary.costPerPackagedPound)}</strong>
                </div>
              </div>

              <div className="savedList compactSavedList livestockInputList">
                {(selectedBatch.inputs || []).length ? (
                  selectedBatch.inputs.map((input, index) => (
                    <div className="savedItem compactSavedItem" key={`${input.description}-${index}`}>
                      <div>
                        <h4>{input.description || input.category}</h4>
                        <p>
                          {input.date || "No date"} • {input.category}
                          {input.quantity ? ` • ${input.quantity} ${input.unit || ""}` : ""}
                        </p>
                      </div>

                      <div className="itemActions">
                        <strong>{formatCurrency(input.cost)}</strong>
                        <button
                          type="button"
                          onClick={() => removeInputFromSelectedBatch(index)}
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="placeholderBox compactPlaceholder">
                    No input costs logged for this batch yet.
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="placeholderBox compactPlaceholder">
              Select a saved batch to log feed, hay, processing, and other input costs.
            </div>
          )}
        </div>

        <div className="workspacePanel compactPanel scrollAnchor" ref={processingRef}>
          <div className="workspaceHeader compactPanelHeader">
            <div>
              <p className="eyebrow">Processing</p>
              <h3>Processing & Yield</h3>
            </div>

            <div className="livestockProcessingControls">
              <select
                className="compactSelect"
                value={selectedBatchId}
                onChange={(event) => handleProcessingBatchChange(event.target.value)}
              >
                <option value="">Select batch</option>
                {batches.map((batch) => (
                  <option key={batch.id} value={batch.id}>
                    {batch.name}
                  </option>
                ))}
              </select>

              <button
                className="secondaryButton compactButton"
                type="button"
                onClick={loadSelectedBatchIntoProcessingForm}
                disabled={!selectedBatch}
              >
                <Edit3 size={15} />
                Edit Selected Batch
              </button>
            </div>
          </div>

          <p className="helperText">
            Select the batch you want to update, enter the processing weights and fee,
            then review the live calculations below before saving.
          </p>

          <div className="formGrid compactFormGrid">
            <label>
              Processor
              <input
                value={batchForm.processing?.processor || ""}
                onChange={(event) =>
                  updateProcessingField("processor", event.target.value)
                }
                placeholder="e.g., USDA processor"
              />
            </label>

            <label>
              Pickup Date
              <input
                type="date"
                value={batchForm.pickupDate || ""}
                onChange={(event) => updateBatchField("pickupDate", event.target.value)}
              />
            </label>

            <label>
              Live Weight
              <input
                type="number"
                step="0.01"
                min="0"
                value={batchForm.processing?.liveWeight || ""}
                onChange={(event) =>
                  updateProcessingField("liveWeight", event.target.value)
                }
                placeholder="Total lbs"
              />
            </label>

            <label>
              Hanging Weight
              <input
                type="number"
                step="0.01"
                min="0"
                value={batchForm.processing?.hangingWeight || ""}
                onChange={(event) =>
                  updateProcessingField("hangingWeight", event.target.value)
                }
                placeholder="Total lbs"
              />
            </label>

            <label>
              Packaged Weight
              <input
                type="number"
                step="0.01"
                min="0"
                value={batchForm.processing?.packagedWeight || ""}
                onChange={(event) =>
                  updateProcessingField("packagedWeight", event.target.value)
                }
                placeholder="Total lbs"
              />
            </label>

            <label>
              Processing Fee
              <input
                type="number"
                step="0.01"
                min="0"
                value={batchForm.processing?.processingFee || ""}
                onChange={(event) =>
                  updateProcessingField("processingFee", event.target.value)
                }
                onBlur={(event) =>
                  updateProcessingField(
                    "processingFee",
                    cleanCurrencyInput(event.target.value)
                  )
                }
                placeholder="e.g., 325.00"
              />
            </label>
          </div>

          {editingBatchId ? (
            <div className="formActions compactActions">
              <button
                className={`primaryButton compactPrimary ${
                  hasUnsavedChanges ? "dirtySaveButton" : ""
                }`}
                type="button"
                onClick={saveBatch}
              >
                <Save size={15} />
                Save Processing Details
              </button>
            </div>
          ) : null}

          {processingPreviewBatch ? (
            <div className="hubStatGrid livestockYieldGrid">
              <StatCard
                icon={Scale}
                label="Hanging Yield"
                value={`${round(processingPreviewSummary.hangingYield, 1)}%`}
                sub="Hanging ÷ live weight"
                accent="livestock"
              />

              <StatCard
                icon={PackageCheck}
                label="Packaged Yield"
                value={`${round(processingPreviewSummary.packagedYield, 1)}%`}
                sub="Packaged ÷ hanging weight"
                accent="inventory"
              />

              <StatCard
                icon={DollarSign}
                label="Cost / Packaged lb"
                value={formatCurrency(processingPreviewSummary.costPerPackagedPound)}
                sub="Total cost ÷ packaged weight"
                accent="pricing"
              />
            </div>
          ) : null}
        </div>

        <div className="workspacePanel compactPanel scrollAnchor livestockProductsPanel" ref={productsRef}>
          <div className="workspaceHeader compactPanelHeader">
            <div>
              <p className="eyebrow">Finished Products</p>
              <h3>Cut Yield Builder</h3>
            </div>

            <button
              className={`primaryButton compactPrimary ${
                hasUnsavedProductChanges ? "dirtySaveButton" : ""
              }`}
              type="button"
              onClick={addProductsToInventory}
              disabled={!selectedBatch || inventorySaving}
              title={
                hasUnsavedProductChanges
                  ? "Save product yields before adding them to Inventory."
                  : "Add saved product yields to Inventory."
              }
            >
              <PackageCheck size={15} />
              {inventorySaving ? "Adding..." : "Add to Inventory"}
            </button>
          </div>

          <p className="helperText">
            Add finished cuts or packaged products to the selected batch, save the
            batch, then send those products to Inventory.
          </p>

          <div className="recipeLines compactRecipeLines">
            <div className="recipeLineHeader">
              <h4>Finished Products</h4>
              <button
                className="secondaryButton compactButton"
                type="button"
                onClick={addProductLine}
              >
                <Plus size={15} />
                Add Product
              </button>
            </div>

            {(batchForm.processing?.products || []).length ? (
              <>
                <div className="livestockProductRow livestockProductHeader">
                  <span>Product</span>
                  <span>Quantity</span>
                  <span>Unit</span>
                  <span>Notes</span>
                  <span>Action</span>
                </div>

                {(batchForm.processing?.products || []).map((product, index) => (
                  <div className="livestockProductRow" key={`livestock-product-${index}`}>
                    <input
                      value={product.name}
                      onChange={(event) =>
                        updateProductLine(index, "name", event.target.value)
                      }
                      placeholder="e.g., Ground Beef"
                    />

                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={product.quantity}
                      onChange={(event) =>
                        updateProductLine(index, "quantity", event.target.value)
                      }
                      placeholder="e.g., 120"
                    />

                    <select
                      value={product.unit}
                      onChange={(event) =>
                        updateProductLine(index, "unit", event.target.value)
                      }
                    >
                      {productUnits.map((unit) => (
                        <option key={unit} value={unit}>
                          {unit}
                        </option>
                      ))}
                    </select>

                    <input
                      value={product.notes || ""}
                      onChange={(event) =>
                        updateProductLine(index, "notes", event.target.value)
                      }
                      placeholder="Optional"
                    />

                    <button
                      className="iconButton danger"
                      type="button"
                      onClick={() => removeProductLine(index)}
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                ))}

                {editingBatchId ? (
                  <div className="formActions compactActions">
                    <button
                      className={`primaryButton compactPrimary ${
                        hasUnsavedChanges ? "dirtySaveButton" : ""
                      }`}
                      type="button"
                      onClick={saveBatch}
                    >
                      <Save size={15} />
                      Save Product Yields
                    </button>
                  </div>
                ) : null}
              </>
            ) : (
              <div className="placeholderBox compactPlaceholder">
                Edit a saved batch, then add finished product yields like Ground Beef,
                Ribeye, Pork Chops, Whole Chicken, or Sausage.
              </div>
            )}
          </div>

          {selectedBatch ? (
            <div className="savedList compactSavedList">
              <h4 className="smallSectionTitle">Saved Product Yields</h4>

              {(selectedBatch.processing?.products || []).length ? (
                selectedBatch.processing.products.map((product, index) => (
                  <div className="savedItem compactSavedItem" key={`${product.name}-${index}`}>
                    <div>
                      <h4>{product.name}</h4>
                      <p>{product.notes || "No notes saved."}</p>
                    </div>

                    <strong>
                      {product.quantity} {product.unit}
                    </strong>
                  </div>
                ))
              ) : (
                <div className="placeholderBox compactPlaceholder">
                  No finished product yields saved for this batch yet.
                </div>
              )}
            </div>
          ) : null}
        </div>
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
