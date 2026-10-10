// src/components/QuotaBadge.jsx
import { getQuotaStatus } from '../utils/quota';

export function QuotaBadge({ feature }) {
  const { used, max, remaining, isExceeded } = getQuotaStatus(feature);

  return (
    <div className={`quota-badge ${isExceeded ? 'exceeded' : ''}`}>
      <span className="quota-icon">{isExceeded ? '⚠️' : '⚡'}</span>
      <span className="quota-text">
        Daily Quota: <strong>{used}/{max}</strong> used
        {!isExceeded && ` (${remaining} left)`}
      </span>
    </div>
  );
}