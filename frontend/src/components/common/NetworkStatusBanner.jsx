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
    icon = <WifiOff size={18} />;
    message = `System Offline — Working in Offline Mode (${pendingCount > 0 ? `${pendingCount} change${pendingCount > 1 ? 's' : ''} saved locally` : 'All changes saved locally'})`;
  } else if (hasConflict || hasFailed) {
    bannerClass += ' network-banner--conflict';
    icon = <AlertTriangle size={18} />;
    message = 'System Notice — Some changes require sync attention.';
  } else if (pendingCount > 0 || isSyncing) {
    bannerClass += ' network-banner--syncing';
    icon = <RefreshCw size={18} className="spin-icon" />;
    message = `System Syncing — Uploading ${pendingCount} offline change${pendingCount > 1 ? 's' : ''}...`;
  } else if (justSyncCompleted) {
    bannerClass += ' network-banner--success';
    icon = <CheckCircle size={18} />;
    message = 'System Online — All offline changes synchronized!';
  }

  return (
    <div className={bannerClass} role="status" aria-live="polite">
      <div className="network-banner-content">
        <span className="network-banner-badge">OFFLINE MODE</span>
        <span className="network-banner-icon">{icon}</span>
        <span className="network-banner-text">{message}</span>
      </div>
    </div>
  );
}
