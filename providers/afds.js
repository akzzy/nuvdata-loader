/**
 * afds - Built from src/afds/
 * Generated: 2026-04-09T20:03:33.456Z
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
function normalize(str) {
  return str.toLowerCase().replace(/[^a-z0-9\s]/g, "").trim();
}
function formatBytes(bytes, decimals = 2) {
  if (!+bytes)
    return "0 Bytes";
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ["Bytes", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
}
function pushError(message) {
  return [{
    name: "AFDS DEBUG",
    title: `\u26A0\uFE0F ERROR: ${message}
Read this to fix the scraper!`,
    url: "http://localhost",
    quality: "Log",
    headers: {}
  }];
}
function resolveLink(dataId, category) {
  return __async(this, null, function* () {
    try {
      const apiType = category.endsWith("_files") ? category : `${category}_files`;
      const url = `${API_BASE}/genLink?type=${apiType}&id=${dataId}`;
      const res = yield fetch(url, {
        method: "GET",
        headers: HEADERS
      });
      const data = yield res.json();
      return data.link || data.downloadUrl || data.url || null;
    } catch (e) {
      return null;
    }
  });
}
function getStreams(tmdbId, mediaType, season, episode) {
  return __async(this, null, function* () {
    try {
      const type = mediaType === "tv" || mediaType === "series" ? "tv" : "movie";
      const tmdbUrl = `https://api.themoviedb.org/3/${type}/${tmdbId}?api_key=${TMDB_API_KEY}`;
      const metaRes = yield fetch(tmdbUrl);
      if (!metaRes.ok)
        return pushError(`TMDB API blocked request. Status: ${metaRes.status}`);
      const meta = yield metaRes.json();
      const titleQuery = type === "movie" ? meta.title : meta.name;
      if (!titleQuery)
        return pushError(`Could not find TMDB title for ID: ${tmdbId}`);
      const year = type === "movie" && meta.release_date ? meta.release_date.substring(0, 4) : null;
      const searchUrl = `${API_BASE}/mix_media_files/search?q=${encodeURIComponent(titleQuery)}&page=1`;
      const searchRes = yield fetch(searchUrl, { headers: HEADERS });
      if (!searchRes.ok) {
        return pushError(`HashHackers API blocked us! Status: ${searchRes.status}. Token expired or IP blocked.`);
      }
      const searchData = yield searchRes.json();
      if (!searchData || !searchData.files) {
        return pushError(`API returned weird data without a 'files' array.`);
      }
      if (searchData.files.length === 0) {
        return pushError(`API returned 0 search results for "${titleQuery}".`);
      }
      const candidates = [];
      for (const file of searchData.files) {
        const itemTitle = file.file_name;
        const dataId = file.id;
        const category = "mix_media_files";
        const itemSize = formatBytes(parseInt(file.file_size, 10));
        if (!/\.(mkv|mp4|avi)$/i.test(itemTitle))
          continue;
        const cleanTitle = normalize(itemTitle);
        const cleanQuery = normalize(titleQuery);
        if (!cleanTitle.includes(cleanQuery))
          continue;
        if (year && !cleanTitle.includes(year))
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
      if (candidates.length === 0) {
        return pushError(`Found ${searchData.files.length} files, but they all got blocked by our filters!`);
      }
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
      const finalStreams = resolvedStreams.filter((s) => s !== null);
      if (finalStreams.length === 0) {
        return pushError(`Movies were found, but resolveLink() failed to get the final download URLs.`);
      }
      return finalStreams;
    } catch (e) {
      return pushError(`Crash: ${e.message}`);
    }
  });
}
if (typeof module !== "undefined" && module.exports) {
  module.exports = { getStreams };
} else {
  global.getStreams = getStreams;
}
