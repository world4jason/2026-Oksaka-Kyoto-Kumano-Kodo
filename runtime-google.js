/* Google Maps handoff adapter. SPDX-License-Identifier: AGPL-3.0-or-later */
(() => {
  const textValue = (value) => typeof value === "string" ? value.trim() : "";
  function publicMapUrl(value) {
    if (!textValue(value)) return "";
    try {
      const url = new URL(value);
      return ["https:", "http:"].includes(url.protocol) && !url.username && !url.password ? url.href : "";
    } catch { return ""; }
  }
  function googleTextQuery(item) {
    if (!item) return "";
    // Prefer the published destination to an activity title such as
    // "check in" or "A → B". A transport item may identify one concrete endpoint.
    const text = [item.googleQuery, item.mapQuery, item.mapPointLabel, item.location, item.title]
      .map(textValue).find(Boolean);
    if (text) return text;
    const point = window.TravelLiteMap?.coordinates(item);
    if (point) return `${point.lat},${point.lng}`;
    return "";
  }

  googleMapsOpenUrl = function googleMapsReviewsUrl(item) {
    if (!item) return "";
    const supplied = publicMapUrl(item.mapsUrl);
    if (supplied) return supplied;
    const query = googleTextQuery(item);
    if (!query) return "";
    const params = new URLSearchParams({ api: "1", query });
    if (item.googlePlaceId) params.set("query_place_id", item.googlePlaceId);
    return `https://www.google.com/maps/search/?${params.toString()}`;
  };

  window.googleMapsSearchUrl = function googleMapsSearchUrl(query, contextItem = null) {
    const search = String(query || "").trim();
    if (!search) return "";
    const context = googleTextQuery(contextItem);
    const fullQuery = context ? `${search} near ${context}` : search;
    const params = new URLSearchParams({ api: "1", query: fullQuery });
    return `https://www.google.com/maps/search/?${params.toString()}`;
  };

  googleMapsEmbedUrl = function officialGoogleMapsEmbedUrl(item) {
    if (!item) return "";
    const supplied = publicMapUrl(item.mapEmbedUrl);
    if (supplied) return supplied;
    const key = state.data.providers?.googleMapsEmbedKey;
    const query = googleTextQuery(item);
    if (!key || !query) return "";
    return `https://www.google.com/maps/embed/v1/place?key=${encodeURIComponent(key)}&q=${encodeURIComponent(query)}`;
  };
})();
