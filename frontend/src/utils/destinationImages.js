/**
 * destinationImages.js
 * Comprehensive, destination-specific image mapping and resolution for TripNest.
 * Provides authentic, high-resolution scenic photography for destinations across India and the world.
 *
 * Strict Fallback Hierarchy:
 * 1. Stored destination / custom image URL (if valid)
 * 2. Exact or normalized destination dictionary match
 * 3. Token / substring landmark match
 * 4. Thematic category fallback (temple, beach, mountain, fort, etc.)
 * 5. Clean scenic landscape vista (never generic hotel bed or suitcase)
 */

// Scenic panoramic travel landscape — used ONLY as final fallback
export const DEFAULT_TRAVEL_FALLBACK =
  "https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=800&q=80";

// Direct, curated verified high-quality destination photography
const DESTINATION_IMAGE_MAP = {
  // ── Indian Spiritual & Landmark Destinations ──
  "somnath":
    "https://images.unsplash.com/photo-1548013146-72479768bada?auto=format&fit=crop&w=800&q=80",
  "shree somnath":
    "https://images.unsplash.com/photo-1548013146-72479768bada?auto=format&fit=crop&w=800&q=80",
  "somnath temple":
    "https://images.unsplash.com/photo-1548013146-72479768bada?auto=format&fit=crop&w=800&q=80",
  "shree somnath temple":
    "https://images.unsplash.com/photo-1548013146-72479768bada?auto=format&fit=crop&w=800&q=80",
  "somnath jyotirlinga":
    "https://images.unsplash.com/photo-1548013146-72479768bada?auto=format&fit=crop&w=800&q=80",
  "shree somnath jyotirlinga temple":
    "https://images.unsplash.com/photo-1548013146-72479768bada?auto=format&fit=crop&w=800&q=80",
  "prabhas patan":
    "https://images.unsplash.com/photo-1548013146-72479768bada?auto=format&fit=crop&w=800&q=80",
  "veraval":
    "https://images.unsplash.com/photo-1548013146-72479768bada?auto=format&fit=crop&w=800&q=80",

  // ── Hill Stations, Nature & Landscapes ──
  "panchmarhi":
    "https://images.unsplash.com/photo-1596401057633-54a8fe8ef647?auto=format&fit=crop&w=800&q=80",
  "pachmarhi":
    "https://images.unsplash.com/photo-1596401057633-54a8fe8ef647?auto=format&fit=crop&w=800&q=80",
  "satpura":
    "https://images.unsplash.com/photo-1590050752117-238cb0fb12b1?auto=format&fit=crop&w=800&q=80",
  "hoshangabad":
    "https://images.unsplash.com/photo-1590050752117-238cb0fb12b1?auto=format&fit=crop&w=800&q=80",

  // ── Goa Beaches ──
  "goa":
    "https://images.unsplash.com/photo-1512343879784-a960bf40e7f2?auto=format&fit=crop&w=800&q=80",
  "north goa":
    "https://images.unsplash.com/photo-1512343879784-a960bf40e7f2?auto=format&fit=crop&w=800&q=80",
  "south goa":
    "https://images.unsplash.com/photo-1512343879784-a960bf40e7f2?auto=format&fit=crop&w=800&q=80",
  "calangute":
    "https://images.unsplash.com/photo-1512343879784-a960bf40e7f2?auto=format&fit=crop&w=800&q=80",
  "baga":
    "https://images.unsplash.com/photo-1512343879784-a960bf40e7f2?auto=format&fit=crop&w=800&q=80",
  "panaji":
    "https://images.unsplash.com/photo-1512343879784-a960bf40e7f2?auto=format&fit=crop&w=800&q=80",

  // ── Delhi & NCR ──
  "delhi":
    "https://images.unsplash.com/photo-1587474260584-136574528ed5?auto=format&fit=crop&w=800&q=80",
  "new delhi":
    "https://images.unsplash.com/photo-1587474260584-136574528ed5?auto=format&fit=crop&w=800&q=80",
  "india gate":
    "https://images.unsplash.com/photo-1587474260584-136574528ed5?auto=format&fit=crop&w=800&q=80",
  "red fort":
    "https://images.unsplash.com/photo-1587474260584-136574528ed5?auto=format&fit=crop&w=800&q=80",
  "qutub minar":
    "https://images.unsplash.com/photo-1587474260584-136574528ed5?auto=format&fit=crop&w=800&q=80",

  // ── Golden Triangle & Heritage ──
  "agra":
    "https://images.unsplash.com/photo-1564507592333-c60657eea523?auto=format&fit=crop&w=800&q=80",
  "taj mahal":
    "https://images.unsplash.com/photo-1564507592333-c60657eea523?auto=format&fit=crop&w=800&q=80",
  "jaipur":
    "https://images.unsplash.com/photo-1599661046289-e31897846e41?auto=format&fit=crop&w=800&q=80",
  "hawa mahal":
    "https://images.unsplash.com/photo-1599661046289-e31897846e41?auto=format&fit=crop&w=800&q=80",
  "the pink city":
    "https://images.unsplash.com/photo-1599661046289-e31897846e41?auto=format&fit=crop&w=800&q=80",
  "amer fort":
    "https://images.unsplash.com/photo-1599661046289-e31897846e41?auto=format&fit=crop&w=800&q=80",

  // ── Mumbai & Maharashtra ──
  "mumbai":
    "https://images.unsplash.com/photo-1570168007204-dfb528c6958f?auto=format&fit=crop&w=800&q=80",
  "marine drive":
    "https://images.unsplash.com/photo-1570168007204-dfb528c6958f?auto=format&fit=crop&w=800&q=80",
  "gateway of india":
    "https://images.unsplash.com/photo-1570168007204-dfb528c6958f?auto=format&fit=crop&w=800&q=80",

  // ── North India & Himalayas ──
  "manali":
    "https://images.unsplash.com/photo-1626621341517-bbf3d9990a23?auto=format&fit=crop&w=800&q=80",
  "solang":
    "https://images.unsplash.com/photo-1626621341517-bbf3d9990a23?auto=format&fit=crop&w=800&q=80",
  "rohtang":
    "https://images.unsplash.com/photo-1626621341517-bbf3d9990a23?auto=format&fit=crop&w=800&q=80",
  "shimla":
    "https://images.unsplash.com/photo-1597074866923-dc0589150358?auto=format&fit=crop&w=800&q=80",
  "nainital":
    "https://images.unsplash.com/photo-1610715936287-6c2ad208cdbf?auto=format&fit=crop&w=800&q=80",
  "leh":
    "https://images.unsplash.com/photo-1581793745862-99fde7fa73d2?auto=format&fit=crop&w=800&q=80",
  "ladakh":
    "https://images.unsplash.com/photo-1581793745862-99fde7fa73d2?auto=format&fit=crop&w=800&q=80",
  "kashmir":
    "https://images.unsplash.com/photo-1595815771614-ade9d652a65d?auto=format&fit=crop&w=800&q=80",
  "srinagar":
    "https://images.unsplash.com/photo-1595815771614-ade9d652a65d?auto=format&fit=crop&w=800&q=80",
  "kedarnath":
    "https://images.unsplash.com/photo-1519681393784-d120267933ba?auto=format&fit=crop&w=800&q=80",
  "darjeeling":
    "https://images.unsplash.com/photo-1597074866923-dc0589150358?auto=format&fit=crop&w=800&q=80",
  "shillong":
    "https://images.unsplash.com/photo-1590050752117-238cb0fb12b1?auto=format&fit=crop&w=800&q=80",
  "gangtok":
    "https://images.unsplash.com/photo-1597074866923-dc0589150358?auto=format&fit=crop&w=800&q=80",

  // ── Spiritual & Holy Cities ──
  "amritsar":
    "https://images.unsplash.com/photo-1605649487212-47bdab064df7?auto=format&fit=crop&w=800&q=80",
  "golden temple":
    "https://images.unsplash.com/photo-1605649487212-47bdab064df7?auto=format&fit=crop&w=800&q=80",
  "varanasi":
    "https://images.unsplash.com/photo-1561361513-2d000a50f0dc?auto=format&fit=crop&w=800&q=80",
  "banaras":
    "https://images.unsplash.com/photo-1561361513-2d000a50f0dc?auto=format&fit=crop&w=800&q=80",
  "kashi":
    "https://images.unsplash.com/photo-1561361513-2d000a50f0dc?auto=format&fit=crop&w=800&q=80",
  "rishikesh":
    "https://images.unsplash.com/photo-1598091383021-15ddea10925d?auto=format&fit=crop&w=800&q=80",
  "haridwar":
    "https://images.unsplash.com/photo-1598091383021-15ddea10925d?auto=format&fit=crop&w=800&q=80",
  "mathura":
    "https://images.unsplash.com/photo-1609342122563-a43ac8917a3a?auto=format&fit=crop&w=800&q=80",
  "vrindavan":
    "https://images.unsplash.com/photo-1609342122563-a43ac8917a3a?auto=format&fit=crop&w=800&q=80",
  "ayodhya":
    "https://images.unsplash.com/photo-1618773928121-c32242e63f39?auto=format&fit=crop&w=800&q=80",
  "ujjain":
    "https://images.unsplash.com/photo-1609342122563-a43ac8917a3a?auto=format&fit=crop&w=800&q=80",
  "puri":
    "https://images.unsplash.com/photo-1608958435020-e8a7109ba809?auto=format&fit=crop&w=800&q=80",
  "jagannath":
    "https://images.unsplash.com/photo-1608958435020-e8a7109ba809?auto=format&fit=crop&w=800&q=80",

  // ── South India ──
  "kerala":
    "https://images.unsplash.com/photo-1602216056096-3b40cc0c9944?auto=format&fit=crop&w=800&q=80",
  "alleppey":
    "https://images.unsplash.com/photo-1602216056096-3b40cc0c9944?auto=format&fit=crop&w=800&q=80",
  "alappuzha":
    "https://images.unsplash.com/photo-1602216056096-3b40cc0c9944?auto=format&fit=crop&w=800&q=80",
  "munnar":
    "https://images.unsplash.com/photo-1596401057633-54a8fe8ef647?auto=format&fit=crop&w=800&q=80",
  "coorg":
    "https://images.unsplash.com/photo-1590050752117-238cb0fb12b1?auto=format&fit=crop&w=800&q=80",
  "ooty":
    "https://images.unsplash.com/photo-1589182373726-e4f658ab50f0?auto=format&fit=crop&w=800&q=80",
  "kodaikanal":
    "https://images.unsplash.com/photo-1589182373726-e4f658ab50f0?auto=format&fit=crop&w=800&q=80",
  "gokarna":
    "https://images.unsplash.com/photo-1512343879784-a960bf40e7f2?auto=format&fit=crop&w=800&q=80",
  "hampi":
    "https://images.unsplash.com/photo-1548013146-72479768bada?auto=format&fit=crop&w=800&q=80",
  "mysore":
    "https://images.unsplash.com/photo-1599661046289-e31897846e41?auto=format&fit=crop&w=800&q=80",
  "mysuru":
    "https://images.unsplash.com/photo-1599661046289-e31897846e41?auto=format&fit=crop&w=800&q=80",
  "bangalore":
    "https://images.unsplash.com/photo-1596176530529-78163a4f7af2?auto=format&fit=crop&w=800&q=80",
  "bengaluru":
    "https://images.unsplash.com/photo-1596176530529-78163a4f7af2?auto=format&fit=crop&w=800&q=80",
  "chennai":
    "https://images.unsplash.com/photo-1582510003544-4d00b7f74220?auto=format&fit=crop&w=800&q=80",
  "pondicherry":
    "https://images.unsplash.com/photo-1582510003544-4d00b7f74220?auto=format&fit=crop&w=800&q=80",
  "puducherry":
    "https://images.unsplash.com/photo-1582510003544-4d00b7f74220?auto=format&fit=crop&w=800&q=80",
  "rameshwaram":
    "https://images.unsplash.com/photo-1582510003544-4d00b7f74220?auto=format&fit=crop&w=800&q=80",
  "hyderabad":
    "https://images.unsplash.com/photo-1605369572399-05d8d64a0f6e?auto=format&fit=crop&w=800&q=80",
  "kolkata":
    "https://images.unsplash.com/photo-1558431382-27e303142255?auto=format&fit=crop&w=800&q=80",
  "andaman":
    "https://images.unsplash.com/photo-1589308078059-be1415eab4c3?auto=format&fit=crop&w=800&q=80",
  "jodhpur":
    "https://images.unsplash.com/photo-1599661046289-e31897846e41?auto=format&fit=crop&w=800&q=80",
  "jaisalmer":
    "https://images.unsplash.com/photo-1547471080-7cc2caa01a7e?auto=format&fit=crop&w=800&q=80",
  "udaipur":
    "https://images.unsplash.com/photo-1615836245337-f5b9b2303f10?auto=format&fit=crop&w=800&q=80",

  // ── International Landmarks ──
  "paris":
    "https://images.unsplash.com/photo-1502602898657-3e91760cbb34?auto=format&fit=crop&w=800&q=80",
  "eiffel tower":
    "https://images.unsplash.com/photo-1502602898657-3e91760cbb34?auto=format&fit=crop&w=800&q=80",
  "london":
    "https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?auto=format&fit=crop&w=800&q=80",
  "tower bridge":
    "https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?auto=format&fit=crop&w=800&q=80",
  "city of london":
    "https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?auto=format&fit=crop&w=800&q=80",
  "greater london":
    "https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?auto=format&fit=crop&w=800&q=80",
  "dubai":
    "https://images.unsplash.com/photo-1512453979798-5ea266f8880c?auto=format&fit=crop&w=800&q=80",
  "new york":
    "https://images.unsplash.com/photo-1496442226666-8d4d0e62e6e9?auto=format&fit=crop&w=800&q=80",
  "tokyo":
    "https://images.unsplash.com/photo-1503899036084-c55cdd92da26?auto=format&fit=crop&w=800&q=80",
  "rome":
    "https://images.unsplash.com/photo-1552832230-c0197dd311b5?auto=format&fit=crop&w=800&q=80",
  "bali":
    "https://images.unsplash.com/photo-1537996194471-e657df975ab4?auto=format&fit=crop&w=800&q=80",
  "singapore":
    "https://images.unsplash.com/photo-1525625293386-3f8f99389edd?auto=format&fit=crop&w=800&q=80",
  "switzerland":
    "https://images.unsplash.com/photo-1530122037265-a5f1f91d3b99?auto=format&fit=crop&w=800&q=80",
  "maldives":
    "https://images.unsplash.com/photo-1514282401047-d79a71a590e8?auto=format&fit=crop&w=800&q=80",
  "bangkok":
    "https://images.unsplash.com/photo-1508009603885-50cf7c579365?auto=format&fit=crop&w=800&q=80",
  "sydney":
    "https://images.unsplash.com/photo-1506973035872-a4ec16b8e8d9?auto=format&fit=crop&w=800&q=80",
};

