import React, { useState, useEffect } from "react";
import toast from "react-hot-toast";
import { fetchTasks, getCacheStats, clearCache } from "../../../services/taskService";
import "./CachePerformancePanel.css";

function CachePerformancePanel({ onRefreshTasks, lastQueryInfo }) {
  const [stats, setStats] = useState({
    hits: 0,
    misses: 0,
    totalRequests: 0,
    hitRate: "0.0%",
    activeKeysCount: 0,
    stdTTL: 60,
    lastInvalidation: null,
  });
  const [benchmarkResults, setBenchmarkResults] = useState(null);
  const [isBenchmarking, setIsBenchmarking] = useState(false);
  const [lastRequest, setLastRequest] = useState(lastQueryInfo || null);

  const loadStats = async () => {
    try {
      const res = await getCacheStats();
      if (res.data) {
        setStats(res.data);
      }
    } catch {
      // Ignore background stats fetch errors
    }
  };

  useEffect(() => {
    loadStats();
    const interval = setInterval(loadStats, 5000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (lastQueryInfo) {
      setLastRequest(lastQueryInfo);
      loadStats();
    }
  }, [lastQueryInfo]);

  const handleTestCached = async () => {
    try {
      const t0 = performance.now();
      const res = await fetchTasks(1, "all", false);
      const t1 = performance.now();
      const duration = parseFloat((t1 - t0).toFixed(2));
      const isHit = res.headers["x-cache"] === "HIT" || res.data.cached;
      setLastRequest({
        source: res.data.source || (isHit ? "node-cache" : "mongodb"),
        cached: isHit,
        responseTimeMs: res.data.responseTimeMs ?? duration,
        status: res.headers["x-cache"] || (isHit ? "HIT" : "MISS"),
      });
      toast.success(isHit ? `Cache HIT: ${res.data.responseTimeMs ?? duration} ms` : `Cache MISS: ${res.data.responseTimeMs ?? duration} ms`);
      loadStats();
      if (onRefreshTasks) onRefreshTasks();
    } catch (err) {
      toast.error("Failed to execute cached request");
    }
  };

  const handleTestUncached = async () => {
    try {
      const t0 = performance.now();
      const res = await fetchTasks(1, "all", true);
      const t1 = performance.now();
      const duration = parseFloat((t1 - t0).toFixed(2));
      setLastRequest({
        source: res.data.source || "mongodb (bypassed)",
        cached: false,
        responseTimeMs: res.data.responseTimeMs ?? duration,
        status: "MISS (BYPASS)",
      });
      toast("Uncached Request: " + (res.data.responseTimeMs ?? duration) + " ms", { icon: "⚡" });
      loadStats();
      if (onRefreshTasks) onRefreshTasks();
    } catch (err) {
      toast.error("Failed to execute uncached request");
    }
  };

  const handleFlushCache = async () => {
    try {
      await clearCache();
      toast.success("Cache cleared! Next read will be a MISS.");
      loadStats();
    } catch (err) {
      toast.error("Failed to clear cache");
    }
  };

  const runBenchmark = async () => {
    setIsBenchmarking(true);
    toast("Starting 3x benchmark (uncached vs cached)...", { icon: "⏱️" });
    const uncachedReadings = [];
    const cachedReadings = [];

    try {
      // 1. Flush cache to guarantee cold start
      await clearCache();

      // 2. Run 3 uncached readings
      for (let i = 1; i <= 3; i++) {
        const t0 = performance.now();
        const res = await fetchTasks(1, "all", true);
        const t1 = performance.now();
        const responseTime = res.data.responseTimeMs ?? parseFloat((t1 - t0).toFixed(2));
        uncachedReadings.push({
          iteration: i,
          type: "Uncached (Bypass / Cold DB)",
          header: res.headers["x-cache"] || "MISS",
          timeMs: responseTime,
          source: res.data.source || "Database",
        });
      }

      // 3. Prime cache with 1 normal request to warm it
      await fetchTasks(1, "all", false);

      // 4. Run 3 cached readings
      for (let i = 1; i <= 3; i++) {
        const t0 = performance.now();
        const res = await fetchTasks(1, "all", false);
        const t1 = performance.now();
        const responseTime = res.data.responseTimeMs ?? parseFloat((t1 - t0).toFixed(2));
        cachedReadings.push({
          iteration: i,
          type: "Cached (node-cache In-Memory)",
          header: res.headers["x-cache"] || "HIT",
          timeMs: responseTime,
          source: res.data.source || "node-cache (RAM)",
        });
      }

      const avgUncached = (
        uncachedReadings.reduce((sum, r) => sum + r.timeMs, 0) / uncachedReadings.length
      ).toFixed(2);
      const avgCached = (
        cachedReadings.reduce((sum, r) => sum + r.timeMs, 0) / cachedReadings.length
      ).toFixed(2);
      const speedup = (avgUncached / Math.max(avgCached, 0.1)).toFixed(1);

      setBenchmarkResults({
        uncached: uncachedReadings,
        cached: cachedReadings,
        avgUncached,
        avgCached,
        speedup,
      });

      toast.success(`Benchmark complete! Caching is ~${speedup}x faster.`);
      loadStats();
    } catch {
      toast.error("Benchmark failed");
    } finally {
      setIsBenchmarking(false);
    }
  };

  return (
    <div className="cache-panel" id="practical9-cache-monitor">
      <div className="cache-panel-header">
        <div className="cache-title-area">
          <div className="cache-badge-tag">
            <span className="cache-pulse-dot"></span>
            Practical 9: In-Memory Caching (node-cache)
          </div>
          <h3 className="cache-heading">API Cache &amp; Query Optimization</h3>
        </div>
        <div className="cache-ttl-pill">
          <span>TTL:</span>
          <strong>{stats.stdTTL || 60}s</strong>
          <span className="cache-engine-tag">RAM</span>
        </div>
      </div>

      {/* Real-Time Metrics Grid */}
      <div className="cache-metrics-row">
        <div className="cache-metric-card">
          <div className="metric-label">Cache Hits</div>
          <div className="metric-val text-hit">{stats.hits}</div>
          <div className="metric-sub">Served from memory</div>
        </div>
        <div className="cache-metric-card">
          <div className="metric-label">Cache Misses</div>
          <div className="metric-val text-miss">{stats.misses}</div>
          <div className="metric-sub">Queried database</div>
        </div>
        <div className="cache-metric-card">
          <div className="metric-label">Hit Ratio</div>
          <div className="metric-val text-ratio">{stats.hitRate || "0.0%"}</div>
          <div className="metric-sub">Efficiency rating</div>
        </div>
        <div className="cache-metric-card">
          <div className="metric-label">Active Keys</div>
          <div className="metric-val text-keys">{stats.activeKeysCount ?? 0}</div>
          <div className="metric-sub">Stored in node-cache</div>
        </div>
      </div>

      {/* Last Request Indicator */}
      {lastRequest && (
        <div className={`cache-live-status ${lastRequest.cached ? "status-hit" : "status-miss"}`}>
          <div className="status-badge-inline">
            <span className="status-indicator-tag">
              {lastRequest.cached ? "CACHE HIT" : (lastRequest.status || "CACHE MISS")}
            </span>
            <span className="status-source-text">
              Source: <strong>{lastRequest.source || (lastRequest.cached ? "node-cache" : "MongoDB")}</strong>
            </span>
          </div>
          <div className="status-speed-info">
            <span className="speed-label">Response Time:</span>
            <span className="speed-val">
              {typeof lastRequest.responseTimeMs === "number"
                ? `${lastRequest.responseTimeMs} ms`
                : lastRequest.responseTimeMs}
            </span>
          </div>
        </div>
      )}

      {/* Control Actions */}
      <div className="cache-controls-row">
        <button
          className="cache-action-btn btn-test-hit"
          onClick={handleTestCached}
          title="Send GET /tasks using cache"
        >
          ⚡ Test Cache (GET /tasks)
        </button>
        <button
          className="cache-action-btn btn-test-miss"
          onClick={handleTestUncached}
          title="Send GET /tasks with noCache=true (Step 6)"
        >
          🔍 Test Uncached (Bypass)
        </button>
        <button
          className="cache-action-btn btn-flush"
          onClick={handleFlushCache}
          title="Clear memory cache"
        >
          🗑️ Flush Cache
        </button>
        <button
          className="cache-action-btn btn-benchmark"
          onClick={runBenchmark}
          disabled={isBenchmarking}
          title="Automatically measure 3 uncached vs 3 cached requests"
        >
          {isBenchmarking ? "⏳ Benchmarking..." : "📊 Run 3x Benchmark Test"}
        </button>
      </div>

      {/* Benchmark Results Table (Lab manual Steps 5, 6, 7) */}
      {benchmarkResults && (
        <div className="benchmark-results-container">
          <div className="benchmark-summary-bar">
            <span className="summary-title">📈 Benchmark Results (3 Samples Each)</span>
            <span className="summary-speedup">
              ⚡ Cache is <strong>{benchmarkResults.speedup}x</strong> Faster
            </span>
          </div>

          <div className="benchmark-tables-grid">
            <div className="benchmark-table-box">
              <h4 className="table-heading text-miss">🔴 Uncached Reads (Database)</h4>
              <table className="benchmark-table">
                <thead>
                  <tr>
                    <th>Sample</th>
                    <th>Header</th>
                    <th>Time</th>
                  </tr>
                </thead>
                <tbody>
                  {benchmarkResults.uncached.map((r) => (
                    <tr key={r.iteration}>
                      <td>Sample #{r.iteration}</td>
                      <td><span className="badge-miss">{r.header}</span></td>
                      <td className="time-highlight">{r.timeMs} ms</td>
                    </tr>
                  ))}
                  <tr className="table-summary-row">
                    <td colSpan="2"><strong>Average</strong></td>
                    <td className="time-highlight"><strong>{benchmarkResults.avgUncached} ms</strong></td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div className="benchmark-table-box">
              <h4 className="table-heading text-hit">🟢 Cached Reads (node-cache)</h4>
              <table className="benchmark-table">
                <thead>
                  <tr>
                    <th>Sample</th>
                    <th>Header</th>
                    <th>Time</th>
                  </tr>
                </thead>
                <tbody>
                  {benchmarkResults.cached.map((r) => (
                    <tr key={r.iteration}>
                      <td>Sample #{r.iteration}</td>
                      <td><span className="badge-hit">{r.header}</span></td>
                      <td className="time-highlight-cached">{r.timeMs} ms</td>
                    </tr>
                  ))}
                  <tr className="table-summary-row">
                    <td colSpan="2"><strong>Average</strong></td>
                    <td className="time-highlight-cached"><strong>{benchmarkResults.avgCached} ms</strong></td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default CachePerformancePanel;
