'use client';

import { Plus } from 'lucide-react';
import { useState } from 'react';
import type { DefaultValues, FieldValues } from 'react-hook-form';
import { toast } from 'sonner';
import type { z } from 'zod';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/features/auth/hooks/use-auth';
import {
  CatalogoFormModal,
  type FieldConfig,
} from '@/features/catalogos/components/catalogo-form-modal';
import {
  ActiveBadge,
  BooleanBadge,
  CatalogoTable,
  ColorCell,
  type ColumnConfig,
} from '@/features/catalogos/components/catalogo-table';
import {
  responsabilidadesActividadHooks,
  rolesGrupoHooks,
  tiposActividadHooks,
  tiposNecesidadHooks,
} from '@/features/catalogos/hooks';
import {
  createResponsabilidadActividadSchema,
  createRolGrupoSchema,
  createTipoActividadSchema,
  createTipoNecesidadSchema,
} from '@/features/catalogos/schemas';
import type {
  ResponsabilidadActividad,
  RolGrupo,
  TipoActividad,
  TipoNecesidad,
} from '@/features/catalogos/types';

// =============================================================================
// Generic catalog tab logic
// =============================================================================

// biome-ignore lint/suspicious/noExplicitAny: generic mutation callback
type MutateFn = (...args: any[]) => void;

interface UseCatalogoTabOptions<T, TForm extends FieldValues> {
  hooks: {
    useAll: () => { data: T[] | undefined; isLoading: boolean };
    useCreate: () => { mutate: MutateFn; isPending: boolean };
    useUpdate: () => { mutate: MutateFn; isPending: boolean };
    useDelete: () => { mutate: MutateFn; isPending: boolean };
    useToggleEstado: () => { mutate: MutateFn; isPending: boolean };
  };
  schema: z.ZodType<TForm>;
  getId: (item: T) => number;
  toDefaults: (item: T | null) => DefaultValues<TForm>;
  entityName: string;
}

function useCatalogoTab<T, TForm extends FieldValues>(opts: UseCatalogoTabOptions<T, TForm>) {
  const { data, isLoading } = opts.hooks.useAll();
  const createMutation = opts.hooks.useCreate();
  const updateMutation = opts.hooks.useUpdate();
  const deleteMutation = opts.hooks.useDelete();
  const toggleMutation = opts.hooks.useToggleEstado();

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<T | null>(null);
  const [deleting, setDeleting] = useState<T | null>(null);
  const [toggling, setToggling] = useState<T | null>(null);
  const [serverError, setServerError] = useState<string | null>(null);

  function openCreate() {
    setEditing(null);
    setServerError(null);
    setModalOpen(true);
  }

  function openEdit(item: T) {
    setEditing(item);
    setServerError(null);
    setModalOpen(true);
  }

  // biome-ignore lint/suspicious/noExplicitAny: Axios error shape
  function extractApiMessage(error: any, fallback: string): string {
    return error?.response?.data?.message ?? fallback;
  }

  function handleSubmit(formData: TForm) {
    setServerError(null);
    if (editing) {
      updateMutation.mutate({ id: opts.getId(editing), input: formData } as never, {
        onSuccess: () => {
          toast.success(`${opts.entityName} actualizado`);
          setModalOpen(false);
        },
        onError: (error) => {
          const msg = extractApiMessage(error, `Error al actualizar ${opts.entityName.toLowerCase()}`);
          setServerError(msg);
        },
      });
    } else {
      createMutation.mutate(formData as never, {
        onSuccess: () => {
          toast.success(`${opts.entityName} creado`);
          setModalOpen(false);
        },
        onError: (error) => {
          const msg = extractApiMessage(error, `Error al crear ${opts.entityName.toLowerCase()}`);
          setServerError(msg);
        },
      });
    }
  }

  function handleDelete() {
    if (!deleting) return;
    deleteMutation.mutate(opts.getId(deleting) as never, {
      onSuccess: () => {
        toast.success(`${opts.entityName} eliminado`);
        setDeleting(null);
      },
      onError: () => toast.error(`Error al eliminar ${opts.entityName.toLowerCase()}`),
    });
  }

  function handleToggle() {
    if (!toggling) return;
    toggleMutation.mutate(opts.getId(toggling) as never, {
      onSuccess: () => {
        const activo = (toggling as Record<string, unknown>).activo;
        toast.success(`${opts.entityName} ${activo ? 'desactivado' : 'activado'} exitosamente`);
        setToggling(null);
      },
      onError: () => toast.error(`Error al cambiar estado de ${opts.entityName.toLowerCase()}`),
    });
  }

  return {
    data,
    isLoading,
    modalOpen,
    setModalOpen,
    editing,
    deleting,
    setDeleting,
    toggling,
    setToggling,
    openCreate,
    openEdit,
    handleSubmit,
    handleDelete,
    handleToggle,
    isPending: createMutation.isPending || updateMutation.isPending,
    isDeleting: deleteMutation.isPending,
    isToggling: toggleMutation.isPending,
    schema: opts.schema,
    defaults: opts.toDefaults(editing),
    serverError,
  };
}

