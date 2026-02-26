import bcrypt from 'bcryptjs';
import dayjs from 'dayjs';
import { supabase } from '@/common/utils/supabaseClient';

const SALT_ROUNDS = 10;

// â”€â”€â”€ Contadores para resumen final â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
const resumen: Record<string, number> = {};

// â”€â”€â”€ Helpers â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

/**
 * Inserta registros solo si la tabla estÃ¡ vacÃ­a (idempotente).
 * Retorna los IDs insertados o los existentes.
 */
async function seedIfEmpty<T extends Record<string, unknown>>(
  tableName: string,
  records: T[],
  idColumn = 'id',
): Promise<number[]> {
  const { data: existing, error: checkError } = await supabase.from(tableName).select(idColumn);

  if (checkError) throw new Error(`Error al verificar ${tableName}: ${checkError.message}`);

  if (existing && existing.length > 0) {
    console.log(`  â­  ${tableName}: ya tiene ${existing.length} registros, omitiendo`);
    resumen[tableName] = 0;
    return existing.map((r: Record<string, unknown>) => r[idColumn] as number);
  }

  const { data, error } = await supabase.from(tableName).insert(records).select(idColumn);

  if (error) throw new Error(`Error al insertar en ${tableName}: ${error.message}`);

  const ids = (data || []).map((r: Record<string, unknown>) => r[idColumn] as number);
  console.log(`  âœ… ${tableName}: ${records.length} registros insertados`);
  resumen[tableName] = records.length;
  return ids;
}

/**
 * Inserta registros en una tabla sin verificar si estÃ¡ vacÃ­a.
 * Ãštil para tablas con dependencias complejas donde se verifica manualmente.
 */
async function insertRecords<T extends Record<string, unknown>>(
  tableName: string,
  records: T[],
  idColumn = 'id',
): Promise<number[]> {
  const { data, error } = await supabase.from(tableName).insert(records).select(idColumn);

  if (error) throw new Error(`Error al insertar en ${tableName}: ${error.message}`);

  const ids = (data || []).map((r: Record<string, unknown>) => r[idColumn] as number);
  console.log(`  âœ… ${tableName}: ${records.length} registros insertados`);
  resumen[tableName] = (resumen[tableName] || 0) + records.length;
  return ids;
}

/**
 * Verifica si una tabla ya tiene datos
 */
async function tableHasData(tableName: string): Promise<boolean> {
  const { count, error } = await supabase
    .from(tableName)
    .select('*', { count: 'exact', head: true });

  if (error) throw new Error(`Error al verificar ${tableName}: ${error.message}`);
  return (count ?? 0) > 0;
}

/**
 * Genera fecha futura dentro de los prÃ³ximos N dÃ­as a partir de hoy
 */
function futureDate(daysFromNow: number): string {
  return dayjs().add(daysFromNow, 'day').format('YYYY-MM-DD');
}

// â”€â”€â”€ 1. CATÃLOGOS (sin FK) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

async function seedTiposActividad(): Promise<number[]> {
  return seedIfEmpty(
    'tipo_actividad',
    [
      { nombre: 'Culto', descripcion: 'Servicio de culto regular', color: '#3B82F6', activo: true },
      {
        nombre: 'Escuela Dominical',
        descripcion: 'EnseÃ±anza bÃ­blica dominical',
        color: '#10B981',
        activo: true,
      },
      {
        nombre: 'ReuniÃ³n de OraciÃ³n',
        descripcion: 'ReuniÃ³n de oraciÃ³n comunitaria',
        color: '#8B5CF6',
        activo: true,
      },
      {
        nombre: 'Ensayo de Coro',
        descripcion: 'PrÃ¡ctica del coro de la iglesia',
        color: '#F59E0B',
        activo: true,
      },
      {
        nombre: 'ReuniÃ³n General Mensual',
        descripcion: 'ReuniÃ³n administrativa mensual',
        color: '#EF4444',
        activo: true,
      },
      {
        nombre: 'PredicaciÃ³n en Locales',
        descripcion: 'EvangelizaciÃ³n en locales',
        color: '#06B6D4',
        activo: true,
      },
      {
        nombre: 'Confraternidad',
        descripcion: 'Actividad de confraternizaciÃ³n',
        color: '#EC4899',
        activo: true,
      },
      {
        nombre: 'Retiro Espiritual',
        descripcion: 'Retiro espiritual de la iglesia',
        color: '#14B8A6',
        activo: true,
      },
      {
        nombre: 'Santa Cena',
        descripcion: 'CelebraciÃ³n de la Santa Cena',
        color: '#A855F7',
        activo: true,
      },
      { nombre: 'Pedestre', descripcion: 'Actividad pedestre', color: '#F97316', activo: true },
    ],
    'id_tipo',
  );
}

async function seedRolesActividad(): Promise<number[]> {
  return seedIfEmpty(
    'rol_actividad',
    [
      { nombre: 'Predicador', descripcion: 'Encargado de la predicaciÃ³n', activo: true },
      {
        nombre: 'LÃ­der de Alabanza',
        descripcion: 'Dirige la alabanza y adoraciÃ³n',
        activo: true,
      },
      { nombre: 'MÃºsico', descripcion: 'Ejecuta instrumento musical', activo: true },
      { nombre: 'Corista', descripcion: 'Integrante del coro', activo: true },
      {
        nombre: 'Profesor Escuela Dominical',
        descripcion: 'EnseÃ±anza en escuela dominical',
        activo: true,
      },
      { nombre: 'Portero', descripcion: 'RecepciÃ³n y bienvenida', activo: true },
      { nombre: 'Vigilante', descripcion: 'Vigilancia y seguridad', activo: true },
      { nombre: 'Ofrendero', descripcion: 'RecolecciÃ³n de ofrendas', activo: true },
      { nombre: 'Coordinador', descripcion: 'CoordinaciÃ³n general de la actividad', activo: true },
    ],
    'id_rol',
  );
}

