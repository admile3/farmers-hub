import { useEffect, useMemo, useState } from "react";
import {
  Beef,
  CalendarDays,
  CircleHelp,
  DollarSign,
  Edit3,
  History,
  Layers,
  MapPin,
  PawPrint,
  Plus,
  RefreshCw,
  Trash2
} from "lucide-react";

import ActionMenu from "../components/ActionMenu.jsx";
import ConfirmDialog from "../components/ConfirmDialog.jsx";
import EmptyState from "../components/EmptyState.jsx";
import FilterBar from "../components/FilterBar.jsx";
import FormField from "../components/FormField.jsx";
import HerdTrackerGuideContent from "../components/HerdTrackerGuideContent.jsx";
import ModuleGuideModal from "../components/ModuleGuideModal.jsx";
import ModuleHero from "../components/ModuleHero.jsx";
import RecordList from "../components/RecordList.jsx";
import SaveButton from "../components/SaveButton.jsx";
import StatCard from "../components/StatCard.jsx";
import StatusPill from "../components/StatusPill.jsx";
import Toast from "../components/Toast.jsx";
import WorkspacePanel from "../components/WorkspacePanel.jsx";

import {
  HERD_EVENT_TYPES,
  HERD_PURPOSE_OPTIONS,
  HERD_SOURCE_OPTIONS,
  HERD_SPECIES_OPTIONS,
  HERD_STATUS_OPTIONS,
  HERD_TAG_TYPE_OPTIONS,
  addHerdEvent,
  addHerdGroupEvent,
  calculateAnimalCostBasis,
  calculateGroupCostBasis,
  calculateHerdStats,
  deleteHerdAnimal,
  deleteHerdGroup,
  getHerdAnimals,
  getHerdGroups,
  removeHerdEvent,
  removeHerdGroupEvent,
  saveHerdAnimal,
  saveHerdGroup
} from "../services/herdService";

const blankAnimal = {
  tagId: "",
  tagType: "Ear Tag",
  name: "",
  species: "Cattle",
  breed: "",
  sex: "",
  purpose: "Meat",
  groupId: "",
  damId: "",
  sireId: "",
  birthDate: "",
  purchaseDate: "",
  source: "Born on Farm",
  acquisitionWeight: "",
  currentWeight: "",
  lastWeightDate: "",
  projectedProcessingDate: "",
  withdrawalDate: "",
  location: "",
  purchaseCost: "",
  estimatedValue: "",
  accumulatedCosts: 0,
  status: "Active",
  notes: "",
  events: []
};

const blankGroup = {
  name: "",
  species: "Cattle",
  purpose: "Meat",
  status: "Active",
  startDate: "",
  projectedProcessingDate: "",
  location: "",
  startingCount: "",
  currentCount: "",
  purchaseCost: "",
  estimatedValue: "",
  accumulatedCosts: 0,
  notes: "",
  events: []
};

const blankEvent = {
  type: "General Note",
  date: new Date().toISOString().slice(0, 10),
  description: "",
  cost: "",
  weight: "",
  medication: "",
  dosage: "",
  reason: "",
  withdrawalDate: "",
  feedType: "",
  quantity: "",
  unit: "",
  location: "",
  buyer: "",
  salePrice: ""
};

