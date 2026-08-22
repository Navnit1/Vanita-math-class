import AuditLog from '../models/AuditLog.js'
import logger from './logger.js'

/**
 * Records an audit log entry. Never throws — a logging failure must not
 * break the calling request, so errors are caught and logged separately.
 */
export const recordAudit = async ({ action, user, targetType, targetId, description, metadata, req }) => {
  try {
    await AuditLog.create({
      action,
      performedBy: user?._id,
      performedByName: user?.name,
      performedByRole: user?.role,
      targetType,
      targetId,
      description,
      metadata,
      ipAddress: req?.ip,
    })
  } catch (err) {
    logger.error('Failed to record audit log:', err)
  }
}
