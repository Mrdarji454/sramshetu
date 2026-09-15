import { Service } from '../models/Service.model.js';
import mongoose from 'mongoose';

// Initial pre-seeded catalog of standardized cooperative services
export const DEFAULT_SERVICES = [
  {
    id: 'srv-elec-01',
    _id: '65f123456789012345678911',
    name: 'Electrical & Power Systems',
    category: 'Electrical',
    hindiName: 'बिजली व वायरिंग',
    description: 'Residential rewiring, commercial 3-phase setups, solar inverters, and switchgear maintenance.',
    estimatedPrice: {
      floorRate: 450,
      rateUnit: 'per_hour',
      dailyFloorRate: 1200,
      currency: 'INR',
    },
    activeStatus: true,
    badge: 'High Demand',
    icon: 'Zap',
    requiredCertifications: ['NSDC Electrician Level 4', 'Aadhaar e-KYC'],
    tags: ['wiring', 'inverter', 'electrician', 'switchboard', 'mcb', 'lighting'],
  },
  {
    id: 'srv-plumb-02',
    _id: '65f123456789012345678912',
    name: 'Plumbing & Water Sanitation',
    category: 'Plumbing',
    hindiName: 'प्लंबिंग व जल प्रबंधन',
    description: 'High-pressure pipeline routing, motor pump installations, drainage troubleshooting, and bathroom fittings.',
    estimatedPrice: {
      floorRate: 400,
      rateUnit: 'per_hour',
      dailyFloorRate: 1050,
      currency: 'INR',
    },
    activeStatus: true,
    badge: 'Essential',
    icon: 'Droplets',
    requiredCertifications: ['NSDC Plumber Level 3', 'Aadhaar e-KYC'],
    tags: ['pipeline', 'leakage', 'plumbing', 'motor pump', 'sanitation', 'taps'],
  },
  {
    id: 'srv-carp-03',
    _id: '65f123456789012345678913',
    name: 'Carpentry & Woodwork',
    category: 'Carpentry',
    hindiName: 'बढ़ईगीरी व फर्नीचर',
    description: 'Modular kitchen assembly, customized solid woodwork, door frame restoration, and hardware fitting.',
    estimatedPrice: {
      floorRate: 480,
      rateUnit: 'per_hour',
      dailyFloorRate: 1250,
      currency: 'INR',
    },
    activeStatus: true,
    badge: 'Precision Craft',
    icon: 'Wrench',
    requiredCertifications: ['NSDC Carpenter Level 4', 'Aadhaar e-KYC'],
    tags: ['woodwork', 'furniture', 'door', 'kitchen', 'wardrobe', 'carpentry'],
  },
  {
    id: 'srv-mas-04',
    _id: '65f123456789012345678914',
    name: 'Civil Construction & Masonry',
    category: 'Masonry',
    hindiName: 'भवन निर्माण व राजमिस्त्री',
    description: 'Structural bricklaying, tile & granite flooring, plastering, waterproofing, and renovation civil work.',
    estimatedPrice: {
      floorRate: 550,
      rateUnit: 'per_hour',
      dailyFloorRate: 1400,
      currency: 'INR',
    },
    activeStatus: true,
    badge: 'Guild Certified',
    icon: 'Hammer',
    requiredCertifications: ['NSDC Mason Level 4', 'Aadhaar e-KYC'],
    tags: ['masonry', 'tiles', 'brickwork', 'plaster', 'waterproofing', 'civil'],
  },
  {
    id: 'srv-paint-05',
    _id: '65f123456789012345678915',
    name: 'Professional Painting & Surface Coating',
    category: 'Painting',
    hindiName: 'पुताई व रंगाई',
    description: 'Interior emulsion, exterior weatherproof coats, anti-damp primer treatment, and texture stencil painting.',
    estimatedPrice: {
      floorRate: 380,
      rateUnit: 'per_hour',
      dailyFloorRate: 980,
      currency: 'INR',
    },
    activeStatus: true,
    badge: 'Guaranteed Finish',
    icon: 'Paintbrush',
    requiredCertifications: ['Aadhaar e-KYC'],
    tags: ['painting', 'whitewash', 'distemper', 'waterproof', 'surface coat'],
  },
  {
    id: 'srv-app-06',
    _id: '65f123456789012345678916',
    name: 'Appliance Diagnostics & Repair',
    category: 'Appliance Repair',
    hindiName: 'उपकरण मरम्मत',
    description: 'Diagnosis and servicing of inverter ACs, double-door refrigerators, semi/fully automatic washing machines.',
    estimatedPrice: {
      floorRate: 420,
      rateUnit: 'per_hour',
      dailyFloorRate: 1100,
      currency: 'INR',
    },
    activeStatus: true,
    badge: 'Component Warranty',
    icon: 'Flame',
    requiredCertifications: ['NSDC Appliance Technician', 'Aadhaar e-KYC'],
    tags: ['appliance', 'ac repair', 'refrigerator', 'washing machine', 'geyser'],
  },
];

// In-memory services catalog
export const inMemoryServices = new Map();
DEFAULT_SERVICES.forEach((s) => {
  inMemoryServices.set(String(s._id), { ...s });
  inMemoryServices.set(s.id, { ...s });
});

export class CatalogService {
  /**
   * Get all active services with optional search & category filter
   */
  static async getServices({ category, search } = {}) {
    if (mongoose.connection.readyState === 1) {
      const query = { activeStatus: true };
      if (category && category !== 'All') {
        query.category = new RegExp(category, 'i');
      }
      if (search) {
        query.$or = [
          { name: new RegExp(search, 'i') },
          { description: new RegExp(search, 'i') },
          { tags: new RegExp(search, 'i') },
        ];
      }

      const services = await Service.find(query).sort({ name: 1 });
      if (services && services.length > 0) {
        return services;
      }
      // If DB is empty, seed defaults
      try {
        await Service.insertMany(DEFAULT_SERVICES);
        return await Service.find(query).sort({ name: 1 });
      } catch {
        // Fallback to in-memory if DB write fails
      }
    }

    // In-memory lookup
    const seen = new Set();
    const result = [];
    for (const [, s] of inMemoryServices) {
      if (seen.has(s.name)) continue;
      seen.add(s.name);

      if (category && category !== 'All') {
        if (!s.category.toLowerCase().includes(category.toLowerCase())) {
          continue;
        }
      }
      if (search) {
        const q = search.toLowerCase();
        const matchesName = s.name.toLowerCase().includes(q);
        const matchesDesc = s.description.toLowerCase().includes(q);
        const matchesTags = (s.tags || []).some((t) => t.toLowerCase().includes(q));
        if (!matchesName && !matchesDesc && !matchesTags) {
          continue;
        }
      }
      result.push(s);
    }
    return result;
  }

  /**
   * Get service by ID
   */
  static async getServiceById(serviceId) {
    const cleanId = String(serviceId);

    if (mongoose.connection.readyState === 1) {
      if (mongoose.Types.ObjectId.isValid(cleanId)) {
        const s = await Service.findById(cleanId);
        if (s) return s;
      }
    }

    // In-memory lookup
    if (inMemoryServices.has(cleanId)) {
      return inMemoryServices.get(cleanId);
    }

    for (const [, s] of inMemoryServices) {
      if (String(s._id) === cleanId || s.id === cleanId || s.name.toLowerCase() === cleanId.toLowerCase()) {
        return s;
      }
    }

    return null;
  }
}

