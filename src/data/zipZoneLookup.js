let cachedZipZoneMap = null;

function normalizeZip(zip) {
  return String(zip || "")
    .replace(/\D/g, "")
    .padStart(5, "0")
    .slice(0, 5);
}

function normalizeZone(zone) {
  return String(zone || "").trim().toLowerCase();
}

function parseCsvLine(line) {
  const values = [];
  let current = "";
  let insideQuotes = false;

  for (const char of line) {
    if (char === "\"") {
      insideQuotes = !insideQuotes;
    } else if (char === "," && !insideQuotes) {
      values.push(current.trim());
      current = "";
    } else {
      current += char;
    }
  }

  values.push(current.trim());
  return values;
}

export async function loadZipZoneMap() {
  if (cachedZipZoneMap) return cachedZipZoneMap;

  const response = await fetch("/data/phzm_us_zipcode_2023.csv");

  if (!response.ok) {
    throw new Error("Could not load ZIP zone dataset.");
  }

  const text = await response.text();
  const lines = text.split(/\r?\n/).filter(Boolean);
  const header = parseCsvLine(lines[0]).map((item) => item.toLowerCase());
  const zipIndex = header.indexOf("zipcode");
  const zoneIndex = header.indexOf("zone");

  if (zipIndex === -1 || zoneIndex === -1) {
    throw new Error("ZIP zone dataset must include zipcode and zone columns.");
  }

  const map = {};

  lines.slice(1).forEach((line) => {
    const values = parseCsvLine(line);
    const zip = normalizeZip(values[zipIndex]);
    const zone = normalizeZone(values[zoneIndex]);

    if (zip && zone) {
      map[zip] = zone;
    }
  });

  cachedZipZoneMap = map;
  return map;
}

export async function getZoneFromZip(zip) {
  const map = await loadZipZoneMap();
  return map[normalizeZip(zip)] || "";
}

export { normalizeZip };
