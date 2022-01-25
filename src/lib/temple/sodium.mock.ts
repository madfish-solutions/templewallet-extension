export const mockToolkitMethods = {
  contractAt: jest.fn()
};

jest.mock('libsodium-wrappers', () => ({
  ...jest.requireActual('libsodium-wrappers'),
  crypto_sign_ed25519_pk_to_curve25519: jest.fn(() => ({})),
  crypto_sign_ed25519_sk_to_curve25519: jest.fn(() => ({}))
}));
