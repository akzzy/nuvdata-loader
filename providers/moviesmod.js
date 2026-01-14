/**
 * moviesmod - Built from src/moviesmod/
 * Generated: 2026-01-14T16:43:03.858Z
 */
var __defProp = Object.defineProperty;
var __defProps = Object.defineProperties;
var __getOwnPropDescs = Object.getOwnPropertyDescriptors;
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
var __spreadProps = (a, b) => __defProps(a, __getOwnPropDescs(b));
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
console.log("[MoviesMod] Initializing MoviesMod scraper");
var TMDB_API_KEY = "439c478a771f35c05022f9feabcca01c";
var BASE_URL = "https://moviesmod.build";
function makeRequest(_0) {
  return __async(this, arguments, function* (url, options = {}) {
    return fetch(url, __spreadProps(__spreadValues({}, options), {
      headers: __spreadValues({
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
        "Referer": BASE_URL
      }, options.headers)
    }));
  });
}
function getSimilarity(s1, s2) {
  let longer = s1;
  let shorter = s2;
  if (s1.length < s2.length) {
    longer = s2;
    shorter = s1;
  }
  const longerLength = longer.length;
  if (longerLength === 0)
    return 1;
  return (longerLength - editDistance(longer, shorter)) / parseFloat(longerLength);
}
function editDistance(s1, s2) {
  s1 = s1.toLowerCase();
  s2 = s2.toLowerCase();
  const costs = new Array();
  for (let i = 0; i <= s1.length; i++) {
    let lastValue = i;
    for (let j = 0; j <= s2.length; j++) {
      if (i === 0)
        costs[j] = j;
      else {
        if (j > 0) {
          let newValue = costs[j - 1];
          if (s1.charAt(i - 1) !== s2.charAt(j - 1))
            newValue = Math.min(Math.min(newValue, lastValue), costs[j]) + 1;
          costs[j - 1] = lastValue;
          lastValue = newValue;
        }
      }
    }
    if (i > 0)
      costs[s2.length] = lastValue;
  }
  return costs[s2.length];
}
function resolveSidLink(sidUrl) {
  return __async(this, null, function* () {
    try {
      const res1 = yield makeRequest(sidUrl);
      const html1 = yield res1.text();
      const wpHttpMatch = html1.match(/name="_wp_http"\s+value="([^"]+)"/);
      const actionMatch = html1.match(/action="([^"]+)"/);
      if (!wpHttpMatch || !actionMatch)
        return null;
      const postUrl1 = actionMatch[1];
      const body1 = `_wp_http=${encodeURIComponent(wpHttpMatch[1])}`;
      const res2 = yield makeRequest(postUrl1, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded", "Referer": sidUrl },
        body: body1
      });
      const html2 = yield res2.text();
      const wpHttp2Match = html2.match(/name="_wp_http2"\s+value="([^"]+)"/);
      const tokenMatch = html2.match(/name="token"\s+value="([^"]+)"/);
      const actionMatch2 = html2.match(/action="([^"]+)"/);
      if (!wpHttp2Match || !tokenMatch)
        return null;
      const body2 = `_wp_http2=${encodeURIComponent(wpHttp2Match[1])}&token=${encodeURIComponent(tokenMatch[1])}`;
      const res3 = yield makeRequest(actionMatch2 ? actionMatch2[1] : postUrl1, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded", "Referer": postUrl1 },
        body: body2
      });
      const html3 = yield res3.text();
      const metaRefresh = html3.match(/content=".*?url=(.*?)"/i);
      if (metaRefresh)
        return metaRefresh[1].replace(/['"]/g, "");
      const windowLoc = html3.match(/window\.location\.href\s*=\s*['"]([^'"]+)['"]/);
      if (windowLoc)
        return windowLoc[1];
      return null;
    } catch (e) {
      return null;
    }
  });
}
function resolveDriveSeed(url) {
  return __async(this, null, function* () {
    try {
      const res = yield makeRequest(url);
      const html = yield res.text();
      const resumeMatch = html.match(/href="([^"]+)">[^<]*Resume Cloud/i);
      if (resumeMatch) {
        let resumeUrl = "https://driveseed.org" + resumeMatch[1];
        const resumeRes = yield makeRequest(resumeUrl);
        const resumeHtml = yield resumeRes.text();
        const finalMatch = resumeHtml.match(/href="([^"]+)">[^<]*Cloud Resume Download/i);
        if (finalMatch)
          return finalMatch[1];
      }
      const instantMatch = html.match(/href="([^"]+)">\s*Instant/i);
      if (instantMatch) {
        let link = instantMatch[1];
        if (link.startsWith("/"))
          link = "https://driveseed.org" + link;
        return link;
      }
      const downloadMatch = html.match(/href="([^"]+\/download\/[^"]+)"/);
      if (downloadMatch) {
        let link = downloadMatch[1];
        if (link.startsWith("/"))
          link = "https://driveseed.org" + link;
        return link;
      }
      return null;
    } catch (e) {
      return null;
    }
  });
}
function getStreams(tmdbId, mediaType, season, episode) {
  return __async(this, null, function* () {
    var _a;
    try {
      const tmdbUrl = `https://api.themoviedb.org/3/${mediaType === "tv" ? "tv" : "movie"}/${tmdbId}?api_key=${TMDB_API_KEY}`;
      const metaRes = yield fetch(tmdbUrl);
      const meta = yield metaRes.json();
      let query = mediaType === "movie" ? `${meta.title} ${(_a = meta.release_date) == null ? void 0 : _a.substring(0, 4)}` : meta.name;
      const searchUrl = `${BASE_URL}/?s=${encodeURIComponent(query)}`;
      console.log(`[MoviesMod] Searching: ${searchUrl}`);
      const searchRes = yield makeRequest(searchUrl);
      const searchHtml = yield searchRes.text();
      const postRegex = /<a\s+href="([^"]+)"\s+title="([^"]+)"/g;
      let match;
      let bestPostUrl = null;
      let highestScore = 0;
      while ((match = postRegex.exec(searchHtml)) !== null) {
        const url = match[1];
        const title = match[2];
        const score = getSimilarity(title, query);
        if (mediaType === "movie" && meta.release_date) {
          if (!title.includes(meta.release_date.substring(0, 4)))
            continue;
        }
        if (score > highestScore && score > 0.4) {
          highestScore = score;
          bestPostUrl = url;
        }
      }
      if (!bestPostUrl) {
        console.log(`[MoviesMod] No matching post found for: ${query}`);
        return [];
      }
      console.log(`[MoviesMod] Best Match (${highestScore.toFixed(2)}): ${bestPostUrl}`);
      const postRes = yield makeRequest(bestPostUrl);
      const postHtml = yield postRes.text();
      const streams = [];
      const linkRegex = /<a[^>]+href="([^"]+)"[^>]*>([^<]*(?:Download|Link|Hub)[^<]*)<\/a>/gi;
      let linkMatch;
      let linksToProcess = [];
      while ((linkMatch = linkRegex.exec(postHtml)) !== null) {
        let initialLink = linkMatch[1];
        let linkText = linkMatch[2];
        if (initialLink.includes("facebook") || initialLink.includes("telegram") || initialLink.includes("#"))
          continue;
        let quality = "Unknown";
        if (linkText.includes("4k") || linkText.includes("2160p"))
          quality = "4K";
        else if (linkText.includes("1080p"))
          quality = "1080p";
        else if (linkText.includes("720p"))
          quality = "720p";
        if (quality === "Unknown")
          continue;
        if (mediaType === "tv") {
          if (linkText.includes("Episode") || linkText.includes("Ep")) {
            const epMatch = linkText.match(/(?:Episode|Ep\.?|E)\s*0?(\d+)/i);
            if (epMatch && parseInt(epMatch[1]) !== episode)
              continue;
          }
        }
        linksToProcess.push({ link: initialLink, quality, text: linkText });
      }
      linksToProcess = linksToProcess.slice(0, 5);
      const resolvedStreams = yield Promise.all(linksToProcess.map((item) => __async(this, null, function* () {
        let finalUrl = null;
        let currentUrl = item.link;
        if (currentUrl.includes("tech.unblockedgames") || currentUrl.includes("tech.examzculture")) {
          const sidResult = yield resolveSidLink(currentUrl);
          if (sidResult)
            currentUrl = sidResult;
        }
        if (currentUrl && currentUrl.includes("driveseed")) {
          finalUrl = yield resolveDriveSeed(currentUrl);
        } else {
          finalUrl = currentUrl;
        }
        if (finalUrl) {
          return {
            name: "MoviesMod",
            title: `MoviesMod
${item.quality} | ${item.text.trim()}`,
            url: finalUrl,
            quality: item.quality,
            headers: { "User-Agent": "Mozilla/5.0" }
          };
        }
        return null;
      })));
      return resolvedStreams.filter((s) => s !== null);
    } catch (e) {
      console.log(`[MoviesMod] Error: ${e.message}`);
      return [];
    }
  });
}
if (typeof module !== "undefined" && module.exports) {
  module.exports = { getStreams };
} else {
  global.getStreams = getStreams;
}
