import { useNetworkStatus } from '../../hooks/useNetworkStatus';
import { WifiOff, RefreshCw, AlertTriangle, CheckCircle } from 'lucide-react';
import './NetworkStatusBanner.css';

export default function NetworkStatusBanner() {
  const {
    isOnline,
    pendingCount,
    isSyncing,
    hasConflict,
    hasFailed,
    justSyncCompleted
  } = useNetworkStatus();

  // If online, fully synced, and no conflicts/notices, do not render banner
  if (isOnline && pendingCount === 0 && !isSyncing && !hasConflict && !hasFailed && !justSyncCompleted) {
    return null;
  }

  let bannerClass = 'network-banner';
  let icon = <WifiOff size={16} />;
  let message = '';

  if (!isOnline) {
    bannerClass += ' network-banner--offline';
    icon = <WifiOff size={16} />;
    message = `You're offline — changes will be saved and synchronized when you're back online.${pendingCount > 0 ? ` (${pendingCount} pending change${pendingCount > 1 ? 's' : ''})` : ''}`;
  } else if (hasConflict || hasFailed) {
    bannerClass += ' network-banner--conflict';
    icon = <AlertTriangle size={16} />;
    message = 'Some changes need your attention (conflicts or sync errors detected).';
  } else if (pendingCount > 0 || isSyncing) {
    bannerClass += ' network-banner--syncing';
    icon = <RefreshCw size={16} className="spin-icon" />;
    message = `Back online — synchronizing ${pendingCount} change${pendingCount > 1 ? 's' : ''}...`;
  } else if (justSyncCompleted) {
    bannerClass += ' network-banner--success';
    icon = <CheckCircle size={16} />;
    message = 'All changes synchronized.';
  }

  return (
    <div className={bannerClass} role="status" aria-live="polite">
      <div className="network-banner-content">
        <span className="network-banner-icon">{icon}</span>
        <span className="network-banner-text">{message}</span>
      </div>
    </div>
  );
}
