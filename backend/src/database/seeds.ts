import bcrypt from 'bcryptjs';
import dayjs from 'dayjs';
import { supabase } from '@/common/utils/supabaseClient';

const SALT_ROUNDS = 10;

const resumen: Record<string, number> = {};

// ─── Helpers ─────────────────────────────────────────────────────────────────

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

async function tableHasData(tableName: string): Promise<boolean> {
  const { count, error } = await supabase
    .from(tableName)
    .select('*', { count: 'exact', head: true });
  if (error) throw new Error(`Error al verificar ${tableName}: ${error.message}`);
  return (count ?? 0) > 0;
}

function futureDate(daysFromNow: number): string {
  return dayjs().add(daysFromNow, 'day').format('YYYY-MM-DD');
}

function pastDate(daysAgo: number): string {
  return dayjs().subtract(daysAgo, 'day').format('YYYY-MM-DD');
}

/**
 * Retorna las últimas N fechas en que ocurrió el día de semana indicado (antes de hoy).
 * dayOfWeek: 0=Domingo, 1=Lunes, ..., 6=Sábado
 * Retorna las fechas de más antigua a más reciente.
 */
function lastNOccurrences(dayOfWeek: number, n: number): string[] {
  const dates: string[] = [];
  let d = dayjs().subtract(1, 'day');
  while (dates.length < n) {
    if (d.day() === dayOfWeek) dates.push(d.format('YYYY-MM-DD'));
    d = d.subtract(1, 'day');
  }
  return dates.reverse(); // oldest first
}

// ─── 1. CATÁLOGOS ─────────────────────────────────────────────────────────────

async function seedTiposActividad(): Promise<number[]> {
  return seedIfEmpty(
    'tipo_actividad',
    [
      // [0]
      {
        nombre: 'Culto / Reunión General',
        descripcion:
          'Servicio principal de adoración y predicación, abierto a toda la congregación y visitas',
        color: '#3B82F6',
        activo: true,
      },
      // [1]
      {
        nombre: 'Predicación a la Calle (Misión)',
        descripcion:
          'Actividad evangelística realizada al aire libre, en plazas o sectores específicos para predicar el evangelio',
        color: '#06B6D4',
        activo: true,
      },
      // [2]
      {
        nombre: 'Escuela Dominical',
        descripcion:
          'Reunión de carácter educativo enfocada en la enseñanza y el estudio sistemático de las Escrituras por clases',
        color: '#10B981',
        activo: true,
      },
      // [3]
      {
        nombre: 'Reunión de Cuerpo',
        descripcion:
          'Culto o reunión específica orientada al trabajo espiritual de un grupo particular',
        color: '#8B5CF6',
        activo: true,
      },
      // [4]
      {
        nombre: 'Vigilia / Cadena de Oración',
        descripcion:
          'Servicios especiales de consagración, búsqueda espiritual y oración prolongada',
        color: '#A855F7',
        activo: true,
      },
      // [5]
      {
        nombre: 'Estudio Bíblico',
        descripcion: 'Reunión enfocada en la instrucción doctrinal de los miembros',
        color: '#F59E0B',
        activo: true,
      },
      // [6]
      {
        nombre: 'Servicio Especial / Ceremonia',
        descripcion:
          'Eventos eclesiásticos particulares como velatorios, funerales, matrimonios o bautismos',
        color: '#EC4899',
        activo: true,
      },
    ],
    'id_tipo',
  );
}

async function seedResponsabilidadesActividad(): Promise<number[]> {
  return seedIfEmpty(
    'responsabilidad_actividad',
    [
      // [0]
      {
        nombre: 'Presidir / Coordinador',
        descripcion: 'Quien dirige el orden del culto o evento',
        activo: true,
      },
      // [1]
      {
        nombre: 'Predicar',
        descripcion: 'Quien entrega el mensaje o exhortación de la Palabra',
        activo: true,
      },
      // [2]
      {
        nombre: 'Portero',
        descripcion: 'Encargado de la recepción en la puerta de la iglesia o local',
        activo: true,
      },
      // [3]
      {
        nombre: 'Vigilante',
        descripcion: 'Encargado de la seguridad y orden durante el evento',
        activo: true,
      },
      // [4]
      {
        nombre: 'Ofrendero',
        descripcion: 'Encargado de recolectar las ofrendas durante el servicio',
        activo: true,
      },
      // [5]
      {
        nombre: 'Director de Alabanza / Coro',
        descripcion: 'Quien dirige los himnos y cánticos',
        activo: true,
      },
      // [6]
      {
        nombre: 'Lectura Bíblica',
        descripcion: 'Hermano asignado específicamente para leer la porción bíblica del día',
        activo: true,
      },
    ],
    'id_responsabilidad',
  );
}

async function seedRolesGrupo(): Promise<number[]> {
  return seedIfEmpty(
    'rol_grupo',
    [
      // [0] Directiva
      {
        nombre: 'Jefe de Cuerpo / Presidente',
        requiere_plena_comunion: true,
        es_unico: true,
        es_directiva: true,
        activo: true,
      },
      // [1] Directiva
      {
        nombre: 'Secretario',
        requiere_plena_comunion: true,
        es_unico: true,
        es_directiva: true,
        activo: true,
      },
      // [2] Directiva
      {
        nombre: 'Tesorero',
        requiere_plena_comunion: true,
        es_unico: true,
        es_directiva: true,
        activo: true,
      },
      // [3] Directiva
      {
        nombre: 'Ayudante de Jefe / Vicepresidente',
        requiere_plena_comunion: true,
        es_unico: true,
        es_directiva: true,
        activo: true,
      },
      // [4] Espiritual/Oficial
      {
        nombre: 'Guía de Clase',
        requiere_plena_comunion: true,
        es_unico: true,
        es_directiva: false,
        activo: true,
      },
      // [5] Espiritual/Oficial
      {
        nombre: 'Predicador del Altar',
        requiere_plena_comunion: true,
        es_unico: true,
        es_directiva: false,
        activo: true,
      },
      // [6] No directiva
      {
        nombre: 'Integrante',
        requiere_plena_comunion: false,
        es_unico: false,
        es_directiva: false,
        activo: true,
      },
    ],
    'id_rol_grupo',
  );
}

async function seedTiposNecesidad(): Promise<number[]> {
  return seedIfEmpty(
    'tipo_necesidad',
    [
      // [0]
      { nombre: 'Transporte', descripcion: 'Necesidad de transporte o vehículos', activo: true },
      // [1]
      { nombre: 'Alimentación', descripcion: 'Provisión de alimentos y bebidas', activo: true },
      // [2]
      { nombre: 'Hospedaje', descripcion: 'Alojamiento para participantes', activo: true },
      // [3]
      { nombre: 'Materiales', descripcion: 'Materiales de apoyo y suministros', activo: true },
      // [4]
      { nombre: 'Equipos', descripcion: 'Equipos técnicos o audiovisuales', activo: true },
      // [5]
      { nombre: 'Decoración', descripcion: 'Decoración del lugar', activo: true },
      // [6]
      { nombre: 'Aseo y Ornato', descripcion: 'Limpieza y ornamentación', activo: true },
    ],
    'id_tipo',
  );
}

// ─── 2. MIEMBROS ─────────────────────────────────────────────────────────────

async function seedMiembros(): Promise<number[]> {
  const miembrosBase = [
    // [0] Admin - masculino, plena_comunion
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
      fecha_ingreso: '2018-01-15',
      activo: true,
    },
    // [1] femenino, plena_comunion
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
      fecha_ingreso: '2018-06-10',
      activo: true,
    },
    // [2] masculino, plena_comunion
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
    // [3] femenino, plena_comunion
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
    // [4] masculino, probando
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
    // [5] femenino, probando
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
    // [6] masculino, asistente
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
    // [7] femenino, plena_comunion
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
    // [8] masculino, plena_comunion
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
    // [9] femenino, asistente
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
  ];

  const miembrosConCuenta = await Promise.all(
    miembrosBase.map(async (miembro, index) => {
      const rutBase = String(miembro.rut).split('-')[0] ?? '';
      const password = rutBase.slice(0, 4);
      const password_hash = await bcrypt.hash(password, SALT_ROUNDS);
      return {
        ...miembro,
        rol: index === 0 ? 'administrador' : 'usuario',
        password_hash,
        fecha_creacion: new Date().toISOString(),
      };
    }),
  );

  return seedIfEmpty('miembro', miembrosConCuenta);
}

