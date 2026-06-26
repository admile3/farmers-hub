import { useEffect, useMemo, useState } from "react";
import {
  AlertCircle,
  Beef,
  CalendarDays,
  CircleHelp,
  ClipboardList,
  DollarSign,
  Edit3,
  History,
  Layers,
  MapPin,
  Plus,
  Save,
  Search,
  Trash2,
  X
} from "lucide-react";

import ModuleHero from "../components/ModuleHero.jsx";
import ModuleGuideModal from "../components/ModuleGuideModal.jsx";
import HerdTrackerGuideContent from "../components/HerdTrackerGuideContent.jsx";
import StatCard from "../components/StatCard.jsx";
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
  return record.tagId || record.name || record.name || "Unnamed Record";
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
  const [statusMessage, setStatusMessage] = useState("");
  const [statusType, setStatusType] = useState("info");

  function showStatus(message, type = "info") {
    setStatusMessage(message);
    setStatusType(type);
  }

  function loadData() {
    setAnimals(getHerdAnimals());
    setGroups(getHerdGroups());
  }

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (!statusMessage) return undefined;

    const timer = window.setTimeout(() => {
      setStatusMessage("");
    }, 3000);

    return () => window.clearTimeout(timer);
  }, [statusMessage]);

  useEffect(() => {
    const guideHidden = localStorage.getItem("hideModuleGuide_herd-tracker") === "true";
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
      const matchesSpecies = speciesFilter === "All" || animal.species === speciesFilter;

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
      const matchesSpecies = speciesFilter === "All" || group.species === speciesFilter;

      return matchesSearch && matchesStatus && matchesSpecies;
    });
  }, [groups, groupSearch, statusFilter, speciesFilter]);

  function resetEventForm() {
    setEventForm({
      ...blankEvent,
      date: new Date().toISOString().slice(0, 10)
    });
  }

  function startNewAnimal() {
    setActiveView("animals");
    setSelectedAnimalId("");
    setAnimalForm(blankAnimal);
    resetEventForm();
  }

  function startNewGroup() {
    setActiveView("groups");
    setSelectedGroupId("");
    setGroupForm(blankGroup);
    resetEventForm();
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
  }

  function updateAnimalField(field, value) {
    setAnimalForm((current) => ({
      ...current,
      [field]: value
    }));
  }

  function updateGroupField(field, value) {
    setGroupForm((current) => ({
      ...current,
      [field]: value
    }));
  }

  function saveAnimal(event) {
    event?.preventDefault?.();

    if (!animalForm.tagId.trim() && !animalForm.name.trim()) {
      showStatus("Add a Tag ID or animal name before saving.", "error");
      return;
    }

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

    showStatus("Animal record saved.", "success");
  }

  function saveGroup(event) {
    event?.preventDefault?.();

    if (!groupForm.name.trim()) {
      showStatus("Add a group or lot name before saving.", "error");
      return;
    }

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

    showStatus("Group record saved.", "success");
  }

  function removeAnimal(animalId) {
    const confirmed = window.confirm("Delete this animal record? This cannot be undone.");
    if (!confirmed) return;

    deleteHerdAnimal(animalId);
    loadData();

    if (selectedAnimalId === animalId) {
      startNewAnimal();
    }

    showStatus("Animal record deleted.", "success");
  }

  function removeGroup(groupId) {
    const confirmed = window.confirm("Delete this group or lot? This cannot be undone.");
    if (!confirmed) return;

    deleteHerdGroup(groupId);
    loadData();

    if (selectedGroupId === groupId) {
      startNewGroup();
    }

    showStatus("Group record deleted.", "success");
  }

  function updateEventField(field, value) {
    setEventForm((current) => ({
      ...current,
      [field]: value
    }));
  }

  function saveAnimalEvent(event) {
    event?.preventDefault?.();

    if (!selectedAnimalId) {
      showStatus("Save or select an animal before adding timeline events.", "error");
      return;
    }

    if (!eventForm.description.trim() && !eventForm.cost && !eventForm.weight && !eventForm.salePrice) {
      showStatus("Add a note, cost, sale price, or weight before saving this event.", "error");
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
    showStatus("Animal timeline event added.", "success");
  }

  function saveGroupEvent(event) {
    event?.preventDefault?.();

    if (!selectedGroupId) {
      showStatus("Save or select a group before adding timeline events.", "error");
      return;
    }

    if (!eventForm.description.trim() && !eventForm.cost && !eventForm.salePrice) {
      showStatus("Add a note, cost, or sale price before saving this event.", "error");
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
    showStatus("Group timeline event added.", "success");
  }

  function deleteAnimalEvent(eventId) {
    if (!selectedAnimalId) return;

    const updatedAnimal = removeHerdEvent(selectedAnimalId, eventId);
    loadData();

    if (updatedAnimal) {
      setAnimalForm({
        ...updatedAnimal,
        purchaseCost: updatedAnimal.purchaseCost || "",
        estimatedValue: updatedAnimal.estimatedValue || ""
      });
    }

    showStatus("Timeline event removed.", "success");
  }

  function deleteGroupEvent(eventId) {
    if (!selectedGroupId) return;

    const updatedGroup = removeHerdGroupEvent(selectedGroupId, eventId);
    loadData();

    if (updatedGroup) {
      setGroupForm({
        ...updatedGroup,
        purchaseCost: updatedGroup.purchaseCost || "",
        estimatedValue: updatedGroup.estimatedValue || ""
      });
    }

    showStatus("Timeline event removed.", "success");
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

    showStatus("Animal added to the Butcher Board queue.", "success");
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

    showStatus("Group added to the Butcher Board queue.", "success");
  }

  function renderEventExtraFields() {
    if (eventForm.type === "Health Treatment" || eventForm.type === "Vaccine") {
      return (
        <>
          <label>
            Medication
            <input
              value={eventForm.medication}
              onChange={(event) => updateEventField("medication", event.target.value)}
              placeholder="Medication or vaccine"
            />
          </label>

          <label>
            Dosage
            <input
              value={eventForm.dosage}
              onChange={(event) => updateEventField("dosage", event.target.value)}
              placeholder="Dosage"
            />
          </label>

          <label>
            Withdrawal Date
            <input
              type="date"
              value={eventForm.withdrawalDate}
              onChange={(event) => updateEventField("withdrawalDate", event.target.value)}
            />
          </label>
        </>
      );
    }

    if (eventForm.type === "Feed Cost") {
      return (
        <>
          <label>
            Feed Type
            <input
              value={eventForm.feedType}
              onChange={(event) => updateEventField("feedType", event.target.value)}
              placeholder="Feed, hay, mineral, etc."
            />
          </label>

          <label>
            Quantity
            <input
              value={eventForm.quantity}
              onChange={(event) => updateEventField("quantity", event.target.value)}
              placeholder="Quantity"
            />
          </label>

          <label>
            Unit
            <input
              value={eventForm.unit}
              onChange={(event) => updateEventField("unit", event.target.value)}
              placeholder="bags, bales, lb"
            />
          </label>
        </>
      );
    }

    if (eventForm.type === "Sale") {
      return (
        <>
          <label>
            Buyer
            <input
              value={eventForm.buyer}
              onChange={(event) => updateEventField("buyer", event.target.value)}
              placeholder="Buyer or customer"
            />
          </label>

          <label>
            Sale Price
            <input
              type="number"
              min="0"
              step="0.01"
              value={eventForm.salePrice}
              onChange={(event) => updateEventField("salePrice", event.target.value)}
              onBlur={(event) => updateEventField("salePrice", cleanCurrency(event.target.value))}
              placeholder="0.00"
            />
          </label>
        </>
      );
    }

    if (eventForm.type === "Pasture Move") {
      return (
        <label>
          Location
          <input
            value={eventForm.location}
            onChange={(event) => updateEventField("location", event.target.value)}
            placeholder="Pasture, pen, barn, or paddock"
          />
        </label>
      );
    }

    return null;
  }

  const currentTimeline =
    activeView === "animals" ? selectedAnimal?.events || [] : selectedGroup?.events || [];

  return (
    <div className="modulePage herdTrackerModule">
      {statusMessage ? (
        <div className={`floatingStatus ${statusType}`}>
          <AlertCircle size={18} />
          <span>{statusMessage}</span>
          <button type="button" onClick={() => setStatusMessage("")}>
            <X size={16} />
          </button>
        </div>
      ) : null}

      <ModuleHero
        eyebrow="Herd Management"
        title="Track animals, groups, costs, locations, health events, and processing readiness."
        description="Use individual animal records for cattle and breeding stock, or group lots for poultry, feeder pigs, lambs, rabbits, and other batch-style livestock."
        className="herdHero"
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
          icon={Beef}
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

      <section className="workspacePanel compactPanel herdQueuePanel">
        <div className="workspaceHeader compactPanelHeader">
          <div>
            <p className="eyebrow">Butcher Board Queue</p>
            <h3>Ready for Processing</h3>
          </div>
        </div>

        <div className="herdReadyGrid">
          {readyRecords.animals.length || readyRecords.groups.length ? (
            <>
              {readyRecords.animals.map((animal) => (
                <button
                  className="herdReadyCard"
                  key={animal.id}
                  type="button"
                  onClick={() => editAnimal(animal)}
                >
                  <Beef size={18} />
                  <div>
                    <strong>{animal.tagId || animal.name || "Unnamed Animal"}</strong>
                    <span>
                      {animal.species}
                      {animal.projectedProcessingDate
                        ? ` • ${formatDate(animal.projectedProcessingDate)}`
                        : ""}
                    </span>
                  </div>
                </button>
              ))}

              {readyRecords.groups.map((group) => (
                <button
                  className="herdReadyCard"
                  key={group.id}
                  type="button"
                  onClick={() => editGroup(group)}
                >
                  <Layers size={18} />
                  <div>
                    <strong>{group.name || "Unnamed Group"}</strong>
                    <span>
                      {group.species}
                      {group.currentCount ? ` • ${group.currentCount} head` : ""}
                      {group.projectedProcessingDate
                        ? ` • ${formatDate(group.projectedProcessingDate)}`
                        : ""}
                    </span>
                  </div>
                </button>
              ))}
            </>
          ) : (
            <div className="placeholderBox compactPlaceholder">
              No animals or groups are marked Ready for Processing yet.
            </div>
          )}
        </div>
      </section>

      <section className="workspacePanel compactPanel herdDirectoryPanel">
        <div className="workspaceHeader compactPanelHeader">
          <div>
            <p className="eyebrow">Directory</p>
            <h3>{activeView === "animals" ? "Individual Animals" : "Groups / Lots"}</h3>
          </div>

          <div className="herdViewToggle">
            <button
              type="button"
              className={activeView === "animals" ? "selected" : ""}
              onClick={() => setActiveView("animals")}
            >
              Animals
            </button>
            <button
              type="button"
              className={activeView === "groups" ? "selected" : ""}
              onClick={() => setActiveView("groups")}
            >
              Groups / Lots
            </button>
          </div>
        </div>

        <div className="inventoryToolbar herdToolbar">
          <div className="searchBox compactSearch">
            <Search size={17} />
            <input
              value={activeView === "animals" ? animalSearch : groupSearch}
              onChange={(event) =>
                activeView === "animals"
                  ? setAnimalSearch(event.target.value)
                  : setGroupSearch(event.target.value)
              }
              placeholder={
                activeView === "animals"
                  ? "Search tag, name, breed..."
                  : "Search group, lot, location..."
              }
            />
          </div>

          <select value={speciesFilter} onChange={(event) => setSpeciesFilter(event.target.value)}>
            <option value="All">All Species</option>
            {HERD_SPECIES_OPTIONS.map((species) => (
              <option key={species} value={species}>
                {species}
              </option>
            ))}
          </select>

          <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}>
            <option value="All">All Statuses</option>
            {HERD_STATUS_OPTIONS.map((status) => (
              <option key={status} value={status}>
                {status}
              </option>
            ))}
          </select>
        </div>

        {activeView === "animals" ? (
          <div className="savedList compactSavedList herdSavedList">
            {filteredAnimals.length ? (
              filteredAnimals.map((animal) => (
                <div className="savedItem compactSavedItem herdSavedItem" key={animal.id}>
                  <div>
                    <h4>{animal.tagId || animal.name || "Unnamed Animal"}</h4>
                    <p>
                      {animal.species}
                      {animal.breed ? ` • ${animal.breed}` : ""}
                      {animal.purpose ? ` • ${animal.purpose}` : ""}
                      {animal.status ? ` • ${animal.status}` : ""}
                    </p>
                    <p>
                      Cost basis: {money(calculateAnimalCostBasis(animal))}
                      {animal.currentWeight ? ` • ${animal.currentWeight} lb` : ""}
                      {animal.location ? ` • ${animal.location}` : ""}
                    </p>
                  </div>

                  <div className="itemActions">
                    <button type="button" onClick={() => editAnimal(animal)}>
                      <Edit3 size={14} />
                    </button>

                    <button type="button" onClick={() => removeAnimal(animal.id)}>
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <div className="placeholderBox compactPlaceholder">
                No animal records found. Use Add Animal to start individual herd records.
              </div>
            )}
          </div>
        ) : (
          <div className="savedList compactSavedList herdSavedList">
            {filteredGroups.length ? (
              filteredGroups.map((group) => (
                <div className="savedItem compactSavedItem herdSavedItem" key={group.id}>
                  <div>
                    <h4>{group.name || "Unnamed Group"}</h4>
                    <p>
                      {group.species}
                      {group.purpose ? ` • ${group.purpose}` : ""}
                      {group.status ? ` • ${group.status}` : ""}
                      {group.currentCount ? ` • ${group.currentCount} head` : ""}
                    </p>
                    <p>
                      Cost basis: {money(calculateGroupCostBasis(group))}
                      {group.location ? ` • ${group.location}` : ""}
                    </p>
                  </div>

                  <div className="itemActions">
                    <button type="button" onClick={() => editGroup(group)}>
                      <Edit3 size={14} />
                    </button>

                    <button type="button" onClick={() => removeGroup(group.id)}>
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <div className="placeholderBox compactPlaceholder">
                No group or lot records found. Use Add Group for batch-style tracking.
              </div>
            )}
          </div>
        )}
      </section>

      <section className="herdWorkspaceGrid compactWorkspace">
        {activeView === "animals" ? (
          <div className="workspacePanel compactPanel herdAnimalPanel">
            <div className="workspaceHeader compactPanelHeader">
              <div>
                <p className="eyebrow">Animal Record</p>
                <h3>{selectedAnimalId ? "Edit Animal" : "Add Animal"}</h3>
              </div>

              <button className="primaryButton compactPrimary" type="button" onClick={saveAnimal}>
                <Save size={15} />
                Save Animal
              </button>
            </div>

            <form className="formGrid compactFormGrid" onSubmit={saveAnimal}>
              <label>
                Tag ID
                <input
                  value={animalForm.tagId}
                  onChange={(event) => updateAnimalField("tagId", event.target.value)}
                  placeholder="e.g., 104"
                />
              </label>

              <label>
                Tag Type
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
              </label>

              <label>
                Name
                <input
                  value={animalForm.name}
                  onChange={(event) => updateAnimalField("name", event.target.value)}
                  placeholder="Optional"
                />
              </label>

              <label>
                Species
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
              </label>

              <label>
                Breed
                <input
                  value={animalForm.breed}
                  onChange={(event) => updateAnimalField("breed", event.target.value)}
                  placeholder="e.g., Angus"
                />
              </label>

              <label>
                Sex
                <select value={animalForm.sex} onChange={(event) => updateAnimalField("sex", event.target.value)}>
                  <option value="">Select</option>
                  <option value="Female">Female</option>
                  <option value="Male">Male</option>
                  <option value="Steer">Steer</option>
                  <option value="Unknown">Unknown</option>
                </select>
              </label>

              <label>
                Purpose
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
              </label>

              <label>
                Group / Lot
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
              </label>

              <label>
                Source
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
              </label>

              <label>
                Status
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
              </label>

              <label>
                Birth Date
                <input
                  type="date"
                  value={animalForm.birthDate}
                  onChange={(event) => updateAnimalField("birthDate", event.target.value)}
                />
              </label>

              <label>
                Purchase Date
                <input
                  type="date"
                  value={animalForm.purchaseDate}
                  onChange={(event) => updateAnimalField("purchaseDate", event.target.value)}
                />
              </label>

              <label>
                Acquisition Weight
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={animalForm.acquisitionWeight}
                  onChange={(event) => updateAnimalField("acquisitionWeight", event.target.value)}
                  onBlur={(event) => updateAnimalField("acquisitionWeight", cleanNumber(event.target.value, 2))}
                  placeholder="lb"
                />
              </label>

              <label>
                Current Weight
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={animalForm.currentWeight}
                  onChange={(event) => updateAnimalField("currentWeight", event.target.value)}
                  onBlur={(event) => updateAnimalField("currentWeight", cleanNumber(event.target.value, 2))}
                  placeholder="lb"
                />
              </label>

              <label>
                Last Weight Date
                <input
                  type="date"
                  value={animalForm.lastWeightDate}
                  onChange={(event) => updateAnimalField("lastWeightDate", event.target.value)}
                />
              </label>

              <label>
                Projected Processing Date
                <input
                  type="date"
                  value={animalForm.projectedProcessingDate}
                  onChange={(event) => updateAnimalField("projectedProcessingDate", event.target.value)}
                />
              </label>

              <label>
                Withdrawal Date
                <input
                  type="date"
                  value={animalForm.withdrawalDate}
                  onChange={(event) => updateAnimalField("withdrawalDate", event.target.value)}
                />
              </label>

              <label>
                Location / Pasture
                <input
                  value={animalForm.location}
                  onChange={(event) => updateAnimalField("location", event.target.value)}
                  placeholder="Pasture, pen, barn, etc."
                />
              </label>

              <label>
                Purchase Cost
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={animalForm.purchaseCost}
                  onChange={(event) => updateAnimalField("purchaseCost", event.target.value)}
                  onBlur={(event) => updateAnimalField("purchaseCost", cleanCurrency(event.target.value))}
                  placeholder="0.00"
                />
              </label>

              <label>
                Estimated Value
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={animalForm.estimatedValue}
                  onChange={(event) => updateAnimalField("estimatedValue", event.target.value)}
                  onBlur={(event) => updateAnimalField("estimatedValue", cleanCurrency(event.target.value))}
                  placeholder="0.00"
                />
              </label>

              <div className="livestockCalculatedField">
                <span>Current Cost Basis</span>
                <strong>{money(calculateAnimalCostBasis(animalForm))}</strong>
              </div>

              <label className="fullSpan">
                Notes
                <textarea
                  value={animalForm.notes}
                  onChange={(event) => updateAnimalField("notes", event.target.value)}
                  placeholder="Animal history, temperament, health notes, breeding notes, or processing plans..."
                />
              </label>

              <div className="fullSpan herdEditorActions">
                <button className="secondaryButton compactButton" type="button" onClick={startNewAnimal}>
                  Clear
                </button>

                <button className="primaryButton compactPrimary" type="submit">
                  <Save size={15} />
                  Save Animal
                </button>

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
          </div>
        ) : (
          <div className="workspacePanel compactPanel herdAnimalPanel">
            <div className="workspaceHeader compactPanelHeader">
              <div>
                <p className="eyebrow">Group / Lot Record</p>
                <h3>{selectedGroupId ? "Edit Group" : "Add Group"}</h3>
              </div>

              <button className="primaryButton compactPrimary" type="button" onClick={saveGroup}>
                <Save size={15} />
                Save Group
              </button>
            </div>

            <form className="formGrid compactFormGrid" onSubmit={saveGroup}>
              <label>
                Group / Lot Name
                <input
                  value={groupForm.name}
                  onChange={(event) => updateGroupField("name", event.target.value)}
                  placeholder="e.g., 2026 Feeder Steers"
                />
              </label>

              <label>
                Species
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
              </label>

              <label>
                Purpose
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
              </label>

              <label>
                Status
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
              </label>

              <label>
                Start Date
                <input
                  type="date"
                  value={groupForm.startDate}
                  onChange={(event) => updateGroupField("startDate", event.target.value)}
                />
              </label>

              <label>
                Projected Processing Date
                <input
                  type="date"
                  value={groupForm.projectedProcessingDate}
                  onChange={(event) => updateGroupField("projectedProcessingDate", event.target.value)}
                />
              </label>

              <label>
                Starting Count
                <input
                  type="number"
                  min="0"
                  step="1"
                  value={groupForm.startingCount}
                  onChange={(event) => updateGroupField("startingCount", event.target.value)}
                  onBlur={(event) => updateGroupField("startingCount", cleanWholeNumber(event.target.value))}
                  placeholder="e.g., 25"
                />
              </label>

              <label>
                Current Count
                <input
                  type="number"
                  min="0"
                  step="1"
                  value={groupForm.currentCount}
                  onChange={(event) => updateGroupField("currentCount", event.target.value)}
                  onBlur={(event) => updateGroupField("currentCount", cleanWholeNumber(event.target.value))}
                  placeholder="e.g., 25"
                />
              </label>

              <label>
                Location / Pasture
                <input
                  value={groupForm.location}
                  onChange={(event) => updateGroupField("location", event.target.value)}
                  placeholder="Pasture, pen, barn, etc."
                />
              </label>

              <label>
                Purchase Cost
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={groupForm.purchaseCost}
                  onChange={(event) => updateGroupField("purchaseCost", event.target.value)}
                  onBlur={(event) => updateGroupField("purchaseCost", cleanCurrency(event.target.value))}
                  placeholder="0.00"
                />
              </label>

              <label>
                Estimated Value
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={groupForm.estimatedValue}
                  onChange={(event) => updateGroupField("estimatedValue", event.target.value)}
                  onBlur={(event) => updateGroupField("estimatedValue", cleanCurrency(event.target.value))}
                  placeholder="0.00"
                />
              </label>

              <div className="livestockCalculatedField">
                <span>Current Cost Basis</span>
                <strong>{money(calculateGroupCostBasis(groupForm))}</strong>
              </div>

              <label className="fullSpan">
                Notes
                <textarea
                  value={groupForm.notes}
                  onChange={(event) => updateGroupField("notes", event.target.value)}
                  placeholder="Group feed plan, pasture notes, health notes, losses, or processing plans..."
                />
              </label>

              <div className="fullSpan herdEditorActions">
                <button className="secondaryButton compactButton" type="button" onClick={startNewGroup}>
                  Clear
                </button>

                <button className="primaryButton compactPrimary" type="submit">
                  <Save size={15} />
                  Save Group
                </button>

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
          </div>
        )}

        <div className="workspacePanel compactPanel herdTimelinePanel">
          <div className="workspaceHeader compactPanelHeader">
            <div>
              <p className="eyebrow">Timeline</p>
              <h3>
                {activeView === "animals"
                  ? selectedAnimal
                    ? getDisplayName(selectedAnimal)
                    : "Select an Animal"
                  : selectedGroup
                    ? selectedGroup.name || "Selected Group"
                    : "Select a Group"}
              </h3>
            </div>

            <div className="herdTimelineMiniMeta">
              {activeView === "animals" && selectedAnimal?.location ? (
                <span>
                  <MapPin size={13} />
                  {selectedAnimal.location}
                </span>
              ) : null}

              {activeView === "groups" && selectedGroup?.location ? (
                <span>
                  <MapPin size={13} />
                  {selectedGroup.location}
                </span>
              ) : null}
            </div>
          </div>

          {(activeView === "animals" && selectedAnimal) || (activeView === "groups" && selectedGroup) ? (
            <>
              <form
                className="formGrid compactFormGrid herdEventForm"
                onSubmit={activeView === "animals" ? saveAnimalEvent : saveGroupEvent}
              >
                <label>
                  Event Type
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
                </label>

                <label>
                  Date
                  <input
                    type="date"
                    value={eventForm.date}
                    onChange={(event) => updateEventField("date", event.target.value)}
                  />
                </label>

                <label>
                  Cost
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={eventForm.cost}
                    onChange={(event) => updateEventField("cost", event.target.value)}
                    onBlur={(event) => updateEventField("cost", cleanCurrency(event.target.value))}
                    placeholder="0.00"
                  />
                </label>

                {activeView === "animals" ? (
                  <label>
                    Weight
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={eventForm.weight}
                      onChange={(event) => updateEventField("weight", event.target.value)}
                      onBlur={(event) => updateEventField("weight", cleanNumber(event.target.value, 2))}
                      placeholder="lb"
                    />
                  </label>
                ) : null}

                {renderEventExtraFields()}

                <label className="fullSpan">
                  Description
                  <textarea
                    value={eventForm.description}
                    onChange={(event) => updateEventField("description", event.target.value)}
                    placeholder="Add feed notes, treatment details, weight notes, pasture movement, sale notes, or general history..."
                  />
                </label>

                <div className="fullSpan herdEventActions">
                  <button className="primaryButton compactPrimary" type="submit">
                    <Plus size={15} />
                    Add Event
                  </button>
                </div>
              </form>

              <div className="herdTimelineList">
                {currentTimeline.length ? (
                  currentTimeline.map((timelineEvent) => (
                    <div className="savedItem compactSavedItem herdTimelineItem" key={timelineEvent.id}>
                      <div>
                        <h4>{timelineEvent.type}</h4>
                        <p>
                          {timelineEvent.date ? formatDate(timelineEvent.date) : "No date"}
                          {timelineEvent.cost ? ` • Cost: ${money(timelineEvent.cost)}` : ""}
                          {timelineEvent.salePrice ? ` • Sale: ${money(timelineEvent.salePrice)}` : ""}
                          {timelineEvent.weight ? ` • ${timelineEvent.weight} lb` : ""}
                        </p>

                        {timelineEvent.medication || timelineEvent.dosage || timelineEvent.withdrawalDate ? (
                          <p>
                            {timelineEvent.medication ? `Medication: ${timelineEvent.medication}` : ""}
                            {timelineEvent.dosage ? ` • Dosage: ${timelineEvent.dosage}` : ""}
                            {timelineEvent.withdrawalDate
                              ? ` • Withdrawal: ${formatDate(timelineEvent.withdrawalDate)}`
                              : ""}
                          </p>
                        ) : null}

                        {timelineEvent.feedType || timelineEvent.quantity || timelineEvent.unit ? (
                          <p>
                            {timelineEvent.feedType ? `Feed: ${timelineEvent.feedType}` : ""}
                            {timelineEvent.quantity ? ` • Qty: ${timelineEvent.quantity}` : ""}
                            {timelineEvent.unit ? ` ${timelineEvent.unit}` : ""}
                          </p>
                        ) : null}

                        {timelineEvent.buyer ? <p>Buyer: {timelineEvent.buyer}</p> : null}
                        {timelineEvent.location ? <p>Location: {timelineEvent.location}</p> : null}
                        <p>{timelineEvent.description || "No description added."}</p>
                      </div>

                      <div className="itemActions">
                        <button
                          type="button"
                          onClick={() =>
                            activeView === "animals"
                              ? deleteAnimalEvent(timelineEvent.id)
                              : deleteGroupEvent(timelineEvent.id)
                          }
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="placeholderBox compactPlaceholder">
                    No timeline events yet. Add feed costs, weight checks, health treatments, pasture moves, sales, or notes.
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="placeholderBox compactPlaceholder">
              Select or save a record to begin tracking timeline events.
            </div>
          )}
        </div>
      </section>

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
