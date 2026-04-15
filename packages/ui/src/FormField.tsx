import {
  cloneElement,
  isValidElement,
  useId,
  type ReactElement,
  type ReactNode,
} from 'react';
import { cn } from './cn';

export type FormFieldProps = {
  label: ReactNode;
  htmlFor?: string;
  help?: ReactNode;
  error?: ReactNode;
  required?: boolean;
  children: ReactNode;
  className?: string;
};

type ChildProps = {
  id?: string;
  'aria-invalid'?: boolean | 'true' | 'false';
  'aria-describedby'?: string;
  'aria-required'?: boolean | 'true' | 'false';
  invalid?: boolean;
};

export function FormField({
  label,
  htmlFor,
  help,
  error,
  required,
  children,
  className,
}: FormFieldProps) {
  const generatedId = useId();
  const id = htmlFor ?? generatedId;
  const helpId = `${id}-help`;
  const errorId = `${id}-error`;
  const describedBy = error ? errorId : help ? helpId : undefined;

  let controlNode: ReactNode = children;
  if (isValidElement(children)) {
    const element = children as ReactElement<ChildProps>;
    const existingDescribedBy = element.props['aria-describedby'];
    const mergedDescribedBy = [existingDescribedBy, describedBy]
      .filter(Boolean)
      .join(' ') || undefined;
    controlNode = cloneElement(element, {
      id: element.props.id ?? id,
      'aria-describedby': mergedDescribedBy,
      'aria-invalid': error ? true : element.props['aria-invalid'],
      'aria-required': required ? true : element.props['aria-required'],
      invalid: error ? true : element.props.invalid,
    });
  }

  return (
    <div className={cn('flex flex-col gap-2', className)}>
      <label htmlFor={id} className="text-small text-charcoal">
        {label}
        {required ? (
          <span className="ms-1 text-rust" aria-hidden>
            *
          </span>
        ) : null}
      </label>
      {controlNode}
      {error ? (
        <p id={errorId} role="alert" className="text-small text-rust">
          {error}
        </p>
      ) : help ? (
        <p id={helpId} className="text-small text-stone">
          {help}
        </p>
      ) : null}
    </div>
  );
}
