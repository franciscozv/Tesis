'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2 } from 'lucide-react';
import type { ReactNode } from 'react';
import { useEffect } from 'react';
import { type DefaultValues, type FieldValues, type Path, useForm } from 'react-hook-form';
import type { ZodType } from 'zod';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';

export interface FieldConfig<T extends FieldValues> {
  name: Path<T>;
  label: string;
  type: 'text' | 'textarea' | 'checkbox' | 'color' | 'custom';
  placeholder?: string;
  customRender?: (field: { value: unknown; onChange: (v: unknown) => void }) => ReactNode;
}

interface CatalogoFormModalProps<T extends FieldValues> {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  // biome-ignore lint/suspicious/noExplicitAny: zodResolver generics incompatible with FieldValues constraint
  schema: ZodType<any>;
  fields: FieldConfig<T>[];
  defaultValues: DefaultValues<T>;
  onSubmit: (data: T) => void;
  isPending: boolean;
}

export function CatalogoFormModal<T extends FieldValues>({
  open,
  onOpenChange,
  title,
  description,
  schema,
  fields,
  defaultValues,
  onSubmit,
  isPending,
}: CatalogoFormModalProps<T>) {
  // Use FieldValues for useForm to avoid generic incompatibility with zodResolver
  const form = useForm({
    // biome-ignore lint/suspicious/noExplicitAny: zodResolver generics incompatible with FieldValues constraint
    resolver: zodResolver(schema as any),
    defaultValues: defaultValues as DefaultValues<FieldValues>,
  });

  useEffect(() => {
    if (open) {
      form.reset(defaultValues as DefaultValues<FieldValues>);
    }
  }, [open, defaultValues, form]);

  function handleSubmit(data: FieldValues) {
    onSubmit(data as T);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          {description && <DialogDescription>{description}</DialogDescription>}
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="grid gap-4">
            {fields.map((fieldConfig) => (
              <FormField
                key={fieldConfig.name}
                control={form.control}
                name={fieldConfig.name as string}
                render={({ field }) => (
                  <FormItem>
                    {fieldConfig.type === 'checkbox' ? (
                      <div className="flex items-center gap-2">
                        <FormControl>
                          <Checkbox
                            checked={field.value as boolean}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                        <FormLabel className="!mt-0">{fieldConfig.label}</FormLabel>
                      </div>
                    ) : (
                      <>
                        <FormLabel>{fieldConfig.label}</FormLabel>
                        <FormControl>
                          {fieldConfig.type === 'textarea' ? (
                            <Textarea
                              {...field}
                              value={(field.value as string) ?? ''}
                              placeholder={fieldConfig.placeholder}
                            />
                          ) : fieldConfig.type === 'color' ? (
                            <div className="flex gap-2">
                              <Input
                                {...field}
                                value={(field.value as string) ?? ''}
                                placeholder={fieldConfig.placeholder ?? '#3B82F6'}
                                className="flex-1"
                              />
                              <input
                                type="color"
                                value={(field.value as string) || '#000000'}
                                onChange={(e) => field.onChange(e.target.value)}
                                className="h-9 w-9 cursor-pointer rounded border p-0.5"
                              />
                            </div>
                          ) : fieldConfig.type === 'custom' && fieldConfig.customRender ? (
                            fieldConfig.customRender(field)
                          ) : (
                            <Input
                              {...field}
                              value={(field.value as string) ?? ''}
                              placeholder={fieldConfig.placeholder}
                            />
                          )}
                        </FormControl>
                      </>
                    )}
                    <FormMessage />
                  </FormItem>
                )}
              />
            ))}
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={isPending}>
                {isPending && <Loader2 className="animate-spin" />}
                Guardar
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
