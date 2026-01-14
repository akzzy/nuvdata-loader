/**
 * moviesmod - Built from src/moviesmod/
 * Generated: 2026-01-14T17:01:17.110Z
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
var cookieJar = {};
function updateCookies(response) {
  try {
    const raw = response.headers.get("set-cookie");
    if (!raw)
      return;
    const cookies = Array.isArray(raw) ? raw : raw.split(/,(?=\s*[^;]+=[^;]+)/);
    cookies.forEach((c) => {
      const parts = c.split(";")[0].trim();
      const [key, value] = parts.split("=");
      if (key && value)
        cookieJar[key] = value;
    });
  } catch (e) {
  }
}
function makeRequest(_0) {
  return __async(this, arguments, function* (url, options = {}) {
    const headers = __spreadValues({
      "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      "Referer": BASE_URL
    }, options.headers);
    const cookieString = Object.entries(cookieJar).map(([k, v]) => `${k}=${v}`).join("; ");
    if (cookieString)
      headers["Cookie"] = cookieString;
    const res = yield fetch(url, __spreadProps(__spreadValues({}, options), { headers }));
    updateCookies(res);
    return res;
  });
}
function normalizeTitle(title) {
  return title.toLowerCase().replace(/[^\w\s]/g, "").replace(/\s+/g, " ").trim();
}
function calculateScore(title1, title2) {
  const n1 = normalizeTitle(title1);
  const n2 = normalizeTitle(title2);
  if (n1 === n2)
    return 1;
  if (n1.includes(n2) || n2.includes(n1))
    return 0.9;
  return 0;
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
        const resumeRes = yield makeRequest("https://driveseed.org" + resumeMatch[1]);
        const finalMatch = (yield resumeRes.text()).match(/href="([^"]+)">[^<]*Cloud Resume Download/i);
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
      for (const prop in cookieJar)
        delete cookieJar[prop];
      const tmdbUrl = `https://api.themoviedb.org/3/${mediaType === "tv" ? "tv" : "movie"}/${tmdbId}?api_key=${TMDB_API_KEY}`;
      const metaRes = yield fetch(tmdbUrl);
      const meta = yield metaRes.json();
      const titleQuery = mediaType === "movie" ? meta.title : meta.name;
      const year = mediaType === "movie" ? (_a = meta.release_date) == null ? void 0 : _a.substring(0, 4) : null;
      const searchUrl = `${BASE_URL}/?s=${encodeURIComponent(titleQuery)}`;
      console.log(`[MoviesMod] Searching: ${titleQuery}`);
      const searchRes = yield makeRequest(searchUrl);
      const searchHtml = yield searchRes.text();
      const candidates = [];
      const articleRegex = /<article[^>]*class="[^"]*latestPost[^"]*"[\s\S]*?<a\s+href="([^"]+)"\s+title="([^"]+)"/g;
      let match;
      while ((match = articleRegex.exec(searchHtml)) !== null) {
        const url = match[1];
        const title = match[2];
        let score = calculateScore(title, titleQuery);
        if (year) {
          if (title.includes(year))
            score += 0.2;
          else
            score -= 0.1;
        }
        if (mediaType === "tv" && season) {
          if (title.toLowerCase().includes(`season ${season}`))
            score += 0.3;
        }
        console.log(`[MoviesMod] Found: ${title} (Score: ${score.toFixed(1)})`);
        if (score > 0.5) {
          candidates.push({ url, title, score });
        }
      }
      candidates.sort((a, b) => b.score - a.score);
      if (candidates.length === 0) {
        console.log("[MoviesMod] No matching candidates found.");
        return [];
      }
      const bestPostUrl = candidates[0].url;
      console.log(`[MoviesMod] Winner: ${candidates[0].title}`);
      const postRes = yield makeRequest(bestPostUrl);
      const postHtml = yield postRes.text();
      const linksToProcess = [];
      const linkRegex = /<a[^>]+href="([^"]+)"[^>]*>([^<]*(?:Download|Link|Hub)[^<]*)<\/a>/gi;
      while ((match = linkRegex.exec(postHtml)) !== null) {
        let initialLink = match[1];
        let linkText = match[2];
        if (initialLink.includes("facebook") || initialLink.includes("telegram"))
          continue;
        let quality = "720p";
        if (linkText.includes("4k") || linkText.includes("2160p"))
          quality = "4K";
        else if (linkText.includes("1080p"))
          quality = "1080p";
        else if (linkText.includes("480p"))
          continue;
        if (mediaType === "tv") {
          const epMatch = linkText.match(/(?:Episode|Ep\.?|E)\s*0?(\d+)/i);
          if (epMatch) {
            if (parseInt(epMatch[1]) !== episode)
              continue;
          } else if (!linkText.toLowerCase().includes("pack") && !linkText.toLowerCase().includes("zip")) {
          }
        }
        linksToProcess.push({ link: initialLink, quality, text: linkText });
      }
      const results = yield Promise.all(linksToProcess.slice(0, 5).map((item) => __async(this, null, function* () {
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
      return results.filter((s) => s !== null);
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
