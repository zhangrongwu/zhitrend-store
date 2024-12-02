import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

interface FormProps<T extends z.ZodType> {
  schema: T;
  onSubmit: (data: z.infer<T>) => void;
  defaultValues?: Partial<z.infer<T>>;
  children: (methods: {
    register: ReturnType<typeof useForm>['register'];
    errors: Record<string, any>;
    isSubmitting: boolean;
  }) => React.ReactNode;
}

export default function Form<T extends z.ZodType>({
  schema,
  onSubmit,
  defaultValues,
  children,
}: FormProps<T>) {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(schema),
    defaultValues,
  });

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      {children({ register, errors, isSubmitting })}
    </form>
  );
} 