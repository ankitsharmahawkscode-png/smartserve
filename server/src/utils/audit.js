const AuditLog = require('../models/AuditLog');

exports.logAudit = (actor, action, entity, entityId, meta = {}) =>
  AuditLog.create({ actor: actor && (actor._id || actor.id), action, entity, entityId, meta }).catch((e) =>
    console.error('Audit log failed:', e.message)
  );