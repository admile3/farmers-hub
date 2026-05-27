import { doc, serverTimestamp, setDoc } from "firebase/firestore";
import { db } from "../firebase";
import {
  createSpiceIngredient,
  createSpiceRecipe
} from "./spiceKitchenService.js";
import { createList, addListItem } from "./listsService.js";
import { saveMarketPrepPlan } from "./marketPrepService.js";
import { savePricingCalculation } from "./pricingService.js";
import { savePermitGrantItem } from "./permitGrantService.js";

function makeId(prefix) {
  return `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

export async function importSampleWorkspace(userId) {
  if (!userId) {
    throw new Error("Missing user ID for sample data import.");
  }

  await Promise.all([
    importSpiceSamples(userId),
    importBakingSamples(userId),
    importMarketPrepSamples(userId),
    importPricingSamples(userId),
    importPermitGrantSamples(userId),
    importListSamples(userId)
  ]);
}

async function importSpiceSamples(userId) {
  const ingredientIds = {};

  const ingredients = [
    {
      key: "garlic",
      name: "SAMPLE - Garlic Powder",
      category: "Dry Spice",
      unit: "g",
      costPerUnit: 0.025,
      notes: "Sample ingredient. Edit or delete anytime."
    },
    {
      key: "onion",
      name: "SAMPLE - Onion Powder",
      category: "Dry Spice",
      unit: "g",
      costPerUnit: 0.022,
      notes: "Sample ingredient. Edit or delete anytime."
    },
    {
      key: "paprika",
      name: "SAMPLE - Smoked Paprika",
      category: "Dry Spice",
      unit: "g",
      costPerUnit: 0.04,
      notes: "Sample ingredient. Edit or delete anytime."
    },
    {
      key: "salt",
      name: "SAMPLE - Sea Salt",
      category: "Salt",
      unit: "g",
      costPerUnit: 0.006,
      notes: "Sample ingredient. Edit or delete anytime."
    }
  ];

  for (const ingredient of ingredients) {
    const { key, ...data } = ingredient;
    ingredientIds[key] = await createSpiceIngredient(userId, data);
  }

  await createSpiceRecipe(userId, {
    name: "SAMPLE - Market House Seasoning",
    category: "All Purpose",
    batchSizeOz: 4,
    targetBatchOz: 4,
    notes:
      "Sample spice recipe. Use this to see how recipes, ingredients, and batch notes work.",
    ingredients: [
      {
        ingredientId: ingredientIds.salt,
        name: "SAMPLE - Sea Salt",
        amount: 40,
        unit: "g",
        parts: 4
      },
      {
        ingredientId: ingredientIds.garlic,
        name: "SAMPLE - Garlic Powder",
        amount: 20,
        unit: "g",
        parts: 2
      },
      {
        ingredientId: ingredientIds.onion,
        name: "SAMPLE - Onion Powder",
        amount: 20,
        unit: "g",
        parts: 2
      },
      {
        ingredientId: ingredientIds.paprika,
        name: "SAMPLE - Smoked Paprika",
        amount: 10,
        unit: "g",
        parts: 1
      }
    ]
  });
}

async function importBakingSamples(userId) {
  const ref = doc(db, "users", userId, "bakingPlanner", "main");

  await setDoc(
    ref,
    {
      recipes: [
        {
          id: "sample-rustic-loaf",
          name: "SAMPLE - Rustic Sourdough Loaf",
          category: "Loaf",
          unitsLabel: "loaves",
          vesselType: "Banneton / Dutch Oven",
          finishedUnitWeight: 680,
          bakeLossPct: 12,
          batchMaxDoughG: 7200,
          ovenCapacityUnits: 8,
          flourTypes: [
            { name: "Bread Flour", pct: 85 },
            { name: "Whole Wheat Flour", pct: 15 }
          ],
          hydrationPct: 78,
          starterPct: 22,
          starterHydrationPct: 100,
          saltPct: 2.1,
          otherIngredients: [],
          process: {
            autolyseMin: 30,
            mixMin: 12,
            bulkMin: 300,
            foldCount: 4,
            foldIntervalMin: 30,
            foldDurationMin: 5,
            divideAndPreshapeMin: 12,
            benchRestMin: 20,
            finalShapeMin: 18,
            finalProofMin: 180,
            bakeTempF: 475,
            bakeMin: 42,
            coolMin: 120
          }
        },
        {
          id: "sample-ciabatta",
          name: "SAMPLE - Ciabatta",
          category: "High Hydration",
          unitsLabel: "pieces",
          vesselType: "Sheet Pan",
          finishedUnitWeight: 280,
          bakeLossPct: 14,
          batchMaxDoughG: 6500,
          ovenCapacityUnits: 30,
          flourTypes: [{ name: "Bread Flour", pct: 100 }],
          hydrationPct: 88,
          starterPct: 18,
          starterHydrationPct: 100,
          saltPct: 2.2,
          otherIngredients: [{ name: "Olive Oil", pct: 2 }],
          process: {
            autolyseMin: 20,
            mixMin: 10,
            bulkMin: 240,
            foldCount: 4,
            foldIntervalMin: 25,
            foldDurationMin: 5,
            divideAndPreshapeMin: 0,
            benchRestMin: 0,
            finalShapeMin: 12,
            finalProofMin: 60,
            bakeTempF: 460,
            bakeMin: 24,
            coolMin: 60
          }
        }
      ],
      settings: {
        altitudeFt: 980,
        baselineTempF: 72,
        baselineHumidityPct: 55,
        starterHydrationPct: 100,
        levainBufferPct: 10,
        ingredientBufferPct: 3,
        mixerCapacityG: 7000,
        proofingCapacityUnits: 24,
        defaultStartTime: "06:00"
      },
      env: {
        tempF: 74,
        humidityPct: 52
      },
      productionDate: todayISO(),
      productionItems: [],
      updatedAt: serverTimestamp()
    },
    { merge: true }
  );
}

async function importMarketPrepSamples(userId) {
  await saveMarketPrepPlan(userId, {
    id: makeId("sample-market"),
    marketName: "SAMPLE - Saturday Farmers Market",
    marketDate: todayISO(),
    location: "Sample Market Booth",
    weatherNotes: "Example plan. Edit or delete anytime.",
    products: [
      {
        id: makeId("sample-product"),
        name: "SAMPLE - Tomatoes",
        category: "Produce",
        unitLabel: "1 lb bag",
        plannedUnits: 12,
        unitAmount: 1,
        amountUnit: "lb",
        bufferPct: 10,
        notes: "Example produce item.",
        packed: false
      },
      {
        id: makeId("sample-product"),
        name: "SAMPLE - Sourdough Loaf",
        category: "Bread",
        unitLabel: "loaf",
        plannedUnits: 18,
        unitAmount: 1,
        amountUnit: "loaf",
        bufferPct: 0,
        notes: "Example bread item.",
        packed: false
      },
      {
        id: makeId("sample-product"),
        name: "SAMPLE - Seasoning Pouch",
        category: "Spices",
        unitLabel: "0.2 oz pouch",
        plannedUnits: 30,
        unitAmount: 0.2,
        amountUnit: "oz",
        bufferPct: 5,
        notes: "Example spice item.",
        packed: false
      }
    ]
  });
}

async function importPricingSamples(userId) {
  await savePricingCalculation(userId, {
    id: makeId("sample-pricing"),
    name: "SAMPLE - Market Pricing Sheet",
    notes: "Example pricing sheet. Edit or delete anytime.",
    items: [
      {
        id: makeId("sample-price-item"),
        productName: "SAMPLE - Microgreens",
        category: "Produce",
        batchCost: 18,
        batchUnits: 24,
        packagingCostPerUnit: 0.22,
        laborHours: 1.5,
        laborRate: 18,
        overheadCost: 5,
        retailPrice: 4,
        wholesalePrice: 2.5,
        targetMargin: 70,
        notes: "Example fresh product."
      }
    ]
  });
}

async function importPermitGrantSamples(userId) {
  const records = [
    {
      id: makeId("sample-permit"),
      name: "SAMPLE - Home-Based Processor",
      type: "Permit",
      agency: "State Food Safety Office",
      status: "Approved",
      priority: "High",
      issueDate: "2026-01-01",
      dueDate: "2026-12-31",
      submittedDate: "",
      approvedDate: "2026-01-01",
      renewalDate: "2026-12-31",
      reminderAmount: 30,
      reminderUnit: "days",
      fee: 50,
      link: "",
      documentName: "Sample Permit.pdf",
      documentUrl: "",
      notes: "Example permit record. Edit or delete anytime."
    },
    {
      id: makeId("sample-insurance"),
      name: "SAMPLE - General Liability Insurance",
      type: "Insurance",
      agency: "Sample Insurance Provider",
      status: "Renewal Needed",
      priority: "Urgent",
      issueDate: "2026-01-01",
      dueDate: "2026-12-31",
      submittedDate: "",
      approvedDate: "",
      renewalDate: "2026-12-31",
      reminderAmount: 30,
      reminderUnit: "days",
      fee: 0,
      link: "",
      documentName: "",
      documentUrl: "",
      notes: "Example insurance renewal. Edit or delete anytime."
    },
    {
      id: makeId("sample-grant"),
      name: "SAMPLE - Local Food Innovation Grant",
      type: "Grant",
      agency: "County Economic Development",
      status: "Submitted",
      priority: "Normal",
      issueDate: "",
      dueDate: "2026-09-30",
      submittedDate: "2026-09-01",
      approvedDate: "",
      renewalDate: "",
      reminderAmount: 15,
      reminderUnit: "days",
      fee: 0,
      link: "",
      documentName: "",
      documentUrl: "",
      notes: "Example grant application. Edit or delete anytime."
    }
  ];

  await Promise.all(records.map((record) => savePermitGrantItem(userId, record)));
}

async function importListSamples(userId) {
  const listId = await createList(userId, {
    id: makeId("sample-list"),
    name: "SAMPLE - Market Day Checklist",
    description: "Example list. Edit or delete anytime.",
    color: "market"
  });

  const items = [
    "Pack tablecloths and display signs",
    "Prep product labels and price cards",
    "Load cooler, ice packs, and backup bags",
    "Bring Square reader and charged phone",
    "Take booth photo for social media"
  ];

  await Promise.all(
    items.map((text, index) =>
      addListItem(userId, listId, {
        id: `sample-item-${index + 1}-${Date.now()}`,
        text: `SAMPLE - ${text}`,
        checked: false
      })
    )
  );
}
