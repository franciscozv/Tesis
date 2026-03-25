-- =============================================================================

-- SEED INICIAL — Centro Comunitario Los Pinos

-- Ejecutar UNA SOLA VEZ sobre la base de datos vacía.

--

-- Requisitos:

--   • Extensión pgcrypto habilitada (se activa automáticamente abajo).

--   • Todas las tablas del esquema ya deben existir antes de correr este script.

--

-- Credenciales generadas:

--   admin@centrolospinos.cl   /  Admin123!      (rol: administrador)

--   lider@centrolospinos.cl   /  Lider123!      (rol: usuario)

--   miembro1@test.cl          /  Miembro123!    (rol: usuario)

--   miembro2@test.cl          /  Miembro123!    (rol: usuario)

--   miembro3@test.cl          /  Miembro123!    (rol: usuario)

-- =============================================================================



BEGIN;



CREATE EXTENSION IF NOT EXISTS pgcrypto;



DO $$

DECLARE

  hash_admin   TEXT;

  hash_lider   TEXT;

  hash_miembro TEXT;



  -- tipo_actividad

  tid_asamblea     INT;

  tid_taller       INT;

  tid_reunion      INT;

  tid_ensayo       INT;

  tid_reunion_adm  INT;

  tid_visita       INT;

  tid_encuentro    INT;

  tid_retiro       INT;

  tid_celebracion  INT;

  tid_deportiva    INT;



  -- responsabilidad_actividad

  rid_presentador  INT;

  rid_animador     INT;

  rid_musico       INT;

  rid_cantante     INT;

  rid_instructor   INT;

  rid_recepcion    INT;

  rid_vigilante    INT;

  rid_tesorero_t   INT;

  rid_coordinador  INT;



  -- rol_grupo

  rgid_primer_ay   INT;

  rgid_secretario  INT;

  rgid_tesorero    INT;

  rgid_vocal       INT;

  rgid_integrante  INT;

  rgid_segundo_ay  INT;



  -- tipo_necesidad

  tnid_transporte   INT;

  tnid_alimentacion INT;

  tnid_hospedaje    INT;

  tnid_materiales   INT;

  tnid_equipos      INT;

  tnid_decoracion   INT;

  tnid_aseo         INT;



  -- miembros

  m_carlos    INT;

  m_maria     INT;

  m_pedro     INT;

  m_ana       INT;

  m_luis      INT;

  m_daniela   INT;

  m_roberto   INT;

  m_patricia  INT;

  m_javier    INT;

  m_camila    INT;



  -- usuarios

  u_admin  INT;

  u_lider  INT;



  -- grupos

  g_cultural  INT;

  g_jovenes   INT;

  g_femenino  INT;

  g_directiva INT;



  -- patrones

  p_martes       INT;

  p_domingo      INT;

  p_taller       INT;

  p_reunion_adm  INT;

  p_ensayo       INT;



  -- actividades

  a_asamblea_mar1 INT;

  a_asamblea_dom1 INT;

  a_taller1       INT;

  a_celebracion   INT;

  a_encuentro     INT;



  -- necesidades

  n_transp_encuentro  INT;

  n_alim_encuentro    INT;

  n_equip_encuentro   INT;

  n_alim_celebracion  INT;



