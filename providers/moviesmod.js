/**
 * moviesmod - Built from src/moviesmod/
 * Generated: 2026-01-14T17:44:10.564Z
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

// src/moviesmod/index.js
console.log("[AcerMovies] Initializing provider");
var TMDB_API_KEY = "439c478a771f35c05022f9feabcca01c";
var ACER_BASE = "https://api.acermovies.fun/api";
var HEADERS = {
  "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
  "Origin": "https://acermovies.fun",
  "Referer": "https://acermovies.fun/",
  "Content-Type": "application/json"
};
function makePostRequest(endpoint, body) {
  return __async(this, null, function* () {
    try {
      const res = yield fetch(`${ACER_BASE}/${endpoint}`, {
        method: "POST",
        headers: HEADERS,
        body: JSON.stringify(body)
      });
      return yield res.json();
    } catch (e) {
      return null;
    }
  });
}
function getStreams(tmdbId, mediaType, season, episode) {
  return __async(this, null, function* () {
    var _a, _b;
    try {
      const tmdbUrl = `https://api.themoviedb.org/3/${mediaType === "tv" ? "tv" : "movie"}/${tmdbId}?api_key=${TMDB_API_KEY}`;
      const metaRes = yield fetch(tmdbUrl);
      const meta = yield metaRes.json();
      const engTitle = mediaType === "movie" ? meta.title : meta.name;
      const origTitle = mediaType === "movie" ? meta.original_title : meta.original_name;
      const year = mediaType === "movie" ? (_a = meta.release_date) == null ? void 0 : _a.substring(0, 4) : (_b = meta.first_air_date) == null ? void 0 : _b.substring(0, 4);
      let searchRes = [];
      let finalQuery = "";
      if (!searchRes || searchRes.length === 0) {
        console.log(`[AcerMovies] Attempt 1: ${engTitle}`);
        searchRes = yield makePostRequest("search", { searchQuery: engTitle });
        finalQuery = engTitle;
      }
      if ((!searchRes || searchRes.length === 0) && origTitle && origTitle !== engTitle) {
        console.log(`[AcerMovies] Attempt 2: ${origTitle}`);
        searchRes = yield makePostRequest("search", { searchQuery: origTitle });
        finalQuery = origTitle;
      }
      if (!searchRes || searchRes.length === 0) {
        const cleanTitle = engTitle.replace(/[^a-zA-Z0-9\s]/g, "");
        console.log(`[AcerMovies] Attempt 3: ${cleanTitle}`);
        searchRes = yield makePostRequest("search", { searchQuery: cleanTitle });
        finalQuery = cleanTitle;
      }
      if (!searchRes || !Array.isArray(searchRes) || searchRes.length === 0) {
        return [{
          name: "Debug Info",
          title: `\u274C Not Found: "${engTitle}"
Tried: English, Original, Clean`,
          url: "http://error",
          quality: "Error"
        }];
      }
      let selected = searchRes.find((item) => {
        const t = (item.title || item.name || "").toLowerCase();
        return t.includes(engTitle.toLowerCase()) || year && t.includes(year);
      });
      if (!selected)
        selected = searchRes[0];
      const itemUrl = selected.url || selected.link || selected.permalink;
      const itemTitle = selected.title || selected.name || "Unknown";
      if (!itemUrl) {
        return [{
          name: "Debug Info",
          title: `\u274C Key Error on result: ${itemTitle}`,
          url: "http://error",
          quality: "Error"
        }];
      }
      const qualityRes = yield makePostRequest("sourceQuality", { url: itemUrl });
      if (!qualityRes || !qualityRes.sourceQualityList) {
        return [{
          name: "Debug Info",
          title: `\u274C No Qualities for: ${itemTitle}`,
          url: "http://error",
          quality: "Error"
        }];
      }
      const validSources = qualityRes.sourceQualityList.filter((s) => !s.quality.includes("480p"));
      const streams = yield Promise.all(validSources.slice(0, 5).map((source) => __async(this, null, function* () {
        const linkRes = yield makePostRequest("sourceUrl", {
          url: source.url,
          seriesType: mediaType === "tv" ? "tv" : "movie"
        });
        if (linkRes && linkRes.sourceUrl) {
          return {
            name: "AcerMovies",
            title: `${source.title}
${source.quality}`,
            url: linkRes.sourceUrl,
            quality: source.quality,
            headers: { "User-Agent": HEADERS["User-Agent"] }
          };
        }
        return null;
      })));
      const finalStreams = streams.filter((s) => s !== null);
      if (finalStreams.length === 0) {
        return [{
          name: "Debug Info",
          title: `\u274C Link Resolution Failed`,
          url: "http://error",
          quality: "Error"
        }];
      }
      return finalStreams;
    } catch (e) {
      return [{
        name: "Debug Info",
        title: `\u274C Crash: ${e.message}`,
        url: "http://error",
        quality: "Error"
      }];
    }
  });
}
if (typeof module !== "undefined" && module.exports) {
  module.exports = { getStreams };
} else {
  global.getStreams = getStreams;
}
