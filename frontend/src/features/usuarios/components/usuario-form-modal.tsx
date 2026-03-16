'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import {
  Check,
  CheckCircle2,
  ChevronsUpDown,
  Copy,
  Eye,
  EyeOff,
  Loader2,
  RefreshCw,
  Search,
} from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import { Button } from '@/components/ui/button';
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
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { Miembro } from '@/features/miembros/types';
import { cn } from '@/lib/utils';
import {
  type CreateUsuarioFormData,
  createUsuarioSchema,
  type UpdateUsuarioFormData,
  updateUsuarioSchema,
} from '../schemas';
import type { Usuario } from '../types';

function generatePassword(length = 12): string {
  const chars = 'abcdefghijkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789!@#$%';
  const values = crypto.getRandomValues(new Uint8Array(length));
  return Array.from(values)
    .map((b) => chars[b % chars.length])
    .join('');
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  function handleCopy() {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }
  return (
    <Button type="button" variant="ghost" size="icon-sm" onClick={handleCopy}>
      {copied ? <Check className="size-4 text-success-foreground" /> : <Copy className="size-4" />}
    </Button>
  );
}

export interface SuccessCredentials {
  email: string;
  password: string;
}

interface UsuarioFormModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editing: Usuario | null;
  miembros: Miembro[] | undefined;
  usuarios: Usuario[] | undefined;
  isPending: boolean;
  onCreateSubmit: (data: CreateUsuarioFormData) => void;
  onUpdateSubmit: (data: UpdateUsuarioFormData) => void;
  serverError?: string | null;
  successCredentials?: SuccessCredentials | null;
}