async function seedRolesGrupo(): Promise<number[]> {
  return seedIfEmpty(
    'rol_grupo_ministerial',
    [
      { nombre: 'LÃ­der', requiere_plena_comunion: true, activo: true },
      { nombre: 'Secretario', requiere_plena_comunion: true, activo: true },
      { nombre: 'Tesorero', requiere_plena_comunion: true, activo: true },
      { nombre: 'Vocal', requiere_plena_comunion: false, activo: true },
      { nombre: 'Miembro', requiere_plena_comunion: false, activo: true },
    ],
    'id_rol_grupo',
  );
}

async function seedTiposNecesidad(): Promise<number[]> {
  return seedIfEmpty(
    'tipo_necesidad_logistica',
    [
      {
        nombre: 'Transporte',
        descripcion: 'Necesidad de transporte o vehÃ­culos',
        requiere_asignacion_beneficiarios: false,
        activo: true,
      },
      {
        nombre: 'AlimentaciÃ³n',
        descripcion: 'ProvisiÃ³n de alimentos y bebidas',
        requiere_asignacion_beneficiarios: false,
        activo: true,
      },
      {
        nombre: 'Hospedaje',
        descripcion: 'Alojamiento para participantes',
        requiere_asignacion_beneficiarios: true,
        activo: true,
      },
      {
        nombre: 'Materiales',
        descripcion: 'Materiales de apoyo y suministros',
        requiere_asignacion_beneficiarios: false,
        activo: true,
      },
      {
        nombre: 'Equipos',
        descripcion: 'Equipos tÃ©cnicos o audiovisuales',
        requiere_asignacion_beneficiarios: false,
        activo: true,
      },
      {
        nombre: 'DecoraciÃ³n',
        descripcion: 'DecoraciÃ³n del lugar',
        requiere_asignacion_beneficiarios: false,
        activo: true,
      },
      {
        nombre: 'Aseo y Ornato',
        descripcion: 'Limpieza y ornamentaciÃ³n',
        requiere_asignacion_beneficiarios: false,
        activo: true,
      },
    ],
    'id_tipo',
  );
}

// â”€â”€â”€ 2. MIEMBROS â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

async function seedMiembros(): Promise<number[]> {
  return seedIfEmpty('miembro', [
    {
      rut: '12345678-5',
      nombre: 'Carlos',
      apellido: 'MuÃ±oz PÃ©rez',
      email: 'carlos.munoz@email.cl',
      telefono: '+56912345678',
      fecha_nacimiento: '1980-03-15',
      direccion: 'Los Aromos 123, Santa Juana',
      genero: 'masculino',
      bautizado: true,
      estado_membresia: 'plena_comunion',
      fecha_ingreso: '2020-01-15',
      activo: true,
    },
    {
      rut: '11234567-8',
      nombre: 'MarÃ­a',
      apellido: 'GonzÃ¡lez Rivas',
      email: 'maria.gonzalez@email.cl',
      telefono: '+56923456789',
      fecha_nacimiento: '1985-07-22',
      direccion: 'Av. Principal 456, Santa Juana',
      genero: 'femenino',
      bautizado: true,
      estado_membresia: 'plena_comunion',
      fecha_ingreso: '2019-06-10',
      activo: true,
    },
    {
      rut: '13456789-0',
      nombre: 'Pedro',
      apellido: 'Soto Arriagada',
      email: 'pedro.soto@email.cl',
      telefono: '+56934567890',
      fecha_nacimiento: '1975-11-05',
      direccion: 'Pasaje Las Rosas 78, Santa Juana',
      genero: 'masculino',
      bautizado: true,
      estado_membresia: 'plena_comunion',
      fecha_ingreso: '2018-03-20',
      activo: true,
    },
    {
      rut: '14567890-1',
      nombre: 'Ana',
      apellido: 'Riquelme Torres',
      email: 'ana.riquelme@email.cl',
      telefono: '+56945678901',
      fecha_nacimiento: '1992-01-30',
      direccion: 'Calle Nueva 90, Santa Juana',
      genero: 'femenino',
      bautizado: true,
      estado_membresia: 'plena_comunion',
      fecha_ingreso: '2021-08-12',
      activo: true,
    },
    {
      rut: '15678901-2',
      nombre: 'Luis',
      apellido: 'HernÃ¡ndez Bravo',
      email: 'luis.hernandez@email.cl',
      telefono: '+56956789012',
      fecha_nacimiento: '1998-05-18',
      direccion: 'PoblaciÃ³n El Sol 34, Santa Juana',
      genero: 'masculino',
      bautizado: false,
      estado_membresia: 'probando',
      fecha_ingreso: '2024-02-01',
      activo: true,
    },
    {
      rut: '16789012-3',
      nombre: 'Daniela',
      apellido: 'Fuentes SepÃºlveda',
      email: 'daniela.fuentes@email.cl',
      telefono: '+56967890123',
      fecha_nacimiento: '2000-09-12',
      direccion: 'Villa Los Pinos 56, Santa Juana',
      genero: 'femenino',
      bautizado: false,
      estado_membresia: 'probando',
      fecha_ingreso: '2024-06-15',
      activo: true,
    },
    {
      rut: '17890123-4',
      nombre: 'Roberto',
      apellido: 'Villalobos CÃ¡ceres',
      email: 'roberto.villalobos@email.cl',
      telefono: '+56978901234',
      fecha_nacimiento: '1988-12-03',
      direccion: 'Camino Real 200, Santa Juana',
      genero: 'masculino',
      bautizado: false,
      estado_membresia: 'sin_membresia',
      fecha_ingreso: '2025-01-10',
      activo: true,
    },
    {
      rut: '18901234-5',
      nombre: 'Patricia',
      apellido: 'Morales Contreras',
      email: 'patricia.morales@email.cl',
      telefono: '+56989012345',
      fecha_nacimiento: '1970-04-25',
      direccion: 'Av. Libertad 310, Santa Juana',
      genero: 'femenino',
      bautizado: true,
      estado_membresia: 'plena_comunion',
      fecha_ingreso: '2017-11-20',
      activo: true,
    },
    {
      rut: '19012345-6',
      nombre: 'Javier',
      apellido: 'Campos Navarro',
      email: 'javier.campos@email.cl',
      telefono: '+56990123456',
      fecha_nacimiento: '1995-08-08',
      direccion: 'Los Copihues 45, Santa Juana',
      genero: 'masculino',
      bautizado: true,
      estado_membresia: 'plena_comunion',
      fecha_ingreso: '2022-04-05',
      activo: true,
    },
    {
      rut: '20123456-7',
      nombre: 'Camila',
      apellido: 'Vega Sandoval',
      email: 'camila.vega@email.cl',
      telefono: '+56901234567',
      fecha_nacimiento: '2002-06-20',
      direccion: 'Pasaje Los Aromos 12, Santa Juana',
      genero: 'femenino',
      bautizado: false,
      estado_membresia: 'sin_membresia',
      fecha_ingreso: '2025-11-01',
      activo: true,
    },
  ]);
}

