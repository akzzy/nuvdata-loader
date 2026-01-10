/**
 * dahmer - Built from src/dahmer/
 * Generated: 2026-01-10T20:11:11.684Z
 */
var __defProp = Object.defineProperty;
var __getOwnPropSymbols = Object.getOwnPropertySymbols;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __propIsEnum = Object.prototype.propertyIsEnumerable;
var __defNormalProp = (obj, key, value) => key in obj ? __defProp(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
var __spreadValues = (a, b) => {
  for (var prop in b || (b = {}))
    if (__hasOwnProp.call(b, prop))
      __defNormalProp(a, prop, b[prop]);
  if (__getOwnPropSymbols)
    for (var prop of __getOwnPropSymbols(b)) {
      if (__propIsEnum.call(b, prop))
        __defNormalProp(a, prop, b[prop]);
    }
  return a;
};

// src/dahmer/index.js
console.log("[DahmerMovies] Initializing Dahmer Movies scraper");
var TMDB_API_KEY = "439c478a771f35c05022f9feabcca01c";
var DAHMER_MOVIES_API = "https://a.111477.xyz";
var TIMEOUT = 6e4;
var Qualities = {
  Unknown: 0,
  P144: 144,
  P240: 240,
  P360: 360,
  P480: 480,
  P720: 720,
  P1080: 1080,
  P1440: 1440,
  P2160: 2160
};
function makeRequest(url, options = {}) {
  const requestOptions = __spreadValues({
    timeout: TIMEOUT,
    headers: __spreadValues({
      "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
      "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
      "Connection": "keep-alive"
    }, options.headers)
  }, options);
  return fetch(url, requestOptions).then(function(response) {
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    return response;
  });
}
function getEpisodeSlug(season = null, episode = null) {
  if (season === null && episode === null)
    return ["", ""];
  const seasonSlug = season < 10 ? `0${season}` : `${season}`;
  const episodeSlug = episode < 10 ? `0${episode}` : `${episode}`;
  return [seasonSlug, episodeSlug];
}
function getIndexQuality(str) {
  if (!str)
    return Qualities.Unknown;
  const match = str.match(/(\d{3,4})[pP]/);
  return match ? parseInt(match[1]) : Qualities.Unknown;
}
function getQualityWithCodecs(str) {
  if (!str)
    return "Unknown";
  const qualityMatch = str.match(/(\d{3,4})[pP]/);
  const baseQuality = qualityMatch ? `${qualityMatch[1]}p` : "Unknown";
  const codecs = [];
  const lowerStr = str.toLowerCase();
  if (lowerStr.includes("dv") || lowerStr.includes("dolby vision"))
    codecs.push("DV");
  if (lowerStr.includes("hdr10+"))
    codecs.push("HDR10+");
  else if (lowerStr.includes("hdr10") || lowerStr.includes("hdr"))
    codecs.push("HDR");
  if (lowerStr.includes("remux"))
    codecs.push("REMUX");
  if (lowerStr.includes("imax"))
    codecs.push("IMAX");
  if (codecs.length > 0)
    return `${baseQuality} | ${codecs.join(" | ")}`;
  return baseQuality;
}
function formatFileSize(sizeText) {
  if (!sizeText)
    return null;
  if (/\d+(\.\d+)?\s*(GB|MB|KB|TB)/i.test(sizeText))
    return sizeText;
  const bytes = parseInt(sizeText);
  if (isNaN(bytes))
    return sizeText;
  const sizes = ["Bytes", "KB", "MB", "GB", "TB"];
  if (bytes === 0)
    return "0 Bytes";
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return `${(bytes / Math.pow(1024, i)).toFixed(2)} ${sizes[i]}`;
}
function parseLinks(html) {
  const links = [];
  const rowRegex = new RegExp("<tr[^>]*>(.*?)<\\/tr>", "gis");
  let rowMatch;
  while ((rowMatch = rowRegex.exec(html)) !== null) {
    const rowContent = rowMatch[1];
    const linkMatch = rowContent.match(/<a[^>]*href=["']([^"']*)["'][^>]*>([^<]*)<\/a>/i);
    if (!linkMatch)
      continue;
    const href = linkMatch[1];
    const text = linkMatch[2].trim();
    if (!text || href === "../" || text === "../")
      continue;
    let size = null;
    const sizeMatchExact = rowContent.match(/<td[^>]*class="size"[^>]*>([^<]+)<\/td>/i);
    if (sizeMatchExact) {
      size = sizeMatchExact[1].trim();
    }
    if (!size) {
      const sizeMatchSort = rowContent.match(/<td[^>]*data-sort=["']?\d+["']?[^>]*>([^<]+)<\/td>/i);
      if (sizeMatchSort) {
        size = sizeMatchSort[1].trim();
      }
    }
    if (!size) {
      const sizeMatchClass = rowContent.match(/<td[^>]*class=["']filesize["'][^>]*[^>]*>([^<]+)<\/td>/i);
      if (sizeMatchClass) {
        size = sizeMatchClass[1].trim();
      }
    }
    links.push({ text, href, size });
  }
  return links;
}
function invokeDahmerMovies(title, year, season = null, episode = null) {
  const encodedUrl = season === null ? `${DAHMER_MOVIES_API}/movies/${encodeURIComponent(title.replace(/:/g, "") + " (" + year + ")")}/` : `${DAHMER_MOVIES_API}/tvs/${encodeURIComponent(title.replace(/:/g, " -"))}/Season ${season}/`;
  console.log(`[DahmerMovies] Fetching from: ${encodedUrl}`);
  return makeRequest(encodedUrl).then(function(response) {
    return response.text();
  }).then(function(html) {
    const paths = parseLinks(html);
    console.log(`[DahmerMovies] Found ${paths.length} links`);
    let filteredPaths;
    if (season === null) {
      filteredPaths = paths.filter((path) => /(1080p|2160p)/i.test(path.text));
    } else {
      const [seasonSlug, episodeSlug] = getEpisodeSlug(season, episode);
      const episodePattern = new RegExp(`S${seasonSlug}E${episodeSlug}`, "i");
      filteredPaths = paths.filter((path) => episodePattern.test(path.text));
    }
    if (filteredPaths.length === 0)
      return [];
    const results = filteredPaths.map((path) => {
      const qualityWithCodecs = getQualityWithCodecs(path.text);
      let fullUrl;
      try {
        if (path.href.startsWith("http")) {
          fullUrl = path.href;
        } else {
          const resolved = new URL(path.href, encodedUrl);
          fullUrl = resolved.href;
        }
        fullUrl = fullUrl.replace(/ /g, "%20");
      } catch (e) {
        fullUrl = encodedUrl + path.href.replace(/ /g, "%20");
      }
      return {
        name: "DahmerMovies",
        title: `${path.text}
\u{1F4BE} ${path.size || "Unknown"}`,
        url: fullUrl,
        quality: qualityWithCodecs,
        size: formatFileSize(path.size),
        headers: {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
          "Referer": encodedUrl
        },
        provider: "dahmermovies",
        filename: path.text
      };
    });
    results.sort((a, b) => {
      const qualityA = getIndexQuality(a.filename);
      const qualityB = getIndexQuality(b.filename);
      return qualityB - qualityA;
    });
    return results;
  }).catch(function(error) {
    console.log(`[DahmerMovies] Error: ${error.message}`);
    return [];
  });
}
function getStreams(tmdbId, mediaType = "movie", seasonNum = null, episodeNum = null) {
  const tmdbUrl = `https://api.themoviedb.org/3/${mediaType === "tv" ? "tv" : "movie"}/${tmdbId}?api_key=${TMDB_API_KEY}`;
  return makeRequest(tmdbUrl).then(function(tmdbResponse) {
    return tmdbResponse.json();
  }).then(function(tmdbData) {
    var _a, _b;
    const title = mediaType === "tv" ? tmdbData.name : tmdbData.title;
    const year = mediaType === "tv" ? (_a = tmdbData.first_air_date) == null ? void 0 : _a.substring(0, 4) : (_b = tmdbData.release_date) == null ? void 0 : _b.substring(0, 4);
    if (!title)
      throw new Error("Could not extract title from TMDB response");
    return invokeDahmerMovies(title, year ? parseInt(year) : null, seasonNum, episodeNum);
  }).catch(function(error) {
    console.error(`[DahmerMovies] Error in getStreams: ${error.message}`);
    return [];
  });
}
if (typeof module !== "undefined" && module.exports) {
  module.exports = { getStreams };
} else {
  global.getStreams = getStreams;
}
