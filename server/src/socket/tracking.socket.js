const Booking = require('../models/Booking');

// In-memory live locations (last known position)
// Format: { [bookingId]: { lat, lng, updatedAt, techId } }
const liveLocations = new Map();

module.exports = (io) => {
  io.on('connection', (socket) => {
    console.log('socket connected:', socket.id);

    // Technician joins a booking room
    socket.on('tech:join', ({ bookingId, techId }) => {
      socket.join(`booking:${bookingId}`);
      socket.data.bookingId = bookingId;
      socket.data.techId = techId;
      socket.data.role = 'technician';
    });

    // Customer joins a booking room
    socket.on('customer:join', ({ bookingId }) => {
      socket.join(`booking:${bookingId}`);
      socket.data.bookingId = bookingId;
      socket.data.role = 'customer';

      // Send last known location immediately
      const loc = liveLocations.get(bookingId);
      if (loc) socket.emit('tech:location', loc);
    });

    // Technician sends location update
    socket.on('tech:location', ({ bookingId, lat, lng }) => {
      if (!bookingId || typeof lat !== 'number' || typeof lng !== 'number') return;

      const payload = {
        bookingId,
        lat,
        lng,
        updatedAt: new Date().toISOString(),
      };

      liveLocations.set(bookingId, payload);

      // Broadcast to everyone in that booking room
      io.to(`booking:${bookingId}`).emit('tech:location', payload);
    });

    // Technician stops sharing
    socket.on('tech:stop', ({ bookingId }) => {
      liveLocations.delete(bookingId);
      io.to(`booking:${bookingId}`).emit('tech:stopped', { bookingId });
    });

    socket.on('disconnect', () => {
      console.log('socket disconnected:', socket.id);
    });
  });
};

// Export for controllers to use
module.exports.liveLocations = liveLocations;