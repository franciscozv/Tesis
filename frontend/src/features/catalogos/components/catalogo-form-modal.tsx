'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2 } from 'lucide-react';
import type { ReactNode } from 'react';
import { useEffect, useRef } from 'react';
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
import { cn } from '@/lib/utils';

const PRESET_COLORS = [
  '#3B82F6', '#6366F1', '#8B5CF6', '#A855F7',
  '#EC4899', '#EF4444', '#F97316', '#EAB308',
  '#22C55E', '#14B8A6', '#06B6D4', '#64748B',
];

export interface FieldConfig<T extends FieldValues> {
  name: Path<T>;
  label: string;
  type: 'text' | 'textarea' | 'checkbox' | 'color' | 'custom';
  placeholder?: string;
  description?: string;
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
  serverError?: string | null;
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
  serverError,
}: CatalogoFormModalProps<T>) {
  // Use FieldValues for useForm to avoid generic incompatibility with zodResolver
  const form = useForm({
    // biome-ignore lint/suspicious/noExplicitAny: zodResolver generics incompatible with FieldValues constraint
    resolver: zodResolver(schema as any),
    defaultValues: defaultValues as DefaultValues<FieldValues>,
  });

  const prevServerError = useRef<string | null | undefined>(null);

  useEffect(() => {
    if (open) {
      form.reset(defaultValues as DefaultValues<FieldValues>);
    }
  }, [open, defaultValues, form]);

  useEffect(() => {
    if (serverError && serverError !== prevServerError.current) {
      form.setError('root', { message: serverError });
    }
    prevServerError.current = serverError;
  }, [serverError, form]);

  function handleSubmit(data: FieldValues) {
    form.clearErrors('root');
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
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <FormControl>
                            <Checkbox
                              checked={field.value as boolean}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                          <FormLabel className="!mt-0">{fieldConfig.label}</FormLabel>
                        </div>
                        {fieldConfig.description && (
                          <p className="text-muted-foreground pl-6 text-xs">
                            {fieldConfig.description}
                          </p>
                        )}
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
                            <div className="space-y-3">
                              <div className="grid grid-cols-6 gap-2">
                                {PRESET_COLORS.map((color) => {
                                  const isSelected =
                                    (field.value as string)?.toLowerCase() ===
                                    color.toLowerCase();
                                  return (
                                    <button
                                      key={color}
                                      type="button"
                                      onClick={() => field.onChange(color)}
                                      title={color}
                                      className={cn(
                                        'h-8 w-full rounded-md border-2 transition-all hover:scale-105',
                                        isSelected
                                          ? 'border-foreground shadow-sm scale-105'
                                          : 'border-transparent hover:border-muted-foreground/40',
                                      )}
                                      style={{ backgroundColor: color }}
                                    />
                                  );
                                })}
                              </div>
                              <div className="flex items-center gap-2">
                                <div
                                  className="size-9 shrink-0 rounded-md border"
                                  style={{
                                    backgroundColor: (field.value as string) || '#3B82F6',
                                  }}
                                />
                                <Input
                                  {...field}
                                  value={(field.value as string) ?? ''}
                                  placeholder={fieldConfig.placeholder ?? '#3B82F6'}
                                  className="flex-1 font-mono text-sm"
                                  onChange={(e) => field.onChange(e.target.value)}
                                />
                              </div>
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
            {form.formState.errors.root && (
              <p className="text-destructive text-sm">{form.formState.errors.root.message}</p>
            )}
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
