/**
 * teldrive - Built from src/teldrive/
 * Generated: 2026-06-16T21:25:00.617Z
 */
var __defProp = Object.defineProperty;
var __defProps = Object.defineProperties;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropDescs = Object.getOwnPropertyDescriptors;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getOwnPropSymbols = Object.getOwnPropertySymbols;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __propIsEnum = Object.prototype.propertyIsEnumerable;
var __defNormalProp = (obj, key, value) => key in obj ? __defProp(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
var __spreadValues = (a, b) => {
  for (var prop in b || (b = {}))
    if (__hasOwnProp.call(b, prop))
      __defNormalProp(a, prop, b[prop]);
  if (__getOwnPropSymbols)
    for (var prop of __getOwnPropSymbols(b)) {
      if (__propIsEnum.call(b, prop))
        __defNormalProp(a, prop, b[prop]);
    }
  return a;
};
var __spreadProps = (a, b) => __defProps(a, __getOwnPropDescs(b));
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);
var __async = (__this, __arguments, generator) => {
  return new Promise((resolve, reject) => {
    var fulfilled = (value) => {
      try {
        step(generator.next(value));
      } catch (e) {
        reject(e);
      }
    };
    var rejected = (value) => {
      try {
        step(generator.throw(value));
      } catch (e) {
        reject(e);
      }
    };
    var step = (x) => x.done ? resolve(x.value) : Promise.resolve(x.value).then(fulfilled, rejected);
    step((generator = generator.apply(__this, __arguments)).next());
  });
};

// src/teldrive/index.js
var teldrive_exports = {};
__export(teldrive_exports, {
  getStreams: () => getStreams
});
module.exports = __toCommonJS(teldrive_exports);

// src/teldrive/http.js
var WORKER_URL = "https://teldrive.akzzy-forza.workers.dev/";
var BASE_URL = "https://mkvbase.site/";
var BASE_HEADERS = {
  "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)",
  Referer: BASE_URL,
  Origin: BASE_URL,
  "X-Requested-With": "XMLHttpRequest"
};
var COOKIE_JAR = "";
function storeCookies(res) {
  const setCookie = res.headers.get("set-cookie");
  if (setCookie) {
    COOKIE_JAR = setCookie.split(";")[0];
    console.log("[HTTP][COOKIE] Stored:", COOKIE_JAR);
  }
}
function requestWithRetry(fetchFn, label) {
  return __async(this, null, function* () {
    try {
      console.log(`[HTTP] ${label} fetching...`);
      return yield fetchFn();
    } catch (err) {
      console.log(`[HTTP] \u274C ${label} failed:`, err.message);
      throw new Error(`${err.message}`);
    }
  });
}
function fetchJson(_0) {
  return __async(this, arguments, function* (url, options = {}) {
    const method = (options.method || "GET").toUpperCase();
    return requestWithRetry(() => __async(this, null, function* () {
      const res = yield fetch(url, __spreadProps(__spreadValues({}, options), {
        headers: __spreadValues(__spreadValues(__spreadProps(__spreadValues({}, BASE_HEADERS), {
          "Content-Type": "application/json"
        }), COOKIE_JAR ? { Cookie: COOKIE_JAR } : {}), options.headers || {})
      }));
      storeCookies(res);
      if (!res.ok) {
        throw new Error(`HTTP ${res.status}`);
      }
      return yield res.json();
    }), `${method} ${url}`);
  });
}

// src/teldrive/quality.js
var QUALITY_PATTERNS = [
  { label: "2160p", regex: /\b2160p\b/i },
  { label: "1080p", regex: /\b1080p\b/i },
  { label: "720p", regex: /\b720p\b/i },
  { label: "480p", regex: /\b480p\b/i }
];
function extractQuality(title) {
  for (const q of QUALITY_PATTERNS) {
    if (q.regex.test(title)) {
      console.log(`[QUALITY] ${q.label} \u2190 "${title}"`);
      return q.label;
    }
  }
  console.log(`[QUALITY] unknown \u2190 "${title}"`);
  return "unknown";
}

// src/teldrive/search.js
function search(query) {
  return __async(this, null, function* () {
    console.log("\n[SEARCH] \u25B6 Starting search:", query);
    try {
      const json = yield fetchJson(WORKER_URL, {
        method: "POST",
        body: JSON.stringify({ action: "search", query })
      });
      if (!Array.isArray(json)) {
        console.log("[SEARCH] \u26A0\uFE0F No results array");
        throw new Error(`API didn't return an array.`);
      }
      const results = [];
      for (const item of json) {
        try {
          if (!(item == null ? void 0 : item.name) || !(item == null ? void 0 : item.link))
            continue;
          if (item.source !== "hubcloud")
            continue;
          results.push({
            title: item.name,
            url: item.link,
            quality: extractQuality(item.name),
            size: item.size,
            host: "hubcloud",
            kind: "video"
          });
        } catch (err) {
          console.log("[SEARCH] \u26A0\uFE0F Skipping bad item:", err.message);
        }
      }
      console.log("[SEARCH] \u25B6 Final results:", results.length);
      return results;
    } catch (err) {
      console.log("[SEARCH] \u274C Search failed completely:", err.message);
      throw err;
    }
  });
}

