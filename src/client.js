const debugFactory = require('debug');
const parseLinkHeader = require('parse-link-header');
const Teepee = require('teepee');

const debug = debugFactory('phraseapp-client');

function getNextLinkFromHeaders(headers) {
  const links = parseLinkHeader(headers.link);
  return links && links.next ? links.next : null;
}

class PhraseAppClient extends Teepee {
  constructor(url, accessToken) {
    const opts = {
      url,
      headers: {
        Authorization: `token ${accessToken}`,
      },
    };
    super(opts);

    this.globalFetchOptions = {
      headers: {
        Authorization: `token ${accessToken}`,
        'Content-Type': 'application/json',
      },
      isOK: res => res.status < 400,
      extraText: (resp) => {
        const rateLimit = resp.headers.get('X-Rate-Limit-Limit');
        const rateLimitRemaining = resp.headers.get('X-Rate-Limit-Remaining');
        return `${rateLimitRemaining}/${rateLimit}`;
      },
    };
  }

  /**
   * Generic request method that follow next links in the header.
   *
   * @param {string} path
   * @param {object} options
   */
  async request(path, options = {}) {
    let { body } = options;

    if (typeof body !== 'string') {
      body = JSON.stringify(body);
    }

    const requestOptions = { ...options, url: path };

    const result = await super.request(requestOptions);
    debug(`Got response status ${result.status}`);
    const { body: resultBody } = result;

    if (result.status === 204) {
      return null;
    }

    let nextLink = getNextLinkFromHeaders(result.headers);
    if (nextLink) {
      debug(`Following next link ${nextLink}`);
      let resultData = resultBody;
      let nextPath;

      while (nextLink !== null) {
        debug(`Following next link ${nextLink}`);
        nextPath = nextLink.url.slice(this.url.length); // remove the baseUrl
        const nextResult = await this.request(nextPath);
        resultData = resultData.concat(nextResult.body);
        nextLink = getNextLinkFromHeaders(result.headers);
      }

      return resultData;
    }

    return resultBody;
  }

  /**
   * GET convenience method
   *
   * @param {string} path
   * @param {object} options
   */
  get(path, options) {
    const postOptions = { ...options, method: 'GET' };
    return this.request(path, postOptions);
  }

  /**
   * POST convenience method
   *
   * @param {string} path
   * @param {object} options
   */
  post(path, options) {
    const postOptions = { ...options, method: 'POST' };
    return this.request(path, postOptions);
  }

  /**
   * PUT convenience method
   *
   * @param {string} path
   * @param {object} options
   */
  put(path, options) {
    const postOptions = { ...options, method: 'PUT' };
    return this.request(path, postOptions);
  }

  /**
   * PATCH convenience method
   *
   * @param {string} path
   * @param {object} options
   */
  patch(path, options) {
    const postOptions = { ...options, method: 'PATCH' };
    return this.request(path, postOptions);
  }

  /**
   * DELETE convenience method
   *
   * @param {string} path
   * @param {object} options
   */
  delete(path, options) {
    const postOptions = { ...options, method: 'DELETE' };
    return this.request(path, postOptions);
  }

  /**
   * List all projects the current user has access to.
   *
   * @see https://developers.phraseapp.com/api/#projects
   */
  listProjects() {
    return this.get('/projects');
  }

  /**
   * Search keys for the given project matching query.
   *
   * @see https://developers.phraseapp.com/api/#keys_search
   * @param {string} projectId
   * @param {object} query
   */
  searchKeys(projectId, query = {}) {
    return this.post(`/projects/${projectId}/keys/search`, {
      body: query,
    });
  }

  /**
   * List all translation for a single key.
   *
   * @see https://developers.phraseapp.com/api/#translations_index_keys
   * @param {string} projectId
   * @param {string} keyId
   */
  listTranslations(projectId, keyId) {
    return this.get(`/projects/${projectId}/keys/${keyId}/translations`);
  }

  /**
   * Create translation for a key.
   *
   * @see https://developers.phraseapp.com/api/#translations_create
   * @param {string} projectId
   * @param {string} localeId
   * @param {string} keyId
   */
  createTranslation(projectId, localeId, keyId) {
    return this.post(`/projects/${projectId}/translations`, {
      body: {
        locale_id: localeId,
        key_id: keyId,
      },
    });
  }

  /**
   * Include translations for locales.
   *
   * @see https://developers.phraseapp.com/api/#translations_include
   * @param {string} projectId
   * @param {Array<string>} translationIds
   */
  includeTranslations(projectId, translationIds = []) {
    return this.patch(`/projects/${projectId}/translations/include`, {
      body: {
        q: `id:${[...translationIds].join(',')}`,
      },
    });
  }

  /**
   * Exclude translations for locales.
   *
   * @see https://developers.phraseapp.com/api/#translations_exclude
   * @param {string} projectId
   * @param {Array<string>} translationIds
   */
  excludeTranslations(projectId, translationIds = []) {
    return this.patch(`/projects/${projectId}/translations/exclude`, {
      body: {
        q: `id:${[...translationIds].join(',')}`,
      },
    });
  }
}

module.exports = PhraseAppClient;
