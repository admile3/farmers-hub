import { useEffect, useMemo, useState } from "react";
import {
  Calculator,
  CheckSquare,
  ClipboardCheck,
  Edit3,
  Flower2,
  HelpCircle,
  Library,
  MapPin,
  PackageCheck,
  Plus,
  Save,
  Search,
  Trash2
} from "lucide-react";

import { useAuth } from "../AuthContext.jsx";
import { useUnsavedChanges } from "../UnsavedChangesContext.jsx";
import ModuleGuideModal from "../components/ModuleGuideModal.jsx";
import FlowerStudioGuideContent from "../components/FlowerStudioGuideContent.jsx";
import StatCard from "../components/StatCard.jsx";
import { addQuantityToMatchedInventoryItem } from "../services/inventoryService.js";
import { getZoneFromZip } from "../data/zipZoneLookup.js";
import { getFlowersForZone, usdaZones } from "../data/flowerZoneLibrary.js";
import { getFlowerVisualByName } from "../data/flowerVisualDatabase.js";
import {
  createFlowerArrangement,
  createFlowerItem,
  createFlowerProductionLog,
  deleteFlowerArrangement,
  deleteFlowerItem,
  deleteFlowerProductionLog,
  getFlowerArrangements,
  getFlowerItems,
  getFlowerProductionLogs,
  updateFlowerArrangement,
  updateFlowerItem
} from "../services/flowerStudioService.js";

const flowerCategories = [
  "Focal",
  "Filler",
  "Greenery",
  "Spike",
  "Texture",
  "Hanging",
  "Dried",
  "Packaging",
  "Other"
];

const emptyFlower = {
  name: "",
  category: "Focal",
  color: "",
  bloomSeason: "",
  useType: "",
  difficulty: "",
  stemCost: "",
  inventoryCount: "",
  notes: "",
  source: "Manual",
  zone: ""
};

const emptyArrangement = {
  name: "",
  category: "Market Bouquet",
  description: "",
  retailPrice: "",
  wholesalePrice: "",
  packagingCost: "",
  stems: []
};

const emptyProduction = {
  arrangementId: "",
  productionDate: "",
  quantity: "",
  eventName: "",
  customerName: "",
  notes: ""
};

