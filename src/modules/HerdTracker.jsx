import { useEffect, useMemo, useState } from "react";
import HerdTrackerGuideContent from "../components/HerdTrackerGuideContent.jsx";
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
  saveHerdAnimal,
} from "../services/herdService";

const emptyAnimal = {
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
  events: [],
};

const emptyEvent = {
  type: "General Note",
  date: new Date().toISOString().slice(0, 10),
  description: "",
  cost: "",
  weight: "",
};

const formatCurrency = (value) => {
  return Number(value || 0).toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
  });
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
  "Loss",
];

export default function HerdTracker() {
  const [animals, setAnimals] = useState([]);
  const [selectedAnimalId, setSelectedAnimalId] = useState("");
  const [animalForm, setAnimalForm] = useState(emptyAnimal);
  const [eventForm, setEventForm] = useState(emptyEvent);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [speciesFilter, setSpeciesFilter] = useState("All");
  const [showGuide, setShowGuide] = useState(false);

  useEffect(() => {
    setAnimals(getHerdAnimals());
  }, []);

  const selectedAnimal = useMemo(() => {
    return animals.find((animal) => animal.id === selectedAnimalId) || null;
  }, [animals, selectedAnimalId]);

  const stats = useMemo(() => {
    return calculateHerdStats(animals);
  }, [animals]);

  const filteredAnimals = useMemo(() => {
    return animals.filter((animal) => {
      const searchableText = [
        animal.tagId,
        animal.name,
        animal.species,
        animal.breed,
        animal.status,
        animal.source,
      ]
        .join(" ")
        .toLowerCase();

      const matchesSearch = searchableText.includes(searchTerm.toLowerCase());
      const matchesStatus = statusFilter === "All" || animal.status === statusFilter;
      const matchesSpecies = speciesFilter === "All" || animal.species === speciesFilter;

      return matchesSearch && matchesStatus && matchesSpecies;
    });
  }, [animals, searchTerm, statusFilter, speciesFilter]);

  const refreshAnimals = () => {
    setAnimals(getHerdAnimals());
  };

  const resetAnimalForm = () => {
    setAnimalForm(emptyAnimal);
    setSelectedAnimalId("");
  };

  const handleAnimalChange = (field, value) => {
    setAnimalForm((current) => ({
      ...current,
      [field]: value,
    }));
  };

  const handleEditAnimal = (animal) => {
    setSelectedAnimalId(animal.id);
    setAnimalForm({
      ...animal,
      purchaseCost: animal.purchaseCost || "",
      estimatedValue: animal.estimatedValue || "",
      accumulatedCosts: animal.accumulatedCosts || 0,
      events: animal.events || [],
    });
  };

  const handleSaveAnimal = (event) => {
    event.preventDefault();

    const savedAnimal = saveHerdAnimal({
      ...animalForm,
      id: selectedAnimalId || animalForm.id,
    });

    refreshAnimals();
    setSelectedAnimalId(savedAnimal.id);
    setAnimalForm({
      ...savedAnimal,
      purchaseCost: savedAnimal.purchaseCost || "",
      estimatedValue: savedAnimal.estimatedValue || "",
    });
  };

  const handleDeleteAnimal = (animalId) => {
    const confirmed = window.confirm("Delete this animal record?");
    if (!confirmed) return;

    deleteHerdAnimal(animalId);
    refreshAnimals();

    if (selectedAnimalId === animalId) {
      resetAnimalForm();
    }
  };

  const handleEventChange = (field, value) => {
    setEventForm((current) => ({
      ...current,
      [field]: value,
    }));
  };

  const handleAddEvent = (event) => {
    event.preventDefault();

    if (!selectedAnimalId) return;

    addHerdEvent(selectedAnimalId, eventForm);
    refreshAnimals();

    setEventForm({
      ...emptyEvent,
      date: new Date().toISOString().slice(0, 10),
    });
  };

  const handleRemoveEvent = (eventId) => {
    if (!selectedAnimalId) return;

    removeHerdEvent(selectedAnimalId, eventId);
    refreshAnimals();
  };

  const markForProcessing = (animal) => {
    const updatedAnimal = saveHerdAnimal({
      ...animal,
      status: "Processed",
    });

    refreshAnimals();
    setSelectedAnimalId(updatedAnimal.id);

    window.alert(
      "Animal marked as Processed. In the next step, Butcher Board will be able to create a processing batch from this animal."
    );
  };

  return (
    <div className="module-page herd-tracker-module">
      <section className="module-hero herd-hero">
        <div>
          <p className="module-kicker">Herd Management</p>
          <h1>Herd Tracker</h1>
          <p>
            Track animals from birth or purchase through care, costs, sale, or processing.
          </p>
        </div>

        <div className="module-hero-actions">
          <button type="button" className="secondary-button" onClick={() => setShowGuide(true)}>
            Guide
          </button>
          <button type="button" className="primary-button" onClick={resetAnimalForm}>
            Add Animal
          </button>
        </div>
      </section>

      <section className="stats-grid">
        <article className="stat-card">
          <span>Total Animals</span>
          <strong>{stats.totalAnimals}</strong>
        </article>

        <article className="stat-card">
          <span>Active</span>
          <strong>{stats.activeAnimals}</strong>
        </article>

        <article className="stat-card">
          <span>Book Value</span>
          <strong>{formatCurrency(stats.totalBookValue)}</strong>
        </article>

        <article className="stat-card">
          <span>Cost Basis</span>
          <strong>{formatCurrency(stats.totalCostBasis)}</strong>
        </article>
      </section>

      <section className="module-grid two-column-grid">
        <div className="module-card">
          <div className="section-header">
            <div>
              <h2>Animal Directory</h2>
              <p>Search and manage individual animal records.</p>
            </div>
          </div>

          <div className="filter-row">
            <input
              type="search"
              placeholder="Search tag, name, breed..."
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
            />

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

          <div className="responsive-table-wrapper">
            <table className="module-table">
              <thead>
                <tr>
                  <th>Animal</th>
                  <th>Species</th>
                  <th>Status</th>
                  <th>Cost Basis</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredAnimals.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="empty-table-message">
                      No animals found.
                    </td>
                  </tr>
                ) : (
                  filteredAnimals.map((animal) => (
                    <tr key={animal.id}>
                      <td>
                        <strong>{animal.tagId || "No Tag"}</strong>
                        <span>{animal.name || animal.breed || "Unnamed animal"}</span>
                      </td>
                      <td>{animal.species}</td>
                      <td>
                        <span className={`status-pill status-${animal.status.toLowerCase().replaceAll(" ", "-")}`}>
                          {animal.status}
                        </span>
                      </td>
                      <td>{formatCurrency(calculateAnimalCostBasis(animal))}</td>
                      <td>
                        <div className="table-action-row">
                          <button type="button" className="small-button" onClick={() => handleEditAnimal(animal)}>
                            Edit
                          </button>
                          <button type="button" className="small-button danger" onClick={() => handleDeleteAnimal(animal.id)}>
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="module-card">
          <div className="section-header">
            <div>
              <h2>{selectedAnimalId ? "Edit Animal" : "Add Animal"}</h2>
              <p>Create or update the animal lifecycle record.</p>
            </div>
          </div>

          <form className="stacked-form" onSubmit={handleSaveAnimal}>
            <div className="form-grid">
              <label>
                Tag ID
                <input
                  value={animalForm.tagId}
                  onChange={(event) => handleAnimalChange("tagId", event.target.value)}
                  placeholder="Example: 104"
                />
              </label>

              <label>
                Name
                <input
                  value={animalForm.name}
                  onChange={(event) => handleAnimalChange("name", event.target.value)}
                  placeholder="Optional"
                />
              </label>

              <label>
                Species
                <select
                  value={animalForm.species}
                  onChange={(event) => handleAnimalChange("species", event.target.value)}
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
                  onChange={(event) => handleAnimalChange("breed", event.target.value)}
                  placeholder="Example: Angus"
                />
              </label>

              <label>
                Sex
                <select value={animalForm.sex} onChange={(event) => handleAnimalChange("sex", event.target.value)}>
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
                  onChange={(event) => handleAnimalChange("source", event.target.value)}
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
                  onChange={(event) => handleAnimalChange("birthDate", event.target.value)}
                />
              </label>

              <label>
                Purchase Date
                <input
                  type="date"
                  value={animalForm.purchaseDate}
                  onChange={(event) => handleAnimalChange("purchaseDate", event.target.value)}
                />
              </label>

              <label>
                Purchase Cost
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={animalForm.purchaseCost}
                  onChange={(event) => handleAnimalChange("purchaseCost", event.target.value)}
                />
              </label>

              <label>
                Estimated Value
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={animalForm.estimatedValue}
                  onChange={(event) => handleAnimalChange("estimatedValue", event.target.value)}
                />
              </label>

              <label>
                Status
                <select
                  value={animalForm.status}
                  onChange={(event) => handleAnimalChange("status", event.target.value)}
                >
                  {HERD_STATUS_OPTIONS.map((status) => (
                    <option key={status} value={status}>
                      {status}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            <label>
              Notes
              <textarea
                value={animalForm.notes}
                onChange={(event) => handleAnimalChange("notes", event.target.value)}
                placeholder="Animal history, temperament, health notes, or processing plans..."
              />
            </label>

            <div className="form-actions">
              <button type="button" className="secondary-button" onClick={resetAnimalForm}>
                Clear
              </button>
              <button type="submit" className="primary-button">
                Save Animal
              </button>
            </div>
          </form>
        </div>
      </section>

      {selectedAnimal && (
        <section className="module-card">
          <div className="section-header">
            <div>
              <h2>Animal Timeline</h2>
              <p>
                {selectedAnimal.tagId || "Selected animal"} cost basis:{" "}
                <strong>{formatCurrency(calculateAnimalCostBasis(selectedAnimal))}</strong>
              </p>
            </div>

            <button type="button" className="secondary-button" onClick={() => markForProcessing(selectedAnimal)}>
              Mark for Butcher Board
            </button>
          </div>

          <form className="event-form" onSubmit={handleAddEvent}>
            <select value={eventForm.type} onChange={(event) => handleEventChange("type", event.target.value)}>
              {eventTypes.map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>

            <input
              type="date"
              value={eventForm.date}
              onChange={(event) => handleEventChange("date", event.target.value)}
            />

            <input
              type="number"
              min="0"
              step="0.01"
              placeholder="Cost"
              value={eventForm.cost}
              onChange={(event) => handleEventChange("cost", event.target.value)}
            />

            <input
              type="number"
              min="0"
              step="0.1"
              placeholder="Weight"
              value={eventForm.weight}
              onChange={(event) => handleEventChange("weight", event.target.value)}
            />

            <input
              placeholder="Description"
              value={eventForm.description}
              onChange={(event) => handleEventChange("description", event.target.value)}
            />

            <button type="submit" className="primary-button">
              Add Event
            </button>
          </form>

          <div className="timeline-list">
            {(selectedAnimal.events || []).length === 0 ? (
              <p className="empty-state">No timeline events yet.</p>
            ) : (
              selectedAnimal.events.map((event) => (
                <article key={event.id} className="timeline-item">
                  <div>
                    <strong>{event.type}</strong>
                    <span>{event.date}</span>
                    <p>{event.description || "No description added."}</p>
                    <small>
                      {event.cost ? `Cost: ${formatCurrency(event.cost)}` : "No cost"}{" "}
                      {event.weight ? `• Weight: ${event.weight} lb` : ""}
                    </small>
                  </div>

                  <button type="button" className="small-button danger" onClick={() => handleRemoveEvent(event.id)}>
                    Remove
                  </button>
                </article>
              ))
            )}
          </div>
        </section>
      )}

      {showGuide && (
        <div className="modal-backdrop" onClick={() => setShowGuide(false)}>
          <div className="guide-modal" onClick={(event) => event.stopPropagation()}>
            <div className="section-header">
              <div>
                <h2>Herd Tracker Guide</h2>
                <p>Use this module for live animal records before processing.</p>
              </div>

              <button type="button" className="small-button" onClick={() => setShowGuide(false)}>
                Close
              </button>
            </div>

            <HerdTrackerGuideContent />
          </div>
        </div>
      )}
    </div>
  );
}
