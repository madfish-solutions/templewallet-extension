import axios from 'axios';

import { IntercomError } from 'lib/intercom/helpers';

import { templeWalletApi } from '../templewallet.api';

import { ALCHEMY_SUBMISSION_TIMEOUT_MESSAGE, isAlchemySubmissionTimeout, sendAlchemyCalls } from './alchemy-wallet';

jest.mock('../templewallet.api', () => ({ templeWalletApi: { post: jest.fn() } }));

const post = templeWalletApi.post as jest.MockedFunction<typeof templeWalletApi.post>;

beforeEach(() => jest.resetAllMocks());

it('identifies a submission timeout returned by the backend', async () => {
  post.mockResolvedValueOnce({ data: { error: { code: -32098, message: ALCHEMY_SUBMISSION_TIMEOUT_MESSAGE } } });

  await expect(sendAlchemyCalls({} as Parameters<typeof sendAlchemyCalls>[0])).rejects.toEqual(
    expect.objectContaining({ message: ALCHEMY_SUBMISSION_TIMEOUT_MESSAGE })
  );
  expect(isAlchemySubmissionTimeout(new IntercomError(ALCHEMY_SUBMISSION_TIMEOUT_MESSAGE))).toBe(true);
});

it('identifies a local submission request timeout', async () => {
  post.mockRejectedValueOnce(new axios.AxiosError('timeout of 30000ms exceeded', 'ECONNABORTED'));

  await expect(sendAlchemyCalls({} as Parameters<typeof sendAlchemyCalls>[0])).rejects.toThrow(
    ALCHEMY_SUBMISSION_TIMEOUT_MESSAGE
  );
  expect(isAlchemySubmissionTimeout(new Error('unrelated error'))).toBe(false);
});