// ─── 3. GRUPOS MINISTERIALES ─────────────────────────────────────────────────

async function seedGruposMinisteriales(): Promise<number[]> {
  return seedIfEmpty(
    'grupo',
    [
      // [0]
      {
        nombre: 'Cuerpo de Voluntarios',
        descripcion: 'Cuerpo de hombres casados o mayores',
        fecha_creacion: '2018-01-01',
        activo: true,
      },
      // [1]
      {
        nombre: 'Cuerpo de Dorcas',
        descripcion: 'Comité Femenil de Damas',
        fecha_creacion: '2018-01-01',
        activo: true,
      },
      // [2]
      {
        nombre: 'Cuerpo de Jóvenes',
        descripcion: 'Ministerio de hombres solteros',
        fecha_creacion: '2019-03-10',
        activo: true,
      },
      // [3]
      {
        nombre: 'Cuerpo de Señoritas',
        descripcion: 'Ministerio de mujeres solteras',
        fecha_creacion: '2019-05-20',
        activo: true,
      },
      // [4]
      {
        nombre: 'Cuerpo de Ciclistas',
        descripcion: 'Ministerio de evangelismo en zonas rurales y alejadas',
        fecha_creacion: '2021-08-15',
        activo: true,
      },
      // [5]
      {
        nombre: 'Coro Oficial',
        descripcion: 'Coro oficial de la iglesia, encargado de la alabanza en cultos',
        fecha_creacion: '2019-06-15',
        activo: true,
      },
      // [6]
      {
        nombre: 'Coro Juvenil',
        descripcion: 'Coro juvenil para alabanza en actividades de jóvenes',
        fecha_creacion: '2022-09-01',
        activo: true,
      },
      // [7]
      {
        nombre: 'Congregación General',
        descripcion: 'Grupo por defecto para actividades de toda la iglesia',
        fecha_creacion: '2018-01-01',
        activo: true,
      },
    ],
    'id_grupo',
  );
}

// ─── 4. GRUPO_ROL (roles habilitados por grupo) ──────────────────────────────

async function seedGrupoRol(grupoIds: number[], rolesGrupoIds: number[]): Promise<void> {
  if (await tableHasData('grupo_rol')) {
    console.log('  ⏭  grupo_rol: ya tiene registros, omitiendo');
    resumen.grupo_rol = 0;
    return;
  }

  // Habilitar todos los roles en todos los grupos
  const entries: Record<string, unknown>[] = [];
  for (const grupoId of grupoIds) {
    for (const rolId of rolesGrupoIds) {
      entries.push({ grupo_id: grupoId, rol_grupo_id: rolId });
    }
  }

  const { error } = await supabase.from('grupo_rol').insert(entries);
  if (error) throw new Error(`Error al insertar en grupo_rol: ${error.message}`);
  console.log(`  ✅ grupo_rol: ${entries.length} registros insertados`);
  resumen.grupo_rol = entries.length;
}

// ─── 5. INTEGRANTE GRUPO ─────────────────────────────────────────────────────

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

  // rolesGrupoIds: [0]=Jefe/Pres, [1]=Secretario, [2]=Tesorero, [3]=Ayudante/VP,
  //               [4]=Guía Clase, [5]=Pred.Altar, [6]=Integrante
  // grupoIds: [0]=Voluntarios, [1]=Dorcas, [2]=Jóvenes, [3]=Señoritas,
  //           [4]=Ciclistas, [5]=Coro Oficial, [6]=Coro Juvenil, [7]=Congregación

  return insertRecords(
    'integrante_grupo',
    [
      // Cuerpo de Voluntarios [0]
      {
        miembro_id: miembroIds[0],
        grupo_id: grupoIds[0],
        rol_grupo_id: rolesGrupoIds[0],
        fecha_vinculacion: '2018-01-01T00:00:00Z',
      }, // Carlos - Jefe
      {
        miembro_id: miembroIds[2],
        grupo_id: grupoIds[0],
        rol_grupo_id: rolesGrupoIds[1],
        fecha_vinculacion: '2018-03-20T00:00:00Z',
      }, // Pedro - Secretario
      {
        miembro_id: miembroIds[8],
        grupo_id: grupoIds[0],
        rol_grupo_id: rolesGrupoIds[2],
        fecha_vinculacion: '2022-04-05T00:00:00Z',
      }, // Javier - Tesorero
      {
        miembro_id: miembroIds[6],
        grupo_id: grupoIds[0],
        rol_grupo_id: rolesGrupoIds[6],
        fecha_vinculacion: '2025-01-10T00:00:00Z',
      }, // Roberto - Integrante

      // Cuerpo de Dorcas [1]
      {
        miembro_id: miembroIds[1],
        grupo_id: grupoIds[1],
        rol_grupo_id: rolesGrupoIds[0],
        fecha_vinculacion: '2018-01-01T00:00:00Z',
      }, // María - Jefa
      {
        miembro_id: miembroIds[7],
        grupo_id: grupoIds[1],
        rol_grupo_id: rolesGrupoIds[1],
        fecha_vinculacion: '2017-11-20T00:00:00Z',
      }, // Patricia - Secretaria
      {
        miembro_id: miembroIds[3],
        grupo_id: grupoIds[1],
        rol_grupo_id: rolesGrupoIds[6],
        fecha_vinculacion: '2021-08-12T00:00:00Z',
      }, // Ana - Integrante
      {
        miembro_id: miembroIds[5],
        grupo_id: grupoIds[1],
        rol_grupo_id: rolesGrupoIds[6],
        fecha_vinculacion: '2024-06-15T00:00:00Z',
      }, // Daniela - Integrante

      // Cuerpo de Jóvenes [2]
      {
        miembro_id: miembroIds[4],
        grupo_id: grupoIds[2],
        rol_grupo_id: rolesGrupoIds[0],
        fecha_vinculacion: '2024-02-01T00:00:00Z',
      }, // Luis - Jefe
      {
        miembro_id: miembroIds[8],
        grupo_id: grupoIds[2],
        rol_grupo_id: rolesGrupoIds[1],
        fecha_vinculacion: '2022-04-05T00:00:00Z',
      }, // Javier - Secretario
      {
        miembro_id: miembroIds[6],
        grupo_id: grupoIds[2],
        rol_grupo_id: rolesGrupoIds[6],
        fecha_vinculacion: '2025-01-10T00:00:00Z',
      }, // Roberto - Integrante

      // Cuerpo de Señoritas [3]
      {
        miembro_id: miembroIds[3],
        grupo_id: grupoIds[3],
        rol_grupo_id: rolesGrupoIds[0],
        fecha_vinculacion: '2021-08-12T00:00:00Z',
      }, // Ana - Jefa
      {
        miembro_id: miembroIds[5],
        grupo_id: grupoIds[3],
        rol_grupo_id: rolesGrupoIds[1],
        fecha_vinculacion: '2024-06-15T00:00:00Z',
      }, // Daniela - Secretaria
      {
        miembro_id: miembroIds[9],
        grupo_id: grupoIds[3],
        rol_grupo_id: rolesGrupoIds[6],
        fecha_vinculacion: '2025-11-01T00:00:00Z',
      }, // Camila - Integrante

      // Cuerpo de Ciclistas [4]
      {
        miembro_id: miembroIds[2],
        grupo_id: grupoIds[4],
        rol_grupo_id: rolesGrupoIds[0],
        fecha_vinculacion: '2021-08-15T00:00:00Z',
      }, // Pedro - Jefe
      {
        miembro_id: miembroIds[0],
        grupo_id: grupoIds[4],
        rol_grupo_id: rolesGrupoIds[6],
        fecha_vinculacion: '2021-08-15T00:00:00Z',
      }, // Carlos - Integrante
      {
        miembro_id: miembroIds[6],
        grupo_id: grupoIds[4],
        rol_grupo_id: rolesGrupoIds[6],
        fecha_vinculacion: '2025-01-10T00:00:00Z',
      }, // Roberto - Integrante

      // Coro Oficial [5]
      {
        miembro_id: miembroIds[1],
        grupo_id: grupoIds[5],
        rol_grupo_id: rolesGrupoIds[0],
        fecha_vinculacion: '2019-06-15T00:00:00Z',
      }, // María - Jefa
      {
        miembro_id: miembroIds[3],
        grupo_id: grupoIds[5],
        rol_grupo_id: rolesGrupoIds[6],
        fecha_vinculacion: '2021-09-01T00:00:00Z',
      }, // Ana - Integrante
      {
        miembro_id: miembroIds[8],
        grupo_id: grupoIds[5],
        rol_grupo_id: rolesGrupoIds[6],
        fecha_vinculacion: '2022-05-10T00:00:00Z',
      }, // Javier - Integrante
      {
        miembro_id: miembroIds[5],
        grupo_id: grupoIds[5],
        rol_grupo_id: rolesGrupoIds[6],
        fecha_vinculacion: '2024-08-01T00:00:00Z',
      }, // Daniela - Integrante

      // Coro Juvenil [6]
      {
        miembro_id: miembroIds[4],
        grupo_id: grupoIds[6],
        rol_grupo_id: rolesGrupoIds[0],
        fecha_vinculacion: '2022-09-01T00:00:00Z',
      }, // Luis - Jefe
      {
        miembro_id: miembroIds[5],
        grupo_id: grupoIds[6],
        rol_grupo_id: rolesGrupoIds[1],
        fecha_vinculacion: '2022-09-01T00:00:00Z',
      }, // Daniela - Secretaria
      {
        miembro_id: miembroIds[9],
        grupo_id: grupoIds[6],
        rol_grupo_id: rolesGrupoIds[6],
        fecha_vinculacion: '2025-11-01T00:00:00Z',
      }, // Camila - Integrante

      // Congregación General [7]
      {
        miembro_id: miembroIds[0],
        grupo_id: grupoIds[7],
        rol_grupo_id: rolesGrupoIds[6],
        fecha_vinculacion: '2018-01-01T00:00:00Z',
      },
      {
        miembro_id: miembroIds[1],
        grupo_id: grupoIds[7],
        rol_grupo_id: rolesGrupoIds[6],
        fecha_vinculacion: '2018-01-01T00:00:00Z',
      },
      {
        miembro_id: miembroIds[2],
        grupo_id: grupoIds[7],
        rol_grupo_id: rolesGrupoIds[6],
        fecha_vinculacion: '2018-01-01T00:00:00Z',
      },
      {
        miembro_id: miembroIds[7],
        grupo_id: grupoIds[7],
        rol_grupo_id: rolesGrupoIds[6],
        fecha_vinculacion: '2018-01-01T00:00:00Z',
      },
    ],
    'id_integrante',
  );
}

