const debugFactory = require('debug');
const fetchBackoffFactory = require('node-fetch-backoff');
const parseLinkHeader = require('parse-link-header');
const merge = require('deepmerge');

const debug = debugFactory('phraseapp-client:fetch');

/**
 *
 * @param {string} url
 * @param {object} options
 */
const fetch = (url, options = {}) => {
  const opts = { ...options };
  let debugText = `${opts.method || 'GET'} to ${url}`;

  if (!opts.headers) {
    opts.headers = {};
  }

  if (opts.body) {
    opts.headers['Content-Type'] = 'application/json';
    if (typeof opts.body !== 'string') {
      opts.body = JSON.stringify(opts.body);
    }
    debugText += ` with body ${JSON.stringify(opts.body)}`;
  }

  const bfFetch = fetchBackoffFactory(opts);
  debug(debugText);
  return bfFetch(url, opts);
};

/**
 * GET convenience method
 */
fetch.get = async (url, options = {}) => {
  const result = await fetch(url, { ...options, method: 'GET' });
  if (result.status === 204) {
    return null;
  }

  return result.json();
};

/**
 * POST convenience method
 */
fetch.post = async (url, options = {}) => {
  const result = await fetch(url, { ...options, method: 'POST' });
  if (result.status === 204) {
    return null;
  }
  return result.json();
};

/**
 * PUT convenience method
 */
fetch.put = async (url, options = {}) => {
  const result = await fetch(url, { ...options, method: 'PUT' });
  if (result.status === 204) {
    return null;
  }
  return result.json();
};

/**
 * PATCH convenience method
 */
fetch.patch = async (url, options = {}) => {
  const result = await fetch(url, { ...options, method: 'PATCH' });
  if (result.status === 204) {
    return null;
  }
  return result.json();
};

/**
 * DELETE convenience method
 */
fetch.delete = async (url, options = {}) => {
  const result = await fetch(url, { ...options, method: 'DELETE' });
  if (result.status === 204) {
    return null;
  }
  return result.json();
};

/**
 * Get all pages by following next links
 */
fetch.getAll = async (url, options = {}) => {
  const result = await fetch(url, options);

  if (result.status === 204) {
    return null;
  }

  let data = await result.json();

  let { next: nextLink } = fetch.getLinksFromHeaders(result.headers);
  if (nextLink) {
    while (nextLink) {
      const nextResult = await fetch(nextLink.url, options);
      const nextJson = await nextResult.json();
      data = merge(data, nextJson);
      nextLink = fetch.getLinksFromHeaders(nextResult.headers).next;
    }
  }

  return data;
};

fetch.getLinksFromHeaders = (headers) => {
  const rawLinks = headers.get('link');
  const links = parseLinkHeader(rawLinks);
  return links || {};
};

module.exports = fetch;
