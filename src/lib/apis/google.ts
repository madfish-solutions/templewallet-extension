import type { MutableRefObject } from 'react';

import axios from 'axios';
import { v4 } from 'uuid';

import { EnvVars } from 'lib/env';

interface GoogleFile {
  kind: string;
  mimeType: string;
  id: string;
  name: string;
}

interface FilesListResponse {
  kind: string;
  incompleteSearch: boolean;
  nextPageToken?: string;
  files: GoogleFile[];
}

export class FileDoesNotExistError extends Error {}

const googleDriveProxyApi = axios.create({
  baseURL: `${EnvVars.TEMPLE_WALLET_API_URL}/api/google-drive`
});

enum AuthEventType {
  DoAuthRetry = 'doauthretry',
  AuthRequest = 'authrequest',
  AuthError = 'autherror',
  Load = 'load'
}

export const getGoogleAuthPageUrl = () => {
  const url = new URL(EnvVars.GOOGLE_AUTH_PAGE_URL);
  url.searchParams.set('nonce', v4());

  return url.toString();
};

export const getGoogleAuthToken = async (
  googleAuthIframeRef: MutableRefObject<HTMLIFrameElement | null>,
  isRetry: boolean
) =>
  new Promise<string>((res, rej) => {
    const loadFailedTimeout = setTimeout(() => {
      rej(new Error('Google auth iframe load failed'));
      finalize();
    }, 20000);

    const finalize = () => {
      window.removeEventListener('message', messagesListener);
      clearTimeout(loadFailedTimeout);
    };

    async function messagesListener(e: MessageEvent) {
      switch (e.data?.type) {
        case AuthEventType.AuthRequest:
          res(e.data.content);
          finalize();
          break;
        case AuthEventType.AuthError:
          rej(new Error(e.data.content));
          finalize();
          break;
        case AuthEventType.Load:
          clearTimeout(loadFailedTimeout);
          break;
      }
    }

    window.addEventListener('message', messagesListener);
    const googleAuthIframeWindow = googleAuthIframeRef.current?.contentWindow;

    if (!googleAuthIframeWindow) {
      rej(new Error('Google auth iframe window is not available'));
      finalize();

      return;
    }

    if (isRetry) {
      googleAuthIframeWindow.postMessage({ type: AuthEventType.DoAuthRetry }, '*');
    }
  });

const getFileId = async (fileName: string, authToken: string, nextPageToken?: string): Promise<string | undefined> => {
  const { data } = await googleDriveProxyApi.get<FilesListResponse>('/drive/v3/files', {
    params: {
      supportsAllDrives: false,
      pageToken: nextPageToken,
      spaces: 'appDataFolder'
    },
    headers: {
      Authorization: `Bearer ${authToken}`
    }
  });

  const matchingFile = data.files.find(file => file.name === fileName);

  if (matchingFile) {
    return matchingFile.id;
  }

  return data.nextPageToken ? getFileId(fileName, authToken, data.nextPageToken) : undefined;
};

export const fileExists = async (fileName: string, authToken: string) =>
  (await getFileId(fileName, authToken)) !== undefined;

export const getAccountEmail = async (authToken: string) => {
  const { data } = await googleDriveProxyApi.get<{ email: string }>('/oauth2/v3/userinfo', {
    params: {
      access_token: authToken
    }
  });

  return data.email;
};

export const readGoogleDriveFile = async <T = string>(fileName: string, authToken: string) => {
  const fileId = await getFileId(fileName, authToken);
  if (fileId) {
    const { data } = await googleDriveProxyApi.get<T>(`/drive/v3/files/${fileId}`, {
      params: {
        alt: 'media',
        spaces: 'appDataFolder'
      },
      headers: {
        Authorization: `Bearer ${authToken}`
      }
    });

    return data;
  }

  throw new FileDoesNotExistError(`File ${fileName} does not exist`);
};

export const writeGoogleDriveFile = async (
  fileName: string,
  content: string,
  authToken: string,
  contentType = 'application/json'
) => {
  const fileId = await getFileId(fileName, authToken);
  const method = fileId ? 'patch' : 'post';
  const boundary = v4();

  const { data } = await googleDriveProxyApi[method]<GoogleFile>(
    `/upload/drive/v3/files${fileId ? `/${fileId}` : ''}`,
    {
      body: `--${boundary}\r\ncontent-type: application/json; charset=UTF-8\r\n\r\n${JSON.stringify({
        name: fileName,
        mimeType: contentType,
        parents: fileId ? undefined : ['appDataFolder']
      })}\r\n--${boundary}\r\ncontent-type: ${contentType}\r\n\r\n${content}\r\n--${boundary}--`,
      contentType: `multipart/related; boundary=${boundary}`
    },
    {
      params: {
        uploadType: 'multipart'
      },
      headers: {
        Authorization: `Bearer ${authToken}`
      }
    }
  );

  return data;
};

export const deleteGoogleDriveFile = async (fileName: string, authToken: string) => {
  const fileId = await getFileId(fileName, authToken);

  if (!fileId) {
    throw new FileDoesNotExistError(`File ${fileName} does not exist`);
  }

  await googleDriveProxyApi.delete(`/drive/v3/files/${fileId}`, {
    params: {
      supportsAllDrives: false
    },
    headers: {
      Authorization: `Bearer ${authToken}`
    }
  });
};