// =============================================================================
// Tab: Roles Grupo
// =============================================================================

function RolesGrupoTab({ isAdmin }: { isAdmin: boolean }) {
  const tab = useCatalogoTab<RolGrupo, z.infer<typeof createRolGrupoSchema>>({
    hooks: rolesGrupoHooks,
    schema: createRolGrupoSchema,
    getId: (r) => r.id_rol_grupo,
    toDefaults: (r) => ({
      nombre: r?.nombre ?? '',
      requiere_plena_comunion: r?.requiere_plena_comunion ?? true,
      es_unico: r?.es_unico ?? false,
      es_directiva: r?.es_directiva ?? false,
    }),
    entityName: 'Rol de grupo',
  });

  const columns: ColumnConfig<RolGrupo>[] = [
    { key: 'nombre', header: 'Nombre' },
    {
      key: 'es_directiva',
      header: 'Directiva',
      render: (r) => <BooleanBadge value={r.es_directiva} trueLabel="Sí" falseLabel="No" />,
    },
    {
      key: 'es_unico',
      header: 'Único',
      render: (r) => <BooleanBadge value={r.es_unico} trueLabel="Sí" falseLabel="No" />,
    },
    {
      key: 'requiere_plena_comunion',
      header: 'Requiere plena comunión',
      render: (r) => (
        <BooleanBadge value={r.requiere_plena_comunion} trueLabel="Sí" falseLabel="No" />
      ),
    },
    { key: 'activo', header: 'Estado', render: (r) => <ActiveBadge activo={r.activo} /> },
  ];

  const fields: FieldConfig<z.infer<typeof createRolGrupoSchema>>[] = [
    { name: 'nombre', label: 'Nombre', type: 'text', placeholder: 'Ej: Secretario' },
    {
      name: 'es_directiva',
      label: 'Cargo de directiva',
      type: 'checkbox',
      description:
        'Los miembros con este rol tienen privilegios de gestión sobre el grupo (actividades, invitados, etc.)',
    },
    {
      name: 'es_unico',
      label: 'Cargo único',
      type: 'checkbox',
      description: 'Solo puede haber un titular activo con este cargo por grupo',
    },
    { name: 'requiere_plena_comunion', label: 'Requiere plena comunión', type: 'checkbox' },
  ];

  return (
    <CatalogoTabContent
      tab={tab}
      columns={columns}
      fields={fields}
      idKey="id_rol_grupo"
      isAdmin={isAdmin}
      entityName="Rol de grupo"
    />
  );
}

// =============================================================================
// Tab: Roles Actividad
// =============================================================================

