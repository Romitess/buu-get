export default interface RequestTokenApiConfig {
  path: string;
  client_secret: string;
  client_id: string;
  grant_type: string;
  authenticated_userid: string;
}
