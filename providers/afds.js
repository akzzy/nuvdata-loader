/**
 * afds - Built from src/afds/
 * Generated: 2026-04-09T20:44:27.570Z
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
var DEVIL_AUTH_TOKEN = "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJ1c2VySWQiOjEwNjcsImVtYWlsIjoiYWt6enlmb3J6YUBnbWFpbC5jb20iLCJleHAiOjE3NzYyODU2MTQsImlhdCI6MTc3NTY4MDgxNH0.vkf1Zurjt83llBEg3PtetVvGMVSJEWwkiGrCV1EGdoo";
var HEADERS = {
  "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
  "Referer": BASE_URL,
  "Origin": BASE_URL,
  "Authorization": `Bearer ${DEVIL_AUTH_TOKEN}`
};
function formatBytes(bytes) {
  if (!+bytes)
    return "0 Bytes";
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
}
function resolveLink(dataId, category) {
  return __async(this, null, function* () {
    try {
      const url = `${API_BASE}/genLink?type=mix_media_files&id=${dataId}`;
      const res = yield fetch(url, { method: "GET", headers: HEADERS });
      const data = yield res.json();
      return data.url || data.link || null;
    } catch (e) {
      return null;
    }
  });
}
function getStreams(tmdbId, mediaType, season, episode) {
  return __async(this, null, function* () {
    try {
      const isTV = mediaType === "tv" || mediaType === "series";
      const typePath = isTV ? "tv" : "movie";
      const tmdbUrl = `https://api.themoviedb.org/3/${typePath}/${tmdbId}?api_key=${TMDB_API_KEY}`;
      const metaRes = yield fetch(tmdbUrl);
      const meta = yield metaRes.json();
      let titleQuery = isTV ? meta.name : meta.title;
      if (!titleQuery)
        return [];
      if (isTV && season && episode) {
        const s = String(season).padStart(2, "0");
        const e = String(episode).padStart(2, "0");
        titleQuery = `${titleQuery} S${s}E${e}`;
      } else if (!isTV && meta.release_date) {
        titleQuery = titleQuery;
      }
      console.log(`[AFDS] Searching: ${titleQuery}`);
      const searchUrl = `${API_BASE}/mix_media_files/search?q=${encodeURIComponent(titleQuery)}&page=1`;
      const searchRes = yield fetch(searchUrl, { headers: HEADERS });
      const searchData = yield searchRes.json();
      if (!searchData || !searchData.files)
        return [];
      const candidates = [];
      for (const file of searchData.files) {
        const name = file.file_name;
        if (!/\.(mkv|mp4|mov|avi|webm|flv)$/i.test(name))
          continue;
        if (/\.zip$|\.rar$/i.test(name) || /part[0-9]\./i.test(name))
          continue;
        let quality = "SD";
        if (/4k|2160p/i.test(name))
          quality = "4K";
        else if (/1080p/i.test(name))
          quality = "1080p";
        else if (/720p/i.test(name))
          quality = "720p";
        candidates.push({
          id: file.id,
          title: name,
          size: formatBytes(parseInt(file.file_size)),
          quality
        });
      }
      const streamPromises = candidates.slice(0, 10).map((file) => __async(this, null, function* () {
        const videoUrl = yield resolveLink(file.id, "mix_media_files");
        if (videoUrl) {
          return {
            name: "AFDS",
            title: `${file.title}
${file.quality} | ${file.size}`,
            url: videoUrl,
            quality: file.quality,
            headers: {
              "User-Agent": HEADERS["User-Agent"],
              "Referer": "https://indexer.eu.org/",
              "Origin": "https://indexer.eu.org"
            }
          };
        }
        return null;
      }));
      const results = yield Promise.all(streamPromises);
      return results.filter((s) => s !== null);
    } catch (e) {
      console.log(`[AFDS] Fatal Error: ${e.message}`);
      return [];
    }
  });
}
if (typeof module !== "undefined" && module.exports) {
  module.exports = { getStreams };
} else {
  global.getStreams = getStreams;
}