function RolesActividadTab({ isAdmin }: { isAdmin: boolean }) {
  const tab = useCatalogoTab<
    ResponsabilidadActividad,
    z.infer<typeof createResponsabilidadActividadSchema>
  >({
    hooks: responsabilidadesActividadHooks,
    schema: createResponsabilidadActividadSchema,
    getId: (r) => r.id_responsabilidad,
    toDefaults: (r) => ({
      nombre: r?.nombre ?? '',
      descripcion: r?.descripcion ?? '',
    }),
    entityName: 'Rol de actividad',
  });

  const columns: ColumnConfig<ResponsabilidadActividad>[] = [
    { key: 'nombre', header: 'Nombre' },
    { key: 'descripcion', header: 'Descripción', render: (r) => r.descripcion ?? '—' },
    { key: 'activo', header: 'Estado', render: (r) => <ActiveBadge activo={r.activo} /> },
  ];

  const fields: FieldConfig<z.infer<typeof createResponsabilidadActividadSchema>>[] = [
    { name: 'nombre', label: 'Nombre', type: 'text', placeholder: 'Ej: Predicador' },
    { name: 'descripcion', label: 'Descripción', type: 'textarea', placeholder: 'Opcional' },
  ];

  return (
    <CatalogoTabContent
      tab={tab}
      columns={columns}
      fields={fields}
      idKey="id_responsabilidad"
      isAdmin={isAdmin}
      entityName="Rol de actividad"
    />
  );
}

// =============================================================================
// Tab: Tipos Actividad
// =============================================================================

function TiposActividadTab({ isAdmin }: { isAdmin: boolean }) {
  const tab = useCatalogoTab<TipoActividad, z.infer<typeof createTipoActividadSchema>>({
    hooks: tiposActividadHooks,
    schema: createTipoActividadSchema,
    getId: (r) => r.id_tipo,
    toDefaults: (r) => ({
      nombre: r?.nombre ?? '',
      descripcion: r?.descripcion ?? '',
      color: r?.color ?? '#3B82F6',
    }),
    entityName: 'Tipo de actividad',
  });

  const columns: ColumnConfig<TipoActividad>[] = [
    { key: 'nombre', header: 'Nombre' },
    { key: 'descripcion', header: 'Descripción', render: (r) => r.descripcion ?? '—' },
    { key: 'color', header: 'Color', render: (r) => <ColorCell color={r.color} /> },
    { key: 'activo', header: 'Estado', render: (r) => <ActiveBadge activo={r.activo} /> },
  ];

  const fields: FieldConfig<z.infer<typeof createTipoActividadSchema>>[] = [
    { name: 'nombre', label: 'Nombre', type: 'text', placeholder: 'Ej: Culto' },
    { name: 'descripcion', label: 'Descripción', type: 'textarea', placeholder: 'Opcional' },
    { name: 'color', label: 'Color', type: 'color', placeholder: '#3B82F6' },
  ];

  return (
    <CatalogoTabContent
      tab={tab}
      columns={columns}
      fields={fields}
      idKey="id_tipo"
      isAdmin={isAdmin}
      entityName="Tipo de actividad"
    />
  );
}

// =============================================================================
// Tab: Tipos Necesidad
// =============================================================================

function TiposNecesidadTab({ isAdmin }: { isAdmin: boolean }) {
  const tab = useCatalogoTab<TipoNecesidad, z.infer<typeof createTipoNecesidadSchema>>({
    hooks: tiposNecesidadHooks,
    schema: createTipoNecesidadSchema,
    getId: (r) => r.id_tipo,
    toDefaults: (r) => ({
      nombre: r?.nombre ?? '',
      descripcion: r?.descripcion ?? '',
    }),
    entityName: 'Tipo de necesidad',
  });

  const columns: ColumnConfig<TipoNecesidad>[] = [
    { key: 'nombre', header: 'Nombre' },
    { key: 'descripcion', header: 'Descripción', render: (r) => r.descripcion ?? '—' },
    { key: 'activo', header: 'Estado', render: (r) => <ActiveBadge activo={r.activo} /> },
  ];

  const fields: FieldConfig<z.infer<typeof createTipoNecesidadSchema>>[] = [
    { name: 'nombre', label: 'Nombre', type: 'text', placeholder: 'Ej: Transporte' },
    { name: 'descripcion', label: 'Descripción', type: 'textarea', placeholder: 'Opcional' },
  ];

  return (
    <CatalogoTabContent
      tab={tab}
      columns={columns}
      fields={fields}
      idKey="id_tipo"
      isAdmin={isAdmin}
      entityName="Tipo de necesidad"
    />
  );
}

