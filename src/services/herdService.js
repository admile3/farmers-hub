const HERD_ANIMALS_STORAGE_KEY = "farmersHub_herdAnimals";
const HERD_GROUPS_STORAGE_KEY = "farmersHub_herdGroups";

export const HERD_STATUS_OPTIONS = [
  "Active",
  "Ready for Processing",
  "Processed",
  "Sold Live",
  "Culled",
  "Deceased",
  "Archived"
];

export const HERD_SOURCE_OPTIONS = [
  "Born on Farm",
  "Purchased",
  "Transferred In"
];

export const HERD_SPECIES_OPTIONS = [
  "Cattle",
  "Hogs",
  "Sheep",
  "Goats",
  "Poultry",
  "Rabbits",
  "Other"
];

export const HERD_PURPOSE_OPTIONS = [
  "Breeding",
  "Feeder",
  "Meat",
  "Dairy",
  "Egg Layer",
  "Fiber",
  "Replacement",
  "Other"
];

export const HERD_TAG_TYPE_OPTIONS = [
  "Ear Tag",
  "RFID",
  "Tattoo",
  "Band",
  "Visual ID",
  "Other"
];

export const HERD_EVENT_TYPES = [
  "General Note",
  "Weight Check",
  "Feed Cost",
  "Health Treatment",
  "Vaccine",
  "Breeding",
  "Birth",
  "Pasture Move",
  "Sale",
  "Processing Transfer",
  "Loss"
];

export const HERD_PARENT_TYPES = {
  DAM: "dam",
  SIRE: "sire"
};

const getNow = () => new Date().toISOString();