// â”€â”€â”€ 3. USUARIOS â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

async function seedUsuarios(miembroIds: number[]): Promise<number[]> {
  if (await tableHasData('usuario')) {
    console.log('  â­  usuario: ya tiene registros, omitiendo');
    const { data } = await supabase.from('usuario').select('id');
    resumen.usuario = 0;
    return (data || []).map((r) => r.id as number);
  }

  const passwordAdmin = await bcrypt.hash('Admin123!', SALT_ROUNDS);
  const passwordLider = await bcrypt.hash('Lider123!', SALT_ROUNDS);
  const passwordMiembro = await bcrypt.hash('Miembro123!', SALT_ROUNDS);

  // miembroIds[0]=Carlos (admin), [1]=MarÃ­a (lÃ­der), [2]=Pedro, [3]=Ana, [4]=Luis
  return insertRecords('usuario', [
    {
      email: 'admin@iepsantajuana.cl',
      password_hash: passwordAdmin,
      rol: 'administrador',
      miembro_id: miembroIds[0], // Carlos MuÃ±oz
      activo: true,
    },
    {
      email: 'lider@iepsantajuana.cl',
      password_hash: passwordLider,
      rol: 'usuario',
      miembro_id: miembroIds[1], // MarÃ­a GonzÃ¡lez
      activo: true,
    },
    {
      email: 'miembro1@test.cl',
      password_hash: passwordMiembro,
      rol: 'usuario',
      miembro_id: miembroIds[3], // Ana Riquelme
      activo: true,
    },
    {
      email: 'miembro2@test.cl',
      password_hash: passwordMiembro,
      rol: 'usuario',
      miembro_id: miembroIds[4], // Luis HernÃ¡ndez
      activo: true,
    },
    {
      email: 'miembro3@test.cl',
      password_hash: passwordMiembro,
      rol: 'usuario',
      miembro_id: miembroIds[8], // Javier Campos
      activo: true,
    },
  ]);
}

// â”€â”€â”€ 4. GRUPOS MINISTERIALES â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

async function seedGruposMinisteriales(miembroIds: number[]): Promise<number[]> {
  // miembroIds: [0]=Carlos, [1]=MarÃ­a, [2]=Pedro, [3]=Ana, [7]=Patricia
  return seedIfEmpty(
    'grupo_ministerial',
    [
      {
        nombre: 'Coro Oficial',
        descripcion: 'Coro oficial de la iglesia, encargado de la alabanza en cultos',
        fecha_creacion: '2019-06-15',
        activo: true,
      },
      {
        nombre: 'Grupo de JÃ³venes',
        descripcion: 'Ministerio juvenil para edades entre 15 y 30 aÃ±os',
        fecha_creacion: '2021-03-10',
        activo: true,
      },
      {
        nombre: 'Grupo de SeÃ±oritas',
        descripcion: 'Ministerio de seÃ±oritas y mujeres jÃ³venes',
        fecha_creacion: '2022-01-20',
        activo: true,
      },
      {
        nombre: 'Junta de Oficiales',
        descripcion: 'Cuerpo directivo y administrativo de la iglesia',
        fecha_creacion: '2018-01-01',
        activo: true,
      },
    ],
    'id_grupo',
  );
}

// â”€â”€â”€ 5. MEMBRESÃA GRUPO â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

