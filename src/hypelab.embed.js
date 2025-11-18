var HypeLab;
(() => {
  'use strict';
  var e = {
      10: (e, t, n) => {
        Object.defineProperty(t, '__esModule', { value: !0 }), (t.default = void 0);
        var i = r(n(449)),
          o = r(n(210));
        function r(e) {
          return e && e.__esModule ? e : { default: e };
        }
        var s = (0, i.default)('v5', 80, o.default);
        t.default = s;
      },
      62: function (e, t, n) {
        var i =
          (this && this.__awaiter) ||
          function (e, t, n, i) {
            return new (n || (n = Promise))(function (o, r) {
              function s(e) {
                try {
                  l(i.next(e));
                } catch (e) {
                  r(e);
                }
              }
              function a(e) {
                try {
                  l(i.throw(e));
                } catch (e) {
                  r(e);
                }
              }
              function l(e) {
                var t;
                e.done
                  ? o(e.value)
                  : ((t = e.value),
                    t instanceof n
                      ? t
                      : new n(function (e) {
                          e(t);
                        })).then(s, a);
              }
              l((i = i.apply(e, t || [])).next());
            });
          };
        Object.defineProperty(t, '__esModule', { value: !0 }), (t.BaseComponent = void 0);
        const o = n(158),
          r = n(376);
        class s extends HTMLElement {
          constructor() {
            super(),
              (this.ad = null),
              (this.position = null),
              (this.trackedEvents = new Set()),
              (this.intersectionObserver = null);
          }
          loadAd() {
            return i(this, void 0, void 0, function* () {
              (0, r.debug)('Loading ad for:', this.getPlacementSlug()),
                (this.ad = yield (0, o.loadAd)(this.getPlacementSlug(), this.position)),
                this.ad ? this.emitDOMEvent('ready') : this.emitDOMEvent('error');
            });
          }
          addIntersectionObserver(e = this) {
            (this.intersectionObserver = new IntersectionObserver(e => {
              e.every(e => e.isIntersecting)
                ? (this.emitDOMEvent('containerVisible'), this.trackEvent('impression'))
                : this.emitDOMEvent('containerHidden');
            })),
              this.intersectionObserver.observe(e);
          }
          addClickListener(e = this) {
            e.addEventListener('click', this.clickEventHandler.bind(this));
          }
          removeClickListener(e = this) {
            e.removeEventListener('click', this.clickEventHandler.bind(this));
          }
          removeIntersectionObserver() {
            this.intersectionObserver && (this.intersectionObserver.disconnect(), (this.intersectionObserver = null));
          }
          trackEvent(e) {
            return i(this, void 0, void 0, function* () {
              !this.trackedEvents.has(e) &&
                this.ad &&
                ((0, r.log)('Firing', e, 'event for:', this.getPlacementSlug()),
                this.trackedEvents.add(e),
                this.emitDOMEvent(e),
                yield (0, o.trackEvent)(e, this.getPlacementSlug(), this.ad).catch(t => {
                  (0, r.debug)('Failed to send', e, 'event:', t), this.trackedEvents.delete(e);
                }));
            });
          }
          resetTrackedEvents() {
            this.trackedEvents.clear();
          }
          getPlacementSlug() {
            const e = this.getAttribute('placement');
            return e || (0, r.throwError)('No placement specified'), e;
          }
          emitDOMEvent(e) {
            'click' === e && (e = 'clicked'),
              (0, r.debug)('Emitting', e, 'DOM event for:', this.getPlacementSlug()),
              this.dispatchEvent(new CustomEvent(e, { bubbles: !0, composed: !0, cancelable: !1 }));
          }
          updatePosition() {
            const e = this.getBoundingClientRect();
            this.position = [e.left, e.top];
          }
          clickEventHandler() {
            this.trackEvent('click');
          }
        }
        t.BaseComponent = s;
      },
      158: function (e, t, n) {
        var i =
            (this && this.__awaiter) ||
            function (e, t, n, i) {
              return new (n || (n = Promise))(function (o, r) {
                function s(e) {
                  try {
                    l(i.next(e));
                  } catch (e) {
                    r(e);
                  }
                }
                function a(e) {
                  try {
                    l(i.throw(e));
                  } catch (e) {
                    r(e);
                  }
                }
                function l(e) {
                  var t;
                  e.done
                    ? o(e.value)
                    : ((t = e.value),
                      t instanceof n
                        ? t
                        : new n(function (e) {
                            e(t);
                          })).then(s, a);
                }
                l((i = i.apply(e, t || [])).next());
              });
            },
          o =
            (this && this.__rest) ||
            function (e, t) {
              var n = {};
              for (var i in e) Object.prototype.hasOwnProperty.call(e, i) && t.indexOf(i) < 0 && (n[i] = e[i]);
              if (null != e && 'function' == typeof Object.getOwnPropertySymbols) {
                var o = 0;
                for (i = Object.getOwnPropertySymbols(e); o < i.length; o++)
                  t.indexOf(i[o]) < 0 && Object.prototype.propertyIsEnumerable.call(e, i[o]) && (n[i[o]] = e[i[o]]);
              }
              return n;
            };
        Object.defineProperty(t, '__esModule', { value: !0 }),
          (t.loadAd = function (e, t) {
            return i(this, void 0, void 0, function* () {
              const n = (0, r.getConfig)(),
                i = (0, r.getIdentity)();
              try {
                yield Promise.allSettled([i.refresh()]);
                const l = yield fetch(new URL('/v1/requests', a()), {
                  method: 'POST',
                  credentials: 'include',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify(
                    Object.assign(
                      {
                        property_slug: n.propertySlug,
                        placement_slug: e,
                        sdk_version: s.version,
                        dpr: Math.max(1, Math.min(3, Math.round(window.devicePixelRatio))),
                        location:
                          'undefined' == typeof window
                            ? null
                            : window.top
                            ? window.top.location.href
                            : window.location.href,
                        pp: t,
                        vp: [
                          Math.max(document.documentElement.clientWidth || 0, window.innerWidth || 0),
                          Math.max(document.documentElement.clientHeight || 0, window.innerHeight || 0)
                        ]
                      },
                      i.toObject()
                    )
                  )
                });
                if (200 !== l.status)
                  return (0, r.log)('Failed to load ad:', l.statusText), (0, r.debug)('Response:', l), null;
                const d = yield l.json();
                if ('success' === d.status) {
                  (0, r.log)('Loaded ad data:', d.data);
                  const e = d.data,
                    { uuid: t } = e,
                    n = o(e, ['uuid']);
                  return t && (i.setUUID(t), (0, r.debug)('Updated UUID:', t)), n;
                }
                (0, r.log)('Failed to load ad:', d);
              } catch (e) {
                (0, r.log)('Failed to load ad:', e);
              }
              return null;
            });
          }),
          (t.trackEvent = function (e, t, n) {
            return i(this, void 0, void 0, function* () {
              const i = (0, r.getConfig)(),
                o = (0, r.getIdentity)();
              try {
                yield fetch(new URL('/v1/events', a()), {
                  method: 'POST',
                  credentials: 'include',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify(
                    Object.assign(
                      {
                        type: e,
                        property_slug: i.propertySlug,
                        placement_slug: t,
                        campaign_slug: n.campaign_slug,
                        creative_set_slug: n.creative_set_slug,
                        as: n.as,
                        sdk_version: s.version,
                        location: 'undefined' != typeof window ? window.location.href : null
                      },
                      o.toObject()
                    )
                  )
                });
              } catch (e) {
                (0, r.log)('Failed to track event:', e);
              }
            });
          });
        const r = n(376),
          s = n(270);
        function a() {
          const e = (0, r.getConfig)();
          if (e.baseUrl) return e.baseUrl;
          switch (e.environment) {
            case 'local':
              return 'https://api.lvh.me:8080';
            case 'development':
              return 'https://api.hypelab-staging.com';
            case 'production':
              return 'https://api.hypelab.com';
          }
        }
      },
      165: function (e, t, n) {
        var i =
          (this && this.__awaiter) ||
          function (e, t, n, i) {
            return new (n || (n = Promise))(function (o, r) {
              function s(e) {
                try {
                  l(i.next(e));
                } catch (e) {
                  r(e);
                }
              }
              function a(e) {
                try {
                  l(i.throw(e));
                } catch (e) {
                  r(e);
                }
              }
              function l(e) {
                var t;
                e.done
                  ? o(e.value)
                  : ((t = e.value),
                    t instanceof n
                      ? t
                      : new n(function (e) {
                          e(t);
                        })).then(s, a);
              }
              l((i = i.apply(e, t || [])).next());
            });
          };
        Object.defineProperty(t, '__esModule', { value: !0 }), (t.RTBNativeComponent = void 0);
        const o = n(376),
          r = n(667);
        class s extends r.RTBBaseComponent {
          constructor() {
            super(...arguments),
              (this.refreshTimer = null),
              (this.clickFired = !1),
              (this.ctaLinks = null),
              (this.position = null),
              (this.disconnected = false);
          }
          connectedCallback() {
            this.disconnected = false;
            const getDisconnected = () => this.disconnected;

            return i(this, void 0, void 0, function* () {
              this.updatePosition(),
                (0, o.style)(this, { display: 'none' }),
                yield this.requestBid();
              console.log('getDisconnected', getDisconnected());

              if (!getDisconnected()) {
                this.refreshTimer = setInterval(() => this.requestBid(), 3e4);
              }
            });
          }
          disconnectedCallback() {
            this.disconnected = true;
            this.removeIntersectionObserver();
            this.refreshTimer && clearInterval(this.refreshTimer);
          }
          requestBid() {
            const e = Object.create(null, { requestBid: { get: () => super.requestBid } });
            return i(this, void 0, void 0, function* () {
              var t, n, i, r, s, a, l, d, c;
              if (
                !document.hidden &&
                ('none' != this.style.display && this.updatePosition(),
                yield e.requestBid.call(this),
                this.bid && this.bid.adm)
              ) {
                this.removeIntersectionObserver(),
                  this.resetTrackedEvents(),
                  null === (t = this.ctaLinks) ||
                    void 0 === t ||
                    t.forEach(e => e.removeEventListener('click', this.trackClick.bind(this)));
                const e = JSON.parse(this.bid.adm).native,
                  u = null === (n = e.assets) || void 0 === n ? void 0 : n.find(e => 1 === e.id),
                  h = null === (i = e.assets) || void 0 === i ? void 0 : i.find(e => 2 === e.id),
                  p = null === (r = e.assets) || void 0 === r ? void 0 : r.find(e => 3 === e.id),
                  f = null === (s = e.assets) || void 0 === s ? void 0 : s.find(e => 4 === e.id),
                  v = null === (a = e.assets) || void 0 === a ? void 0 : a.find(e => 5 === e.id),
                  m = null === (l = e.assets) || void 0 === l ? void 0 : l.find(e => 6 === e.id),
                  g = null === (d = e.assets) || void 0 === d ? void 0 : d.find(e => 7 === e.id),
                  y = null === (c = e.assets) || void 0 === c ? void 0 : c.find(e => 8 === e.id),
                  w = this.querySelectorAll('[data-ref="headline"]'),
                  b = this.querySelectorAll('[data-ref="advertiser"]'),
                  x = this.querySelectorAll('[data-ref="body"]'),
                  _ = this.querySelectorAll('[data-ref="displayUrl"]'),
                  C = this.querySelectorAll('[data-ref="ctaText"]'),
                  O = this.querySelectorAll('[data-ref="icon"]'),
                  E = this.querySelectorAll('[data-ref="mediaContent"]');
                (this.ctaLinks = this.querySelectorAll('[data-ref="ctaLink"]')),
                  w.forEach(e => {
                    var t, n;
                    return (e.textContent =
                      null !== (n = null === (t = null == u ? void 0 : u.title) || void 0 === t ? void 0 : t.text) &&
                      void 0 !== n
                        ? n
                        : null);
                  }),
                  b.forEach(e => {
                    var t, n;
                    return (e.textContent =
                      null !== (n = null === (t = null == h ? void 0 : h.data) || void 0 === t ? void 0 : t.value) &&
                      void 0 !== n
                        ? n
                        : null);
                  }),
                  x.forEach(e => {
                    var t, n;
                    return (e.textContent =
                      null !== (n = null === (t = null == p ? void 0 : p.data) || void 0 === t ? void 0 : t.value) &&
                      void 0 !== n
                        ? n
                        : null);
                  }),
                  C.forEach(e => {
                    var t, n;
                    return (e.textContent =
                      null !== (n = null === (t = null == v ? void 0 : v.data) || void 0 === t ? void 0 : t.value) &&
                      void 0 !== n
                        ? n
                        : null);
                  }),
                  _.forEach(e => {
                    var t, n;
                    return (e.textContent =
                      null !== (n = null === (t = null == f ? void 0 : f.data) || void 0 === t ? void 0 : t.value) &&
                      void 0 !== n
                        ? n
                        : null);
                  }),
                  O.forEach(e => {
                    var t, n;
                    return (e.src =
                      null !== (n = null === (t = null == m ? void 0 : m.img) || void 0 === t ? void 0 : t.url) &&
                      void 0 !== n
                        ? n
                        : '');
                  }),
                  this.ctaLinks.forEach(t => {
                    (t.href = e.link.url), t.addEventListener('click', this.trackClick.bind(this));
                  }),
                  E.forEach(e => {
                    var t, n;
                    if (null === (t = null == g ? void 0 : g.img) || void 0 === t ? void 0 : t.url)
                      e.innerHTML = `<img src="${g.img.url}" style="width: 100%; height: 100%;" />`;
                    else if (null === (n = null == y ? void 0 : y.video) || void 0 === n ? void 0 : n.vasttag) {
                      const t = (0, o.getMediaUrlFromVAST)(y.video.vasttag);
                      e.innerHTML = `<video src="${t}" autoplay muted preload="auto" playsinline loop></video>`;
                    }
                  }),
                  this.addIntersectionObserver(),
                  (0, o.style)(this, { display: 'block' });
              }
            });
          }
          trackClick() {
            return i(this, void 0, void 0, function* () {
              var e, t;
              (null === (t = null === (e = this.bid) || void 0 === e ? void 0 : e.ext) || void 0 === t
                ? void 0
                : t.curl) &&
                !this.clickFired &&
                ((this.clickFired = !0), yield fetch(this.bid.ext.curl, { credentials: 'include' }));
            });
          }
          resetTrackedEvents() {
            super.resetTrackedEvents(), (this.clickFired = !1);
          }
          updatePosition() {
            const e = this.getBoundingClientRect();
            this.position = [e.left, e.top];
          }
          buildImpression() {
            const e = (0, o.getConfig)();
            return {
              id: (0, o.randomId)(),
              native: {
                ver: '1.2',
                request: JSON.stringify({
                  ver: '1.2',
                  assets: [
                    { id: 1, required: 1, title: { len: 140 } },
                    { id: 2, required: 1, data: { type: 1 } },
                    { id: 3, required: 1, data: { type: 2 } },
                    { id: 4, required: 1, data: { type: 11 } },
                    { id: 5, required: 1, data: { type: 12 } },
                    { id: 6, required: 1, img: { type: 1 } },
                    { id: 7, required: 0, img: { type: 3 } },
                    {
                      id: 8,
                      required: 0,
                      video: {
                        mimes: ['video/mp4', 'video/webm', 'video/ogg'],
                        minduration: 0,
                        maxduration: 120,
                        protocols: [16]
                      }
                    }
                  ]
                })
              },
              ext: {
                bidder: { property_slug: e.propertySlug, placement_slug: this.getPlacementSlug(), pp: this.position }
              }
            };
          }
        }
        t.RTBNativeComponent = s;
      },
      210: (e, t) => {
        function n(e, t, n, i) {
          switch (e) {
            case 0:
              return (t & n) ^ (~t & i);
            case 1:
            case 3:
              return t ^ n ^ i;
            case 2:
              return (t & n) ^ (t & i) ^ (n & i);
          }
        }
        function i(e, t) {
          return (e << t) | (e >>> (32 - t));
        }
        Object.defineProperty(t, '__esModule', { value: !0 }),
          (t.default = void 0),
          (t.default = function (e) {
            const t = [1518500249, 1859775393, 2400959708, 3395469782],
              o = [1732584193, 4023233417, 2562383102, 271733878, 3285377520];
            if ('string' == typeof e) {
              const t = unescape(encodeURIComponent(e));
              e = [];
              for (let n = 0; n < t.length; ++n) e.push(t.charCodeAt(n));
            } else Array.isArray(e) || (e = Array.prototype.slice.call(e));
            e.push(128);
            const r = e.length / 4 + 2,
              s = Math.ceil(r / 16),
              a = new Array(s);
            for (let t = 0; t < s; ++t) {
              const n = new Uint32Array(16);
              for (let i = 0; i < 16; ++i)
                n[i] =
                  (e[64 * t + 4 * i] << 24) |
                  (e[64 * t + 4 * i + 1] << 16) |
                  (e[64 * t + 4 * i + 2] << 8) |
                  e[64 * t + 4 * i + 3];
              a[t] = n;
            }
            (a[s - 1][14] = (8 * (e.length - 1)) / Math.pow(2, 32)),
              (a[s - 1][14] = Math.floor(a[s - 1][14])),
              (a[s - 1][15] = (8 * (e.length - 1)) & 4294967295);
            for (let e = 0; e < s; ++e) {
              const r = new Uint32Array(80);
              for (let t = 0; t < 16; ++t) r[t] = a[e][t];
              for (let e = 16; e < 80; ++e) r[e] = i(r[e - 3] ^ r[e - 8] ^ r[e - 14] ^ r[e - 16], 1);
              let s = o[0],
                l = o[1],
                d = o[2],
                c = o[3],
                u = o[4];
              for (let e = 0; e < 80; ++e) {
                const o = Math.floor(e / 20),
                  a = (i(s, 5) + n(o, l, d, c) + u + t[o] + r[e]) >>> 0;
                (u = c), (c = d), (d = i(l, 30) >>> 0), (l = s), (s = a);
              }
              (o[0] = (o[0] + s) >>> 0),
                (o[1] = (o[1] + l) >>> 0),
                (o[2] = (o[2] + d) >>> 0),
                (o[3] = (o[3] + c) >>> 0),
                (o[4] = (o[4] + u) >>> 0);
            }
            return [
              (o[0] >> 24) & 255,
              (o[0] >> 16) & 255,
              (o[0] >> 8) & 255,
              255 & o[0],
              (o[1] >> 24) & 255,
              (o[1] >> 16) & 255,
              (o[1] >> 8) & 255,
              255 & o[1],
              (o[2] >> 24) & 255,
              (o[2] >> 16) & 255,
              (o[2] >> 8) & 255,
              255 & o[2],
              (o[3] >> 24) & 255,
              (o[3] >> 16) & 255,
              (o[3] >> 8) & 255,
              255 & o[3],
              (o[4] >> 24) & 255,
              (o[4] >> 16) & 255,
              (o[4] >> 8) & 255,
              255 & o[4]
            ];
          });
      },
      264: (e, t) => {
        Object.defineProperty(t, '__esModule', { value: !0 }),
          (t.default = void 0),
          (t.default =
            /^(?:[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}|00000000-0000-0000-0000-000000000000)$/i);
      },
      270: (e, t) => {
        Object.defineProperty(t, '__esModule', { value: !0 }), (t.version = void 0), (t.version = '2.7.0');
      },
      361: (e, t, n) => {
        var i,
          o = Object.defineProperty,
          r = Object.getOwnPropertyDescriptor,
          s = Object.getOwnPropertyNames,
          a = Object.prototype.hasOwnProperty,
          l = {};
        ((e, t) => {
          for (var n in t) o(e, n, { get: t[n], enumerable: !0 });
        })(l, { Identity: () => h }),
          (e.exports =
            ((i = l),
            ((e, t, n, i) => {
              if ((t && 'object' == typeof t) || 'function' == typeof t)
                for (let n of s(t))
                  !a.call(e, n) &&
                    void 0 !== n &&
                    o(e, n, { get: () => t[n], enumerable: !(i = r(t, n)) || i.enumerable });
              return e;
            })(o({}, '__esModule', { value: !0 }), i)));
        var d = n(935);
        function c(e, t) {
          try {
            return e();
          } catch {
            return t;
          }
        }
        var u = 'hl_uuid',
          h = class {
            config;
            uuid;
            wids;
            wp;
            wpfs;
            getWalletsPromise = null;
            constructor(e) {
              (this.config = e),
                (this.uuid = this.getOrSetUUID()),
                (this.wids = []),
                (this.wp = { ada: !1, bnb: !1, eth: !1, sol: !1, tron: !1 }),
                (this.wpfs = { ada: [], bnb: [], eth: [], sol: [], tron: [] });
            }
            toObject() {
              return { uuid: this.uuid, wids: this.wids, wp: this.wp, wpfs: this.wpfs };
            }
            async refresh() {
              (this.uuid = this.getOrSetUUID()),
                (this.wids = this.mergeWIDs(await this.getWallets())),
                (this.wp = this.getWalletPresence()),
                (this.wpfs = this.getWalletProviderFlags());
            }
            setUUID(e) {
              if (typeof window > 'u') return null;
              let t = { value: e?.toString() || (0, d.v4)() };
              return window.localStorage.setItem(u, JSON.stringify(t)), t.value;
            }
            setWalletAddresses(e) {
              this.wids = this.mergeWIDs(e);
            }
            mergeWIDs(e) {
              return [
                ...new Set(
                  this.wids
                    .concat(e)
                    .map(e => e.toLowerCase())
                    .filter(Boolean)
                )
              ];
            }
            getOrSetUUID() {
              return this.getUUID() ?? this.setUUID();
            }
            getUUID() {
              if (typeof window > 'u') return null;
              try {
                let e = window.localStorage.getItem(u);
                return null !== e ? JSON.parse(e).value : null;
              } catch {
                return null;
              }
            }
            async getWallets() {
              return this.config.disableWalletDetection
                ? []
                : (this.getWalletsPromise ||
                    (this.getWalletsPromise = Promise.race([
                      (async () => {
                        let e = window.self !== window.top,
                          { ethereum: t, phantom: n } = window;
                        if (null == t || (e && null != n)) return [];
                        try {
                          return (await (n?.ethereum || t).request({ method: 'eth_accounts' })) ?? [];
                        } catch (e) {
                          return [];
                        }
                      })().then(e => ((this.getWalletsPromise = null), e)),
                      new Promise(e => {
                        setTimeout(() => {
                          e([]), (this.getWalletsPromise = null);
                        }, 1e3);
                      })
                    ])),
                  this.getWalletsPromise);
            }
            getWalletPresence() {
              return {
                ada: typeof window < 'u' && !!window.cardano,
                bnb: typeof window < 'u' && !!window.BinanceChain,
                eth: typeof window < 'u' && !!window.ethereum,
                sol: typeof window < 'u' && !!window.solana,
                tron: typeof window < 'u' && !!window.tron
              };
            }
            getWalletProviderFlags() {
              return {
                ada: c(this.getAdaWalletProviderFlags, []),
                bnb: c(this.getBnbWalletProviderFlags, []),
                eth: c(this.getEthWalletProviderFlags, []),
                sol: c(this.getSolWalletProviderFlags, []),
                tron: c(this.getTronWalletProviderFlags, [])
              };
            }
            getAdaWalletProviderFlags() {
              let e = [],
                { cardano: t } = window;
              if (!t) return e;
              let n = ['eternl', 'yoroi', 'nufi', 'flint', 'exodus', 'lace', 'nami', 'gerowallet', 'typhon', 'begin'];
              for (let i of n) t[i] && e.push(i);
              return e;
            }
            getBnbWalletProviderFlags() {
              let e = [],
                { BinanceChain: t } = window;
              if (!t) return e;
              let n = ['isTrustWallet', 'isCoin98', 'isKaiWallet', 'isMetaMask', 'isNifyWallet'];
              for (let i of n) t[i] && e.push(i);
              return (
                e.includes('isCoin98') && e.includes('isKaiWallet') && e.splice(e.indexOf('isKaiWallet'), 1),
                e.includes('isCoin98') && e.includes('isNifyWallet') && e.splice(e.indexOf('isNifyWallet'), 1),
                e.includes('isCoin98') && e.includes('isMetaMask') && e.splice(e.indexOf('isMetaMask'), 1),
                e
              );
            }
            getEthWalletProviderFlags() {
              let e = [],
                { ethereum: t } = window;
              if (!t) return e;
              let n = [
                'isApexWallet',
                'isAvalanche',
                'isBackpack',
                'isBifrost',
                'isBitKeep',
                'isBitski',
                'isBlockWallet',
                'isBraveWallet',
                'isCoinbaseWallet',
                'isDawn',
                'isEnkrypt',
                'isExodus',
                'isFrame',
                'isFrontier',
                'isGamestop',
                'isHyperPay',
                'isImToken',
                'isKuCoinWallet',
                'isMathWallet',
                'isMetaMask',
                'isOkxWallet',
                'isOKExWallet',
                'isOneInchAndroidWallet',
                'isOneInchIOSWallet',
                'isOpera',
                'isPhantom',
                'isPortal',
                'isRabby',
                'isRainbow',
                'isStatus',
                'isTally',
                'isTokenPocket',
                'isTokenary',
                'isTrust',
                'isTrustWallet',
                'isXDEFI',
                'isZerion'
              ];
              for (let i of n) t[i] && e.push(i);
              return (
                e.includes('isMetaMask') &&
                  [
                    'isApexWallet',
                    'isAvalanche',
                    'isBitKeep',
                    'isBlockWallet',
                    'isKuCoinWallet',
                    'isMathWallet',
                    'isOKExWallet',
                    'isOkxWallet',
                    'isOneInchAndroidWallet',
                    'isOneInchIOSWallet',
                    'isOpera',
                    'isPhantom',
                    'isPortal',
                    'isRabby',
                    'isTokenPocket',
                    'isTokenary',
                    'isZerion'
                  ].some(t => e.includes(t)) &&
                  e.splice(e.indexOf('isMetaMask'), 1),
                e
              );
            }
            getSolWalletProviderFlags() {
              let e = [],
                { solana: t } = window;
              if (t) {
                let n = ['isPhantom', 'isNufi'];
                for (let i of n) t[i] && e.push(i);
                e.includes('isNufi') && e.includes('isPhantom') && e.splice(e.indexOf('isPhantom'), 1);
              }
              let { solflare: n } = window;
              n && e.push('isSolflare');
              let { backpack: i } = window;
              return i && e.push('isBackpack'), e;
            }
            getTronWalletProviderFlags() {
              let e = [],
                { tron: t } = window;
              if (!t) return e;
              let n = ['isTronLink'];
              for (let i of n) t[i] && e.push(i);
              return e;
            }
          };
      },
      376: (e, t) => {
        function n() {
          var e;
          const t = null === (e = window.__hype) || void 0 === e ? void 0 : e.config;
          return t || i('No config specified'), t;
        }
        function i(e) {
          throw new Error(`[HypeLab] ${e}`);
        }
        function o(e) {
          return e.clientWidth, e.clientHeight, !0;
        }
        Object.defineProperty(t, '__esModule', { value: !0 }),
          (t.getConfig = n),
          (t.configHasFlags = function (e) {
            return ((n().__flags || 0) & e) === e;
          }),
          (t.getIdentity = function () {
            var e;
            const t = null === (e = window.__hype) || void 0 === e ? void 0 : e.identity;
            return t || i('Identity not initialized'), t;
          }),
          (t.log = function (...e) {
            'development' === n().environment || n().debugLogging;
          }),
          (t.debug = function (...e) {
            n().debugLogging;
          }),
          (t.throwError = i),
          (t.randomId = function () {
            return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (e) {
              const t = (16 * Math.random()) | 0;
              return ('x' === e ? t : (3 & t) | 8).toString(16);
            });
          }),
          (t.currentLocation = function () {
            return 'undefined' == typeof window ? null : window.top ? window.top.location.href : window.location.href;
          }),
          (t.getURL = function () {
            const e = n();
            if (e.baseUrl) return e.baseUrl;
            switch (e.environment) {
              case 'local':
                return 'https://api.lvh.me:8080';
              case 'development':
                return 'https://api.hypelab-staging.com';
              case 'production':
                return 'https://api.hypelab.com';
            }
          }),
          (t.style = function (e, t, n = !1) {
            n || ((e.style.transition = 'none'), o(e));
            for (const n in t) {
              const i = t[n];
              i && (e.style[n] = i);
            }
            n || (e.style.removeProperty('transition'), o(e));
          }),
          (t.resetStyle = function (e, t) {
            for (const n of t) {
              const t = n
                .split(/(?=[A-Z])/)
                .join('-')
                .toLowerCase();
              e.style.removeProperty(t);
            }
          }),
          (t.wait = function (e) {
            return new Promise(t =>
              setTimeout(() => {
                t();
              }, e)
            );
          }),
          (t.preloadImage = function (e) {
            return new Promise((t, n) => {
              const i = new Image();
              (i.onload = () => t(i)), (i.onerror = n), (i.src = e);
            });
          }),
          (t.getMediaUrlFromVAST = function (e) {
            const t = new DOMParser().parseFromString(e, 'text/xml').querySelectorAll('MediaFile');
            for (const e of t) if (e.textContent) return e.textContent;
            return null;
          });
      },
      391: (e, t) => {
        function n(e) {
          return 14 + (((e + 64) >>> 9) << 4) + 1;
        }
        function i(e, t) {
          const n = (65535 & e) + (65535 & t);
          return (((e >> 16) + (t >> 16) + (n >> 16)) << 16) | (65535 & n);
        }
        function o(e, t, n, o, r, s) {
          return i(((a = i(i(t, e), i(o, s))) << (l = r)) | (a >>> (32 - l)), n);
          var a, l;
        }
        function r(e, t, n, i, r, s, a) {
          return o((t & n) | (~t & i), e, t, r, s, a);
        }
        function s(e, t, n, i, r, s, a) {
          return o((t & i) | (n & ~i), e, t, r, s, a);
        }
        function a(e, t, n, i, r, s, a) {
          return o(t ^ n ^ i, e, t, r, s, a);
        }
        function l(e, t, n, i, r, s, a) {
          return o(n ^ (t | ~i), e, t, r, s, a);
        }
        Object.defineProperty(t, '__esModule', { value: !0 }),
          (t.default = void 0),
          (t.default = function (e) {
            if ('string' == typeof e) {
              const t = unescape(encodeURIComponent(e));
              e = new Uint8Array(t.length);
              for (let n = 0; n < t.length; ++n) e[n] = t.charCodeAt(n);
            }
            return (function (e) {
              const t = [],
                n = 32 * e.length,
                i = '0123456789abcdef';
              for (let o = 0; o < n; o += 8) {
                const n = (e[o >> 5] >>> o % 32) & 255,
                  r = parseInt(i.charAt((n >>> 4) & 15) + i.charAt(15 & n), 16);
                t.push(r);
              }
              return t;
            })(
              (function (e, t) {
                (e[t >> 5] |= 128 << t % 32), (e[n(t) - 1] = t);
                let o = 1732584193,
                  d = -271733879,
                  c = -1732584194,
                  u = 271733878;
                for (let t = 0; t < e.length; t += 16) {
                  const n = o,
                    h = d,
                    p = c,
                    f = u;
                  (o = r(o, d, c, u, e[t], 7, -680876936)),
                    (u = r(u, o, d, c, e[t + 1], 12, -389564586)),
                    (c = r(c, u, o, d, e[t + 2], 17, 606105819)),
                    (d = r(d, c, u, o, e[t + 3], 22, -1044525330)),
                    (o = r(o, d, c, u, e[t + 4], 7, -176418897)),
                    (u = r(u, o, d, c, e[t + 5], 12, 1200080426)),
                    (c = r(c, u, o, d, e[t + 6], 17, -1473231341)),
                    (d = r(d, c, u, o, e[t + 7], 22, -45705983)),
                    (o = r(o, d, c, u, e[t + 8], 7, 1770035416)),
                    (u = r(u, o, d, c, e[t + 9], 12, -1958414417)),
                    (c = r(c, u, o, d, e[t + 10], 17, -42063)),
                    (d = r(d, c, u, o, e[t + 11], 22, -1990404162)),
                    (o = r(o, d, c, u, e[t + 12], 7, 1804603682)),
                    (u = r(u, o, d, c, e[t + 13], 12, -40341101)),
                    (c = r(c, u, o, d, e[t + 14], 17, -1502002290)),
                    (d = r(d, c, u, o, e[t + 15], 22, 1236535329)),
                    (o = s(o, d, c, u, e[t + 1], 5, -165796510)),
                    (u = s(u, o, d, c, e[t + 6], 9, -1069501632)),
                    (c = s(c, u, o, d, e[t + 11], 14, 643717713)),
                    (d = s(d, c, u, o, e[t], 20, -373897302)),
                    (o = s(o, d, c, u, e[t + 5], 5, -701558691)),
                    (u = s(u, o, d, c, e[t + 10], 9, 38016083)),
                    (c = s(c, u, o, d, e[t + 15], 14, -660478335)),
                    (d = s(d, c, u, o, e[t + 4], 20, -405537848)),
                    (o = s(o, d, c, u, e[t + 9], 5, 568446438)),
                    (u = s(u, o, d, c, e[t + 14], 9, -1019803690)),
                    (c = s(c, u, o, d, e[t + 3], 14, -187363961)),
                    (d = s(d, c, u, o, e[t + 8], 20, 1163531501)),
                    (o = s(o, d, c, u, e[t + 13], 5, -1444681467)),
                    (u = s(u, o, d, c, e[t + 2], 9, -51403784)),
                    (c = s(c, u, o, d, e[t + 7], 14, 1735328473)),
                    (d = s(d, c, u, o, e[t + 12], 20, -1926607734)),
                    (o = a(o, d, c, u, e[t + 5], 4, -378558)),
                    (u = a(u, o, d, c, e[t + 8], 11, -2022574463)),
                    (c = a(c, u, o, d, e[t + 11], 16, 1839030562)),
                    (d = a(d, c, u, o, e[t + 14], 23, -35309556)),
                    (o = a(o, d, c, u, e[t + 1], 4, -1530992060)),
                    (u = a(u, o, d, c, e[t + 4], 11, 1272893353)),
                    (c = a(c, u, o, d, e[t + 7], 16, -155497632)),
                    (d = a(d, c, u, o, e[t + 10], 23, -1094730640)),
                    (o = a(o, d, c, u, e[t + 13], 4, 681279174)),
                    (u = a(u, o, d, c, e[t], 11, -358537222)),
                    (c = a(c, u, o, d, e[t + 3], 16, -722521979)),
                    (d = a(d, c, u, o, e[t + 6], 23, 76029189)),
                    (o = a(o, d, c, u, e[t + 9], 4, -640364487)),
                    (u = a(u, o, d, c, e[t + 12], 11, -421815835)),
                    (c = a(c, u, o, d, e[t + 15], 16, 530742520)),
                    (d = a(d, c, u, o, e[t + 2], 23, -995338651)),
                    (o = l(o, d, c, u, e[t], 6, -198630844)),
                    (u = l(u, o, d, c, e[t + 7], 10, 1126891415)),
                    (c = l(c, u, o, d, e[t + 14], 15, -1416354905)),
                    (d = l(d, c, u, o, e[t + 5], 21, -57434055)),
                    (o = l(o, d, c, u, e[t + 12], 6, 1700485571)),
                    (u = l(u, o, d, c, e[t + 3], 10, -1894986606)),
                    (c = l(c, u, o, d, e[t + 10], 15, -1051523)),
                    (d = l(d, c, u, o, e[t + 1], 21, -2054922799)),
                    (o = l(o, d, c, u, e[t + 8], 6, 1873313359)),
                    (u = l(u, o, d, c, e[t + 15], 10, -30611744)),
                    (c = l(c, u, o, d, e[t + 6], 15, -1560198380)),
                    (d = l(d, c, u, o, e[t + 13], 21, 1309151649)),
                    (o = l(o, d, c, u, e[t + 4], 6, -145523070)),
                    (u = l(u, o, d, c, e[t + 11], 10, -1120210379)),
                    (c = l(c, u, o, d, e[t + 2], 15, 718787259)),
                    (d = l(d, c, u, o, e[t + 9], 21, -343485551)),
                    (o = i(o, n)),
                    (d = i(d, h)),
                    (c = i(c, p)),
                    (u = i(u, f));
                }
                return [o, d, c, u];
              })(
                (function (e) {
                  if (0 === e.length) return [];
                  const t = 8 * e.length,
                    i = new Uint32Array(n(t));
                  for (let n = 0; n < t; n += 8) i[n >> 5] |= (255 & e[n / 8]) << n % 32;
                  return i;
                })(e),
                8 * e.length
              )
            );
          });
      },
      449: (e, t, n) => {
        Object.defineProperty(t, '__esModule', { value: !0 }),
          (t.URL = t.DNS = void 0),
          (t.default = function (e, t, n) {
            function i(e, i, s, a) {
              var l;
              if (
                ('string' == typeof e &&
                  (e = (function (e) {
                    e = unescape(encodeURIComponent(e));
                    const t = [];
                    for (let n = 0; n < e.length; ++n) t.push(e.charCodeAt(n));
                    return t;
                  })(e)),
                'string' == typeof i && (i = (0, r.default)(i)),
                16 !== (null === (l = i) || void 0 === l ? void 0 : l.length))
              )
                throw TypeError('Namespace must be array-like (16 iterable integer values, 0-255)');
              let d = new Uint8Array(16 + e.length);
              if ((d.set(i), d.set(e, i.length), (d = n(d)), (d[6] = (15 & d[6]) | t), (d[8] = (63 & d[8]) | 128), s)) {
                a = a || 0;
                for (let e = 0; e < 16; ++e) s[a + e] = d[e];
                return s;
              }
              return (0, o.unsafeStringify)(d);
            }
            try {
              i.name = e;
            } catch (e) {}
            return (i.DNS = s), (i.URL = a), i;
          });
        var i,
          o = n(750),
          r = (i = n(512)) && i.__esModule ? i : { default: i };
        const s = '6ba7b810-9dad-11d1-80b4-00c04fd430c8';
        t.DNS = s;
        const a = '6ba7b811-9dad-11d1-80b4-00c04fd430c8';
        t.URL = a;
      },
      460: (e, t) => {
        Object.defineProperty(t, '__esModule', { value: !0 }), (t.default = void 0);
        var n = { randomUUID: 'undefined' != typeof crypto && crypto.randomUUID && crypto.randomUUID.bind(crypto) };
        t.default = n;
      },
      512: (e, t, n) => {
        Object.defineProperty(t, '__esModule', { value: !0 }), (t.default = void 0);
        var i,
          o = (i = n(893)) && i.__esModule ? i : { default: i };
        t.default = function (e) {
          if (!(0, o.default)(e)) throw TypeError('Invalid UUID');
          let t;
          const n = new Uint8Array(16);
          return (
            (n[0] = (t = parseInt(e.slice(0, 8), 16)) >>> 24),
            (n[1] = (t >>> 16) & 255),
            (n[2] = (t >>> 8) & 255),
            (n[3] = 255 & t),
            (n[4] = (t = parseInt(e.slice(9, 13), 16)) >>> 8),
            (n[5] = 255 & t),
            (n[6] = (t = parseInt(e.slice(14, 18), 16)) >>> 8),
            (n[7] = 255 & t),
            (n[8] = (t = parseInt(e.slice(19, 23), 16)) >>> 8),
            (n[9] = 255 & t),
            (n[10] = ((t = parseInt(e.slice(24, 36), 16)) / 1099511627776) & 255),
            (n[11] = (t / 4294967296) & 255),
            (n[12] = (t >>> 24) & 255),
            (n[13] = (t >>> 16) & 255),
            (n[14] = (t >>> 8) & 255),
            (n[15] = 255 & t),
            n
          );
        };
      },
      521: (e, t, n) => {
        Object.defineProperty(t, '__esModule', { value: !0 }), (t.default = void 0);
        var i = s(n(460)),
          o = s(n(722)),
          r = n(750);
        function s(e) {
          return e && e.__esModule ? e : { default: e };
        }
        t.default = function (e, t, n) {
          if (i.default.randomUUID && !t && !e) return i.default.randomUUID();
          const s = (e = e || {}).random || (e.rng || o.default)();
          if (((s[6] = (15 & s[6]) | 64), (s[8] = (63 & s[8]) | 128), t)) {
            n = n || 0;
            for (let e = 0; e < 16; ++e) t[n + e] = s[e];
            return t;
          }
          return (0, r.unsafeStringify)(s);
        };
      },
      532: (e, t, n) => {
        Object.defineProperty(t, '__esModule', { value: !0 }), (t.default = void 0);
        var i = r(n(449)),
          o = r(n(391));
        function r(e) {
          return e && e.__esModule ? e : { default: e };
        }
        var s = (0, i.default)('v3', 48, o.default);
        t.default = s;
      },
      563: (e, t) => {
        var n;
        Object.defineProperty(t, '__esModule', { value: !0 }),
          (t.ConfigFlags = void 0),
          (function (e) {
            (e[(e.PLATFORM_WEB = 0)] = 'PLATFORM_WEB'),
              (e[(e.PLATFORM_ANDROID = 1)] = 'PLATFORM_ANDROID'),
              (e[(e.PLATFORM_IOS = 2)] = 'PLATFORM_IOS'),
              (e[(e.PLATFORM_UNITY = 4)] = 'PLATFORM_UNITY');
          })(n || (t.ConfigFlags = n = {}));
      },
      645: function (e, t, n) {
        var i =
          (this && this.__awaiter) ||
          function (e, t, n, i) {
            return new (n || (n = Promise))(function (o, r) {
              function s(e) {
                try {
                  l(i.next(e));
                } catch (e) {
                  r(e);
                }
              }
              function a(e) {
                try {
                  l(i.throw(e));
                } catch (e) {
                  r(e);
                }
              }
              function l(e) {
                var t;
                e.done
                  ? o(e.value)
                  : ((t = e.value),
                    t instanceof n
                      ? t
                      : new n(function (e) {
                          e(t);
                        })).then(s, a);
              }
              l((i = i.apply(e, t || [])).next());
            });
          };
        Object.defineProperty(t, '__esModule', { value: !0 }), (t.RewardedComponent = void 0);
        const o = n(563),
          r = n(376),
          s = n(62);
        class a extends s.BaseComponent {
          constructor() {
            super(),
              (this.visible = !1),
              (this.started = !1),
              (this.completed = !1),
              (this.shadow = null),
              (this.modalContainer = null),
              (this.modal = null),
              (this.fader = null),
              (this.faderContent = null),
              (this.info = null),
              (this.icon = null),
              (this.headline = null),
              (this.displayUrl = null),
              (this.cta = null),
              (this.countdown = null),
              (this.countdownText = null),
              (this.countdownIcon = null),
              (this.videoContainer = null),
              (this.video = null),
              (this.link = null);
          }
          connectedCallback() {
            return i(this, void 0, void 0, function* () {
              this.setupDOM(), yield this.loadAd(), this.injectAdData();
            });
          }
          setupDOM() {
            (this.shadow = this.attachShadow({ mode: 'open' })),
              (this.modalContainer = document.createElement('div')),
              (this.modalContainer.className = 'modalContainer'),
              (this.fader = document.createElement('div')),
              (this.fader.className = 'fader'),
              this.modalContainer.appendChild(this.fader),
              (this.faderContent = document.createElement('div')),
              (this.faderContent.className = 'faderContent'),
              this.fader.appendChild(this.faderContent),
              (this.modal = document.createElement('div')),
              (this.modal.className = 'modal'),
              this.modalContainer.appendChild(this.modal),
              (this.link = document.createElement('a')),
              (this.link.target = '_blank'),
              this.modal.appendChild(this.link),
              (this.videoContainer = document.createElement('div')),
              (this.videoContainer.className = 'videoContainer'),
              this.link.appendChild(this.videoContainer),
              (this.video = document.createElement('video')),
              (this.video.className = 'video'),
              (this.video.muted = !0),
              (this.video.playsInline = !0),
              (this.video.preload = 'auto'),
              (this.video.controls = !1),
              this.videoContainer.appendChild(this.video);
            const e = document.createElement('div');
            (e.className = 'top'),
              this.link.appendChild(e),
              (this.info = document.createElement('div')),
              (this.info.className = 'info'),
              e.appendChild(this.info);
            const t = document.createElement('div');
            (t.className = 'infoContent'), this.info.appendChild(t);
            const n = document.createElement('div');
            (n.className = 'infoColumn'),
              t.appendChild(n),
              (this.icon = document.createElement('img')),
              (this.icon.className = 'icon'),
              n.appendChild(this.icon);
            const i = document.createElement('div');
            (i.className = 'infoColumn'),
              t.appendChild(i),
              (this.headline = document.createElement('div')),
              (this.headline.className = 'headline'),
              i.appendChild(this.headline),
              (this.displayUrl = document.createElement('div')),
              (this.displayUrl.className = 'displayUrl'),
              i.appendChild(this.displayUrl);
            const o = document.createElement('div');
            (o.className = 'infoColumn'),
              t.appendChild(o),
              (this.cta = document.createElement('div')),
              (this.cta.className = 'cta'),
              o.appendChild(this.cta);
            const r = document.createElement('div');
            (r.className = 'status'),
              e.appendChild(r),
              (this.countdown = document.createElement('div')),
              (this.countdown.className = 'countdown'),
              r.appendChild(this.countdown),
              (this.countdownText = document.createElement('div')),
              (this.countdownText.className = 'countdownText'),
              this.countdown.appendChild(this.countdownText),
              (this.countdownIcon = document.createElement('div')),
              (this.countdownIcon.className = 'countdownIcon'),
              this.countdown.appendChild(this.countdownIcon);
            const s = document.createElement('style');
            (s.textContent = l),
              this.shadow && this.shadow.appendChild(s),
              this.countdown.addEventListener('click', e => {
                e.preventDefault(), e.stopPropagation(), this.dismiss();
              }),
              this.addClickListener(this.link),
              this.video.addEventListener('timeupdate', () => {
                this.video && this.updateTime({ current: this.video.currentTime, duration: this.video.duration });
              }),
              this.video.addEventListener('error', () => {
                this.trackEvent('videoError');
              });
          }
          injectAdData() {
            var e, t;
            this.ad &&
              'video' === this.ad.creative_set_type &&
              (this.link && (this.link.href = null !== (e = this.ad.cta_url) && void 0 !== e ? e : '#'),
              this.video &&
                ((0, r.configHasFlags)(o.ConfigFlags.PLATFORM_IOS) ||
                  (this.video.poster = this.ad.creative_set.poster.url),
                (this.video.src = this.ad.creative_set.video.url)),
              this.icon && (this.icon.src = this.ad.creative_set.icon.url),
              this.headline && (this.headline.textContent = this.ad.headline),
              this.displayUrl && (this.displayUrl.textContent = this.ad.display_url),
              this.cta && (this.cta.textContent = this.ad.cta_text),
              this.visible && (null === (t = this.video) || void 0 === t || t.play()));
          }
          updateTime(e) {
            const t = Math.max(Math.ceil(e.duration - e.current), 0);
            if (isNaN(t)) return;
            const n = e.current / e.duration;
            isNaN(n) || (n > 0.1 && this.trackEvent('impression'));
            const i = this.completed;
            if (((this.completed = t <= 0), this.completed && this.completed !== i))
              return this.completeCountdown(), void this.trackEvent('videoComplete');
            this.countdownText && (this.countdownText.textContent = t >= 0 ? t.toString() : ''),
              this.started || ((this.started = !0), this.trackEvent('videoStart'));
          }
          completeCountdown() {
            this.countdown && (0, r.style)(this.countdown, d, !0),
              this.countdownText && (0, r.style)(this.countdownText, { display: 'none' }),
              this.countdownIcon && (0, r.style)(this.countdownIcon, { display: 'block' });
          }
          resetCountdown() {
            this.countdown && (0, r.resetStyle)(this.countdown, Object.keys(d)),
              this.countdownText && (0, r.resetStyle)(this.countdownText, ['display']),
              this.countdownIcon && (0, r.resetStyle)(this.countdownIcon, ['display']);
          }
          show() {
            this.ad &&
              ((this.visible = !0),
              this.shadow && this.modalContainer && this.shadow.appendChild(this.modalContainer),
              (0, r.style)(this.modalContainer, { pointerEvents: 'auto' }),
              (0, r.style)(this.modal, { opacity: '1.0' }, !0),
              (0, r.style)(this.fader, { opacity: '1.0' }, !0),
              (0, r.style)(this.videoContainer, { opacity: '1.0' }, !0),
              (0, r.style)(this.info, { opacity: '1.0', transform: 'translateX(0px)' }, !0),
              (0, r.style)(this.video, { transform: 'translateY(0px)' }, !0),
              (this.video.muted = !0),
              this.video.pause(),
              this.video.play().catch(() => {}));
          }
          dismiss() {
            return i(this, void 0, void 0, function* () {
              (this.visible = !1),
                (0, r.resetStyle)(this.modalContainer, ['pointerEvents']),
                (0, r.resetStyle)(this.modal, ['opacity']),
                (0, r.resetStyle)(this.fader, ['opacity']),
                (0, r.resetStyle)(this.info, ['opacity']),
                (0, r.resetStyle)(this.videoContainer, ['opacity']),
                yield (0, r.wait)(500),
                this.trackEvent('reward'),
                this.resetCountdown(),
                this.shadow && this.modalContainer && this.shadow.removeChild(this.modalContainer),
                (this.started = !1),
                (this.completed = !1),
                this.resetTrackedEvents(),
                yield this.loadAd(),
                this.injectAdData();
            });
          }
        }
        t.RewardedComponent = a;
        const l =
            "\n.modalContainer {\n    display: flex;\n    position: fixed;\n    justify-content: center;\n    align-items: center;\n    top: 0px;\n    left: 0px;\n    width: 100%;\n    height: 100%;\n    min-height: 100vh;\n    pointer-events: none;\n    z-index: 2147483647;\n    font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;\n    user-select: none;\n}\n\n.fader {\n    position: absolute;\n    top: 0px;\n    left: 0px;\n    width: 100%;\n    height: 100%;\n    opacity: 0;\n    transition: 0.3s opacity ease;\n}\n\n.faderContent {\n    position: absolute;\n    top: 0px;\n    left: 0px;\n    width: 100%;\n    height: 100%;\n    background-color: rgba(0, 0, 0, 0.7);\n}\n\n.modal {\n    position: relative;\n    margin: 0px auto;\n    width: 100vw;\n    height: 100vh;\n    opacity: 0;\n    transition: 0.4s opacity ease;\n}\n\n.video {\n    width: 100%;\n    height: 100%;\n    object-position: center;\n    transform: translateY(40px);\n    transition: 0.4s opacity ease, 0.5s transform ease;\n}\n\n.videoContainer {\n    opacity: 0.0;\n}\n\n.top {\n    position: absolute;\n    top: env(safe-area-inset-top);\n    left: env(safe-area-inset-left);\n    width: calc(100% - env(safe-area-inset-left) - env(safe-area-inset-right));\n    height: calc(100% - env(safe-area-inset-top) - env(safe-area-inset-bottom));\n}\n\n.info {\n    display: flex;\n    flex-direction: column;\n    position: absolute;\n    bottom: 0px;\n    left: 0px;\n    width: 100%;\n    padding-bottom: 20px;\n    box-sizing: border-box;\n    background-color: rgba(36, 38, 44, 0.64);\n    -webkit-backdrop-filter: blur(16px);\n    backdrop-filter: blur(16px);\n    opacity: 0;\n    transition: opacity 0.7s ease 0.4s;\n}\n\n.infoContent {\n    display: flex;\n    flex-direction: column;\n    align-items: center;\n    padding: 16px;\n    box-sizing: border-box;\n    text-align: center;\n}\n\n.infoColumn {\n    margin-top: 16px;\n    max-width: 200px;\n}\n\n.infoColumn:last-of-type {\n    margin-right: 0px;\n}\n\n.icon {\n    width: 44px;\n    height: 44px;\n    border-radius: 10px;\n}\n\n.headline {\n    font-size: 17px;\n    font-weight: 600;\n    line-height: 22px;\n    color: rgb(255, 255, 255);\n}\n\n.displayUrl {\n    margin: 4px 0px;\n    font-size: 14px;\n    font-weight: 600;\n    color: rgba(255, 255, 255, 0.7);\n}\n\n.cta {\n    padding: 0px 20px;\n    box-sizing: border-box;\n    width: 100%;\n    font-size: 16px;\n    font-weight: 600;\n    line-height: 40px;\n    color: rgb(255, 255, 255);\n    text-align: center;\n    background-color: rgb(75, 117, 255);\n    border-radius: 20px;\n}\n\n.countdown {\n    display: flex;\n    position: absolute;\n    justify-content: center;\n    align-items: center;\n    top: 20px;\n    right: 20px;\n    width: 40px;\n    height: 40px;\n    box-sizing: border-box;\n    background-color: rgba(36, 38, 44, 0.64);\n    -webkit-backdrop-filter: blur(16px);\n    backdrop-filter: blur(16px);\n    border-radius: 20px;\n    transition: 0.3s background-color ease, 0.3s width ease, 0.3s height ease;\n    pointer-events: none;\n}\n\n.countdownText {\n    color: rgb(255, 255, 255);\n    font-size: 16px;\n    font-weight: 600;\n    text-align: center;\n}\n\n.countdownIcon {\n    display: none;\n    width: 32px;\n    height: 32px;\n    background-size: 100% 100%;\n    background-image: url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' height='24px' viewBox='0 0 24 24' width='24px' fill='%23000000'%3E%3Cpath d='M0 0h24v24H0z' fill='none'/%3E%3Cpath d='M9 16.2L4.8 12l-1.4 1.4L9 19 21 7l-1.4-1.4L9 16.2z'/%3E%3C/svg%3E\");\n}\n\n@media (min-width: 960px) {\n    .modal {\n        width: 960px;\n        height: 540px;\n    }\n\n    .video {\n        object-position: center;\n    }\n\n    .info {\n        bottom: 40px;\n        width: auto;\n        padding-bottom: 0px;\n        border-top-right-radius: 16px;\n        border-bottom-right-radius: 16px;\n    }\n\n    .infoContent {\n        flex-direction: row;\n        text-align: left;\n    }\n\n    .infoColumn {\n        margin-top: 0px;\n        margin-right: 16px;\n    }\n}",
          d = {
            width: '60px',
            height: '60px',
            backgroundColor: 'rgb(76, 251, 134)',
            borderRadius: '32px',
            pointerEvents: 'auto'
          };
      },
      667: function (e, t, n) {
        var i =
          (this && this.__awaiter) ||
          function (e, t, n, i) {
            return new (n || (n = Promise))(function (o, r) {
              function s(e) {
                try {
                  l(i.next(e));
                } catch (e) {
                  r(e);
                }
              }
              function a(e) {
                try {
                  l(i.throw(e));
                } catch (e) {
                  r(e);
                }
              }
              function l(e) {
                var t;
                e.done
                  ? o(e.value)
                  : ((t = e.value),
                    t instanceof n
                      ? t
                      : new n(function (e) {
                          e(t);
                        })).then(s, a);
              }
              l((i = i.apply(e, t || [])).next());
            });
          };
        Object.defineProperty(t, '__esModule', { value: !0 }), (t.RTBBaseComponent = void 0);
        const o = n(376),
          r = n(270);
        class s extends HTMLElement {
          constructor() {
            super(...arguments), (this.bid = null), (this.intersectionObserver = null), (this.impressionFired = !1);
          }
          addIntersectionObserver(e = this) {
            (this.intersectionObserver = new IntersectionObserver(e =>
              i(this, void 0, void 0, function* () {
                var t;
                if (e.every(e => e.isIntersecting)) {
                  if (this.impressionFired) return;
                  (null === (t = this.bid) || void 0 === t ? void 0 : t.burl) &&
                    ((this.impressionFired = !0), yield fetch(this.bid.burl, { credentials: 'include' }));
                }
              })
            )),
              this.intersectionObserver.observe(e);
          }
          removeIntersectionObserver() {
            this.intersectionObserver && (this.intersectionObserver.disconnect(), (this.intersectionObserver = null));
          }
          resetTrackedEvents() {
            this.impressionFired = !1;
          }
          getPlacementSlug() {
            const e = this.getAttribute('placement');
            return e || (0, o.throwError)('No placement specified'), e;
          }
          emitEvent(e) {
            (0, o.debug)('Emitting', e, 'DOM event for:', this.getPlacementSlug()),
              this.dispatchEvent(new CustomEvent(e, { bubbles: !0, composed: !0, cancelable: !1 }));
          }
          requestBid() {
            return i(this, void 0, void 0, function* () {
              (this.bid = yield this._requestBid()), this.bid ? this.emitEvent('ready') : this.emitEvent('error');
            });
          }
          _requestBid() {
            return i(this, void 0, void 0, function* () {
              var e, t;
              const n = (0, o.getIdentity)();
              try {
                yield Promise.allSettled([n.refresh()]);
                const i = this.buildImpression(),
                  s = {
                    at: 1,
                    id: (0, o.randomId)(),
                    cur: ['USD'],
                    device: { language: navigator.language, ua: navigator.userAgent },
                    site: { page: (0, o.currentLocation)() || void 0, ref: document.referrer },
                    imp: [i],
                    user: {
                      buyeruid: n.uuid || void 0,
                      id: n.uuid || void 0,
                      ext: { wids: n.wids, wp: n.wp, wpfs: n.wpfs }
                    },
                    ext: {
                      source: 'network',
                      sdk_version: r.version,
                      dpr: Math.max(1, Math.min(3, Math.round(window.devicePixelRatio))),
                      vp: [
                        Math.max(document.documentElement.clientWidth || 0, window.innerWidth || 0),
                        Math.max(document.documentElement.clientHeight || 0, window.innerHeight || 0)
                      ]
                    }
                  },
                  a = yield fetch(new URL('/v1/rtb_requests', (0, o.getURL)()), {
                    method: 'POST',
                    credentials: 'include',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(s)
                  });
                return 200 !== a.status
                  ? ((0, o.log)('Failed to load ad:', a.statusText), (0, o.debug)('Response:', a), null)
                  : (null === (t = null === (e = (yield a.json()).seatbid) || void 0 === e ? void 0 : e[0].bid) ||
                    void 0 === t
                      ? void 0
                      : t[0]) || ((0, o.log)('No bids found in response'), null);
              } catch (e) {
                (0, o.log)('Failed to load ad:', e);
              }
              return null;
            });
          }
        }
        t.RTBBaseComponent = s;
      },
      687: (e, t, n) => {
        Object.defineProperty(t, '__esModule', { value: !0 }), (t.default = void 0);
        var i,
          o = (i = n(893)) && i.__esModule ? i : { default: i };
        t.default = function (e) {
          if (!(0, o.default)(e)) throw TypeError('Invalid UUID');
          return parseInt(e.slice(14, 15), 16);
        };
      },
      688: (e, t) => {
        Object.defineProperty(t, '__esModule', { value: !0 }),
          (t.default = void 0),
          (t.default = '00000000-0000-0000-0000-000000000000');
      },
      722: (e, t) => {
        let n;
        Object.defineProperty(t, '__esModule', { value: !0 }),
          (t.default = function () {
            if (
              !n &&
              ((n = 'undefined' != typeof crypto && crypto.getRandomValues && crypto.getRandomValues.bind(crypto)), !n)
            )
              throw new Error(
                'crypto.getRandomValues() not supported. See https://github.com/uuidjs/uuid#getrandomvalues-not-supported'
              );
            return n(i);
          });
        const i = new Uint8Array(16);
      },
      750: (e, t, n) => {
        Object.defineProperty(t, '__esModule', { value: !0 }), (t.default = void 0), (t.unsafeStringify = s);
        var i,
          o = (i = n(893)) && i.__esModule ? i : { default: i };
        const r = [];
        for (let e = 0; e < 256; ++e) r.push((e + 256).toString(16).slice(1));
        function s(e, t = 0) {
          return (
            r[e[t + 0]] +
            r[e[t + 1]] +
            r[e[t + 2]] +
            r[e[t + 3]] +
            '-' +
            r[e[t + 4]] +
            r[e[t + 5]] +
            '-' +
            r[e[t + 6]] +
            r[e[t + 7]] +
            '-' +
            r[e[t + 8]] +
            r[e[t + 9]] +
            '-' +
            r[e[t + 10]] +
            r[e[t + 11]] +
            r[e[t + 12]] +
            r[e[t + 13]] +
            r[e[t + 14]] +
            r[e[t + 15]]
          );
        }
        t.default = function (e, t = 0) {
          const n = s(e, t);
          if (!(0, o.default)(n)) throw TypeError('Stringified UUID is invalid');
          return n;
        };
      },
      766: (e, t, n) => {
        Object.defineProperty(t, '__esModule', { value: !0 }), (t.default = void 0);
        var i,
          o = (i = n(722)) && i.__esModule ? i : { default: i },
          r = n(750);
        let s,
          a,
          l = 0,
          d = 0;
        t.default = function (e, t, n) {
          let i = (t && n) || 0;
          const c = t || new Array(16);
          let u = (e = e || {}).node || s,
            h = void 0 !== e.clockseq ? e.clockseq : a;
          if (null == u || null == h) {
            const t = e.random || (e.rng || o.default)();
            null == u && (u = s = [1 | t[0], t[1], t[2], t[3], t[4], t[5]]),
              null == h && (h = a = 16383 & ((t[6] << 8) | t[7]));
          }
          let p = void 0 !== e.msecs ? e.msecs : Date.now(),
            f = void 0 !== e.nsecs ? e.nsecs : d + 1;
          const v = p - l + (f - d) / 1e4;
          if (
            (v < 0 && void 0 === e.clockseq && (h = (h + 1) & 16383),
            (v < 0 || p > l) && void 0 === e.nsecs && (f = 0),
            f >= 1e4)
          )
            throw new Error("uuid.v1(): Can't create more than 10M uuids/sec");
          (l = p), (d = f), (a = h), (p += 122192928e5);
          const m = (1e4 * (268435455 & p) + f) % 4294967296;
          (c[i++] = (m >>> 24) & 255), (c[i++] = (m >>> 16) & 255), (c[i++] = (m >>> 8) & 255), (c[i++] = 255 & m);
          const g = ((p / 4294967296) * 1e4) & 268435455;
          (c[i++] = (g >>> 8) & 255),
            (c[i++] = 255 & g),
            (c[i++] = ((g >>> 24) & 15) | 16),
            (c[i++] = (g >>> 16) & 255),
            (c[i++] = (h >>> 8) | 128),
            (c[i++] = 255 & h);
          for (let e = 0; e < 6; ++e) c[i + e] = u[e];
          return t || (0, r.unsafeStringify)(c);
        };
      },
      848: function (e, t, n) {
        var i =
          (this && this.__awaiter) ||
          function (e, t, n, i) {
            return new (n || (n = Promise))(function (o, r) {
              function s(e) {
                try {
                  l(i.next(e));
                } catch (e) {
                  r(e);
                }
              }
              function a(e) {
                try {
                  l(i.throw(e));
                } catch (e) {
                  r(e);
                }
              }
              function l(e) {
                var t;
                e.done
                  ? o(e.value)
                  : ((t = e.value),
                    t instanceof n
                      ? t
                      : new n(function (e) {
                          e(t);
                        })).then(s, a);
              }
              l((i = i.apply(e, t || [])).next());
            });
          };
        Object.defineProperty(t, '__esModule', { value: !0 }), (t.RTBBannerComponent = void 0);
        const o = n(376),
          r = n(667);
        class s extends r.RTBBaseComponent {
          constructor() {
            super(...arguments), (this.iframe = null), (this.refreshTimer = null), (this.disconnected = false);
          }
          connectedCallback() {
            this.disconnected = false;
            const getDisconnected = () => this.disconnected;

            return i(this, void 0, void 0, function* () {
              yield this.requestBid();

              if (!getDisconnected()) {
                this.refreshTimer = setInterval(() => this.requestBid(), 3e4);
              }
            });
          }
          disconnectedCallback() {
            this.disconnected = true;
            this.removeIntersectionObserver();
            this.refreshTimer && clearInterval(this.refreshTimer);
          }
          /*
          connectedCallback() {
            this.disconnected = false;
            const getDisconnected = () => this.disconnected;

            return i(this, void 0, void 0, function* () {
              this.updatePosition(),
                (0, o.style)(this, { display: 'none' }),
                yield this.requestBid();
              console.log('getDisconnected', getDisconnected());

              if (!getDisconnected()) {
                this.refreshTimer = setInterval(() => this.requestBid(), 3e4);
              }
            });
          }
          disconnectedCallback() {
            this.disconnected = true;
            this.removeIntersectionObserver();
            this.refreshTimer && clearInterval(this.refreshTimer);
          }
          */
          requestBid() {
            const e = Object.create(null, { requestBid: { get: () => super.requestBid } });
            return i(this, void 0, void 0, function* () {
              var t, n, i, r;
              if (document.hidden) return;
              if (null != this.bid && !1 === (null === (t = this.bid.ext) || void 0 === t ? void 0 : t.r)) return;
              const s = this.shadowRoot || this.attachShadow({ mode: 'open' });
              if ((yield e.requestBid.call(this), this.bid)) {
                this.removeIntersectionObserver(), this.resetTrackedEvents();
                const e = document.createElement('iframe');
                (0, o.style)(e, {
                  display: 'block',
                  width: `${this.bid.w}px`,
                  height: `${this.bid.h}px`,
                  border: 'none',
                  overflow: 'hidden'
                }),
                  e.setAttribute('frameborder', '0'),
                  e.setAttribute(
                    'sandbox',
                    'allow-scripts allow-same-origin allow-popups allow-popups-to-escape-sandbox'
                  ),
                  this.iframe ? s.replaceChild(e, this.iframe) : s.appendChild(e),
                  (this.iframe = e),
                  null === (n = this.iframe.contentWindow) || void 0 === n || n.document.open(),
                  null === (i = this.iframe.contentWindow) || void 0 === i || i.document.write(this.bid.adm || ''),
                  null === (r = this.iframe.contentWindow) || void 0 === r || r.document.close(),
                  this.addIntersectionObserver();
              }
            });
          }
          buildImpression() {
            const e = (0, o.getConfig)(),
              t = this.getBoundingClientRect();
            return {
              id: (0, o.randomId)(),
              banner: { w: 0, h: 0 },
              ext: {
                bidder: { property_slug: e.propertySlug, placement_slug: this.getPlacementSlug(), pp: [t.left, t.top] }
              }
            };
          }
        }
        t.RTBBannerComponent = s;
      },
      893: (e, t, n) => {
        Object.defineProperty(t, '__esModule', { value: !0 }), (t.default = void 0);
        var i,
          o = (i = n(264)) && i.__esModule ? i : { default: i };
        t.default = function (e) {
          return 'string' == typeof e && o.default.test(e);
        };
      },
      935: (e, t, n) => {
        Object.defineProperty(t, '__esModule', { value: !0 }),
          Object.defineProperty(t, 'NIL', {
            enumerable: !0,
            get: function () {
              return a.default;
            }
          }),
          Object.defineProperty(t, 'parse', {
            enumerable: !0,
            get: function () {
              return u.default;
            }
          }),
          Object.defineProperty(t, 'stringify', {
            enumerable: !0,
            get: function () {
              return c.default;
            }
          }),
          Object.defineProperty(t, 'v1', {
            enumerable: !0,
            get: function () {
              return i.default;
            }
          }),
          Object.defineProperty(t, 'v3', {
            enumerable: !0,
            get: function () {
              return o.default;
            }
          }),
          Object.defineProperty(t, 'v4', {
            enumerable: !0,
            get: function () {
              return r.default;
            }
          }),
          Object.defineProperty(t, 'v5', {
            enumerable: !0,
            get: function () {
              return s.default;
            }
          }),
          Object.defineProperty(t, 'validate', {
            enumerable: !0,
            get: function () {
              return d.default;
            }
          }),
          Object.defineProperty(t, 'version', {
            enumerable: !0,
            get: function () {
              return l.default;
            }
          });
        var i = h(n(766)),
          o = h(n(532)),
          r = h(n(521)),
          s = h(n(10)),
          a = h(n(688)),
          l = h(n(687)),
          d = h(n(893)),
          c = h(n(750)),
          u = h(n(512));
        function h(e) {
          return e && e.__esModule ? e : { default: e };
        }
      }
    },
    t = {};
  function n(i) {
    var o = t[i];
    if (void 0 !== o) return o.exports;
    var r = (t[i] = { exports: {} });
    return e[i].call(r.exports, r, r.exports, n), r.exports;
  }
  var i = {};
  (() => {
    var e = i;
    Object.defineProperty(e, '__esModule', { value: !0 }),
      (e.Environment = void 0),
      (e.initialize = function (e) {
        var n, i, l, c;
        e.environment,
          'string' != typeof e.propertySlug && (0, a.throwError)('Expected config.propertySlug to be a string'),
          ['local', 'development', 'production'].includes(e.environment) || (e.environment = 'production'),
          (window.__hype = window.__hype || {}),
          (window.__hype.config = e),
          window.__hype.identity ||
            (window.__hype.identity = new t.Identity({
              disableWalletDetection:
                null != (null === (n = e.privacy) || void 0 === n ? void 0 : n.disableWalletDetection)
                  ? null === (i = e.privacy) || void 0 === i
                    ? void 0
                    : i.disableWalletDetection
                  : null === (l = e.privacy) || void 0 === l
                  ? void 0
                  : l.disable_wallet_detection
            })),
          (null === (c = window.__hype_wids) || void 0 === c ? void 0 : c.length) &&
            (d(window.__hype_wids), (window.__hype_wids = void 0)),
          new URLSearchParams(window.location.search).has('hl-dbg') && (window.__hype.config.debugLogging = !0),
          customElements.get('hype-banner') || customElements.define('hype-banner', r.RTBBannerComponent),
          customElements.get('hype-native') || customElements.define('hype-native', s.RTBNativeComponent),
          customElements.get('hype-rewarded') || customElements.define('hype-rewarded', o.RewardedComponent);
      }),
      (e.setWalletAddresses = d);
    const t = n(361),
      o = n(645),
      r = n(848),
      s = n(165),
      a = n(376);
    var l;
    function d(e) {
      try {
        (0, a.getIdentity)().setWalletAddresses(e);
      } catch (t) {
        window.__hype_wids = e;
      }
    }
    !(function (e) {
      (e.Production = 'production'), (e.Development = 'development');
    })(l || (e.Environment = l = {}));
  })(),
    (HypeLab = i);
})();
