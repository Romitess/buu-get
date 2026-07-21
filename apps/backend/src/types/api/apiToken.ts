export default interface ApiToken {
  access_token: string;
  refresh_token: string;
  /** อายุ access token (วินาที) จาก Kong — ใช้ตั้ง TTL ของ cache */
  expires_in?: number;
}
