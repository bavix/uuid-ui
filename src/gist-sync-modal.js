import { useState, useEffect } from 'preact/hooks';
import { toast } from 'sonner';
import {
  GistSync,
  getGistToken,
  saveGistToken,
  removeGistToken,
  getLastSyncTimestamp,
  saveLastSyncTimestamp
} from './gist-sync.js';

export default function GistSyncModal({ 
  isOpen, 
  onClose, 
  items, 
  favorites,
  onRestore,
  isToggled 
}) {
  const [token, setToken] = useState('');
  const [isConnected, setIsConnected] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isRestoring, setIsRestoring] = useState(false);
  const [lastSync, setLastSync] = useState(null);
  const [showToken, setShowToken] = useState(false);

  useEffect(() => {
    if (isOpen) {
      const savedToken = getGistToken();
      if (savedToken) {
        setToken(savedToken);
        setIsConnected(true);
      }
      const savedLastSync = getLastSyncTimestamp();
      if (savedLastSync) {
        setLastSync(savedLastSync);
      }
    }
  }, [isOpen]);

  const handleConnect = async () => {
    if (!token.trim()) {
      toast.error('Please enter a GitHub token');
      return;
    }

    setIsSyncing(true);
    try {
      const gistSync = new GistSync(token.trim());
      const isValid = await gistSync.validateToken();
      
      if (isValid) {
        saveGistToken(token.trim());
        setIsConnected(true);
        toast.success('Connected to GitHub', {
          description: 'Your token has been saved securely'
        });
      } else {
        toast.error('Invalid token', {
          description: 'Please check your GitHub personal access token'
        });
      }
    } catch (error) {
      toast.error('Connection failed', {
        description: error.message
      });
    } finally {
      setIsSyncing(false);
    }
  };

  const handleDisconnect = () => {
    removeGistToken();
    setToken('');
    setIsConnected(false);
    setLastSync(null);
    toast.success('Disconnected from GitHub');
  };

  const handleSync = async () => {
    const savedToken = getGistToken();
    if (!savedToken) {
      toast.error('Not connected to GitHub');
      return;
    }

    setIsSyncing(true);
    try {
      const gistSync = new GistSync(savedToken);
      await gistSync.syncToGist(items, favorites);
      const timestamp = new Date().toISOString();
      saveLastSyncTimestamp(timestamp);
      setLastSync(timestamp);
      toast.success('Synced to GitHub Gist', {
        description: 'Your data has been saved successfully'
      });
    } catch (error) {
      toast.error('Sync failed', {
        description: error.message
      });
    } finally {
      setIsSyncing(false);
    }
  };

  const handleRestore = async () => {
    const savedToken = getGistToken();
    if (!savedToken) {
      toast.error('Not connected to GitHub');
      return;
    }

    setIsRestoring(true);
    try {
      const gistSync = new GistSync(savedToken);
      const data = await gistSync.restoreFromGist();
      
      if (!data) {
        toast.info('No data found', {
          description: 'No UUID UI gist found in your account'
        });
        return;
      }

      onRestore(data.items, data.favorites);
      toast.success('Data restored', {
        description: `Restored ${data.items.length} items from gist`
      });
    } catch (error) {
      toast.error('Restore failed', {
        description: error.message
      });
    } finally {
      setIsRestoring(false);
    }
  };

  const formatLastSync = (timestamp) => {
    if (!timestamp) return null;
    try {
      const date = new Date(timestamp);
      const now = new Date();
      const diffMs = now - date;
      const diffMins = Math.floor(diffMs / 60000);
      const diffHours = Math.floor(diffMs / 3600000);
      const diffDays = Math.floor(diffMs / 86400000);

      if (diffMins < 1) return 'Just now';
      if (diffMins < 60) return `${diffMins}m ago`;
      if (diffHours < 24) return `${diffHours}h ago`;
      if (diffDays < 7) return `${diffDays}d ago`;
      
      return date.toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric',
        year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined
      });
    } catch {
      return timestamp;
    }
  };

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 bg-black/60 dark:bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div 
        className={`${isToggled ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} rounded-2xl shadow-2xl border w-full max-w-md mx-4 overflow-hidden`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className={`px-6 py-4 border-b ${isToggled ? 'border-gray-700 bg-gradient-to-r from-gray-800 to-gray-800' : 'border-gray-200 bg-gradient-to-r from-purple-50 to-blue-50'}`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`p-2 ${isToggled ? 'bg-purple-900/30' : 'bg-purple-100'} rounded-lg`}>
                <svg className={`w-5 h-5 ${isToggled ? 'text-purple-400' : 'text-purple-600'}`} viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 .5C5.73.5.5 5.73.5 12c0 5.07 3.29 9.37 7.86 10.88.58.11.79-.25.79-.56 0-.28-.01-1.02-.02-2-3.2.7-3.88-1.38-3.88-1.38-.53-1.36-1.3-1.73-1.3-1.73-1.06-.73.08-.72.08-.72 1.17.08 1.78 1.2 1.78 1.2 1.04 1.78 2.73 1.27 3.4.97.11-.75.41-1.27.75-1.56-2.55-.29-5.24-1.28-5.24-5.7 0-1.26.45-2.29 1.19-3.1-.12-.29-.52-1.46.11-3.04 0 0 .97-.31 3.18 1.19.92-.26 1.9-.39 2.88-.39.98 0 1.96.13 2.88.39 2.2-1.5 3.17-1.19 3.17-1.19.64 1.58.24 2.75.12 3.04.74.81 1.19 1.84 1.19 3.1 0 4.43-2.7 5.41-5.27 5.69.42.36.79 1.08.79 2.17 0 1.57-.01 2.84-.01 3.22 0 .31.21.68.8.56C20.71 21.37 24 17.07 24 12 24 5.73 18.27.5 12 .5z" />
                </svg>
              </div>
              <div>
                <h3 className={`text-lg font-bold ${isToggled ? 'text-gray-100' : 'text-gray-900'}`}>GitHub Gist Sync</h3>
                <p className={`text-xs ${isToggled ? 'text-gray-400' : 'text-gray-500'} mt-0.5`}>Sync your data across devices</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className={`p-2 rounded-lg ${isToggled ? 'hover:bg-gray-700 text-gray-400 hover:text-gray-300' : 'hover:bg-gray-100 text-gray-400 hover:text-gray-600'} transition-colors`}
              aria-label="Close"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-5">
          {!isConnected ? (
            <>
              <div className={`p-4 rounded-xl ${isToggled ? 'bg-blue-900/20 border-blue-800' : 'bg-blue-50 border-blue-200'} border`}>
                <div className="flex items-start gap-3">
                  <svg className={`w-5 h-5 ${isToggled ? 'text-blue-400' : 'text-blue-600'} mt-0.5 flex-shrink-0`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <div className={`text-sm ${isToggled ? 'text-blue-200' : 'text-blue-800'}`}>
                    <p className="font-medium mb-1">Personal Access Token Required</p>
                    <p className={`${isToggled ? 'text-blue-300' : 'text-blue-700'} text-xs`}>
                      Create a token with <code className={`px-1 py-0.5 rounded ${isToggled ? 'bg-blue-900/50' : 'bg-blue-100'}`}>gist</code> scope at{' '}
                      <a 
                        href="https://github.com/settings/tokens/new?scopes=gist&description=UUID%20UI%20Sync" 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="underline hover:no-underline"
                      >
                        GitHub Settings
                      </a>
                    </p>
                  </div>
                </div>
              </div>

              <div>
                <label className={`block text-sm font-medium ${isToggled ? 'text-gray-300' : 'text-gray-700'} mb-2`}>
                  GitHub Personal Access Token
                </label>
                <div className="relative">
                  <input
                    type={showToken ? 'text' : 'password'}
                    value={token}
                    onChange={(e) => setToken(e.target.value)}
                    placeholder="ghp_xxxxxxxxxxxxxxxxxxxx"
                    className={`w-full px-4 py-3 pr-12 text-sm border-2 rounded-xl ${
                      isToggled 
                        ? 'border-gray-700 bg-gray-900 text-gray-100 placeholder-gray-500 focus:border-purple-500' 
                        : 'border-gray-200 bg-white text-gray-900 placeholder-gray-400 focus:border-purple-500'
                    } focus:outline-none focus:ring-2 focus:ring-purple-500/20 transition-all`}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        handleConnect();
                      }
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowToken(!showToken)}
                    className={`absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded ${isToggled ? 'text-gray-400 hover:text-gray-300' : 'text-gray-400 hover:text-gray-600'}`}
                    aria-label={showToken ? 'Hide token' : 'Show token'}
                  >
                    {showToken ? (
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L6.05 6.05m3.828 3.828L6.05 6.05m7.875 7.875l3.828 3.828M6.05 6.05L3 3m3.05 3.05l4.243 4.243" />
                      </svg>
                    ) : (
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                    )}
                  </button>
                </div>
              </div>

              <button
                onClick={handleConnect}
                disabled={isSyncing || !token.trim()}
                className={`w-full py-3 px-4 rounded-xl font-medium transition-all flex items-center justify-center gap-2 ${
                  isSyncing || !token.trim()
                    ? 'bg-gray-300 dark:bg-gray-700 text-gray-500 dark:text-gray-400 cursor-not-allowed'
                    : 'bg-purple-600 hover:bg-purple-700 text-white shadow-lg shadow-purple-500/25 hover:shadow-purple-500/40'
                }`}
              >
                {isSyncing ? (
                  <>
                    <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    <span>Connecting...</span>
                  </>
                ) : (
                  <>
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                    </svg>
                    <span>Connect to GitHub</span>
                  </>
                )}
              </button>
            </>
          ) : (
            <>
              {/* Connected State */}
              <div className={`p-4 rounded-xl ${isToggled ? 'bg-green-900/20 border-green-800' : 'bg-green-50 border-green-200'} border`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`w-3 h-3 rounded-full bg-green-500 animate-pulse`} />
                    <span className={`text-sm font-medium ${isToggled ? 'text-green-300' : 'text-green-700'}`}>
                      Connected to GitHub
                    </span>
                  </div>
                  <button
                    onClick={handleDisconnect}
                    className={`text-xs ${isToggled ? 'text-gray-400 hover:text-red-400' : 'text-gray-500 hover:text-red-600'} transition-colors`}
                  >
                    Disconnect
                  </button>
                </div>
                {lastSync && (
                  <p className={`text-xs ${isToggled ? 'text-green-400' : 'text-green-600'} mt-2 ml-6`}>
                    Last synced: {formatLastSync(lastSync)}
                  </p>
                )}
              </div>

              {/* Sync Actions */}
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={handleSync}
                  disabled={isSyncing || isRestoring}
                  className={`py-3 px-4 rounded-xl font-medium transition-all flex flex-col items-center gap-2 ${
                    isSyncing || isRestoring
                      ? 'bg-gray-200 dark:bg-gray-700 text-gray-400 dark:text-gray-500 cursor-not-allowed'
                      : 'bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-500/25 hover:shadow-blue-500/40'
                  }`}
                >
                  {isSyncing ? (
                    <svg className="w-6 h-6 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                  ) : (
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                    </svg>
                  )}
                  <span className="text-sm">{isSyncing ? 'Syncing...' : 'Sync to Gist'}</span>
                </button>

                <button
                  onClick={handleRestore}
                  disabled={isSyncing || isRestoring}
                  className={`py-3 px-4 rounded-xl font-medium transition-all flex flex-col items-center gap-2 ${
                    isSyncing || isRestoring
                      ? 'bg-gray-200 dark:bg-gray-700 text-gray-400 dark:text-gray-500 cursor-not-allowed'
                      : isToggled
                        ? 'bg-gray-700 hover:bg-gray-600 text-gray-100'
                        : 'bg-gray-100 hover:bg-gray-200 text-gray-800'
                  }`}
                >
                  {isRestoring ? (
                    <svg className="w-6 h-6 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                  ) : (
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10" />
                    </svg>
                  )}
                  <span className="text-sm">{isRestoring ? 'Restoring...' : 'Restore from Gist'}</span>
                </button>
              </div>

              {/* Info */}
              <div className={`p-3 rounded-xl ${isToggled ? 'bg-gray-700/50' : 'bg-gray-50'}`}>
                <div className="flex items-start gap-2">
                  <svg className={`w-4 h-4 ${isToggled ? 'text-gray-400' : 'text-gray-500'} mt-0.5 flex-shrink-0`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <p className={`text-xs ${isToggled ? 'text-gray-400' : 'text-gray-600'}`}>
                    Your data is stored in a private GitHub Gist. Sync saves your current data, while restore replaces local data with what's in the gist.
                  </p>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
