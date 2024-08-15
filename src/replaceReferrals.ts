import { processAnchors, stripSubdomain } from 'content-scripts/replace-referrals';
import { browser } from 'lib/browser';
import { ContentScriptType } from 'lib/constants';

const THIS_DOMAIN = stripSubdomain(window.location.hostname, 'www');

const replaceReferrals = throttleAsyncCalls(async () => {
  const supportedDomains: string[] = await browser.runtime.sendMessage({
    type: ContentScriptType.FetchReferralsSupportedDomains
  });

  if (!supportedDomains.length) {
    console.warn('No supported domains');
    clearInterval(interval);
    return;
  }

  if (supportedDomains.some(d => d === THIS_DOMAIN)) {
    console.warn('Host should not be of supported referral');
    clearInterval(interval);
    return;
  }

  return processAnchors(new Set(supportedDomains));
});

let interval: NodeJS.Timer;

// Prevents the script from running in an Iframe
if (window.frameElement === null) {
  replaceReferrals().catch(err => {
    // Most likely anchors haven't appeared on the page yet - will retry shortly
    console.error('Initial referrals processing errored:', err);
    setTimeout(replaceReferrals, 2_000);
  });

  interval = setInterval(replaceReferrals, 5_000);
}

function throttleAsyncCalls<F extends (...args: any[]) => any>(func: F): (...args: Parameters<F>) => Promise<void> {
  let settling = false;

  return async function (...args: Parameters<F>) {
    if (settling) return;
    settling = true;

    try {
      await func(...args);
      return;
    } finally {
      settling = false;
    }
  };
}
