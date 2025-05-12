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

const googleApi = axios.create({
  baseURL: 'https://www.googleapis.com'
});

enum AuthEventType {
  DoAuthRetry = 'doauthretry',
  AuthRequest = 'authrequest',
  AuthError = 'autherror'
}

export const getGoogleAuthToken = async (
  googleAuthIframeRef: MutableRefObject<HTMLIFrameElement | null>,
  isRetry: boolean
) => {
  return new Promise<string>((res, rej) => {
    const messagesListener = async (e: MessageEvent) => {
      switch (e.data?.type) {
        case AuthEventType.AuthRequest:
          res(e.data.content);
          window.removeEventListener('message', messagesListener);
          break;
        case AuthEventType.AuthError:
          rej(new Error(e.data.content));
          window.removeEventListener('message', messagesListener);
          break;
      }
    };
    window.addEventListener('message', messagesListener);
    const googleAuthIframeWindow = googleAuthIframeRef.current?.contentWindow;

    if (!googleAuthIframeWindow) {
      rej(new Error('Google auth iframe window is not available'));
      window.removeEventListener('message', messagesListener);

      return;
    }

    if (isRetry) {
      googleAuthIframeWindow.postMessage({ type: AuthEventType.DoAuthRetry }, '*');
    }
  });
};

const getFileId = async (fileName: string, authToken: string, nextPageToken?: string): Promise<string | undefined> => {
  const { data } = await googleApi.get<FilesListResponse>('/drive/v3/files', {
    params: {
      supportsAllDrives: false,
      key: EnvVars.GOOGLE_DRIVE_API_KEY,
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

export const getAccountEmail = async (authToken: string) => {
  const { data } = await googleApi.get<{ email: string }>('/oauth2/v3/userinfo', {
    params: {
      access_token: authToken
    }
  });

  return data.email;
};

export const readGoogleDriveFile = async <T = string>(fileName: string, authToken: string) => {
  const fileId = await getFileId(fileName, authToken);
  if (fileId) {
    const { data } = await googleApi.get<T>(`/drive/v3/files/${fileId}`, {
      params: {
        alt: 'media',
        key: EnvVars.GOOGLE_DRIVE_API_KEY,
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

  const { data } = await googleApi[method]<GoogleFile>(
    `/upload/drive/v3/files${fileId ? `/${fileId}` : ''}`,
    `--${boundary}\r\ncontent-type: application/json; charset=UTF-8\r\n\r\n${JSON.stringify({
      name: fileName,
      mimeType: contentType,
      parents: fileId ? undefined : ['appDataFolder']
    })}\r\n--${boundary}\r\ncontent-type: ${contentType}\r\n\r\n${content}\r\n--${boundary}--`,
    {
      params: {
        uploadType: 'multipart',
        key: EnvVars.GOOGLE_DRIVE_API_KEY
      },
      headers: {
        Authorization: `Bearer ${authToken}`,
        'Content-Type': `multipart/related; boundary=${boundary}`
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

  await googleApi.delete(`/drive/v3/files/${fileId}`, {
    params: {
      key: EnvVars.GOOGLE_DRIVE_API_KEY,
      supportsAllDrives: false
    },
    headers: {
      Authorization: `Bearer ${authToken}`
    }
  });
};
