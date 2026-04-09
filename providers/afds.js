/**
 * afds - Built from src/afds/
 * Generated: 2026-04-09T19:13:09.558Z
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
  // Injecting the JWT Token for AFDS Search
  "Authorization": `Bearer ${DEVIL_AUTH_TOKEN}`
};
function makeRequest(url) {
  return __async(this, null, function* () {
    try {
      const res = yield fetch(url, { headers: HEADERS });
      return yield res.text();
    } catch (e) {
      console.log(`[AFDS] Request failed: ${e.message}`);
      return null;
    }
  });
}
function normalize(str) {
  return str.toLowerCase().replace(/[^a-z0-9\s]/g, "").trim();
}
function resolveLink(dataId, category) {
  return __async(this, null, function* () {
    try {
      const apiType = category.endsWith("_files") ? category : `${category}_files`;
      console.log(`[AFDS] Resolving ID: ${dataId} | Type: ${apiType}`);
      const url = `${API_BASE}/genLink?type=${apiType}&id=${dataId}`;
      const res = yield fetch(url, {
        method: "GET",
        headers: {
          "User-Agent": HEADERS["User-Agent"],
          "Referer": BASE_URL,
          "Origin": BASE_URL
        }
      });
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
      console.log(`[AFDS] Searching: ${titleQuery}`);
      const searchUrl = `${BASE_URL}/search?q=${encodeURIComponent(titleQuery)}&category=mix_media_files&page=1`;
      const searchHtml = yield makeRequest(searchUrl);
      if (!searchHtml) {
        console.log("[AFDS] Search returned empty. Token might be expired or invalid.");
        return [];
      }
      const itemRegex = /<h6[^>]*class="card-title[^>]*>([^<]+)<\/h6>[\s\S]*?<span>([^<]+)<\/span>[\s\S]*?data-id="([^"]+)"\s*data-category="([^"]+)"/g;
      const candidates = [];
      let match;
      while ((match = itemRegex.exec(searchHtml)) !== null) {
        const itemTitle = match[1].trim();
        const itemSize = match[2].trim();
        const dataId = match[3].trim();
        const category = match[4].trim();
        const cleanTitle = normalize(itemTitle);
        const cleanQuery = normalize(titleQuery);
        if (!cleanTitle.includes(cleanQuery))
          continue;
        if (year && !cleanTitle.includes(year))
          continue;
        if (itemTitle.toLowerCase().includes(".zip") || /part\d+/i.test(itemTitle))
          continue;
        let quality = "Unknown";
        if (itemTitle.toLowerCase().includes("4k") || itemTitle.toLowerCase().includes("2160p"))
          quality = "4K";
        else if (itemTitle.toLowerCase().includes("1080p"))
          quality = "1080p";
        else if (itemTitle.toLowerCase().includes("720p"))
          quality = "720p";
        candidates.push({ id: dataId, category, title: itemTitle, size: itemSize, quality });
      }
      if (candidates.length === 0)
        return [];
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
