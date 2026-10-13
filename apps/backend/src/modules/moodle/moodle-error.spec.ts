import { formatMoodleError, isMoodleMissingRecordError } from './moodle-error';

describe('formatMoodleError', () => {
  it('uses debuginfo when the message is only the generic invalid parameter text', () => {
    expect(
      formatMoodleError({
        exception: 'invalid_parameter_exception',
        errorcode: 'invalidparameter',
        message: 'Invalid parameter value detected',
        debuginfo: 'Email address already exists: student@buu.ac.th',
      }),
    ).toBe('อีเมลนี้มีอยู่ใน Moodle แล้ว: student@buu.ac.th');
  });

  it('explains a Moodle password policy failure', () => {
    expect(
      formatMoodleError({
        exception: 'invalid_parameter_exception',
        errorcode: 'invalidparameter',
        message: 'Invalid parameter value detected',
        debuginfo: 'Passwords must have at least 1 lower case letter(s).',
      }),
    ).toBe(
      'รหัสผ่านไม่ผ่านนโยบายของ Moodle: Passwords must have at least 1 lower case letter(s).',
    );
  });

  it('explains an invalid course category context', () => {
    expect(
      formatMoodleError({
        exception: 'moodle_exception',
        errorcode: 'errorcatcontextnotvalid',
        message:
          'You cannot execute functions in the category context (category id:1). The context error message was: Invalid parameter value detected',
      }),
    ).toBe(
      'หมวดหมู่คอร์สของ Moodle ใช้ไม่ได้: You cannot execute functions in the category context (category id:1). The context error message was: Invalid parameter value detected ตรวจค่า MOODLE_COURSE_CATEGORY_ID',
    );
  });

  it('keeps the raw detail when the cause is not recognized', () => {
    expect(
      formatMoodleError({
        exception: 'moodle_exception',
        errorcode: 'invalidrecord',
        message: 'Can not find data record in database table user.',
        debuginfo: 'User not found: 55',
      }),
    ).toBe(
      'invalidrecord: Can not find data record in database table user. — User not found: 55',
    );
  });
});

describe('isMoodleMissingRecordError', () => {
  it('matches a missing Moodle record', () => {
    expect(
      isMoodleMissingRecordError(
        new Error(
          "invalidrecordunknown: Can't find data record in database.",
        ),
      ),
    ).toBe(true);
  });

  it('does not match other Moodle failures', () => {
    expect(isMoodleMissingRecordError(new Error('moodle down'))).toBe(false);
  });
});