// =============================================================================
// Shared tab content layout
// =============================================================================

interface CatalogoTabContentProps<T, TForm extends FieldValues> {
  tab: ReturnType<typeof useCatalogoTab<T, TForm>>;
  columns: ColumnConfig<T>[];
  fields: FieldConfig<TForm>[];
  idKey: keyof T;
  isAdmin: boolean;
  entityName: string;
}

function CatalogoTabContent<T, TForm extends FieldValues>({
  tab,
  columns,
  fields,
  idKey,
  isAdmin,
  entityName,
}: CatalogoTabContentProps<T, TForm>) {
  return (
    <>
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-lg font-medium">{entityName}s</h3>
        {isAdmin && (
          <Button size="sm" onClick={tab.openCreate}>
            <Plus className="mr-1 h-4 w-4" />
            Agregar
          </Button>
        )}
      </div>

      <CatalogoTable
        items={tab.data}
        columns={columns}
        idKey={idKey}
        isLoading={tab.isLoading}
        isAdmin={isAdmin}
        onEdit={tab.openEdit}
        onDelete={tab.setDeleting}
        onToggleEstado={tab.setToggling}
      />

      <CatalogoFormModal
        open={tab.modalOpen}
        onOpenChange={tab.setModalOpen}
        title={tab.editing ? `Editar ${entityName}` : `Crear ${entityName}`}
        schema={tab.schema}
        fields={fields}
        defaultValues={tab.defaults}
        onSubmit={tab.handleSubmit}
        isPending={tab.isPending}
        serverError={tab.serverError}
      />

      <AlertDialog open={!!tab.deleting} onOpenChange={(open) => !open && tab.setDeleting(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Eliminar {entityName.toLowerCase()}</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. El registro se desactivará.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={tab.handleDelete} disabled={tab.isDeleting}>
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={!!tab.toggling} onOpenChange={(open) => !open && tab.setToggling(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {(tab.toggling as Record<string, unknown> | null)?.activo
                ? `Desactivar ${entityName.toLowerCase()}`
                : `Activar ${entityName.toLowerCase()}`}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {(tab.toggling as Record<string, unknown> | null)?.activo
                ? `¿Está seguro de desactivar este registro? No estará disponible para su uso.`
                : `¿Activar este registro? Volverá a estar disponible para su uso.`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={tab.handleToggle} disabled={tab.isToggling}>
              {(tab.toggling as Record<string, unknown> | null)?.activo ? 'Desactivar' : 'Activar'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

// =============================================================================
// Page
// =============================================================================

export default function ConfiguracionPage() {
  const { usuario } = useAuth();
  const isAdmin = usuario?.rol === 'administrador';

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Configuración</h1>
        <p className="text-muted-foreground">Gestiona los catálogos del sistema.</p>
      </div>

      <Tabs defaultValue="roles-grupo">
        <TabsList>
          <TabsTrigger value="roles-grupo">Roles de Grupo</TabsTrigger>
          <TabsTrigger value="responsabilidades-actividad">
            Responsabilidades de Actividad
          </TabsTrigger>
          <TabsTrigger value="tipos-actividad">Tipos de Actividad</TabsTrigger>
          <TabsTrigger value="tipos-necesidad">Tipos de Necesidad</TabsTrigger>
        </TabsList>

        <TabsContent value="roles-grupo" className="mt-4">
          <RolesGrupoTab isAdmin={isAdmin} />
        </TabsContent>

        <TabsContent value="responsabilidades-actividad" className="mt-4">
          <RolesActividadTab isAdmin={isAdmin} />
        </TabsContent>

        <TabsContent value="tipos-actividad" className="mt-4">
          <TiposActividadTab isAdmin={isAdmin} />
        </TabsContent>

        <TabsContent value="tipos-necesidad" className="mt-4">
          <TiposNecesidadTab isAdmin={isAdmin} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