async function seedMembresiaGrupo(
  miembroIds: number[],
  grupoIds: number[],
  rolesGrupoIds: number[],
): Promise<number[]> {
  if (await tableHasData('membresia_grupo')) {
    console.log('  â­  membresia_grupo: ya tiene registros, omitiendo');
    const { data } = await supabase.from('membresia_grupo').select('id_membresia');
    resumen.membresia_grupo = 0;
    return (data || []).map((r) => r.id_membresia as number);
  }

  // rolesGrupoIds: [0]=LÃ­der, [1]=Secretario, [2]=Tesorero, [3]=Vocal, [4]=Miembro
  // grupoIds: [0]=Coro, [1]=JÃ³venes, [2]=SeÃ±oritas, [3]=Junta Oficiales
  return insertRecords(
    'membresia_grupo',
    [
      // Coro Oficial
      {
        miembro_id: miembroIds[1],
        grupo_id: grupoIds[0],
        rol_grupo_id: rolesGrupoIds[0],
        fecha_vinculacion: '2019-06-15T00:00:00Z',
      },
      {
        miembro_id: miembroIds[3],
        grupo_id: grupoIds[0],
        rol_grupo_id: rolesGrupoIds[4],
        fecha_vinculacion: '2021-09-01T00:00:00Z',
      },
      {
        miembro_id: miembroIds[8],
        grupo_id: grupoIds[0],
        rol_grupo_id: rolesGrupoIds[4],
        fecha_vinculacion: '2022-05-10T00:00:00Z',
      },
      {
        miembro_id: miembroIds[5],
        grupo_id: grupoIds[0],
        rol_grupo_id: rolesGrupoIds[4],
        fecha_vinculacion: '2024-08-01T00:00:00Z',
      },

      // Grupo de JÃ³venes
      {
        miembro_id: miembroIds[3],
        grupo_id: grupoIds[1],
        rol_grupo_id: rolesGrupoIds[0],
        fecha_vinculacion: '2021-03-10T00:00:00Z',
      },
      {
        miembro_id: miembroIds[4],
        grupo_id: grupoIds[1],
        rol_grupo_id: rolesGrupoIds[4],
        fecha_vinculacion: '2024-03-01T00:00:00Z',
      },
      {
        miembro_id: miembroIds[5],
        grupo_id: grupoIds[1],
        rol_grupo_id: rolesGrupoIds[1],
        fecha_vinculacion: '2024-07-15T00:00:00Z',
      },
      {
        miembro_id: miembroIds[8],
        grupo_id: grupoIds[1],
        rol_grupo_id: rolesGrupoIds[3],
        fecha_vinculacion: '2022-06-01T00:00:00Z',
      },
      {
        miembro_id: miembroIds[9],
        grupo_id: grupoIds[1],
        rol_grupo_id: rolesGrupoIds[4],
        fecha_vinculacion: '2025-11-15T00:00:00Z',
      },

      // Grupo de SeÃ±oritas
      {
        miembro_id: miembroIds[3],
        grupo_id: grupoIds[2],
        rol_grupo_id: rolesGrupoIds[0],
        fecha_vinculacion: '2022-01-20T00:00:00Z',
      },
      {
        miembro_id: miembroIds[5],
        grupo_id: grupoIds[2],
        rol_grupo_id: rolesGrupoIds[4],
        fecha_vinculacion: '2024-08-20T00:00:00Z',
      },
      {
        miembro_id: miembroIds[9],
        grupo_id: grupoIds[2],
        rol_grupo_id: rolesGrupoIds[4],
        fecha_vinculacion: '2025-11-20T00:00:00Z',
      },

      // Junta de Oficiales
      {
        miembro_id: miembroIds[0],
        grupo_id: grupoIds[3],
        rol_grupo_id: rolesGrupoIds[0],
        fecha_vinculacion: '2018-01-01T00:00:00Z',
      },
      {
        miembro_id: miembroIds[2],
        grupo_id: grupoIds[3],
        rol_grupo_id: rolesGrupoIds[1],
        fecha_vinculacion: '2018-01-01T00:00:00Z',
      },
      {
        miembro_id: miembroIds[7],
        grupo_id: grupoIds[3],
        rol_grupo_id: rolesGrupoIds[2],
        fecha_vinculacion: '2018-01-01T00:00:00Z',
      },
      {
        miembro_id: miembroIds[1],
        grupo_id: grupoIds[3],
        rol_grupo_id: rolesGrupoIds[3],
        fecha_vinculacion: '2019-07-01T00:00:00Z',
      },
    ],
    'id_membresia',
  );
}

// â”€â”€â”€ 6. HISTORIAL ROL GRUPO â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

// â”€â”€â”€ 7. HISTORIAL ESTADO â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

async function seedHistorialEstado(miembroIds: number[], usuarioIds: number[]): Promise<void> {
  if (await tableHasData('historial_estado')) {
    console.log('  â­  historial_estado: ya tiene registros, omitiendo');
    resumen.historial_estado = 0;
    return;
  }

  await insertRecords('historial_estado', [
    {
      miembro_id: miembroIds[4], // Luis HernÃ¡ndez
      estado_anterior: 'sin_membresia',
      estado_nuevo: 'probando',
      motivo:
        'El hermano Luis ha asistido regularmente durante 6 meses y desea iniciar su perÃ­odo de prueba',
      usuario_id: usuarioIds[0], // admin
    },
    {
      miembro_id: miembroIds[5], // Daniela Fuentes
      estado_anterior: 'sin_membresia',
      estado_nuevo: 'probando',
      motivo:
        'La hermana Daniela ha participado activamente en el grupo de jÃ³venes y solicita iniciar perÃ­odo de prueba',
      usuario_id: usuarioIds[0], // admin
    },
    {
      miembro_id: miembroIds[3], // Ana Riquelme
      estado_anterior: 'probando',
      estado_nuevo: 'plena_comunion',
      motivo:
        'La hermana Ana completÃ³ satisfactoriamente su perÃ­odo de prueba y fue aprobada por la junta de oficiales',
      usuario_id: usuarioIds[0], // admin
    },
  ]);
}

// â”€â”€â”€ 7. PATRONES DE ACTIVIDAD â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

async function seedPatronesActividad(
  tiposActividadIds: number[],
  grupoIds: number[],
): Promise<number[]> {
  // tiposActividadIds: [0]=Culto, [1]=Esc.Dom., [2]=R.OraciÃ³n, [3]=Ensayo Coro, [4]=R.General
  // grupoIds: [0]=Coro, [1]=JÃ³venes, [2]=SeÃ±oritas, [3]=Junta
  return seedIfEmpty('patron_actividad', [
    {
      nombre: 'Culto Martes',
      tipo_actividad_id: tiposActividadIds[0],
      frecuencia: 'semanal',
      dia_semana: 2, // martes
      hora_inicio: '19:00:00',
      duracion_minutos: 120,
      lugar: 'Templo Central',
      grupo_id: null,
      es_publica: true,
      activo: true,
    },
    {
      nombre: 'Culto Domingo',
      tipo_actividad_id: tiposActividadIds[0],
      frecuencia: 'semanal',
      dia_semana: 7, // domingo
      hora_inicio: '10:00:00',
      duracion_minutos: 120,
      lugar: 'Templo Central',
      grupo_id: null,
      es_publica: true,
      activo: true,
    },
    {
      nombre: 'Escuela Dominical',
      tipo_actividad_id: tiposActividadIds[1],
      frecuencia: 'semanal',
      dia_semana: 7, // domingo
      hora_inicio: '09:00:00',
      duracion_minutos: 50,
      lugar: 'SalÃ³n Educacional',
      grupo_id: null,
      es_publica: false,
      activo: true,
    },
    {
      nombre: 'ReuniÃ³n General Mensual',
      tipo_actividad_id: tiposActividadIds[4],
      frecuencia: 'primera_semana',
      dia_semana: 5, // viernes
      hora_inicio: '19:00:00',
      duracion_minutos: 90,
      lugar: 'Templo Central',
      grupo_id: grupoIds[3], // Junta de Oficiales
      es_publica: false,
      activo: true,
    },
    {
      nombre: 'Ensayo de Coro Semanal',
      tipo_actividad_id: tiposActividadIds[3],
      frecuencia: 'semanal',
      dia_semana: 6, // sÃ¡bado
      hora_inicio: '16:00:00',
      duracion_minutos: 90,
      lugar: 'SalÃ³n Coro',
      grupo_id: grupoIds[0], // Coro Oficial
      es_publica: false,
      activo: true,
    },
  ]);
}

