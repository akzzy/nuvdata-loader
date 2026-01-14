/**
 * moviesmod - Built from src/moviesmod/
 * Generated: 2026-01-14T18:07:52.930Z
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
function normalize(str) {
  return str.toLowerCase().replace(/[^a-z0-9\s]/g, "").trim();
}
function getStreams(tmdbId, mediaType, season, episode) {
  return __async(this, null, function* () {
    try {
      const tmdbUrl = `https://api.themoviedb.org/3/${mediaType === "tv" ? "tv" : "movie"}/${tmdbId}?api_key=${TMDB_API_KEY}`;
      const metaRes = yield fetch(tmdbUrl);
      const meta = yield metaRes.json();
      const engTitle = mediaType === "movie" ? meta.title : meta.name;
      const cleanTitle = engTitle.replace(/[^a-zA-Z0-9\s]/g, "");
      console.log(`[AcerMovies] Searching: ${cleanTitle}`);
      const apiResponse = yield makePostRequest("search", { searchQuery: cleanTitle });
      let searchResults = [];
      if (apiResponse && apiResponse.searchResult && Array.isArray(apiResponse.searchResult)) {
        searchResults = apiResponse.searchResult;
      } else if (Array.isArray(apiResponse)) {
        searchResults = apiResponse;
      }
      if (searchResults.length === 0) {
        console.log("[AcerMovies] No movies found.");
        return [];
      }
      const target = normalize(engTitle);
      let selected = searchResults.find((item) => {
        const itemTitle = normalize(item.title || "");
        return itemTitle.includes(target);
      });
      if (!selected) {
        console.log("[AcerMovies] Fuzzy match failed, picking first result.");
        selected = searchResults[0];
      }
      console.log(`[AcerMovies] Selected: ${selected.title}`);
      const qualityRes = yield makePostRequest("sourceQuality", { url: selected.url });
      if (!qualityRes || !qualityRes.sourceQualityList) {
        console.log("[AcerMovies] No source qualities found.");
        return [];
      }
      const streams = [];
      const validSources = qualityRes.sourceQualityList.filter((s) => !s.quality.includes("480p"));
      const promises = validSources.slice(0, 5).map((source) => __async(this, null, function* () {
        try {
          const linkRes = yield makePostRequest("sourceUrl", {
            url: source.url,
            seriesType: mediaType === "tv" ? "tv" : "movie"
          });
          if (linkRes && linkRes.sourceUrl) {
            const playableUrl = linkRes.sourceUrl.includes(".mkv") || linkRes.sourceUrl.includes(".mp4") ? linkRes.sourceUrl : linkRes.sourceUrl + "#.mkv";
            return {
              name: "AcerMovies",
              title: `${source.title}
${source.quality}`,
              url: playableUrl,
              quality: source.quality,
              headers: {
                "User-Agent": HEADERS["User-Agent"],
                "Referer": "https://acermovies.fun/"
              }
            };
          }
        } catch (e) {
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
