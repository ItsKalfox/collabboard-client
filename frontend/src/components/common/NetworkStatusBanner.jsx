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

  // If online, fully synced, and no active notifications, do not render toast
  if (isOnline && pendingCount === 0 && !isSyncing && !hasConflict && !hasFailed && !justSyncCompleted) {
    return null;
  }

  let toastClass = 'offline-toast';
  let icon = <WifiOff size={20} />;
  let title = '';
  let subtitle = '';

  if (!isOnline) {
    toastClass += ' offline-toast--offline';
    icon = <WifiOff size={20} />;
    title = "You're offline";
    subtitle = pendingCount > 0 
      ? `Changes will be saved and synced when you're back online (${pendingCount} saved).`
      : "Changes will be saved and synced when you're back online.";
  } else if (hasConflict || hasFailed) {
    toastClass += ' offline-toast--conflict';
    icon = <AlertTriangle size={20} />;
    title = "Sync Attention Required";
    subtitle = "Some offline changes need your review.";
  } else if (pendingCount > 0 || isSyncing) {
    toastClass += ' offline-toast--syncing';
    icon = <RefreshCw size={20} className="spin-icon" />;
    title = "You're back online";
    subtitle = `Syncing your changes... (${pendingCount} remaining)`;
  } else if (justSyncCompleted) {
    toastClass += ' offline-toast--success';
    icon = <CheckCircle size={20} />;
    title = "All changes synced";
    subtitle = "Your offline changes have been saved to the server.";
  }

  return (
    <div className={toastClass} role="status" aria-live="polite">
      <div className="offline-toast-icon">{icon}</div>
      <div className="offline-toast-body">
        <div className="offline-toast-title">{title}</div>
        <div className="offline-toast-subtitle">{subtitle}</div>
      </div>
    </div>
  );
}