// â”€â”€â”€ 8. ACTIVIDADES â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

async function seedActividades(
  tiposActividadIds: number[],
  patronIds: number[],
  grupoIds: number[],
  usuarioIds: number[],
): Promise<number[]> {
  if (await tableHasData('actividad')) {
    console.log('  â­  actividad: ya tiene registros, omitiendo');
    const { data } = await supabase.from('actividad').select('id');
    resumen.actividad = 0;
    return (data || []).map((r) => r.id as number);
  }

  const creadorId = usuarioIds[0]; // admin

  // Generar actividades para los prÃ³ximos 60 dÃ­as
  const actividades: Record<string, unknown>[] = [];

  // Actividades desde patrones (prÃ³ximos martes y domingos)
  const hoy = dayjs();
  let dia = hoy.add(1, 'day');

  let cultoMartes = 0;
  let cultoDomingo = 0;
  let escuelaDominical = 0;

  // Generar 8 semanas de actividades recurrentes
  for (let i = 0; i < 56; i++) {
    const dayOfWeek = dia.day(); // 0=dom, 2=mar

    if (dayOfWeek === 2 && cultoMartes < 8) {
      // Martes - Culto
      actividades.push({
        patron_id: patronIds[0],
        tipo_actividad_id: tiposActividadIds[0],
        nombre: `Culto Martes ${dia.format('DD/MM/YYYY')}`,
        descripcion: 'Servicio de culto regular del dÃ­a martes',
        fecha: dia.format('YYYY-MM-DD'),
        hora_inicio: '19:00:00',
        hora_fin: '21:00:00',
        grupo_id: null,
        es_publica: true,
        estado: 'programada',
        creador_id: creadorId,
      });
      cultoMartes++;
    }

    if (dayOfWeek === 0 && cultoDomingo < 8) {
      // Domingo - Culto
      actividades.push({
        patron_id: patronIds[1],
        tipo_actividad_id: tiposActividadIds[0],
        nombre: `Culto Domingo ${dia.format('DD/MM/YYYY')}`,
        descripcion: 'Servicio de culto dominical',
        fecha: dia.format('YYYY-MM-DD'),
        hora_inicio: '10:00:00',
        hora_fin: '12:00:00',
        grupo_id: null,
        es_publica: true,
        estado: 'programada',
        creador_id: creadorId,
      });
      cultoDomingo++;

      // Escuela Dominical (mismos domingos, antes del culto)
      if (escuelaDominical < 8) {
        actividades.push({
          patron_id: patronIds[2],
          tipo_actividad_id: tiposActividadIds[1],
          nombre: `Escuela Dominical ${dia.format('DD/MM/YYYY')}`,
          descripcion: 'Clase de enseÃ±anza bÃ­blica dominical',
          fecha: dia.format('YYYY-MM-DD'),
          hora_inicio: '09:00:00',
          hora_fin: '09:50:00',
          grupo_id: null,
          es_publica: false,
          estado: 'programada',
          creador_id: creadorId,
        });
        escuelaDominical++;
      }
    }

    dia = dia.add(1, 'day');
  }

  // Actividades extraordinarias
  actividades.push(
    {
      patron_id: null,
      tipo_actividad_id: tiposActividadIds[6], // Confraternidad
      nombre: 'Confraternidad de JÃ³venes',
      descripcion: 'Confraternidad con iglesias vecinas, actividades recreativas y alabanza',
      fecha: futureDate(21),
      hora_inicio: '15:00:00',
      hora_fin: '20:00:00',
      grupo_id: grupoIds[1], // JÃ³venes
      es_publica: true,
      estado: 'programada',
      creador_id: creadorId,
    },
    {
      patron_id: null,
      tipo_actividad_id: tiposActividadIds[8], // Santa Cena
      nombre: 'Santa Cena Mensual',
      descripcion: 'CelebraciÃ³n mensual de la Santa Cena',
      fecha: futureDate(14),
      hora_inicio: '19:00:00',
      hora_fin: '21:00:00',
      grupo_id: null,
      es_publica: false,
      estado: 'programada',
      creador_id: creadorId,
    },
    {
      patron_id: null,
      tipo_actividad_id: tiposActividadIds[5], // PredicaciÃ³n en Locales
      nombre: 'PredicaciÃ³n Sector Norte',
      descripcion: 'EvangelizaciÃ³n puerta a puerta en sector norte de Santa Juana',
      fecha: futureDate(28),
      hora_inicio: '10:00:00',
      hora_fin: '13:00:00',
      grupo_id: null,
      es_publica: false,
      estado: 'programada',
      creador_id: creadorId,
    },
  );

  return insertRecords('actividad', actividades);
}

// â”€â”€â”€ 9. INVITADOS â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

