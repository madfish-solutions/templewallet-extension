const secureBrowserVersions: Record<string, number> = {
  Chrome: 93,
  Firefox: 88,
  IE: 11,
  Edge: 16,
  Opera: 72,
  Safari: 12
};

const browserInfo = (() => {
  let ua = navigator.userAgent,
    tem,
    M = ua.match(/(opera|chrome|safari|firefox|msie|trident(?=\/))\/?\s*(\d+)/i) || [];

  if (/trident/i.test(M[1])) {
    tem = /\brv[ :]+(\d+)/g.exec(ua) || [];
    return { name: 'IE', version: tem[1] || '' };
  }

  if (M[1] === 'Chrome') {
    tem = ua.match(/\b(OPR|Edge)\/(\d+)/);
    if (tem != null) {
      return { name: tem[1].replace('OPR', 'Opera'), version: tem[2] };
    }
  }

  M = M[2] ? [M[1], M[2]] : [navigator.appName, navigator.appVersion, '-?'];

  if ((tem = ua.match(/version\/(\d+)/i)) != null) {
    M.splice(1, 1, tem[1]);
  }

  return { name: M[0], version: M[1] };
})();

export const isSafeBrowserVersion = (() => {
  if (secureBrowserVersions.hasOwnProperty(browserInfo.name)) {
    if (parseInt(browserInfo.version) >= secureBrowserVersions[browserInfo.name]) {
      return true;
    }
  }

  return false;
})();
