import axios from 'axios';
import { describeTokenExchangeFailure } from './thaid-oidc.client';

const context = {
  tokenUrl: 'https://imauth.bora.dopa.go.th/api/v2/oauth2/token/',
  redirectUri: 'https://buu-get.buu.ac.th/api/thaid/callback',
  clientIdLength: 43,
  clientSecretLength: 54,
};

describe('describeTokenExchangeFailure', () => {
  it('includes the oauth error description and keeps the secret out of the log', () => {
    const error = new axios.AxiosError(
      'Request failed with status code 401',
      'ERR_BAD_REQUEST',
      {
        headers: {} as never,
        data: 'client_secret=super-secret&code=auth-code',
      } as never,
      {},
      {
        status: 401,
        statusText: 'Unauthorized',
        headers: {
          'www-authenticate': 'Basic realm="thaid"',
        },
        config: {} as never,
        data: {
          error: 'unauthorized_client',
          error_description: 'Client authentication failed',
          client_secret: 'super-secret',
        },
      },
    );

    const line = describeTokenExchangeFailure(error, context);

    expect(line).toContain('status=401');
    expect(line).toContain('error=unauthorized_client');
    expect(line).toContain('description="Client authentication failed"');
    expect(line).toContain('auth=client_secret_post');
    expect(line).toContain('authorizationHeader=absent');
    expect(line).toContain('wwwAuthenticate="Basic realm=\'thaid\'"');
    expect(line).toContain('clientIdLength=43');
    expect(line).toContain('clientSecretLength=54');
    expect(line).not.toContain('super-secret');
    expect(line).not.toContain('auth-code');
  });

  it('redacts secrets when the response body is a form string', () => {
    const error = new axios.AxiosError(
      'Request failed with status code 400',
      'ERR_BAD_REQUEST',
      undefined,
      {},
      {
        status: 400,
        statusText: 'Bad Request',
        headers: {},
        config: {} as never,
        data: 'error=invalid_client&client_secret=super-secret&code=auth-code',
      },
    );

    const line = describeTokenExchangeFailure(error, context);

    expect(line).toContain('client_secret=redacted');
    expect(line).toContain('code=redacted');
    expect(line).not.toContain('super-secret');
    expect(line).not.toContain('auth-code');
  });

  it('records a transport failure when ThaiD does not answer', () => {
    const error = new axios.AxiosError(
      'timeout of 15000ms exceeded',
      'ECONNABORTED',
    );

    const line = describeTokenExchangeFailure(error, context);

    expect(line).toContain('status=none');
    expect(line).toContain('code=ECONNABORTED');
    expect(line).toContain('message="timeout of 15000ms exceeded"');
  });
});
