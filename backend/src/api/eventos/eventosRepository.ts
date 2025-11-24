import { supabase } from '@/common/utils/supabaseClient';
import type { Evento, EventoConIglesias, IglesiaInvitada, EstadoEvento } from './eventosModel';

export class EventosRepository {
  /**
   * Obtiene todos los eventos activos
   */
  async findAllAsync(): Promise<Evento[]> {
    const { data, error } = await supabase
      .from('evento')
      .select('*')
      .eq('activo', true)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data as Evento[];
  }

  /**
   * Obtiene un evento por ID (solo si está activo)
   */
  async findByIdAsync(id: number): Promise<Evento | null> {
    const { data, error } = await supabase
      .from('evento')
      .select('*')
      .eq('id_evento', id)
      .eq('activo', true)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null;
      throw error;
    }
    return data as Evento;
  }

  /**
   * Obtiene eventos filtrados por estado
   */
  async findByEstadoAsync(estado: EstadoEvento): Promise<Evento[]> {
    const { data, error } = await supabase
      .from('evento')
      .select('*')
      .eq('estado', estado)
      .eq('activo', true)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data as Evento[];
  }

  /**
   * Obtiene eventos filtrados por rango de fechas
   */
  async findByFechasAsync(fecha_inicio: string, fecha_fin: string): Promise<Evento[]> {
    const { data, error } = await supabase
      .from('evento')
      .select('*')
      .gte('fecha_inicio', fecha_inicio)
      .lte('fecha_fin', fecha_fin)
      .eq('activo', true)
      .order('fecha_inicio', { ascending: true });

    if (error) throw error;
    return data as Evento[];
  }

  /**
   * Crea un nuevo evento
   */
  async createAsync(
    eventoData: Omit<Evento, 'id_evento' | 'created_at' | 'updated_at' | 'activo'>
  ): Promise<Evento> {
    const { data, error } = await supabase
      .from('evento')
      .insert({ ...eventoData, activo: true })
      .select()
      .single();

    if (error) throw error;
    return data as Evento;
  }

  /**
   * Actualiza un evento existente
   */
  async updateAsync(id: number, eventoData: Partial<Evento>): Promise<Evento | null> {
    const { data, error } = await supabase
      .from('evento')
      .update(eventoData)
      .eq('id_evento', id)
      .eq('activo', true)
      .select()
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null;
      throw error;
    }
    return data as Evento;
  }

  /**
   * Soft delete: marca el evento como inactivo
   */
  async deleteAsync(id: number): Promise<boolean> {
    const { error } = await supabase.from('evento').update({ activo: false }).eq('id_evento', id);

    if (error) throw error;
    return true;
  }

  /**
   * Agrega iglesias invitadas a un evento
   */
  async addIglesiasInvitadasAsync(evento_id: number, iglesias_ids: number[]): Promise<void> {
    const inserts = iglesias_ids.map((iglesia_id) => ({
      evento_id,
      iglesia_id,
    }));

    const { error } = await supabase.from('evento_iglesia_invitada').insert(inserts);

    if (error) throw error;
  }

  /**
   * Obtiene las iglesias invitadas de un evento con información completa
   */
  async getIglesiasInvitadasAsync(evento_id: number): Promise<IglesiaInvitada[]> {
    const { data, error } = await supabase
      .from('evento_iglesia_invitada')
      .select(
        `
        iglesia:iglesia_id (
          id_iglesia,
          nombre,
          ciudad
        )
      `
      )
      .eq('evento_id', evento_id);

    if (error) throw error;

    // Transformar el resultado para retornar solo los datos de iglesia
    return (data || []).map((item: any) => item.iglesia as IglesiaInvitada);
  }

  /**
   * Obtiene un evento con sus iglesias invitadas
   */
  async findByIdWithIglesiasAsync(id: number): Promise<EventoConIglesias | null> {
    const evento = await this.findByIdAsync(id);
    if (!evento) return null;

    const iglesias_invitadas = await this.getIglesiasInvitadasAsync(id);

    return {
      ...evento,
      iglesias_invitadas,
    };
  }

  /**
   * Verifica si un tipo de evento existe y está activo
   */
  async tipoEventoExistsAndActiveAsync(id: number): Promise<boolean> {
    const { data, error } = await supabase
      .from('tipo_evento')
      .select('id_tipo_evento')
      .eq('id_tipo_evento', id)
      .eq('activo', true)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return false;
      throw error;
    }
    return !!data;
  }

  /**
   * Verifica si un grupo existe y está activo
   */
  async grupoExistsAndActiveAsync(id: number): Promise<boolean> {
    const { data, error } = await supabase
      .from('grupo_ministerial')
      .select('id_grupo')
      .eq('id_grupo', id)
      .eq('activo', true)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return false;
      throw error;
    }
    return !!data;
  }

  /**
   * Verifica si un usuario existe y está activo
   */
  async usuarioExistsAndActiveAsync(id: number): Promise<boolean> {
    const { data, error } = await supabase
      .from('user')
      .select('id')
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return false;
      throw error;
    }
    return !!data;
  }

  /**
   * Verifica si una iglesia existe y está activa
   */
  async iglesiaExistsAndActiveAsync(id: number): Promise<boolean> {
    const { data, error } = await supabase
      .from('iglesia')
      .select('id_iglesia')
      .eq('id_iglesia', id)
      .eq('activo', true)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return false;
      throw error;
    }
    return !!data;
  }
}