// Curated thematic fallbacks — strictly tailored so temples NEVER show hotels
const THEME_FALLBACKS = [
  {
    theme: "temple",
    keywords: ["temple", "mandir", "church", "cathedral", "mosque", "monastery", "spiritual", "shrine", "jyotirlinga", "gurudwara"],
    url: "https://images.unsplash.com/photo-1548013146-72479768bada?auto=format&fit=crop&w=800&q=80",
  },
  {
    theme: "beach",
    keywords: ["beach", "island", "sea", "ocean", "coast", "shore", "bay", "cove"],
    url: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=800&q=80",
  },
  {
    theme: "mountain",
    keywords: ["mountain", "hill", "peak", "valley", "himalaya", "trek", "snow", "alps", "ridge", "cliff", "pass"],
    url: "https://images.unsplash.com/photo-1519681393784-d120267933ba?auto=format&fit=crop&w=800&q=80",
  },
  {
    theme: "heritage",
    keywords: ["fort", "palace", "castle", "monument", "historic", "heritage", "mahal", "ruins", "haveli"],
    url: "https://images.unsplash.com/photo-1599661046289-e31897846e41?auto=format&fit=crop&w=800&q=80",
  },
  {
    theme: "water",
    keywords: ["lake", "river", "falls", "waterfall", "stream", "dam", "ghat"],
    url: "https://images.unsplash.com/photo-1610715936287-6c2ad208cdbf?auto=format&fit=crop&w=800&q=80",
  },
  {
    theme: "nature",
    keywords: ["forest", "jungle", "wildlife", "safari", "national park", "sanctuary", "nature", "garden", "valley"],
    url: "https://images.unsplash.com/photo-1590050752117-238cb0fb12b1?auto=format&fit=crop&w=800&q=80",
  },
  {
    theme: "city",
    keywords: ["city", "town", "urban", "metro", "street", "capital", "downtown"],
    url: "https://images.unsplash.com/photo-1570168007204-dfb528c6958f?auto=format&fit=crop&w=800&q=80",
  },
];

