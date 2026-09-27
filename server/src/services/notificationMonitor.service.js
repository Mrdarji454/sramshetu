import { Booking } from '../models/Booking.model.js';
import { Worker } from '../models/Worker.model.js';
import { safelyNotify, notifyAdmins, notifyWorker } from './notification.service.js';
import { generateZoneShiftRecommendations } from './zoneShift.service.js';

export async function scanNotificationReminders(now = new Date()) {
  return safelyNotify(async () => {
    const day = now.toISOString().slice(0, 10);
    const soon = new Date(now.getTime() + 30 * 86400000);
    const paths = ['documents.aadhaar.expiresAt', 'documents.addressProof.expiresAt', 'documents.eshramCard.expiresAt'];
    const workers = Worker.find({ $or: paths.map(path => ({ [path]: { $gte: now, $lte: soon } })) }).cursor();
    for await (const worker of workers) {
      for (const [kind, document] of Object.entries(worker.documents?.toObject?.() || worker.documents || {})) {
        if (document?.expiresAt && document.expiresAt >= now && document.expiresAt <= soon) await notifyWorker(worker._id, {
          type: 'DOCUMENT_EXPIRY', title: 'Document expiry reminder',
          message: `Your ${kind} expires on ${document.expiresAt.toISOString().slice(0, 10)}. Please renew it.`,
          eventKey: `expiry:${worker._id}:${kind}:${document.expiresAt.toISOString()}`,
        });
      }
    }
    const threshold = Math.max(1, Number(process.env.NOTIFICATION_DEMAND_THRESHOLD) || 20);
    const districts = await Booking.aggregate([
      { $match: { status: { $in: ['PENDING', 'pending', 'ASSIGNED', 'assigned'] }, createdAt: { $gte: new Date(now.getTime() - 86400000) } } },
      { $group: { _id: { $ifNull: ['$location.serviceAddress.district', '$location.serviceAddress.city'] }, count: { $sum: 1 } } },
    ]);
    for (const district of districts) {
      if (!district._id) continue;
      if (district.count >= threshold) await notifyAdmins({ type: 'HIGH_DEMAND', title: 'High-demand area alert', message: `${district._id} has ${district.count} pending or assigned bookings from the last 24 hours.`, eventKey: `demand:${district._id}:${day}` });
      const available = await Worker.countDocuments({ 'availability.status': 'available', 'verificationStatus.status': 'verified', $or: [{ 'address.district': district._id }, { 'address.city': district._id }, { 'location.address.city': district._id }] });
      if (available === 0) await notifyAdmins({ type: 'WORKER_SHORTAGE', title: 'Worker shortage alert', message: `${district._id} has open bookings and no available verified workers.`, eventKey: `shortage:${district._id}:${day}` });
    }

    const recommendations = await generateZoneShiftRecommendations(now);
    if (recommendations.length > 0) {
      await notifyAdmins({
        type: 'ZONE_SHIFT_RECOMMENDATION',
        title: 'Recommended zone reallocation',
        message: `There are ${recommendations.length} zone shift opportunities based on active demand and worker availability.`,
        eventKey: `zone-shift-summary:${now.toISOString().slice(0, 10)}`,
      });
    }
  });
}

export function startNotificationMonitor() {
  let running = false;
  const run = async () => {
    if (running) return;
    running = true;
    try { await scanNotificationReminders(); } finally { running = false; }
  };
  void run();
  const timer = setInterval(run, 2 * 60 * 60 * 1000);
  timer.unref();
  return () => clearInterval(timer);
}
