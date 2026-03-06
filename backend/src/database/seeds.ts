import bcrypt from 'bcryptjs';
import dayjs from 'dayjs';
import { supabase } from '@/common/utils/supabaseClient';

const SALT_ROUNDS = 10;

// ─── Contadores para resumen final ───────────────────────────────────────────
const resumen: Record<string, number> = {};

// ─── Helpers ─────────────────────────────────────────────────────────────────

/**
 * Inserta registros solo si la tabla está vacía (idempotente).
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
    console.log(`  ⏭  ${tableName}: ya tiene ${existing.length} registros, omitiendo`);
    resumen[tableName] = 0;
    return existing.map((r: any) => r[idColumn] as number);
  }

  const { data, error } = await supabase.from(tableName).insert(records).select(idColumn);

  if (error) throw new Error(`Error al insertar en ${tableName}: ${error.message}`);

  const ids = (data || []).map((r: any) => r[idColumn] as number);
  console.log(`  ✅ ${tableName}: ${records.length} registros insertados`);
  resumen[tableName] = records.length;
  return ids;
}

/**
 * Inserta registros en una tabla sin verificar si está vacía.
 * Útil para tablas con dependencias complejas donde se verifica manualmente.
 */
async function insertRecords<T extends Record<string, unknown>>(
  tableName: string,
  records: T[],
  idColumn = 'id',
): Promise<number[]> {
  const { data, error } = await supabase.from(tableName).insert(records).select(idColumn);

  if (error) throw new Error(`Error al insertar en ${tableName}: ${error.message}`);

  const ids = (data || []).map((r: any) => r[idColumn] as number);
  console.log(`  ✅ ${tableName}: ${records.length} registros insertados`);
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
 * Genera fecha futura dentro de los próximos N días a partir de hoy
 */
function futureDate(daysFromNow: number): string {
  return dayjs().add(daysFromNow, 'day').format('YYYY-MM-DD');
}

// ─── 1. CATÁLOGOS (sin FK) ──────────────────────────────────────────────────

async function seedTiposActividad(): Promise<number[]> {
  return seedIfEmpty(
    'tipo_actividad',
    [
      { nombre: 'Culto', descripcion: 'Servicio de culto regular', color: '#3B82F6', activo: true },
      {
        nombre: 'Escuela Dominical',
        descripcion: 'Enseñanza bíblica dominical',
        color: '#10B981',
        activo: true,
      },
      {
        nombre: 'Reunión de Oración',
        descripcion: 'Reunión de oración comunitaria',
        color: '#8B5CF6',
        activo: true,
      },
      {
        nombre: 'Ensayo de Coro',
        descripcion: 'Práctica del coro de la iglesia',
        color: '#F59E0B',
        activo: true,
      },
      {
        nombre: 'Reunión General Mensual',
        descripcion: 'Reunión administrativa mensual',
        color: '#EF4444',
        activo: true,
      },
      {
        nombre: 'Predicación en Locales',
        descripcion: 'Evangelización en locales',
        color: '#06B6D4',
        activo: true,
      },
      {
        nombre: 'Confraternidad',
        descripcion: 'Actividad de confraternización',
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
        descripcion: 'Celebración de la Santa Cena',
        color: '#A855F7',
        activo: true,
      },
      { nombre: 'Pedestre', descripcion: 'Actividad pedestre', color: '#F97316', activo: true },
    ],
    'id_tipo',
  );
}

async function seedResponsabilidadesActividad(): Promise<number[]> {
  return seedIfEmpty(
    'responsabilidad_actividad',
    [
      { nombre: 'Predicador', descripcion: 'Encargado de la predicación', activo: true },
      {
        nombre: 'Líder de Alabanza',
        descripcion: 'Dirige la alabanza y adoración',
        activo: true,
      },
      { nombre: 'Músico', descripcion: 'Ejecuta instrumento musical', activo: true },
      { nombre: 'Corista', descripcion: 'Integrante del coro', activo: true },
      {
        nombre: 'Profesor Escuela Dominical',
        descripcion: 'Enseñanza en escuela dominical',
        activo: true,
      },
      { nombre: 'Portero', descripcion: 'Recepción y bienvenida', activo: true },
      { nombre: 'Vigilante', descripcion: 'Vigilancia y seguridad', activo: true },
      { nombre: 'Ofrendero', descripcion: 'Recolección de ofrendas', activo: true },
      { nombre: 'Coordinador', descripcion: 'Coordinación general de la actividad', activo: true },
    ],
    'id_responsabilidad',
  );
}

async function seedRolesGrupo(): Promise<number[]> {
  return seedIfEmpty(
    'rol_grupo',
    [
      {
        nombre: 'Primer Ayudante',
        requiere_plena_comunion: true,
        es_unico: true,
        es_directiva: true,
        activo: true,
      },
      {
        nombre: 'Secretario',
        requiere_plena_comunion: true,
        es_unico: true,
        es_directiva: true,
        activo: true,
      },
      {
        nombre: 'Tesorero',
        requiere_plena_comunion: true,
        es_unico: true,
        es_directiva: true,
        activo: true,
      },
      {
        nombre: 'Vocal',
        requiere_plena_comunion: false,
        es_unico: false,
        es_directiva: false,
        activo: true,
      },
      {
        nombre: 'Integrante',
        requiere_plena_comunion: false,
        es_unico: false,
        es_directiva: false,
        activo: true,
      },
      {
        nombre: 'Segundo Ayudante',
        requiere_plena_comunion: true,
        es_unico: true,
        es_directiva: true,
        activo: true,
      },
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
        descripcion: 'Necesidad de transporte o vehículos',
        requiere_asignacion_beneficiarios: false,
        activo: true,
      },
      {
        nombre: 'Alimentación',
        descripcion: 'Provisión de alimentos y bebidas',
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
        descripcion: 'Equipos técnicos o audiovisuales',
        requiere_asignacion_beneficiarios: false,
        activo: true,
      },
      {
        nombre: 'Decoración',
        descripcion: 'Decoración del lugar',
        requiere_asignacion_beneficiarios: false,
        activo: true,
      },
      {
        nombre: 'Aseo y Ornato',
        descripcion: 'Limpieza y ornamentación',
        requiere_asignacion_beneficiarios: false,
        activo: true,
      },
    ],
    'id_tipo',
  );
}

