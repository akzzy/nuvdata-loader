/**
 * hashes - Built from src/hashes/
 * Generated: 2026-01-13T19:56:04.656Z
 */
var __defProp = Object.defineProperty;
var __defProps = Object.defineProperties;
var __getOwnPropDescs = Object.getOwnPropertyDescriptors;
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

// src/hashes/index.js
console.log("[Hashes] Initializing Hashes scraper");
var TMDB_API_KEY = "439c478a771f35c05022f9feabcca01c";
var API_BASE = "https://tga-hd.api.hashhackers.com";
function makeRequest(_0) {
  return __async(this, arguments, function* (url, options = {}) {
    return fetch(url, __spreadProps(__spreadValues({}, options), {
      headers: __spreadValues({
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Referer": "https://bollywood.eu.org/",
        "Origin": "https://bollywood.eu.org"
      }, options.headers)
    }));
  });
}
function getTmdbInfo(tmdbId, type) {
  return __async(this, null, function* () {
    const url = `https://api.themoviedb.org/3/${type}/${tmdbId}?api_key=${TMDB_API_KEY}`;
    const res = yield fetch(url);
    return yield res.json();
  });
}
function resolveLink(fileId) {
  return __async(this, null, function* () {
    try {
      const url = `${API_BASE}/genLink?type=files&id=${fileId}`;
      const res = yield makeRequest(url);
      const data = yield res.json();
      return data.link || data.downloadUrl || data.url;
    } catch (e) {
      console.log(`[Hashes] Resolve Link Error for ID ${fileId}: ${e.message}`);
      return null;
    }
  });
}
function formatSize(bytes) {
  if (!bytes)
    return "Unknown";
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return (bytes / Math.pow(1024, i)).toFixed(2) + " " + ["B", "KB", "MB", "GB", "TB"][i];
}
function getStreams(tmdbId, mediaType, season, episode) {
  return __async(this, null, function* () {
    try {
      const meta = yield getTmdbInfo(tmdbId, mediaType === "tv" ? "tv" : "movie");
      let query = "";
      if (mediaType === "movie") {
        const year = meta.release_date ? meta.release_date.substring(0, 4) : "";
        query = `${meta.title} ${year}`;
      } else {
        const pad = (n) => n < 10 ? "0" + n : n;
        query = `${meta.name} S${pad(season)}E${pad(episode)}`;
      }
      console.log(`[Hashes] Searching: ${query}`);
      const searchUrl = `${API_BASE}/files/search?q=${encodeURIComponent(query)}&page=1`;
      const searchRes = yield makeRequest(searchUrl);
      const searchData = yield searchRes.json();
      if (!searchData.files || searchData.files.length === 0) {
        console.log("[Hashes] No files found.");
        return [];
      }
      let filteredFiles = searchData.files.filter((file) => {
        if (/part\d+/i.test(file.file_name))
          return false;
        if (file.file_size < 50 * 1024 * 1024)
          return false;
        return true;
      });
      filteredFiles.sort((a, b) => b.file_size - a.file_size);
      const topFiles = filteredFiles.slice(0, 20);
      console.log(`[Hashes] Found ${searchData.files.length} total. Processing top ${topFiles.length} valid files...`);
      const streamPromises = topFiles.map((file) => __async(this, null, function* () {
        const directLink = yield resolveLink(file.id);
        if (!directLink)
          return null;
        return {
          name: "Hashes",
          title: `${file.file_name}
\u{1F4E6} ${formatSize(file.file_size)}`,
          url: directLink,
          headers: {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
            "Referer": "https://bollywood.eu.org/"
          }
        };
      }));
      const results = yield Promise.all(streamPromises);
      return results.filter((stream) => stream !== null);
    } catch (e) {
      console.log(`[Hashes] Error: ${e.message}`);
      return [];
    }
  });
}
if (typeof module !== "undefined" && module.exports) {
  module.exports = { getStreams };
} else {
  global.getStreams = getStreams;
}
