const debugFactory = require('debug');
const backoffFetch = require('node-fetch-backoff');
const parseLinkHeader = require('parse-link-header');

class PhraseAppClient {
  constructor(baseUrl, accessToken) {
    this.baseUrl = baseUrl;
    this.accessToken = accessToken;

    this.globalFetchOptions = {
      headers: {
        Authorization: `token ${accessToken}`,
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
    };
  }

  async request(path, options = {}) {
    const debug = options.debug || debugFactory(options.requestId || 'phraseappclient');
    const fetch = options.fetch || backoffFetch();
    let { body } = options;

    let url;
    if (options.absoluteUrl === true) {
      url = path;
    } else if (path.substring(0, 1) === '/') {
      url = `${this.baseUrl}${path}`;
    } else {
      url = `${this.baseUrl}/${path}`;
    }

    if (typeof body !== 'string') {
      body = JSON.stringify(body);
    }

    const requestOptions = Object.assign({}, this.globalFetchOptions, options, {
      body,
    });
    const res = await fetch(url, requestOptions);

    debug('Return status is %d', res.status);
    if (res.status > 399) {
      throw new Error(`Error requesting ${url}. Request returned http error ${res.status}.`);
    }

    if (res.status === 204) {
      return null;
    }

    const contentType = res.headers.get('content-type');
    if (!contentType.match(/^application\/json/)) {
      throw new Error(`Unexpected content returned from ${url}. Returned content type ${contentType}.`);
    }

    let json;
    try {
      json = await res.json();
    } catch (error) {
      throw new Error(`Unable to parse JSON content. Got error ${error}.`);
    }
    let data = json;

    const links = parseLinkHeader(res.headers.get('link'));
    if (links && links.next) {
      debug('Following next link');
      data = data.concat(await this.request(links.next.url, Object.assign({}, requestOptions, {
        absoluteUrl: true,
      })));
    }

    return data;
  }
}

module.exports = PhraseAppClient;
