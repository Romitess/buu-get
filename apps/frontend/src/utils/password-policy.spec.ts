import { describe, expect, it } from 'vitest';
import { evaluatePasswordPolicy, isPasswordPolicyMet } from './password-policy';

describe('password policy', () => {
  it('accepts a password that meets every rule', () => {
    expect(isPasswordPolicyMet('Secret1!')).toBe(true);
  });

  it('rejects a password that is only long enough', () => {
    expect(evaluatePasswordPolicy('password')).toEqual({
      minLength: true,
      uppercase: false,
      digit: false,
      special: false,
    });
    expect(isPasswordPolicyMet('password')).toBe(false);
  });

  it('accepts ! @ # $ % & * ( ) _ + as special characters', () => {
    for (const character of ['!', '@', '#', '$', '%', '&', '*', '(', ')', '_', '+']) {
      expect(isPasswordPolicyMet(`Secret1${character}`)).toBe(true);
    }
    expect(isPasswordPolicyMet('Secret1-')).toBe(false);
  });
});