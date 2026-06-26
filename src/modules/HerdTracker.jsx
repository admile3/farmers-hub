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
  HERD_SOURCE_OPTIONS,
  HERD_SPECIES_OPTIONS,
  HERD_STATUS_OPTIONS,
  addHerdEvent,
  calculateAnimalCostBasis,
  calculateHerdStats,
  deleteHerdAnimal,
  getHerdAnimals,
  removeHerdEvent,
  saveHerdAnimal
} from "../services/herdService";

const blankAnimal = {
  tagId: "",
  name: "",
  species: "Cattle",
  breed: "",
  sex: "",
  birthDate: "",
  purchaseDate: "",
  source: "Born on Farm",
  purchaseCost: "",
  estimatedValue: "",
  accumulatedCosts: 0,
  status: "Active",
  notes: "",
  events: []
};

const blankEvent = {
  type: "General Note",
  date: new Date().toISOString().slice(0, 10),
  description: "",
  cost: "",
  weight: ""
};

const eventTypes = [
  "General Note",
  "Weight Check",
  "Feed Cost",
  "Vet Treatment",
  "Vaccine",
  "Breeding",
  "Birth",
  "Pasture Move",
  "Sale",
  "Processing Transfer",
  "Loss"
];

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

export default function HerdTracker() {
  const [animals, setAnimals] = useState([]);
  const [selectedAnimalId, setSelectedAnimalId] = useState("");
  const [animalForm, setAnimalForm] = useState(blankAnimal);
  const [eventForm, setEventForm] = useState(blankEvent);
  const [animalSearch, setAnimalSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [speciesFilter, setSpeciesFilter] = useState("All");
  const [showGuide, setShowGuide] = useState(false);
  const [statusMessage, setStatusMessage] = useState("");
  const [statusType, setStatusType] = useState("info");

  function showStatus(message, type = "info") {
    setStatusMessage(message);
    setStatusType(type);
  }

  function loadAnimals() {
    setAnimals(getHerdAnimals());
  }

  useEffect(() => {
    loadAnimals();
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

  const herdStats = useMemo(() => {
    return calculateHerdStats(animals);
  }, [animals]);

  const filteredAnimals = useMemo(() => {
    const search = animalSearch.trim().toLowerCase();

    return animals.filter((animal) => {
      const searchableText = [
        animal.tagId,
        animal.name,
        animal.species,
        animal.breed,
        animal.status,
        animal.source
      ]
        .join(" ")
        .toLowerCase();

      const matchesSearch = !search || searchableText.includes(search);
      const matchesStatus = statusFilter === "All" || animal.status === statusFilter;
      const matchesSpecies = speciesFilter === "All" || animal.species === speciesFilter;

      return matchesSearch && matchesStatus && matchesSpecies;
    });
  }, [animals, animalSearch, statusFilter, speciesFilter]);

  function startNewAnimal() {
    setSelectedAnimalId("");
    setAnimalForm(blankAnimal);
    setEventForm({
      ...blankEvent,
      date: new Date().toISOString().slice(0, 10)
    });
  }

  function editAnimal(animal) {
    setSelectedAnimalId(animal.id);
    setAnimalForm({
      ...blankAnimal,
      ...animal,
      purchaseCost: animal.purchaseCost || "",
      estimatedValue: animal.estimatedValue || "",
      accumulatedCosts: animal.accumulatedCosts || 0,
      events: animal.events || []
    });
  }

  function updateAnimalField(field, value) {
    setAnimalForm((current) => ({
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
      notes: animalForm.notes.trim()
    });

    loadAnimals();
    setSelectedAnimalId(savedAnimal.id);
    setAnimalForm({
      ...savedAnimal,
      purchaseCost: savedAnimal.purchaseCost || "",
      estimatedValue: savedAnimal.estimatedValue || ""
    });

    showStatus("Animal record saved.", "success");
  }

  function removeAnimal(animalId) {
    const confirmed = window.confirm("Delete this animal record? This cannot be undone.");
    if (!confirmed) return;

    deleteHerdAnimal(animalId);
    loadAnimals();

    if (selectedAnimalId === animalId) {
      startNewAnimal();
    }

    showStatus("Animal record deleted.", "success");
  }

  function updateEventField(field, value) {
    setEventForm((current) => ({
      ...current,
      [field]: value
    }));
  }

  function saveEvent(event) {
    event?.preventDefault?.();

    if (!selectedAnimalId) {
      showStatus("Save or select an animal before adding timeline events.", "error");
      return;
    }

    if (!eventForm.description.trim() && !eventForm.cost && !eventForm.weight) {
      showStatus("Add a note, cost, or weight before saving this event.", "error");
      return;
    }

    const updatedAnimal = addHerdEvent(selectedAnimalId, {
      ...eventForm,
      description: eventForm.description.trim(),
      cost: cleanCurrency(eventForm.cost),
      weight: cleanNumber(eventForm.weight, 2)
    });

    loadAnimals();

    if (updatedAnimal) {
      setAnimalForm({
        ...updatedAnimal,
        purchaseCost: updatedAnimal.purchaseCost || "",
        estimatedValue: updatedAnimal.estimatedValue || ""
      });
    }

    setEventForm({
      ...blankEvent,
      date: new Date().toISOString().slice(0, 10)
    });

    showStatus("Timeline event added.", "success");
  }

  function deleteEvent(eventId) {
    if (!selectedAnimalId) return;

    const updatedAnimal = removeHerdEvent(selectedAnimalId, eventId);
    loadAnimals();

    if (updatedAnimal) {
      setAnimalForm({
        ...updatedAnimal,
        purchaseCost: updatedAnimal.purchaseCost || "",
        estimatedValue: updatedAnimal.estimatedValue || ""
      });
    }

    showStatus("Timeline event removed.", "success");
  }

  function markForProcessing(animal) {
    const updatedAnimal = saveHerdAnimal({
      ...animal,
      status: "Processed"
    });

    loadAnimals();
    setSelectedAnimalId(updatedAnimal.id);
    setAnimalForm({
      ...updatedAnimal,
      purchaseCost: updatedAnimal.purchaseCost || "",
      estimatedValue: updatedAnimal.estimatedValue || ""
    });

    showStatus("Animal marked for Butcher Board.", "success");
  }

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
        title="Track animals from birth or purchase through care, costs, sale, or processing."
        description="Create individual animal records, log timeline events, monitor cost basis, and prepare animals for future processing in Butcher Board."
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
          }
        ]}
      />

      <section className="hubStatGrid herdStatGrid">
        <StatCard
          icon={Beef}
          label="Total Animals"
          value={herdStats.totalAnimals}
          sub="records tracked"
          accent="herd"
        />

        <StatCard
          icon={ClipboardList}
          label="Active Animals"
          value={herdStats.activeAnimals}
          sub="currently active"
          accent="livestock"
        />

        <StatCard
          icon={DollarSign}
          label="Book Value"
          value={money(herdStats.totalBookValue)}
          sub="estimated value"
          accent="pricing"
        />

        <StatCard
          icon={History}
          label="Cost Basis"
          value={money(herdStats.totalCostBasis)}
          sub="purchase + events"
          accent="market"
        />
      </section>

      <section className="workspacePanel compactPanel herdDirectoryPanel">
        <div className="workspaceHeader compactPanelHeader">
          <div>
            <p className="eyebrow">Animal Directory</p>
            <h3>Saved Animals</h3>
          </div>

          <button className="primaryButton compactPrimary" type="button" onClick={startNewAnimal}>
            <Plus size={15} />
            Add Animal
          </button>
        </div>

        <div className="inventoryToolbar herdToolbar">
          <div className="searchBox compactSearch">
            <Search size={17} />
            <input
              value={animalSearch}
              onChange={(event) => setAnimalSearch(event.target.value)}
              placeholder="Search tag, name, breed..."
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

        <div className="savedList compactSavedList herdSavedList">
          {filteredAnimals.length ? (
            filteredAnimals.map((animal) => (
              <div className="savedItem compactSavedItem herdSavedItem" key={animal.id}>
                <div>
                  <h4>{animal.tagId || animal.name || "Unnamed Animal"}</h4>
                  <p>
                    {animal.species}
                    {animal.breed ? ` • ${animal.breed}` : ""}
                    {animal.status ? ` • ${animal.status}` : ""}
                    {animal.source ? ` • ${animal.source}` : ""}
                  </p>
                  <p>
                    Cost basis: {money(calculateAnimalCostBasis(animal))}
                    {animal.estimatedValue ? ` • Est. value: ${money(animal.estimatedValue)}` : ""}
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
              No animal records found. Use Add Animal to start your herd records.
            </div>
          )}
        </div>
      </section>

      <section className="herdWorkspaceGrid compactWorkspace">
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
          </form>
        </div>

        <div className="workspacePanel compactPanel herdTimelinePanel">
          <div className="workspaceHeader compactPanelHeader">
            <div>
              <p className="eyebrow">Animal Timeline</p>
              <h3>{selectedAnimal ? selectedAnimal.tagId || selectedAnimal.name || "Selected Animal" : "Select an Animal"}</h3>
            </div>

            {selectedAnimal ? (
              <button
                className="secondaryButton compactButton"
                type="button"
                onClick={() => markForProcessing(selectedAnimal)}
              >
                <CalendarDays size={15} />
                Mark for Butcher Board
              </button>
            ) : null}
          </div>

          {selectedAnimal ? (
            <>
              <form className="formGrid compactFormGrid herdEventForm" onSubmit={saveEvent}>
                <label>
                  Event Type
                  <select
                    value={eventForm.type}
                    onChange={(event) => updateEventField("type", event.target.value)}
                  >
                    {eventTypes.map((type) => (
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

                <label className="fullSpan">
                  Description
                  <textarea
                    value={eventForm.description}
                    onChange={(event) => updateEventField("description", event.target.value)}
                    placeholder="Add feed cost notes, vet details, weight check notes, pasture move notes, or sale notes..."
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
                {(selectedAnimal.events || []).length ? (
                  selectedAnimal.events.map((timelineEvent) => (
                    <div className="savedItem compactSavedItem herdTimelineItem" key={timelineEvent.id}>
                      <div>
                        <h4>{timelineEvent.type}</h4>
                        <p>
                          {timelineEvent.date || "No date"}
                          {timelineEvent.cost ? ` • ${money(timelineEvent.cost)}` : ""}
                          {timelineEvent.weight ? ` • ${timelineEvent.weight} lb` : ""}
                        </p>
                        <p>{timelineEvent.description || "No description added."}</p>
                      </div>

                      <div className="itemActions">
                        <button type="button" onClick={() => deleteEvent(timelineEvent.id)}>
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="placeholderBox compactPlaceholder">
                    No timeline events yet. Add weight checks, feed costs, vet events, or notes.
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="placeholderBox compactPlaceholder">
              Select an animal from the directory or save a new animal to begin tracking timeline events.
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