// ─── 5. HISTORIAL ESTADO ─────────────────────────────────────────────────────

async function seedHistorialEstado(miembroIds: number[], adminId: number): Promise<void> {
  if (await tableHasData('historial_estado')) {
    console.log('  ⏭  historial_estado: ya tiene registros, omitiendo');
    resumen.historial_estado = 0;
    return;
  }

  await insertRecords('historial_estado', [
    {
      miembro_id: miembroIds[4],
      estado_anterior: 'asistente',
      estado_nuevo: 'probando',
      motivo:
        'El hermano Luis ha asistido regularmente durante 6 meses y desea iniciar su período de prueba',
      usuario_id: adminId,
    },
    {
      miembro_id: miembroIds[5],
      estado_anterior: 'asistente',
      estado_nuevo: 'probando',
      motivo:
        'La hermana Daniela ha participado activamente en el grupo de jóvenes y solicita iniciar período de prueba',
      usuario_id: adminId,
    },
    {
      miembro_id: miembroIds[3],
      estado_anterior: 'probando',
      estado_nuevo: 'plena_comunion',
      motivo:
        'La hermana Ana completó satisfactoriamente su período de prueba y fue aprobada por la junta de oficiales',
      usuario_id: adminId,
    },
  ]);
}

// ─── 6. PATRONES DE ACTIVIDAD ────────────────────────────────────────────────

async function seedPatronesActividad(
  tiposActividadIds: number[],
  grupoIds: number[],
): Promise<number[]> {
  // tiposActividadIds: [0]=Culto, [1]=Pred.Calle, [2]=Esc.Dom, [3]=Reunión Cuerpo,
  //                   [4]=Vigilia, [5]=Estudio Bíblico, [6]=Serv.Especial
  // grupoIds: [0]=Voluntarios, [1]=Dorcas, [2]=Jóvenes, [3]=Señoritas,
  //           [4]=Ciclistas, [5]=Coro Oficial, [6]=Coro Juvenil, [7]=Congregación
  return seedIfEmpty('patron_actividad', [
    // [0] Culto Martes
    {
      nombre: 'Culto Martes',
      tipo_actividad_id: tiposActividadIds[0],
      frecuencia: 'semanal',
      dia_semana: 2,
      hora_inicio: '19:00:00',
      duracion_minutos: 120,
      lugar: 'Templo Central',
      grupo_id: null,
      es_publica: true,
      activo: true,
    },
    // [1] Culto Domingo
    {
      nombre: 'Culto Domingo',
      tipo_actividad_id: tiposActividadIds[0],
      frecuencia: 'semanal',
      dia_semana: 7,
      hora_inicio: '16:00:00',
      duracion_minutos: 120,
      lugar: 'Templo Central',
      grupo_id: null,
      es_publica: true,
      activo: true,
    },
    // [2] Escuela Dominical
    {
      nombre: 'Escuela Dominical',
      tipo_actividad_id: tiposActividadIds[2],
      frecuencia: 'semanal',
      dia_semana: 7,
      hora_inicio: '09:00:00',
      duracion_minutos: 50,
      lugar: 'Salón Educacional',
      grupo_id: null,
      es_publica: false,
      activo: true,
    },
    // [3] Reunión Dorcas
    {
      nombre: 'Reunión Cuerpo de Dorcas',
      tipo_actividad_id: tiposActividadIds[3],
      frecuencia: 'semanal',
      dia_semana: 4,
      hora_inicio: '18:00:00',
      duracion_minutos: 90,
      lugar: 'Salón Auxiliar',
      grupo_id: grupoIds[1],
      es_publica: false,
      activo: true,
    },
    // [4] Reunión Voluntarios
    {
      nombre: 'Reunión Cuerpo de Voluntarios',
      tipo_actividad_id: tiposActividadIds[3],
      frecuencia: 'semanal',
      dia_semana: 3,
      hora_inicio: '19:00:00',
      duracion_minutos: 90,
      lugar: 'Salón Auxiliar',
      grupo_id: grupoIds[0],
      es_publica: false,
      activo: true,
    },
    // [5] Estudio Bíblico
    {
      nombre: 'Estudio Bíblico Semanal',
      tipo_actividad_id: tiposActividadIds[5],
      frecuencia: 'semanal',
      dia_semana: 4,
      hora_inicio: '19:30:00',
      duracion_minutos: 60,
      lugar: 'Templo Central',
      grupo_id: null,
      es_publica: false,
      activo: true,
    },
    // [6] Vigilia Mensual
    {
      nombre: 'Vigilia Mensual',
      tipo_actividad_id: tiposActividadIds[4],
      frecuencia: 'cuarta_semana',
      dia_semana: 5,
      hora_inicio: '21:00:00',
      duracion_minutos: 180,
      lugar: 'Templo Central',
      grupo_id: null,
      es_publica: false,
      activo: true,
    },
    // [7] Predicación a la Calle
    {
      nombre: 'Predicación a la Calle',
      tipo_actividad_id: tiposActividadIds[1],
      frecuencia: 'semanal',
      dia_semana: 6,
      hora_inicio: '10:00:00',
      duracion_minutos: 120,
      lugar: 'Sector Variable',
      grupo_id: grupoIds[4],
      es_publica: false,
      activo: true,
    },
  ]);
}

// ─── 7. ACTIVIDADES ──────────────────────────────────────────────────────────
//
// Índices fijos de actividades pasadas:
//  [0-5]  : 6 Cultos Martes  (realizados)
//  [6-11] : 6 Cultos Domingo (realizados)
//  [12-14]: 3 Escuelas Dominicales (realizadas)
//  [15-17]: 3 Reuniones Dorcas - jueves (realizadas)
//  [18-20]: 3 Reuniones Voluntarios - miércoles (realizadas)
//  [21-23]: 3 Estudios Bíblicos - jueves (realizados)
//  [24]   : Vigilia pasada (realizada)
//  [25]   : Matrimonio pasado (realizado)
//  [26-28]: 3 Predicaciones a la Calle - sábado (realizadas)
//  [29]   : Actividad CANCELADA (reunión jóvenes)
//  [30]   : Actividad REPROGRAMADA (reemplazo de [29])
//  [31+]  : Actividades futuras (loop dinámico + extraordinarias al final)

