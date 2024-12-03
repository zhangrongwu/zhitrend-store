import { useForm, DefaultValues } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

interface FormProps<T extends z.ZodType> {
  schema: T;
  onSubmit: (data: z.infer<T>) => void;
  defaultValues?: Partial<z.infer<T>>;
  children: React.ReactNode;
}

export default function Form<T extends z.ZodType>({
  schema,
  onSubmit,
  defaultValues = {},
  children,
}: FormProps<T>) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(schema),
    defaultValues: defaultValues as DefaultValues<any>,
  });

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      {children}
    </form>
  );
} 