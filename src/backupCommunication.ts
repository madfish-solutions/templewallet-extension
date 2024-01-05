/* import { TempleMessageType, TempleResponse } from 'lib/temple/types';

import { getIntercom } from './intercom-client';

enum BackupEventType {
  BackupReadRequest = 'backupreadrequest',
  BackupReadAck = 'backupreadack',
  BackupWrittenRequest = 'backupwrittenrequest',
  BackupWrittenAck = 'backupwrittenack',
  BackupContentRequest = 'backupcontentrequest',
  BackupContentResponse = 'backupcontentresponse'
} */

window.addEventListener(
  'message',
  async (e: MessageEvent) => {
    try {
      if (e.data?.type) {
        console.log('backupCommunication', e.data);
      }
      /* switch (e.data?.type) {
        case BackupEventType.BackupReadRequest:
          await getIntercom().request({
            type: TempleMessageType.BackupReadRequest,
            content: e.data.content
          });
          window.postMessage({ type: BackupEventType.BackupReadAck }, '*');
          break;
        case BackupEventType.BackupWrittenRequest:
          await getIntercom().request({
            type: TempleMessageType.BackupWrittenRequest
          });
          window.postMessage({ type: BackupEventType.BackupWrittenAck }, '*');
          break;
        case BackupEventType.BackupContentRequest:
          const response: TempleResponse | nullish = await getIntercom().request({
            type: TempleMessageType.BackupContentRequest
          });

          if (response?.type === TempleMessageType.BackupContentResponse) {
            window.postMessage(
              {
                type: BackupEventType.BackupContentResponse,
                content: response.content
              },
              '*'
            );
          }
          break;
      } */
    } catch (e) {
      console.error('backupCommunication', e);
    }
  },
  false
);

export {};
