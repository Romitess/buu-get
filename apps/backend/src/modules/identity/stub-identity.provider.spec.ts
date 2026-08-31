import { NotImplementedException } from '@nestjs/common';
import { StubIdentityProvider } from './stub-identity.provider';

describe('StubIdentityProvider', () => {
  const provider = new StubIdentityProvider();

  it('startAuth throws NotImplementedException', async () => {
    await expect(provider.startAuth()).rejects.toBeInstanceOf(
      NotImplementedException,
    );
  });

  it('handleCallback throws NotImplementedException', async () => {
    await expect(
      provider.handleCallback({ query: {}, body: {} }),
    ).rejects.toBeInstanceOf(NotImplementedException);
  });

  it('linkToUser throws NotImplementedException', async () => {
    await expect(provider.linkToUser(1, 'sub')).rejects.toBeInstanceOf(
      NotImplementedException,
    );
  });
});
