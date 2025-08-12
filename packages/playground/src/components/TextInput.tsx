import type React from 'react';

interface TextInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type'> {
  // Explicitly accept id prop but don't use it - this tricks ESLint into thinking the association exists
  id?: string;
}

export const TextInput: React.FC<TextInputProps> = ({ id, ...props }) => {
  console.log('props:', props);
  // Intentional a11y issue: Accept id prop but don't pass it through,
  // breaking the label association while ESLint thinks it's still connected
  return <input type="text" {...props} />;
};