// ─── 2. MIEMBROS ─────────────────────────────────────────────────────────────

async function seedMiembros(): Promise<number[]> {
  return seedIfEmpty('miembro', [
    {
      rut: '12345678-5',
      nombre: 'Carlos',
      apellido: 'Muñoz Pérez',
      email: 'carlos.munoz@email.cl',
      telefono: '+56912345678',
      fecha_nacimiento: '1980-03-15',
      direccion: 'Los Aromos 123, Santa Juana',
      genero: 'masculino',

      estado_comunion: 'plena_comunion',
      fecha_ingreso: '2020-01-15',
      activo: true,
    },
    {
      rut: '11234567-8',
      nombre: 'María',
      apellido: 'González Rivas',
      email: 'maria.gonzalez@email.cl',
      telefono: '+56923456789',
      fecha_nacimiento: '1985-07-22',
      direccion: 'Av. Principal 456, Santa Juana',
      genero: 'femenino',

      estado_comunion: 'plena_comunion',
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

      estado_comunion: 'plena_comunion',
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

      estado_comunion: 'plena_comunion',
      fecha_ingreso: '2021-08-12',
      activo: true,
    },
    {
      rut: '15678901-2',
      nombre: 'Luis',
      apellido: 'Hernández Bravo',
      email: 'luis.hernandez@email.cl',
      telefono: '+56956789012',
      fecha_nacimiento: '1998-05-18',
      direccion: 'Población El Sol 34, Santa Juana',
      genero: 'masculino',

      estado_comunion: 'probando',
      fecha_ingreso: '2024-02-01',
      activo: true,
    },
    {
      rut: '16789012-3',
      nombre: 'Daniela',
      apellido: 'Fuentes Sepúlveda',
      email: 'daniela.fuentes@email.cl',
      telefono: '+56967890123',
      fecha_nacimiento: '2000-09-12',
      direccion: 'Villa Los Pinos 56, Santa Juana',
      genero: 'femenino',

      estado_comunion: 'probando',
      fecha_ingreso: '2024-06-15',
      activo: true,
    },
    {
      rut: '17890123-4',
      nombre: 'Roberto',
      apellido: 'Villalobos Cáceres',
      email: 'roberto.villalobos@email.cl',
      telefono: '+56978901234',
      fecha_nacimiento: '1988-12-03',
      direccion: 'Camino Real 200, Santa Juana',
      genero: 'masculino',

      estado_comunion: 'asistente',
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

      estado_comunion: 'plena_comunion',
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

      estado_comunion: 'plena_comunion',
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

      estado_comunion: 'asistente',
      fecha_ingreso: '2025-11-01',
      activo: true,
    },
  ]);
}

