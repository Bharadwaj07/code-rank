import { ClassConstructor, plainToInstance } from 'class-transformer';
import { validateSync } from 'class-validator';

export function validateClass<T>(
  cls: ClassConstructor<T>,
  input: unknown,
): T {
  const instance = plainToInstance(cls, input, {
    enableImplicitConversion: true,
  });

  const errors = validateSync(instance as object, {
    skipMissingProperties: false,
    forbidUnknownValues: true,
  });

  if (errors.length > 0) {
    throw new Error(
      errors
        .flatMap(e => Object.values(e.constraints ?? {}))
        .join('\n'),
    );
  }

  return instance;
}

