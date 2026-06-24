import countriesData from 'src/assets/data/countries.json';

export interface Country {
  code: string;
  nameEN: string;
}

export function useCountries() {
  const featuredCountries: Country[] = countriesData.featured;

  const allCountries: Country[] = [...countriesData.all].sort((a, b) =>
    a.nameEN.localeCompare(b.nameEN),
  );

  const featuredCodes = new Set(featuredCountries.map((c) => c.code));
  const otherCountries = allCountries.filter((c) => !featuredCodes.has(c.code));

  const titleMap: Record<string, string> = countriesData.titleMap;

  return {
    featuredCountries,
    allCountries,
    otherCountries,
    titleMap,
  };
}