async function seedInvitados(
  actividadIds: number[],
  miembroIds: number[],
  rolesActividadIds: number[],
): Promise<number[]> {
  if (await tableHasData('invitado')) {
    console.log('  â­  invitado: ya tiene registros, omitiendo');
    const { data } = await supabase.from('invitado').select('id');
    resumen.invitado = 0;
    return (data || []).map((r) => r.id as number);
  }

  // rolesActividadIds: [0]=Predicador, [1]=L.Alabanza, [2]=MÃºsico, [3]=Corista,
  //                    [4]=Profesor E.D., [5]=Portero, [6]=Vigilante, [7]=Ofrendero, [8]=Coordinador
  const ahora = dayjs().toISOString();
  const ayer = dayjs().subtract(1, 'day').toISOString();
  const haceUnaSemana = dayjs().subtract(7, 'day').toISOString();

  return insertRecords('invitado', [
    // Actividad 0 (primer culto martes) - confirmados
    {
      actividad_id: actividadIds[0],
      miembro_id: miembroIds[2],
      rol_id: rolesActividadIds[0],
      estado: 'confirmado',
      asistio: false,
      fecha_invitacion: haceUnaSemana,
      fecha_respuesta: ayer,
    },
    {
      actividad_id: actividadIds[0],
      miembro_id: miembroIds[1],
      rol_id: rolesActividadIds[1],
      estado: 'confirmado',
      asistio: false,
      fecha_invitacion: haceUnaSemana,
      fecha_respuesta: ayer,
    },
    {
      actividad_id: actividadIds[0],
      miembro_id: miembroIds[8],
      rol_id: rolesActividadIds[2],
      estado: 'confirmado',
      asistio: false,
      fecha_invitacion: haceUnaSemana,
      fecha_respuesta: ayer,
    },
    {
      actividad_id: actividadIds[0],
      miembro_id: miembroIds[0],
      rol_id: rolesActividadIds[7],
      estado: 'confirmado',
      asistio: false,
      fecha_invitacion: haceUnaSemana,
      fecha_respuesta: ayer,
    },

    // Actividad 1 (primer culto domingo) - mix de estados
    {
      actividad_id: actividadIds[1],
      miembro_id: miembroIds[2],
      rol_id: rolesActividadIds[0],
      estado: 'confirmado',
      asistio: false,
      fecha_invitacion: haceUnaSemana,
      fecha_respuesta: ayer,
    },
    {
      actividad_id: actividadIds[1],
      miembro_id: miembroIds[1],
      rol_id: rolesActividadIds[1],
      estado: 'confirmado',
      asistio: false,
      fecha_invitacion: haceUnaSemana,
      fecha_respuesta: ayer,
    },
    {
      actividad_id: actividadIds[1],
      miembro_id: miembroIds[3],
      rol_id: rolesActividadIds[5],
      estado: 'pendiente',
      asistio: false,
      fecha_invitacion: ahora,
      fecha_respuesta: null,
    },
    {
      actividad_id: actividadIds[1],
      miembro_id: miembroIds[4],
      rol_id: rolesActividadIds[6],
      estado: 'rechazado',
      motivo_rechazo: 'Tengo turno de trabajo ese dÃ­a',
      asistio: false,
      fecha_invitacion: haceUnaSemana,
      fecha_respuesta: ayer,
    },

    // Actividad 2 (primera escuela dominical)
    {
      actividad_id: actividadIds[2],
      miembro_id: miembroIds[7],
      rol_id: rolesActividadIds[4],
      estado: 'confirmado',
      asistio: false,
      fecha_invitacion: haceUnaSemana,
      fecha_respuesta: ayer,
    },
    {
      actividad_id: actividadIds[2],
      miembro_id: miembroIds[3],
      rol_id: rolesActividadIds[4],
      estado: 'confirmado',
      asistio: false,
      fecha_invitacion: haceUnaSemana,
      fecha_respuesta: ayer,
    },

    // Actividad 3 (segundo culto martes) - pendientes
    {
      actividad_id: actividadIds[3],
      miembro_id: miembroIds[2],
      rol_id: rolesActividadIds[0],
      estado: 'pendiente',
      asistio: false,
      fecha_invitacion: ahora,
      fecha_respuesta: null,
    },
    {
      actividad_id: actividadIds[3],
      miembro_id: miembroIds[1],
      rol_id: rolesActividadIds[1],
      estado: 'pendiente',
      asistio: false,
      fecha_invitacion: ahora,
      fecha_respuesta: null,
    },
    {
      actividad_id: actividadIds[3],
      miembro_id: miembroIds[5],
      rol_id: rolesActividadIds[3],
      estado: 'pendiente',
      asistio: false,
      fecha_invitacion: ahora,
      fecha_respuesta: null,
    },

    // Confraternidad de JÃ³venes (actividad extraordinaria, penÃºltima)
    {
      actividad_id: actividadIds[actividadIds.length - 3],
      miembro_id: miembroIds[3],
      rol_id: rolesActividadIds[8],
      estado: 'confirmado',
      asistio: false,
      fecha_invitacion: haceUnaSemana,
      fecha_respuesta: ayer,
    },
    {
      actividad_id: actividadIds[actividadIds.length - 3],
      miembro_id: miembroIds[4],
      rol_id: rolesActividadIds[2],
      estado: 'confirmado',
      asistio: false,
      fecha_invitacion: haceUnaSemana,
      fecha_respuesta: ayer,
    },
    {
      actividad_id: actividadIds[actividadIds.length - 3],
      miembro_id: miembroIds[5],
      rol_id: rolesActividadIds[3],
      estado: 'pendiente',
      asistio: false,
      fecha_invitacion: ahora,
      fecha_respuesta: null,
    },
    {
      actividad_id: actividadIds[actividadIds.length - 3],
      miembro_id: miembroIds[8],
      rol_id: rolesActividadIds[2],
      estado: 'confirmado',
      asistio: false,
      fecha_invitacion: haceUnaSemana,
      fecha_respuesta: ayer,
    },

    // Santa Cena (penÃºltima extraordinaria)
    {
      actividad_id: actividadIds[actividadIds.length - 2],
      miembro_id: miembroIds[0],
      rol_id: rolesActividadIds[8],
      estado: 'confirmado',
      asistio: false,
      fecha_invitacion: haceUnaSemana,
      fecha_respuesta: ayer,
    },
    {
      actividad_id: actividadIds[actividadIds.length - 2],
      miembro_id: miembroIds[2],
      rol_id: rolesActividadIds[0],
      estado: 'confirmado',
      asistio: false,
      fecha_invitacion: haceUnaSemana,
      fecha_respuesta: ayer,
    },
    {
      actividad_id: actividadIds[actividadIds.length - 2],
      miembro_id: miembroIds[7],
      rol_id: rolesActividadIds[7],
      estado: 'pendiente',
      asistio: false,
      fecha_invitacion: ahora,
      fecha_respuesta: null,
    },
  ]);
}

