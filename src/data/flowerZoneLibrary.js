export const usdaZones = [
  "3a", "3b", "4a", "4b", "5a", "5b", "6a", "6b",
  "7a", "7b", "8a", "8b", "9a", "9b", "10a", "10b"
];

const coolZones = ["3a", "3b", "4a", "4b", "5a", "5b", "6a", "6b", "7a", "7b"];
const temperateZones = ["5a", "5b", "6a", "6b", "7a", "7b", "8a", "8b"];
const warmZones = ["6a", "6b", "7a", "7b", "8a", "8b", "9a", "9b", "10a", "10b"];
const mostZones = ["4a", "4b", "5a", "5b", "6a", "6b", "7a", "7b", "8a", "8b", "9a", "9b"];
const annualZones = ["5a", "5b", "6a", "6b", "7a", "7b", "8a", "8b", "9a", "9b", "10a"];

export const flowerZoneLibrary = [
  {
    name: "Zinnia",
    category: "Focal / Filler",
    colors: "Mixed, pink, orange, yellow, red, white, lime",
    bloomSeason: "Summer to frost",
    useType: "Market bouquets, bunches, arrangements",
    difficulty: "Easy",
    zones: annualZones,
    notes: "Heat-loving annual with excellent cut flower productivity."
  },
  {
    name: "Cosmos",
    category: "Filler",
    colors: "Pink, white, burgundy, yellow, orange",
    bloomSeason: "Summer to frost",
    useType: "Bouquets, airy filler, flower bars",
    difficulty: "Easy",
    zones: annualZones,
    notes: "Light, airy stems. Great for casual market bouquets."
  },
  {
    name: "Sunflower",
    category: "Focal",
    colors: "Yellow, orange, burgundy, cream, brown",
    bloomSeason: "Summer to fall",
    useType: "Market bouquets, bunches, focal stems",
    difficulty: "Easy",
    zones: ["4a", "4b", ...annualZones],
    notes: "Fast crop for market bouquets. Succession planting recommended."
  },
  {
    name: "Celosia",
    category: "Focal / Texture",
    colors: "Red, orange, yellow, pink, coral, burgundy",
    bloomSeason: "Summer to frost",
    useType: "Bouquets, dried flowers, texture stems",
    difficulty: "Easy",
    zones: warmZones,
    notes: "Excellent fresh or dried. Likes heat."
  },
  {
    name: "Snapdragon",
    category: "Spike",
    colors: "White, pink, yellow, peach, burgundy, lavender",
    bloomSeason: "Spring to early summer, fall",
    useType: "Bouquets, arrangements, event work",
    difficulty: "Moderate",
    zones: coolZones,
    notes: "Cool-season favorite with strong vase life."
  },
  {
    name: "Dahlia",
    category: "Focal",
    colors: "Mixed, blush, burgundy, orange, yellow, white, purple",
    bloomSeason: "Late summer to frost",
    useType: "Premium bouquets, events, focal stems",
    difficulty: "Moderate",
    zones: temperateZones.concat(["9a", "9b"]),
    notes: "High-value flower. Tubers may need lifting in colder zones."
  },
  {
    name: "Marigold",
    category: "Filler / Texture",
    colors: "Yellow, orange, gold, cream, rust",
    bloomSeason: "Summer to frost",
    useType: "Market bouquets, garlands, edible flowers",
    difficulty: "Easy",
    zones: annualZones,
    notes: "Hardy, productive annual with strong color."
  },
  {
    name: "Amaranth",
    category: "Hanging / Texture",
    colors: "Burgundy, green, coral, bronze",
    bloomSeason: "Summer to fall",
    useType: "Bouquets, dramatic arrangements, dried flowers",
    difficulty: "Easy",
    zones: warmZones,
    notes: "Adds movement and texture."
  },
  {
    name: "Basil",
    category: "Greenery / Filler",
    colors: "Green, purple",
    bloomSeason: "Summer",
    useType: "Bouquets, scented filler",
    difficulty: "Easy",
    zones: warmZones,
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
  },
  {
    name: "Statice",
    category: "Filler / Dried",
    colors: "Purple, blue, white, yellow, pink, apricot",
    bloomSeason: "Summer",
    useType: "Fresh bouquets, dried flowers, filler",
    difficulty: "Easy",
    zones: mostZones,
    notes: "Reliable dried flower with good vase life."
  },
  {
    name: "Strawflower",
    category: "Focal / Dried",
    colors: "Pink, yellow, orange, white, red, apricot",
    bloomSeason: "Summer to fall",
    useType: "Market bouquets, dried flowers, wreaths",
    difficulty: "Easy",
    zones: annualZones,
    notes: "Excellent for dried products and colorful bouquets."
  },
  {
    name: "Gomphrena",
    category: "Filler / Dried",
    colors: "Purple, pink, white, red, orange",
    bloomSeason: "Summer to frost",
    useType: "Bouquets, dried flowers, bunches",
    difficulty: "Easy",
    zones: warmZones,
    notes: "Heat tolerant and strong for dried flower production."
  },
  {
    name: "Scabiosa",
    category: "Filler / Accent",
    colors: "Lavender, burgundy, white, pink, blue",
    bloomSeason: "Spring to fall",
    useType: "Bouquets, event work, whimsical filler",
    difficulty: "Moderate",
    zones: temperateZones,
    notes: "Elegant stems and useful seed pods."
  },
  {
    name: "Bachelor Button",
    category: "Filler",
    colors: "Blue, white, pink, burgundy",
    bloomSeason: "Spring to early summer",
    useType: "Bouquets, edible flowers, filler",
    difficulty: "Easy",
    zones: coolZones,
    notes: "Cool-season annual, useful early in the season."
  },
  {
    name: "Nigella",
    category: "Filler / Pod",
    colors: "Blue, white, pink, purple",
    bloomSeason: "Spring to early summer",
    useType: "Bouquets, seed pods, dried accents",
    difficulty: "Easy",
    zones: coolZones,
    notes: "Flowers and seed pods are both useful."
  },
  {
    name: "Calendula",
    category: "Filler / Edible",
    colors: "Orange, yellow, cream",
    bloomSeason: "Spring, fall",
    useType: "Bouquets, edible flowers, herbal products",
    difficulty: "Easy",
    zones: coolZones,
    notes: "Cool-season flower with edible and herbal uses."
  },
  {
    name: "Sweet Pea",
    category: "Vine / Fragrant",
    colors: "Pink, white, lavender, burgundy, peach",
    bloomSeason: "Spring to early summer",
    useType: "Premium bouquets, event work, fragrant stems",
    difficulty: "Moderate",
    zones: coolZones,
    notes: "Highly fragrant, prefers cool weather."
  },
  {
    name: "Larkspur",
    category: "Spike",
    colors: "Blue, purple, pink, white",
    bloomSeason: "Spring to early summer",
    useType: "Bouquets, dried flowers, vertical accent",
    difficulty: "Moderate",
    zones: coolZones,
    notes: "Useful early-season spike flower."
  },
  {
    name: "Stock",
    category: "Spike / Fragrant",
    colors: "White, pink, purple, cream, peach",
    bloomSeason: "Spring",
    useType: "Bouquets, event work, fragrant bunches",
    difficulty: "Moderate",
    zones: coolZones,
    notes: "Fragrant cool-season crop with strong market appeal."
  },
  {
    name: "Lisianthus",
    category: "Focal",
    colors: "White, blush, lavender, purple, green, champagne",
    bloomSeason: "Summer",
    useType: "Premium bouquets, wedding work, arrangements",
    difficulty: "Advanced",
    zones: temperateZones.concat(["9a"]),
    notes: "High-value crop, slow to establish but excellent vase life."
  },
  {
    name: "Rudbeckia",
    category: "Focal / Filler",
    colors: "Gold, yellow, rust, brown, green",
    bloomSeason: "Summer to fall",
    useType: "Market bouquets, fall arrangements",
    difficulty: "Easy",
    zones: mostZones,
    notes: "Reliable warm-season cut flower."
  },
  {
    name: "Black-Eyed Susan",
    category: "Focal / Native",
    colors: "Yellow, gold, brown",
    bloomSeason: "Summer to fall",
    useType: "Bouquets, native plantings, pollinator products",
    difficulty: "Easy",
    zones: ["3a", "3b", ...mostZones],
    notes: "Native-style favorite and dependable perennial or annual depending on type."
  },
  {
    name: "Coneflower",
    category: "Focal / Native",
    colors: "Purple, pink, white, orange, yellow",
    bloomSeason: "Summer",
    useType: "Bouquets, native plantings, pollinator products",
    difficulty: "Easy",
    zones: ["3a", "3b", ...mostZones],
    notes: "Hardy perennial with strong pollinator appeal."
  },
  {
    name: "Yarrow",
    category: "Filler / Native",
    colors: "White, yellow, pink, red, peach",
    bloomSeason: "Summer",
    useType: "Bouquets, dried flowers, filler",
    difficulty: "Easy",
    zones: ["3a", "3b", ...mostZones],
    notes: "Hardy, drought-tolerant filler."
  },
  {
    name: "Bee Balm",
    category: "Filler / Native",
    colors: "Red, pink, purple, lavender",
    bloomSeason: "Summer",
    useType: "Bouquets, pollinator products, native plantings",
    difficulty: "Easy",
    zones: ["4a", "4b", ...mostZones],
    notes: "Aromatic native-style perennial."
  },
  {
    name: "Mountain Mint",
    category: "Greenery / Native",
    colors: "Green, silver, white",
    bloomSeason: "Summer",
    useType: "Filler, greenery, pollinator products",
    difficulty: "Easy",
    zones: ["4a", "4b", ...mostZones],
    notes: "Excellent aromatic filler and pollinator plant."
  },
  {
    name: "Goldenrod",
    category: "Filler / Native",
    colors: "Yellow, gold",
    bloomSeason: "Late summer to fall",
    useType: "Bouquets, fall arrangements, native plantings",
    difficulty: "Easy",
    zones: ["3a", "3b", ...mostZones],
    notes: "Useful fall filler with strong color."
  },
  {
    name: "Aster",
    category: "Filler / Native",
    colors: "Purple, lavender, pink, white",
    bloomSeason: "Late summer to fall",
    useType: "Bouquets, fall arrangements, native plantings",
    difficulty: "Easy",
    zones: ["3a", "3b", ...mostZones],
    notes: "Late-season filler and pollinator favorite."
  },
  {
    name: "Phlox",
    category: "Filler / Perennial",
    colors: "Pink, white, lavender, purple",
    bloomSeason: "Summer",
    useType: "Bouquets, fragrant filler, perennial cuts",
    difficulty: "Moderate",
    zones: ["4a", "4b", ...mostZones],
    notes: "Fragrant perennial useful in summer bouquets."
  },
  {
    name: "Peony",
    category: "Focal / Perennial",
    colors: "Pink, white, coral, red, blush",
    bloomSeason: "Spring",
    useType: "Premium bouquets, wedding work, focal stems",
    difficulty: "Moderate",
    zones: ["3a", "3b", "4a", "4b", "5a", "5b", "6a", "6b", "7a", "7b", "8a"],
    notes: "Premium spring perennial crop with strong demand."
  },
  {
    name: "Tulip",
    category: "Focal / Bulb",
    colors: "Mixed, pink, white, yellow, orange, purple, red",
    bloomSeason: "Spring",
    useType: "Spring bouquets, bunches, event work",
    difficulty: "Moderate",
    zones: coolZones.concat(["8a"]),
    notes: "Popular spring bulb crop. Often grown as annual cut flower."
  },
  {
    name: "Daffodil",
    category: "Focal / Bulb",
    colors: "Yellow, white, orange, cream",
    bloomSeason: "Spring",
    useType: "Spring bouquets, bunches",
    difficulty: "Easy",
    zones: ["3a", "3b", ...coolZones, "8a", "8b"],
    notes: "Reliable spring bulb crop. Handle separately from other cut flowers after harvest."
  },
  {
    name: "Ranunculus",
    category: "Focal",
    colors: "White, pink, peach, yellow, orange, burgundy, purple",
    bloomSeason: "Spring",
    useType: "Premium bouquets, wedding work, focal stems",
    difficulty: "Moderate",
    zones: temperateZones.concat(["9a", "9b", "10a"]),
    notes: "Premium cool-season crop, often protected in colder zones."
  },
  {
    name: "Anemone",
    category: "Focal",
    colors: "White, red, purple, blue, pink",
    bloomSeason: "Spring",
    useType: "Premium bouquets, wedding work, focal stems",
    difficulty: "Moderate",
    zones: temperateZones.concat(["9a", "9b", "10a"]),
    notes: "Cool-season crop with strong event appeal."
  },
  {
    name: "Iceland Poppy",
    category: "Focal",
    colors: "White, yellow, orange, peach, pink",
    bloomSeason: "Spring to early summer",
    useType: "Premium bouquets, delicate focal stems",
    difficulty: "Moderate",
    zones: coolZones.concat(["8a", "8b"]),
    notes: "Delicate stems with high visual appeal."
  },
  {
    name: "Feverfew",
    category: "Filler",
    colors: "White, yellow",
    bloomSeason: "Spring to summer",
    useType: "Bouquets, filler, cottage garden arrangements",
    difficulty: "Easy",
    zones: coolZones.concat(["8a"]),
    notes: "Useful small-flowered filler."
  },
  {
    name: "Queen Anne's Lace",
    category: "Filler",
    colors: "White, green, chocolate, pink",
    bloomSeason: "Summer",
    useType: "Bouquets, airy filler",
    difficulty: "Easy",
    zones: mostZones,
    notes: "Airy umbel filler. Use cultivated varieties where appropriate."
  },
  {
    name: "Dara",
    category: "Filler",
    colors: "Burgundy, blush, pink, white",
    bloomSeason: "Summer",
    useType: "Bouquets, airy filler, wedding work",
    difficulty: "Easy",
    zones: mostZones,
    notes: "Cultivated Queen Anne's Lace type with beautiful tones."
  },
  {
    name: "Bupleurum",
    category: "Greenery / Filler",
    colors: "Green, chartreuse",
    bloomSeason: "Spring to summer",
    useType: "Bouquets, greenery, airy filler",
    difficulty: "Moderate",
    zones: coolZones.concat(["8a"]),
    notes: "Excellent chartreuse filler for spring and early summer."
  },
  {
    name: "Orlaya",
    category: "Filler",
    colors: "White",
    bloomSeason: "Spring to early summer",
    useType: "Wedding work, bouquets, delicate filler",
    difficulty: "Moderate",
    zones: coolZones.concat(["8a"]),
    notes: "Elegant white lace flower."
  },
  {
    name: "Ageratum",
    category: "Filler",
    colors: "Blue, purple, white",
    bloomSeason: "Summer to frost",
    useType: "Bouquets, filler, color accent",
    difficulty: "Easy",
    zones: annualZones,
    notes: "Useful blue-toned filler."
  },
  {
    name: "Cleome",
    category: "Filler / Texture",
    colors: "Pink, white, lavender",
    bloomSeason: "Summer to frost",
    useType: "Large bouquets, texture, airy filler",
    difficulty: "Easy",
    zones: warmZones,
    notes: "Tall, airy, and productive in heat."
  },
  {
    name: "Verbena",
    category: "Filler",
    colors: "Purple, lavender, pink, white",
    bloomSeason: "Summer to frost",
    useType: "Bouquets, airy filler, pollinator products",
    difficulty: "Easy",
    zones: annualZones,
    notes: "Great for airy texture and pollinator appeal."
  },
  {
    name: "Salvia",
    category: "Spike",
    colors: "Blue, purple, white, pink, red",
    bloomSeason: "Summer to frost",
    useType: "Bouquets, vertical accent, pollinator products",
    difficulty: "Easy",
    zones: annualZones,
    notes: "Useful spike flower with strong color."
  },
  {
    name: "Sage",
    category: "Greenery / Herb",
    colors: "Green, silver, purple",
    bloomSeason: "Spring to summer",
    useType: "Bouquets, scented greenery, herb bunches",
    difficulty: "Easy",
    zones: mostZones,
    notes: "Aromatic greenery with culinary crossover."
  },
  {
    name: "Mint",
    category: "Greenery / Herb",
    colors: "Green",
    bloomSeason: "Spring to fall",
    useType: "Bouquets, scented filler, herb bunches",
    difficulty: "Easy",
    zones: mostZones,
    notes: "Strong aromatic filler. Best managed to prevent spreading."
  },
  {
    name: "Rosemary",
    category: "Greenery / Herb",
    colors: "Green, blue-green",
    bloomSeason: "Spring to summer",
    useType: "Scented greenery, herb bunches, arrangements",
    difficulty: "Moderate",
    zones: ["7a", "7b", "8a", "8b", "9a", "9b", "10a", "10b"],
    notes: "Woody herb with strong scent and culinary crossover."
  },
  {
    name: "Lavender",
    category: "Filler / Herb",
    colors: "Purple, lavender, white",
    bloomSeason: "Summer",
    useType: "Bouquets, dried flowers, herb bundles",
    difficulty: "Moderate",
    zones: ["5a", "5b", "6a", "6b", "7a", "7b", "8a", "8b", "9a"],
    notes: "Great for dried bundles and scented products."
  },
  {
    name: "Dusty Miller",
    category: "Greenery",
    colors: "Silver",
    bloomSeason: "Spring to fall",
    useType: "Bouquets, event greenery, contrast foliage",
    difficulty: "Easy",
    zones: mostZones.concat(["10a"]),
    notes: "Silver foliage is useful for contrast."
  },
  {
    name: "Scented Geranium",
    category: "Greenery / Fragrant",
    colors: "Green, variegated",
    bloomSeason: "Summer",
    useType: "Scented foliage, bouquets, event work",
    difficulty: "Moderate",
    zones: ["8a", "8b", "9a", "9b", "10a", "10b"],
    notes: "Often grown as annual or protected plant in colder zones."
  },
  {
    name: "Bells of Ireland",
    category: "Spike / Green",
    colors: "Green",
    bloomSeason: "Summer",
    useType: "Bouquets, vertical accent, green arrangements",
    difficulty: "Moderate",
    zones: coolZones.concat(["8a"]),
    notes: "Distinct green spike with good market appeal."
  },
  {
    name: "Love-in-a-Puff",
    category: "Vine / Texture",
    colors: "Green, white",
    bloomSeason: "Summer to frost",
    useType: "Whimsical bouquets, event work, texture",
    difficulty: "Easy",
    zones: warmZones,
    notes: "Vining texture element for creative arrangements."
  },
  {
    name: "Hyacinth Bean",
    category: "Vine / Pod",
    colors: "Purple, green, pink",
    bloomSeason: "Summer to fall",
    useType: "Bouquets, pods, texture, event work",
    difficulty: "Easy",
    zones: warmZones,
    notes: "Vigorous vine with colorful pods and blooms."
  },
  {
    name: "Chinese Forget-Me-Not",
    category: "Filler",
    colors: "Blue, pink, white",
    bloomSeason: "Spring to summer",
    useType: "Bouquets, small filler, blue accent",
    difficulty: "Easy",
    zones: coolZones.concat(["8a"]),
    notes: "Useful small blue filler."
  },
  {
    name: "Campanula",
    category: "Spike / Filler",
    colors: "Blue, lavender, white, pink",
    bloomSeason: "Spring to early summer",
    useType: "Bouquets, wedding work, vertical accent",
    difficulty: "Moderate",
    zones: coolZones.concat(["8a"]),
    notes: "Elegant bell-shaped flowers."
  },
  {
    name: "Digitalis",
    category: "Spike",
    colors: "White, pink, peach, lavender, cream",
    bloomSeason: "Spring to early summer",
    useType: "Event work, vertical accent, arrangements",
    difficulty: "Moderate",
    zones: ["4a", "4b", ...temperateZones],
    notes: "Tall elegant spike, toxic plant, handle and label appropriately."
  },
  {
    name: "Hollyhock",
    category: "Spike",
    colors: "Pink, white, red, yellow, black, peach",
    bloomSeason: "Summer",
    useType: "Large arrangements, event work, cottage bouquets",
    difficulty: "Moderate",
    zones: ["3a", "3b", ...mostZones],
    notes: "Tall dramatic stem for large arrangements."
  },
  {
    name: "Delphinium",
    category: "Spike",
    colors: "Blue, lavender, white, pink",
    bloomSeason: "Spring to summer",
    useType: "Premium bouquets, event work, vertical accent",
    difficulty: "Advanced",
    zones: coolZones,
    notes: "Premium cool-climate spike flower."
  },
  {
    name: "Gladiolus",
    category: "Spike / Bulb",
    colors: "Mixed, pink, red, yellow, white, orange, purple",
    bloomSeason: "Summer",
    useType: "Market bunches, large arrangements, event work",
    difficulty: "Easy",
    zones: mostZones.concat(["10a"]),
    notes: "Strong vertical crop, good for bunches."
  },
  {
    name: "Hydrangea",
    category: "Focal / Woody",
    colors: "White, pink, blue, green, burgundy",
    bloomSeason: "Summer to fall",
    useType: "Large arrangements, dried flowers, event work",
    difficulty: "Moderate",
    zones: ["4a", "4b", ...mostZones],
    notes: "Woody shrub crop with fresh and dried uses."
  },
  {
    name: "Ninebark",
    category: "Woody / Foliage",
    colors: "Burgundy, green, bronze",
    bloomSeason: "Spring to summer",
    useType: "Foliage, woody cuts, arrangements",
    difficulty: "Easy",
    zones: ["3a", "3b", ...mostZones],
    notes: "Useful shrub foliage and woody stems."
  },
  {
    name: "Willow",
    category: "Woody / Branch",
    colors: "Green, red, yellow, brown",
    bloomSeason: "Winter to spring",
    useType: "Branches, arrangements, wreaths",
    difficulty: "Easy",
    zones: ["3a", "3b", ...mostZones],
    notes: "Useful branches for structure and seasonal products."
  },
  {
    name: "Curly Willow",
    category: "Woody / Branch",
    colors: "Brown, green",
    bloomSeason: "Winter to spring",
    useType: "Arrangements, wreaths, structural branches",
    difficulty: "Easy",
    zones: ["4a", "4b", ...mostZones],
    notes: "Decorative branch crop with strong florist appeal."
  },
  {
    name: "Dogwood Branches",
    category: "Woody / Branch",
    colors: "Red, yellow, green, white",
    bloomSeason: "Winter to spring",
    useType: "Branches, arrangements, seasonal bundles",
    difficulty: "Easy",
    zones: ["3a", "3b", ...mostZones],
    notes: "Useful for winter and spring branch products."
  },
  {
    name: "Bittersweet",
    category: "Vine / Seasonal",
    colors: "Orange, yellow",
    bloomSeason: "Fall",
    useType: "Wreaths, fall arrangements, seasonal decor",
    difficulty: "Moderate",
    zones: ["4a", "4b", ...mostZones],
    notes: "Use non-invasive or locally appropriate types only."
  },
  {
    name: "Pumpkin-on-a-Stick",
    category: "Texture / Novelty",
    colors: "Orange, green",
    bloomSeason: "Late summer to fall",
    useType: "Fall bouquets, novelty stems, market bunches",
    difficulty: "Easy",
    zones: warmZones,
    notes: "Strong fall market novelty crop."
  },
  {
    name: "Safflower",
    category: "Texture / Dried",
    colors: "Orange, yellow, red",
    bloomSeason: "Summer",
    useType: "Dried flowers, texture, market bunches",
    difficulty: "Easy",
    zones: mostZones.concat(["10a"]),
    notes: "Drought tolerant and useful dried."
  },
  {
    name: "Ornamental Millet",
    category: "Grass / Texture",
    colors: "Purple, green, bronze",
    bloomSeason: "Summer to fall",
    useType: "Bouquets, fall arrangements, texture",
    difficulty: "Easy",
    zones: warmZones,
    notes: "Excellent texture for late summer and fall."
  },
  {
    name: "Broom Corn",
    category: "Grass / Dried",
    colors: "Green, tan, burgundy, bronze",
    bloomSeason: "Late summer to fall",
    useType: "Dried flowers, wreaths, fall bundles",
    difficulty: "Easy",
    zones: warmZones,
    notes: "Strong dried and fall decorative crop."
  },
  {
    name: "Ornamental Grass",
    category: "Grass / Texture",
    colors: "Green, tan, bronze, burgundy",
    bloomSeason: "Summer to fall",
    useType: "Bouquets, dried arrangements, fall decor",
    difficulty: "Easy",
    zones: mostZones.concat(["10a"]),
    notes: "Useful for texture and movement."
  },
  {
    name: "Pampas Grass",
    category: "Grass / Dried",
    colors: "Cream, tan, pink",
    bloomSeason: "Late summer to fall",
    useType: "Dried arrangements, event installs, decor",
    difficulty: "Moderate",
    zones: ["7a", "7b", "8a", "8b", "9a", "9b", "10a", "10b"],
    notes: "Large plume grass, best for warm zones."
  }
];

export function getFlowersForZone(zone) {
  if (!zone) return [];
  return flowerZoneLibrary.filter((flower) => flower.zones.includes(zone));
}
