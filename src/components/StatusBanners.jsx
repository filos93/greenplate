export function StatusBanners({ isQuotaExceeded, isOffline, quotaStats }) {
  return (
    <>
      {isQuotaExceeded && (
        <div style={{ margin: '1.5rem 0' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 'bold', color: '#ff7b72', marginBottom: '0.5rem' }}>
            <span>⚡</span>
            <span>Daily API Quota Reached ({quotaStats.used}/{quotaStats.max} searches used):</span>
          </div>
          <p style={{ margin: 0, opacity: 0.9, lineHeight: 1.5 }}>
            Live search is paused for today. You can still search, save, and export all offline recipes! Your daily API limit resets at midnight.
          </p>
        </div>
      )}

      {isOffline && !isQuotaExceeded && (
        <div style={{ margin: '1.5rem 0' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 'bold', color: '#e3b341', marginBottom: '0.5rem' }}>
            <span>📡</span>
            <span>You Are Currently Offline (No Internet Connection):</span>
          </div>
          <p style={{ margin: 0, opacity: 0.9, lineHeight: 1.5 }}>
            Live search is unavailable. You can still search, save, and export all offline recipes!
          </p>
        </div>
      )}
    </>
  );
}