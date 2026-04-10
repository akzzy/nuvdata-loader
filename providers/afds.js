/**
 * afds - Built from src/afds/
 * Generated: 2026-04-10T07:37:06.277Z
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
  return str.toLowerCase().replace(/[^a-z0-9]/g, " ").replace(/\s+/g, " ").trim();
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
      let type = mediaType === "tv" || mediaType === "series" || mediaType === "show" ? "tv" : "movie";
      let cleanId = String(tmdbId);
      let s = season;
      let e = episode;
      if (cleanId.includes(":")) {
        const parts = cleanId.split(":");
        cleanId = parts[0];
        s = s || parts[1];
        e = e || parts[2];
        type = "tv";
      }
      let baseName = "";
      if (cleanId.startsWith("tt")) {
        const findUrl = `https://api.themoviedb.org/3/find/${cleanId}?api_key=${TMDB_API_KEY}&external_source=imdb_id`;
        const findRes = yield fetch(findUrl);
        const findData = yield findRes.json();
        if (type === "tv" && findData.tv_results && findData.tv_results.length > 0) {
          baseName = findData.tv_results[0].name;
        } else if (type === "movie" && findData.movie_results && findData.movie_results.length > 0) {
          baseName = findData.movie_results[0].title;
        }
      } else {
        const tmdbUrl = `https://api.themoviedb.org/3/${type}/${cleanId}?api_key=${TMDB_API_KEY}`;
        const metaRes = yield fetch(tmdbUrl);
        const meta = yield metaRes.json();
        baseName = type === "movie" ? meta.title : meta.name;
      }
      if (!baseName) {
        console.log(`[AFDS] Could not resolve TMDB Title for: ${cleanId}`);
        return [];
      }
      let searchQuery = baseName;
      let seasonEpisodeStr = "";
      if (type === "tv") {
        if (!s || !e) {
          console.log("[AFDS] Missing season/episode data. Aborting to prevent Nuvio crash.");
          return [];
        }
        const paddedS = String(s).padStart(2, "0");
        const paddedE = String(e).padStart(2, "0");
        seasonEpisodeStr = `s${paddedS}e${paddedE}`;
        searchQuery = `${baseName} S${paddedS}E${paddedE}`;
      }
      console.log(`[AFDS] Searching API for: ${searchQuery}`);
      const apiUrl = `${API_BASE}/mix_media_files/search?q=${encodeURIComponent(searchQuery)}&page=1`;
      const searchRes = yield fetch(apiUrl, { headers: HEADERS });
      const searchData = yield searchRes.json();
      if (!searchData || !searchData.files || searchData.files.length === 0)
        return [];
      const streams = [];
      const cleanBaseName = normalize(baseName);
      for (const file of searchData.files) {
        const name = file.file_name;
        const cleanTitle = normalize(name);
        if (/\.zip$|\.rar$/i.test(name) || /part[0-9]/i.test(name) || /\.flac$|\.mp3$/i.test(name))
          continue;
        if (!cleanTitle.includes(cleanBaseName))
          continue;
        if (type === "tv" && seasonEpisodeStr && !cleanTitle.includes(seasonEpisodeStr))
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
          url: `${WORKER_URL}/?id=${file.id}`,
          quality,
          headers: {
            "User-Agent": HEADERS["User-Agent"],
            "Referer": "https://indexer.eu.org/",
            "Origin": "https://indexer.eu.org"
          }
        });
      }
      const finalStreams = streams.slice(0, 15);
      console.log(`[AFDS] Successfully found ${finalStreams.length} streams!`);
      return finalStreams;
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