async function seedActividades(
  tiposActividadIds: number[],
  patronIds: number[],
  grupoIds: number[],
  creadorId: number,
): Promise<number[]> {
  if (await tableHasData('actividad')) {
    console.log('  ⏭  actividad: ya tiene registros, omitiendo');
    const { data } = await supabase.from('actividad').select('id');
    resumen.actividad = 0;
    return (data || []).map((r) => r.id as number);
  }

  const actividades: Record<string, unknown>[] = [];

  // ── PASADAS: últimos 6 martes (cultos realizados) ──
  for (const fecha of lastNOccurrences(2, 6)) {
    actividades.push({
      patron_id: patronIds[0],
      tipo_actividad_id: tiposActividadIds[0],
      nombre: `Culto Martes ${dayjs(fecha).format('DD/MM/YYYY')}`,
      descripcion: 'Servicio de culto regular del día martes',
      fecha,
      hora_inicio: '19:00:00',
      hora_fin: '21:00:00',
      grupo_id: null,
      es_publica: true,
      estado: 'realizada',
      creador_id: creadorId,
    });
  }

  // ── PASADAS: últimos 6 domingos (cultos realizados) ──
  for (const fecha of lastNOccurrences(0, 6)) {
    actividades.push({
      patron_id: patronIds[1],
      tipo_actividad_id: tiposActividadIds[0],
      nombre: `Culto Domingo ${dayjs(fecha).format('DD/MM/YYYY')}`,
      descripcion: 'Servicio de culto dominical',
      fecha,
      hora_inicio: '16:00:00',
      hora_fin: '18:00:00',
      grupo_id: null,
      es_publica: true,
      estado: 'realizada',
      creador_id: creadorId,
    });
  }

  // ── PASADAS: últimas 3 escuelas dominicales ──
  for (const fecha of lastNOccurrences(0, 3)) {
    actividades.push({
      patron_id: patronIds[2],
      tipo_actividad_id: tiposActividadIds[2],
      nombre: `Escuela Dominical ${dayjs(fecha).format('DD/MM/YYYY')}`,
      descripcion: 'Clase de enseñanza bíblica dominical',
      fecha,
      hora_inicio: '09:00:00',
      hora_fin: '09:50:00',
      grupo_id: null,
      es_publica: false,
      estado: 'realizada',
      creador_id: creadorId,
    });
  }

  // ── PASADAS: últimas 3 reuniones Dorcas (jueves) ──
  const pastJueves = lastNOccurrences(4, 3);
  for (const fecha of pastJueves) {
    actividades.push({
      patron_id: patronIds[3],
      tipo_actividad_id: tiposActividadIds[3],
      nombre: `Reunión Cuerpo de Dorcas ${dayjs(fecha).format('DD/MM/YYYY')}`,
      descripcion: 'Reunión semanal del Cuerpo de Dorcas',
      fecha,
      hora_inicio: '18:00:00',
      hora_fin: '19:30:00',
      grupo_id: grupoIds[1],
      es_publica: false,
      estado: 'realizada',
      creador_id: creadorId,
    });
  }

  // ── PASADAS: últimas 3 reuniones Voluntarios (miércoles) ──
  for (const fecha of lastNOccurrences(3, 3)) {
    actividades.push({
      patron_id: patronIds[4],
      tipo_actividad_id: tiposActividadIds[3],
      nombre: `Reunión Cuerpo de Voluntarios ${dayjs(fecha).format('DD/MM/YYYY')}`,
      descripcion: 'Reunión semanal del Cuerpo de Voluntarios',
      fecha,
      hora_inicio: '19:00:00',
      hora_fin: '20:30:00',
      grupo_id: grupoIds[0],
      es_publica: false,
      estado: 'realizada',
      creador_id: creadorId,
    });
  }

  // ── PASADAS: últimos 3 estudios bíblicos (jueves, mismas fechas que Dorcas pero hora distinta) ──
  for (const fecha of pastJueves) {
    actividades.push({
      patron_id: patronIds[5],
      tipo_actividad_id: tiposActividadIds[5],
      nombre: `Estudio Bíblico ${dayjs(fecha).format('DD/MM/YYYY')}`,
      descripcion: 'Estudio bíblico semanal de doctrina',
      fecha,
      hora_inicio: '19:30:00',
      hora_fin: '20:30:00',
      grupo_id: null,
      es_publica: false,
      estado: 'realizada',
      creador_id: creadorId,
    });
  }

  // ── PASADA: Vigilia mensual (hace ~4 semanas) — index [24] ──
  actividades.push({
    patron_id: patronIds[6],
    tipo_actividad_id: tiposActividadIds[4],
    nombre: `Vigilia de Oración ${dayjs().subtract(4, 'week').format('DD/MM/YYYY')}`,
    descripcion: 'Vigilia mensual de oración y consagración espiritual',
    fecha: pastDate(28),
    hora_inicio: '21:00:00',
    hora_fin: '23:59:00',
    grupo_id: null,
    es_publica: false,
    estado: 'realizada',
    creador_id: creadorId,
  });

  // ── PASADA: Matrimonio / Ceremonia (hace ~5 semanas) — index [25] ──
  actividades.push({
    patron_id: null,
    tipo_actividad_id: tiposActividadIds[6],
    nombre: 'Ceremonia de Matrimonio - Hernández & Vega',
    descripcion: 'Ceremonia de matrimonio cristiano celebrada en el templo',
    fecha: pastDate(35),
    hora_inicio: '16:00:00',
    hora_fin: '18:30:00',
    grupo_id: null,
    es_publica: true,
    estado: 'realizada',
    creador_id: creadorId,
  });

  // ── PASADAS: últimas 3 predicaciones a la calle (sábados) — índices [26-28] ──
  for (const fecha of lastNOccurrences(6, 3)) {
    actividades.push({
      patron_id: patronIds[7],
      tipo_actividad_id: tiposActividadIds[1],
      nombre: `Predicación a la Calle ${dayjs(fecha).format('DD/MM/YYYY')}`,
      descripcion: 'Evangelización en sector de Santa Juana',
      fecha,
      hora_inicio: '10:00:00',
      hora_fin: '12:00:00',
      grupo_id: grupoIds[4],
      es_publica: false,
      estado: 'realizada',
      creador_id: creadorId,
    });
  }

  // ── CANCELADA (hace ~2 semanas) — index [29] ──
  const canceladaIndex = actividades.length; // should be 29
  actividades.push({
    patron_id: null,
    tipo_actividad_id: tiposActividadIds[3],
    nombre: 'Reunión Especial Cuerpo de Jóvenes - CANCELADA',
    descripcion: 'Reunión especial del Cuerpo de Jóvenes para planificación del trimestre',
    fecha: pastDate(14),
    hora_inicio: '19:00:00',
    hora_fin: '21:00:00',
    grupo_id: grupoIds[2],
    es_publica: false,
    estado: 'cancelada',
    motivo_cancelacion:
      'Por corte de suministro eléctrico programado en el sector. Se reagenda para la próxima semana.',
    creador_id: creadorId,
  });

  // ── REPROGRAMADA (futuro, reemplazo de [29]) — index [30] ──
  const replacementIndex = actividades.length; // should be 30
  actividades.push({
    patron_id: null,
    tipo_actividad_id: tiposActividadIds[3],
    nombre: 'Reunión Especial Cuerpo de Jóvenes (Reprogramada)',
    descripcion:
      'Reunión especial del Cuerpo de Jóvenes para planificación del trimestre (reprogramada)',
    fecha: futureDate(7),
    hora_inicio: '19:00:00',
    hora_fin: '21:00:00',
    grupo_id: grupoIds[2],
    es_publica: false,
    estado: 'programada',
    creador_id: creadorId,
  });

  // ── FUTURAS: loop 8 martes + 8 domingos + 8 escuelas dominicales ──
  let dia = dayjs().add(1, 'day');
  let cultoMartes = 0;
  let cultoDomingo = 0;
  let escuelaDominical = 0;

  for (let i = 0; i < 70; i++) {
    const dow = dia.day();

    if (dow === 2 && cultoMartes < 8) {
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

    if (dow === 0 && cultoDomingo < 8) {
      actividades.push({
        patron_id: patronIds[1],
        tipo_actividad_id: tiposActividadIds[0],
        nombre: `Culto Domingo ${dia.format('DD/MM/YYYY')}`,
        descripcion: 'Servicio de culto dominical',
        fecha: dia.format('YYYY-MM-DD'),
        hora_inicio: '16:00:00',
        hora_fin: '18:00:00',
        grupo_id: null,
        es_publica: true,
        estado: 'programada',
        creador_id: creadorId,
      });
      cultoDomingo++;

      if (escuelaDominical < 8) {
        actividades.push({
          patron_id: patronIds[2],
          tipo_actividad_id: tiposActividadIds[2],
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

  // ── FUTURAS: Actividades extraordinarias (al final del array) ──
  actividades.push(
    {
      patron_id: patronIds[6],
      tipo_actividad_id: tiposActividadIds[4],
      nombre: 'Vigilia de Consagración - Fin de Mes',
      descripcion: 'Vigilia mensual de búsqueda espiritual y oración prolongada',
      fecha: futureDate(21),
      hora_inicio: '21:00:00',
      hora_fin: '23:59:00',
      grupo_id: null,
      es_publica: false,
      estado: 'programada',
      creador_id: creadorId,
    },
    {
      patron_id: null,
      tipo_actividad_id: tiposActividadIds[3],
      nombre: 'Confraternidad de Jóvenes con Iglesias Vecinas',
      descripcion: 'Confraternidad con iglesias vecinas, actividades recreativas y alabanza',
      fecha: futureDate(28),
      hora_inicio: '15:00:00',
      hora_fin: '20:00:00',
      grupo_id: grupoIds[2],
      es_publica: true,
      estado: 'programada',
      creador_id: creadorId,
    },
    {
      patron_id: null,
      tipo_actividad_id: tiposActividadIds[6],
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
      patron_id: patronIds[7],
      tipo_actividad_id: tiposActividadIds[1],
      nombre: 'Predicación Sector Norte',
      descripcion: 'Evangelización puerta a puerta en sector norte de Santa Juana',
      fecha: futureDate(35),
      hora_inicio: '10:00:00',
      hora_fin: '13:00:00',
      grupo_id: grupoIds[4],
      es_publica: false,
      estado: 'programada',
      creador_id: creadorId,
    },
  );

  const ids = await insertRecords('actividad', actividades);

  // ── Vincular la cancelada con su reprogramación ──
  const canceladaId = ids[canceladaIndex];
  const replacementId = ids[replacementIndex];
  if (canceladaId && replacementId) {
    const { error } = await supabase
      .from('actividad')
      .update({ reprogramada_en_id: replacementId })
      .eq('id', canceladaId);
    if (error) {
      console.warn(`  ⚠️  No se pudo vincular reprogramación: ${error.message}`);
    } else {
      console.log(`  🔗 Actividad cancelada (id=${canceladaId}) vinculada → reprogramada (id=${replacementId})`);
    }
  }

  return ids;
}

// ─── 8. INVITADOS ────────────────────────────────────────────────────────────
//
// resp: [0]=Presidir, [1]=Predicar, [2]=Portero, [3]=Vigilante,
//       [4]=Ofrendero, [5]=Dir.Alabanza, [6]=Lectura Bíblica

async function seedInvitados(
  actividadIds: number[],
  miembroIds: number[],
  resp: number[],
): Promise<number[]> {
  if (await tableHasData('invitado')) {
    console.log('  ⏭  invitado: ya tiene registros, omitiendo');
    const { data } = await supabase.from('invitado').select('id');
    resumen.invitado = 0;
    return (data || []).map((r) => r.id as number);
  }

  const hace2semanas = dayjs().subtract(14, 'day').toISOString();
  const hace1semana = dayjs().subtract(7, 'day').toISOString();
  const hace3dias = dayjs().subtract(3, 'day').toISOString();
  const ayer = dayjs().subtract(1, 'day').toISOString();
  const ahora = dayjs().toISOString();

  return insertRecords('invitado', [
    // ── Culto Martes más antiguo [0] — todos asistieron ──
    {
      actividad_id: actividadIds[0],
      miembro_id: miembroIds[2],
      responsabilidad_id: resp[1],
      estado: 'confirmado',
      asistio: true,
      fecha_invitacion: hace2semanas,
      fecha_respuesta: hace2semanas,
    },
    {
      actividad_id: actividadIds[0],
      miembro_id: miembroIds[1],
      responsabilidad_id: resp[5],
      estado: 'confirmado',
      asistio: true,
      fecha_invitacion: hace2semanas,
      fecha_respuesta: hace2semanas,
    },
    {
      actividad_id: actividadIds[0],
      miembro_id: miembroIds[0],
      responsabilidad_id: resp[4],
      estado: 'confirmado',
      asistio: true,
      fecha_invitacion: hace2semanas,
      fecha_respuesta: hace2semanas,
    },
    {
      actividad_id: actividadIds[0],
      miembro_id: miembroIds[8],
      responsabilidad_id: resp[2],
      estado: 'confirmado',
      asistio: false, // Confirmó pero no asistió
      fecha_invitacion: hace2semanas,
      fecha_respuesta: hace2semanas,
    },

    // ── Culto Martes [1] ──
    {
      actividad_id: actividadIds[1],
      miembro_id: miembroIds[2],
      responsabilidad_id: resp[1],
      estado: 'confirmado',
      asistio: true,
      fecha_invitacion: hace2semanas,
      fecha_respuesta: hace2semanas,
    },
    {
      actividad_id: actividadIds[1],
      miembro_id: miembroIds[3],
      responsabilidad_id: resp[5],
      estado: 'confirmado',
      asistio: true,
      fecha_invitacion: hace2semanas,
      fecha_respuesta: hace2semanas,
    },
    {
      actividad_id: actividadIds[1],
      miembro_id: miembroIds[0],
      responsabilidad_id: resp[4],
      estado: 'confirmado',
      asistio: true,
      fecha_invitacion: hace2semanas,
      fecha_respuesta: hace2semanas,
    },

    // ── Culto Martes más reciente [5] ──
    {
      actividad_id: actividadIds[5],
      miembro_id: miembroIds[2],
      responsabilidad_id: resp[1],
      estado: 'confirmado',
      asistio: true,
      fecha_invitacion: hace1semana,
      fecha_respuesta: hace1semana,
    },
    {
      actividad_id: actividadIds[5],
      miembro_id: miembroIds[1],
      responsabilidad_id: resp[5],
      estado: 'confirmado',
      asistio: true,
      fecha_invitacion: hace1semana,
      fecha_respuesta: hace1semana,
    },
    {
      actividad_id: actividadIds[5],
      miembro_id: miembroIds[4],
      responsabilidad_id: resp[2],
      estado: 'confirmado',
      asistio: true,
      fecha_invitacion: hace1semana,
      fecha_respuesta: hace1semana,
    },
    {
      actividad_id: actividadIds[5],
      miembro_id: miembroIds[3],
      responsabilidad_id: resp[6],
      estado: 'confirmado',
      asistio: true,
      fecha_invitacion: hace1semana,
      fecha_respuesta: hace1semana,
    },

    // ── Culto Domingo más antiguo [6] ──
    {
      actividad_id: actividadIds[6],
      miembro_id: miembroIds[0],
      responsabilidad_id: resp[0],
      estado: 'confirmado',
      asistio: true,
      fecha_invitacion: hace2semanas,
      fecha_respuesta: hace2semanas,
    },
    {
      actividad_id: actividadIds[6],
      miembro_id: miembroIds[2],
      responsabilidad_id: resp[1],
      estado: 'confirmado',
      asistio: true,
      fecha_invitacion: hace2semanas,
      fecha_respuesta: hace2semanas,
    },
    {
      actividad_id: actividadIds[6],
      miembro_id: miembroIds[1],
      responsabilidad_id: resp[5],
      estado: 'confirmado',
      asistio: true,
      fecha_invitacion: hace2semanas,
      fecha_respuesta: hace2semanas,
    },
    {
      actividad_id: actividadIds[6],
      miembro_id: miembroIds[7],
      responsabilidad_id: resp[4],
      estado: 'confirmado',
      asistio: true,
      fecha_invitacion: hace2semanas,
      fecha_respuesta: hace2semanas,
    },

    // ── Culto Domingo [7] — uno no asistió ──
    {
      actividad_id: actividadIds[7],
      miembro_id: miembroIds[0],
      responsabilidad_id: resp[0],
      estado: 'confirmado',
      asistio: true,
      fecha_invitacion: hace2semanas,
      fecha_respuesta: hace2semanas,
    },
    {
      actividad_id: actividadIds[7],
      miembro_id: miembroIds[8],
      responsabilidad_id: resp[1],
      estado: 'confirmado',
      asistio: false, // No asistió
      fecha_invitacion: hace2semanas,
      fecha_respuesta: hace2semanas,
    },
    {
      actividad_id: actividadIds[7],
      miembro_id: miembroIds[1],
      responsabilidad_id: resp[5],
      estado: 'confirmado',
      asistio: true,
      fecha_invitacion: hace2semanas,
      fecha_respuesta: hace2semanas,
    },
    {
      actividad_id: actividadIds[7],
      miembro_id: miembroIds[3],
      responsabilidad_id: resp[6],
      estado: 'confirmado',
      asistio: true,
      fecha_invitacion: hace2semanas,
      fecha_respuesta: hace2semanas,
    },

    // ── Escuela Dominical [12] ──
    {
      actividad_id: actividadIds[12],
      miembro_id: miembroIds[7],
      responsabilidad_id: resp[0],
      estado: 'confirmado',
      asistio: true,
      fecha_invitacion: hace2semanas,
      fecha_respuesta: hace2semanas,
    },
    {
      actividad_id: actividadIds[12],
      miembro_id: miembroIds[3],
      responsabilidad_id: resp[6],
      estado: 'confirmado',
      asistio: true,
      fecha_invitacion: hace2semanas,
      fecha_respuesta: hace2semanas,
    },

    // ── Reunión Dorcas [15] ──
    {
      actividad_id: actividadIds[15],
      miembro_id: miembroIds[1],
      responsabilidad_id: resp[0],
      estado: 'confirmado',
      asistio: true,
      fecha_invitacion: hace1semana,
      fecha_respuesta: hace1semana,
    },
    {
      actividad_id: actividadIds[15],
      miembro_id: miembroIds[7],
      responsabilidad_id: resp[6],
      estado: 'confirmado',
      asistio: true,
      fecha_invitacion: hace1semana,
      fecha_respuesta: hace1semana,
    },
    {
      actividad_id: actividadIds[15],
      miembro_id: miembroIds[3],
      responsabilidad_id: resp[4],
      estado: 'confirmado',
      asistio: true,
      fecha_invitacion: hace1semana,
      fecha_respuesta: hace1semana,
    },

    // ── Reunión Voluntarios [18] ──
    {
      actividad_id: actividadIds[18],
      miembro_id: miembroIds[0],
      responsabilidad_id: resp[0],
      estado: 'confirmado',
      asistio: true,
      fecha_invitacion: hace1semana,
      fecha_respuesta: hace1semana,
    },
    {
      actividad_id: actividadIds[18],
      miembro_id: miembroIds[2],
      responsabilidad_id: resp[1],
      estado: 'confirmado',
      asistio: true,
      fecha_invitacion: hace1semana,
      fecha_respuesta: hace1semana,
    },
    {
      actividad_id: actividadIds[18],
      miembro_id: miembroIds[8],
      responsabilidad_id: resp[6],
      estado: 'confirmado',
      asistio: false,
      fecha_invitacion: hace1semana,
      fecha_respuesta: hace1semana,
    },

    // ── Vigilia pasada [24] ──
    {
      actividad_id: actividadIds[24],
      miembro_id: miembroIds[0],
      responsabilidad_id: resp[0],
      estado: 'confirmado',
      asistio: true,
      fecha_invitacion: hace2semanas,
      fecha_respuesta: hace2semanas,
    },
    {
      actividad_id: actividadIds[24],
      miembro_id: miembroIds[2],
      responsabilidad_id: resp[1],
      estado: 'confirmado',
      asistio: true,
      fecha_invitacion: hace2semanas,
      fecha_respuesta: hace2semanas,
    },
    {
      actividad_id: actividadIds[24],
      miembro_id: miembroIds[1],
      responsabilidad_id: resp[5],
      estado: 'confirmado',
      asistio: true,
      fecha_invitacion: hace2semanas,
      fecha_respuesta: hace2semanas,
    },
    {
      actividad_id: actividadIds[24],
      miembro_id: miembroIds[3],
      responsabilidad_id: resp[6],
      estado: 'confirmado',
      asistio: false,
      fecha_invitacion: hace2semanas,
      fecha_respuesta: hace2semanas,
    },

    // ── Matrimonio pasado [25] ──
    {
      actividad_id: actividadIds[25],
      miembro_id: miembroIds[0],
      responsabilidad_id: resp[0],
      estado: 'confirmado',
      asistio: true,
      fecha_invitacion: hace2semanas,
      fecha_respuesta: hace2semanas,
    },
    {
      actividad_id: actividadIds[25],
      miembro_id: miembroIds[2],
      responsabilidad_id: resp[1],
      estado: 'confirmado',
      asistio: true,
      fecha_invitacion: hace2semanas,
      fecha_respuesta: hace2semanas,
    },
    {
      actividad_id: actividadIds[25],
      miembro_id: miembroIds[1],
      responsabilidad_id: resp[5],
      estado: 'confirmado',
      asistio: true,
      fecha_invitacion: hace2semanas,
      fecha_respuesta: hace2semanas,
    },
    {
      actividad_id: actividadIds[25],
      miembro_id: miembroIds[7],
      responsabilidad_id: resp[4],
      estado: 'confirmado',
      asistio: true,
      fecha_invitacion: hace2semanas,
      fecha_respuesta: hace2semanas,
    },

    // ── Predicación calle más reciente [28] ──
    {
      actividad_id: actividadIds[28],
      miembro_id: miembroIds[2],
      responsabilidad_id: resp[0],
      estado: 'confirmado',
      asistio: true,
      fecha_invitacion: hace1semana,
      fecha_respuesta: hace1semana,
    },
    {
      actividad_id: actividadIds[28],
      miembro_id: miembroIds[0],
      responsabilidad_id: resp[1],
      estado: 'confirmado',
      asistio: true,
      fecha_invitacion: hace1semana,
      fecha_respuesta: hace1semana,
    },
    {
      actividad_id: actividadIds[28],
      miembro_id: miembroIds[8],
      responsabilidad_id: resp[2],
      estado: 'confirmado',
      asistio: true,
      fecha_invitacion: hace1semana,
      fecha_respuesta: hace1semana,
    },

    // ── Actividad cancelada [29] — fueron confirmados/pendientes antes de cancelarse ──
    {
      actividad_id: actividadIds[29],
      miembro_id: miembroIds[4],
      responsabilidad_id: resp[0],
      estado: 'confirmado',
      asistio: false,
      fecha_invitacion: hace2semanas,
      fecha_respuesta: hace2semanas,
    },
    {
      actividad_id: actividadIds[29],
      miembro_id: miembroIds[8],
      responsabilidad_id: resp[1],
      estado: 'confirmado',
      asistio: false,
      fecha_invitacion: hace2semanas,
      fecha_respuesta: hace2semanas,
    },
    {
      actividad_id: actividadIds[29],
      miembro_id: miembroIds[6],
      responsabilidad_id: resp[2],
      estado: 'pendiente',
      asistio: false,
      fecha_invitacion: hace2semanas,
      fecha_respuesta: null,
    },

    // ── Reprogramada [30] — re-invitaciones para la nueva fecha ──
    {
      actividad_id: actividadIds[30],
      miembro_id: miembroIds[4],
      responsabilidad_id: resp[0],
      estado: 'confirmado',
      asistio: false,
      fecha_invitacion: hace3dias,
      fecha_respuesta: ayer,
    },
    {
      actividad_id: actividadIds[30],
      miembro_id: miembroIds[8],
      responsabilidad_id: resp[1],
      estado: 'pendiente',
      asistio: false,
      fecha_invitacion: ahora,
      fecha_respuesta: null,
    },
    {
      actividad_id: actividadIds[30],
      miembro_id: miembroIds[6],
      responsabilidad_id: resp[2],
      estado: 'rechazado',
      motivo_rechazo: 'Tengo compromiso familiar ese día',
      asistio: false,
      fecha_invitacion: hace3dias,
      fecha_respuesta: ayer,
    },

    // ── Próxima Confraternidad (actividadIds.length - 3) ──
    {
      actividad_id: actividadIds[actividadIds.length - 3],
      miembro_id: miembroIds[3],
      responsabilidad_id: resp[0],
      estado: 'confirmado',
      asistio: false,
      fecha_invitacion: hace1semana,
      fecha_respuesta: ayer,
    },
    {
      actividad_id: actividadIds[actividadIds.length - 3],
      miembro_id: miembroIds[4],
      responsabilidad_id: resp[5],
      estado: 'confirmado',
      asistio: false,
      fecha_invitacion: hace1semana,
      fecha_respuesta: ayer,
    },
    {
      actividad_id: actividadIds[actividadIds.length - 3],
      miembro_id: miembroIds[5],
      responsabilidad_id: resp[4],
      estado: 'pendiente',
      asistio: false,
      fecha_invitacion: ahora,
      fecha_respuesta: null,
    },
    {
      actividad_id: actividadIds[actividadIds.length - 3],
      miembro_id: miembroIds[6],
      responsabilidad_id: resp[2],
      estado: 'rechazado',
      motivo_rechazo: 'Tengo turno de trabajo ese día',
      asistio: false,
      fecha_invitacion: hace3dias,
      fecha_respuesta: ayer,
    },

    // ── Santa Cena (actividadIds.length - 2) ──
    {
      actividad_id: actividadIds[actividadIds.length - 2],
      miembro_id: miembroIds[0],
      responsabilidad_id: resp[0],
      estado: 'confirmado',
      asistio: false,
      fecha_invitacion: hace1semana,
      fecha_respuesta: ayer,
    },
    {
      actividad_id: actividadIds[actividadIds.length - 2],
      miembro_id: miembroIds[2],
      responsabilidad_id: resp[1],
      estado: 'confirmado',
      asistio: false,
      fecha_invitacion: hace1semana,
      fecha_respuesta: ayer,
    },
    {
      actividad_id: actividadIds[actividadIds.length - 2],
      miembro_id: miembroIds[7],
      responsabilidad_id: resp[4],
      estado: 'pendiente',
      asistio: false,
      fecha_invitacion: ahora,
      fecha_respuesta: null,
    },

    // ── Predicación Sector Norte (actividadIds.length - 1) ──
    {
      actividad_id: actividadIds[actividadIds.length - 1],
      miembro_id: miembroIds[2],
      responsabilidad_id: resp[0],
      estado: 'confirmado',
      asistio: false,
      fecha_invitacion: hace3dias,
      fecha_respuesta: ayer,
    },
    {
      actividad_id: actividadIds[actividadIds.length - 1],
      miembro_id: miembroIds[0],
      responsabilidad_id: resp[1],
      estado: 'pendiente',
      asistio: false,
      fecha_invitacion: ahora,
      fecha_respuesta: null,
    },
  ]);
}

// ─── 9. NECESIDADES LOGÍSTICAS ───────────────────────────────────────────────
//
// Necesidades pasadas [0-2] → vigilia, matrimonio, predicación calle
// Necesidades futuras [3+]  → confraternidad, santa cena, predicación norte

async function seedNecesidadesLogisticas(
  actividadIds: number[],
  tiposNecesidadIds: number[],
): Promise<number[]> {
  if (await tableHasData('necesidad')) {
    console.log('  ⏭  necesidad: ya tiene registros, omitiendo');
    const { data } = await supabase.from('necesidad').select('id');
    resumen.necesidad = 0;
    return (data || []).map((r) => r.id as number);
  }

  // tiposNecesidadIds: [0]=Transporte, [1]=Alimentación, [2]=Hospedaje,
  //                   [3]=Materiales, [4]=Equipos, [5]=Decoración, [6]=Aseo y Ornato

  return insertRecords('necesidad', [
    // ── PASADA: Vigilia [24] — alimentación cubierta ──
    // [0]
    {
      actividad_id: actividadIds[24],
      tipo_necesidad_id: tiposNecesidadIds[1],
      descripcion: 'Café, té y pan para los hermanos durante la vigilia',
      cantidad_requerida: 30,
      unidad_medida: 'porciones',
      cantidad_cubierta: 30,
      estado: 'cubierta',
    },

    // ── PASADA: Matrimonio [25] — decoración y alimentación cubierta ──
    // [1]
    {
      actividad_id: actividadIds[25],
      tipo_necesidad_id: tiposNecesidadIds[5],
      descripcion: 'Decoración floral del templo para la ceremonia',
      cantidad_requerida: 1,
      unidad_medida: 'arreglos',
      cantidad_cubierta: 1,
      estado: 'cubierta',
    },
    // [2]
    {
      actividad_id: actividadIds[25],
      tipo_necesidad_id: tiposNecesidadIds[1],
      descripcion: 'Refrigerio para los asistentes después de la ceremonia',
      cantidad_requerida: 50,
      unidad_medida: 'porciones',
      cantidad_cubierta: 50,
      estado: 'cubierta',
    },

    // ── PASADA: Predicación a la Calle [28] — materiales cubiertos ──
    // [3]
    {
      actividad_id: actividadIds[28],
      tipo_necesidad_id: tiposNecesidadIds[3],
      descripcion: 'Folletos evangelísticos y tratados bíblicos',
      cantidad_requerida: 150,
      unidad_medida: 'unidades',
      cantidad_cubierta: 150,
      estado: 'cubierta',
    },

    // ── FUTURA: Confraternidad (actividadIds.length - 3) ──
    // [4]
    {
      actividad_id: actividadIds[actividadIds.length - 3],
      tipo_necesidad_id: tiposNecesidadIds[0],
      descripcion: 'Bus para trasladar jóvenes al gimnasio municipal',
      cantidad_requerida: 1,
      unidad_medida: 'vehículos',
      cantidad_cubierta: 0,
      estado: 'abierta',
    },
    // [5]
    {
      actividad_id: actividadIds[actividadIds.length - 3],
      tipo_necesidad_id: tiposNecesidadIds[1],
      descripcion: 'Colaciones y bebidas para 40 jóvenes',
      cantidad_requerida: 40,
      unidad_medida: 'porciones',
      cantidad_cubierta: 15,
      estado: 'abierta',
    },
    // [6]
    {
      actividad_id: actividadIds[actividadIds.length - 3],
      tipo_necesidad_id: tiposNecesidadIds[4],
      descripcion: 'Equipo de sonido portátil para alabanza',
      cantidad_requerida: 1,
      unidad_medida: 'equipos',
      cantidad_cubierta: 1,
      estado: 'cubierta',
    },

    // ── FUTURA: Santa Cena (actividadIds.length - 2) ──
    // [7]
    {
      actividad_id: actividadIds[actividadIds.length - 2],
      tipo_necesidad_id: tiposNecesidadIds[1],
      descripcion: 'Pan sin levadura para la Santa Cena',
      cantidad_requerida: 5,
      unidad_medida: 'unidades',
      cantidad_cubierta: 0,
      estado: 'abierta',
    },
    // [8]
    {
      actividad_id: actividadIds[actividadIds.length - 2],
      tipo_necesidad_id: tiposNecesidadIds[1],
      descripcion: 'Jugo de uva para la Santa Cena',
      cantidad_requerida: 3,
      unidad_medida: 'litros',
      cantidad_cubierta: 0,
      estado: 'abierta',
    },

    // ── FUTURA: Predicación Sector Norte (actividadIds.length - 1) ──
    // [9]
    {
      actividad_id: actividadIds[actividadIds.length - 1],
      tipo_necesidad_id: tiposNecesidadIds[3],
      descripcion: 'Folletos evangelísticos para repartir en el sector',
      cantidad_requerida: 200,
      unidad_medida: 'unidades',
      cantidad_cubierta: 200,
      estado: 'cubierta',
    },
    // [10]
    {
      actividad_id: actividadIds[actividadIds.length - 1],
      tipo_necesidad_id: tiposNecesidadIds[0],
      descripcion: 'Vehículos para traslado del equipo evangelístico',
      cantidad_requerida: 2,
      unidad_medida: 'vehículos',
      cantidad_cubierta: 1,
      estado: 'abierta',
    },
  ]);
}

// ─── 10. COLABORADORES ───────────────────────────────────────────────────────
//
// necesidadIds: [0]=vigilia alimentación, [1]=matrimonio decoración, [2]=matrimonio alimentación,
//              [3]=predicación materiales, [4]=confraternidad transporte, [5]=confraternidad alimentación,
//              [6]=confraternidad equipos, [7]=santa cena pan, [8]=santa cena jugo,
//              [9]=predicación norte materiales, [10]=predicación norte transporte

async function seedColaboradores(necesidadIds: number[], miembroIds: number[]): Promise<void> {
  if (await tableHasData('colaborador')) {
    console.log('  ⏭  colaborador: ya tiene registros, omitiendo');
    resumen.colaborador = 0;
    return;
  }

  const hace2semanas = dayjs().subtract(14, 'day').toISOString();
  const hace1semana = dayjs().subtract(7, 'day').toISOString();
  const hace3dias = dayjs().subtract(3, 'day').toISOString();
  const ayer = dayjs().subtract(1, 'day').toISOString();
  const ahora = dayjs().toISOString();

  await insertRecords('colaborador', [
    // ── PASADA: Vigilia — alimentación [0] — cumplida ──
    {
      necesidad_id: necesidadIds[0],
      miembro_id: miembroIds[7],
      cantidad_comprometida: 20,
      observaciones: 'Preparé café, té y pan para los hermanos',
      fecha_compromiso: hace2semanas,
      cumplio: true,
    },
    {
      necesidad_id: necesidadIds[0],
      miembro_id: miembroIds[1],
      cantidad_comprometida: 10,
      observaciones: 'Llevé jugos y galletas adicionales',
      fecha_compromiso: hace2semanas,
      cumplio: true,
    },

    // ── PASADA: Matrimonio — decoración [1] — cumplida ──
    {
      necesidad_id: necesidadIds[1],
      miembro_id: miembroIds[3],
      cantidad_comprometida: 1,
      observaciones: 'Me encargo de los arreglos florales del templo',
      fecha_compromiso: hace2semanas,
      cumplio: true,
    },

    // ── PASADA: Matrimonio — alimentación [2] — cumplida ──
    {
      necesidad_id: necesidadIds[2],
      miembro_id: miembroIds[7],
      cantidad_comprometida: 30,
      observaciones: 'Preparo sándwiches y bebidas para el refrigerio',
      fecha_compromiso: hace2semanas,
      cumplio: true,
    },
    {
      necesidad_id: necesidadIds[2],
      miembro_id: miembroIds[1],
      cantidad_comprometida: 20,
      observaciones: 'Llevo queque y jugos',
      fecha_compromiso: hace2semanas,
      cumplio: true,
    },

    // ── PASADA: Predicación — materiales [3] — cumplida ──
    {
      necesidad_id: necesidadIds[3],
      miembro_id: miembroIds[0],
      cantidad_comprometida: 150,
      observaciones: 'Imprimí y ordené los folletos evangelísticos',
      fecha_compromiso: hace1semana,
      cumplio: true,
    },

    // ── FUTURA: Confraternidad — transporte [4] ──
    {
      necesidad_id: necesidadIds[4],
      miembro_id: miembroIds[2],
      cantidad_comprometida: 1,
      observaciones: 'Tengo una van de 15 pasajeros disponible ese día',
      fecha_compromiso: ahora,
      cumplio: false,
    },

    // ── FUTURA: Confraternidad — alimentación [5] ──
    {
      necesidad_id: necesidadIds[5],
      miembro_id: miembroIds[7],
      cantidad_comprometida: 10,
      observaciones: 'Puedo preparar 10 sándwiches caseros',
      fecha_compromiso: hace3dias,
      cumplio: false,
    },
    {
      necesidad_id: necesidadIds[5],
      miembro_id: miembroIds[3],
      cantidad_comprometida: 5,
      observaciones: 'Llevo 5 porciones de queque y bebidas',
      fecha_compromiso: hace3dias,
      cumplio: false,
    },
    {
      necesidad_id: necesidadIds[5],
      miembro_id: miembroIds[1],
      cantidad_comprometida: 10,
      observaciones: 'Puedo llevar bebidas y jugos naturales',
      fecha_compromiso: ahora,
      cumplio: false,
    },

    // ── FUTURA: Santa Cena — pan [7] ──
    {
      necesidad_id: necesidadIds[7],
      miembro_id: miembroIds[7],
      cantidad_comprometida: 5,
      observaciones: 'Yo preparo el pan sin levadura como siempre',
      fecha_compromiso: hace3dias,
      cumplio: false,
    },
    {
      necesidad_id: necesidadIds[7],
      miembro_id: miembroIds[3],
      cantidad_comprometida: 2,
      observaciones: 'Puedo preparar panes adicionales como respaldo',
      fecha_compromiso: ahora,
      cumplio: false,
    },

    // ── FUTURA: Santa Cena — jugo [8] ──
    {
      necesidad_id: necesidadIds[8],
      miembro_id: miembroIds[0],
      cantidad_comprometida: 3,
      observaciones: 'Compro el jugo de uva sin aditivos',
      fecha_compromiso: ahora,
      cumplio: false,
    },

    // ── FUTURA: Predicación Norte — transporte [10] ──
    {
      necesidad_id: necesidadIds[10],
      miembro_id: miembroIds[2],
      cantidad_comprometida: 1,
      observaciones: 'Puedo llevar 4 personas en mi auto',
      fecha_compromiso: hace3dias,
      cumplio: false,
    },
    {
      necesidad_id: necesidadIds[10],
      miembro_id: miembroIds[0],
      cantidad_comprometida: 1,
      observaciones: 'Disponible con mi camioneta, puedo llevar 5 personas',
      fecha_compromiso: ahora,
      cumplio: false,
    },
  ]);
}

// ─── EJECUCIÓN PRINCIPAL ─────────────────────────────────────────────────────

export async function runSeeds(): Promise<void> {
  console.log('\n🌱 Iniciando seeds de base de datos...\n');

  try {
    console.log('--- 1. Catálogos ---');
    const tiposActividadIds = await seedTiposActividad();
    const respActividadIds = await seedResponsabilidadesActividad();
    const rolesGrupoIds = await seedRolesGrupo();
    const tiposNecesidadIds = await seedTiposNecesidad();

    console.log('\n--- 2. Miembros ---');
    const miembroIds = await seedMiembros();
    const adminId = miembroIds[0];

    console.log('\n--- 3. Grupos Ministeriales ---');
    const grupoIds = await seedGruposMinisteriales();

    console.log('\n--- 4. Grupo Rol (roles habilitados) ---');
    await seedGrupoRol(grupoIds, rolesGrupoIds);

    console.log('\n--- 5. Integrante Grupo ---');
    await seedIntegranteGrupo(miembroIds, grupoIds, rolesGrupoIds);

    console.log('\n--- 6. Historial Estado ---');
    await seedHistorialEstado(miembroIds, adminId);

    console.log('\n--- 7. Patrones de Actividad ---');
    const patronIds = await seedPatronesActividad(tiposActividadIds, grupoIds);

    console.log('\n--- 8. Actividades (pasadas + futuras) ---');
    const actividadIds = await seedActividades(tiposActividadIds, patronIds, grupoIds, adminId);

    console.log('\n--- 9. Invitados ---');
    await seedInvitados(actividadIds, miembroIds, respActividadIds);

    console.log('\n--- 10. Necesidades Logísticas ---');
    const necesidadIds = await seedNecesidadesLogisticas(actividadIds, tiposNecesidadIds);

    console.log('\n--- 11. Colaboradores ---');
    await seedColaboradores(necesidadIds, miembroIds);

    // Resumen final
    console.log('\n------------------------------------------');
    console.log('  📊 RESUMEN DE SEEDS');
    console.log('------------------------------------------');
    let totalInsertados = 0;
    for (const [tabla, count] of Object.entries(resumen)) {
      if (count > 0) {
        console.log(`  ✅ ${tabla}: ${count} registros`);
        totalInsertados += count;
      } else {
        console.log(`  ⏭  ${tabla}: omitido (ya existía)`);
      }
    }
    console.log('------------------------------------------');
    console.log(`  🎉 Total insertados: ${totalInsertados} registros`);
    console.log('------------------------------------------\n');
  } catch (error) {
    console.error(`\n❌ Error en seeds: ${(error as Error).message}\n`);
    process.exit(1);
  }
}

// Ejecución directa: pnpm seed
runSeeds();
