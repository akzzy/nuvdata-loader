/**
 * ddlbase - Built from src/ddlbase/
 * Generated: 2026-06-02T18:26:40.471Z
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

// src/ddlbase/index.js
var BASE_URL = "https://goatapi.imreallydagoatt.workers.dev";
function getStreams(tmdbId, mediaType) {
  return __async(this, null, function* () {
    if (mediaType !== "movie") {
      return [];
    }
    try {
      const response = yield fetch(`${BASE_URL}/api/downloader/movie/${tmdbId}`);
      const data = yield response.json();
      if (data && data.success && Array.isArray(data.streams)) {
        return data.streams.map((stream) => ({
          name: "DDL Base \u{1F4E5} Premium",
          title: `${data.title || "Movie"} | ${stream.quality || "1080p"} ${stream.codec ? `[${stream.codec}]` : ""} (Direct Link)`,
          url: stream.url,
          quality: stream.quality || "1080p"
        }));
      }
    } catch (error) {
      console.error("[DDL Base] Downloader direct link error:", error.message);
    }
    return [];
  });
}
module.exports = { getStreams };