function makeId(prefix) {
  return `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function toNumber(value) {
  const number = Number(value);
  return Number.isFinite(number) ? number : 0;
}

function money(value) {
  return `$${toNumber(value).toFixed(2)}`;
}

function cleanMoney(value) {
  if (value === "" || value === null || value === undefined) return "";
  const number = Number(value);
  return Number.isFinite(number) ? number.toFixed(2) : "";
}

function blankStemLine() {
  return {
    id: makeId("stem"),
    flowerId: "",
    flowerName: "",
    stemsPerArrangement: ""
  };
}

export default function FlowerStudio() {
  const { user, loginWithGoogle } = useAuth();
  const { isDirty: hasUnsavedChanges, markUnsaved, markSaved } =
    useUnsavedChanges();

  const [flowers, setFlowers] = useState([]);
  const [arrangements, setArrangements] = useState([]);
  const [logs, setLogs] = useState([]);
  const [flowerForm, setFlowerForm] = useState(emptyFlower);
  const [editingFlowerId, setEditingFlowerId] = useState(null);
  const [arrangementForm, setArrangementForm] = useState(emptyArrangement);
  const [editingArrangementId, setEditingArrangementId] = useState(null);
  const [productionForm, setProductionForm] = useState(emptyProduction);
  const [zipInput, setZipInput] = useState("");
  const [selectedZone, setSelectedZone] = useState("");
  const [zoneError, setZoneError] = useState("");
  const [selectedLibraryFlowers, setSelectedLibraryFlowers] = useState([]);
  const [previewFlowerVisual, setPreviewFlowerVisual] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusMessage, setStatusMessage] = useState("");
  const [statusType, setStatusType] = useState("success");
  const [loading, setLoading] = useState(false);
  const [savingInventory, setSavingInventory] = useState(false);
  const [showGuide, setShowGuide] = useState(false);

  function showStatus(message, type = "success") {
    setStatusMessage(message);
    setStatusType(type);
  }

  function markFlowerDirty() {
    markUnsaved({
      source: "Flower Studio",
      onSave: async () => {
        markSaved();
        return true;
      }
    });
  }

  async function loadData() {
    if (!user) return;

    setLoading(true);

    try {
      const [savedFlowers, savedArrangements, savedLogs] = await Promise.all([
        getFlowerItems(user.uid),
        getFlowerArrangements(user.uid),
        getFlowerProductionLogs(user.uid)
      ]);

      setFlowers(savedFlowers);
      setArrangements(savedArrangements);
      setLogs(savedLogs);
    } catch (error) {
      console.error(error);
      showStatus("Could not load Flower Studio data.", "error");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (user) {
      loadData();
    } else {
      setFlowers([]);
      setArrangements([]);
      setLogs([]);
    }
  }, [user]);

  useEffect(() => {
    if (!statusMessage) return;

    const timer = window.setTimeout(() => setStatusMessage(""), 3000);
    return () => window.clearTimeout(timer);
  }, [statusMessage]);

  useEffect(() => {
    if (!user) return;

    const hidden =
      localStorage.getItem("hideModuleGuide_flowerStudio") === "true";
    if (!hidden) setShowGuide(true);
  }, [user]);

  const zoneFlowers = useMemo(
    () => getFlowersForZone(selectedZone),
    [selectedZone]
  );

  useEffect(() => {
    if (!selectedZone) {
      setSelectedLibraryFlowers([]);
      return;
    }

    setSelectedLibraryFlowers(
      getFlowersForZone(selectedZone).map((flower) => flower.name)
    );
  }, [selectedZone]);

  const selectedArrangement = useMemo(() => {
    return (
      arrangements.find((item) => item.id === productionForm.arrangementId) ||
      null
    );
  }, [arrangements, productionForm.arrangementId]);

  const arrangementCost = useMemo(() => {
    return (arrangementForm.stems || []).reduce((sum, line) => {
      const flower = flowers.find((item) => item.id === line.flowerId);
      return sum + toNumber(flower?.stemCost) * toNumber(line.stemsPerArrangement);
    }, toNumber(arrangementForm.packagingCost));
  }, [arrangementForm, flowers]);

  const productionSummary = useMemo(() => {
    if (!selectedArrangement) {
      return {
        quantity: 0,
        totalStems: 0,
        cost: 0,
        revenue: 0,
        profit: 0,
        stemLines: []
      };
    }

    const quantity = toNumber(productionForm.quantity);
    const stemLines = (selectedArrangement.stems || []).map((line) => {
      const totalNeeded = quantity * toNumber(line.stemsPerArrangement);
      const flower = flowers.find((item) => item.id === line.flowerId);
      const cost = totalNeeded * toNumber(flower?.stemCost);

      return {
        ...line,
        totalNeeded,
        cost
      };
    });

    const stemsCost = stemLines.reduce((sum, line) => sum + line.cost, 0);
    const packagingCost = quantity * toNumber(selectedArrangement.packagingCost);
    const cost = stemsCost + packagingCost;
    const revenue = quantity * toNumber(selectedArrangement.retailPrice);
    const profit = revenue - cost;

    return {
      quantity,
      totalStems: stemLines.reduce((sum, line) => sum + line.totalNeeded, 0),
      cost,
      revenue,
      profit,
      stemLines
    };
  }, [selectedArrangement, productionForm.quantity, flowers]);

  const dashboardSummary = useMemo(() => {
    const finished = logs.reduce((sum, log) => sum + toNumber(log.quantity), 0);

    return {
      flowers: flowers.length,
      arrangements: arrangements.length,
      logs: logs.length,
      finished
    };
  }, [flowers, arrangements, logs]);

  const filteredArrangements = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();

    return arrangements.filter((item) => {
      if (!query) return true;

      return (
        item.name?.toLowerCase().includes(query) ||
        item.category?.toLowerCase().includes(query) ||
        item.description?.toLowerCase().includes(query)
      );
    });
  }, [arrangements, searchTerm]);

  async function detectZoneFromZip() {
    setZoneError("");

    try {
      const zone = await getZoneFromZip(zipInput);

      if (!zone) {
        setZoneError("No USDA zone found for that ZIP code.");
        return;
      }

      setSelectedZone(zone);
      showStatus(`Detected USDA Zone ${zone}.`);
    } catch (error) {
      console.error(error);
      setZoneError("Could not load the ZIP zone dataset.");
    }
  }

  function toggleLibraryFlower(name) {
    setSelectedLibraryFlowers((current) =>
      current.includes(name)
        ? current.filter((item) => item !== name)
        : [...current, name]
    );
  }

  async function importSelectedFlowers() {
    if (!user || !selectedZone) return;

    const selected = zoneFlowers.filter((flower) =>
      selectedLibraryFlowers.includes(flower.name)
    );

    if (!selected.length) {
      showStatus("Select at least one flower to import.", "error");
      return;
    }

    const existingNames = new Set(
      flowers.map((flower) => flower.name.toLowerCase())
    );

    try {
      await Promise.all(
        selected
          .filter((flower) => !existingNames.has(flower.name.toLowerCase()))
          .map((flower) =>
            createFlowerItem(user.uid, {
              name: flower.name,
              category: flower.category,
              color: flower.colors,
              bloomSeason: flower.bloomSeason,
              useType: flower.useType,
              difficulty: flower.difficulty,
              notes: flower.notes,
              source: "Zone Library",
              zone: selectedZone
            })
          )
      );

      showStatus("Selected flowers imported.");
      await loadData();
    } catch (error) {
      console.error(error);
      showStatus("Could not import flowers.", "error");
    }
  }

  function updateFlowerField(field, value) {
    markFlowerDirty();
    setFlowerForm((current) => ({ ...current, [field]: value }));
  }

  async function saveFlower(event) {
    event?.preventDefault?.();

    if (!user) return;

    const cleanFlower = {
      ...flowerForm,
      name: flowerForm.name.trim(),
      stemCost: cleanMoney(flowerForm.stemCost),
      inventoryCount: toNumber(flowerForm.inventoryCount)
    };

    if (!cleanFlower.name) {
      showStatus("Flower name is required.", "error");
      return;
    }

    try {
      if (editingFlowerId) {
        await updateFlowerItem(user.uid, editingFlowerId, cleanFlower);
        showStatus("Flower updated.");
      } else {
        await createFlowerItem(user.uid, cleanFlower);
        showStatus("Flower saved.");
      }

      setFlowerForm(emptyFlower);
      setEditingFlowerId(null);
      markSaved();
      await loadData();
    } catch (error) {
      console.error(error);
      showStatus("Could not save flower.", "error");
    }
  }

  function editFlower(flower) {
    setEditingFlowerId(flower.id);
    setFlowerForm({
      name: flower.name || "",
      category: flower.category || "Focal",
      color: flower.color || "",
      bloomSeason: flower.bloomSeason || "",
      useType: flower.useType || "",
      difficulty: flower.difficulty || "",
      stemCost: cleanMoney(flower.stemCost),
      inventoryCount: flower.inventoryCount || "",
      notes: flower.notes || "",
      source: flower.source || "Manual",
      zone: flower.zone || ""
    });
  }

  async function removeFlower(flowerId) {
    if (!user) return;

    try {
      await deleteFlowerItem(user.uid, flowerId);
      showStatus("Flower deleted.");
      await loadData();
    } catch (error) {
      console.error(error);
      showStatus("Could not delete flower.", "error");
    }
  }

  function updateArrangementField(field, value) {
    markFlowerDirty();
    setArrangementForm((current) => ({ ...current, [field]: value }));
  }

  function addStemLine() {
    markFlowerDirty();
    setArrangementForm((current) => ({
      ...current,
      stems: [...(current.stems || []), blankStemLine()]
    }));
  }

  function updateStemLine(index, field, value) {
    markFlowerDirty();

    setArrangementForm((current) => {
      const stems = [...(current.stems || [])];
      const nextLine = { ...stems[index], [field]: value };

      if (field === "flowerId") {
        const flower = flowers.find((item) => item.id === value);
        nextLine.flowerName = flower?.name || "";
      }

      stems[index] = nextLine;

      return { ...current, stems };
    });
  }

  function removeStemLine(index) {
    markFlowerDirty();

    setArrangementForm((current) => ({
      ...current,
      stems: (current.stems || []).filter((_, lineIndex) => lineIndex !== index)
    }));
  }

  async function saveArrangement(event) {
    event?.preventDefault?.();

    if (!user) return;

    const cleanArrangement = {
      name: arrangementForm.name.trim(),
      category: arrangementForm.category.trim() || "Arrangement",
      description: arrangementForm.description.trim(),
      retailPrice:
        arrangementForm.retailPrice === ""
          ? ""
          : toNumber(arrangementForm.retailPrice),
      wholesalePrice:
        arrangementForm.wholesalePrice === ""
          ? ""
          : toNumber(arrangementForm.wholesalePrice),
      packagingCost:
        arrangementForm.packagingCost === ""
          ? ""
          : toNumber(arrangementForm.packagingCost),
      estimatedCost: arrangementCost,
      stems: (arrangementForm.stems || [])
        .filter((line) => line.flowerId && toNumber(line.stemsPerArrangement) > 0)
        .map((line) => ({
          flowerId: line.flowerId,
          flowerName: line.flowerName,
          stemsPerArrangement: toNumber(line.stemsPerArrangement)
        }))
    };

    if (!cleanArrangement.name) {
      showStatus("Arrangement name is required.", "error");
      return;
    }

    if (!cleanArrangement.stems.length) {
      showStatus("Add at least one stem line.", "error");
      return;
    }

    try {
      if (editingArrangementId) {
        await updateFlowerArrangement(
          user.uid,
          editingArrangementId,
          cleanArrangement
        );
        showStatus("Arrangement updated.");
      } else {
        await createFlowerArrangement(user.uid, cleanArrangement);
        showStatus("Arrangement saved.");
      }

      setArrangementForm(emptyArrangement);
      setEditingArrangementId(null);
      markSaved();
      await loadData();
    } catch (error) {
      console.error(error);
      showStatus("Could not save arrangement.", "error");
    }
  }

  function editArrangement(arrangement) {
    setEditingArrangementId(arrangement.id);
    setArrangementForm({
      name: arrangement.name || "",
      category: arrangement.category || "Arrangement",
      description: arrangement.description || "",
      retailPrice: arrangement.retailPrice || "",
      wholesalePrice: arrangement.wholesalePrice || "",
      packagingCost: arrangement.packagingCost || "",
      stems: arrangement.stems || []
    });
  }

  async function removeArrangement(arrangementId) {
    if (!user) return;

    try {
      await deleteFlowerArrangement(user.uid, arrangementId);
      showStatus("Arrangement deleted.");
      await loadData();
    } catch (error) {
      console.error(error);
      showStatus("Could not delete arrangement.", "error");
    }
  }

  async function saveProductionLog(event) {
    event?.preventDefault?.();

    if (!user || !selectedArrangement) {
      showStatus("Select an arrangement first.", "error");
      return;
    }

    if (!productionForm.productionDate || !productionForm.quantity) {
      showStatus("Production date and quantity are required.", "error");
      return;
    }

    const cleanLog = {
      arrangementId: selectedArrangement.id,
      arrangementName: selectedArrangement.name,
      productionDate: productionForm.productionDate,
      quantity: toNumber(productionForm.quantity),
      eventName: productionForm.eventName.trim(),
      customerName: productionForm.customerName.trim(),
      notes: productionForm.notes.trim(),
      summary: productionSummary
    };

    try {
      await createFlowerProductionLog(user.uid, cleanLog);
      showStatus("Production logged.");
      setProductionForm(emptyProduction);
      await loadData();
    } catch (error) {
      console.error(error);
      showStatus("Could not save production log.", "error");
    }
  }

  async function addProductionToInventory() {
    if (!user || !selectedArrangement) {
      showStatus("Select an arrangement before adding inventory.", "error");
      return;
    }

    const quantity = toNumber(productionForm.quantity);

    if (quantity <= 0) {
      showStatus("Enter a finished quantity first.", "error");
      return;
    }

    setSavingInventory(true);

    try {
      await addQuantityToMatchedInventoryItem({
        userId: user.uid,
        match: {
          productId: `flower-${selectedArrangement.id}`,
          sourceModule: "Flower Studio"
        },
        itemDefaults: {
          name: selectedArrangement.name,
          category: "Finished Goods",
          sourceModule: "Flower Studio",
          productId: `flower-${selectedArrangement.id}`,
          productName: selectedArrangement.name,
          quantityOnHand: 0,
          unit: "arrangements",
          costPerUnit: productionSummary.quantity
            ? productionSummary.cost / productionSummary.quantity
            : "",
          retailPrice: selectedArrangement.retailPrice || "",
          wholesalePrice: selectedArrangement.wholesalePrice || "",
          status: "In Stock",
          notes: `Added from Flower Studio. Event: ${
            productionForm.eventName || "not recorded"
          }.`
        },
        quantityToAdd: quantity
      });

      showStatus("Finished arrangements added to inventory.");
    } catch (error) {
      console.error(error);
      showStatus("Could not add arrangements to inventory.", "error");
    } finally {
      setSavingInventory(false);
    }
  }

  async function removeLog(logId) {
    if (!user) return;

    try {
      await deleteFlowerProductionLog(user.uid, logId);
      showStatus("Production log deleted.");
      await loadData();
    } catch (error) {
      console.error(error);
      showStatus("Could not delete production log.", "error");
    }
  }

  if (!user) {
    return (
      <div className="flowerStudioModule modulePage">
        <section className="farmModuleHero flowerStudioHero">
          <div className="farmModuleHeroText">
            <p className="eyebrow">Flower Studio</p>
            <h2>Build flower arrangements from stem planning to inventory.</h2>
            <p>
              Sign in to manage flower pantries, arrangements, zone suggestions,
              stem calculations, production logs, and finished inventory.
            </p>
          </div>

          <div className="farmModuleHeroActions">
            <button
              className="primaryButton compactPrimary farmHeroAction"
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
    <div className="flowerStudioModule modulePage">
      {statusMessage ? (
        <div className={`floatingStatus ${statusType}`}>
          <span>ⓘ</span>
          <span>{statusMessage}</span>
          <button type="button" onClick={() => setStatusMessage("")}>
            ×
          </button>
        </div>
      ) : null}

      <section className="farmModuleHero flowerStudioHero">
        <div className="farmModuleHeroText">
          <p className="eyebrow">Flower Studio</p>
          <h2>Plan stems, arrangements, production, and finished inventory.</h2>
          <p>
            Import flowers by USDA zone, build bouquet recipes, calculate stem needs,
            log production, and send finished arrangements to Inventory.
          </p>
        </div>

        <div className="farmModuleHeroActions">
          <button
            className="secondaryButton compactButton farmHeroAction"
            type="button"
            onClick={() => setShowGuide(true)}
          >
            <HelpCircle size={18} />
            Guide
          </button>
        </div>
      </section>

      <section className="hubStatGrid flowerStudioStatGrid">
        <StatCard
          icon={Flower2}
          label="Flowers"
          value={loading ? "..." : dashboardSummary.flowers}
          sub="Saved stems"
          accent="flowers"
        />
        <StatCard
          icon={Library}
          label="Arrangements"
          value={loading ? "..." : dashboardSummary.arrangements}
          sub="Saved recipes"
          accent="spice"
        />
        <StatCard
          icon={ClipboardCheck}
          label="Logs"
          value={loading ? "..." : dashboardSummary.logs}
          sub="Production records"
          accent="market"
        />
        <StatCard
          icon={PackageCheck}
          label="Finished"
          value={loading ? "..." : dashboardSummary.finished}
          sub="Arrangements made"
          accent="pricing"
        />
      </section>

      <section className="toolGrid compactToolGrid">
        <a className="toolCard compactToolCard clickableToolCard" href="#flower-zone">
          <MapPin size={20} />
          <h3>Zone Library</h3>
          <p>Find flowers by ZIP code or USDA zone.</p>
        </a>
        <a className="toolCard compactToolCard clickableToolCard" href="#flower-pantry">
          <Flower2 size={20} />
          <h3>Flower Pantry</h3>
          <p>Save stems, greenery, fillers, and packaging.</p>
        </a>
        <a className="toolCard compactToolCard clickableToolCard" href="#flower-builder">
          <Library size={20} />
          <h3>Arrangement Builder</h3>
          <p>Create reusable bouquet and arrangement recipes.</p>
        </a>
        <a className="toolCard compactToolCard clickableToolCard" href="#flower-production">
          <Calculator size={20} />
          <h3>Stem Calculator</h3>
          <p>Calculate stems, cost, revenue, and profit.</p>
        </a>
      </section>

      <section className="flowerStudioLayout">
        <div className="flowerStudioLeftStack">
          <section className="workspacePanel compactPanel scrollAnchor" id="flower-zone">
            <div className="workspaceHeader compactPanelHeader">
              <div>
                <p className="eyebrow">Zone Library</p>
                <h3>Import Flowers by Zone</h3>
              </div>
              <MapPin size={22} />
            </div>

            <div className="formGrid compactFormGrid">
              <label>
                ZIP Code
                <input
                  value={zipInput}
                  onChange={(event) => setZipInput(event.target.value)}
                  placeholder="40502"
                />
              </label>

              <label>
                Manual USDA Zone
                <select
                  value={selectedZone}
                  onChange={(event) => {
                    setSelectedZone(event.target.value);
                    setZoneError("");
                  }}
                >
                  <option value="">Choose zone...</option>
                  {usdaZones.map((zone) => (
                    <option key={zone}>{zone}</option>
                  ))}
                </select>
              </label>

              <div className="formActions fullSpan">
                <button
                  className="secondaryButton compactButton"
                  type="button"
                  onClick={detectZoneFromZip}
                >
                  Detect Zone
                </button>

                <button
                  className="primaryButton compactPrimary"
                  type="button"
                  onClick={importSelectedFlowers}
                >
                  <Plus size={15} />
                  Import Selected
                </button>
              </div>
            </div>

            {zoneError ? <p className="formErrorText">{zoneError}</p> : null}

            {selectedZone ? (
              <div className="flowerZoneResults">
                <p className="eyebrow">Recommended for USDA Zone {selectedZone}</p>

                {zoneFlowers.length ? (
                  zoneFlowers.map((flower) => {
                    const visual = getFlowerVisualByName(flower.name);
                    const isSelected = selectedLibraryFlowers.includes(flower.name);

                    return (
                      <div
                        key={flower.name}
                        className={`flowerZoneOption ${isSelected ? "selected" : ""}`}
                      >
                        <label className="flowerZoneCheck">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => toggleLibraryFlower(flower.name)}
                          />
                        </label>

                        {visual?.path ? (
                          <button
                            className="flowerImageButton"
                            type="button"
                            onClick={() => setPreviewFlowerVisual(visual)}
                            aria-label={`Preview ${flower.name}`}
                          >
                            <img
                              className="flowerZoneImage"
                              src={visual.path}
                              alt={visual.alt}
                              onError={(event) => {
                                event.currentTarget.style.display = "none";
                              }}
                            />
                          </button>
                        ) : (
                          <div className="flowerZoneImageFallback">
                            <Flower2 size={22} />
                          </div>
                        )}

                        <button
                          className="flowerZoneTextButton"
                          type="button"
                          onClick={() => toggleLibraryFlower(flower.name)}
                        >
                          <strong>{flower.name}</strong>
                          <span>
                            {flower.category} • {flower.difficulty} •{" "}
                            {flower.bloomSeason}
                          </span>
                        </button>
                      </div>
                    );
                  })
                ) : (
                  <div className="permitEmptyState">
                    No flower recommendations found for this zone yet.
                  </div>
                )}
              </div>
            ) : null}
          </section>

          <section className="workspacePanel compactPanel scrollAnchor" id="flower-pantry">
            <div className="workspaceHeader compactPanelHeader">
              <div>
                <p className="eyebrow">Pantry</p>
                <h3>Flower Pantry</h3>
              </div>
            </div>

            <form className="formGrid compactFormGrid" onSubmit={saveFlower}>
              <label>
                Name *
                <input
                  value={flowerForm.name}
                  onChange={(event) => updateFlowerField("name", event.target.value)}
                  placeholder="Zinnia"
                />
              </label>

              <label>
                Category
                <select
                  value={flowerForm.category}
                  onChange={(event) =>
                    updateFlowerField("category", event.target.value)
                  }
                >
                  {flowerCategories.map((category) => (
                    <option key={category}>{category}</option>
                  ))}
                </select>
              </label>

              <label>
                Color
                <input
                  value={flowerForm.color}
                  onChange={(event) => updateFlowerField("color", event.target.value)}
                />
              </label>

              <label>
                Bloom Season
                <input
                  value={flowerForm.bloomSeason}
                  onChange={(event) =>
                    updateFlowerField("bloomSeason", event.target.value)
                  }
                />
              </label>

              <label>
                Cost / Stem
                <input
                  type="number"
                  step="0.01"
                  value={flowerForm.stemCost}
                  onChange={(event) =>
                    updateFlowerField("stemCost", event.target.value)
                  }
                  onBlur={(event) =>
                    updateFlowerField("stemCost", cleanMoney(event.target.value))
                  }
                />
              </label>

              <label>
                Stem Inventory
                <input
                  type="number"
                  step="1"
                  value={flowerForm.inventoryCount}
                  onChange={(event) =>
                    updateFlowerField("inventoryCount", event.target.value)
                  }
                />
              </label>

              <label className="fullSpan">
                Notes
                <textarea
                  value={flowerForm.notes}
                  onChange={(event) => updateFlowerField("notes", event.target.value)}
                />
              </label>

              <div className="formActions fullSpan">
                <button className="primaryButton compactPrimary" type="submit">
                  <Save size={15} />
                  {editingFlowerId ? "Update Flower" : "Save Flower"}
                </button>
              </div>
            </form>

            <div className="savedList compactSavedList flowerPantryList">
              {flowers.length ? (
                flowers.map((flower) => {
                  const visual = getFlowerVisualByName(flower.name);

                  return (
                    <div className="savedItem compactSavedItem" key={flower.id}>
                      {visual?.path ? (
                        <button
                          className="flowerPantryImageButton"
                          type="button"
                          onClick={() => setPreviewFlowerVisual(visual)}
                          aria-label={`Preview ${flower.name}`}
                        >
                          <img
                            className="flowerPantryImage"
                            src={visual.path}
                            alt={visual.alt}
                            onError={(event) => {
                              event.currentTarget.style.display = "none";
                            }}
                          />
                        </button>
                      ) : (
                        <div className="flowerPantryImageFallback">
                          <Flower2 size={20} />
                        </div>
                      )}

                      <div>
                        <h4>{flower.name}</h4>
                        <p>
                          {flower.category} • {flower.color || "No color"} •{" "}
                          {flower.stemCost
                            ? `${money(flower.stemCost)} / stem`
                            : "No cost"}
                        </p>
                      </div>

                      <div className="itemActions">
                        <button type="button" onClick={() => editFlower(flower)}>
                          <Edit3 size={14} />
                        </button>
                        <button type="button" onClick={() => removeFlower(flower.id)}>
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="permitEmptyState">No flowers saved yet.</div>
              )}
            </div>
          </section>
        </div>

        <div className="flowerStudioRightStack">
          <section className="workspacePanel compactPanel scrollAnchor" id="flower-builder">
            <div className="workspaceHeader compactPanelHeader">
              <div>
                <p className="eyebrow">Builder</p>
                <h3>Arrangement Builder</h3>
              </div>
            </div>

            <form className="formGrid compactFormGrid" onSubmit={saveArrangement}>
              <label>
                Arrangement Name *
                <input
                  value={arrangementForm.name}
                  onChange={(event) =>
                    updateArrangementField("name", event.target.value)
                  }
                  placeholder="Summer Market Bouquet"
                />
              </label>

              <label>
                Category
                <input
                  value={arrangementForm.category}
                  onChange={(event) =>
                    updateArrangementField("category", event.target.value)
                  }
                />
              </label>

              <label>
                Retail Price
                <input
                  type="number"
                  step="0.01"
                  value={arrangementForm.retailPrice}
                  onChange={(event) =>
                    updateArrangementField("retailPrice", event.target.value)
                  }
                />
              </label>

              <label>
                Wholesale Price
                <input
                  type="number"
                  step="0.01"
                  value={arrangementForm.wholesalePrice}
                  onChange={(event) =>
                    updateArrangementField("wholesalePrice", event.target.value)
                  }
                />
              </label>

              <label>
                Packaging Cost
                <input
                  type="number"
                  step="0.01"
                  value={arrangementForm.packagingCost}
                  onChange={(event) =>
                    updateArrangementField("packagingCost", event.target.value)
                  }
                />
              </label>

              <label className="fullSpan">
                Description
                <textarea
                  value={arrangementForm.description}
                  onChange={(event) =>
                    updateArrangementField("description", event.target.value)
                  }
                />
              </label>

              <div className="flowerSubPanel fullSpan">
                <div className="recipeLineHeader">
                  <div>
                    <p className="eyebrow">Stem Recipe</p>
                    <h4>Stem Lines</h4>
                  </div>

                  <button
                    className="secondaryButton compactButton"
                    type="button"
                    onClick={addStemLine}
                  >
                    <Plus size={15} />
                    Add Stem
                  </button>
                </div>

                {(arrangementForm.stems || []).map((line, index) => (
                  <div className="flowerStemLine" key={line.id || index}>
                    <select
                      value={line.flowerId}
                      onChange={(event) =>
                        updateStemLine(index, "flowerId", event.target.value)
                      }
                    >
                      <option value="">Choose flower...</option>
                      {flowers.map((flower) => (
                        <option key={flower.id} value={flower.id}>
                          {flower.name}
                        </option>
                      ))}
                    </select>

                    <input
                      type="number"
                      step="1"
                      value={line.stemsPerArrangement}
                      onChange={(event) =>
                        updateStemLine(
                          index,
                          "stemsPerArrangement",
                          event.target.value
                        )
                      }
                      placeholder="Stems"
                    />

                    <button
                      className="iconButton"
                      type="button"
                      onClick={() => removeStemLine(index)}
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                ))}

                {arrangementForm.stems?.length ? null : (
                  <div className="permitEmptyState">No stems added yet.</div>
                )}
              </div>

              <div className="batchTotals fullSpan flowerTotals">
                <div>
                  <span>Estimated Cost</span>
                  <h4>{money(arrangementCost)}</h4>
                </div>
                <div>
                  <span>Stems</span>
                  <h4>{arrangementForm.stems?.length || 0}</h4>
                </div>
                <div>
                  <span>Margin</span>
                  <h4>
                    {toNumber(arrangementForm.retailPrice)
                      ? `${Math.round(
                          ((toNumber(arrangementForm.retailPrice) -
                            arrangementCost) /
                            toNumber(arrangementForm.retailPrice)) *
                            100
                        )}%`
                      : "N/A"}
                  </h4>
                </div>
              </div>

              <div className="formActions fullSpan">
                <button
                  className={`primaryButton compactPrimary ${
                    hasUnsavedChanges ? "dirtySaveButton" : ""
                  }`}
                  type="submit"
                >
                  <Save size={15} />
                  {editingArrangementId ? "Update Arrangement" : "Save Arrangement"}
                </button>
              </div>
            </form>
          </section>

          <section className="workspacePanel compactPanel">
            <div className="workspaceHeader compactPanelHeader">
              <div>
                <p className="eyebrow">Library</p>
                <h3>Arrangement Library</h3>
              </div>

              <div className="searchBox compactSearch">
                <Search size={16} />
                <input
                  value={searchTerm}
                  onChange={(event) => setSearchTerm(event.target.value)}
                  placeholder="Search arrangements..."
                />
              </div>
            </div>

            <div className="savedList compactSavedList">
              {filteredArrangements.length ? (
                filteredArrangements.map((arrangement) => (
                  <div className="savedItem compactSavedItem" key={arrangement.id}>
                    <div>
                      <h4>{arrangement.name}</h4>
                      <p>
                        {arrangement.category} • {arrangement.stems?.length || 0} stem
                        lines •{" "}
                        {arrangement.retailPrice
                          ? `${money(arrangement.retailPrice)} retail`
                          : "No price"}
                      </p>
                    </div>

                    <div className="itemActions">
                      <button type="button" onClick={() => editArrangement(arrangement)}>
                        <Edit3 size={14} />
                      </button>
                      <button
                        type="button"
                        onClick={() => removeArrangement(arrangement.id)}
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </div>
                ))
              ) : (
                <div className="permitEmptyState">No arrangements saved yet.</div>
              )}
            </div>
          </section>

          <section className="workspacePanel compactPanel scrollAnchor" id="flower-production">
            <div className="workspaceHeader compactPanelHeader">
              <div>
                <p className="eyebrow">Production</p>
                <h3>Stem Calculator & Log</h3>
              </div>

              <button
                className="secondaryButton compactButton"
                type="button"
                onClick={addProductionToInventory}
                disabled={savingInventory}
              >
                <PackageCheck size={15} />
                {savingInventory ? "Adding..." : "Add to Inventory"}
              </button>
            </div>

            <form className="formGrid compactFormGrid" onSubmit={saveProductionLog}>
              <label>
                Arrangement
                <select
                  value={productionForm.arrangementId}
                  onChange={(event) =>
                    setProductionForm((current) => ({
                      ...current,
                      arrangementId: event.target.value
                    }))
                  }
                >
                  <option value="">Choose arrangement...</option>
                  {arrangements.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.name}
                    </option>
                  ))}
                </select>
              </label>

              <label>
                Quantity
                <input
                  type="number"
                  step="1"
                  value={productionForm.quantity}
                  onChange={(event) =>
                    setProductionForm((current) => ({
                      ...current,
                      quantity: event.target.value
                    }))
                  }
                />
              </label>

              <label>
                Production Date
                <input
                  type="date"
                  value={productionForm.productionDate}
                  onChange={(event) =>
                    setProductionForm((current) => ({
                      ...current,
                      productionDate: event.target.value
                    }))
                  }
                />
              </label>

              <label>
                Event / Market
                <input
                  value={productionForm.eventName}
                  onChange={(event) =>
                    setProductionForm((current) => ({
                      ...current,
                      eventName: event.target.value
                    }))
                  }
                />
              </label>

              <label>
                Customer
                <input
                  value={productionForm.customerName}
                  onChange={(event) =>
                    setProductionForm((current) => ({
                      ...current,
                      customerName: event.target.value
                    }))
                  }
                />
              </label>

              <label className="fullSpan">
                Notes
                <textarea
                  value={productionForm.notes}
                  onChange={(event) =>
                    setProductionForm((current) => ({
                      ...current,
                      notes: event.target.value
                    }))
                  }
                />
              </label>

              <div className="batchTotals fullSpan flowerTotals">
                <div>
                  <span>Total Stems</span>
                  <h4>{productionSummary.totalStems}</h4>
                </div>
                <div>
                  <span>Cost</span>
                  <h4>{money(productionSummary.cost)}</h4>
                </div>
                <div>
                  <span>Revenue</span>
                  <h4>{money(productionSummary.revenue)}</h4>
                </div>
                <div>
                  <span>Profit</span>
                  <h4>{money(productionSummary.profit)}</h4>
                </div>
              </div>

              <div className="flowerNeededList fullSpan">
                {productionSummary.stemLines.map((line) => (
                  <div className="recipePartsRow" key={line.flowerId}>
                    <span>{line.flowerName}</span>
                    <strong>{line.totalNeeded} stems</strong>
                  </div>
                ))}
              </div>

              <div className="formActions fullSpan">
                <button className="primaryButton compactPrimary" type="submit">
                  <Save size={15} />
                  Save Production Log
                </button>
              </div>
            </form>
          </section>
        </div>
      </section>

      <section className="workspacePanel compactPanel">
        <div className="workspaceHeader compactPanelHeader">
          <div>
            <p className="eyebrow">Records</p>
            <h3>Production Log</h3>
          </div>
        </div>

        <div className="savedList compactSavedList">
          {logs.length ? (
            logs.map((log) => (
              <div className="savedItem compactSavedItem" key={log.id}>
                <div>
                  <h4>{log.arrangementName}</h4>
                  <p>
                    {log.productionDate || "No date"} • {log.quantity || 0} finished •{" "}
                    {log.eventName || "No event"}
                  </p>
                </div>

                <div className="itemActions">
                  <button type="button" onClick={() => removeLog(log.id)}>
                    <Trash2 size={15} />
                  </button>
                </div>
              </div>
            ))
          ) : (
            <div className="permitEmptyState">No production logs yet.</div>
          )}
        </div>
      </section>

      {previewFlowerVisual ? (
        <div
          className="flowerImagePreviewOverlay"
          role="dialog"
          aria-modal="true"
          onClick={() => setPreviewFlowerVisual(null)}
        >
          <div
            className="flowerImagePreviewModal"
            onClick={(event) => event.stopPropagation()}
          >
            <button
              className="moduleGuideCloseButton"
              type="button"
              onClick={() => setPreviewFlowerVisual(null)}
              aria-label="Close flower image preview"
            >
              ×
            </button>

            <img src={previewFlowerVisual.path} alt={previewFlowerVisual.alt} />
          </div>
        </div>
      ) : null}

      <ModuleGuideModal
        isOpen={showGuide}
        moduleKey="flowerStudio"
        title="Flower Studio Guide"
        onClose={() => setShowGuide(false)}
      >
        <FlowerStudioGuideContent />
      </ModuleGuideModal>
    </div>
  );
}
