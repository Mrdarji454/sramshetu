export const POPULAR_PROFESSIONS = [
  ...[
    ['cleaning', 'Cleaning', 'Cleaner'], ['gardening', 'Gardening', 'Gardener'],
    ['driver', 'Driver', 'Driver'], ['domestic', 'Domestic Help', 'Domestic Help'],
    ['caregiver', 'Caregiver', 'Caregiver'], ['technician', 'Technician', 'Technician'],
  ].map(([id, tradeName, shortName]) => ({ id, tradeName, shortName, hindiName: '', tags: [tradeName.toLowerCase(), shortName.toLowerCase()] })),
  {
    id: 'electrical',
    tradeName: 'Electrical & Power Systems',
    shortName: 'Electrician',
    hindiName: 'इलेक्ट्रीशियन',
    tags: ['electrician', 'wiring', 'fuse', 'mcb', 'lighting', 'fan', 'switchboard', 'inverter', 'short circuit', 'current', 'power', 'board', 'tripping'],
  },
  {
    id: 'plumbing',
    tradeName: 'Plumbing & Sanitation',
    shortName: 'Plumber',
    hindiName: 'प्लंबर / नलसाज',
    tags: ['plumber', 'pipe', 'leak', 'tap', 'drain', 'toilet', 'flush', 'sink', 'motor', 'tank', 'valve', 'sanitary', 'water leakage', 'bathroom'],
  },
  {
    id: 'carpentry',
    tradeName: 'Carpentry & Woodwork',
    shortName: 'Carpenter',
    hindiName: 'बढ़ई / कारपेंटर',
    tags: ['carpenter', 'wood', 'door', 'lock', 'furniture', 'cabinet', 'hinge', 'table', 'chair', 'bed', 'wooden', 'latch', 'window'],
  },
  {
    id: 'masonry',
    tradeName: 'Masonry & Civil Works',
    shortName: 'Mason',
    hindiName: 'राजमिस्त्री',
    tags: ['mason', 'brick', 'cement', 'plaster', 'tile', 'flooring', 'wall', 'crack', 'concrete', 'marble', 'granite', 'renovation'],
  },
  {
    id: 'painting',
    tradeName: 'Painting & Surface Finishing',
    shortName: 'Painter',
    hindiName: 'पेंटर / पुताई',
    tags: ['paint', 'color', 'distemper', 'texture', 'primer', 'wall painting', 'whitewash', 'enamel', 'dampness', 'waterproofing'],
  },
  {
    id: 'hvac',
    tradeName: 'HVAC & Air Conditioning',
    shortName: 'AC / HVAC Tech',
    hindiName: 'एसी मैकेनिक',
    tags: ['ac', 'air conditioner', 'cooling', 'gas refill', 'servicing', 'compressor', 'split ac', 'window ac', 'hvac', 'duct'],
  },
  {
    id: 'welding',
    tradeName: 'Welding & Metal Fabrication',
    shortName: 'Welder / Fabricator',
    hindiName: 'वेल्डर / फैब्रिकेटर',
    tags: ['weld', 'welding', 'iron gate', 'grill', 'metal', 'fabrication', 'shutter', 'steel', 'railing', 'welder'],
  },
];

/**
 * Maps free-text natural language job description to a matching trade category
 * @param {string} text - Raw customer job description
 * @returns {object|null} - Matched trade object or null
 */
export function detectTradeFromJobDescription(text) {
  if (!text || typeof text !== 'string') return null;
  const lower = text.toLowerCase();

  for (const prof of POPULAR_PROFESSIONS) {
    for (const tag of prof.tags) {
      if (new RegExp('(^|[^a-z])' + tag + '([^a-z]|$)', 'i').test(lower)) {
        return prof;
      }
    }
  }

  return null;
}