const createId = (prefix = "herd") => {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID();
  }

  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2)}`;
};

const readStorage = (key) => {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
};

const writeStorage = (key, records) => {
  localStorage.setItem(key, JSON.stringify(records));
};

const toNumber = (value) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
};

const normalizeEvent = (event = {}) => ({
  id: event.id || createId("event"),
  type: event.type || "General Note",
  date: event.date || new Date().toISOString().slice(0, 10),
  description: event.description || "",
  cost: toNumber(event.cost),
  weight: event.weight === "" || event.weight === null || event.weight === undefined ? "" : toNumber(event.weight),
  medication: event.medication || "",
  dosage: event.dosage || "",
  reason: event.reason || "",
  withdrawalDate: event.withdrawalDate || "",
  feedType: event.feedType || "",
  quantity: event.quantity || "",
  unit: event.unit || "",
  location: event.location || "",
  buyer: event.buyer || "",
  salePrice: toNumber(event.salePrice),
  createdAt: event.createdAt || getNow()
});

const normalizeExternalParent = (parent = {}) => ({
  name: parent.name || "",
  registrationNumber: parent.registrationNumber || "",
  tattooId: parent.tattooId || "",
  breed: parent.breed || "",
  notes: parent.notes || ""
});

const normalizePedigree = (animal = {}) => ({
  dam: {
    animalId: animal.pedigree?.dam?.animalId || animal.damId || "",
    external: normalizeExternalParent({
      name: animal.pedigree?.dam?.external?.name || animal.damName || "",
      registrationNumber:
        animal.pedigree?.dam?.external?.registrationNumber || animal.damRegistrationNumber || "",
      tattooId: animal.pedigree?.dam?.external?.tattooId || animal.damTattooId || "",
      breed: animal.pedigree?.dam?.external?.breed || animal.damBreed || "",
      notes: animal.pedigree?.dam?.external?.notes || animal.damNotes || ""
    })
  },
  sire: {
    animalId: animal.pedigree?.sire?.animalId || animal.sireId || "",
    external: normalizeExternalParent({
      name: animal.pedigree?.sire?.external?.name || animal.sireName || "",
      registrationNumber:
        animal.pedigree?.sire?.external?.registrationNumber || animal.sireRegistrationNumber || "",
      tattooId: animal.pedigree?.sire?.external?.tattooId || animal.sireTattooId || "",
      breed: animal.pedigree?.sire?.external?.breed || animal.sireBreed || "",
      notes: animal.pedigree?.sire?.external?.notes || animal.sireNotes || ""
    })
  },
  notes: animal.pedigree?.notes || animal.geneticsNotes || ""
});

const normalizeAnimal = (animal = {}) => {
  const pedigree = normalizePedigree(animal);

  return {
  id: animal.id || createId("animal"),
  tagId: animal.tagId || "",
  tagType: animal.tagType || "Ear Tag",
  name: animal.name || "",
  species: animal.species || "Cattle",
  breed: animal.breed || "",
  registrationNumber: animal.registrationNumber || "",
  tattooId: animal.tattooId || "",
  breederName: animal.breederName || "",
  bloodline: animal.bloodline || "",
  sex: animal.sex || "",
  purpose: animal.purpose || "Meat",
  groupId: animal.groupId || "",
  damId: pedigree.dam.animalId,
  damName: pedigree.dam.external.name,
  damRegistrationNumber: pedigree.dam.external.registrationNumber,
  damTattooId: pedigree.dam.external.tattooId,
  damBreed: pedigree.dam.external.breed,
  damNotes: pedigree.dam.external.notes,
  sireId: pedigree.sire.animalId,
  sireName: pedigree.sire.external.name,
  sireRegistrationNumber: pedigree.sire.external.registrationNumber,
  sireTattooId: pedigree.sire.external.tattooId,
  sireBreed: pedigree.sire.external.breed,
  sireNotes: pedigree.sire.external.notes,
  geneticsNotes: pedigree.notes,
  pedigree,
  birthDate: animal.birthDate || "",
  purchaseDate: animal.purchaseDate || "",
  source: animal.source || "Born on Farm",
  acquisitionWeight: animal.acquisitionWeight || "",
  currentWeight: animal.currentWeight || "",
  lastWeightDate: animal.lastWeightDate || "",
  projectedProcessingDate: animal.projectedProcessingDate || "",
  withdrawalDate: animal.withdrawalDate || "",
  location: animal.location || "",
  purchaseCost: toNumber(animal.purchaseCost),
  estimatedValue: toNumber(animal.estimatedValue),
  accumulatedCosts: toNumber(animal.accumulatedCosts),
  status: animal.status || "Active",
  notes: animal.notes || "",
  events: Array.isArray(animal.events) ? animal.events.map(normalizeEvent) : [],
  createdAt: animal.createdAt || getNow(),
  updatedAt: animal.updatedAt || getNow()
};
};

const normalizeGroup = (group = {}) => ({
  id: group.id || createId("group"),
  name: group.name || "",
  species: group.species || "Cattle",
  purpose: group.purpose || "Meat",
  status: group.status || "Active",
  startDate: group.startDate || "",
  projectedProcessingDate: group.projectedProcessingDate || "",
  location: group.location || "",
  startingCount: group.startingCount || "",
  currentCount: group.currentCount || "",
  purchaseCost: toNumber(group.purchaseCost),
  estimatedValue: toNumber(group.estimatedValue),
  accumulatedCosts: toNumber(group.accumulatedCosts),
  notes: group.notes || "",
  events: Array.isArray(group.events) ? group.events.map(normalizeEvent) : [],
  createdAt: group.createdAt || getNow(),
  updatedAt: group.updatedAt || getNow()
});

export const getHerdAnimals = () => {
  return readStorage(HERD_ANIMALS_STORAGE_KEY).map(normalizeAnimal);
};

export const getHerdGroups = () => {
  return readStorage(HERD_GROUPS_STORAGE_KEY).map(normalizeGroup);
};

export const saveHerdAnimal = (animal) => {
  const animals = getHerdAnimals();
  const normalizedAnimal = normalizeAnimal({
    ...animal,
    updatedAt: getNow()
  });

  const existingIndex = animals.findIndex((item) => item.id === normalizedAnimal.id);

  if (existingIndex >= 0) {
    animals[existingIndex] = normalizedAnimal;
  } else {
    animals.unshift(normalizedAnimal);
  }

  writeStorage(HERD_ANIMALS_STORAGE_KEY, animals);
  return normalizedAnimal;
};

export const saveHerdGroup = (group) => {
  const groups = getHerdGroups();
  const normalizedGroup = normalizeGroup({
    ...group,
    updatedAt: getNow()
  });

  const existingIndex = groups.findIndex((item) => item.id === normalizedGroup.id);

  if (existingIndex >= 0) {
    groups[existingIndex] = normalizedGroup;
  } else {
    groups.unshift(normalizedGroup);
  }

  writeStorage(HERD_GROUPS_STORAGE_KEY, groups);
  return normalizedGroup;
};

export const deleteHerdAnimal = (animalId) => {
  const animals = getHerdAnimals().filter((animal) => animal.id !== animalId);
  writeStorage(HERD_ANIMALS_STORAGE_KEY, animals);
  return animals;
};

export const deleteHerdGroup = (groupId) => {
  const groups = getHerdGroups().filter((group) => group.id !== groupId);
  writeStorage(HERD_GROUPS_STORAGE_KEY, groups);

  const animals = getHerdAnimals().map((animal) => {
    if (animal.groupId !== groupId) return animal;
    return {
      ...animal,
      groupId: "",
      updatedAt: getNow()
    };
  });

  writeStorage(HERD_ANIMALS_STORAGE_KEY, animals);
  return groups;
};

export const addHerdEvent = (animalId, event) => {
  const animals = getHerdAnimals();
  const newEvent = normalizeEvent(event);

  const updatedAnimals = animals.map((animal) => {
    if (animal.id !== animalId) return animal;

    const nextAnimal = {
      ...animal,
      events: [newEvent, ...(animal.events || [])],
      accumulatedCosts: toNumber(animal.accumulatedCosts) + toNumber(newEvent.cost),
      updatedAt: getNow()
    };

    if (newEvent.type === "Weight Check" && newEvent.weight) {
      nextAnimal.currentWeight = String(newEvent.weight);
      nextAnimal.lastWeightDate = newEvent.date;
    }

    if (newEvent.withdrawalDate) {
      nextAnimal.withdrawalDate = newEvent.withdrawalDate;
    }

    if (newEvent.type === "Sale") {
      nextAnimal.status = "Sold Live";
      nextAnimal.estimatedValue = toNumber(newEvent.salePrice);
    }

    return nextAnimal;
  });

  writeStorage(HERD_ANIMALS_STORAGE_KEY, updatedAnimals);
  return updatedAnimals.find((animal) => animal.id === animalId);
};

export const addHerdGroupEvent = (groupId, event) => {
  const groups = getHerdGroups();
  const newEvent = normalizeEvent(event);

  const updatedGroups = groups.map((group) => {
    if (group.id !== groupId) return group;

    const nextGroup = {
      ...group,
      events: [newEvent, ...(group.events || [])],
      accumulatedCosts: toNumber(group.accumulatedCosts) + toNumber(newEvent.cost),
      updatedAt: getNow()
    };

    if (newEvent.withdrawalDate) {
      nextGroup.withdrawalDate = newEvent.withdrawalDate;
    }

    if (newEvent.type === "Sale") {
      nextGroup.status = "Sold Live";
      nextGroup.estimatedValue = toNumber(newEvent.salePrice);
    }

    return nextGroup;
  });

  writeStorage(HERD_GROUPS_STORAGE_KEY, updatedGroups);
  return updatedGroups.find((group) => group.id === groupId);
};

export const removeHerdEvent = (animalId, eventId) => {
  const animals = getHerdAnimals();

  const updatedAnimals = animals.map((animal) => {
    if (animal.id !== animalId) return animal;

    const removedEvent = (animal.events || []).find((event) => event.id === eventId);
    const removedCost = toNumber(removedEvent?.cost);

    return {
      ...animal,
      events: (animal.events || []).filter((event) => event.id !== eventId),
      accumulatedCosts: Math.max(0, toNumber(animal.accumulatedCosts) - removedCost),
      updatedAt: getNow()
    };
  });

  writeStorage(HERD_ANIMALS_STORAGE_KEY, updatedAnimals);
  return updatedAnimals.find((animal) => animal.id === animalId);
};

export const removeHerdGroupEvent = (groupId, eventId) => {
  const groups = getHerdGroups();

  const updatedGroups = groups.map((group) => {
    if (group.id !== groupId) return group;

    const removedEvent = (group.events || []).find((event) => event.id === eventId);
    const removedCost = toNumber(removedEvent?.cost);

    return {
      ...group,
      events: (group.events || []).filter((event) => event.id !== eventId),
      accumulatedCosts: Math.max(0, toNumber(group.accumulatedCosts) - removedCost),
      updatedAt: getNow()
    };
  });

  writeStorage(HERD_GROUPS_STORAGE_KEY, updatedGroups);
  return updatedGroups.find((group) => group.id === groupId);
};

export const calculateAnimalCostBasis = (animal) => {
  return toNumber(animal.purchaseCost) + toNumber(animal.accumulatedCosts);
};

export const calculateGroupCostBasis = (group) => {
  return toNumber(group.purchaseCost) + toNumber(group.accumulatedCosts);
};

export const calculateHerdStats = (animals = [], groups = []) => {
  const activeAnimals = animals.filter((animal) => animal.status === "Active");
  const readyAnimals = animals.filter((animal) => animal.status === "Ready for Processing");
  const activeGroups = groups.filter((group) => group.status === "Active");
  const readyGroups = groups.filter((group) => group.status === "Ready for Processing");

  const totalBookValue =
    animals.reduce((sum, animal) => sum + toNumber(animal.estimatedValue), 0) +
    groups.reduce((sum, group) => sum + toNumber(group.estimatedValue), 0);

  const totalCostBasis =
    animals.reduce((sum, animal) => sum + calculateAnimalCostBasis(animal), 0) +
    groups.reduce((sum, group) => sum + calculateGroupCostBasis(group), 0);

  return {
    totalAnimals: animals.length,
    totalGroups: groups.length,
    activeAnimals: activeAnimals.length,
    activeGroups: activeGroups.length,
    readyForProcessing: readyAnimals.length + readyGroups.length,
    totalBookValue,
    totalCostBasis
  };
};

export const getParentAnimalId = (animal, parentType) => {
  if (!animal) return "";
  if (parentType === HERD_PARENT_TYPES.DAM) return animal.pedigree?.dam?.animalId || animal.damId || "";
  if (parentType === HERD_PARENT_TYPES.SIRE) return animal.pedigree?.sire?.animalId || animal.sireId || "";
  return "";
};

export const getAnimalOffspring = (animalId, animals = getHerdAnimals()) => {
  if (!animalId) return [];

  return animals.filter((animal) =>
    getParentAnimalId(animal, HERD_PARENT_TYPES.DAM) === animalId ||
    getParentAnimalId(animal, HERD_PARENT_TYPES.SIRE) === animalId
  );
};

export const getAnimalDescendantIds = (animalId, animals = getHerdAnimals()) => {
  const descendants = new Set();
  const queue = [animalId];

  while (queue.length) {
    const currentId = queue.shift();
    const children = getAnimalOffspring(currentId, animals);

    children.forEach((child) => {
      if (!descendants.has(child.id)) {
        descendants.add(child.id);
        queue.push(child.id);
      }
    });
  }

  return Array.from(descendants);
};

export const wouldCreateCircularPedigree = (animals = getHerdAnimals(), animalId, proposedParentId) => {
  if (!animalId || !proposedParentId) return false;
  if (animalId === proposedParentId) return true;

  return getAnimalDescendantIds(animalId, animals).includes(proposedParentId);
};

export const getPedigreeTree = (animalId, animals = getHerdAnimals(), generations = 3) => {
  const animal = animals.find((item) => item.id === animalId);
  if (!animal || generations <= 0) return null;

  const damId = getParentAnimalId(animal, HERD_PARENT_TYPES.DAM);
  const sireId = getParentAnimalId(animal, HERD_PARENT_TYPES.SIRE);

  return {
    animal,
    dam: damId ? getPedigreeTree(damId, animals, generations - 1) : null,
    sire: sireId ? getPedigreeTree(sireId, animals, generations - 1) : null
  };
};

export const getReadyForProcessingRecords = () => {
  return {
    animals: getHerdAnimals().filter((animal) => animal.status === "Ready for Processing"),
    groups: getHerdGroups().filter((group) => group.status === "Ready for Processing")
  };
};