BEGIN



  -- Guardia: no re-insertar si ya hay datos

  IF EXISTS (SELECT 1 FROM miembro LIMIT 1) THEN

    RAISE NOTICE 'La base de datos ya contiene datos. Seed omitido.';

    RETURN;

  END IF;



  -- ── Contraseñas ────────────────────────────────────────────────────────────

  hash_admin   := crypt('Admin123!',   gen_salt('bf', 10));

  hash_lider   := crypt('Lider123!',   gen_salt('bf', 10));

  hash_miembro := crypt('Miembro123!', gen_salt('bf', 10));





  -- =========================================================================

  -- 1. CATÁLOGOS

  -- =========================================================================



  INSERT INTO tipo_actividad (nombre, descripcion, color, activo) VALUES

    ('Asamblea General',      'Reunión de todos los miembros del centro',       '#3B82F6', true),

    ('Taller Formativo',      'Sesión de formación, capacitación o aprendizaje','#10B981', true),

    ('Reunión de Planificación','Reunión de coordinación y planificación',       '#8B5CF6', true),

    ('Ensayo Cultural',       'Práctica del grupo cultural o artístico',         '#F59E0B', true),

    ('Reunión Administrativa','Reunión interna del equipo directivo',            '#EF4444', true),

    ('Visita Comunitaria',    'Visita a familias o sectores de la comuna',       '#06B6D4', true),

    ('Encuentro',             'Actividad de integración entre grupos',           '#EC4899', true),

    ('Retiro',                'Retiro de formación y convivencia fuera de sede', '#14B8A6', true),

    ('Celebración Comunitaria','Celebración especial del centro',                '#A855F7', true),

    ('Actividad Deportiva',   'Evento deportivo o recreativo grupal',            '#F97316', true);



  SELECT id_tipo INTO tid_asamblea    FROM tipo_actividad WHERE nombre = 'Asamblea General';

  SELECT id_tipo INTO tid_taller      FROM tipo_actividad WHERE nombre = 'Taller Formativo';

  SELECT id_tipo INTO tid_reunion     FROM tipo_actividad WHERE nombre = 'Reunión de Planificación';

  SELECT id_tipo INTO tid_ensayo      FROM tipo_actividad WHERE nombre = 'Ensayo Cultural';

  SELECT id_tipo INTO tid_reunion_adm FROM tipo_actividad WHERE nombre = 'Reunión Administrativa';

  SELECT id_tipo INTO tid_visita      FROM tipo_actividad WHERE nombre = 'Visita Comunitaria';

  SELECT id_tipo INTO tid_encuentro   FROM tipo_actividad WHERE nombre = 'Encuentro';

  SELECT id_tipo INTO tid_retiro      FROM tipo_actividad WHERE nombre = 'Retiro';

  SELECT id_tipo INTO tid_celebracion FROM tipo_actividad WHERE nombre = 'Celebración Comunitaria';

  SELECT id_tipo INTO tid_deportiva   FROM tipo_actividad WHERE nombre = 'Actividad Deportiva';



  INSERT INTO responsabilidad_actividad (nombre, descripcion, activo) VALUES

    ('Presentador',    'Encargado de la presentación o ponencia principal',   true),

    ('Animador',       'Conduce y anima el desarrollo de la actividad',       true),

    ('Músico',         'Ejecuta instrumento musical',                         true),

    ('Cantante',       'Integrante del grupo vocal',                          true),

    ('Instructor',     'Guía la sesión de taller o formación',                true),

    ('Recepción',      'Bienvenida y registro de asistentes',                 true),

    ('Vigilante',      'Orden y seguridad del recinto',                       true),

    ('Tesorero Turno', 'Manejo de caja y recolección de fondos',              true),

    ('Coordinador',    'Coordinación general de la actividad',                true);



  SELECT id_responsabilidad INTO rid_presentador FROM responsabilidad_actividad WHERE nombre = 'Presentador';

  SELECT id_responsabilidad INTO rid_animador    FROM responsabilidad_actividad WHERE nombre = 'Animador';

  SELECT id_responsabilidad INTO rid_musico      FROM responsabilidad_actividad WHERE nombre = 'Músico';

  SELECT id_responsabilidad INTO rid_cantante    FROM responsabilidad_actividad WHERE nombre = 'Cantante';

  SELECT id_responsabilidad INTO rid_instructor  FROM responsabilidad_actividad WHERE nombre = 'Instructor';

  SELECT id_responsabilidad INTO rid_recepcion   FROM responsabilidad_actividad WHERE nombre = 'Recepción';

  SELECT id_responsabilidad INTO rid_vigilante   FROM responsabilidad_actividad WHERE nombre = 'Vigilante';

  SELECT id_responsabilidad INTO rid_tesorero_t  FROM responsabilidad_actividad WHERE nombre = 'Tesorero Turno';

  SELECT id_responsabilidad INTO rid_coordinador FROM responsabilidad_actividad WHERE nombre = 'Coordinador';



  INSERT INTO rol_grupo (nombre, requiere_plena_comunion, es_unico, es_directiva, activo) VALUES

    ('Primer Encargado', true,  true,  true,  true),

    ('Secretario',       true,  true,  true,  true),

    ('Tesorero',         true,  true,  true,  true),

    ('Vocal',            false, false, false, true),

    ('Integrante',       false, false, false, true),

    ('Segundo Encargado',true,  true,  true,  true);



  SELECT id_rol_grupo INTO rgid_primer_ay  FROM rol_grupo WHERE nombre = 'Primer Encargado';

  SELECT id_rol_grupo INTO rgid_secretario FROM rol_grupo WHERE nombre = 'Secretario';

  SELECT id_rol_grupo INTO rgid_tesorero   FROM rol_grupo WHERE nombre = 'Tesorero';

  SELECT id_rol_grupo INTO rgid_vocal      FROM rol_grupo WHERE nombre = 'Vocal';

  SELECT id_rol_grupo INTO rgid_integrante FROM rol_grupo WHERE nombre = 'Integrante';

  SELECT id_rol_grupo INTO rgid_segundo_ay FROM rol_grupo WHERE nombre = 'Segundo Encargado';



  INSERT INTO tipo_necesidad (nombre, descripcion, activo) VALUES

    ('Transporte',    'Vehículos para traslado de personas',           true),

    ('Alimentación',  'Provisión de alimentos y bebidas',              true),

    ('Hospedaje',     'Alojamiento para participantes de retiros',     true),

    ('Materiales',    'Materiales y suministros de apoyo',             true),

    ('Equipos',       'Equipos técnicos o audiovisuales',              true),

    ('Decoración',    'Decoración y ambientación del espacio',         true),

    ('Aseo y Ornato', 'Limpieza y ornamentación del lugar',            true);



  SELECT id_tipo INTO tnid_transporte   FROM tipo_necesidad WHERE nombre = 'Transporte';

  SELECT id_tipo INTO tnid_alimentacion FROM tipo_necesidad WHERE nombre = 'Alimentación';

  SELECT id_tipo INTO tnid_hospedaje    FROM tipo_necesidad WHERE nombre = 'Hospedaje';

  SELECT id_tipo INTO tnid_materiales   FROM tipo_necesidad WHERE nombre = 'Materiales';

  SELECT id_tipo INTO tnid_equipos      FROM tipo_necesidad WHERE nombre = 'Equipos';

  SELECT id_tipo INTO tnid_decoracion   FROM tipo_necesidad WHERE nombre = 'Decoración';

  SELECT id_tipo INTO tnid_aseo         FROM tipo_necesidad WHERE nombre = 'Aseo y Ornato';



  RAISE NOTICE '✓ Catálogos insertados';





  -- =========================================================================

  -- 2. MIEMBROS

  -- =========================================================================



  INSERT INTO miembro (rut, nombre, apellido, email, telefono, fecha_nacimiento, direccion, genero, estado_comunion, fecha_ingreso, activo)

  VALUES ('12345678-5','Carlos',  'Muñoz Pérez',       'carlos.munoz@email.cl',     '+56912345678','1980-03-15','Los Aromos 123',        'masculino','plena_comunion','2020-01-15',true) RETURNING id INTO m_carlos;



  INSERT INTO miembro (rut, nombre, apellido, email, telefono, fecha_nacimiento, direccion, genero, estado_comunion, fecha_ingreso, activo)

  VALUES ('11234567-8','María',   'González Rivas',    'maria.gonzalez@email.cl',   '+56923456789','1985-07-22','Av. Principal 456',     'femenino', 'plena_comunion','2019-06-10',true) RETURNING id INTO m_maria;



  INSERT INTO miembro (rut, nombre, apellido, email, telefono, fecha_nacimiento, direccion, genero, estado_comunion, fecha_ingreso, activo)

  VALUES ('13456789-0','Pedro',   'Soto Arriagada',    'pedro.soto@email.cl',       '+56934567890','1975-11-05','Pasaje Las Rosas 78',   'masculino','plena_comunion','2018-03-20',true) RETURNING id INTO m_pedro;



  INSERT INTO miembro (rut, nombre, apellido, email, telefono, fecha_nacimiento, direccion, genero, estado_comunion, fecha_ingreso, activo)

  VALUES ('14567890-1','Ana',     'Riquelme Torres',   'ana.riquelme@email.cl',     '+56945678901','1992-01-30','Calle Nueva 90',         'femenino', 'plena_comunion','2021-08-12',true) RETURNING id INTO m_ana;



  INSERT INTO miembro (rut, nombre, apellido, email, telefono, fecha_nacimiento, direccion, genero, estado_comunion, fecha_ingreso, activo)

  VALUES ('15678901-2','Luis',    'Hernández Bravo',   'luis.hernandez@email.cl',   '+56956789012','1998-05-18','Población El Sol 34',   'masculino','probando',      '2024-02-01',true) RETURNING id INTO m_luis;



  INSERT INTO miembro (rut, nombre, apellido, email, telefono, fecha_nacimiento, direccion, genero, estado_comunion, fecha_ingreso, activo)

  VALUES ('16789012-3','Daniela', 'Fuentes Sepúlveda', 'daniela.fuentes@email.cl',  '+56967890123','2000-09-12','Villa Los Pinos 56',    'femenino', 'probando',      '2024-06-15',true) RETURNING id INTO m_daniela;



  INSERT INTO miembro (rut, nombre, apellido, email, telefono, fecha_nacimiento, direccion, genero, estado_comunion, fecha_ingreso, activo)

  VALUES ('17890123-4','Roberto', 'Villalobos Cáceres','roberto.villalobos@email.cl','+56978901234','1988-12-03','Camino Real 200',       'masculino','asistente',     '2025-01-10',true) RETURNING id INTO m_roberto;



  INSERT INTO miembro (rut, nombre, apellido, email, telefono, fecha_nacimiento, direccion, genero, estado_comunion, fecha_ingreso, activo)

  VALUES ('18901234-5','Patricia','Morales Contreras',  'patricia.morales@email.cl', '+56989012345','1970-04-25','Av. Libertad 310',      'femenino', 'plena_comunion','2017-11-20',true) RETURNING id INTO m_patricia;



  INSERT INTO miembro (rut, nombre, apellido, email, telefono, fecha_nacimiento, direccion, genero, estado_comunion, fecha_ingreso, activo)

  VALUES ('19012345-6','Javier',  'Campos Navarro',    'javier.campos@email.cl',    '+56990123456','1995-08-08','Los Copihues 45',        'masculino','plena_comunion','2022-04-05',true) RETURNING id INTO m_javier;



  INSERT INTO miembro (rut, nombre, apellido, email, telefono, fecha_nacimiento, direccion, genero, estado_comunion, fecha_ingreso, activo)

  VALUES ('20123456-7','Camila',  'Vega Sandoval',     'camila.vega@email.cl',      '+56901234567','2002-06-20','Pasaje Los Aromos 12',  'femenino', 'asistente',     '2025-11-01',true) RETURNING id INTO m_camila;



  RAISE NOTICE '✓ 10 miembros insertados';





  -- =========================================================================

  -- 3. USUARIOS

  -- =========================================================================



  INSERT INTO usuario (email, password_hash, rol, miembro_id, activo)

  VALUES ('admin@centrolospinos.cl', hash_admin,   'administrador', m_carlos,  true) RETURNING id INTO u_admin;



  INSERT INTO usuario (email, password_hash, rol, miembro_id, activo)

  VALUES ('lider@centrolospinos.cl', hash_lider,   'usuario',       m_maria,   true) RETURNING id INTO u_lider;



  INSERT INTO usuario (email, password_hash, rol, miembro_id, activo)

  VALUES ('miembro1@test.cl',        hash_miembro, 'usuario',       m_ana,     true);



  INSERT INTO usuario (email, password_hash, rol, miembro_id, activo)

  VALUES ('miembro2@test.cl',        hash_miembro, 'usuario',       m_luis,    true);



  INSERT INTO usuario (email, password_hash, rol, miembro_id, activo)

  VALUES ('miembro3@test.cl',        hash_miembro, 'usuario',       m_javier,  true);



  RAISE NOTICE '✓ 5 usuarios insertados';





  -- =========================================================================

  -- 4. GRUPOS

  -- =========================================================================



  INSERT INTO grupo (nombre, descripcion, fecha_creacion, activo)

  VALUES ('Grupo Cultural', 'Grupo artístico y cultural del centro', '2019-06-15', true)

  RETURNING id_grupo INTO g_cultural;



  INSERT INTO grupo (nombre, descripcion, fecha_creacion, activo)

  VALUES ('Equipo Juvenil', 'Equipo de jóvenes entre 15 y 30 años', '2021-03-10', true)

  RETURNING id_grupo INTO g_jovenes;



  INSERT INTO grupo (nombre, descripcion, fecha_creacion, activo)

  VALUES ('Grupo de Mujeres', 'Grupo femenino del centro comunitario', '2022-01-20', true)

  RETURNING id_grupo INTO g_femenino;



  INSERT INTO grupo (nombre, descripcion, fecha_creacion, activo)

  VALUES ('Directiva', 'Cuerpo directivo y administrativo del centro', '2018-01-01', true)

  RETURNING id_grupo INTO g_directiva;



  RAISE NOTICE '✓ 4 grupos insertados';





  -- =========================================================================

  -- 5. GRUPO_ROL

  -- =========================================================================



  INSERT INTO grupo_rol (grupo_id, rol_grupo_id) VALUES

    (g_cultural,  rgid_primer_ay),

    (g_cultural,  rgid_integrante),

    (g_jovenes,   rgid_primer_ay),

    (g_jovenes,   rgid_secretario),

    (g_jovenes,   rgid_vocal),

    (g_jovenes,   rgid_integrante),

    (g_femenino,  rgid_primer_ay),

    (g_femenino,  rgid_integrante),

    (g_directiva, rgid_primer_ay),

    (g_directiva, rgid_secretario),

    (g_directiva, rgid_tesorero),

    (g_directiva, rgid_vocal);



  RAISE NOTICE '✓ grupo_rol configurado';





  -- =========================================================================

  -- 6. INTEGRANTE_GRUPO

  -- =========================================================================



  INSERT INTO integrante_grupo (miembro_id, grupo_id, rol_grupo_id, fecha_vinculacion) VALUES

    -- Grupo Cultural

    (m_maria,    g_cultural,  rgid_primer_ay,  '2019-06-15T00:00:00Z'),

    (m_ana,      g_cultural,  rgid_integrante, '2021-09-01T00:00:00Z'),

    (m_javier,   g_cultural,  rgid_integrante, '2022-05-10T00:00:00Z'),

    (m_daniela,  g_cultural,  rgid_integrante, '2024-08-01T00:00:00Z'),

    -- Equipo Juvenil

    (m_ana,      g_jovenes,   rgid_primer_ay,  '2021-03-10T00:00:00Z'),

    (m_luis,     g_jovenes,   rgid_integrante, '2024-03-01T00:00:00Z'),

    (m_daniela,  g_jovenes,   rgid_secretario, '2024-07-15T00:00:00Z'),

    (m_javier,   g_jovenes,   rgid_vocal,      '2022-06-01T00:00:00Z'),

    (m_camila,   g_jovenes,   rgid_integrante, '2025-11-15T00:00:00Z'),

    -- Grupo de Mujeres

    (m_ana,      g_femenino,  rgid_primer_ay,  '2022-01-20T00:00:00Z'),

    (m_daniela,  g_femenino,  rgid_integrante, '2024-08-20T00:00:00Z'),

    (m_camila,   g_femenino,  rgid_integrante, '2025-11-20T00:00:00Z'),

    -- Directiva

    (m_carlos,   g_directiva, rgid_primer_ay,  '2018-01-01T00:00:00Z'),

    (m_pedro,    g_directiva, rgid_secretario, '2018-01-01T00:00:00Z'),

    (m_patricia, g_directiva, rgid_tesorero,   '2018-01-01T00:00:00Z'),

    (m_maria,    g_directiva, rgid_vocal,      '2019-07-01T00:00:00Z');



  RAISE NOTICE '✓ 16 integrantes asignados';





  -- =========================================================================

  -- 7. PATRONES DE ACTIVIDAD

  -- =========================================================================



  INSERT INTO patron_actividad (nombre, tipo_actividad_id, frecuencia, dia_semana, hora_inicio, duracion_minutos, lugar, grupo_id, es_publica, activo)

  VALUES ('Asamblea Martes', tid_asamblea, 'semanal', 2, '19:00:00', 120, 'Sede Central', NULL, true, true)

  RETURNING id INTO p_martes;



  INSERT INTO patron_actividad (nombre, tipo_actividad_id, frecuencia, dia_semana, hora_inicio, duracion_minutos, lugar, grupo_id, es_publica, activo)

  VALUES ('Asamblea Domingo', tid_asamblea, 'semanal', 7, '10:00:00', 120, 'Sede Central', NULL, true, true)

  RETURNING id INTO p_domingo;



  INSERT INTO patron_actividad (nombre, tipo_actividad_id, frecuencia, dia_semana, hora_inicio, duracion_minutos, lugar, grupo_id, es_publica, activo)

  VALUES ('Taller Dominical', tid_taller, 'semanal', 7, '09:00:00', 50, 'Sala de Talleres', NULL, false, true)

  RETURNING id INTO p_taller;



  INSERT INTO patron_actividad (nombre, tipo_actividad_id, frecuencia, dia_semana, hora_inicio, duracion_minutos, lugar, grupo_id, es_publica, activo)

  VALUES ('Reunión Directiva Mensual', tid_reunion_adm, 'primera_semana', 5, '19:00:00', 90, 'Sede Central', g_directiva, false, true)

  RETURNING id INTO p_reunion_adm;



  INSERT INTO patron_actividad (nombre, tipo_actividad_id, frecuencia, dia_semana, hora_inicio, duracion_minutos, lugar, grupo_id, es_publica, activo)

  VALUES ('Ensayo Semanal', tid_ensayo, 'semanal', 6, '16:00:00', 90, 'Sala Cultural', g_cultural, false, true)

  RETURNING id INTO p_ensayo;



  RAISE NOTICE '✓ 5 patrones de actividad insertados';





  -- =========================================================================

  -- 8. ACTIVIDADES (8 semanas desde 2026-03-17)

  -- =========================================================================



  -- Primera semana — capturo IDs para invitados

  INSERT INTO actividad (patron_id, tipo_actividad_id, nombre, fecha, hora_inicio, hora_fin, lugar, grupo_id, es_publica, estado, creador_id)

  VALUES (p_martes,  tid_asamblea, 'Asamblea Martes 17/03/2026',  '2026-03-17', '19:00:00', '21:00:00', 'Sede Central',     NULL, true,  'programada', u_admin)

  RETURNING id INTO a_asamblea_mar1;



  INSERT INTO actividad (patron_id, tipo_actividad_id, nombre, fecha, hora_inicio, hora_fin, lugar, grupo_id, es_publica, estado, creador_id)

  VALUES (p_domingo, tid_asamblea, 'Asamblea Domingo 22/03/2026', '2026-03-22', '10:00:00', '12:00:00', 'Sede Central',     NULL, true,  'programada', u_admin)

  RETURNING id INTO a_asamblea_dom1;



  INSERT INTO actividad (patron_id, tipo_actividad_id, nombre, fecha, hora_inicio, hora_fin, lugar, grupo_id, es_publica, estado, creador_id)

  VALUES (p_taller,  tid_taller,   'Taller Dominical 22/03/2026', '2026-03-22', '09:00:00', '09:50:00', 'Sala de Talleres', NULL, false, 'programada', u_admin)

  RETURNING id INTO a_taller1;



  -- Semanas restantes

  INSERT INTO actividad (patron_id, tipo_actividad_id, nombre, fecha, hora_inicio, hora_fin, lugar, grupo_id, es_publica, estado, creador_id)

  VALUES

    (p_martes,  tid_asamblea,'Asamblea Martes 24/03/2026',        '2026-03-24','19:00:00','21:00:00','Sede Central',      NULL,false,'programada',u_admin),

    (p_domingo, tid_asamblea,'Asamblea Domingo 29/03/2026',        '2026-03-29','10:00:00','12:00:00','Sede Central',      NULL,true, 'programada',u_admin),

    (p_taller,  tid_taller,  'Taller Dominical 29/03/2026',        '2026-03-29','09:00:00','09:50:00','Sala de Talleres',  NULL,false,'programada',u_admin),

    (p_martes,  tid_asamblea,'Asamblea Martes 31/03/2026',         '2026-03-31','19:00:00','21:00:00','Sede Central',      NULL,true, 'programada',u_admin),

    (p_domingo, tid_asamblea,'Asamblea Domingo 05/04/2026',         '2026-04-05','10:00:00','12:00:00','Sede Central',      NULL,true, 'programada',u_admin),

    (p_taller,  tid_taller,  'Taller Dominical 05/04/2026',         '2026-04-05','09:00:00','09:50:00','Sala de Talleres',  NULL,false,'programada',u_admin),

    (p_martes,  tid_asamblea,'Asamblea Martes 07/04/2026',         '2026-04-07','19:00:00','21:00:00','Sede Central',      NULL,true, 'programada',u_admin),

    (p_domingo, tid_asamblea,'Asamblea Domingo 12/04/2026',         '2026-04-12','10:00:00','12:00:00','Sede Central',      NULL,true, 'programada',u_admin),

    (p_taller,  tid_taller,  'Taller Dominical 12/04/2026',         '2026-04-12','09:00:00','09:50:00','Sala de Talleres',  NULL,false,'programada',u_admin),

    (p_martes,  tid_asamblea,'Asamblea Martes 14/04/2026',         '2026-04-14','19:00:00','21:00:00','Sede Central',      NULL,true, 'programada',u_admin),

    (p_domingo, tid_asamblea,'Asamblea Domingo 19/04/2026',         '2026-04-19','10:00:00','12:00:00','Sede Central',      NULL,true, 'programada',u_admin),

    (p_taller,  tid_taller,  'Taller Dominical 19/04/2026',         '2026-04-19','09:00:00','09:50:00','Sala de Talleres',  NULL,false,'programada',u_admin),

    (p_martes,  tid_asamblea,'Asamblea Martes 21/04/2026',         '2026-04-21','19:00:00','21:00:00','Sede Central',      NULL,true, 'programada',u_admin),

    (p_domingo, tid_asamblea,'Asamblea Domingo 26/04/2026',         '2026-04-26','10:00:00','12:00:00','Sede Central',      NULL,true, 'programada',u_admin),

    (p_taller,  tid_taller,  'Taller Dominical 26/04/2026',         '2026-04-26','09:00:00','09:50:00','Sala de Talleres',  NULL,false,'programada',u_admin),

    (p_martes,  tid_asamblea,'Asamblea Martes 28/04/2026',         '2026-04-28','19:00:00','21:00:00','Sede Central',      NULL,true, 'programada',u_admin),

    (p_domingo, tid_asamblea,'Asamblea Domingo 03/05/2026',         '2026-05-03','10:00:00','12:00:00','Sede Central',      NULL,true, 'programada',u_admin),

    (p_taller,  tid_taller,  'Taller Dominical 03/05/2026',         '2026-05-03','09:00:00','09:50:00','Sala de Talleres',  NULL,false,'programada',u_admin),

    (p_martes,  tid_asamblea,'Asamblea Martes 05/05/2026',         '2026-05-05','19:00:00','21:00:00','Sede Central',      NULL,true, 'programada',u_admin),

    (p_domingo, tid_asamblea,'Asamblea Domingo 10/05/2026',         '2026-05-10','10:00:00','12:00:00','Sede Central',      NULL,true, 'programada',u_admin),

    (p_taller,  tid_taller,  'Taller Dominical 10/05/2026',         '2026-05-10','09:00:00','09:50:00','Sala de Talleres',  NULL,false,'programada',u_admin);



  -- Actividades especiales

  INSERT INTO actividad (patron_id, tipo_actividad_id, nombre, descripcion, fecha, hora_inicio, hora_fin, lugar, grupo_id, es_publica, estado, creador_id)

  VALUES (NULL, tid_celebracion, 'Celebración Aniversario del Centro',

          'Celebración del aniversario del Centro Comunitario Los Pinos',

          '2026-03-30','19:00:00','22:00:00','Sede Central', NULL, true,'programada',u_admin)

  RETURNING id INTO a_celebracion;



  INSERT INTO actividad (patron_id, tipo_actividad_id, nombre, descripcion, fecha, hora_inicio, hora_fin, lugar, grupo_id, es_publica, estado, creador_id)

  VALUES (NULL, tid_encuentro, 'Encuentro de Jóvenes',

          'Actividad de integración con jóvenes de organizaciones vecinas',

          '2026-04-06','15:00:00','20:00:00','Gimnasio Municipal', g_jovenes, true,'programada',u_admin)

  RETURNING id INTO a_encuentro;



  INSERT INTO actividad (patron_id, tipo_actividad_id, nombre, descripcion, fecha, hora_inicio, hora_fin, lugar, grupo_id, es_publica, estado, creador_id)

  VALUES (NULL, tid_visita, 'Visita Sector Norte',

          'Visita a familias del sector norte de la comuna',

          '2026-04-13','10:00:00','13:00:00','Sector Norte', NULL, false,'programada',u_admin);



  RAISE NOTICE '✓ Actividades insertadas';





  -- =========================================================================

  -- 9. INVITADOS

  -- =========================================================================



  -- Asamblea Martes 17/03 — todos confirmados

  INSERT INTO invitado (actividad_id, miembro_id, responsabilidad_id, estado, asistio, fecha_invitacion, fecha_respuesta)

  VALUES

    (a_asamblea_mar1, m_pedro,  rid_presentador, 'confirmado', false, NOW()-INTERVAL '7 days', NOW()-INTERVAL '1 day'),

    (a_asamblea_mar1, m_maria,  rid_animador,    'confirmado', false, NOW()-INTERVAL '7 days', NOW()-INTERVAL '1 day'),

    (a_asamblea_mar1, m_javier, rid_musico,      'confirmado', false, NOW()-INTERVAL '7 days', NOW()-INTERVAL '1 day'),

    (a_asamblea_mar1, m_carlos, rid_tesorero_t,  'confirmado', false, NOW()-INTERVAL '7 days', NOW()-INTERVAL '1 day');



  -- Asamblea Domingo 22/03 — mix de estados

  INSERT INTO invitado (actividad_id, miembro_id, responsabilidad_id, estado, motivo_rechazo, asistio, fecha_invitacion, fecha_respuesta)

  VALUES

    (a_asamblea_dom1, m_pedro, rid_presentador, 'confirmado', NULL,                     false, NOW()-INTERVAL '7 days', NOW()-INTERVAL '1 day'),

    (a_asamblea_dom1, m_maria, rid_animador,    'confirmado', NULL,                     false, NOW()-INTERVAL '7 days', NOW()-INTERVAL '1 day'),

    (a_asamblea_dom1, m_ana,   rid_recepcion,   'pendiente',  NULL,                     false, NOW(),                   NULL),

    (a_asamblea_dom1, m_luis,  rid_vigilante,   'rechazado',  'Tengo turno de trabajo', false, NOW()-INTERVAL '5 days', NOW()-INTERVAL '2 days');



  -- Taller Dominical 22/03

  INSERT INTO invitado (actividad_id, miembro_id, responsabilidad_id, estado, asistio, fecha_invitacion, fecha_respuesta)

  VALUES

    (a_taller1, m_patricia, rid_instructor, 'confirmado', false, NOW()-INTERVAL '7 days', NOW()-INTERVAL '1 day'),

    (a_taller1, m_ana,      rid_instructor, 'confirmado', false, NOW()-INTERVAL '7 days', NOW()-INTERVAL '1 day');



  -- Encuentro de Jóvenes

  INSERT INTO invitado (actividad_id, miembro_id, responsabilidad_id, estado, asistio, fecha_invitacion, fecha_respuesta)

  VALUES

    (a_encuentro, m_ana,     rid_coordinador, 'confirmado', false, NOW()-INTERVAL '7 days', NOW()-INTERVAL '1 day'),

    (a_encuentro, m_luis,    rid_musico,      'confirmado', false, NOW()-INTERVAL '7 days', NOW()-INTERVAL '1 day'),

    (a_encuentro, m_daniela, rid_cantante,    'pendiente',  false, NOW(),                   NULL),

    (a_encuentro, m_javier,  rid_musico,      'confirmado', false, NOW()-INTERVAL '7 days', NOW()-INTERVAL '1 day');



  -- Celebración Aniversario

  INSERT INTO invitado (actividad_id, miembro_id, responsabilidad_id, estado, asistio, fecha_invitacion, fecha_respuesta)

  VALUES

    (a_celebracion, m_carlos,   rid_coordinador, 'confirmado', false, NOW()-INTERVAL '7 days', NOW()-INTERVAL '1 day'),

    (a_celebracion, m_pedro,    rid_presentador, 'confirmado', false, NOW()-INTERVAL '7 days', NOW()-INTERVAL '1 day'),

    (a_celebracion, m_patricia, rid_tesorero_t,  'pendiente',  false, NOW(),                   NULL);



  RAISE NOTICE '✓ Invitados insertados';





  -- =========================================================================

  -- 10. NECESIDADES LOGÍSTICAS

  -- =========================================================================



  INSERT INTO necesidad (actividad_id, tipo_necesidad_id, descripcion, cantidad_requerida, unidad_medida, cantidad_cubierta, estado)

  VALUES (a_encuentro, tnid_transporte,   'Bus para traslado al gimnasio municipal', 1,  'vehículos', 0,  'abierta')

  RETURNING id INTO n_transp_encuentro;



  INSERT INTO necesidad (actividad_id, tipo_necesidad_id, descripcion, cantidad_requerida, unidad_medida, cantidad_cubierta, estado)

  VALUES (a_encuentro, tnid_alimentacion, 'Colaciones y bebidas para los asistentes', 40, 'porciones', 15, 'abierta')

  RETURNING id INTO n_alim_encuentro;



  INSERT INTO necesidad (actividad_id, tipo_necesidad_id, descripcion, cantidad_requerida, unidad_medida, cantidad_cubierta, estado)

  VALUES (a_encuentro, tnid_equipos,      'Equipo de sonido portátil',               1,  'equipos',   1,  'cubierta')

  RETURNING id INTO n_equip_encuentro;



  INSERT INTO necesidad (actividad_id, tipo_necesidad_id, descripcion, cantidad_requerida, unidad_medida, cantidad_cubierta, estado)

  VALUES (a_celebracion, tnid_alimentacion, 'Bocadillos y bebidas para el aniversario', 60, 'porciones', 0, 'abierta')

  RETURNING id INTO n_alim_celebracion;



  INSERT INTO necesidad (actividad_id, tipo_necesidad_id, descripcion, cantidad_requerida, unidad_medida, cantidad_cubierta, estado)

  VALUES (a_celebracion, tnid_decoracion, 'Decoración y ambientación de la sala',    1,  'juegos',    0,  'abierta');



  RAISE NOTICE '✓ Necesidades logísticas insertadas';





  -- =========================================================================

  -- 11. COLABORADORES

  -- =========================================================================



  INSERT INTO colaborador (necesidad_id, miembro_id, cantidad_comprometida, observaciones, estado, fecha_compromiso, fecha_decision)

  VALUES

    (n_transp_encuentro, m_roberto,   1,  'Tengo camioneta disponible ese día',      'aceptada', NOW()-INTERVAL '3 days', NOW()-INTERVAL '1 day'),

    (n_alim_encuentro,   m_carlos,   10,  'Puedo llevar bebidas para 10 personas',   'aceptada', NOW()-INTERVAL '4 days', NOW()-INTERVAL '1 day'),

    (n_alim_encuentro,   m_patricia,  5,  'Preparo 5 porciones de colación',         'aceptada', NOW()-INTERVAL '2 days', NOW()-INTERVAL '1 day'),

    (n_equip_encuentro,  m_javier,    1,  'Presto el equipo de sonido del grupo',    'aceptada', NOW()-INTERVAL '5 days', NOW()-INTERVAL '2 days');



  RAISE NOTICE '✓ Colaboradores insertados';





  -- =========================================================================

  -- 12. HISTORIAL DE ESTADO (si la tabla existe)

  -- =========================================================================



  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'historial_estado') THEN

    INSERT INTO historial_estado (miembro_id, estado_anterior, estado_nuevo, motivo, usuario_id)

    VALUES

      (m_luis,    'asistente', 'probando',       'Asiste con regularidad y solicita iniciar período de incorporación',   u_admin),

      (m_daniela, 'asistente', 'probando',       'Participa activamente en el equipo juvenil, solicita incorporarse',    u_admin),

      (m_ana,     'probando',  'plena_comunion', 'Completó el período de incorporación, aprobada por la directiva',     u_admin);

    RAISE NOTICE '✓ Historial de estado insertado';

  END IF;





  RAISE NOTICE '';

  RAISE NOTICE '=== SEED COMPLETADO ===';

  RAISE NOTICE '  admin@centrolospinos.cl  →  Admin123!   (administrador)';

  RAISE NOTICE '  lider@centrolospinos.cl  →  Lider123!   (usuario)';

  RAISE NOTICE '  miembro1@test.cl         →  Miembro123! (usuario)';

  RAISE NOTICE '  miembro2@test.cl         →  Miembro123! (usuario)';

  RAISE NOTICE '  miembro3@test.cl         →  Miembro123! (usuario)';



END;

$$;



COMMIT;

