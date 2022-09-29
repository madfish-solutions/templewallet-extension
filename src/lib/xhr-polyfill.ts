/*
  Code here is based on:
  - https://github.com/apple502j/xhr-shim/blob/main/src/index.js
*/

export {};

const sHeaders = Symbol('headers');
const sRespHeaders = Symbol('response headers');
const sAbortController = Symbol('AbortController');
const sMethod = Symbol('method');
const sURL = Symbol('URL');
const sMIME = Symbol('MIME');
const sDispatch = Symbol('dispatch');
const sErrored = Symbol('errored');
const sTimeout = Symbol('timeout');
const sTimedOut = Symbol('timedOut');
const sIsResponseText = Symbol('isResponseText');

class XMLHttpRequestEventTargetShim extends EventTarget {
  onabort = null;
  onerror = null;
  onload = null;
  onloadend = null;
  onloadstart = null;
  onprogress = null;
  ontimeout = null;
}

class XMLHttpRequestUploadShim extends XMLHttpRequestEventTargetShim {}

class XMLHttpRequestShim extends XMLHttpRequestEventTargetShim implements XMLHttpRequest {
  static UNSENT = 0;
  static OPENED = 1;
  static HEADERS_RECEIVED = 2;
  static LOADING = 3;
  static DONE = 4;

  UNSENT = 0;
  OPENED = 1;
  HEADERS_RECEIVED = 2;
  LOADING = 3;
  DONE = 4;

  readyState: number = XMLHttpRequestShim.UNSENT;
  response: any = null;
  responseType: XMLHttpRequestResponseType = '';
  responseURL: string = '';
  status: number = 0;
  statusText: string = '';
  timeout: number = 0;
  withCredentials: boolean = false;

  [sHeaders]: any;
  [sRespHeaders]: any;
  [sAbortController]: AbortController = new AbortController();
  [sMethod]: string = '';
  [sURL]: string = '';
  [sMIME]: string = '';
  [sErrored]: boolean = false;
  [sTimeout]?: number = 0;
  [sTimedOut]: boolean = false;
  [sIsResponseText]: boolean = true;

  constructor() {
    super();
    this[sHeaders] = Object.create(null);
    this[sHeaders].accept = '*/*';
    this[sRespHeaders] = Object.create(null);
  }

  get responseText(): string {
    if (this[sErrored]) return '';
    if (this.readyState < XMLHttpRequestShim.HEADERS_RECEIVED) return '';
    if (this[sIsResponseText]) return this.response;
    throw new DOMException('Response type not set to text', 'InvalidStateError');
  }
  get responseXML(): Document | null {
    // throw new Error('XML not supported');
    return null;
  }
  [sDispatch](evt: any) {
    const attr = `on${evt.type}`;
    if (typeof this[attr as keyof XMLHttpRequestShim] === 'function') {
      this.addEventListener(evt.type, this[attr as keyof XMLHttpRequestShim].bind(this), {
        once: true
      });
    }
    this.dispatchEvent(evt);
  }
  abort() {
    this[sAbortController].abort();
    this.status = 0;
    this.readyState = XMLHttpRequestShim.UNSENT;
  }
  open(method: string, url: string) {
    this.status = 0;
    this[sMethod] = method;
    this[sURL] = url;
    this.readyState = XMLHttpRequestShim.OPENED;
  }
  setRequestHeader(header: any, value: any) {
    header = String(header).toLowerCase();
    if (typeof this[sHeaders][header] === 'undefined') {
      this[sHeaders][header] = String(value);
    } else {
      this[sHeaders][header] += `, ${value}`;
    }
  }
  overrideMimeType(mimeType: string) {
    this[sMIME] = String(mimeType);
  }
  getAllResponseHeaders() {
    if (this[sErrored] || this.readyState < XMLHttpRequestShim.HEADERS_RECEIVED) return '';
    return Object.entries(this[sRespHeaders])
      .map(([header, value]) => `${header}: ${value}`)
      .join('\r\n');
  }
  getResponseHeader(headerName: string) {
    const value = this[sRespHeaders][String(headerName).toLowerCase()];
    return typeof value === 'string' ? value : null;
  }
  send(body: any = null) {
    if (this.timeout > 0) {
      this[sTimeout] = setTimeout(() => {
        this[sTimedOut] = true;
        this[sAbortController].abort();
      }, this.timeout) as unknown as number;
    }
    const responseType = this.responseType || 'text';
    this[sIsResponseText] = responseType === 'text';
    fetch(this[sURL], {
      method: this[sMethod] || 'GET',
      signal: this[sAbortController].signal,
      headers: this[sHeaders],
      credentials: this.withCredentials ? 'include' : 'same-origin',
      body
    })
      .finally(() => {
        this.readyState = XMLHttpRequestShim.DONE;
        clearTimeout(this[sTimeout]);
        this[sDispatch](new CustomEvent('loadstart'));
      })
      .then(
        async resp => {
          this.responseURL = resp.url;
          this.status = resp.status;
          this.statusText = resp.statusText;
          const finalMIME = this[sMIME] || this[sRespHeaders]['content-type'] || 'text/plain';
          Object.assign(this[sRespHeaders], resp.headers);
          switch (responseType) {
            case 'text':
              this.response = await resp.text();
              break;
            case 'blob':
              this.response = new Blob([await resp.arrayBuffer()], { type: finalMIME });
              break;
            case 'arraybuffer':
              this.response = await resp.arrayBuffer();
              break;
            case 'json':
              this.response = await resp.json();
              break;
          }
          this[sDispatch](new CustomEvent('load'));
        },
        err => {
          let eventName = 'abort';
          if (err.name !== 'AbortError') {
            this[sErrored] = true;
            eventName = 'error';
          } else if (this[sTimedOut]) {
            eventName = 'timeout';
          }
          this[sDispatch](new CustomEvent(eventName));
        }
      )
      .finally(() => this[sDispatch](new CustomEvent('loadend')));
  }

  onreadystatechange = null;
  upload: XMLHttpRequestUploadShim = new XMLHttpRequestUploadShim();
}

////

if (globalThis.XMLHttpRequest == null) globalThis.XMLHttpRequest = XMLHttpRequestShim;
