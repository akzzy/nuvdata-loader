/**
 * moviesmod - Built from src/moviesmod/
 * Generated: 2026-01-14T17:22:11.442Z
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
    const res = yield fetch(`${ACER_BASE}/${endpoint}`, {
      method: "POST",
      headers: HEADERS,
      body: JSON.stringify(body)
    });
    return res.json();
  });
}
function normalize(str) {
  return str.toLowerCase().replace(/[^a-z0-9\s]/g, "").trim();
}
function getStreams(tmdbId, mediaType, season, episode) {
  return __async(this, null, function* () {
    var _a, _b;
    try {
      const tmdbUrl = `https://api.themoviedb.org/3/${mediaType === "tv" ? "tv" : "movie"}/${tmdbId}?api_key=${TMDB_API_KEY}`;
      const metaRes = yield fetch(tmdbUrl);
      const meta = yield metaRes.json();
      const title = mediaType === "movie" ? meta.title : meta.name;
      const year = mediaType === "movie" ? (_a = meta.release_date) == null ? void 0 : _a.substring(0, 4) : (_b = meta.first_air_date) == null ? void 0 : _b.substring(0, 4);
      console.log(`[AcerMovies] Searching for: ${title} (${year})`);
      const searchRes = yield makePostRequest("search", { searchQuery: title });
      if (!searchRes || searchRes.length === 0) {
        console.log("[AcerMovies] No search results found.");
        return [];
      }
      let selectedMovie = null;
      selectedMovie = searchRes.find((item) => {
        const itemTitle = normalize(item.title || "");
        const queryTitle = normalize(title);
        return itemTitle.includes(queryTitle) && (year && item.title.includes(year));
      });
      if (!selectedMovie) {
        selectedMovie = searchRes.find((item) => normalize(item.title || "").includes(normalize(title)));
      }
      if (!selectedMovie) {
        console.log("[AcerMovies] No matching movie found in results.");
        return [];
      }
      console.log(`[AcerMovies] Selected: ${selectedMovie.title}`);
      const qualityRes = yield makePostRequest("sourceQuality", { url: selectedMovie.url });
      if (!qualityRes.sourceQualityList || qualityRes.sourceQualityList.length === 0) {
        console.log("[AcerMovies] No source qualities found.");
        return [];
      }
      const streams = [];
      const validSources = qualityRes.sourceQualityList.filter((s) => !s.quality.includes("480p"));
      const topSources = validSources.slice(0, 5);
      const promises = topSources.map((source) => __async(this, null, function* () {
        try {
          const payload = {
            url: source.url,
            seriesType: "movie"
            // You might need to change this to 'tv' if testing shows
          };
          const linkRes = yield makePostRequest("sourceUrl", payload);
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
        } catch (e) {
          console.log(`[AcerMovies] Failed to resolve ${source.quality}: ${e.message}`);
        }
        return null;
      }));
      const resolvedStreams = yield Promise.all(promises);
      return resolvedStreams.filter((s) => s !== null);
    } catch (e) {
      console.log(`[AcerMovies] Error: ${e.message}`);
      return [];
    }
  });
}
if (typeof module !== "undefined" && module.exports) {
  module.exports = { getStreams };
} else {
  global.getStreams = getStreams;
}
