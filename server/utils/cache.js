import NodeCache from "node-cache";

// Practical 9: In-Memory Caching using node-cache
// Standard TTL: 60 seconds as defined in the assignment
const DEFAULT_TTL = 60;

const nodeCache = new NodeCache({
  stdTTL: DEFAULT_TTL,
  checkperiod: 120,
  useClones: false,
});

const cacheMetrics = {
  hits: 0,
  misses: 0,
  invalidations: 0,
  lastInvalidation: null,
};

export const cache = {
  // Underlying node-cache instance
  instance: nodeCache,

  // Get key and update hit/miss counters
  get(key) {
    const value = nodeCache.get(key);
    if (value !== undefined) {
      cacheMetrics.hits += 1;
      return value;
    }
    cacheMetrics.misses += 1;
    return undefined;
  },

  // Set key with optional custom TTL
  set(key, value, ttl = DEFAULT_TTL) {
    return nodeCache.set(key, value, ttl);
  },

  // Delete specific key
  del(key) {
    return nodeCache.del(key);
  },

  // Invalidate all tasks collection caches
  invalidateTasksCache(taskId = null) {
    const keys = nodeCache.keys();
    const taskKeysToDelete = keys.filter(
      (k) => k === "all_tasks" || k.startsWith("tasks_") || (taskId && k === `task_${taskId}`)
    );

    if (taskKeysToDelete.length > 0) {
      nodeCache.del(taskKeysToDelete);
    }

    cacheMetrics.invalidations += 1;
    cacheMetrics.lastInvalidation = new Date().toISOString();

    return {
      invalidatedKeys: taskKeysToDelete,
      timestamp: cacheMetrics.lastInvalidation,
    };
  },

  // Return hit/miss stats and metadata (Supplementary task)
  getStats() {
    const totalRequests = cacheMetrics.hits + cacheMetrics.misses;
    const hitRate =
      totalRequests > 0
        ? `${((cacheMetrics.hits / totalRequests) * 100).toFixed(1)}%`
        : "0.0%";

    return {
      hits: cacheMetrics.hits,
      misses: cacheMetrics.misses,
      totalRequests,
      hitRate,
      invalidations: cacheMetrics.invalidations,
      lastInvalidation: cacheMetrics.lastInvalidation,
      stdTTL: DEFAULT_TTL,
      activeKeysCount: nodeCache.keys().length,
      keys: nodeCache.keys(),
    };
  },

  // Flush all cached keys and reset metrics
  flush() {
    nodeCache.flushAll();
    cacheMetrics.hits = 0;
    cacheMetrics.misses = 0;
    cacheMetrics.invalidations = 0;
    cacheMetrics.lastInvalidation = new Date().toISOString();
    return { success: true, message: "Cache flushed completely." };
  },
};

export default cache;