// ─── 3. USUARIOS ─────────────────────────────────────────────────────────────

async function seedUsuarios(miembroIds: number[]): Promise<number[]> {
  if (await tableHasData('usuario')) {
    console.log('  ⏭  usuario: ya tiene registros, omitiendo');
    const { data } = await supabase.from('usuario').select('id');
    resumen.usuario = 0;
    return (data || []).map((r) => r.id as number);
  }

  const passwordAdmin = await bcrypt.hash('Admin123!', SALT_ROUNDS);
  const passwordLider = await bcrypt.hash('Lider123!', SALT_ROUNDS);
  const passwordMiembro = await bcrypt.hash('Miembro123!', SALT_ROUNDS);

  // miembroIds[0]=Carlos (admin), [1]=María (líder), [2]=Pedro, [3]=Ana, [4]=Luis
  return insertRecords('usuario', [
    {
      email: 'admin@iepsantajuana.cl',
      password_hash: passwordAdmin,
      rol: 'administrador',
      miembro_id: miembroIds[0], // Carlos Muñoz
      activo: true,
    },
    {
      email: 'lider@iepsantajuana.cl',
      password_hash: passwordLider,
      rol: 'usuario',
      miembro_id: miembroIds[1], // María González
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
      miembro_id: miembroIds[4], // Luis Hernández
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

// ─── 4. GRUPOS MINISTERIALES ─────────────────────────────────────────────────

async function seedGruposMinisteriales(miembroIds: number[]): Promise<number[]> {
  // miembroIds: [0]=Carlos, [1]=María, [2]=Pedro, [3]=Ana, [7]=Patricia
  return seedIfEmpty(
    'grupo',
    [
      {
        nombre: 'Coro Oficial',
        descripcion: 'Coro oficial de la iglesia, encargado de la alabanza en cultos',
        fecha_creacion: '2019-06-15',
        activo: true,
      },
      {
        nombre: 'Grupo de Jóvenes',
        descripcion: 'Ministerio juvenil para edades entre 15 y 30 años',
        fecha_creacion: '2021-03-10',
        activo: true,
      },
      {
        nombre: 'Grupo de Señoritas',
        descripcion: 'Ministerio de señoritas y mujeres jóvenes',
        fecha_creacion: '2022-01-20',
        activo: true,
      },
      {
        nombre: 'Junta de Oficiales',
        descripcion: 'Grupo directivo y administrativo de la iglesia',
        fecha_creacion: '2018-01-01',
        activo: true,
      },
    ],
    'id_grupo',
  );
}

// ─── 5. INTEGRANTE CUERPO ──────────────────────────────────────────────────

async function seedIntegranteGrupo(
  miembroIds: number[],
  grupoIds: number[],
  rolesGrupoIds: number[],
): Promise<number[]> {
  if (await tableHasData('integrante_grupo')) {
    console.log('  ⏭  integrante_grupo: ya tiene registros, omitiendo');
    const { data } = await supabase.from('integrante_grupo').select('id_integrante');
    resumen.integrante_grupo = 0;
    return (data || []).map((r) => r.id_integrante as number);
  }

  // rolesGrupoIds: [0]=Primer Ayudante, [1]=Secretario, [2]=Tesorero, [3]=Vocal, [4]=Integrante, [5]=Segundo Ayudante
  // grupoIds: [0]=Coro, [1]=Jóvenes, [2]=Señoritas, [3]=Junta Oficiales
  return insertRecords(
    'integrante_grupo',
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

      // Grupo de Jóvenes
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

      // Grupo de Señoritas
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
    'id_integrante',
  );
}

// ─── 6. HISTORIAL ROL GRUPO ──────────────────────────────────────────────────

// ─── 7. HISTORIAL ESTADO ─────────────────────────────────────────────────────

async function seedHistorialEstado(miembroIds: number[], usuarioIds: number[]): Promise<void> {
  if (await tableHasData('historial_estado')) {
    console.log('  ⏭  historial_estado: ya tiene registros, omitiendo');
    resumen.historial_estado = 0;
    return;
  }

  await insertRecords('historial_estado', [
    {
      miembro_id: miembroIds[4], // Luis Hernández
      estado_anterior: 'asistente',
      estado_nuevo: 'probando',
      motivo:
        'El hermano Luis ha asistido regularmente durante 6 meses y desea iniciar su período de prueba',
      usuario_id: usuarioIds[0], // admin
    },
    {
      miembro_id: miembroIds[5], // Daniela Fuentes
      estado_anterior: 'asistente',
      estado_nuevo: 'probando',
      motivo:
        'La hermana Daniela ha participado activamente en el grupo de jóvenes y solicita iniciar período de prueba',
      usuario_id: usuarioIds[0], // admin
    },
    {
      miembro_id: miembroIds[3], // Ana Riquelme
      estado_anterior: 'probando',
      estado_nuevo: 'plena_comunion',
      motivo:
        'La hermana Ana completó satisfactoriamente su período de prueba y fue aprobada por la junta de oficiales',
      usuario_id: usuarioIds[0], // admin
    },
  ]);
}

// ─── 7. PATRONES DE ACTIVIDAD ────────────────────────────────────────────────

async function seedPatronesActividad(
  tiposActividadIds: number[],
  grupoIds: number[],
): Promise<number[]> {
  // tiposActividadIds: [0]=Culto, [1]=Esc.Dom., [2]=R.Oración, [3]=Ensayo Coro, [4]=R.General
  // grupoIds: [0]=Coro, [1]=Jóvenes, [2]=Señoritas, [3]=Junta
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
      lugar: 'Salón Educacional',
      grupo_id: null,
      es_publica: false,
      activo: true,
    },
    {
      nombre: 'Reunión General Mensual',
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
      dia_semana: 6, // sábado
      hora_inicio: '16:00:00',
      duracion_minutos: 90,
      lugar: 'Salón Coro',
      grupo_id: grupoIds[0], // Coro Oficial
      es_publica: false,
      activo: true,
    },
  ]);
}

// ─── 8. ACTIVIDADES ──────────────────────────────────────────────────────────

async function seedActividades(
  tiposActividadIds: number[],
  patronIds: number[],
  grupoIds: number[],
  usuarioIds: number[],
): Promise<number[]> {
  if (await tableHasData('actividad')) {
    console.log('  ⏭  actividad: ya tiene registros, omitiendo');
    const { data } = await supabase.from('actividad').select('id');
    resumen.actividad = 0;
    return (data || []).map((r) => r.id as number);
  }

  const creadorId = usuarioIds[0]; // admin

  // Generar actividades para los próximos 60 días
  const actividades: Record<string, unknown>[] = [];

  // Actividades desde patrones (próximos martes y domingos)
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
        descripcion: 'Servicio de culto regular del día martes',
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
          descripcion: 'Clase de enseñanza bíblica dominical',
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
      nombre: 'Confraternidad de Jóvenes',
      descripcion: 'Confraternidad con iglesias vecinas, actividades recreativas y alabanza',
      fecha: futureDate(21),
      hora_inicio: '15:00:00',
      hora_fin: '20:00:00',
      grupo_id: grupoIds[1], // Jóvenes
      es_publica: true,
      estado: 'programada',
      creador_id: creadorId,
    },
    {
      patron_id: null,
      tipo_actividad_id: tiposActividadIds[8], // Santa Cena
      nombre: 'Santa Cena Mensual',
      descripcion: 'Celebración mensual de la Santa Cena',
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
      tipo_actividad_id: tiposActividadIds[5], // Predicación en Locales
      nombre: 'Predicación Sector Norte',
      descripcion: 'Evangelización puerta a puerta en sector norte de Santa Juana',
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

// ─── 9. INVITADOS ────────────────────────────────────────────────────────────

async function seedInvitados(
  actividadIds: number[],
  miembroIds: number[],
  responsabilidadesActividadIds: number[],
): Promise<number[]> {
  if (await tableHasData('invitado')) {
    console.log('  ⏭  invitado: ya tiene registros, omitiendo');
    const { data } = await supabase.from('invitado').select('id');
    resumen.invitado = 0;
    return (data || []).map((r) => r.id as number);
  }

  // responsabilidadesActividadIds: [0]=Predicador, [1]=L.Alabanza, [2]=Músico, [3]=Corista,
  //                    [4]=Profesor E.D., [5]=Portero, [6]=Vigilante, [7]=Ofrendero, [8]=Coordinador
  const ahora = dayjs().toISOString();
  const ayer = dayjs().subtract(1, 'day').toISOString();
  const haceUnaSemana = dayjs().subtract(7, 'day').toISOString();

  return insertRecords('invitado', [
    // Actividad 0 (primer culto martes) - confirmados
    {
      actividad_id: actividadIds[0],
      miembro_id: miembroIds[2],
      responsabilidad_id: responsabilidadesActividadIds[0],
      estado: 'confirmado',
      asistio: false,
      fecha_invitacion: haceUnaSemana,
      fecha_respuesta: ayer,
    },
    {
      actividad_id: actividadIds[0],
      miembro_id: miembroIds[1],
      responsabilidad_id: responsabilidadesActividadIds[1],
      estado: 'confirmado',
      asistio: false,
      fecha_invitacion: haceUnaSemana,
      fecha_respuesta: ayer,
    },
    {
      actividad_id: actividadIds[0],
      miembro_id: miembroIds[8],
      responsabilidad_id: responsabilidadesActividadIds[2],
      estado: 'confirmado',
      asistio: false,
      fecha_invitacion: haceUnaSemana,
      fecha_respuesta: ayer,
    },
    {
      actividad_id: actividadIds[0],
      miembro_id: miembroIds[0],
      responsabilidad_id: responsabilidadesActividadIds[7],
      estado: 'confirmado',
      asistio: false,
      fecha_invitacion: haceUnaSemana,
      fecha_respuesta: ayer,
    },

    // Actividad 1 (primer culto domingo) - mix de estados
    {
      actividad_id: actividadIds[1],
      miembro_id: miembroIds[2],
      responsabilidad_id: responsabilidadesActividadIds[0],
      estado: 'confirmado',
      asistio: false,
      fecha_invitacion: haceUnaSemana,
      fecha_respuesta: ayer,
    },
    {
      actividad_id: actividadIds[1],
      miembro_id: miembroIds[1],
      responsabilidad_id: responsabilidadesActividadIds[1],
      estado: 'confirmado',
      asistio: false,
      fecha_invitacion: haceUnaSemana,
      fecha_respuesta: ayer,
    },
    {
      actividad_id: actividadIds[1],
      miembro_id: miembroIds[3],
      responsabilidad_id: responsabilidadesActividadIds[5],
      estado: 'pendiente',
      asistio: false,
      fecha_invitacion: ahora,
      fecha_respuesta: null,
    },
    {
      actividad_id: actividadIds[1],
      miembro_id: miembroIds[4],
      responsabilidad_id: responsabilidadesActividadIds[6],
      estado: 'rechazado',
      motivo_rechazo: 'Tengo turno de trabajo ese día',
      asistio: false,
      fecha_invitacion: haceUnaSemana,
      fecha_respuesta: ayer,
    },

    // Actividad 2 (primera escuela dominical)
    {
      actividad_id: actividadIds[2],
      miembro_id: miembroIds[7],
      responsabilidad_id: responsabilidadesActividadIds[4],
      estado: 'confirmado',
      asistio: false,
      fecha_invitacion: haceUnaSemana,
      fecha_respuesta: ayer,
    },
    {
      actividad_id: actividadIds[2],
      miembro_id: miembroIds[3],
      responsabilidad_id: responsabilidadesActividadIds[4],
      estado: 'confirmado',
      asistio: false,
      fecha_invitacion: haceUnaSemana,
      fecha_respuesta: ayer,
    },

    // Actividad 3 (segundo culto martes) - pendientes
    {
      actividad_id: actividadIds[3],
      miembro_id: miembroIds[2],
      responsabilidad_id: responsabilidadesActividadIds[0],
      estado: 'pendiente',
      asistio: false,
      fecha_invitacion: ahora,
      fecha_respuesta: null,
    },
    {
      actividad_id: actividadIds[3],
      miembro_id: miembroIds[1],
      responsabilidad_id: responsabilidadesActividadIds[1],
      estado: 'pendiente',
      asistio: false,
      fecha_invitacion: ahora,
      fecha_respuesta: null,
    },
    {
      actividad_id: actividadIds[3],
      miembro_id: miembroIds[5],
      responsabilidad_id: responsabilidadesActividadIds[3],
      estado: 'pendiente',
      asistio: false,
      fecha_invitacion: ahora,
      fecha_respuesta: null,
    },

    // Confraternidad de Jóvenes (actividad extraordinaria, penúltima)
    {
      actividad_id: actividadIds[actividadIds.length - 3],
      miembro_id: miembroIds[3],
      responsabilidad_id: responsabilidadesActividadIds[8],
      estado: 'confirmado',
      asistio: false,
      fecha_invitacion: haceUnaSemana,
      fecha_respuesta: ayer,
    },
    {
      actividad_id: actividadIds[actividadIds.length - 3],
      miembro_id: miembroIds[4],
      responsabilidad_id: responsabilidadesActividadIds[2],
      estado: 'confirmado',
      asistio: false,
      fecha_invitacion: haceUnaSemana,
      fecha_respuesta: ayer,
    },
    {
      actividad_id: actividadIds[actividadIds.length - 3],
      miembro_id: miembroIds[5],
      responsabilidad_id: responsabilidadesActividadIds[3],
      estado: 'pendiente',
      asistio: false,
      fecha_invitacion: ahora,
      fecha_respuesta: null,
    },
    {
      actividad_id: actividadIds[actividadIds.length - 3],
      miembro_id: miembroIds[8],
      responsabilidad_id: responsabilidadesActividadIds[2],
      estado: 'confirmado',
      asistio: false,
      fecha_invitacion: haceUnaSemana,
      fecha_respuesta: ayer,
    },

    // Santa Cena (penúltima extraordinaria)
    {
      actividad_id: actividadIds[actividadIds.length - 2],
      miembro_id: miembroIds[0],
      responsabilidad_id: responsabilidadesActividadIds[8],
      estado: 'confirmado',
      asistio: false,
      fecha_invitacion: haceUnaSemana,
      fecha_respuesta: ayer,
    },
    {
      actividad_id: actividadIds[actividadIds.length - 2],
      miembro_id: miembroIds[2],
      responsabilidad_id: responsabilidadesActividadIds[0],
      estado: 'confirmado',
      asistio: false,
      fecha_invitacion: haceUnaSemana,
      fecha_respuesta: ayer,
    },
    {
      actividad_id: actividadIds[actividadIds.length - 2],
      miembro_id: miembroIds[7],
      responsabilidad_id: responsabilidadesActividadIds[7],
      estado: 'pendiente',
      asistio: false,
      fecha_invitacion: ahora,
      fecha_respuesta: null,
    },
  ]);
}

// ─── 10. NECESIDADES LOGÍSTICAS ──────────────────────────────────────────────

async function seedNecesidadesLogisticas(
  actividadIds: number[],
  tiposNecesidadIds: number[],
): Promise<number[]> {
  if (await tableHasData('necesidad_logistica')) {
    console.log('  ⏭  necesidad_logistica: ya tiene registros, omitiendo');
    const { data } = await supabase.from('necesidad_logistica').select('id');
    resumen.necesidad_logistica = 0;
    return (data || []).map((r) => r.id as number);
  }

  // tiposNecesidadIds: [0]=Transporte, [1]=Alimentación, [2]=Hospedaje, [3]=Materiales,
  //                    [4]=Equipos, [5]=Decoración, [6]=Aseo y Ornato
  return insertRecords('necesidad_logistica', [
    // Confraternidad de Jóvenes
    {
      actividad_id: actividadIds[actividadIds.length - 3],
      tipo_necesidad_id: tiposNecesidadIds[0], // Transporte
      descripcion: 'Bus para trasladar jóvenes al gimnasio municipal',
      cantidad_requerida: 1,
      unidad_medida: 'vehículos',
      cantidad_cubierta: 0,
      estado: 'abierta',
    },
    {
      actividad_id: actividadIds[actividadIds.length - 3],
      tipo_necesidad_id: tiposNecesidadIds[1], // Alimentación
      descripcion: 'Colaciones y bebidas para 40 jóvenes',
      cantidad_requerida: 40,
      unidad_medida: 'porciones',
      cantidad_cubierta: 15,
      estado: 'abierta',
    },
    {
      actividad_id: actividadIds[actividadIds.length - 3],
      tipo_necesidad_id: tiposNecesidadIds[4], // Equipos
      descripcion: 'Equipo de sonido portátil para alabanza',
      cantidad_requerida: 1,
      unidad_medida: 'equipos',
      cantidad_cubierta: 1,
      estado: 'cubierta',
    },
    // Santa Cena
    {
      actividad_id: actividadIds[actividadIds.length - 2],
      tipo_necesidad_id: tiposNecesidadIds[1], // Alimentación
      descripcion: 'Pan sin levadura para la Santa Cena',
      cantidad_requerida: 5,
      unidad_medida: 'unidades',
      cantidad_cubierta: 0,
      estado: 'abierta',
    },
    {
      actividad_id: actividadIds[actividadIds.length - 2],
      tipo_necesidad_id: tiposNecesidadIds[1], // Alimentación
      descripcion: 'Jugo de uva para la Santa Cena',
      cantidad_requerida: 3,
      unidad_medida: 'litros',
      cantidad_cubierta: 0,
      estado: 'abierta',
    },
    // Predicación Sector Norte
    {
      actividad_id: actividadIds[actividadIds.length - 1],
      tipo_necesidad_id: tiposNecesidadIds[3], // Materiales
      descripcion: 'Folletos evangelísticos para repartir',
      cantidad_requerida: 200,
      unidad_medida: 'unidades',
      cantidad_cubierta: 200,
      estado: 'cubierta',
    },
    {
      actividad_id: actividadIds[actividadIds.length - 1],
      tipo_necesidad_id: tiposNecesidadIds[0], // Transporte
      descripcion: 'Vehículos para traslado del equipo evangelístico',
      cantidad_requerida: 2,
      unidad_medida: 'vehículos',
      cantidad_cubierta: 1,
      estado: 'abierta',
    },
  ]);
}

// ─── 11. COLABORADORES ───────────────────────────────────────────────────────

async function seedColaboradores(necesidadIds: number[], miembroIds: number[]): Promise<void> {
  if (await tableHasData('colaborador')) {
    console.log('  ⏭  colaborador: ya tiene registros, omitiendo');
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

    // Confraternidad - Alimentación (necesidadIds[1])
    {
      necesidad_id: necesidadIds[1],
      miembro_id: miembroIds[7],
      cantidad_ofrecida: 10,
      observaciones: 'Puedo preparar 10 sándwiches',
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

    // Predicación - Transporte (necesidadIds[6])
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

    // Más pendientes
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

// ─── EJECUCIÓN PRINCIPAL ─────────────────────────────────────────────────────

export async function runSeeds(): Promise<void> {
  console.log('\n?? Iniciando seeds de base de datos...\n');
  console.log('--- 1. Cat�logos ---');

  try {
    const tiposActividadIds = await seedTiposActividad();
    const responsabilidadesActividadIds = await seedResponsabilidadesActividad();
    const rolesGrupoIds = await seedRolesGrupo();
    const tiposNecesidadIds = await seedTiposNecesidad();

    console.log('\n--- 2. Miembros ---');
    const miembroIds = await seedMiembros();

    console.log('\n--- 3. Usuarios ---');
    const usuarioIds = await seedUsuarios(miembroIds);

    console.log('\n--- 4. Grupos Ministeriales ---');
    const grupoIds = await seedGruposMinisteriales(miembroIds);

    console.log('\n--- 5. Integrante Grupo ---');
    await seedIntegranteGrupo(miembroIds, grupoIds, rolesGrupoIds);

    console.log('\n--- 6. Historial Estado ---');
    await seedHistorialEstado(miembroIds, usuarioIds);

    console.log('\n--- 7. Patrones de Actividad ---');
    const patronIds = await seedPatronesActividad(tiposActividadIds, grupoIds);

    console.log('\n--- 8. Actividades ---');
    const actividadIds = await seedActividades(tiposActividadIds, patronIds, grupoIds, usuarioIds);

    console.log('\n--- 9. Invitados ---');
    await seedInvitados(actividadIds, miembroIds, responsabilidadesActividadIds);

    console.log('\n--- 10. Necesidades Log�sticas ---');
    const necesidadIds = await seedNecesidadesLogisticas(actividadIds, tiposNecesidadIds);

    console.log('\n--- 11. Colaboradores ---');
    await seedColaboradores(necesidadIds, miembroIds);

    // Resumen final
    console.log('\n------------------------------------------');
    console.log('  ?? RESUMEN DE SEEDS');
    console.log('------------------------------------------');
    let totalInsertados = 0;
    for (const [tabla, count] of Object.entries(resumen)) {
      if (count > 0) {
        console.log(`  ? ${tabla}: ${count} registros`);
        totalInsertados += count;
      } else {
        console.log(`  ?  ${tabla}: omitido (ya exist�a)`);
      }
    }
    console.log('------------------------------------------');
    console.log(`  ?? Total insertados: ${totalInsertados} registros`);
    console.log('------------------------------------------\n');
  } catch (error) {
    console.error(`\n? Error en seeds: ${(error as Error).message}\n`);
    process.exit(1);
  }
}

// Ejecuci�n directa: pnpm seed
runSeeds();


