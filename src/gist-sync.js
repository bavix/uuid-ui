const GIST_API_URL = 'https://api.github.com/gists';
const GIST_FILENAME = 'uuid-ui-data.json';
const GIST_DESCRIPTION = 'UUID UI - Sync Data';

/**
 * GistSync class handles syncing UUID UI data to/from GitHub Gists
 */
export class GistSync {
  constructor(token) {
    this.token = token;
  }

  /**
   * Get headers for GitHub API requests
   */
  getHeaders() {
    return {
      'Authorization': `Bearer ${this.token}`,
      'Accept': 'application/vnd.github+json',
      'Content-Type': 'application/json',
      'X-GitHub-Api-Version': '2022-11-28'
    };
  }

  /**
   * Serialize app data for storage
   * @param {Array} items - History items
   * @param {Object} favorites - Favorites object
   * @returns {Object} - Serialized data object
   */
  serializeData(items, favorites) {
    const timestamp = new Date().toISOString();
    return {
      version: 1,
      timestamp,
      items: items.slice(0, 100).map(item => ({
        input: item.input,
        output: item.output,
        info: item.info || ''
      })),
      favorites: Object.fromEntries(
        Object.entries(favorites || {}).map(([key, value]) => [
          key,
          (value || []).map(item => ({
            input: item.input,
            output: item.output,
            info: item.info || ''
          }))
        ])
      )
    };
  }

  /**
   * Find an existing UUID UI gist
   * @returns {Promise<Object|null>} - Gist object or null
   */
  async findExistingGist() {
    const response = await fetch(GIST_API_URL, {
      method: 'GET',
      headers: this.getHeaders()
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.message || `Failed to fetch gists: ${response.status}`);
    }

    const gists = await response.json();
    return gists.find(gist => 
      gist.description === GIST_DESCRIPTION && 
      gist.files && 
      gist.files[GIST_FILENAME]
    ) || null;
  }

  /**
   * Create a new gist with the app data
   * @param {Array} items - History items
   * @param {Object} favorites - Favorites object
   * @returns {Promise<Object>} - Created gist object
   */
  async createGist(items, favorites) {
    const data = this.serializeData(items, favorites);
    
    const response = await fetch(GIST_API_URL, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify({
        description: GIST_DESCRIPTION,
        public: false,
        files: {
          [GIST_FILENAME]: {
            content: JSON.stringify(data, null, 2)
          }
        }
      })
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.message || `Failed to create gist: ${response.status}`);
    }

    return response.json();
  }

  /**
   * Update an existing gist with the app data
   * @param {string} gistId - The gist ID
   * @param {Array} items - History items
   * @param {Object} favorites - Favorites object
   * @returns {Promise<Object>} - Updated gist object
   */
  async updateGist(gistId, items, favorites) {
    const data = this.serializeData(items, favorites);
    
    const response = await fetch(`${GIST_API_URL}/${gistId}`, {
      method: 'PATCH',
      headers: this.getHeaders(),
      body: JSON.stringify({
        description: GIST_DESCRIPTION,
        files: {
          [GIST_FILENAME]: {
            content: JSON.stringify(data, null, 2)
          }
        }
      })
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.message || `Failed to update gist: ${response.status}`);
    }

    return response.json();
  }

  /**
   * Sync data to GitHub Gist (creates or updates)
   * @param {Array} items - History items
   * @param {Object} favorites - Favorites object
   * @returns {Promise<Object>} - Gist object
   */
  async syncToGist(items, favorites) {
    const existingGist = await this.findExistingGist();
    
    if (existingGist) {
      return this.updateGist(existingGist.id, items, favorites);
    }
    
    return this.createGist(items, favorites);
  }

  /**
   * Restore data from GitHub Gist
   * @returns {Promise<Object|null>} - Restored data or null if not found
   */
  async restoreFromGist() {
    const existingGist = await this.findExistingGist();
    
    if (!existingGist) {
      return null;
    }

    // Fetch the full gist to get the content
    const response = await fetch(`${GIST_API_URL}/${existingGist.id}`, {
      method: 'GET',
      headers: this.getHeaders()
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.message || `Failed to fetch gist: ${response.status}`);
    }

    const gist = await response.json();
    const file = gist.files[GIST_FILENAME];
    
    if (!file || !file.content) {
      return null;
    }

    try {
      const data = JSON.parse(file.content);
      return {
        items: data.items || [],
        favorites: data.favorites || {},
        timestamp: data.timestamp || null
      };
    } catch {
      throw new Error('Failed to parse gist content');
    }
  }

  /**
   * Validate the GitHub token by making a test request
   * @returns {Promise<boolean>} - True if token is valid
   */
  async validateToken() {
    try {
      const response = await fetch('https://api.github.com/user', {
        method: 'GET',
        headers: this.getHeaders()
      });
      return response.ok;
    } catch {
      return false;
    }
  }
}

/**
 * Save GitHub token to localStorage
 * @param {string} token - GitHub personal access token
 */
export function saveGistToken(token) {
  try {
    localStorage.setItem('gistToken', token);
  } catch (e) {
    console.error('Failed to save gist token:', e);
  }
}

/**
 * Get GitHub token from localStorage
 * @returns {string|null} - GitHub token or null
 */
export function getGistToken() {
  try {
    return localStorage.getItem('gistToken') || null;
  } catch {
    return null;
  }
}

/**
 * Remove GitHub token from localStorage
 */
export function removeGistToken() {
  try {
    localStorage.removeItem('gistToken');
  } catch (e) {
    console.error('Failed to remove gist token:', e);
  }
}

/**
 * Save last sync timestamp
 * @param {string} timestamp - ISO timestamp string
 */
export function saveLastSyncTimestamp(timestamp) {
  try {
    localStorage.setItem('gistLastSync', timestamp);
  } catch (e) {
    console.error('Failed to save last sync timestamp:', e);
  }
}

/**
 * Get last sync timestamp
 * @returns {string|null} - ISO timestamp string or null
 */
export function getLastSyncTimestamp() {
  try {
    return localStorage.getItem('gistLastSync') || null;
  } catch {
    return null;
  }
}