function money(value) {
  return Number(value || 0).toLocaleString("en-US", {
    style: "currency",
    currency: "USD"
  });
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

function getDisplayName(record) {
  return record.tagId || record.name || "Unnamed Record";
}

function getStatusVariant(status) {
  switch (status) {
    case "Active":
    case "Ready for Processing":
      return "success";
    case "Quarantine":
    case "Withdrawal":
    case "Watch":
      return "warning";
    case "Sold":
    case "Deceased":
    case "Culled":
      return "danger";
    case "Inactive":
      return "neutral";
    default:
      return "primary";
  }
}

function timelineTitle(event) {
  return event.type || "Timeline Event";
}

function timelineSubtitle(event) {
  const pieces = [
    event.date ? formatDate(event.date) : "No date",
    event.cost ? `Cost: ${money(event.cost)}` : "",
    event.salePrice ? `Sale: ${money(event.salePrice)}` : "",
    event.weight ? `${event.weight} lb` : ""
  ].filter(Boolean);

  return pieces.join(" • ");
}

export default function HerdTracker() {
  const [animals, setAnimals] = useState([]);
  const [groups, setGroups] = useState([]);
  const [activeView, setActiveView] = useState("animals");
  const [selectedAnimalId, setSelectedAnimalId] = useState("");
  const [selectedGroupId, setSelectedGroupId] = useState("");
  const [animalForm, setAnimalForm] = useState(blankAnimal);
  const [groupForm, setGroupForm] = useState(blankGroup);
  const [eventForm, setEventForm] = useState(blankEvent);
  const [animalSearch, setAnimalSearch] = useState("");
  const [groupSearch, setGroupSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [speciesFilter, setSpeciesFilter] = useState("All");
  const [showGuide, setShowGuide] = useState(false);
  const [toast, setToast] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);

  const [animalDirty, setAnimalDirty] = useState(false);
  const [animalSaving, setAnimalSaving] = useState(false);
  const [animalSaved, setAnimalSaved] = useState(false);
  const [animalSaveError, setAnimalSaveError] = useState(false);

  const [groupDirty, setGroupDirty] = useState(false);
  const [groupSaving, setGroupSaving] = useState(false);
  const [groupSaved, setGroupSaved] = useState(false);
  const [groupSaveError, setGroupSaveError] = useState(false);

  function showToast(nextToast) {
    setToast(nextToast);

    window.setTimeout(() => {
      setToast(null);
    }, 3000);
  }

  function loadData() {
    setAnimals(getHerdAnimals());
    setGroups(getHerdGroups());
  }

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    const guideHidden =
      localStorage.getItem("hideModuleGuide_herd-tracker") === "true";

    if (!guideHidden) setShowGuide(true);
  }, []);

  const selectedAnimal = useMemo(() => {
    return animals.find((animal) => animal.id === selectedAnimalId) || null;
  }, [animals, selectedAnimalId]);

  const selectedGroup = useMemo(() => {
    return groups.find((group) => group.id === selectedGroupId) || null;
  }, [groups, selectedGroupId]);

  const herdStats = useMemo(() => {
    return calculateHerdStats(animals, groups);
  }, [animals, groups]);

  const readyRecords = useMemo(() => {
    return {
      animals: animals.filter((animal) => animal.status === "Ready for Processing"),
      groups: groups.filter((group) => group.status === "Ready for Processing")
    };
  }, [animals, groups]);

  const filteredAnimals = useMemo(() => {
    const search = animalSearch.trim().toLowerCase();

    return animals.filter((animal) => {
      const searchableText = [
        animal.tagId,
        animal.tagType,
        animal.name,
        animal.species,
        animal.breed,
        animal.status,
        animal.source,
        animal.purpose,
        animal.location
      ]
        .join(" ")
        .toLowerCase();

      const matchesSearch = !search || searchableText.includes(search);
      const matchesStatus = statusFilter === "All" || animal.status === statusFilter;
      const matchesSpecies =
        speciesFilter === "All" || animal.species === speciesFilter;

      return matchesSearch && matchesStatus && matchesSpecies;
    });
  }, [animals, animalSearch, statusFilter, speciesFilter]);

  const filteredGroups = useMemo(() => {
    const search = groupSearch.trim().toLowerCase();

    return groups.filter((group) => {
      const searchableText = [
        group.name,
        group.species,
        group.status,
        group.purpose,
        group.location
      ]
        .join(" ")
        .toLowerCase();

      const matchesSearch = !search || searchableText.includes(search);
      const matchesStatus = statusFilter === "All" || group.status === statusFilter;
      const matchesSpecies =
        speciesFilter === "All" || group.species === speciesFilter;

      return matchesSearch && matchesStatus && matchesSpecies;
    });
  }, [groups, groupSearch, statusFilter, speciesFilter]);

  function resetEventForm() {
    setEventForm({
      ...blankEvent,
      date: new Date().toISOString().slice(0, 10)
    });
  }

  function resetAnimalSaveState() {
    setAnimalDirty(false);
    setAnimalSaving(false);
    setAnimalSaved(false);
    setAnimalSaveError(false);
  }

  function resetGroupSaveState() {
    setGroupDirty(false);
    setGroupSaving(false);
    setGroupSaved(false);
    setGroupSaveError(false);
  }

  function startNewAnimal() {
    setActiveView("animals");
    setSelectedAnimalId("");
    setAnimalForm(blankAnimal);
    resetEventForm();
    setAnimalDirty(true);
    setAnimalSaved(false);
    setAnimalSaveError(false);
  }

  function startNewGroup() {
    setActiveView("groups");
    setSelectedGroupId("");
    setGroupForm(blankGroup);
    resetEventForm();
    setGroupDirty(true);
    setGroupSaved(false);
    setGroupSaveError(false);
  }

  function editAnimal(animal) {
    setActiveView("animals");
    setSelectedAnimalId(animal.id);
    setAnimalForm({
      ...blankAnimal,
      ...animal,
      purchaseCost: animal.purchaseCost || "",
      estimatedValue: animal.estimatedValue || "",
      accumulatedCosts: animal.accumulatedCosts || 0,
      events: animal.events || []
    });
    resetEventForm();
    resetAnimalSaveState();
  }

  function editGroup(group) {
    setActiveView("groups");
    setSelectedGroupId(group.id);
    setGroupForm({
      ...blankGroup,
      ...group,
      purchaseCost: group.purchaseCost || "",
      estimatedValue: group.estimatedValue || "",
      accumulatedCosts: group.accumulatedCosts || 0,
      events: group.events || []
    });
    resetEventForm();
    resetGroupSaveState();
  }

  function updateAnimalField(field, value) {
    setAnimalDirty(true);
    setAnimalSaved(false);
    setAnimalSaveError(false);

    setAnimalForm((current) => ({
      ...current,
      [field]: value
    }));
  }

  function updateGroupField(field, value) {
    setGroupDirty(true);
    setGroupSaved(false);
    setGroupSaveError(false);

    setGroupForm((current) => ({
      ...current,
      [field]: value
    }));
  }

  function updateEventField(field, value) {
    setEventForm((current) => ({
      ...current,
      [field]: value
    }));
  }

  function saveAnimal(event) {
    event?.preventDefault?.();

    if (!animalForm.tagId.trim() && !animalForm.name.trim()) {
      setAnimalSaveError(true);
      showToast({
        variant: "error",
        title: "Animal needs a name",
        message: "Add a Tag ID or animal name before saving."
      });
      return;
    }

    setAnimalSaving(true);
    setAnimalSaveError(false);

    try {
      const savedAnimal = saveHerdAnimal({
        ...animalForm,
        id: selectedAnimalId || animalForm.id,
        tagId: animalForm.tagId.trim(),
        name: animalForm.name.trim(),
        breed: animalForm.breed.trim(),
        purchaseCost: cleanCurrency(animalForm.purchaseCost),
        estimatedValue: cleanCurrency(animalForm.estimatedValue),
        acquisitionWeight: cleanNumber(animalForm.acquisitionWeight, 2),
        currentWeight: cleanNumber(animalForm.currentWeight, 2),
        notes: animalForm.notes.trim()
      });

      loadData();
      setSelectedAnimalId(savedAnimal.id);
      setAnimalForm({
        ...savedAnimal,
        purchaseCost: savedAnimal.purchaseCost || "",
        estimatedValue: savedAnimal.estimatedValue || ""
      });

      setAnimalDirty(false);
      setAnimalSaved(true);

      showToast({
        variant: "success",
        title: "Animal saved",
        message: "Animal record saved successfully."
      });

      window.setTimeout(() => {
        setAnimalSaved(false);
      }, 1200);
    } catch (error) {
      console.error("Could not save animal:", error);
      setAnimalSaveError(true);
      showToast({
        variant: "error",
        title: "Animal could not be saved",
        message: "Please check the record and try again."
      });
    } finally {
      setAnimalSaving(false);
    }
  }

  function saveGroup(event) {
    event?.preventDefault?.();

    if (!groupForm.name.trim()) {
      setGroupSaveError(true);
      showToast({
        variant: "error",
        title: "Group needs a name",
        message: "Add a group or lot name before saving."
      });
      return;
    }

    setGroupSaving(true);
    setGroupSaveError(false);

    try {
      const savedGroup = saveHerdGroup({
        ...groupForm,
        id: selectedGroupId || groupForm.id,
        name: groupForm.name.trim(),
        startingCount: cleanWholeNumber(groupForm.startingCount),
        currentCount: cleanWholeNumber(groupForm.currentCount),
        purchaseCost: cleanCurrency(groupForm.purchaseCost),
        estimatedValue: cleanCurrency(groupForm.estimatedValue),
        notes: groupForm.notes.trim()
      });

      loadData();
      setSelectedGroupId(savedGroup.id);
      setGroupForm({
        ...savedGroup,
        purchaseCost: savedGroup.purchaseCost || "",
        estimatedValue: savedGroup.estimatedValue || ""
      });

      setGroupDirty(false);
      setGroupSaved(true);

      showToast({
        variant: "success",
        title: "Group saved",
        message: "Group or lot record saved successfully."
      });

      window.setTimeout(() => {
        setGroupSaved(false);
      }, 1200);
    } catch (error) {
      console.error("Could not save group:", error);
      setGroupSaveError(true);
      showToast({
        variant: "error",
        title: "Group could not be saved",
        message: "Please check the record and try again."
      });
    } finally {
      setGroupSaving(false);
    }
  }

  function requestDeleteAnimal(animal) {
    setDeleteTarget({
      type: "animal",
      id: animal.id,
      title: animal.tagId || animal.name || "this animal",
      message: "Delete this animal record? This action cannot be undone."
    });
  }

  function requestDeleteGroup(group) {
    setDeleteTarget({
      type: "group",
      id: group.id,
      title: group.name || "this group",
      message: "Delete this group or lot? This action cannot be undone."
    });
  }

  function requestDeleteEvent(eventId, eventType) {
    setDeleteTarget({
      type: activeView === "animals" ? "animalEvent" : "groupEvent",
      id: eventId,
      title: eventType || "timeline event",
      message: "Delete this timeline event? This action cannot be undone."
    });
  }

  function confirmDelete() {
    if (!deleteTarget) return;

    if (deleteTarget.type === "animal") {
      deleteHerdAnimal(deleteTarget.id);
      loadData();

      if (selectedAnimalId === deleteTarget.id) {
        startNewAnimal();
      }

      showToast({
        variant: "success",
        title: "Animal deleted",
        message: "Animal record deleted."
      });
    }

    if (deleteTarget.type === "group") {
      deleteHerdGroup(deleteTarget.id);
      loadData();

      if (selectedGroupId === deleteTarget.id) {
        startNewGroup();
      }

      showToast({
        variant: "success",
        title: "Group deleted",
        message: "Group or lot record deleted."
      });
    }

    if (deleteTarget.type === "animalEvent") {
      const updatedAnimal = removeHerdEvent(selectedAnimalId, deleteTarget.id);
      loadData();

      if (updatedAnimal) {
        setAnimalForm({
          ...updatedAnimal,
          purchaseCost: updatedAnimal.purchaseCost || "",
          estimatedValue: updatedAnimal.estimatedValue || ""
        });
      }

      showToast({
        variant: "success",
        title: "Event removed",
        message: "Animal timeline event removed."
      });
    }

    if (deleteTarget.type === "groupEvent") {
      const updatedGroup = removeHerdGroupEvent(selectedGroupId, deleteTarget.id);
      loadData();

      if (updatedGroup) {
        setGroupForm({
          ...updatedGroup,
          purchaseCost: updatedGroup.purchaseCost || "",
          estimatedValue: updatedGroup.estimatedValue || ""
        });
      }

      showToast({
        variant: "success",
        title: "Event removed",
        message: "Group timeline event removed."
      });
    }

    setDeleteTarget(null);
  }

  function saveAnimalEvent(event) {
    event?.preventDefault?.();

    if (!selectedAnimalId) {
      showToast({
        variant: "error",
        title: "Select an animal first",
        message: "Save or select an animal before adding timeline events."
      });
      return;
    }

    if (
      !eventForm.description.trim() &&
      !eventForm.cost &&
      !eventForm.weight &&
      !eventForm.salePrice
    ) {
      showToast({
        variant: "error",
        title: "Event needs details",
        message: "Add a note, cost, sale price, or weight before saving this event."
      });
      return;
    }

    const updatedAnimal = addHerdEvent(selectedAnimalId, {
      ...eventForm,
      description: eventForm.description.trim(),
      cost: cleanCurrency(eventForm.cost),
      salePrice: cleanCurrency(eventForm.salePrice),
      weight: cleanNumber(eventForm.weight, 2)
    });

    loadData();

    if (updatedAnimal) {
      setAnimalForm({
        ...updatedAnimal,
        purchaseCost: updatedAnimal.purchaseCost || "",
        estimatedValue: updatedAnimal.estimatedValue || ""
      });
    }

    resetEventForm();

    showToast({
      variant: "success",
      title: "Event added",
      message: "Animal timeline event added."
    });
  }

  function saveGroupEvent(event) {
    event?.preventDefault?.();

    if (!selectedGroupId) {
      showToast({
        variant: "error",
        title: "Select a group first",
        message: "Save or select a group before adding timeline events."
      });
      return;
    }

    if (!eventForm.description.trim() && !eventForm.cost && !eventForm.salePrice) {
      showToast({
        variant: "error",
        title: "Event needs details",
        message: "Add a note, cost, or sale price before saving this event."
      });
      return;
    }

    const updatedGroup = addHerdGroupEvent(selectedGroupId, {
      ...eventForm,
      description: eventForm.description.trim(),
      cost: cleanCurrency(eventForm.cost),
      salePrice: cleanCurrency(eventForm.salePrice),
      weight: cleanNumber(eventForm.weight, 2)
    });

    loadData();

    if (updatedGroup) {
      setGroupForm({
        ...updatedGroup,
        purchaseCost: updatedGroup.purchaseCost || "",
        estimatedValue: updatedGroup.estimatedValue || ""
      });
    }

    resetEventForm();

    showToast({
      variant: "success",
      title: "Event added",
      message: "Group timeline event added."
    });
  }

  function markAnimalReady(animal) {
    const updatedAnimal = saveHerdAnimal({
      ...animal,
      status: "Ready for Processing"
    });

    loadData();
    setSelectedAnimalId(updatedAnimal.id);
    setAnimalForm({
      ...updatedAnimal,
      purchaseCost: updatedAnimal.purchaseCost || "",
      estimatedValue: updatedAnimal.estimatedValue || ""
    });

    showToast({
      variant: "success",
      title: "Ready for processing",
      message: "Animal added to the Butcher Board queue."
    });
  }

  function markGroupReady(group) {
    const updatedGroup = saveHerdGroup({
      ...group,
      status: "Ready for Processing"
    });

    loadData();
    setSelectedGroupId(updatedGroup.id);
    setGroupForm({
      ...updatedGroup,
      purchaseCost: updatedGroup.purchaseCost || "",
      estimatedValue: updatedGroup.estimatedValue || ""
    });

    showToast({
      variant: "success",
      title: "Ready for processing",
      message: "Group added to the Butcher Board queue."
    });
  }

  function renderEventExtraFields() {
    if (eventForm.type === "Health Treatment" || eventForm.type === "Vaccine") {
      return (
        <>
          <FormField label="Medication">
            <input
              value={eventForm.medication}
              onChange={(event) => updateEventField("medication", event.target.value)}
              placeholder="Medication or vaccine"
            />
          </FormField>

          <FormField label="Dosage">
            <input
              value={eventForm.dosage}
              onChange={(event) => updateEventField("dosage", event.target.value)}
              placeholder="Dosage"
            />
          </FormField>

          <FormField label="Withdrawal Date">
            <input
              type="date"
              value={eventForm.withdrawalDate}
              onChange={(event) => updateEventField("withdrawalDate", event.target.value)}
            />
          </FormField>
        </>
      );
    }

    if (eventForm.type === "Feed Cost") {
      return (
        <>
          <FormField label="Feed Type">
            <input
              value={eventForm.feedType}
              onChange={(event) => updateEventField("feedType", event.target.value)}
              placeholder="Feed, hay, mineral, etc."
            />
          </FormField>

          <FormField label="Quantity">
            <input
              value={eventForm.quantity}
              onChange={(event) => updateEventField("quantity", event.target.value)}
              placeholder="Quantity"
            />
          </FormField>

          <FormField label="Unit">
            <input
              value={eventForm.unit}
              onChange={(event) => updateEventField("unit", event.target.value)}
              placeholder="bags, bales, lb"
            />
          </FormField>
        </>
      );
    }

    if (eventForm.type === "Sale") {
      return (
        <>
          <FormField label="Buyer">
            <input
              value={eventForm.buyer}
              onChange={(event) => updateEventField("buyer", event.target.value)}
              placeholder="Buyer or customer"
            />
          </FormField>

          <FormField label="Sale Price">
            <input
              type="number"
              min="0"
              step="0.01"
              value={eventForm.salePrice}
              onChange={(event) => updateEventField("salePrice", event.target.value)}
              onBlur={(event) =>
                updateEventField("salePrice", cleanCurrency(event.target.value))
              }
              placeholder="0.00"
            />
          </FormField>
        </>
      );
    }

    if (eventForm.type === "Pasture Move") {
      return (
        <FormField label="Location">
          <input
            value={eventForm.location}
            onChange={(event) => updateEventField("location", event.target.value)}
            placeholder="Pasture, pen, barn, or paddock"
          />
        </FormField>
      );
    }

    return null;
  }

  function getAnimalActions(animal) {
    return [
      {
        label: "Edit",
        icon: Edit3,
        onClick: () => editAnimal(animal)
      },
      {
        label: "Ready for Butcher Board",
        icon: CalendarDays,
        onClick: () => markAnimalReady(animal)
      },
      {
        divider: true
      },
      {
        label: "Delete",
        icon: Trash2,
        destructive: true,
        onClick: () => requestDeleteAnimal(animal)
      }
    ];
  }

  function getGroupActions(group) {
    return [
      {
        label: "Edit",
        icon: Edit3,
        onClick: () => editGroup(group)
      },
      {
        label: "Ready for Butcher Board",
        icon: CalendarDays,
        onClick: () => markGroupReady(group)
      },
      {
        divider: true
      },
      {
        label: "Delete",
        icon: Trash2,
        destructive: true,
        onClick: () => requestDeleteGroup(group)
      }
    ];
  }

  const currentTimeline =
    activeView === "animals" ? selectedAnimal?.events || [] : selectedGroup?.events || [];

  return (
    <div className="modulePage herdTrackerModule">
      <ModuleHero
        eyebrow="Herd Management"
        accent="herd"
        icon={PawPrint}
        title="Track animals, groups, costs, locations, health events, and processing readiness."
        description="Use individual animal records for cattle and breeding stock, or group lots for poultry, feeder pigs, lambs, rabbits, and other batch-style livestock."
        actions={[
          {
            label: "Guide",
            icon: CircleHelp,
            variant: "secondary",
            onClick: () => setShowGuide(true)
          },
          {
            label: "Add Animal",
            icon: Plus,
            onClick: startNewAnimal
          },
          {
            label: "Add Group",
            icon: Layers,
            onClick: startNewGroup
          }
        ]}
      />

      <section className="hubStatGrid herdStatGrid">
        <StatCard
          icon={PawPrint}
          label="Animals"
          value={herdStats.totalAnimals}
          sub={`${herdStats.activeAnimals} active`}
          accent="herd"
        />

        <StatCard
          icon={Layers}
          label="Groups / Lots"
          value={herdStats.totalGroups}
          sub={`${herdStats.activeGroups} active`}
          accent="livestock"
        />

        <StatCard
          icon={CalendarDays}
          label="Ready Queue"
          value={herdStats.readyForProcessing}
          sub="for Butcher Board"
          accent="orders"
        />

        <StatCard
          icon={DollarSign}
          label="Cost Basis"
          value={money(herdStats.totalCostBasis)}
          sub="purchase + events"
          accent="pricing"
        />
      </section>

      <WorkspacePanel
        eyebrow="Butcher Board Queue"
        title="Ready for Processing"
        description="Animals and groups marked ready will appear here for processing planning."
      >
        {readyRecords.animals.length || readyRecords.groups.length ? (
          <RecordList
            records={[
              ...readyRecords.animals.map((animal) => ({
                ...animal,
                recordType: "animal"
              })),
              ...readyRecords.groups.map((group) => ({
                ...group,
                recordType: "group"
              }))
            ]}
            selectedRecordId={
              activeView === "animals" ? selectedAnimalId : selectedGroupId
            }
            getRecordId={(record) => `${record.recordType}-${record.id}`}
            onRecordClick={(record) =>
              record.recordType === "animal" ? editAnimal(record) : editGroup(record)
            }
            getTitle={(record) =>
              record.recordType === "animal"
                ? record.tagId || record.name || "Unnamed Animal"
                : record.name || "Unnamed Group"
            }
            getSubtitle={(record) =>
              record.recordType === "animal"
                ? `${record.species || "Animal"}${
                    record.projectedProcessingDate
                      ? ` • ${formatDate(record.projectedProcessingDate)}`
                      : ""
                  }`
                : `${record.species || "Group"}${
                    record.currentCount ? ` • ${record.currentCount} head` : ""
                  }${
                    record.projectedProcessingDate
                      ? ` • ${formatDate(record.projectedProcessingDate)}`
                      : ""
                  }`
            }
            getMeta={(record) => [
              { label: "Type", value: record.recordType === "animal" ? "Animal" : "Group" },
              { label: "Location", value: record.location || "Not set" }
            ]}
            renderStatus={(record) => (
              <StatusPill
                label={record.status || "Ready"}
                variant={getStatusVariant(record.status)}
              />
            )}
          />
        ) : (
          <EmptyState
            icon={CalendarDays}
            title="No records ready yet"
            message="Animals or groups marked Ready for Processing will appear here."
          />
        )}
      </WorkspacePanel>

      <WorkspacePanel
        eyebrow="Directory"
        title={activeView === "animals" ? "Individual Animals" : "Groups / Lots"}
        actions={[
          {
            label: activeView === "animals" ? "Add Animal" : "Add Group",
            icon: Plus,
            onClick: activeView === "animals" ? startNewAnimal : startNewGroup
          },
          {
            label: "Refresh",
            icon: RefreshCw,
            variant: "secondary",
            onClick: loadData
          }
        ]}
        toolbar={
          <FilterBar
            searchValue={activeView === "animals" ? animalSearch : groupSearch}
            onSearchChange={(value) =>
              activeView === "animals" ? setAnimalSearch(value) : setGroupSearch(value)
            }
            searchPlaceholder={
              activeView === "animals"
                ? "Search tag, name, breed..."
                : "Search group, lot, location..."
            }
            filters={[
              {
                label: "View",
                value: activeView,
                onChange: setActiveView,
                options: [
                  { label: "Animals", value: "animals" },
                  { label: "Groups / Lots", value: "groups" }
                ]
              },
              {
                label: "Species",
                value: speciesFilter,
                onChange: setSpeciesFilter,
                options: ["All", ...HERD_SPECIES_OPTIONS]
              },
              {
                label: "Status",
                value: statusFilter,
                onChange: setStatusFilter,
                options: ["All", ...HERD_STATUS_OPTIONS]
              }
            ]}
          />
        }
      >
        {activeView === "animals" ? (
          <RecordList
            records={filteredAnimals}
            selectedRecordId={selectedAnimalId}
            onRecordClick={editAnimal}
            emptyMessage="No animal records found. Use Add Animal to start individual herd records."
            getTitle={(animal) => animal.tagId || animal.name || "Unnamed Animal"}
            getSubtitle={(animal) =>
              [
                animal.species,
                animal.breed,
                animal.purpose
              ]
                .filter(Boolean)
                .join(" • ")
            }
            getMeta={(animal) => [
              { label: "Cost Basis", value: money(calculateAnimalCostBasis(animal)) },
              { label: "Weight", value: animal.currentWeight ? `${animal.currentWeight} lb` : "" },
              { label: "Location", value: animal.location || "Not set" }
            ]}
            renderStatus={(animal) => (
              <StatusPill
                label={animal.status || "Active"}
                variant={getStatusVariant(animal.status)}
              />
            )}
            renderActions={(animal) => (
              <ActionMenu items={getAnimalActions(animal)} />
            )}
          />
        ) : (
          <RecordList
            records={filteredGroups}
            selectedRecordId={selectedGroupId}
            onRecordClick={editGroup}
            emptyMessage="No group or lot records found. Use Add Group for batch-style tracking."
            getTitle={(group) => group.name || "Unnamed Group"}
            getSubtitle={(group) =>
              [
                group.species,
                group.purpose,
                group.currentCount ? `${group.currentCount} head` : ""
              ]
                .filter(Boolean)
                .join(" • ")
            }
            getMeta={(group) => [
              { label: "Cost Basis", value: money(calculateGroupCostBasis(group)) },
              { label: "Location", value: group.location || "Not set" }
            ]}
            renderStatus={(group) => (
              <StatusPill
                label={group.status || "Active"}
                variant={getStatusVariant(group.status)}
              />
            )}
            renderActions={(group) => (
              <ActionMenu items={getGroupActions(group)} />
            )}
          />
        )}
      </WorkspacePanel>

      <section className="herdWorkspaceGrid compactWorkspace">
        {activeView === "animals" ? (
          <WorkspacePanel
            eyebrow="Animal Record"
            title={selectedAnimalId ? "Edit Animal" : "Add Animal"}
            className="herdAnimalPanel"
            actions={[
              {
                label: "Clear",
                variant: "secondary",
                onClick: startNewAnimal
              }
            ]}
          >
            <form className="formGrid compactFormGrid" onSubmit={saveAnimal}>
              <FormField label="Tag ID">
                <input
                  value={animalForm.tagId}
                  onChange={(event) => updateAnimalField("tagId", event.target.value)}
                  placeholder="e.g., 104"
                />
              </FormField>

              <FormField label="Tag Type">
                <select
                  value={animalForm.tagType}
                  onChange={(event) => updateAnimalField("tagType", event.target.value)}
                >
                  {HERD_TAG_TYPE_OPTIONS.map((tagType) => (
                    <option key={tagType} value={tagType}>
                      {tagType}
                    </option>
                  ))}
                </select>
              </FormField>

              <FormField label="Name">
                <input
                  value={animalForm.name}
                  onChange={(event) => updateAnimalField("name", event.target.value)}
                  placeholder="Optional"
                />
              </FormField>

              <FormField label="Species">
                <select
                  value={animalForm.species}
                  onChange={(event) => updateAnimalField("species", event.target.value)}
                >
                  {HERD_SPECIES_OPTIONS.map((species) => (
                    <option key={species} value={species}>
                      {species}
                    </option>
                  ))}
                </select>
              </FormField>

              <FormField label="Breed">
                <input
                  value={animalForm.breed}
                  onChange={(event) => updateAnimalField("breed", event.target.value)}
                  placeholder="e.g., Angus"
                />
              </FormField>

              <FormField label="Sex">
                <select
                  value={animalForm.sex}
                  onChange={(event) => updateAnimalField("sex", event.target.value)}
                >
                  <option value="">Select</option>
                  <option value="Female">Female</option>
                  <option value="Male">Male</option>
                  <option value="Steer">Steer</option>
                  <option value="Unknown">Unknown</option>
                </select>
              </FormField>

              <FormField label="Purpose">
                <select
                  value={animalForm.purpose}
                  onChange={(event) => updateAnimalField("purpose", event.target.value)}
                >
                  {HERD_PURPOSE_OPTIONS.map((purpose) => (
                    <option key={purpose} value={purpose}>
                      {purpose}
                    </option>
                  ))}
                </select>
              </FormField>

              <FormField label="Group / Lot">
                <select
                  value={animalForm.groupId}
                  onChange={(event) => updateAnimalField("groupId", event.target.value)}
                >
                  <option value="">No group</option>
                  {groups.map((group) => (
                    <option key={group.id} value={group.id}>
                      {group.name}
                    </option>
                  ))}
                </select>
              </FormField>

              <FormField label="Source">
                <select
                  value={animalForm.source}
                  onChange={(event) => updateAnimalField("source", event.target.value)}
                >
                  {HERD_SOURCE_OPTIONS.map((source) => (
                    <option key={source} value={source}>
                      {source}
                    </option>
                  ))}
                </select>
              </FormField>

              <FormField label="Status">
                <select
                  value={animalForm.status}
                  onChange={(event) => updateAnimalField("status", event.target.value)}
                >
                  {HERD_STATUS_OPTIONS.map((status) => (
                    <option key={status} value={status}>
                      {status}
                    </option>
                  ))}
                </select>
              </FormField>

              <FormField label="Birth Date">
                <input
                  type="date"
                  value={animalForm.birthDate}
                  onChange={(event) => updateAnimalField("birthDate", event.target.value)}
                />
              </FormField>

              <FormField label="Purchase Date">
                <input
                  type="date"
                  value={animalForm.purchaseDate}
                  onChange={(event) => updateAnimalField("purchaseDate", event.target.value)}
                />
              </FormField>

              <FormField label="Acquisition Weight">
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={animalForm.acquisitionWeight}
                  onChange={(event) =>
                    updateAnimalField("acquisitionWeight", event.target.value)
                  }
                  onBlur={(event) =>
                    updateAnimalField(
                      "acquisitionWeight",
                      cleanNumber(event.target.value, 2)
                    )
                  }
                  placeholder="lb"
                />
              </FormField>

              <FormField label="Current Weight">
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={animalForm.currentWeight}
                  onChange={(event) =>
                    updateAnimalField("currentWeight", event.target.value)
                  }
                  onBlur={(event) =>
                    updateAnimalField("currentWeight", cleanNumber(event.target.value, 2))
                  }
                  placeholder="lb"
                />
              </FormField>

              <FormField label="Last Weight Date">
                <input
                  type="date"
                  value={animalForm.lastWeightDate}
                  onChange={(event) =>
                    updateAnimalField("lastWeightDate", event.target.value)
                  }
                />
              </FormField>

              <FormField label="Projected Processing Date">
                <input
                  type="date"
                  value={animalForm.projectedProcessingDate}
                  onChange={(event) =>
                    updateAnimalField("projectedProcessingDate", event.target.value)
                  }
                />
              </FormField>

              <FormField label="Withdrawal Date">
                <input
                  type="date"
                  value={animalForm.withdrawalDate}
                  onChange={(event) =>
                    updateAnimalField("withdrawalDate", event.target.value)
                  }
                />
              </FormField>

              <FormField label="Location / Pasture">
                <input
                  value={animalForm.location}
                  onChange={(event) => updateAnimalField("location", event.target.value)}
                  placeholder="Pasture, pen, barn, etc."
                />
              </FormField>

              <FormField label="Purchase Cost">
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={animalForm.purchaseCost}
                  onChange={(event) =>
                    updateAnimalField("purchaseCost", event.target.value)
                  }
                  onBlur={(event) =>
                    updateAnimalField("purchaseCost", cleanCurrency(event.target.value))
                  }
                  placeholder="0.00"
                />
              </FormField>

              <FormField label="Estimated Value">
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={animalForm.estimatedValue}
                  onChange={(event) =>
                    updateAnimalField("estimatedValue", event.target.value)
                  }
                  onBlur={(event) =>
                    updateAnimalField("estimatedValue", cleanCurrency(event.target.value))
                  }
                  placeholder="0.00"
                />
              </FormField>

              <div className="livestockCalculatedField">
                <span>Current Cost Basis</span>
                <strong>{money(calculateAnimalCostBasis(animalForm))}</strong>
              </div>

              <FormField label="Notes" fullWidth>
                <textarea
                  value={animalForm.notes}
                  onChange={(event) => updateAnimalField("notes", event.target.value)}
                  placeholder="Animal history, temperament, health notes, breeding notes, or processing plans..."
                />
              </FormField>

              <div className="fullSpan herdEditorActions">
                <button
                  className="secondaryButton compactButton"
                  type="button"
                  onClick={startNewAnimal}
                >
                  Clear
                </button>

                <SaveButton
                  dirty={animalDirty}
                  saving={animalSaving}
                  saved={animalSaved}
                  error={animalSaveError}
                  label="Save Animal"
                  dirtyLabel="Save Animal"
                  onClick={saveAnimal}
                />

                {selectedAnimal ? (
                  <button
                    className="secondaryButton compactButton"
                    type="button"
                    onClick={() => markAnimalReady(selectedAnimal)}
                  >
                    <CalendarDays size={15} />
                    Ready for Butcher Board
                  </button>
                ) : null}
              </div>
            </form>
          </WorkspacePanel>
        ) : (
          <WorkspacePanel
            eyebrow="Group / Lot Record"
            title={selectedGroupId ? "Edit Group" : "Add Group"}
            className="herdAnimalPanel"
            actions={[
              {
                label: "Clear",
                variant: "secondary",
                onClick: startNewGroup
              }
            ]}
          >
            <form className="formGrid compactFormGrid" onSubmit={saveGroup}>
              <FormField label="Group / Lot Name">
                <input
                  value={groupForm.name}
                  onChange={(event) => updateGroupField("name", event.target.value)}
                  placeholder="e.g., 2026 Feeder Steers"
                />
              </FormField>

              <FormField label="Species">
                <select
                  value={groupForm.species}
                  onChange={(event) => updateGroupField("species", event.target.value)}
                >
                  {HERD_SPECIES_OPTIONS.map((species) => (
                    <option key={species} value={species}>
                      {species}
                    </option>
                  ))}
                </select>
              </FormField>

              <FormField label="Purpose">
                <select
                  value={groupForm.purpose}
                  onChange={(event) => updateGroupField("purpose", event.target.value)}
                >
                  {HERD_PURPOSE_OPTIONS.map((purpose) => (
                    <option key={purpose} value={purpose}>
                      {purpose}
                    </option>
                  ))}
                </select>
              </FormField>

              <FormField label="Status">
                <select
                  value={groupForm.status}
                  onChange={(event) => updateGroupField("status", event.target.value)}
                >
                  {HERD_STATUS_OPTIONS.map((status) => (
                    <option key={status} value={status}>
                      {status}
                    </option>
                  ))}
                </select>
              </FormField>

              <FormField label="Start Date">
                <input
                  type="date"
                  value={groupForm.startDate}
                  onChange={(event) => updateGroupField("startDate", event.target.value)}
                />
              </FormField>

              <FormField label="Projected Processing Date">
                <input
                  type="date"
                  value={groupForm.projectedProcessingDate}
                  onChange={(event) =>
                    updateGroupField("projectedProcessingDate", event.target.value)
                  }
                />
              </FormField>

              <FormField label="Starting Count">
                <input
                  type="number"
                  min="0"
                  step="1"
                  value={groupForm.startingCount}
                  onChange={(event) =>
                    updateGroupField("startingCount", event.target.value)
                  }
                  onBlur={(event) =>
                    updateGroupField("startingCount", cleanWholeNumber(event.target.value))
                  }
                  placeholder="e.g., 25"
                />
              </FormField>

              <FormField label="Current Count">
                <input
                  type="number"
                  min="0"
                  step="1"
                  value={groupForm.currentCount}
                  onChange={(event) =>
                    updateGroupField("currentCount", event.target.value)
                  }
                  onBlur={(event) =>
                    updateGroupField("currentCount", cleanWholeNumber(event.target.value))
                  }
                  placeholder="e.g., 25"
                />
              </FormField>

              <FormField label="Location / Pasture">
                <input
                  value={groupForm.location}
                  onChange={(event) => updateGroupField("location", event.target.value)}
                  placeholder="Pasture, pen, barn, etc."
                />
              </FormField>

              <FormField label="Purchase Cost">
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={groupForm.purchaseCost}
                  onChange={(event) =>
                    updateGroupField("purchaseCost", event.target.value)
                  }
                  onBlur={(event) =>
                    updateGroupField("purchaseCost", cleanCurrency(event.target.value))
                  }
                  placeholder="0.00"
                />
              </FormField>

              <FormField label="Estimated Value">
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={groupForm.estimatedValue}
                  onChange={(event) =>
                    updateGroupField("estimatedValue", event.target.value)
                  }
                  onBlur={(event) =>
                    updateGroupField("estimatedValue", cleanCurrency(event.target.value))
                  }
                  placeholder="0.00"
                />
              </FormField>

              <div className="livestockCalculatedField">
                <span>Current Cost Basis</span>
                <strong>{money(calculateGroupCostBasis(groupForm))}</strong>
              </div>

              <FormField label="Notes" fullWidth>
                <textarea
                  value={groupForm.notes}
                  onChange={(event) => updateGroupField("notes", event.target.value)}
                  placeholder="Group feed plan, pasture notes, health notes, losses, or processing plans..."
                />
              </FormField>

              <div className="fullSpan herdEditorActions">
                <button
                  className="secondaryButton compactButton"
                  type="button"
                  onClick={startNewGroup}
                >
                  Clear
                </button>

                <SaveButton
                  dirty={groupDirty}
                  saving={groupSaving}
                  saved={groupSaved}
                  error={groupSaveError}
                  label="Save Group"
                  dirtyLabel="Save Group"
                  onClick={saveGroup}
                />

                {selectedGroup ? (
                  <button
                    className="secondaryButton compactButton"
                    type="button"
                    onClick={() => markGroupReady(selectedGroup)}
                  >
                    <CalendarDays size={15} />
                    Ready for Butcher Board
                  </button>
                ) : null}
              </div>
            </form>
          </WorkspacePanel>
        )}

        <WorkspacePanel
          eyebrow="Timeline"
          title={
            activeView === "animals"
              ? selectedAnimal
                ? getDisplayName(selectedAnimal)
                : "Select an Animal"
              : selectedGroup
                ? selectedGroup.name || "Selected Group"
                : "Select a Group"
          }
          className="herdTimelinePanel"
          actions={
            activeView === "animals" && selectedAnimal?.location
              ? [
                  {
                    label: selectedAnimal.location,
                    icon: MapPin,
                    variant: "secondary",
                    onClick: () => {}
                  }
                ]
              : activeView === "groups" && selectedGroup?.location
                ? [
                    {
                      label: selectedGroup.location,
                      icon: MapPin,
                      variant: "secondary",
                      onClick: () => {}
                    }
                  ]
                : []
          }
        >
          {(activeView === "animals" && selectedAnimal) ||
          (activeView === "groups" && selectedGroup) ? (
            <>
              <form
                className="formGrid compactFormGrid herdEventForm"
                onSubmit={activeView === "animals" ? saveAnimalEvent : saveGroupEvent}
              >
                <FormField label="Event Type">
                  <select
                    value={eventForm.type}
                    onChange={(event) => updateEventField("type", event.target.value)}
                  >
                    {HERD_EVENT_TYPES.map((type) => (
                      <option key={type} value={type}>
                        {type}
                      </option>
                    ))}
                  </select>
                </FormField>

                <FormField label="Date">
                  <input
                    type="date"
                    value={eventForm.date}
                    onChange={(event) => updateEventField("date", event.target.value)}
                  />
                </FormField>

                <FormField label="Cost">
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={eventForm.cost}
                    onChange={(event) => updateEventField("cost", event.target.value)}
                    onBlur={(event) =>
                      updateEventField("cost", cleanCurrency(event.target.value))
                    }
                    placeholder="0.00"
                  />
                </FormField>

                {activeView === "animals" ? (
                  <FormField label="Weight">
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={eventForm.weight}
                      onChange={(event) =>
                        updateEventField("weight", event.target.value)
                      }
                      onBlur={(event) =>
                        updateEventField("weight", cleanNumber(event.target.value, 2))
                      }
                      placeholder="lb"
                    />
                  </FormField>
                ) : null}

                {renderEventExtraFields()}

                <FormField label="Description" fullWidth>
                  <textarea
                    value={eventForm.description}
                    onChange={(event) =>
                      updateEventField("description", event.target.value)
                    }
                    placeholder="Add feed notes, treatment details, weight notes, pasture movement, sale notes, or general history..."
                  />
                </FormField>

                <div className="fullSpan herdEventActions">
                  <button className="primaryButton compactPrimary" type="submit">
                    <Plus size={15} />
                    Add Event
                  </button>
                </div>
              </form>

              <div className="herdTimelineList">
                {currentTimeline.length ? (
                  <RecordList
                    records={currentTimeline}
                    getRecordId={(event) => event.id}
                    getTitle={timelineTitle}
                    getSubtitle={timelineSubtitle}
                    getMeta={(event) => [
                      {
                        label: "Medication",
                        value: event.medication || ""
                      },
                      {
                        label: "Feed",
                        value: event.feedType || ""
                      },
                      {
                        label: "Buyer",
                        value: event.buyer || ""
                      },
                      {
                        label: "Location",
                        value: event.location || ""
                      },
                      {
                        label: "Note",
                        value: event.description || "No description added."
                      }
                    ]}
                    renderStatus={(event) => (
                      <StatusPill label={event.type || "Event"} variant="info" />
                    )}
                    renderActions={(event) => (
                      <div className="itemActions">
                        <button
                          type="button"
                          aria-label="Delete timeline event"
                          onClick={() => requestDeleteEvent(event.id, event.type)}
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    )}
                  />
                ) : (
                  <EmptyState
                    icon={History}
                    title="No timeline events yet"
                    message="Add feed costs, weight checks, health treatments, pasture moves, sales, or notes."
                  />
                )}
              </div>
            </>
          ) : (
            <EmptyState
              icon={History}
              title={
                activeView === "animals" ? "Select an animal" : "Select a group"
              }
              message="Select or save a record to begin tracking timeline events."
            />
          )}
        </WorkspacePanel>
      </section>

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        title={
          deleteTarget?.type === "animal"
            ? "Delete Animal?"
            : deleteTarget?.type === "group"
              ? "Delete Group?"
              : "Delete Event?"
        }
        message={deleteTarget?.message || "This action cannot be undone."}
        confirmLabel="Delete"
        confirmVariant="danger"
        cancelLabel="Cancel"
        onConfirm={confirmDelete}
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
        moduleKey="herd-tracker"
        title="How to Use Herd Tracker"
        onClose={() => setShowGuide(false)}
      >
        <HerdTrackerGuideContent />
      </ModuleGuideModal>
    </div>
  );
}
