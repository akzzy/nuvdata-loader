/**
 * ddlbase - Built from src/ddlbase/
 * Generated: 2026-06-02T18:50:44.364Z
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
    const streamsResult = [];
    try {
      const response = yield fetch(`${BASE_URL}/api/downloader/movie/${tmdbId}`);
      const data = yield response.json();
      if (data && data.success && Array.isArray(data.downloads)) {
        for (const download of data.downloads) {
          const qualityMatch = download.title.match(/(\d{3,4}p)/i);
          const extractedQuality = qualityMatch ? qualityMatch[1].toLowerCase() : "1080p";
          const sizeInfo = download.size && download.size !== "Unknown" ? ` [${download.size}]` : "";
          if (Array.isArray(download.sources)) {
            for (const source of download.sources) {
              const displayLabel = `DDL Base \u{1F4E5} ${source.name} | ${download.title}${sizeInfo}`;
              streamsResult.push({
                name: displayLabel,
                // Main UI Text Element
                title: download.title,
                // Hidden fallback asset
                url: source.url,
                // Stream playback address
                quality: extractedQuality
                // UI Quality Badge (4K, 1080p, etc.)
              });
            }
          }
        }
      }
    } catch (error) {
      console.error("[DDL Base] Direct link layout packing error:", error.message);
    }
    return streamsResult;
  });
}
module.exports = { getStreams };
