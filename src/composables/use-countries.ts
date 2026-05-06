export interface Country {
  code: string;
  nameEN: string;
}

export function useCountries() {
  const featuredCountries: Country[] = [
    { code: 'TH', nameEN: 'Thailand' },
    { code: 'CN', nameEN: 'China' },
    { code: 'JP', nameEN: 'Japan' },
    { code: 'KR', nameEN: 'South Korea' },
    { code: 'SG', nameEN: 'Singapore' },
    { code: 'MY', nameEN: 'Malaysia' },
    { code: 'US', nameEN: 'United States' },
    { code: 'GB', nameEN: 'United Kingdom' },
  ];

  const allCountries: Country[] = [
    { code: 'AU', nameEN: 'Australia' },
    { code: 'AT', nameEN: 'Austria' },
    { code: 'BE', nameEN: 'Belgium' },
    { code: 'BR', nameEN: 'Brazil' },
    { code: 'KH', nameEN: 'Cambodia' },
    { code: 'CA', nameEN: 'Canada' },
    { code: 'CN', nameEN: 'China' },
    { code: 'DK', nameEN: 'Denmark' },
    { code: 'EG', nameEN: 'Egypt' },
    { code: 'FI', nameEN: 'Finland' },
    { code: 'FR', nameEN: 'France' },
    { code: 'DE', nameEN: 'Germany' },
    { code: 'GH', nameEN: 'Ghana' },
    { code: 'GR', nameEN: 'Greece' },
    { code: 'HK', nameEN: 'Hong Kong' },
    { code: 'HU', nameEN: 'Hungary' },
    { code: 'IN', nameEN: 'India' },
    { code: 'ID', nameEN: 'Indonesia' },
    { code: 'IE', nameEN: 'Ireland' },
    { code: 'IL', nameEN: 'Israel' },
    { code: 'IT', nameEN: 'Italy' },
    { code: 'JP', nameEN: 'Japan' },
    { code: 'KR', nameEN: 'South Korea' },
    { code: 'LA', nameEN: 'Laos' },
    { code: 'MY', nameEN: 'Malaysia' },
    { code: 'MX', nameEN: 'Mexico' },
    { code: 'MM', nameEN: 'Myanmar' },
    { code: 'NL', nameEN: 'Netherlands' },
    { code: 'NZ', nameEN: 'New Zealand' },
    { code: 'NG', nameEN: 'Nigeria' },
    { code: 'NO', nameEN: 'Norway' },
    { code: 'PK', nameEN: 'Pakistan' },
    { code: 'PH', nameEN: 'Philippines' },
    { code: 'PL', nameEN: 'Poland' },
    { code: 'PT', nameEN: 'Portugal' },
    { code: 'RU', nameEN: 'Russia' },
    { code: 'SA', nameEN: 'Saudi Arabia' },
    { code: 'SG', nameEN: 'Singapore' },
    { code: 'ZA', nameEN: 'South Africa' },
    { code: 'ES', nameEN: 'Spain' },
    { code: 'SE', nameEN: 'Sweden' },
    { code: 'CH', nameEN: 'Switzerland' },
    { code: 'TW', nameEN: 'Taiwan' },
    { code: 'TH', nameEN: 'Thailand' },
    { code: 'TR', nameEN: 'Turkey' },
    { code: 'AE', nameEN: 'UAE' },
    { code: 'UA', nameEN: 'Ukraine' },
    { code: 'GB', nameEN: 'United Kingdom' },
    { code: 'US', nameEN: 'United States' },
    { code: 'VN', nameEN: 'Vietnam' },
  ].sort((a, b) => a.nameEN.localeCompare(b.nameEN));

  const featuredCodes = new Set(featuredCountries.map((c) => c.code));
  const otherCountries = allCountries.filter((c) => !featuredCodes.has(c.code));

  const titleMap: Record<string, string> = {
    นาย: 'Mr.',
    นาง: 'Mrs.',
    นางสาว: 'Miss',
    ด็อกเตอร์: 'Dr.',
    ศาสตราจารย์: 'Prof.',
    รองศาสตราจารย์: 'Assoc. Prof.',
    ผู้ช่วยศาสตราจารย์: 'Asst. Prof.',
  };

  return {
    featuredCountries,
    allCountries,
    otherCountries,
    titleMap,
  };
}