export function UsuarioFormModal({
  open,
  onOpenChange,
  editing,
  miembros,
  usuarios,
  isPending,
  onCreateSubmit,
  onUpdateSubmit,
  serverError,
  successCredentials,
}: UsuarioFormModalProps) {
  const isEditing = !!editing;
  const [showPassword, setShowPassword] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [openCombobox, setOpenCombobox] = useState(false);

  const form = useForm<CreateUsuarioFormData>({
    // biome-ignore lint/suspicious/noExplicitAny: z.coerce creates input type mismatch with zodResolver
    resolver: zodResolver(isEditing ? updateUsuarioSchema : createUsuarioSchema) as any,
    defaultValues: { email: '', password: '', rol: 'usuario', miembro_id: 0 },
  });

  const prevServerError = useRef<string | null | undefined>(null);

  useEffect(() => {
    if (open) {
      setShowPassword(false);
      setSearchTerm('');
      setOpenCombobox(false);
      if (editing) {
        form.reset({
          email: editing.email,
          password: '',
          rol: editing.rol,
          miembro_id: editing.miembro_id ?? 0,
        });
      } else {
        form.reset({ email: '', password: generatePassword(), rol: 'usuario', miembro_id: 0 });
      }
    }
  }, [open, editing, form]);

  useEffect(() => {
    if (serverError && serverError !== prevServerError.current) {
      form.setError('email', { message: serverError });
    }
    prevServerError.current = serverError;
  }, [serverError, form]);

  // IDs de miembros ya asignados a otro usuario (excluye el actual al editar)
  const takenMiembroIds = new Set(
    (usuarios ?? [])
      .filter((u) => u.miembro_id !== null && u.miembro_id !== editing?.miembro_id)
      .map((u) => u.miembro_id as number),
  );

  const miembrosDisponibles = (miembros ?? []).filter((m) => m.activo && !takenMiembroIds.has(m.id));

  const miembrosFiltrados = miembrosDisponibles.filter((m) => {
    if (!searchTerm) return true;
    return `${m.nombre} ${m.apellido}`.toLowerCase().includes(searchTerm.toLowerCase());
  });

  const selectedMiembroId = form.watch('miembro_id');
  const selectedMiembro = miembrosDisponibles.find((m) => m.id === selectedMiembroId);

  function onSubmit(data: CreateUsuarioFormData) {
    if (isEditing) {
      onUpdateSubmit({ email: data.email, rol: data.rol });
    } else {
      onCreateSubmit({ email: data.email, password: data.password, rol: data.rol, miembro_id: data.miembro_id });
    }
  }

  // ── Vista de éxito con credenciales ─────────────────────────────────────────
  if (successCredentials) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CheckCircle2 className="size-5 text-success-foreground" />
              Usuario creado exitosamente
            </DialogTitle>
            <DialogDescription>
              Comparte estas credenciales con el usuario. La contraseña no se mostrará nuevamente.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-3">
            <div className="rounded-lg border bg-muted/40 p-4 grid gap-4">
              <div className="grid gap-1.5">
                <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  Email
                </span>
                <div className="flex items-center gap-2">
                  <code className="flex-1 text-sm font-mono bg-background border rounded px-3 py-2 truncate">
                    {successCredentials.email}
                  </code>
                  <CopyButton text={successCredentials.email} />
                </div>
              </div>
              <div className="grid gap-1.5">
                <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  Contraseña temporal
                </span>
                <div className="flex items-center gap-2">
                  <code className="flex-1 text-sm font-mono bg-background border rounded px-3 py-2 tracking-widest">
                    {successCredentials.password}
                  </code>
                  <CopyButton text={successCredentials.password} />
                </div>
              </div>
            </div>
            <p className="text-xs text-muted-foreground">
              Se recomienda que el usuario cambie su contraseña al ingresar por primera vez.
            </p>
          </div>
          <div className="flex justify-end">
            <Button onClick={() => onOpenChange(false)}>Cerrar</Button>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  // ── Formulario ───────────────────────────────────────────────────────────────
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isEditing ? 'Editar Usuario' : 'Nuevo Usuario'}</DialogTitle>
          <DialogDescription>
            {isEditing
              ? 'Modifique el email o rol del usuario.'
              : 'Complete los datos para crear un nuevo usuario.'}
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-4">
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email *</FormLabel>
                  <FormControl>
                    <Input type="email" placeholder="usuario@iglesia.cl" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {!isEditing && (
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Contraseña temporal *</FormLabel>
                    <FormControl>
                      <div className="flex gap-2">
                        <div className="relative flex-1">
                          <Input
                            type={showPassword ? 'text' : 'password'}
                            placeholder="Mínimo 8 caracteres"
                            className="pr-10"
                            {...field}
                          />
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon-sm"
                            className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7"
                            tabIndex={-1}
                            onClick={() => setShowPassword((v) => !v)}
                          >
                            {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                          </Button>
                        </div>
                        <Button
                          type="button"
                          variant="outline"
                          size="icon"
                          title="Generar contraseña aleatoria"
                          onClick={() => {
                            form.setValue('password', generatePassword(), { shouldValidate: true });
                            setShowPassword(true);
                          }}
                        >
                          <RefreshCw className="size-4" />
                        </Button>
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            <FormField
              control={form.control}
              name="rol"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Rol *</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccionar rol" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="administrador">
                        <div className="flex flex-col gap-0.5">
                          <span>Administrador</span>
                          <span className="text-xs text-muted-foreground font-normal">
                            Acceso total al sistema
                          </span>
                        </div>
                      </SelectItem>
                      <SelectItem value="usuario">
                        <div className="flex flex-col gap-0.5">
                          <span>Usuario</span>
                          <span className="text-xs text-muted-foreground font-normal">
                            Acceso según grupos asignados
                          </span>
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {!isEditing && (
              <FormField
                control={form.control}
                name="miembro_id"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Miembro vinculado *</FormLabel>
                    <Popover open={openCombobox} onOpenChange={setOpenCombobox}>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant="outline"
                            role="combobox"
                            aria-expanded={openCombobox}
                            className={cn(
                              'w-full justify-between font-normal',
                              !field.value && 'text-muted-foreground',
                            )}
                          >
                            {field.value && selectedMiembro
                              ? `${selectedMiembro.nombre} ${selectedMiembro.apellido}`
                              : 'Seleccionar miembro'}
                            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent
                        className="w-[var(--radix-popover-trigger-width)] p-0"
                        align="start"
                      >
                        <div className="flex items-center border-b px-3">
                          <Search className="mr-2 h-4 w-4 shrink-0 opacity-50" />
                          <Input
                            placeholder="Buscar por nombre..."
                            className="flex h-10 w-full rounded-md bg-transparent py-3 text-sm outline-none border-none focus-visible:ring-0"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                          />
                        </div>
                        <div className="max-h-[240px] overflow-y-auto p-1">
                          {miembrosFiltrados.length === 0 ? (
                            <div className="py-6 text-center text-sm text-muted-foreground">
                              No se encontraron miembros disponibles.
                            </div>
                          ) : (
                            miembrosFiltrados.map((m) => (
                              <div
                                key={m.id}
                                className={cn(
                                  'relative flex cursor-pointer select-none items-center rounded-sm px-2 py-2 text-sm hover:bg-accent hover:text-accent-foreground',
                                  field.value === m.id && 'bg-accent',
                                )}
                                onClick={() => {
                                  form.setValue('miembro_id', m.id);
                                  setOpenCombobox(false);
                                  setSearchTerm('');
                                }}
                              >
                                <Check
                                  className={cn(
                                    'mr-2 h-4 w-4',
                                    field.value === m.id ? 'opacity-100' : 'opacity-0',
                                  )}
                                />
                                <span className="font-medium">
                                  {m.nombre} {m.apellido}
                                </span>
                              </div>
                            ))
                          )}
                        </div>
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={isPending}>
                {isPending && <Loader2 className="animate-spin" />}
                {isEditing ? 'Guardar Cambios' : 'Crear Usuario'}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
