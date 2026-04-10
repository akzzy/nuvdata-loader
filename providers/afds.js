/**
 * afds - Built from src/afds/
 * Generated: 2026-04-10T05:37:19.424Z
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
  "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
  "Referer": BASE_URL,
  "Origin": BASE_URL
};
if (DEVIL_AUTH_TOKEN) {
  HEADERS["Authorization"] = `Bearer ${DEVIL_AUTH_TOKEN}`;
}
function normalize(str) {
  return str.toLowerCase().replace(/[^a-z0-9\s]/g, "").trim();
}
function formatBytes(bytes) {
  if (!+bytes)
    return "0 Bytes";
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
}
function getStreams(tmdbId, mediaType, season, episode) {
  return __async(this, null, function* () {
    try {
      const type = mediaType === "tv" || mediaType === "series" ? "tv" : "movie";
      const tmdbUrl = `https://api.themoviedb.org/3/${type}/${tmdbId}?api_key=${TMDB_API_KEY}`;
      const metaRes = yield fetch(tmdbUrl);
      const meta = yield metaRes.json();
      const baseName = type === "movie" ? meta.title : meta.name;
      if (!baseName)
        return [];
      let searchQuery = baseName;
      let seasonEpisodeStr = "";
      if (type === "tv" && season && episode) {
        const s = String(season).padStart(2, "0");
        const e = String(episode).padStart(2, "0");
        seasonEpisodeStr = `S${s}E${e}`;
        searchQuery = `${baseName} ${seasonEpisodeStr}`;
      }
      console.log(`[AFDS] Searching API for: ${searchQuery}`);
      const apiUrl = `${API_BASE}/mix_media_files/search?q=${encodeURIComponent(searchQuery)}&page=1`;
      const searchRes = yield fetch(apiUrl, { headers: HEADERS });
      const searchData = yield searchRes.json();
      if (!searchData || !searchData.files)
        return [];
      const streams = [];
      const cleanBaseName = normalize(baseName);
      const cleanSE = normalize(seasonEpisodeStr);
      for (const file of searchData.files) {
        const name = file.file_name;
        const cleanTitle = normalize(name);
        if (/\.zip$/i.test(name) || /part[0-9]/i.test(name) || /\.flac$/i.test(name) || /\.mp3$/i.test(name))
          continue;
        if (!cleanTitle.includes(cleanBaseName))
          continue;
        if (type === "tv" && cleanSE && !cleanTitle.includes(cleanSE))
          continue;
        let quality = "SD";
        if (/4k|2160p/i.test(name))
          quality = "4K";
        else if (/1080p/i.test(name))
          quality = "1080p";
        else if (/720p/i.test(name))
          quality = "720p";
        const size = formatBytes(parseInt(file.file_size));
        streams.push({
          name: "AFDS",
          title: `${name}
${quality} | ${size}`,
          // The magic happens here:
          url: `${WORKER_URL}/?id=${file.id}`,
          quality,
          headers: {
            "User-Agent": HEADERS["User-Agent"],
            "Referer": "https://indexer.eu.org/",
            "Origin": "https://indexer.eu.org"
          }
        });
      }
      console.log(`[AFDS] Found ${streams.length} matches. Returning instantly!`);
      return streams;
    } catch (e) {
      console.log(`[AFDS] Error: ${e.message}`);
      return [];
    }
  });
}
if (typeof module !== "undefined" && module.exports) {
  module.exports = { getStreams };
} else {
  global.getStreams = getStreams;
}
