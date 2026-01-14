/**
 * moviesmod - Built from src/moviesmod/
 * Generated: 2026-01-14T17:27:59.110Z
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
      console.log(`[AcerMovies] POST ${endpoint} with ${JSON.stringify(body)}`);
      const res = yield fetch(`${ACER_BASE}/${endpoint}`, {
        method: "POST",
        headers: HEADERS,
        body: JSON.stringify(body)
      });
      const text = yield res.text();
      try {
        return JSON.parse(text);
      } catch (e) {
        console.log(`[AcerMovies] Failed to parse JSON from ${endpoint}. Response: ${text.substring(0, 100)}...`);
        return null;
      }
    } catch (e) {
      console.log(`[AcerMovies] Request Error: ${e.message}`);
      return null;
    }
  });
}
function normalizeResult(item) {
  const title = item.title || item.name || item.post_title || item.movieName || item.seriesName || "";
  const url = item.url || item.link || item.permalink || item.href || item.post_link || "";
  return { title, url, original: item };
}
function getStreams(tmdbId, mediaType, season, episode) {
  return __async(this, null, function* () {
    try {
      const tmdbUrl = `https://api.themoviedb.org/3/${mediaType === "tv" ? "tv" : "movie"}/${tmdbId}?api_key=${TMDB_API_KEY}`;
      const metaRes = yield fetch(tmdbUrl);
      const meta = yield metaRes.json();
      const title = mediaType === "movie" ? meta.title : meta.name;
      const cleanTitle = title.replace(/\(\d{4}\)/, "").trim();
      console.log(`[AcerMovies] Query: "${cleanTitle}"`);
      const searchRes = yield makePostRequest("search", { searchQuery: cleanTitle });
      if (!searchRes || !Array.isArray(searchRes) || searchRes.length === 0) {
        console.log("[AcerMovies] Search returned empty/invalid results.");
        return [];
      }
      console.log("[AcerMovies] First Result Keys:", Object.keys(searchRes[0]));
      const candidates = searchRes.map(normalizeResult);
      let selected = candidates.find((c) => c.title.toLowerCase().includes(cleanTitle.toLowerCase()));
      if (!selected) {
        console.log("[AcerMovies] Strict match failed, picking first result.");
        selected = candidates[0];
      }
      if (!selected || !selected.url) {
        console.log("[AcerMovies] Selected item has no URL.", selected);
        return [];
      }
      console.log(`[AcerMovies] Selected: ${selected.title}`);
      const qualityRes = yield makePostRequest("sourceQuality", { url: selected.url });
      if (!qualityRes || !qualityRes.sourceQualityList) {
        console.log("[AcerMovies] No sourceQualityList found.");
        return [];
      }
      const streams = [];
      const validSources = qualityRes.sourceQualityList.filter((s) => !s.quality.includes("480p"));
      const topSources = validSources.slice(0, 5);
      const promises = topSources.map((source) => __async(this, null, function* () {
        try {
          const payload = {
            url: source.url,
            seriesType: mediaType === "tv" ? "tv" : "movie"
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
