import { Server } from 'socket.io';
import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';
import { User } from '../models/User.model.js';
import { config } from '../config/env.js';
import { notificationRoom, setNotificationTransport } from '../services/notification.service.js';

export function initializeNotifications(server) {
  const io = new Server(server, { cors: { origin: config.clientUrl, credentials: true }, maxHttpBufferSize: 16384 });
  io.use(async (socket, next) => {
    try {
      if (mongoose.connection.readyState !== 1) throw new Error('Database unavailable');
      const claims = jwt.verify(socket.handshake.auth?.token, config.jwt.secret);
      const user = await User.findById(claims.id).select('_id role isActive');
      if (!user?.isActive) throw new Error('Inactive account');
      socket.data.user = user;
      socket.data.expiresAt = claims.exp * 1000;
      next();
    } catch { next(new Error('Authentication required')); }
  });
  io.on('connection', socket => {
    const user = socket.data.user;
    // Clients cannot choose rooms or recipients.
    socket.join(notificationRoom(user._id, user.role));
    const expire = setTimeout(() => socket.disconnect(true), Math.min(Math.max(socket.data.expiresAt - Date.now(), 0), 2147483647));
    const recheck = setInterval(async () => {
      try {
        const current = await User.findById(user._id).select('role isActive');
        if (!current?.isActive || current.role !== user.role) socket.disconnect(true);
      } catch { socket.disconnect(true); }
    }, 60000);
    socket.on('disconnect', () => { clearTimeout(expire); clearInterval(recheck); });
  });
  setNotificationTransport(io);
  return io;
}
