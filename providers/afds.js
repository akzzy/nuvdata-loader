/**
 * afds - Built from src/afds/
 * Generated: 2026-04-10T11:11:13.081Z
 */
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

// src/afds/index.js
console.log("[AFDS] Initializing provider");
var TMDB_API_KEY = "439c478a771f35c05022f9feabcca01c";
var BASE_URL = "https://afds.pages.dev";
var API_BASE = "https://tga-hd.api.hashhackers.com";
var WORKER_URL = "https://afds.akzzy-forza.workers.dev";
var DEVIL_AUTH_TOKEN = "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJ1c2VySWQiOjEwNjcsImVtYWlsIjoiYWt6enlmb3J6YUBnbWFpbC5jb20iLCJleHAiOjE3NzYyODU2MTQsImlhdCI6MTc3NTY4MDgxNH0.vkf1Zurjt83llBEg3PtetVvGMVSJEWwkiGrCV1EGdoo";
var HEADERS = {
  "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
  "Referer": BASE_URL,
  "Origin": BASE_URL
};
if (DEVIL_AUTH_TOKEN)
  HEADERS["Authorization"] = `Bearer ${DEVIL_AUTH_TOKEN}`;
function formatBytes(bytes) {
  if (!+bytes)
    return "0 Bytes";
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
}
function pushDebug(msg) {
  return [{
    name: "AFDS DEBUG",
    title: msg,
    url: "http://localhost",
    quality: "Log"
  }];
}
function getTmdbTitle(id, isTV) {
  return __async(this, null, function* () {
    var _a, _b;
    try {
      if (id.startsWith("tt")) {
        const url = `https://api.themoviedb.org/3/find/${id}?api_key=${TMDB_API_KEY}&external_source=imdb_id`;
        const res = yield fetch(url).then((r) => r.json());
        if (!isTV && ((_a = res.movie_results) == null ? void 0 : _a.length))
          return res.movie_results[0].title;
        if ((_b = res.tv_results) == null ? void 0 : _b.length)
          return res.tv_results[0].name;
      } else {
        const url = `https://api.themoviedb.org/3/${isTV ? "tv" : "movie"}/${id}?api_key=${TMDB_API_KEY}`;
        const res = yield fetch(url).then((r) => r.json());
        return isTV ? res.name : res.title;
      }
    } catch (e) {
      return null;
    }
    return null;
  });
}
function getStreams(tmdbId, mediaType, season, episode) {
  return __async(this, null, function* () {
    try {
      let id = String(tmdbId);
      let s = season;
      let e = episode;
      let isTV = mediaType === "tv" || mediaType === "series";
      if (id.includes(":")) {
        const parts = id.split(":");
        id = parts[0];
        s = s || parts[1];
        e = e || parts[2];
        isTV = true;
      }
      const baseName = yield getTmdbTitle(id, isTV);
      if (!baseName)
        return pushDebug(`\u274C TMDB Failed
ID: ${id} | isTV: ${isTV}`);
      const simpleName = baseName.replace(/[^a-zA-Z0-9\s]/g, " ").replace(/\s+/g, " ").trim();
      let searchQuery = simpleName;
      let tvFilter = "";
      if (isTV && s && e) {
        const padS = String(parseInt(s)).padStart(2, "0");
        const padE = String(parseInt(e)).padStart(2, "0");
        tvFilter = `s${padS}e${padE}`;
        searchQuery = `${simpleName} ${tvFilter}`;
      }
      const apiUrl = `${API_BASE}/mix_media_files/search?q=${encodeURIComponent(searchQuery)}&page=1`;
      const searchRes = yield fetch(apiUrl, { headers: HEADERS });
      const searchData = yield searchRes.json();
      if (!searchData || !searchData.files || searchData.files.length === 0) {
        return pushDebug(`\u274C 0 Files Found
Search: "${searchQuery}"
API URL: ${apiUrl}`);
      }
      const streams = [];
      const matchName = simpleName.toLowerCase().replace(/[^a-z0-9]/g, "");
      for (const file of searchData.files) {
        const name = file.file_name;
        const matchFile = name.toLowerCase().replace(/[^a-z0-9]/g, "");
        if (/\.zip$|\.rar$/i.test(name) || /part[0-9]/i.test(name) || /\.flac$|\.mp3$/i.test(name))
          continue;
        if (!matchFile.includes(matchName))
          continue;
        if (isTV && tvFilter && !matchFile.includes(tvFilter))
          continue;
        let quality = "SD";
        if (/4k|2160p/i.test(name))
          quality = "4K";
        else if (/1080p/i.test(name))
          quality = "1080p";
        else if (/720p/i.test(name))
          quality = "720p";
        streams.push({
          name: "AFDS",
          title: `${name}
${quality} | ${formatBytes(parseInt(file.file_size))}`,
          url: `${WORKER_URL}/?id=${file.id}`,
          quality,
          headers: {
            "User-Agent": HEADERS["User-Agent"],
            "Referer": "https://indexer.eu.org/",
            "Origin": "https://indexer.eu.org"
          }
        });
      }
      if (streams.length === 0) {
        return pushDebug(`\u274C Local Filter Blocked All
Found ${searchData.files.length} files but none matched "${matchName}" and "${tvFilter}"`);
      }
      return streams;
    } catch (e) {
      return pushDebug(`\u274C Script Crashed
Error: ${e.message}`);
    }
  });
}
if (typeof module !== "undefined" && module.exports) {
  module.exports = { getStreams };
} else {
  global.getStreams = getStreams;
}
