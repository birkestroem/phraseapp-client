/**
 *
 */
class PhraseAppProject {
  /**
   *
   * @param {PhraseAppClient} url
   * @param {string} projectId
   */
  constructor(client, projectId) {
    this.client = client;
    this.projectId = projectId;

    [
      'createKey',
      'deleteKey',
      'createTranslation',
      'getKey',
      'listKeys',
      'listKeysStream',
      'listLocales',
      'listTranslations',
      'listTranslationsForKey',
      'searchKeys',
      'searchKeysStream',
      'searchTranslations',
      'searchTranslationsSteam',
      'updateTranslation',
    ].forEach((methodName) => this.createMethod(methodName));
  }

  getInfo() {
    return this.client.getProject(this.projectId);
  }

  createMethod(name) {
    const { client } = this;
    this[name] = (...args) => {
      const fn = client[name];
      args.unshift(this.projectId);
      return fn.apply(client, args);
    };
  }
}

module.exports = PhraseAppProject;
