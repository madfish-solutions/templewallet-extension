/**
 * API client for page analysis backend
 */

import { EnvVars } from 'lib/env';

import type { PageAnalysisRequest, PageAnalysisResponse } from './api-types';

const API_TIMEOUT_MS = 15000;

/**
 * Send page analysis request to the backend
 */
export async function analyzePageContent(request: PageAnalysisRequest): Promise<PageAnalysisResponse | null> {
  const apiUrl = EnvVars.TEMPLE_WALLET_API_URL;

  if (!apiUrl) {
    console.warn('[PageAnalysis] API URL not configured');

    return null;
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), API_TIMEOUT_MS);

  try {
    const response = await fetch(`${apiUrl}/api/page-analysis`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(request),
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[PageAnalysis] API error:', response.status, errorText);

      return null;
    }

    return await response.json();
  } catch (error) {
    clearTimeout(timeoutId);

    if (error instanceof Error && error.name === 'AbortError') {
      console.warn('[PageAnalysis] Request timed out');
    } else {
      console.error('[PageAnalysis] Request failed:', error);
    }

    return null;
  }
}