// src/teldrive/hubcloud.js
function resolveHubCloud(entryUrl, meta) {
  return __async(this, null, function* () {
    console.log("\n[HUBCLOUD] \u25B6 Resolving via TelDrive Worker:", entryUrl);
    const streams = [];
    try {
      const json = yield fetchJson(WORKER_URL, {
        method: "POST",
        body: JSON.stringify({ action: "extract", url: entryUrl })
      });
      if (json.r2) {
        streams.push({
          name: "TelDrive - hubcloud - FSL",
          title: meta.title,
          url: json.r2,
          quality: meta.quality,
          size: meta.size,
          source: "hubcloud-fsl"
        });
      }
      if (json.instant) {
        streams.push({
          name: "TelDrive - hubcloud - 10Gbps",
          title: meta.title,
          url: json.instant,
          quality: meta.quality,
          size: meta.size,
          source: "hubcloud-instant"
        });
      }
      if (json.extra && Array.isArray(json.extra)) {
        json.extra.forEach((ext) => {
          streams.push({
            name: `TelDrive - hubcloud - ${ext.name}`,
            title: meta.title,
            url: ext.url,
            quality: meta.quality,
            size: meta.size,
            source: `hubcloud-${ext.name.toLowerCase().replace(/\s+/g, "-")}`
          });
        });
      }
      console.log("[HUBCLOUD] \u25B6 Final streams extracted by worker:", streams.length);
    } catch (err) {
      console.log("[HUBCLOUD] \u274C Worker extraction failed:", err.message);
    }
    return streams;
  });
}

// src/teldrive/index.js
var TMDB_API_KEY = "919605fd567bbffcf76492a03eb4d527";
var TMDB_BASE = "https://api.themoviedb.org/3";
function pad2(num) {
  return String(num).padStart(2, "0");
}
function isV4Key(key) {
  return key && key.length > 40;
}
function getTmdbTitle(tmdbId, mediaType) {
  return __async(this, null, function* () {
    try {
      if (!TMDB_API_KEY || TMDB_API_KEY === "YOUR_TMDB_API_KEY_HERE") {
        console.error("[TelDrive] \u274C Missing TMDB API Key");
        return null;
      }
      let endpoint;
      if (mediaType === "movie")
        endpoint = `/movie/${tmdbId}`;
      else if (mediaType === "tv")
        endpoint = `/tv/${tmdbId}`;
      else
        return null;
      let url = `${TMDB_BASE}${endpoint}`;
      const options = { method: "GET", headers: {} };
      if (isV4Key(TMDB_API_KEY)) {
        options.headers.Authorization = `Bearer ${TMDB_API_KEY}`;
      } else {
        url += `?api_key=${TMDB_API_KEY}`;
      }
      const data = yield fetchJson(url, options);
      if (mediaType === "movie")
        return (data == null ? void 0 : data.title) || null;
      if (mediaType === "tv")
        return (data == null ? void 0 : data.name) || null;
      return null;
    } catch (error) {
      console.error(`[TMDB] Error: ${error.message}`);
      return null;
    }
  });
}
function getStreams(tmdbId, mediaType, season, episode) {
  return __async(this, null, function* () {
    const logs = [];
    let stepCounter = 1;
    const addLog = (msg) => {
      console.log("[DEBUG LOG]", msg);
      logs.push({
        name: `[LOG] ${stepCounter++}. ${msg}`,
        title: `${stepCounter++}. ${msg}`,
        url: "https://hubcloud.foo/dummy.mkv",
        // Fake URL so it shows up in UI
        quality: "LOG",
        size: null,
        headers: {}
      });
    };
    try {
      addLog(`START: ${tmdbId} (${mediaType})`);
      const baseTitle = yield getTmdbTitle(tmdbId, mediaType);
      if (!baseTitle) {
        addLog(`FAIL: TMDB title not found`);
        return logs;
      }
      addLog(`TMDB Title: ${baseTitle}`);
      let query;
      if (mediaType === "movie") {
        query = baseTitle;
      } else if (mediaType === "tv") {
        if (season == null || episode == null) {
          addLog(`FAIL: Missing season/episode`);
          return logs;
        }
        query = `${baseTitle} S${pad2(season)}E${pad2(episode)}`;
      } else {
        addLog(`FAIL: Invalid media type`);
        return logs;
      }
      addLog(`Search Query: ${query}`);
      let results;
      try {
        results = yield search(query);
      } catch (searchErr) {
        addLog(`SEARCH FAIL: ${searchErr.message}`);
        return logs;
      }
      if (!Array.isArray(results)) {
        addLog(`FAIL: Search results is not an array`);
        return logs;
      }
      addLog(`Search Success: ${results.length} total links found`);
      const supportedResults = results.filter((item) => item.host === "hubcloud");
      addLog(`Hubcloud links found: ${supportedResults.length}`);
      if (supportedResults.length === 0) {
        addLog(`STOP: No hubcloud links to process`);
        return logs;
      }
      const uniqueQualities = /* @__PURE__ */ new Map();
      for (const item of supportedResults) {
        const q = item.quality || "unknown";
        if (!uniqueQualities.has(q)) {
          uniqueQualities.set(q, item);
        }
      }
      const limitedResults = Array.from(uniqueQualities.values());
      addLog(`Resolving ${limitedResults.length} unique qualities to save credits...`);
      const promises = limitedResults.map((item, idx) => __async(this, null, function* () {
        try {
          const resolved = yield resolveHubCloud(item.url, {
            title: item.title,
            quality: item.quality
          });
          addLog(`Resolve [${idx}]: Found ${resolved.length} streams`);
          return resolved.map((stream) => ({
            name: stream.name,
            title: stream.title,
            url: stream.url,
            quality: stream.quality || "unknown",
            size: stream.size || null,
            headers: {}
          }));
        } catch (err) {
          addLog(`Resolve [${idx}] FAIL: ${err.message}`);
        }
        return [];
      }));
      const resultsArrays = yield Promise.all(promises);
      const finalStreams = resultsArrays.flat();
      addLog(`DONE: Extracted ${finalStreams.length} playable streams`);
      return [...logs, ...finalStreams];
    } catch (err) {
      addLog(`CRITICAL ERROR: ${err.message}`);
      return logs;
    }
  });
}
