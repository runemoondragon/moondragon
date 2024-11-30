declare module 'react-datetime-picker' {
  import { ComponentType } from 'react';

  export interface DateTimePickerProps {
    onChange: (value: Date | null) => void;
    value: Date | null;
    className?: string;
    minDate?: Date;
    format?: string;
    required?: boolean;
  }

  const DateTimePicker: ComponentType<DateTimePickerProps>;
  export default DateTimePicker;
} 