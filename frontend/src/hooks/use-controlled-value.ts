import { Dispatch, SetStateAction, useState } from 'react';

export type Setter<T> = Dispatch<SetStateAction<T>>;

export type ControlledValue<T> = {
  controlled?: T;
  setControlled?: (value: T) => void;
  onControlledChange?: (val: T) => void;
}

type UseControlledValueOptions<T> = {
  defaultValue: T;
  value?: T;
  setter?: (value: T) => void;
  onControlledChange?: (val: T) => void;
};

export function useControlledValue<T>(
  options: UseControlledValueOptions<T>
): [T, Setter<T>, (val: T) => void] {
  const [uncontrolled, setUnconrolled] = useState<T>(options.defaultValue);

  return [
    typeof options.value != 'undefined' ? options.value : uncontrolled,
    (typeof options.setter != 'undefined'
      ? options.setter
      : setUnconrolled) as Setter<T>,
    typeof options.onControlledChange != 'undefined'
      ? options.onControlledChange
      : () => null,
  ];
}
