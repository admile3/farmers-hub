const HERD_STORAGE_KEY = "farmersHub_herdAnimals";

export const HERD_STATUS_OPTIONS = [
  "Active",
  "Sold Live",
  "Processed",
  "Culled",
  "Deceased",
];

export const HERD_SOURCE_OPTIONS = [
  "Born on Farm",
  "Purchased",
  "Transferred In",
];

export const HERD_SPECIES_OPTIONS = [
  "Cattle",
  "Hogs",
  "Sheep",
  "Goats",
  "Poultry",
  "Other",
];

const getNow = () => new Date().toISOString();

const createId = () => {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID();
  }

  return `herd_${Date.now()}_${Math.random().toString(36).slice(2)}`;
};

const readStorage = () => {
  try {
    const raw = localStorage.getItem(HERD_STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
};

const writeStorage = (animals) => {
  localStorage.setItem(HERD_STORAGE_KEY, JSON.stringify(animals));
};

export const getHerdAnimals = () => {
  return readStorage();
};

export const saveHerdAnimal = (animal) => {
  const animals = readStorage();
  const now = getNow();

  const normalizedAnimal = {
    id: animal.id || createId(),
    tagId: animal.tagId || "",
    name: animal.name || "",
    species: animal.species || "Cattle",
    breed: animal.breed || "",
    sex: animal.sex || "",
    birthDate: animal.birthDate || "",
    purchaseDate: animal.purchaseDate || "",
    source: animal.source || "Born on Farm",
    purchaseCost: Number(animal.purchaseCost || 0),
    estimatedValue: Number(animal.estimatedValue || 0),
    accumulatedCosts: Number(animal.accumulatedCosts || 0),
    status: animal.status || "Active",
    notes: animal.notes || "",
    events: Array.isArray(animal.events) ? animal.events : [],
    createdAt: animal.createdAt || now,
    updatedAt: now,
  };

  const existingIndex = animals.findIndex((item) => item.id === normalizedAnimal.id);

  if (existingIndex >= 0) {
    animals[existingIndex] = normalizedAnimal;
  } else {
    animals.unshift(normalizedAnimal);
  }

  writeStorage(animals);
  return normalizedAnimal;
};

export const deleteHerdAnimal = (animalId) => {
  const animals = readStorage().filter((animal) => animal.id !== animalId);
  writeStorage(animals);
  return animals;
};

export const addHerdEvent = (animalId, event) => {
  const animals = readStorage();
  const now = getNow();

  const updatedAnimals = animals.map((animal) => {
    if (animal.id !== animalId) return animal;

    const newEvent = {
      id: createId(),
      type: event.type || "General Note",
      date: event.date || new Date().toISOString().slice(0, 10),
      description: event.description || "",
      cost: Number(event.cost || 0),
      weight: event.weight ? Number(event.weight) : "",
      createdAt: now,
    };

    const events = [newEvent, ...(animal.events || [])];
    const addedCost = Number(newEvent.cost || 0);

    return {
      ...animal,
      events,
      accumulatedCosts: Number(animal.accumulatedCosts || 0) + addedCost,
      updatedAt: now,
    };
  });

  writeStorage(updatedAnimals);
  return updatedAnimals.find((animal) => animal.id === animalId);
};

export const removeHerdEvent = (animalId, eventId) => {
  const animals = readStorage();

  const updatedAnimals = animals.map((animal) => {
    if (animal.id !== animalId) return animal;

    const removedEvent = (animal.events || []).find((event) => event.id === eventId);
    const removedCost = Number(removedEvent?.cost || 0);

    return {
      ...animal,
      events: (animal.events || []).filter((event) => event.id !== eventId),
      accumulatedCosts: Math.max(0, Number(animal.accumulatedCosts || 0) - removedCost),
      updatedAt: getNow(),
    };
  });

  writeStorage(updatedAnimals);
  return updatedAnimals.find((animal) => animal.id === animalId);
};

export const calculateAnimalCostBasis = (animal) => {
  return Number(animal.purchaseCost || 0) + Number(animal.accumulatedCosts || 0);
};

export const calculateHerdStats = (animals) => {
  const activeAnimals = animals.filter((animal) => animal.status === "Active");
  const processedAnimals = animals.filter((animal) => animal.status === "Processed");
  const soldAnimals = animals.filter((animal) => animal.status === "Sold Live");

  const totalBookValue = animals.reduce((sum, animal) => {
    return sum + Number(animal.estimatedValue || 0);
  }, 0);

  const totalCostBasis = animals.reduce((sum, animal) => {
    return sum + calculateAnimalCostBasis(animal);
  }, 0);

  return {
    totalAnimals: animals.length,
    activeAnimals: activeAnimals.length,
    processedAnimals: processedAnimals.length,
    soldAnimals: soldAnimals.length,
    totalBookValue,
    totalCostBasis,
  };
};
