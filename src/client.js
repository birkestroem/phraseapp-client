const urljoin = require('url-join');
const https = require('https');
const fetch = require('./fetch');
const { ReadableStream } = require('./readableStream');

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
      isOK: (res) => res.status < 400,
      extraText: (resp) => {
        const rateLimit = resp.headers.get('X-Rate-Limit-Limit');
        const rateLimitRemaining = resp.headers.get('X-Rate-Limit-Remaining');
        return rateLimit || rateLimitRemaining ? `${rateLimitRemaining}/${rateLimit}` : '';
      },
      agent: new https.Agent({
        keepAlive: true,
      }),
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
   * Get details on a single project.
   *
   * @param {string} projectId
   * @see https://developers.phraseapp.com/api/#projects_show
   */
  getProject(projectId) {
    const url = urljoin(this.baseUrl, `projects/${projectId}`);
    return fetch.get(url, this.globalFetchOptions);
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
   *
   * @param {string} projectId
   * @param {string} name
   * @param {string} code
   * @param {object} options
   * @see https://developers.phraseapp.com/api/#locales_create
   */
  async createLocale(projectId, name, code, options = {
    default: false,
    main: false,
    unverifyNewTranslations: false,
    unverifyUpdatedTranslations: false,
  }) {
    const url = urljoin(this.baseUrl, `/projects/${projectId}/locales`);
    return fetch.post(url, {
      ...this.globalFetchOptions,
      body: {
        name,
        code,
        default: options.default,
        main: options.main,
        unverify_new_translations: options.unverifyNewTranslations,
        unverify_updated_translations: options.unverifyUpdatedTranslations,
      },
    });
  }

  /**
   * List all keys for a project
   *
   * @param {string} projectId
   * @param {string} keyId
   * @see https://developers.phraseapp.com/api/#keys_show
   */
  getKey(projectId, keyId) {
    const url = urljoin(this.baseUrl, `/projects/${projectId}/keys/${keyId}`);
    return fetch.get(url, this.globalFetchOptions);
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
   * Stream all keys for a project
   *
   * @param {string} projectId
   * @see https://developers.phraseapp.com/api/#keys_index
   */
  listKeysStream(projectId) {
    const url = urljoin(this.baseUrl, `/projects/${projectId}/keys?per_page=100`);
    return new ReadableStream(url, this.globalFetchOptions);
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
   * Stream searched keys for the given project matching query.
   *
   * @param {string} projectId
   * @param {object} query
   * @see https://developers.phraseapp.com/api/#keys_search
   */
  searchKeysStream(projectId, query = {}) {
    const url = urljoin(this.baseUrl, `/projects/${projectId}/keys/search?per_page=100`);
    return new ReadableStream(url, {
      ...this.globalFetchOptions,
      method: 'POST',
      body: query,
    });
  }

  /**
   * Create a new key.
   *
   * @param {string} projectId
   * @param {string} name
   * @see https://developers.phraseapp.com/api/#keys_create
   */
  async createKey(projectId, name) {
    const url = urljoin(this.baseUrl, `/projects/${projectId}/keys`);
    return fetch.post(url, {
      ...this.globalFetchOptions,
      body: {
        name,
      },
    });
  }

  /**
   *
   * @param {string} projectId
   * @param {string} id
   * @see https://developers.phraseapp.com/api/#keys_destroy
   */
  async deleteKey(projectId, id) {
    const url = urljoin(this.baseUrl, `/projects/${projectId}/keys/${id}`);
    const res = await fetch.delete(url, this.globalFetchOptions);

    if (res.status !== 204) {
      throw new Error(`Failure deleting [${res.status}]`);
    }

    return this;
  }

  /**
   * Delete all keys matching query. Same constraints as list. Please limit the number of affected
   * keys to about 1,000 as you might experience timeouts otherwise.
   *
   * @param {string} projectId
   * @param {[string]} ids
   * @see https://developers.phraseapp.com/api/#keys_destroy-list
   */
  async deleteKeyCollection(projectId, ids = []) {
    const url = urljoin(this.baseUrl, `/projects/${projectId}/keys`);
    const res = await fetch.delete(url, {
      ...this.globalFetchOptions,
      body: {
        ids: `ids:${ids.join(',')}`,
      },
    });

    if (res.status !== 200) {
      throw new Error(`Failure deleting [${res.status}]`);
    }

    return this;
  }

  /**
   * Tags all keys matching query. Same constraints as list.
   *
   * @param {string} projectId
   * @param {[string]]} ids
   * @param {[string]} tags
   * @see https://developers.phraseapp.com/api/#keys_tag
   */
  async tagKeyCollection(projectId, ids = [], tags = []) {
    const url = urljoin(this.baseUrl, `/projects/${projectId}/keys/tag`);
    return fetch.patch(url, {
      ...this.globalFetchOptions,
      body: {
        q: `ids:${ids.join(',')}`,
        tags: tags.join(','),
      },
    });
  }

  /**
   * Removes specified tags from keys matching query.
   *
   * @param {string} projectId
   * @param {[string]]} ids
   * @param {[string]} tags
   * @see https://developers.phraseapp.com/api/#keys_untag
   */
  async untagKeyCollection(projectId, ids = [], tags = []) {
    const url = urljoin(this.baseUrl, `/projects/${projectId}/keys/untag`);
    const res = await fetch.patch(url, {
      ...this.globalFetchOptions,
      body: {
        q: `ids:${ids.join(',')}`,
        tags: tags.join(','),
      },
    });

    if (res.status !== 200) {
      throw new Error(`Failure untagging keys [${res.status}]`);
    }

    return this;
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
   * Search translations for the given project. Provides the same search interface as
   * translations#index but allows POST requests to avoid limitations imposed by GET
   * requests. If you want to download all translations for one locale we recommend to
   * use the locales#download endpoint.
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
   * Stream search translations for the given project. Provides the same search interface as
   * translations#index but allows POST requests to avoid limitations imposed by GET
   * requests. If you want to download all translations for one locale we recommend to
   * use the locales#download endpoint.
   *
   * @param {string} projectId
   * @param {*} query
   * @see https://developers.phraseapp.com/api/#translations_search
   */
  searchTranslationsSteam(projectId, query = {}) {
    const url = urljoin(this.baseUrl, `/projects/${projectId}/translations/search?per_page=100`);
    return new ReadableStream(url, {
      ...this.globalFetchOptions,
      method: 'POST',
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
   * Update an existing translation.
   *
   * @param {string} projectId
   * @param {string} id
   * @param {object} options
   * @see https://developers.phraseapp.com/api/#translations_update
   */
  updateTranslation(projectId, id, options = { content: '' }) {
    const url = urljoin(this.baseUrl, `/projects/${projectId}/translations/${id}`);
    return fetch.patch(url, {
      ...this.globalFetchOptions,
      body: {
        ...options,
      },
    });
  }

  /**
   * Get details on a single key for a given project.
   *
   * @param {string} projectId
   * @param {string} id
   * @see https://developers.phraseapp.com/api/#keys_show
   */
  getTranslation(projectId, id) {
    const url = urljoin(this.baseUrl, `/projects/${projectId}/keys/${id}`);
    return fetch.get(url, this.globalFetchOptions);
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

  /**
   *
   * @param {string} projectId
   * @param {[string]} ids
   * @see https://developers.phraseapp.com/api/#translations_verify
   */
  verifyTranslations(projectId, query) {
    const url = urljoin(this.baseUrl, `/projects/${projectId}/translations/verify`);
    return fetch.patch(url, {
      ...this.globalFetchOptions,
      body: query,
    });
  }

  /**
   *
   * @param {string} projectId
   * @param {[string]} ids
   * @see https://developers.phraseapp.com/api/#translations_unverify
   */
  unverifyTranslations(projectId, query) {
    const url = urljoin(this.baseUrl, `/projects/${projectId}/translations/unverify`);
    return fetch.patch(url, {
      ...this.globalFetchOptions,
      body: query,
    });
  }
}

module.exports = PhraseAppClient;
