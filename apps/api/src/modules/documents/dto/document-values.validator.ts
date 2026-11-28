import { registerDecorator, ValidationOptions } from 'class-validator';
import { DOCUMENT_FIELDS, DOCUMENT_LIMITS } from '../document.constants';

const FIELDS: ReadonlySet<string> = new Set(DOCUMENT_FIELDS);

/** Un objeto cuyas claves son datos conocidos y cuyos valores son textos acotados. */
export function isDocumentValues(value: unknown): boolean {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    return false;
  }
  return Object.entries(value).every(
    ([key, text]) =>
      FIELDS.has(key) &&
      typeof text === 'string' &&
      text.length <= DOCUMENT_LIMITS.text,
  );
}

export function IsDocumentValues(options?: ValidationOptions) {
  return (object: object, propertyName: string) =>
    registerDecorator({
      name: 'isDocumentValues',
      target: object.constructor,
      propertyName,
      options: {
        message:
          'values solo admite los datos conocidos del documento, como texto.',
        ...options,
      },
      validator: { validate: isDocumentValues },
    });
}
