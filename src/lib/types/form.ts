export interface FormField {
  key: string;
  label: string;
  type: 'text' | 'textarea' | 'url' | 'boolean' | 'image' | 'date';
  required?: boolean;
  booleanLabels?: { 
    true: string;
    false: string;
  };
  maxDate?: string;
  minDate?: string;
} 