// â”€â”€â”€ 10. NECESIDADES LOGÃSTICAS â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

async function seedNecesidadesLogisticas(
  actividadIds: number[],
  tiposNecesidadIds: number[],
): Promise<number[]> {
  if (await tableHasData('necesidad_logistica')) {
    console.log('  â­  necesidad_logistica: ya tiene registros, omitiendo');
    const { data } = await supabase.from('necesidad_logistica').select('id');
    resumen.necesidad_logistica = 0;
    return (data || []).map((r) => r.id as number);
  }

  // tiposNecesidadIds: [0]=Transporte, [1]=AlimentaciÃ³n, [2]=Hospedaje, [3]=Materiales,
  //                    [4]=Equipos, [5]=DecoraciÃ³n, [6]=Aseo y Ornato
  return insertRecords('necesidad_logistica', [
    // Confraternidad de JÃ³venes
    {
      actividad_id: actividadIds[actividadIds.length - 3],
      tipo_necesidad_id: tiposNecesidadIds[0], // Transporte
      descripcion: 'Bus para trasladar jÃ³venes al gimnasio municipal',
      cantidad_requerida: 1,
      unidad_medida: 'vehÃ­culos',
      cantidad_cubierta: 0,
      estado: 'abierta',
    },
    {
      actividad_id: actividadIds[actividadIds.length - 3],
      tipo_necesidad_id: tiposNecesidadIds[1], // AlimentaciÃ³n
      descripcion: 'Colaciones y bebidas para 40 jÃ³venes',
      cantidad_requerida: 40,
      unidad_medida: 'porciones',
      cantidad_cubierta: 15,
      estado: 'abierta',
    },
    {
      actividad_id: actividadIds[actividadIds.length - 3],
      tipo_necesidad_id: tiposNecesidadIds[4], // Equipos
      descripcion: 'Equipo de sonido portÃ¡til para alabanza',
      cantidad_requerida: 1,
      unidad_medida: 'equipos',
      cantidad_cubierta: 1,
      estado: 'cubierta',
    },
    // Santa Cena
    {
      actividad_id: actividadIds[actividadIds.length - 2],
      tipo_necesidad_id: tiposNecesidadIds[1], // AlimentaciÃ³n
      descripcion: 'Pan sin levadura para la Santa Cena',
      cantidad_requerida: 5,
      unidad_medida: 'unidades',
      cantidad_cubierta: 0,
      estado: 'abierta',
    },
    {
      actividad_id: actividadIds[actividadIds.length - 2],
      tipo_necesidad_id: tiposNecesidadIds[1], // AlimentaciÃ³n
      descripcion: 'Jugo de uva para la Santa Cena',
      cantidad_requerida: 3,
      unidad_medida: 'litros',
      cantidad_cubierta: 0,
      estado: 'abierta',
    },
    // PredicaciÃ³n Sector Norte
    {
      actividad_id: actividadIds[actividadIds.length - 1],
      tipo_necesidad_id: tiposNecesidadIds[3], // Materiales
      descripcion: 'Folletos evangelÃ­sticos para repartir',
      cantidad_requerida: 200,
      unidad_medida: 'unidades',
      cantidad_cubierta: 200,
      estado: 'cubierta',
    },
    {
      actividad_id: actividadIds[actividadIds.length - 1],
      tipo_necesidad_id: tiposNecesidadIds[0], // Transporte
      descripcion: 'VehÃ­culos para traslado del equipo evangelÃ­stico',
      cantidad_requerida: 2,
      unidad_medida: 'vehÃ­culos',
      cantidad_cubierta: 1,
      estado: 'abierta',
    },
  ]);
}

// â”€â”€â”€ 11. COLABORADORES â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

