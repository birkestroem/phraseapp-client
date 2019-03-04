const debugFactory = require('debug');
const { Readable } = require('stream');
const fetch = require('./fetch');
const { URL } = require('url');

const debug = debugFactory('phraseapp-client:readablestream');

const fetchPage = async (url, options) => {
  const result = await fetch(url, options);
  return {
    json: await result.json(),
    headerLinks: fetch.getLinksFromHeaders(result.headers),
  };
};

class ReadableStream extends Readable {
  constructor(url, options = {}) {
    super({
      objectMode: true,
    });
    this.url = new URL(url);
    this.options = options;
    this.isFetchPending = false;
    this.currentItemCount = 0;

    /* At the moment the link headers return the wrong path. This corrects the problem. */
    this.forceInitialPath = true;
  }

  consumePage(data) {
    const { json, headerLinks } = data;
    json.forEach((d) => {
      this.push({
        progress: {
          // TODO: how many are on the last page?
          total: headerLinks.last.page * headerLinks.last.per_page,
          current: (this.currentItemCount += 1),
        },
        data: d,
      });
    });

    this.isFetchPending = false;
    if (headerLinks.next) {
      const nextPageLink = headerLinks.next ? new URL(headerLinks.next.url) : null;
      if (nextPageLink && this.forceInitialPath) {
        nextPageLink.pathname = this.url.pathname;
      }
      debug(`Following next page link ${nextPageLink}`);
      this.isFetchPending = true;
      return fetchPage(nextPageLink.toString(), this.options)
        .then(this.consumePage.bind(this));
    }

    return null;
  }

  _read() {
    debug('Read request');
    if (this.isFetching === true) {
      return;
    }
    this.isFetching = true;

    fetchPage(this.url.toString(), this.options)
      .then(this.consumePage.bind(this))
      .finally(() => {
        debug('Ending stream');
        this.push(null);
      });
  }
}

module.exports = { ReadableStream };
