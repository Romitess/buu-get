import {
  formatThaidHouseAddress,
  mapThaidProfile,
  readThaidAddressText,
  stripLeadingTitle,
} from './thaid-profile-map';

describe('stripLeadingTitle', () => {
  it('cuts a Thai prefix out of the full name', () => {
    expect(
      stripLeadingTitle('นาย ภัทรพล สุดประเสริฐ', 'นาย', [
        'นาย',
        'นางสาว',
        'นาง',
      ]),
    ).toEqual({
      name: 'ภัทรพล สุดประเสริฐ',
      removedTitle: 'นาย',
    });
  });

  it('keeps a name that does not start with a title', () => {
    expect(stripLeadingTitle('ภัทรพล สุดประเสริฐ', 'นาย', ['นาย'])).toEqual({
      name: 'ภัทรพล สุดประเสริฐ',
      removedTitle: '',
    });
  });

  it('prefers the longer Thai title', () => {
    expect(
      stripLeadingTitle('นางสาว สมหญิง ใจดี', undefined, ['นาง', 'นางสาว']),
    ).toEqual({
      name: 'สมหญิง ใจดี',
      removedTitle: 'นางสาว',
    });
  });

  it('cuts an English prefix', () => {
    expect(
      stripLeadingTitle('Mr. Pattarapon Sudprasert', 'Mr.', ['Mr.', 'Mrs.']),
    ).toEqual({
      name: 'Pattarapon Sudprasert',
      removedTitle: 'Mr.',
    });
  });
});

describe('formatThaidHouseAddress', () => {
  it('splits a Bangkok house address into text', () => {
    expect(
      formatThaidHouseAddress(
        '99/12#5#บางรัก#สุขุมวิท 10#สุขุมวิท#คลองเตย#คลองเตย#กรุงเทพมหานคร',
      ),
    ).toBe(
      '99/12 หมู่ที่ 5 ตรอกบางรัก ซอยสุขุมวิท 10 ถนนสุขุมวิท แขวงคลองเตย เขตคลองเตย กรุงเทพมหานคร',
    );
  });

  it('skips empty segments and labels a provincial address', () => {
    expect(
      formatThaidHouseAddress('10#2###มิตรภาพ#แสนสุข#เมืองชลบุรี#ชลบุรี'),
    ).toBe('10 หมู่ที่ 2 ถนนมิตรภาพ ตำบลแสนสุข อำเภอเมืองชลบุรี จังหวัดชลบุรี');
  });

  it('does not repeat a label that is already in the segment', () => {
    expect(
      formatThaidHouseAddress(
        '1#หมู่ที่ 4####ตำบลแสนสุข#อำเภอเมือง#จังหวัดชลบุรี',
      ),
    ).toBe('1 หมู่ที่ 4 ตำบลแสนสุข อำเภอเมือง จังหวัดชลบุรี');
  });
});

describe('readThaidAddressText', () => {
  const raw = '99/12#5###สุขุมวิท#คลองเตย#คลองเตย#กรุงเทพมหานคร';
  const text =
    '99/12 หมู่ที่ 5 ถนนสุขุมวิท แขวงคลองเตย เขตคลองเตย กรุงเทพมหานคร';

  it('reads house_address.raw and ignores the house id', () => {
    expect(
      readThaidAddressText({
        house_address: {
          id: '12345678901',
          formatted: 'formatted-should-not-win',
          raw,
        },
      }),
    ).toBe(text);
  });

  it('reads a nested house_address json string', () => {
    expect(
      readThaidAddressText({
        address: JSON.stringify({
          house_address: { id: '12345678901', raw },
        }),
      }),
    ).toBe(text);
  });

  it('uses a plain address string when it is not json', () => {
    expect(readThaidAddressText({ address: '99/12 ถนนสุขุมวิท แขวงคลองเตย' })).toBe(
      '99/12 ถนนสุขุมวิท แขวงคลองเตย',
    );
  });

  it('falls back to formatted when raw is empty', () => {
    expect(
      readThaidAddressText({
        house_address: { formatted: '99/12 ถนนสุขุมวิท', raw: '' },
      }),
    ).toBe('99/12 ถนนสุขุมวิท');
  });
});

describe('mapThaidProfile', () => {
  it('assigns the name without the prefix and the address as text', () => {
    expect(
      mapThaidProfile({
        name: 'นาย ภัทรพล สุดประเสริฐ',
        nameEn: 'Mr. Pattarapon Sudprasert',
        title: 'นาย',
        titleEn: 'Mr.',
        birthdate: '1990-01-02',
        address: '99/12 หมู่ที่ 5 แขวงคลองเตย เขตคลองเตย กรุงเทพมหานคร',
      }),
    ).toEqual({
      titleTH: 'นาย',
      titleEN: 'Mr.',
      fullName: 'ภัทรพล สุดประเสริฐ',
      englishName: 'Pattarapon Sudprasert',
      birthdate: '1990-01-02',
      address: '99/12 หมู่ที่ 5 แขวงคลองเตย เขตคลองเตย กรุงเทพมหานคร',
    });
  });
});
