import { normalizeAiChatbotAdsDomain } from 'lib/ai-chatbot-ads';

import { ChatGptAdapter } from './chatgpt-adapter';
import { CHATGPT_DOMAIN } from './constants';
import { AiChatbotAdsController } from './controller';

(async () => {
  if (window.self !== window.top) return;

  const domain = normalizeAiChatbotAdsDomain(window.location.hostname);
  if (domain !== CHATGPT_DOMAIN) return;

  await waitForBody();

  const controller = new AiChatbotAdsController({
    adapter: new ChatGptAdapter(),
    domain
  });
  controller.start();
})();

function waitForBody(): Promise<void> {
  if (document.body) return Promise.resolve();

  return new Promise(resolve => {
    document.addEventListener('DOMContentLoaded', () => resolve(), { once: true });
  });
}
