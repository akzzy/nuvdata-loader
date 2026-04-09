/**
 * afds - Built from src/afds/
 * Generated: 2026-04-09T20:02:12.693Z
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
  "Origin": BASE_URL
};
if (DEVIL_AUTH_TOKEN) {
  HEADERS["Authorization"] = `Bearer ${DEVIL_AUTH_TOKEN}`;
}
function normalize(str) {
  return str.toLowerCase().replace(/[^a-z0-9\s]/g, "").trim();
}
function formatBytes(bytes) {
  if (!bytes || isNaN(bytes))
    return "Unknown Size";
  const b = parseInt(bytes, 10);
  if (b === 0)
    return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(b) / Math.log(k));
  return parseFloat((b / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
}
function resolveLink(dataId, category) {
  return __async(this, null, function* () {
    try {
      const url = `${API_BASE}/genLink?type=${category}&id=${dataId}`;
      const res = yield fetch(url, { method: "GET", headers: HEADERS });
      const data = yield res.json();
      return data.link || data.downloadUrl || data.url || null;
    } catch (e) {
      console.log(`[AFDS] Resolve Error: ${e.message}`);
      return null;
    }
  });
}
function getStreams(tmdbId, mediaType, season, episode) {
  return __async(this, null, function* () {
    var _a;
    try {
      const tmdbUrl = `https://api.themoviedb.org/3/${mediaType === "tv" ? "tv" : "movie"}/${tmdbId}?api_key=${TMDB_API_KEY}`;
      const metaRes = yield fetch(tmdbUrl);
      const meta = yield metaRes.json();
      const titleQuery = mediaType === "movie" ? meta.title : meta.name;
      const year = mediaType === "movie" ? (_a = meta.release_date) == null ? void 0 : _a.substring(0, 4) : null;
      console.log(`[AFDS] Searching API for: ${titleQuery}`);
      const searchUrl = `${API_BASE}/mix_media_files/search?q=${encodeURIComponent(titleQuery)}&page=1`;
      const searchRes = yield fetch(searchUrl, { headers: HEADERS });
      const searchData = yield searchRes.json();
      if (!searchData || !searchData.files || searchData.files.length === 0) {
        console.log("[AFDS] No files found in API.");
        return [];
      }
      const candidates = [];
      const cleanQuery = normalize(titleQuery);
      for (const file of searchData.files) {
        const itemTitle = file.file_name;
        const dataId = file.id;
        const itemSize = formatBytes(file.file_size);
        const category = "mix_media_files";
        const cleanTitle = normalize(itemTitle);
        if (!cleanTitle.includes(cleanQuery))
          continue;
        if (year && !cleanTitle.includes(year))
          continue;
        const lowerTitle = itemTitle.toLowerCase();
        if (lowerTitle.includes(".zip") || lowerTitle.includes(".flac") || lowerTitle.includes(".mp3") || /part\d+/i.test(lowerTitle)) {
          continue;
        }
        let quality = "Unknown";
        if (lowerTitle.includes("4k") || lowerTitle.includes("2160p"))
          quality = "4K";
        else if (lowerTitle.includes("1080p"))
          quality = "1080p";
        else if (lowerTitle.includes("720p"))
          quality = "720p";
        candidates.push({
          id: dataId,
          category,
          title: itemTitle,
          size: itemSize,
          quality
        });
      }
      if (candidates.length === 0) {
        console.log("[AFDS] No valid video files found.");
        return [];
      }
      console.log(`[AFDS] Found ${candidates.length} valid video files. Resolving top 5...`);
      const topCandidates = candidates.slice(0, 5);
      const promises = topCandidates.map((file) => __async(this, null, function* () {
        const finalUrl = yield resolveLink(file.id, file.category);
        if (finalUrl) {
          return {
            name: "AFDS",
            title: `AFDS
${file.quality} | \u{1F4E6} ${file.size}`,
            url: finalUrl,
            quality: file.quality,
            headers: { "User-Agent": HEADERS["User-Agent"] }
          };
        }
        return null;
      }));
      const resolvedStreams = yield Promise.all(promises);
      return resolvedStreams.filter((s) => s !== null);
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
