import { ButtonHTMLAttributes, PropsWithChildren } from 'react';

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'primary' | 'secondary';
};

export const Button = ({ children, variant = 'primary', ...props }: PropsWithChildren<ButtonProps>) => {
  return (
    <button {...props} className={`btn btn-${variant}`}>
      {children}
    </button>
  );
};
