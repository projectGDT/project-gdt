import { ValidationResult } from './components/ValidatorTextField.tsx';

export function validator(validator: (value: string) => boolean | Promise<boolean>, hint: string) {
  return { validator, hint };
}

export function inOrder(
  ...criteria: {
    validator: (value: string) => boolean | Promise<boolean>;
    hint: string;
  }[]
): (input: string) => Promise<ValidationResult> {
  return async (input): Promise<ValidationResult> => {
    for (const { validator, hint } of criteria) {
      const isValid = await validator(input);
      if (!isValid) return { isValid, hint };
    }
    return { isValid: true };
  };
}
