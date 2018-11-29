const debugFactory = require('debug');
const fetch = require('./fetch');
const urljoin = require('url-join');

const debug = debugFactory('phraseapp-client');

/**
 * 
 */
class PhraseAppClient {
  /**
   * 
   * @param {string} url 
   * @param {string} accessToken 
   */
  constructor(url, accessToken) {
    this.baseUrl = url;
    this.globalFetchOptions = {
      headers: {
        Authorization: `token ${accessToken}`,
        'User-Agent': 'https://www.npmjs.com/package/phraseapp-client',
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
   * List all projects the current user has access to.
   *
   * @see https://developers.phraseapp.com/api/#projects
   */
  listProjects() {
    const url = urljoin(this.baseUrl, 'projects');
    return fetch.getAll(url, this.globalFetchOptions);
  }

  /**
   * List all locales for a projects.
   *
   * @param {string} projectId
   * @see https://developers.phraseapp.com/api/#locales_index
   */
  listLocales(projectId) {
    const url = urljoin(this.baseUrl, `/projects/${projectId}/locales`);
    return fetch.getAll(url, this.globalFetchOptions);
  }

  /**
   * List all keys for a project
   * 
   * @param {string} projectId 
   * @see https://developers.phraseapp.com/api/#keys_index
   */
  listKeys(projectId) {
    const url = urljoin(this.baseUrl, `/projects/${projectId}/keys?per_page=100`);
    return fetch.getAll(url, this.globalFetchOptions);
  }

  /**
   * Search keys for the given project matching query.
   *
   * @param {string} projectId
   * @param {object} query
   * @see https://developers.phraseapp.com/api/#keys_search
   */
  searchKeys(projectId, query = {}) {
    const url = urljoin(this.baseUrl, `/projects/${projectId}/keys/search?per_page=100`);
    return fetch.post(url, {
      ...this.globalFetchOptions,
      body: query,
    });
  }

  /**
   * List translations for the given project.
   *
   * @param {string} projectId
   * @see https://developers.phraseapp.com/api/#translations_index
   */
  listTranslations(projectId) {
    const url = urljoin(this.baseUrl, `/projects/${projectId}/translations?per_page=100`);
    return fetch.getAll(url, this.globalFetchOptions);
  }

  /**
   * Search translation for the given project matching query.
   * 
   * @param {string} projectId 
   * @param {*} query 
   * @see https://developers.phraseapp.com/api/#translations_search
   */
  searchTranslations(projectId, query = {}) {
    const url = urljoin(this.baseUrl, `/projects/${projectId}/translations/search?per_page=100`);
    return fetch.post(url, {
      ...this.globalFetchOptions,
      body: query,
    });
  }

  /**
   * List translations for a specific key.
   * 
   * @param {string} projectId 
   * @param {string} keyId 
   * @see https://developers.phraseapp.com/api/#translations_index_keys
   */
  listTranslationsForKey(projectId, keyId) {
    const url = urljoin(this.baseUrl, `/projects/${projectId}/keys/${keyId}/translations?per_page=100`);
    return fetch.getAll(url, this.globalFetchOptions);
  }

  /**
   * Create translation for a key.
   *
   * @param {string} projectId
   * @param {string} localeId
   * @param {string} keyId
   * @see https://developers.phraseapp.com/api/#translations_create
   */
  createTranslation(projectId, localeId, keyId, options = { content: '' }) {
    const url = urljoin(this.baseUrl, `/projects/${projectId}/translations`);
    return fetch.post(url, {
      ...this.globalFetchOptions,
      body: {
        ...options,
        locale_id: localeId,
        key_id: keyId,
      },
    });
  }

  /**
   * Include translations for locales.
   *
   * @param {string} projectId
   * @param {Array<string>} translationIds
   * @see https://developers.phraseapp.com/api/#translations_include
   */
  includeTranslations(projectId, translationIds = []) {
    const url = urljoin(this.baseUrl, `/projects/${projectId}/translations/include`);
    return fetch.patch(url, {
      ...this.globalFetchOptions,
      body: {
        q: `id:${[...translationIds].join(',')}`,
      },
    });
  }

  /**
   * Exclude translations for locales.
   *
   * @param {string} projectId
   * @param {Array<string>} translationIds
   * @see https://developers.phraseapp.com/api/#translations_exclude
   */
  excludeTranslations(projectId, translationIds = []) {
    const url = urljoin(this.baseUrl, `/projects/${projectId}/translations/exclude`);
    return fetch.patch(url, {
      ...this.globalFetchOptions,
      body: {
        q: `id:${[...translationIds].join(',')}`,
      },
    });
  }
}

module.exports = PhraseAppClient;
