export default () => ({
  domain: process.env.BUU_DOMAIN || 'https://kong-dev.buu.ac.th',
  requestTokenAPI: {
    path: process.env.BUU_REQUEST_TOKEN_PATH || '/oauth2/token/',
    client_secret: process.env.BUU_REQUEST_CLIENT_SECRET || '',
    client_id: process.env.BUU_REQUEST_CLIENT_ID || '',
    grant_type: process.env.BUU_REQUEST_GRANT_TYPE || 'password',
    authenticated_userid: process.env.BUU_REQUEST_AUTH_USERID || 'hrd-kong',
  },
  refreshTokenAPI: {
    client_secret: process.env.BUU_REFRESH_CLIENT_SECRET || '',
    client_id: process.env.BUU_REFRESH_CLIENT_ID || '',
    grant_type: process.env.BUU_REFRESH_GRANT_TYPE || 'refresh_token',
  },
  loginBuu: {
    path: process.env.BUU_LOGIN_BUU_PATH || '/service-api/ldap.loginBuu',
    provision_key: process.env.BUU_LOGIN_BUU_PROVISION_KEY || '',
    scope: process.env.BUU_LOGIN_BUU_SCOPE || 'read',
    secret: (process.env.BUU_LOGIN_BUU_SECRET || 'false') === 'true',
  },
  sendEmail: {
    path: process.env.BUU_SEND_EMAIL_PATH || '/service-api/email.SendEmail',
    provision_key: process.env.BUU_SEND_EMAIL_PROVISION_KEY || '',
    scope: process.env.BUU_SEND_EMAIL_SCOPE || 'write',
  },

  uploadFile: {
    path: process.env.BUU_UPLOAD_FILE_PATH || '/service-api/minio.PutFile',
    provision_key: process.env.BUU_UPLOAD_FILE_PROVISION_KEY || '',
    scope: process.env.BUU_UPLOAD_FILE_SCOPE || 'write',
  },
  getFileList: {
    path:
      process.env.BUU_GET_FILE_LIST_PATH || '/service-api/minio.GetFilesList',
    provision_key: process.env.BUU_GET_FILE_LIST_PROVISION_KEY || '',
    scope: process.env.BUU_GET_FILE_LIST_SCOPE || 'read',
  },
  getPublicFile: {
    path:
      process.env.BUU_GET_PUBLIC_FILE_PATH ||
      '/service-api/minio.GetPublicFile',
    provision_key: process.env.BUU_GET_PUBLIC_FILE_PROVISION_KEY || '',
    scope: process.env.BUU_GET_PUBLIC_FILE_SCOPE || 'read',
  },
  deleteFile: {
    path: process.env.BUU_DELETE_FILE_PATH || '/service-api/minio.DeleteFile',
    provision_key: process.env.BUU_DELETE_FILE_PROVISION_KEY || '',
    scope: process.env.BUU_DELETE_FILE_SCOPE || 'write',
  },
  noti: process.env.NOTI_PREFIX ?? '',
  isDev: (process.env.IS_DEV || 'true') === 'true', //isDev: false, for not show some on prod
  // คำนำหน้า
  // Method : GET, POST
  dsPrefix: {
    path: process.env.BUU_DS_PREFIX_PATH || '/service-api/ds.Prefix',
    provision_key: process.env.BUU_DS_PREFIX_PROVISION_KEY || '',
    scope: process.env.BUU_DS_PREFIX_SCOPE || 'read',
  },
  getSignatureImageByPerson: {
    // ชื่อ env ตรงกับ HRD เพื่อ copy จาก hrd-back/.development.env ได้เลย
    path:
      process.env.BUU_GET_SIG_IMAGE_PERSON_PATH ||
      '/e-sign/e-sign.GetSignatureImageByPerson',
    provision_key: process.env.BUU_GET_SIG_IMAGE_PERSON_PROVISION_KEY || '',
    scope: process.env.BUU_GET_SIG_IMAGE_PERSON_SCOPE || 'read',
  },
});
