import { createClient } from '@/utils/supabase/client'

export interface Todo {
  id: string
  property_id: string
  description: string
  status: 'todo' | 'in_progress' | 'done'
  created_at?: string
  updated_at?: string
  properties?: {
    address: string
    city: string
  }
}

export async function getTodos(): Promise<Todo[]> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('todos')
    .select('*, properties(address, city)')
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching todos:', error)
    return []
  }
  return data as Todo[]
}

export async function getTodosByProperty(propertyId: string): Promise<Todo[]> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('todos')
    .select('*, properties(address, city)')
    .eq('property_id', propertyId)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching todos for property:', error)
    return []
  }
  return data as Todo[]
}

export async function createTodo(todo: Omit<Todo, 'id' | 'created_at' | 'updated_at' | 'properties'>): Promise<Todo | null> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('todos')
    .insert(todo)
    .select('*, properties(address, city)')
    .single()

  if (error) {
    console.error('Error creating todo:', error)
    return null
  }
  return data as Todo
}

export async function updateTodo(id: string, updates: Partial<Todo>): Promise<Todo | null> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('todos')
    .update(updates)
    .eq('id', id)
    .select('*, properties(address, city)')
    .single()

  if (error) {
    console.error('Error updating todo:', error)
    return null
  }
  return data as Todo
}

export async function deleteTodo(id: string): Promise<boolean> {
  const supabase = createClient()
  const { error } = await supabase
    .from('todos')
    .delete()
    .eq('id', id)

  if (error) {
    console.error('Error deleting todo:', error)
    return false
  }
  return true
}