/**
 * Normalizes destination strings for reliable matching against known locations.
 */
export function normalizeDestinationName(name) {
  if (!name || typeof name !== "string") return "";
  let s = name.trim().toLowerCase();

  // Strip prefixes
  s = s.replace(/^(trip to|visit|explore|tour of|holiday in|vacation in)\s+/i, "");
  s = s.replace(/^(the city of|city of|the|shree|sri|holy)\s+/i, "");

  // If there are commas (e.g. "Shree Somnath Temple, Gujarat, India"), focus on landmark / city
  if (s.includes(",")) {
    const firstPart = s.split(",")[0].trim();
    if (firstPart) return firstPart;
  }

  return s.trim();
}

/**
 * Returns an authentic, high-resolution scenic photo URL for any given destination.
 *
 * Fallback Hierarchy:
 * 1. Stored customImageUrl if provided and valid
 * 2. Exact match in DESTINATION_IMAGE_MAP
 * 3. Normalized string match in DESTINATION_IMAGE_MAP
 * 4. Word/keyword match against DESTINATION_IMAGE_MAP keys
 * 5. Thematic category fallback (temple, beach, mountain, fort, etc.)
 * 6. Clean scenic landscape vista (never a hotel room with luggage)
 */
export function getDestinationImageUrl(destinationName, customImageUrl = null) {
  // 1. Existing stored image URL if valid
  if (customImageUrl && typeof customImageUrl === "string" && customImageUrl.startsWith("http")) {
    return customImageUrl;
  }

  if (!destinationName || typeof destinationName !== "string") {
    return DEFAULT_TRAVEL_FALLBACK;
  }

  const raw = destinationName.trim().toLowerCase();

  // 2. Direct exact match
  if (DESTINATION_IMAGE_MAP[raw]) {
    return DESTINATION_IMAGE_MAP[raw];
  }

  // 3. Normalized match
  const normalized = normalizeDestinationName(raw);
  if (normalized && DESTINATION_IMAGE_MAP[normalized]) {
    return DESTINATION_IMAGE_MAP[normalized];
  }

  // Handle specific spelling variants like panchmarhi / pachmarhi
  if (raw.includes("panchmarhi") || raw.includes("pachmarhi")) {
    return DESTINATION_IMAGE_MAP["panchmarhi"];
  }

  // Handle Somnath variations (e.g. "Shree Somnath Jyotirlinga Temple, Gujarat")
  if (raw.includes("somnath") || normalized.includes("somnath")) {
    return DESTINATION_IMAGE_MAP["somnath"];
  }

  // 4. Substring / Token match against known destinations
  for (const [key, url] of Object.entries(DESTINATION_IMAGE_MAP)) {
    if (key.length > 2 && (raw.includes(key) || (normalized && normalized.includes(key)))) {
      return url;
    }
  }

  // 5. Thematic category fallback based on keywords (temple, beach, mountain, fort, etc.)
  for (const theme of THEME_FALLBACKS) {
    if (theme.keywords.some((kw) => raw.includes(kw) || (normalized && normalized.includes(kw)))) {
      return theme.url;
    }
  }

  // 6. Clean scenic panoramic travel vista as final fallback
  return DEFAULT_TRAVEL_FALLBACK;
}

export const getDestinationImage = getDestinationImageUrl;

/**
 * Error fallback handler for <img> elements.
 * Prevents broken image icons and provides an appropriate thematic or scenic image.
 */
export function handleImageError(event) {
  if (!event || !event.target) return;
  event.target.onerror = null; // prevent loop
  const altText = (event.target.alt || "").toLowerCase();

  for (const theme of THEME_FALLBACKS) {
    if (theme.keywords.some((kw) => altText.includes(kw))) {
      event.target.src = theme.url;
      return;
    }
  }

  event.target.src = DEFAULT_TRAVEL_FALLBACK;
}
