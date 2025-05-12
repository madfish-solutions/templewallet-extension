import axios from 'axios';
import { v4 } from 'uuid';
import browser from 'webextension-polyfill';

import { EnvVars } from 'lib/env';
import { TempleMessageType, TempleNotification } from 'lib/temple/types';
import { intercomClient, makeIntercomRequest } from 'temple/front/intercom-client';

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

export const updateGoogleAuthTokenWithProxyWebsite = async () => {
  const tab = await browser.tabs.create({ url: EnvVars.GOOGLE_AUTH_PAGE_URL });

  await new Promise<void>((res, rej) => {
    const unsubscribe = intercomClient.subscribe(async (msg: TempleNotification) => {
      if (msg?.type !== TempleMessageType.StateUpdated) {
        return;
      }

      const response = await makeIntercomRequest({
        type: TempleMessageType.GetStateRequest
      });
      if (response.type === TempleMessageType.GetStateResponse && response.state.googleAuthToken) {
        unsubscribe();
        res();
        try {
          if (tab.id !== undefined) {
            await browser.tabs.remove(tab.id);
          }
        } catch {
          // noop
        }
      }
    });

    const removedTabListener = (tabId: number) => {
      if (tabId !== tab.id) {
        return;
      }

      browser.tabs.onRemoved.removeListener(removedTabListener);
      unsubscribe();
      rej(new Error('Google auth tab closed'));
    };
    browser.tabs.onRemoved.addListener(removedTabListener);
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
