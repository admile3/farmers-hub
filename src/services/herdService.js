const HERD_ANIMALS_STORAGE_KEY = "farmersHub_herdAnimals";
const HERD_GROUPS_STORAGE_KEY = "farmersHub_herdGroups";
const HERD_INPUT_COSTS_STORAGE_KEY = "farmersHub_herdInputCosts";

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

export const HERD_INPUT_COST_CATEGORIES = [
  "Feed",
  "Bedding",
  "Mineral / Supplement",
  "Veterinary",
  "Medication",
  "Processing",
  "Transport",
  "Labor",
  "Equipment",
  "Breeding",
  "Other"
];

export const HERD_INPUT_COST_UNITS = [
  "lb",
  "ton",
  "bag",
  "bale",
  "bushel",
  "gallon",
  "quart",
  "dose",
  "hour",
  "each",
  "other"
];

export const HERD_ALLOCATION_TARGET_TYPES = {
  ANIMAL: "animal",
  GROUP: "group"
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


const normalizeInputAllocation = (allocation = {}) => ({
  id: allocation.id || createId("allocation"),
  targetType: allocation.targetType || HERD_ALLOCATION_TARGET_TYPES.GROUP,
  targetId: allocation.targetId || "",
  amount: toNumber(allocation.amount),
  quantityUsed:
    allocation.quantityUsed === "" ||
    allocation.quantityUsed === null ||
    allocation.quantityUsed === undefined
      ? ""
      : toNumber(allocation.quantityUsed),
  allocationDate: allocation.allocationDate || new Date().toISOString().slice(0, 10),
  notes: allocation.notes || "",
  createdAt: allocation.createdAt || getNow()
});

const normalizeInputCost = (inputCost = {}) => ({
  id: inputCost.id || createId("inputCost"),
  name: inputCost.name || "",
  category: inputCost.category || "Feed",
  vendor: inputCost.vendor || "",
  purchaseDate: inputCost.purchaseDate || new Date().toISOString().slice(0, 10),
  totalCost: toNumber(inputCost.totalCost),
  quantity:
    inputCost.quantity === "" ||
    inputCost.quantity === null ||
    inputCost.quantity === undefined
      ? ""
      : toNumber(inputCost.quantity),
  unit: inputCost.unit || "lb",
  notes: inputCost.notes || "",
  allocations: Array.isArray(inputCost.allocations)
    ? inputCost.allocations.map(normalizeInputAllocation)
    : [],
  createdAt: inputCost.createdAt || getNow(),
  updatedAt: inputCost.updatedAt || getNow()
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

export const getHerdInputCosts = () => {
  return readStorage(HERD_INPUT_COSTS_STORAGE_KEY).map(normalizeInputCost);
};

export const saveHerdInputCost = (inputCost) => {
  const inputCosts = getHerdInputCosts();
  const normalizedInputCost = normalizeInputCost({
    ...inputCost,
    updatedAt: getNow()
  });

  const existingIndex = inputCosts.findIndex((item) => item.id === normalizedInputCost.id);

  if (existingIndex >= 0) {
    inputCosts[existingIndex] = normalizedInputCost;
  } else {
    inputCosts.unshift(normalizedInputCost);
  }

  writeStorage(HERD_INPUT_COSTS_STORAGE_KEY, inputCosts);
  return normalizedInputCost;
};

export const deleteHerdInputCost = (inputCostId) => {
  const inputCosts = getHerdInputCosts().filter((inputCost) => inputCost.id !== inputCostId);
  writeStorage(HERD_INPUT_COSTS_STORAGE_KEY, inputCosts);
  return inputCosts;
};

export const addHerdInputAllocation = (inputCostId, allocation) => {
  const inputCosts = getHerdInputCosts();
  const newAllocation = normalizeInputAllocation(allocation);

  const updatedInputCosts = inputCosts.map((inputCost) => {
    if (inputCost.id !== inputCostId) return inputCost;

    return {
      ...inputCost,
      allocations: [newAllocation, ...(inputCost.allocations || [])],
      updatedAt: getNow()
    };
  });

  writeStorage(HERD_INPUT_COSTS_STORAGE_KEY, updatedInputCosts);
  return updatedInputCosts.find((inputCost) => inputCost.id === inputCostId);
};

export const removeHerdInputAllocation = (inputCostId, allocationId) => {
  const inputCosts = getHerdInputCosts();

  const updatedInputCosts = inputCosts.map((inputCost) => {
    if (inputCost.id !== inputCostId) return inputCost;

    return {
      ...inputCost,
      allocations: (inputCost.allocations || []).filter(
        (allocation) => allocation.id !== allocationId
      ),
      updatedAt: getNow()
    };
  });

  writeStorage(HERD_INPUT_COSTS_STORAGE_KEY, updatedInputCosts);
  return updatedInputCosts.find((inputCost) => inputCost.id === inputCostId);
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

export const calculateInputCostAllocatedAmount = (inputCost) => {
  return (inputCost?.allocations || []).reduce(
    (sum, allocation) => sum + toNumber(allocation.amount),
    0
  );
};

export const calculateInputCostRemainingAmount = (inputCost) => {
  return toNumber(inputCost?.totalCost) - calculateInputCostAllocatedAmount(inputCost);
};

export const calculateInputCostUnitCost = (inputCost) => {
  const quantity = toNumber(inputCost?.quantity);
  if (!quantity) return 0;

  return toNumber(inputCost?.totalCost) / quantity;
};

export const getInputCostAllocationStatus = (inputCost) => {
  const totalCost = toNumber(inputCost?.totalCost);
  const allocatedAmount = calculateInputCostAllocatedAmount(inputCost);
  const remainingAmount = totalCost - allocatedAmount;

  if (!allocatedAmount) return "Unallocated";
  if (remainingAmount < 0) return "Overallocated";
  if (remainingAmount === 0) return "Fully Allocated";
  return "Partially Allocated";
};

export const calculateAllocatedCostForTarget = (
  targetType,
  targetId,
  inputCosts = getHerdInputCosts()
) => {
  if (!targetType || !targetId) return 0;

  return inputCosts.reduce((sum, inputCost) => {
    const allocatedToTarget = (inputCost.allocations || []).reduce((allocationSum, allocation) => {
      if (allocation.targetType !== targetType || allocation.targetId !== targetId) {
        return allocationSum;
      }

      return allocationSum + toNumber(allocation.amount);
    }, 0);

    return sum + allocatedToTarget;
  }, 0);
};

export const getInputCostAllocationsForTarget = (
  targetType,
  targetId,
  inputCosts = getHerdInputCosts()
) => {
  if (!targetType || !targetId) return [];

  return inputCosts.flatMap((inputCost) =>
    (inputCost.allocations || [])
      .filter((allocation) => allocation.targetType === targetType && allocation.targetId === targetId)
      .map((allocation) => ({
        ...allocation,
        inputCostId: inputCost.id,
        inputCostName: inputCost.name,
        inputCostCategory: inputCost.category,
        inputCostUnit: inputCost.unit,
        inputCostPurchaseDate: inputCost.purchaseDate
      }))
  );
};

export const calculateAnimalCostBasis = (animal, inputCosts = getHerdInputCosts()) => {
  return (
    toNumber(animal?.purchaseCost) +
    toNumber(animal?.accumulatedCosts) +
    calculateAllocatedCostForTarget(HERD_ALLOCATION_TARGET_TYPES.ANIMAL, animal?.id, inputCosts)
  );
};

export const calculateGroupCostBasis = (group, inputCosts = getHerdInputCosts()) => {
  return (
    toNumber(group?.purchaseCost) +
    toNumber(group?.accumulatedCosts) +
    calculateAllocatedCostForTarget(HERD_ALLOCATION_TARGET_TYPES.GROUP, group?.id, inputCosts)
  );
};

export const calculateGroupCostPerHead = (group, inputCosts = getHerdInputCosts()) => {
  const count = toNumber(group?.currentCount) || toNumber(group?.startingCount);
  if (!count) return 0;

  return calculateGroupCostBasis(group, inputCosts) / count;
};

export const calculateAnimalCostPerPound = (animal, inputCosts = getHerdInputCosts()) => {
  const weight = toNumber(animal?.currentWeight);
  if (!weight) return 0;

  return calculateAnimalCostBasis(animal, inputCosts) / weight;
};

export const calculateGroupCostPerPound = (group, inputCosts = getHerdInputCosts()) => {
  const weightEventTotal = (group?.events || []).reduce((sum, event) => {
    if (event.type !== "Weight Check" || !event.weight) return sum;
    return sum + toNumber(event.weight);
  }, 0);

  if (!weightEventTotal) return 0;

  return calculateGroupCostBasis(group, inputCosts) / weightEventTotal;
};

export const calculateAnimalProfit = (animal, inputCosts = getHerdInputCosts()) => {
  return toNumber(animal?.estimatedValue) - calculateAnimalCostBasis(animal, inputCosts);
};

export const calculateGroupProfit = (group, inputCosts = getHerdInputCosts()) => {
  return toNumber(group?.estimatedValue) - calculateGroupCostBasis(group, inputCosts);
};

export const calculateInputCostStats = (inputCosts = getHerdInputCosts()) => {
  const totalInputCost = inputCosts.reduce(
    (sum, inputCost) => sum + toNumber(inputCost.totalCost),
    0
  );
  const allocatedInputCost = inputCosts.reduce(
    (sum, inputCost) => sum + calculateInputCostAllocatedAmount(inputCost),
    0
  );

  return {
    totalInputCosts: inputCosts.length,
    totalInputCost,
    allocatedInputCost,
    unallocatedInputCost: totalInputCost - allocatedInputCost,
    overallocatedInputCosts: inputCosts.filter(
      (inputCost) => calculateInputCostRemainingAmount(inputCost) < 0
    ).length
  };
};

export const calculateHerdStats = (animals = [], groups = [], inputCosts = getHerdInputCosts()) => {
  const activeAnimals = animals.filter((animal) => animal.status === "Active");
  const readyAnimals = animals.filter((animal) => animal.status === "Ready for Processing");
  const activeGroups = groups.filter((group) => group.status === "Active");
  const readyGroups = groups.filter((group) => group.status === "Ready for Processing");
  const inputCostStats = calculateInputCostStats(inputCosts);

  const totalBookValue =
    animals.reduce((sum, animal) => sum + toNumber(animal.estimatedValue), 0) +
    groups.reduce((sum, group) => sum + toNumber(group.estimatedValue), 0);

  const totalCostBasis =
    animals.reduce((sum, animal) => sum + calculateAnimalCostBasis(animal, inputCosts), 0) +
    groups.reduce((sum, group) => sum + calculateGroupCostBasis(group, inputCosts), 0);

  return {
    totalAnimals: animals.length,
    totalGroups: groups.length,
    activeAnimals: activeAnimals.length,
    activeGroups: activeGroups.length,
    readyForProcessing: readyAnimals.length + readyGroups.length,
    totalBookValue,
    totalCostBasis,
    ...inputCostStats
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