async function seedColaboradores(necesidadIds: number[], miembroIds: number[]): Promise<void> {
  if (await tableHasData('colaborador')) {
    console.log('  â­  colaborador: ya tiene registros, omitiendo');
    resumen.colaborador = 0;
    return;
  }

  const ahora = dayjs().toISOString();
  const ayer = dayjs().subtract(1, 'day').toISOString();
  const haceDosDias = dayjs().subtract(2, 'day').toISOString();

  await insertRecords('colaborador', [
    // Confraternidad - Transporte (necesidadIds[0])
    {
      necesidad_id: necesidadIds[0],
      miembro_id: miembroIds[2],
      cantidad_ofrecida: 1,
      observaciones: 'Tengo una van de 15 pasajeros disponible',
      estado: 'pendiente',
      fecha_oferta: ahora,
      fecha_decision: null,
    },

    // Confraternidad - AlimentaciÃ³n (necesidadIds[1])
    {
      necesidad_id: necesidadIds[1],
      miembro_id: miembroIds[7],
      cantidad_ofrecida: 10,
      observaciones: 'Puedo preparar 10 sÃ¡ndwiches',
      estado: 'aceptada',
      fecha_oferta: haceDosDias,
      fecha_decision: ayer,
    },
    {
      necesidad_id: necesidadIds[1],
      miembro_id: miembroIds[3],
      cantidad_ofrecida: 5,
      observaciones: 'Llevo 5 porciones de queque',
      estado: 'aceptada',
      fecha_oferta: haceDosDias,
      fecha_decision: ayer,
    },
    {
      necesidad_id: necesidadIds[1],
      miembro_id: miembroIds[1],
      cantidad_ofrecida: 10,
      observaciones: 'Puedo llevar bebidas y jugos',
      estado: 'pendiente',
      fecha_oferta: ahora,
      fecha_decision: null,
    },

    // Santa Cena - Pan (necesidadIds[3])
    {
      necesidad_id: necesidadIds[3],
      miembro_id: miembroIds[7],
      cantidad_ofrecida: 5,
      observaciones: 'Yo preparo el pan sin levadura',
      estado: 'aceptada',
      fecha_oferta: haceDosDias,
      fecha_decision: ayer,
    },

    // Santa Cena - Jugo (necesidadIds[4])
    {
      necesidad_id: necesidadIds[4],
      miembro_id: miembroIds[0],
      cantidad_ofrecida: 3,
      observaciones: 'Compro el jugo de uva',
      estado: 'pendiente',
      fecha_oferta: ahora,
      fecha_decision: null,
    },

    // PredicaciÃ³n - Transporte (necesidadIds[6])
    {
      necesidad_id: necesidadIds[6],
      miembro_id: miembroIds[2],
      cantidad_ofrecida: 1,
      observaciones: 'Puedo llevar 4 personas en mi auto',
      estado: 'aceptada',
      fecha_oferta: haceDosDias,
      fecha_decision: ayer,
    },
    {
      necesidad_id: necesidadIds[6],
      miembro_id: miembroIds[0],
      cantidad_ofrecida: 1,
      observaciones: 'Disponible con mi camioneta',
      estado: 'pendiente',
      fecha_oferta: ahora,
      fecha_decision: null,
    },

    // Ofertas rechazadas
    {
      necesidad_id: necesidadIds[1],
      miembro_id: miembroIds[6],
      cantidad_ofrecida: 5,
      observaciones: 'Puedo llevar galletas',
      estado: 'rechazada',
      fecha_oferta: haceDosDias,
      fecha_decision: ayer,
    },
    {
      necesidad_id: necesidadIds[0],
      miembro_id: miembroIds[4],
      cantidad_ofrecida: 1,
      observaciones: 'Tengo un auto pero solo para 4 personas',
      estado: 'rechazada',
      fecha_oferta: haceDosDias,
      fecha_decision: ayer,
    },

    // MÃ¡s pendientes
    {
      necesidad_id: necesidadIds[3],
      miembro_id: miembroIds[3],
      cantidad_ofrecida: 2,
      observaciones: 'Puedo preparar pan adicional',
      estado: 'pendiente',
      fecha_oferta: ahora,
      fecha_decision: null,
    },
    {
      necesidad_id: necesidadIds[1],
      miembro_id: miembroIds[5],
      cantidad_ofrecida: 8,
      observaciones: 'Puedo llevar empanadas',
      estado: 'pendiente',
      fecha_oferta: ahora,
      fecha_decision: null,
    },
  ]);
}

// â”€â”€â”€ EJECUCIÃ“N PRINCIPAL â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

export async function runSeeds(): Promise<void> {
  console.log('\n🌱 Iniciando seeds de base de datos...\n');
  console.log('─── 1. Catálogos ───');

  try {
    const tiposActividadIds = await seedTiposActividad();
    const rolesActividadIds = await seedRolesActividad();
    const rolesGrupoIds = await seedRolesGrupo();
    const tiposNecesidadIds = await seedTiposNecesidad();

    console.log('\n─── 2. Miembros ───');
    const miembroIds = await seedMiembros();

    console.log('\n─── 3. Usuarios ───');
    const usuarioIds = await seedUsuarios(miembroIds);

    console.log('\n─── 4. Grupos Ministeriales ───');
    const grupoIds = await seedGruposMinisteriales(miembroIds);

    console.log('\n─── 5. Membresía Grupo ───');
    await seedMembresiaGrupo(miembroIds, grupoIds, rolesGrupoIds);

    console.log('\n─── 6. Historial Estado ───');
    await seedHistorialEstado(miembroIds, usuarioIds);

    console.log('\n─── 7. Patrones de Actividad ───');
    const patronIds = await seedPatronesActividad(tiposActividadIds, grupoIds);

    console.log('\n─── 8. Actividades ───');
    const actividadIds = await seedActividades(tiposActividadIds, patronIds, grupoIds, usuarioIds);

    console.log('\n─── 9. Invitados ───');
    await seedInvitados(actividadIds, miembroIds, rolesActividadIds);

    console.log('\n─── 10. Necesidades Logísticas ───');
    const necesidadIds = await seedNecesidadesLogisticas(actividadIds, tiposNecesidadIds);

    console.log('\n─── 11. Colaboradores ───');
    await seedColaboradores(necesidadIds, miembroIds);

    // Resumen final
    console.log('\n══════════════════════════════════════════');
    console.log('  📊 RESUMEN DE SEEDS');
    console.log('══════════════════════════════════════════');
    let totalInsertados = 0;
    for (const [tabla, count] of Object.entries(resumen)) {
      if (count > 0) {
        console.log(`  ✅ ${tabla}: ${count} registros`);
        totalInsertados += count;
      } else {
        console.log(`  ⏭  ${tabla}: omitido (ya existía)`);
      }
    }
    console.log('──────────────────────────────────────────');
    console.log(`  📦 Total insertados: ${totalInsertados} registros`);
    console.log('══════════════════════════════════════════\n');
  } catch (error) {
    console.error(`\n❌ Error en seeds: ${(error as Error).message}\n`);
    process.exit(1);
  }
}

// Ejecución directa: pnpm seed
runSeeds();
