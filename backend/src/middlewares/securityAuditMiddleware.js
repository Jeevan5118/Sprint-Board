const db = require('../config/database');

const MAX_REASON_LEN = 160;

const normalizeReason = (body, fallbackStatus) => {
  if (!body) return `HTTP_${fallbackStatus}`;
  if (body.message) return String(body.message).slice(0, MAX_REASON_LEN);
  if (Array.isArray(body.errors) && body.errors.length > 0) {
    const first = body.errors[0];
    const msg = first.msg || first.message || JSON.stringify(first);
    return String(msg).slice(0, MAX_REASON_LEN);
  }
  return `HTTP_${fallbackStatus}`;
};

const shouldAudit = (statusCode, reason) => {
  const normalized = String(reason || '').toLowerCase();
  const isForbidden = statusCode === 403;
  const isCrossTeamAttempt =
    normalized.includes('access denied') ||
    normalized.includes('not a member of this project') ||
    normalized.includes('not a member of this team');
  const isWipViolation = normalized.includes('wip limit');

  return isForbidden || isCrossTeamAttempt || isWipViolation;
};

const securityAuditMiddleware = (req, res, next) => {
  let responseBody;
  const originalJson = res.json.bind(res);

  res.json = (body) => {
    responseBody = body;
    return originalJson(body);
  };

  res.on('finish', () => {
    const statusCode = res.statusCode;
    const reason = normalizeReason(responseBody, statusCode);

    if (!shouldAudit(statusCode, reason)) {
      return;
    }

    const userId = req.user?.id || null;
    const endpoint = req.originalUrl || req.url;
    const action = `${req.method} ${reason}`.slice(0, 255);
    const auditStatus = statusCode >= 400 ? 'denied' : 'allowed';

    // Fire-and-forget insert to keep request flow non-blocking.
    setImmediate(() => {
      db.query(
        'INSERT INTO security_logs (user_id, endpoint, action, status) VALUES (?, ?, ?, ?)',
        [userId, endpoint, action, auditStatus]
      ).catch((error) => {
        console.error('[security_audit_insert_failed]', {
          userId,
          endpoint,
          action,
          status: auditStatus,
          code: error?.code,
          errno: error?.errno,
          message: error?.message
        });
      });
    });
  });

  next();
};

module.exports = securityAuditMiddleware;
