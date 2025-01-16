import { type Dispatch, type SetStateAction, type ChangeEvent } from 'react';
import { type Timer } from '~/types/handle';

export const createDelayedValidator = (
  onChange: Dispatch<SetStateAction<string>>,
  setIsInvalid: Dispatch<SetStateAction<boolean>>,
  setIsChecking: Dispatch<SetStateAction<boolean>>,
  regex: RegExp,
  delay = 2000
) => {
  let timer: Timer | undefined;
  return (event: ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value.toLowerCase();
    onChange(value);
    setIsChecking(true);

    clearTimeout(timer);

    timer = setTimeout(() => {
      if (value.length > 0 && !value.match(regex)) {
        setIsInvalid(true);
        setIsChecking(false);
      } else {
        setIsInvalid(false);
      }
    }, delay);
  };
}; 