export interface PasswordPolicyState {
  minLength: boolean;
  uppercase: boolean;
  digit: boolean;
  special: boolean;
}

/** เงื่อนไขรหัสผ่านผู้สมัครสอบ: ยาวอย่างน้อย 8, ตัวพิมพ์ใหญ่, ตัวเลข, และอักขระ ! @ # $ % & * ( ) _ + */
export function evaluatePasswordPolicy(password: string): PasswordPolicyState {
  return {
    minLength: password.length >= 8,
    uppercase: /[A-Z]/u.test(password),
    digit: /\d/u.test(password),
    special: /[!@#$%&*()_+]/u.test(password),
  };
}

export function isPasswordPolicyMet(password: string): boolean {
  const state = evaluatePasswordPolicy(password);
  return state.minLength && state.uppercase && state.digit && state.special;
}
