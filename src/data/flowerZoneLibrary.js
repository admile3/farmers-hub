export const usdaZones = [
  "3a", "3b", "4a", "4b", "5a", "5b", "6a", "6b",
  "7a", "7b", "8a", "8b", "9a", "9b", "10a", "10b"
];

export const flowerZoneLibrary = [
  {
    name: "Zinnia",
    category: "Focal / Filler",
    colors: "Mixed, pink, orange, yellow, red, white",
    bloomSeason: "Summer to frost",
    useType: "Market bouquets, bunches, arrangements",
    difficulty: "Easy",
    zones: ["5a", "5b", "6a", "6b", "7a", "7b", "8a", "8b", "9a", "9b", "10a", "10b"],
    notes: "Heat-loving annual with excellent cut flower productivity."
  },
  {
    name: "Cosmos",
    category: "Filler",
    colors: "Pink, white, burgundy, yellow, orange",
    bloomSeason: "Summer to frost",
    useType: "Bouquets, airy filler, flower bars",
    difficulty: "Easy",
    zones: ["5a", "5b", "6a", "6b", "7a", "7b", "8a", "8b", "9a", "9b", "10a"],
    notes: "Light, airy stems. Great for casual market bouquets."
  },
  {
    name: "Sunflower",
    category: "Focal",
    colors: "Yellow, orange, burgundy, cream",
    bloomSeason: "Summer to fall",
    useType: "Market bouquets, bunches, focal stems",
    difficulty: "Easy",
    zones: ["4a", "4b", "5a", "5b", "6a", "6b", "7a", "7b", "8a", "8b", "9a", "9b", "10a"],
    notes: "Fast crop for market bouquets. Succession planting recommended."
  },
  {
    name: "Celosia",
    category: "Focal / Texture",
    colors: "Red, orange, yellow, pink, coral",
    bloomSeason: "Summer to frost",
    useType: "Bouquets, dried flowers, texture stems",
    difficulty: "Easy",
    zones: ["6a", "6b", "7a", "7b", "8a", "8b", "9a", "9b", "10a", "10b"],
    notes: "Excellent fresh or dried. Likes heat."
  },
  {
    name: "Snapdragon",
    category: "Spike",
    colors: "White, pink, yellow, peach, burgundy",
    bloomSeason: "Spring to early summer, fall",
    useType: "Bouquets, arrangements, event work",
    difficulty: "Moderate",
    zones: ["5a", "5b", "6a", "6b", "7a", "7b", "8a", "8b", "9a"],
    notes: "Cool-season favorite with strong vase life."
  },
  {
    name: "Dahlia",
    category: "Focal",
    colors: "Mixed, blush, burgundy, orange, yellow, white",
    bloomSeason: "Late summer to frost",
    useType: "Premium bouquets, events, focal stems",
    difficulty: "Moderate",
    zones: ["6a", "6b", "7a", "7b", "8a", "8b", "9a", "9b"],
    notes: "High-value flower. Tubers may need lifting in colder zones."
  },
  {
    name: "Marigold",
    category: "Filler / Texture",
    colors: "Yellow, orange, gold, cream",
    bloomSeason: "Summer to frost",
    useType: "Market bouquets, garlands, edible flowers",
    difficulty: "Easy",
    zones: ["5a", "5b", "6a", "6b", "7a", "7b", "8a", "8b", "9a", "9b", "10a"],
    notes: "Hardy, productive annual with strong color."
  },
  {
    name: "Amaranth",
    category: "Hanging / Texture",
    colors: "Burgundy, green, coral",
    bloomSeason: "Summer to fall",
    useType: "Bouquets, dramatic arrangements, dried flowers",
    difficulty: "Easy",
    zones: ["6a", "6b", "7a", "7b", "8a", "8b", "9a", "9b", "10a"],
    notes: "Adds movement and texture."
  },
  {
    name: "Basil",
    category: "Greenery / Filler",
    colors: "Green, purple",
    bloomSeason: "Summer",
    useType: "Bouquets, scented filler",
    difficulty: "Easy",
    zones: ["6a", "6b", "7a", "7b", "8a", "8b", "9a", "9b", "10a"],
    notes: "Aromatic filler, useful for market bouquets."
  },
  {
    name: "Eucalyptus",
    category: "Greenery",
    colors: "Blue-green, silver, green",
    bloomSeason: "Summer to fall",
    useType: "Bouquets, greenery bunches, event work",
    difficulty: "Moderate",
    zones: ["8a", "8b", "9a", "9b", "10a", "10b"],
    notes: "Often grown as an annual in colder zones."
  }
];

export function getFlowersForZone(zone) {
  if (!zone) return [];
  return flowerZoneLibrary.filter((flower) => flower.zones.includes(zone));
}
