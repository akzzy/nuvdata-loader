/**
 * dahmer - Built from src/dahmer/
 * Generated: 2026-01-10T18:05:13.577Z
 */
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);
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

// src/dahmer/index.js
var dahmer_exports = {};
__export(dahmer_exports, {
  getStreams: () => getStreams
});
module.exports = __toCommonJS(dahmer_exports);
var import_cheerio = __toESM(require("cheerio"));
var BASE_URL = "https://a.111477.xyz";
var TMDB_API_KEY = "c9895066601b3a58e24c585c5457f00d";
function getStreams(tmdbId, mediaType, season, episode) {
  return __async(this, null, function* () {
    const streams = [];
    try {
      const meta = yield getMetadata(tmdbId, mediaType);
      if (!meta)
        return [];
      const { title, year } = meta;
      let targetUrl = "";
      if (mediaType === "movie") {
        const cleanTitle = title.replace(/:/g, "").trim();
        const folderName = `${cleanTitle} (${year})`;
        targetUrl = `${BASE_URL}/movies/${encodeURIComponent(folderName)}/`;
      } else {
        const cleanTitle = title.replace(/:/g, " -").trim();
        targetUrl = `${BASE_URL}/tvs/${encodeURIComponent(cleanTitle)}/Season%20${season}/`;
      }
      const response = yield fetch(targetUrl, {
        headers: {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
        }
      });
      if (!response.ok)
        return [];
      const html = yield response.text();
      const $ = import_cheerio.default.load(html);
      $("tbody tr").each((i, row) => {
        const $row = $(row);
        const linkElement = $row.find("a").first();
        const href = linkElement.attr("href");
        const filename = linkElement.text();
        const fileSize = $row.find("td.size").text().trim();
        if (!href || filename.includes("Parent Directory"))
          return;
        if (!filename.match(/\.(mkv|mp4|avi|mov|flv)$/i))
          return;
        let isMatch = false;
        if (mediaType === "movie") {
          if (filename.match(/1080p|2160p/i))
            isMatch = true;
          else if (filename.match(/\.(mkv|mp4)$/i))
            isMatch = true;
        } else {
          const pad = (num) => num < 10 ? `0${num}` : num;
          const sSlug = pad(season);
          const eSlug = pad(episode);
          const regex = new RegExp(`(S${sSlug}E${eSlug}|${season}x${eSlug})`, "i");
          if (filename.match(regex))
            isMatch = true;
        }
        if (isMatch) {
          const finalUrl = new URL(href, targetUrl).href;
          streams.push({
            name: "Dahmer",
            // Short identifier
            title: `${filename}
\u{1F4BE} ${fileSize || "Unknown"}`,
            url: finalUrl,
            quality: filename.match(/2160p/i) ? "4k" : "1080p",
            headers: {
              // Required to bypass 403/Throttling
              "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
              "Referer": BASE_URL + "/",
              "Connection": "keep-alive"
            }
          });
        }
      });
    } catch (e) {
      console.error(`Dahmer Error: ${e.message}`);
    }
    return streams;
  });
}
function getMetadata(id, type) {
  return __async(this, null, function* () {
    try {
      const url = `https://api.themoviedb.org/3/${type === "movie" ? "movie" : "tv"}/${id}?api_key=${TMDB_API_KEY}`;
      const res = yield fetch(url);
      const data = yield res.json();
      let year = "";
      if (type === "movie") {
        year = data.release_date ? data.release_date.substring(0, 4) : "";
      } else {
        year = data.first_air_date ? data.first_air_date.substring(0, 4) : "";
      }
      return {
        title: data.title || data.name,
        year
      };
    } catch (e) {
      return null;
    }
  });
}
