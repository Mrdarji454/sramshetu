import { aiService } from './ai.service.js';

const aliases = [
  ['electrical', 'electrician', 'electrical & power systems', 'master industrial electrician'],
  ['plumbing', 'plumber', 'plumbing & sanitation', 'plumbing & water sanitation'],
  ['carpentry', 'carpenter', 'carpentry & woodwork'],
  ['painting', 'painter', 'painting & surface finishing'],
  ['hvac', 'ac repair', 'ac / hvac tech', 'air conditioning', 'hvac & air conditioning'],
  ['cleaning', 'cleaner'], ['gardening', 'gardener'], ['driver', 'driving'],
  ['domestic help', 'domestic worker'], ['caregiver', 'caregiving'],
  ['masonry', 'mason', 'masonry & civil works', 'civil construction & masonry'],
  ['welding', 'welder', 'welder / fabricator', 'welding & metal fabrication'],
];
export function normalizeProfession(value = '') {
  const text = String(value).trim().toLowerCase();
  return aliases.find(group => group.includes(text))?.[0] || text;
}
export function professionMatches(value, query) {
  const a = normalizeProfession(value), b = normalizeProfession(query);
  return Boolean(a && b && (a === b || a.includes(b)));
}
export function manualRank(a, b) {
  return Number(b.exactProfession) - Number(a.exactProfession)
    || Number(b.skillMatch) - Number(a.skillMatch)
    || a.distance - b.distance
    || Number(b.availability.status === 'available') - Number(a.availability.status === 'available')
    || b.rating - a.rating
    || String(a.worker.id).localeCompare(String(b.worker.id));
}

// Only accepts an ordering of eligible candidates; AI cannot introduce workers.
export async function rankWithAiFallback(candidates, context, client = aiService.client) {
  const fallback = [...candidates].sort(manualRank);
  if (!candidates.length) return { workers: fallback, rankingEngine: 'manual' };
  try {
    const response = await client.post('/match/workers', {
      query: context.query,
      cooperative_preference: context.cooperativePreference || null,
      candidates: candidates.map(item => ({
        id: String(item.worker.id), profession: item.worker.primaryTrade,
        skills: item.skills, distance: item.distance, availability: item.availability.status,
        rating: item.rating, workload: item.workload || 0, cooperative_id: item.cooperative?.id || null,
      })),
    }, { timeout: 1200 });
    const ids = response.data?.rankedWorkerIds;
    const byId = new Map(candidates.map(item => [String(item.worker.id), item]));
    if (!Array.isArray(ids) || ids.length !== candidates.length || new Set(ids).size !== ids.length || ids.some(id => !byId.has(id))) throw new Error('Invalid ranking');
    return { workers: ids.map(id => byId.get(id)), rankingEngine: 'ai' };
  } catch {
    return { workers: fallback, rankingEngine: 'manual' };
  }
}
