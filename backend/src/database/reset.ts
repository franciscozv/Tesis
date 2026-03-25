import { supabase } from '@/common/utils/supabaseClient';

// Tablas en orden inverso a las FK
const tablas = [
  { name: 'colaborador', pk: 'id' },
  { name: 'necesidad', pk: 'id' },
  { name: 'invitado', pk: 'id' },
  { name: 'actividad', pk: 'id' },
  { name: 'patron_actividad', pk: 'id' },
  { name: 'historial_estado', pk: 'id' },
  { name: 'integrante_grupo', pk: 'id_integrante' },
  { name: 'grupo_rol', pk: 'grupo_id' },
  { name: 'grupo', pk: 'id_grupo' },
  { name: 'miembro', pk: 'id' },
  { name: 'tipo_necesidad', pk: 'id_tipo' },
  { name: 'rol_grupo', pk: 'id_rol_grupo' },
  { name: 'responsabilidad_actividad', pk: 'id_responsabilidad' },
  { name: 'tipo_actividad', pk: 'id_tipo' },
];

async function resetDb() {
  console.log('\n🗑️  Limpiando base de datos...\n');

  for (const { name, pk } of tablas) {
    const { error } = await (supabase.from(name) as any).delete().gte(pk, 0);
    if (error) {
      console.log(`  ⚠️  ${name}: ${error.message}`);
    } else {
      console.log(`  ✅ ${name}: limpiado`);
    }
  }

  console.log('\n✅ Base de datos limpia. Ahora corre: pnpm seed\n');
}

resetDb();
