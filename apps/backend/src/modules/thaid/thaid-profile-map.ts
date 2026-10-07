/** คำนำหน้าที่พบบ่อยใน claim ชื่อของ ThaID เรียงยาวก่อนเพื่อไม่ให้ "นาง" ตัด "นางสาว" */
const THAI_TITLES = [
  'นางสาว',
  'เด็กหญิง',
  'เด็กชาย',
  'นาง',
  'นาย',
  'ด.ญ.',
  'ด.ช.',
];

const ENGLISH_TITLES = [
  'Master',
  'Miss',
  'Mrs.',
  'Mrs',
  'Ms.',
  'Ms',
  'Mr.',
  'Mr',
  'Dr.',
  'Dr',
];

export interface ThaidProfileSource {
  name?: string;
  nameEn?: string;
  birthdate?: string;
  title?: string;
  titleEn?: string;
  address?: string;
}

export interface MappedThaidProfile {
  titleTH: string;
  titleEN: string;
  fullName: string;
  englishName: string;
  birthdate: string;
  address: string;
}

interface StripResult {
  name: string;
  removedTitle: string;
}

/**
 * ตัดคำนำหน้าออกจากชื่อ-นามสกุล เช่น "นาย ภัทรพล สุดประเสริฐ" → "ภัทรพล สุดประเสริฐ"
 * ใช้คำนำหน้าจาก claim ก่อน แล้วจึงเทียบรายการที่รู้จัก
 */
export function stripLeadingTitle(
  fullName: string | undefined,
  explicitTitle: string | undefined,
  knownTitles: readonly string[],
): StripResult {
  const name = (fullName ?? '').replace(/\s+/g, ' ').trim();
  if (!name) {
    return { name: '', removedTitle: '' };
  }

  const candidates = uniqueTitles([explicitTitle, ...knownTitles]);
  for (const title of candidates) {
    const rest = removeTitlePrefix(name, title);
    if (rest !== null) {
      return { name: rest, removedTitle: title };
    }
  }

  return { name, removedTitle: '' };
}

/** ประกอบที่อยู่จาก raw ที่คั่นด้วย # เป็นข้อความเดียว */
export function formatThaidHouseAddress(raw: string | undefined): string {
  const parts = (raw ?? '').split('#').map((part) => part.trim());
  const [
    houseNo = '',
    moo = '',
    trok = '',
    soi = '',
    road = '',
    subdistrict = '',
    district = '',
    province = '',
  ] = parts;
  const provinceName = province.replace(/^จังหวัด/, '').trim();
  const bangkok = provinceName.includes('กรุงเทพ');
  const subdistrictLabel = bangkok ? 'แขวง' : 'ตำบล';
  const districtLabel = bangkok ? 'เขต' : 'อำเภอ';

  return [
    houseNo,
    labeled(moo, 'หมู่ที่', true),
    labeled(trok, 'ตรอก', false),
    labeled(soi, 'ซอย', false),
    labeled(road, 'ถนน', false),
    labeled(subdistrict, subdistrictLabel, false),
    labeled(district, districtLabel, false),
    formatProvince(province, bangkok),
  ]
    .filter((part) => part !== '')
    .join(' ');
}

export function mapThaidProfile(
  claims: ThaidProfileSource,
): MappedThaidProfile {
  const thai = stripLeadingTitle(claims.name, claims.title, THAI_TITLES);
  const english = stripLeadingTitle(
    claims.nameEn,
    claims.titleEn,
    ENGLISH_TITLES,
  );

  return {
    titleTH: (claims.title || thai.removedTitle).trim(),
    titleEN: (claims.titleEn || english.removedTitle).trim(),
    fullName: thai.name,
    englishName: english.name,
    birthdate: claims.birthdate ?? '',
    address: claims.address ?? '',
  };
}

/** อ่าน house_address จาก payload แล้วคืนที่อยู่ที่เป็นข้อความ */
export function readThaidAddressText(
  payload: Record<string, unknown>,
): string | undefined {
  const directAddress = payload.address;
  if (typeof directAddress === 'string') {
    const trimmed = directAddress.trim();
    if (trimmed !== '' && !trimmed.startsWith('{')) {
      return trimmed;
    }
  }
  const house = readHouseAddress(payload);
  if (!house) {
    return undefined;
  }
  const fromRaw = formatThaidHouseAddress(house.raw);
  if (fromRaw) {
    return fromRaw;
  }
  const formatted = house.formatted?.trim();
  return formatted ? formatted : undefined;
}

interface HouseAddressParts {
  raw?: string;
  formatted?: string;
}

function readHouseAddress(
  payload: Record<string, unknown>,
): HouseAddressParts | undefined {
  const addressRecord = asRecord(payload.address);
  const candidates = [
    payload.house_address,
    addressRecord?.house_address,
    payload.address,
  ];

  for (const candidate of candidates) {
    const record = asRecord(candidate);
    if (!record) {
      continue;
    }
    const raw = readOptionalString(record.raw);
    const formatted = readOptionalString(record.formatted);
    if (raw || formatted) {
      return {
        ...(raw ? { raw } : {}),
        ...(formatted ? { formatted } : {}),
      };
    }
  }

  return undefined;
}

function asRecord(value: unknown): Record<string, unknown> | undefined {
  if (typeof value === 'string') {
    const trimmed = value.trim();
    if (!trimmed.startsWith('{')) {
      return undefined;
    }
    try {
      return asRecord(JSON.parse(trimmed) as unknown);
    } catch {
      return undefined;
    }
  }
  if (value === null || typeof value !== 'object' || Array.isArray(value)) {
    return undefined;
  }
  return value as Record<string, unknown>;
}

function readOptionalString(value: unknown): string | undefined {
  if (typeof value !== 'string') {
    return undefined;
  }
  const trimmed = value.trim();
  return trimmed === '' ? undefined : trimmed;
}

function uniqueTitles(titles: Array<string | undefined>): string[] {
  const seen = new Set<string>();
  const result: string[] = [];
  for (const title of titles) {
    const trimmed = title?.trim();
    if (!trimmed) {
      continue;
    }
    const key = trimmed.toLocaleLowerCase('en-US');
    if (seen.has(key)) {
      continue;
    }
    seen.add(key);
    result.push(trimmed);
  }
  return result.sort((left, right) => right.length - left.length);
}

function removeTitlePrefix(name: string, title: string): string | null {
  const prefix = title.trim();
  if (!prefix) {
    return null;
  }
  if (
    !name
      .toLocaleLowerCase('en-US')
      .startsWith(prefix.toLocaleLowerCase('en-US'))
  ) {
    return null;
  }
  const rest = name.slice(prefix.length);
  if (rest === '') {
    return '';
  }
  if (/^\s/.test(rest) || /[.\u0E2F]$/.test(prefix)) {
    return rest.trim();
  }
  return null;
}

function labeled(value: string, label: string, spaced: boolean): string {
  const trimmed = value.trim();
  if (!trimmed) {
    return '';
  }
  if (
    trimmed.startsWith(label) ||
    (label === 'หมู่ที่' && trimmed.startsWith('หมู่'))
  ) {
    return trimmed;
  }
  return spaced ? `${label} ${trimmed}` : `${label}${trimmed}`;
}

function formatProvince(value: string, bangkok: boolean): string {
  const trimmed = value.trim();
  if (!trimmed) {
    return '';
  }
  if (bangkok) {
    return trimmed.replace(/^จังหวัด/, '').trim();
  }
  if (trimmed.startsWith('จังหวัด')) {
    return trimmed;
  }
  return `จังหวัด${trimmed}`;
}
