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

export const getGoogleAuthToken = async () =>
  new Promise<string>((resolve, reject) => {
    chrome.identity.getAuthToken({ interactive: true }, token => {
      if (chrome.runtime.lastError) {
        reject(chrome.runtime.lastError);
      } else if (!token) {
        reject(new Error('Failed to receive auth token for an unknown reason'));
      } else {
        resolve(token);
      }
    });
  });

const getFileId = async (fileName: string, authToken: string, nextPageToken?: string): Promise<string | undefined> => {
  const { data } = await googleApi.get<FilesListResponse>('/drive/v3/files', {
    params: {
      supportsAllDrives: false,
      key: EnvVars.GOOGLE_DRIVE_API_KEY,
      pageToken: nextPageToken
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

export const readGoogleDriveFile = async (fileName: string, authToken: string) => {
  const fileId = await getFileId(fileName, authToken);
  if (fileId) {
    const { data } = await googleApi.get<string>(`/drive/v3/files/${fileId}`, {
      params: {
        alt: 'media',
        key: EnvVars.GOOGLE_DRIVE_API_KEY
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
      mimeType: contentType
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
