/**
 * moviesmod - Built from src/moviesmod/
 * Generated: 2026-01-14T17:36:02.829Z
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
    try {
      const tmdbUrl = `https://api.themoviedb.org/3/${mediaType === "tv" ? "tv" : "movie"}/${tmdbId}?api_key=${TMDB_API_KEY}`;
      const metaRes = yield fetch(tmdbUrl);
      const meta = yield metaRes.json();
      const query = mediaType === "movie" ? meta.title : meta.name;
      const cleanQuery = query.replace(/[^a-zA-Z0-9\s]/g, "");
      const searchRes = yield makePostRequest("search", { searchQuery: cleanQuery });
      if (!searchRes || !Array.isArray(searchRes) || searchRes.length === 0) {
        return [{
          name: "Debug Info",
          title: `\u274C No Results for: ${cleanQuery}`,
          url: "http://error",
          quality: "Error"
        }];
      }
      const firstItem = searchRes[0];
      const itemTitle = firstItem.title || firstItem.name || firstItem.post_title || "Unknown Title";
      const itemUrl = firstItem.url || firstItem.link || firstItem.permalink || firstItem.href;
      if (!itemUrl) {
        return [{
          name: "Debug Info",
          title: `\u274C Key Error. Keys found: ${Object.keys(firstItem).join(", ")}`,
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
      const validSources = qualityRes.sourceQualityList;
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
          title: `\u274C Final Link Resolution Failed`,
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
