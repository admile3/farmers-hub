import { useEffect, useMemo, useState } from "react";
import {
  Calculator,
  ClipboardCheck,
  Copy,
  Edit3,
  Flower2,
  HelpCircle,
  Library,
  MapPin,
  PackageCheck,
  Plus,
  Save,
  Search,
  Sparkles,
  Trash2,
  X
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
import { FLOWER_STUDIO_STYLE } from "../data/flowerStudioStyle.js";
import {
  createFlowerArrangement,
  createFlowerContainer,
  createFlowerItem,
  createFlowerProductionLog,
  deleteFlowerArrangement,
  deleteFlowerContainer,
  deleteFlowerItem,
  deleteFlowerProductionLog,
  getFlowerArrangements,
  getFlowerContainers,
  getFlowerItems,
  getFlowerProductionLogs,
  updateFlowerArrangement,
  updateFlowerContainer,
  updateFlowerItem,
  updateFlowerProductionLog
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

const commonContainerTypes = [
  "Clear Glass Vase",
  "Ceramic Vase",
  "Bud Vase",
  "Mason Jar",
  "Paper Wrapper",
  "Kraft Sleeve",
  "Bouquet Bag",
  "Market Bucket",
  "Compote Bowl",
  "Floral Foam Container",
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

const emptyContainer = {
  name: "",
  type: "Clear Glass Vase",
  unitCost: "",
  inventoryCount: "",
  notes: ""
};

const emptyArrangement = {
  name: "",
  category: "Market Bouquet",
  description: "",
  retailPrice: "",
  wholesalePrice: "",
  packagingCost: "",
  containerId: "",
  containerName: "",
  containerCost: "",
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
  const [containers, setContainers] = useState([]);
  const [arrangements, setArrangements] = useState([]);
  const [logs, setLogs] = useState([]);

  const [flowerForm, setFlowerForm] = useState(emptyFlower);
  const [editingFlowerId, setEditingFlowerId] = useState(null);

  const [containerForm, setContainerForm] = useState(emptyContainer);
  const [editingContainerId, setEditingContainerId] = useState(null);

  const [arrangementForm, setArrangementForm] = useState(emptyArrangement);
  const [editingArrangementId, setEditingArrangementId] = useState(null);

  const [productionForm, setProductionForm] = useState(emptyProduction);
  const [editingProductionLogId, setEditingProductionLogId] = useState(null);

  const [zipInput, setZipInput] = useState("");
  const [selectedZone, setSelectedZone] = useState("");
  const [zoneError, setZoneError] = useState("");
  const [selectedLibraryFlowers, setSelectedLibraryFlowers] = useState([]);
  const [previewFlowerVisual, setPreviewFlowerVisual] = useState(null);
  const [generatedArrangementPrompt, setGeneratedArrangementPrompt] = useState("");
  const [promptCopied, setPromptCopied] = useState(false);
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
      const [savedFlowers, savedContainers, savedArrangements, savedLogs] =
        await Promise.all([
          getFlowerItems(user.uid),
          getFlowerContainers(user.uid),
          getFlowerArrangements(user.uid),
          getFlowerProductionLogs(user.uid)
        ]);

      setFlowers(savedFlowers);
      setContainers(savedContainers);
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
      setContainers([]);
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
    if (!promptCopied) return;

    const timer = window.setTimeout(() => setPromptCopied(false), 1800);
    return () => window.clearTimeout(timer);
  }, [promptCopied]);

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

  const allZoneFlowersSelected =
    zoneFlowers.length > 0 &&
    zoneFlowers.every((flower) => selectedLibraryFlowers.includes(flower.name));

  const selectedArrangement = useMemo(() => {
    return (
      arrangements.find((item) => item.id === productionForm.arrangementId) ||
      null
    );
  }, [arrangements, productionForm.arrangementId]);

  const selectedContainer = useMemo(() => {
    return (
      containers.find((item) => item.id === arrangementForm.containerId) ||
      null
    );
  }, [containers, arrangementForm.containerId]);

  const arrangementStemCost = useMemo(() => {
    return (arrangementForm.stems || []).reduce((sum, line) => {
      const flower = flowers.find((item) => item.id === line.flowerId);
      return sum + toNumber(flower?.stemCost) * toNumber(line.stemsPerArrangement);
    }, 0);
  }, [arrangementForm.stems, flowers]);

  const arrangementContainerCost = selectedContainer
    ? toNumber(selectedContainer.unitCost)
    : toNumber(arrangementForm.containerCost);

  const arrangementCost = useMemo(() => {
    return (
      arrangementStemCost +
      toNumber(arrangementForm.packagingCost) +
      arrangementContainerCost
    );
  }, [arrangementStemCost, arrangementForm.packagingCost, arrangementContainerCost]);

  const productionSummary = useMemo(() => {
    if (!selectedArrangement) {
      return {
        quantity: 0,
        totalStems: 0,
        stemsCost: 0,
        packagingCost: 0,
        containerCost: 0,
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
    const containerCost = quantity * toNumber(selectedArrangement.containerCost);
    const cost = stemsCost + packagingCost + containerCost;
    const revenue = quantity * toNumber(selectedArrangement.retailPrice);
    const profit = revenue - cost;

    return {
      quantity,
      totalStems: stemLines.reduce((sum, line) => sum + line.totalNeeded, 0),
      stemsCost,
      packagingCost,
      containerCost,
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
      containers: containers.length,
      arrangements: arrangements.length,
      logs: logs.length,
      finished
    };
  }, [flowers, containers, arrangements, logs]);

  const filteredArrangements = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();

    return arrangements.filter((item) => {
      if (!query) return true;

      return (
        item.name?.toLowerCase().includes(query) ||
        item.category?.toLowerCase().includes(query) ||
        item.description?.toLowerCase().includes(query) ||
        item.containerName?.toLowerCase().includes(query)
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

  function toggleAllLibraryFlowers() {
    const zoneFlowerNames = zoneFlowers.map((flower) => flower.name);
    const allSelected = zoneFlowerNames.every((name) =>
      selectedLibraryFlowers.includes(name)
    );

    setSelectedLibraryFlowers(allSelected ? [] : zoneFlowerNames);
  }

function generateArrangementImagePrompt() {
  const stemLines = (arrangementForm.stems || [])
    .filter((line) => line.flowerName && toNumber(line.stemsPerArrangement) > 0)
    .map(
      (line) =>
        `- ${toNumber(line.stemsPerArrangement)} stems of ${line.flowerName}`
    )
    .join("\n");

  if (!stemLines) {
    showStatus("Add at least one stem line before generating a prompt.", "error");
    return;
  }

  const arrangementName =
    arrangementForm.name?.trim() || "Untitled Flower Studio Arrangement";

  const containerName =
    selectedContainer?.name ||
    arrangementForm.containerName ||
    "clear glass vase";

  const normalizedContainer = containerName.toLowerCase();

  const isWrappedBouquet =
    normalizedContainer.includes("wrapper") ||
    normalizedContainer.includes("wrap") ||
    normalizedContainer.includes("kraft") ||
    normalizedContainer.includes("paper") ||
    normalizedContainer.includes("sleeve") ||
    normalizedContainer.includes("bouquet bag");

  const containerInstruction = isWrappedBouquet
    ? `Show the arrangement as a compact farmers market wrapped bouquet in ${containerName}. The flowers should be gathered tightly together and wrapped in paper around the stems, like a real hand-tied market bouquet. The paper should form a cone-style wrap around the stems, not a freestanding container, vase, bowl, bucket, or base. The bottom should show gathered stems extending below the paper wrap, tied with twine, raffia, or simple string.`
    : `Show the arrangement as a compact farmers market floral arrangement displayed in a ${containerName}. The flowers should be arranged close together with a full, gathered market-bouquet look, not spaced far apart like a formal event centerpiece.`;

  const presentationInstruction = isWrappedBouquet
    ? `Important wrapper accuracy:
The kraft paper or paper wrapper must wrap around the bouquet stems. It should not become a pot, vase, bag, pedestal, or crumpled base. Do not show the bouquet sitting inside a paper container. Do not create a flat-bottom paper vessel. The bouquet should look hand-held or market-ready, with visible stems gathered below the wrap.`
    : `Important container accuracy:
The selected container should be visible and believable for the arrangement. The flowers should sit naturally inside the selected vessel while still looking compact, fresh, and market-ready.`;

  setPromptCopied(false);
  setGeneratedArrangementPrompt(`This prompt is designed to work best in ChatGPT image generation because it includes the Flower Studio visual style ID and full style definition.

Create a photorealistic botanical catalog image of a finished floral arrangement.

Use Flower Studio Style ID ${FLOWER_STUDIO_STYLE.id}:
${FLOWER_STUDIO_STYLE.description}

Arrangement name:
${arrangementName}

Container / presentation:
${containerName}

Stem recipe:
${stemLines}

${containerInstruction}

Overall arrangement style:
The flowers should be visually compact, clumped, and market-ready, like something sold at a farmers market flower stand. Keep the blooms close together with minimal empty space between stems. Avoid a wide, airy, spread-out wedding centerpiece look. The bouquet should feel full, gathered, practical, and saleable.

${presentationInstruction}

Strict recipe fidelity requirement:
Only include flowers, greenery, fillers, foliage, seed heads, grasses, or accent stems that are explicitly listed in the stem recipe above. Do not add extra filler, greenery, baby's breath, grasses, background stems, decorative accents, or any unlisted plant material. If the recipe looks sparse, leave it sparse, but arrange the listed stems close together.

Photorealism requirement:
The image must look like a real photograph taken with a camera, not an illustration, painting, cartoon, digital rendering, or dreamy AI image. Use natural window lighting, realistic shadows, true flower textures, realistic paper or container texture, and believable camera depth of field.

Square composition. No hands, no people, no extra props, no watermarks.`);
}

  async function copyGeneratedPrompt() {
    if (!generatedArrangementPrompt) return;

    try {
      await navigator.clipboard.writeText(generatedArrangementPrompt);
      setPromptCopied(true);
      showStatus("Prompt copied.");
    } catch (error) {
      console.error(error);
      showStatus("Could not copy prompt. Select the text and copy manually.", "error");
    }
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
      setSelectedLibraryFlowers([]);
      setSelectedZone("");
      setZipInput("");
      setZoneError("");

      await loadData();

      window.setTimeout(() => {
        document.getElementById("flower-pantry")?.scrollIntoView({
          behavior: "smooth",
          block: "start"
        });
      }, 150);
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

    document.getElementById("flower-pantry")?.scrollIntoView({
      behavior: "smooth",
      block: "start"
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

  function updateContainerField(field, value) {
    markFlowerDirty();
    setContainerForm((current) => ({ ...current, [field]: value }));
  }

  async function saveContainer(event) {
    event?.preventDefault?.();

    if (!user) return;

    const cleanContainer = {
      ...containerForm,
      name: containerForm.name.trim(),
      type: containerForm.type || "Other",
      unitCost: cleanMoney(containerForm.unitCost),
      inventoryCount: toNumber(containerForm.inventoryCount),
      notes: containerForm.notes.trim()
    };

    if (!cleanContainer.name) {
      showStatus("Container name is required.", "error");
      return;
    }

    try {
      if (editingContainerId) {
        await updateFlowerContainer(user.uid, editingContainerId, cleanContainer);
        showStatus("Container updated.");
      } else {
        await createFlowerContainer(user.uid, cleanContainer);
        showStatus("Container saved.");
      }

      setContainerForm(emptyContainer);
      setEditingContainerId(null);
      markSaved();
      await loadData();
    } catch (error) {
      console.error(error);
      showStatus("Could not save container.", "error");
    }
  }

  function editContainer(container) {
    setEditingContainerId(container.id);
    setContainerForm({
      name: container.name || "",
      type: container.type || "Other",
      unitCost: cleanMoney(container.unitCost),
      inventoryCount: container.inventoryCount || "",
      notes: container.notes || ""
    });

    document.getElementById("container-pantry")?.scrollIntoView({
      behavior: "smooth",
      block: "start"
    });
  }

  async function removeContainer(containerId) {
    if (!user) return;

    try {
      await deleteFlowerContainer(user.uid, containerId);
      showStatus("Container deleted.");
      await loadData();
    } catch (error) {
      console.error(error);
      showStatus("Could not delete container.", "error");
    }
  }

  function updateArrangementField(field, value) {
    markFlowerDirty();
    setArrangementForm((current) => ({ ...current, [field]: value }));
  }

  function updateArrangementContainer(containerId) {
    markFlowerDirty();

    const container = containers.find((item) => item.id === containerId);

    setArrangementForm((current) => ({
      ...current,
      containerId,
      containerName: container?.name || "",
      containerCost: container ? cleanMoney(container.unitCost) : ""
    }));
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

    const activeContainer = containers.find(
      (item) => item.id === arrangementForm.containerId
    );

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
      containerId: activeContainer?.id || "",
      containerName: activeContainer?.name || arrangementForm.containerName || "",
      containerCost:
        arrangementForm.containerCost === ""
          ? ""
          : toNumber(arrangementForm.containerCost),
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
      containerId: arrangement.containerId || "",
      containerName: arrangement.containerName || "",
      containerCost: cleanMoney(arrangement.containerCost),
      stems: (arrangement.stems || []).map((line) => ({
        id: makeId("stem"),
        ...line
      }))
    });

    document.getElementById("flower-builder")?.scrollIntoView({
      behavior: "smooth",
      block: "start"
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

  function updateProductionField(field, value) {
    setProductionForm((current) => ({
      ...current,
      [field]: value
    }));
  }

  async function saveProductionLog(event) {
    event?.preventDefault?.();

    if (!user || !selectedArrangement) {
      showStatus("Select an arrangement first.", "error");
      return;
    }

    const missingDate = !productionForm.productionDate;
    const missingQuantity = !productionForm.quantity || toNumber(productionForm.quantity) <= 0;

    if (missingDate && missingQuantity) {
      showStatus("Add a production date and quantity.", "error");
      return;
    }

    if (missingDate) {
      showStatus("Add a production date.", "error");
      return;
    }

    if (missingQuantity) {
      showStatus("Add a quantity.", "error");
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
      if (editingProductionLogId) {
        await updateFlowerProductionLog(user.uid, editingProductionLogId, cleanLog);
        showStatus("Production log updated.");
      } else {
        await createFlowerProductionLog(user.uid, cleanLog);
        showStatus("Production logged.");
      }

      setProductionForm(emptyProduction);
      setEditingProductionLogId(null);
      await loadData();
    } catch (error) {
      console.error(error);
      showStatus("Could not save production log.", "error");
    }
  }

  function editProductionLog(log) {
    setEditingProductionLogId(log.id);
    setProductionForm({
      arrangementId: log.arrangementId || "",
      productionDate: log.productionDate || "",
      quantity: log.quantity || "",
      eventName: log.eventName || "",
      customerName: log.customerName || "",
      notes: log.notes || ""
    });

    document.getElementById("flower-production")?.scrollIntoView({
      behavior: "smooth",
      block: "start"
    });
  }

  function cancelProductionEdit() {
    setEditingProductionLogId(null);
    setProductionForm(emptyProduction);
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
          notes: `Added from Flower Studio. Container: ${
            selectedArrangement.containerName || "none"
          }. Event: ${productionForm.eventName || "not recorded"}.`
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

      if (editingProductionLogId === logId) {
        cancelProductionEdit();
      }

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
              Sign in to manage flower pantries, container costs, arrangements,
              zone suggestions, production logs, and finished inventory.
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
          <h2>Plan stems, containers, arrangements, production, and inventory.</h2>
          <p>
            Import flowers by USDA zone, build bouquet recipes, assign vase or
            wrapper costs, log production, and send finished arrangements to
            Inventory.
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
          icon={PackageCheck}
          label="Containers"
          value={loading ? "..." : dashboardSummary.containers}
          sub="Vases and wrappers"
          accent="grant"
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
        <a className="toolCard compactToolCard clickableToolCard" href="#container-pantry">
          <PackageCheck size={20} />
          <h3>Container Pantry</h3>
          <p>Save vases, jars, sleeves, wrappers, and unit costs.</p>
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
                <div className="flowerZoneResultsHeader">
                  <p className="eyebrow">Recommended for USDA Zone {selectedZone}</p>

                  <button
                    className="secondaryButton compactButton"
                    type="button"
                    onClick={toggleAllLibraryFlowers}
                  >
                    {allZoneFlowersSelected ? "Deselect All" : "Select All"}
                  </button>
                </div>

                {zoneFlowers.length ? (
                  zoneFlowers.map((flower) => {
                    const visual = getFlowerVisualByName(flower.name);
                    const isSelected = selectedLibraryFlowers.includes(flower.name);

                    return (
                      <div
                        key={flower.name}
                        className={`flowerZoneOption ${isSelected ? "selected" : ""}`}
                      >
                        <label
                          className="flowerZoneCheck"
                          title={`Select ${flower.name} for import`}
                        >
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => toggleLibraryFlower(flower.name)}
                            aria-label={`Select ${flower.name} for import`}
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

                {editingFlowerId ? (
                  <button
                    className="secondaryButton compactButton"
                    type="button"
                    onClick={() => {
                      setEditingFlowerId(null);
                      setFlowerForm(emptyFlower);
                    }}
                  >
                    Cancel Edit
                  </button>
                ) : null}
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

          <section
            className="workspacePanel compactPanel scrollAnchor"
            id="container-pantry"
          >
            <div className="workspaceHeader compactPanelHeader">
              <div>
                <p className="eyebrow">Pantry</p>
                <h3>Container Pantry</h3>
              </div>
              <PackageCheck size={22} />
            </div>

            <form className="formGrid compactFormGrid" onSubmit={saveContainer}>
              <label>
                Container Name *
                <input
                  value={containerForm.name}
                  onChange={(event) =>
                    updateContainerField("name", event.target.value)
                  }
                  placeholder="12 oz Mason Jar"
                />
              </label>

              <label>
                Type
                <select
                  value={containerForm.type}
                  onChange={(event) =>
                    updateContainerField("type", event.target.value)
                  }
                >
                  {commonContainerTypes.map((type) => (
                    <option key={type}>{type}</option>
                  ))}
                </select>
              </label>

              <label>
                Unit Cost
                <input
                  type="number"
                  step="0.01"
                  value={containerForm.unitCost}
                  onChange={(event) =>
                    updateContainerField("unitCost", event.target.value)
                  }
                  onBlur={(event) =>
                    updateContainerField("unitCost", cleanMoney(event.target.value))
                  }
                />
              </label>

              <label>
                Inventory Count
                <input
                  type="number"
                  step="1"
                  value={containerForm.inventoryCount}
                  onChange={(event) =>
                    updateContainerField("inventoryCount", event.target.value)
                  }
                />
              </label>

              <label className="fullSpan">
                Notes
                <textarea
                  value={containerForm.notes}
                  onChange={(event) =>
                    updateContainerField("notes", event.target.value)
                  }
                  placeholder="Source, size, case count, vendor, or use notes"
                />
              </label>

              <div className="formActions fullSpan">
                <button className="primaryButton compactPrimary" type="submit">
                  <Save size={15} />
                  {editingContainerId ? "Update Container" : "Save Container"}
                </button>

                {editingContainerId ? (
                  <button
                    className="secondaryButton compactButton"
                    type="button"
                    onClick={() => {
                      setEditingContainerId(null);
                      setContainerForm(emptyContainer);
                    }}
                  >
                    Cancel Edit
                  </button>
                ) : null}
              </div>
            </form>

            <div className="savedList compactSavedList containerPantryList">
              {containers.length ? (
                containers.map((container) => (
                  <div className="savedItem compactSavedItem" key={container.id}>
                    <div className="containerListIcon">
                      <PackageCheck size={18} />
                    </div>

                    <div>
                      <h4>{container.name}</h4>
                      <p>
                        {container.type || "Container"} •{" "}
                        {container.unitCost
                          ? `${money(container.unitCost)} / ea`
                          : "No cost"}{" "}
                        • {container.inventoryCount || 0} on hand
                      </p>
                    </div>

                    <div className="itemActions">
                      <button type="button" onClick={() => editContainer(container)}>
                        <Edit3 size={14} />
                      </button>
                      <button
                        type="button"
                        onClick={() => removeContainer(container.id)}
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </div>
                ))
              ) : (
                <div className="permitEmptyState">
                  No containers saved yet. Add vases, mason jars, sleeves, wraps,
                  or other presentation supplies here.
                </div>
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

              <button
                className="secondaryButton compactButton"
                type="button"
                onClick={generateArrangementImagePrompt}
              >
                <Sparkles size={15} />
                Generate Image Prompt
              </button>
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
                Container / Presentation
                <select
                  value={arrangementForm.containerId}
                  onChange={(event) =>
                    updateArrangementContainer(event.target.value)
                  }
                >
                  <option value="">No saved container</option>
                  {containers.map((container) => (
                    <option key={container.id} value={container.id}>
                      {container.name} {container.unitCost ? `(${money(container.unitCost)})` : ""}
                    </option>
                  ))}
                </select>
              </label>

              <label>
                Container Cost
                <input
                  type="number"
                  step="0.01"
                  value={arrangementForm.containerCost}
                  onChange={(event) =>
                    updateArrangementField("containerCost", event.target.value)
                  }
                  onBlur={(event) =>
                    updateArrangementField("containerCost", cleanMoney(event.target.value))
                  }
                  placeholder="Auto-filled from container"
                />
              </label>

              <label>
                Packaging / Add-On Cost
                <input
                  type="number"
                  step="0.01"
                  value={arrangementForm.packagingCost}
                  onChange={(event) =>
                    updateArrangementField("packagingCost", event.target.value)
                  }
                  onBlur={(event) =>
                    updateArrangementField("packagingCost", cleanMoney(event.target.value))
                  }
                  placeholder="Ribbon, card, sleeve, etc."
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

                {(arrangementForm.stems || []).map((line, index) => {
                  const selectedFlower = flowers.find(
                    (flower) => flower.id === line.flowerId
                  );

                  return (
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

                      <div className="flowerStemCostBadge">
                        {selectedFlower?.stemCost
                          ? `${money(selectedFlower.stemCost)} / ea`
                          : "No cost"}
                      </div>

                      <button
                        className="iconButton"
                        type="button"
                        onClick={() => removeStemLine(index)}
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  );
                })}

                {arrangementForm.stems?.length ? null : (
                  <div className="permitEmptyState">No stems added yet.</div>
                )}
              </div>

              <div className="batchTotals fullSpan flowerTotals">
                <div>
                  <span>Stem Cost</span>
                  <h4>{money(arrangementStemCost)}</h4>
                </div>
                <div>
                  <span>Container Cost</span>
                  <h4>{money(arrangementContainerCost)}</h4>
                </div>
                <div>
                  <span>Estimated Cost</span>
                  <h4>{money(arrangementCost)}</h4>
                </div>
                <div>
                  <span>Stems</span>
                  <h4>
                    {(arrangementForm.stems || []).reduce(
                      (sum, line) => sum + toNumber(line.stemsPerArrangement),
                      0
                    )}
                  </h4>
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

                {editingArrangementId ? (
                  <button
                    className="secondaryButton compactButton"
                    type="button"
                    onClick={() => {
                      setEditingArrangementId(null);
                      setArrangementForm(emptyArrangement);
                    }}
                  >
                    Cancel Edit
                  </button>
                ) : null}
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
                        {arrangement.containerName
                          ? `${arrangement.containerName} • `
                          : ""}
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

            {editingProductionLogId ? (
              <div className="flowerEditNotice">
                <span>Editing a saved production log.</span>
                <button type="button" onClick={cancelProductionEdit}>
                  <X size={14} />
                  Cancel Edit
                </button>
              </div>
            ) : null}

            <form className="formGrid compactFormGrid" onSubmit={saveProductionLog}>
              <label>
                Arrangement
                <select
                  value={productionForm.arrangementId}
                  onChange={(event) =>
                    updateProductionField("arrangementId", event.target.value)
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
                    updateProductionField("quantity", event.target.value)
                  }
                />
              </label>

              <label>
                Production Date
                <input
                  type="date"
                  value={productionForm.productionDate}
                  onChange={(event) =>
                    updateProductionField("productionDate", event.target.value)
                  }
                />
              </label>

              <label>
                Event / Market
                <input
                  value={productionForm.eventName}
                  onChange={(event) =>
                    updateProductionField("eventName", event.target.value)
                  }
                />
              </label>

              <label>
                Customer
                <input
                  value={productionForm.customerName}
                  onChange={(event) =>
                    updateProductionField("customerName", event.target.value)
                  }
                />
              </label>

              <label className="fullSpan">
                Notes
                <textarea
                  value={productionForm.notes}
                  onChange={(event) =>
                    updateProductionField("notes", event.target.value)
                  }
                />
              </label>

              <div className="batchTotals fullSpan flowerTotals">
                <div>
                  <span>Total Stems</span>
                  <h4>{productionSummary.totalStems}</h4>
                </div>
                <div>
                  <span>Container Cost</span>
                  <h4>{money(productionSummary.containerCost)}</h4>
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
                {selectedArrangement?.containerName ? (
                  <div className="recipePartsRow flowerContainerNeededRow">
                    <span>Container</span>
                    <strong>
                      {productionSummary.quantity} × {selectedArrangement.containerName}
                    </strong>
                  </div>
                ) : null}

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
                  {editingProductionLogId
                    ? "Update Production Log"
                    : "Save Production Log"}
                </button>

                {editingProductionLogId ? (
                  <button
                    className="secondaryButton compactButton"
                    type="button"
                    onClick={cancelProductionEdit}
                  >
                    Cancel Edit
                  </button>
                ) : null}
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
                    {log.summary?.containerCost
                      ? `${money(log.summary.containerCost)} containers • `
                      : ""}
                    {log.eventName || "No event"}
                  </p>
                </div>

                <div className="itemActions">
                  <button type="button" onClick={() => editProductionLog(log)}>
                    <Edit3 size={14} />
                  </button>
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

      {generatedArrangementPrompt ? (
        <div
          className="flowerImagePreviewOverlay"
          role="dialog"
          aria-modal="true"
          onClick={() => setGeneratedArrangementPrompt("")}
        >
          <div
            className="flowerPromptModal"
            onClick={(event) => event.stopPropagation()}
          >
            <button
              className="moduleGuideCloseButton flowerPromptCloseButton"
              type="button"
              onClick={() => setGeneratedArrangementPrompt("")}
              aria-label="Close arrangement image prompt"
            >
              ×
            </button>

            <div className="flowerPromptHeader">
              <div className="flowerPromptTitleIcon">
                <Sparkles size={20} />
              </div>

              <div>
                <p className="eyebrow">ChatGPT Image Prompt</p>
                <h3>Arrangement Image Prompt</h3>
                <p>
                  Generate a visual mockup of this arrangement using the Flower
                  Studio style standard.
                </p>
              </div>
            </div>

            <div className="flowerPromptMeta">
              <span className="flowerPromptStyleBadge">
                Style: {FLOWER_STUDIO_STYLE.id}
              </span>
              <span className="flowerPromptOptimized">
                Optimized for ChatGPT image generation
              </span>
            </div>

            <div className="flowerPromptSummary">
              <div>
                <span>Arrangement</span>
                <strong>
                  {arrangementForm.name?.trim() || "Untitled Arrangement"}
                </strong>
              </div>

              <div>
                <span>Container</span>
                <strong>
                  {selectedContainer?.name ||
                    arrangementForm.containerName ||
                    "No container"}
                </strong>
              </div>

              <div>
                <span>Total Stems</span>
                <strong>
                  {(arrangementForm.stems || []).reduce(
                    (sum, line) => sum + toNumber(line.stemsPerArrangement),
                    0
                  )}
                </strong>
              </div>
            </div>

            <textarea
              className="flowerPromptTextarea"
              readOnly
              value={generatedArrangementPrompt}
              aria-label="Generated arrangement image prompt"
            />

            <div className="flowerPromptActions">
              <button
                className="primaryButton compactPrimary"
                type="button"
                onClick={copyGeneratedPrompt}
              >
                <Copy size={15} />
                {promptCopied ? "Copied" : "Copy Prompt"}
              </button>

              <button
                className="secondaryButton compactButton"
                type="button"
                onClick={() => setGeneratedArrangementPrompt("")}
              >
                Close
              </button>
            </div>
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
