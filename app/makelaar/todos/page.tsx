'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { getCurrentUser } from '@/lib/auth'
import { getProperties, Property } from '@/lib/properties'
import { Todo, getTodos, createTodo, updateTodo, deleteTodo } from '@/lib/todos'
import { Header } from '@/components/header'
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { CheckCircle2, Circle, Clock, Plus, Trash2, ArrowLeft, Building2, Pencil } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import Link from 'next/link'

export default function TodosPage() {
  const router = useRouter()
  const [todos, setTodos] = useState<Todo[]>([])
  const [properties, setProperties] = useState<Property[]>([])
  const [loading, setLoading] = useState(true)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  
  // Form State
  const [editingId, setEditingId] = useState<string | null>(null)
  const [selectedPropertyId, setSelectedPropertyId] = useState<string>('')
  const [description, setDescription] = useState('')

  useEffect(() => {
    const user = getCurrentUser()
    if (!user || user.role !== 'makelaar') {
      router.push('/')
      return
    }
    
    const loadData = async () => {
      const [fetchedTodos, fetchedProps] = await Promise.all([
        getTodos(),
        getProperties()
      ])
      setTodos(fetchedTodos || [])
      setProperties(fetchedProps || [])
      setLoading(false)
    }
    loadData()
  }, [router])

  const handleOpenDialog = (todo?: Todo) => {
    if (todo) {
      setEditingId(todo.id)
      setSelectedPropertyId(todo.property_id)
      setDescription(todo.description)
    } else {
      setEditingId(null)
      setSelectedPropertyId('')
      setDescription('')
    }
    setIsDialogOpen(true)
  }

  const handleSaveTodo = async () => {
    if (!selectedPropertyId || !description) return

    if (editingId) {
      const updated = await updateTodo(editingId, {
        property_id: selectedPropertyId,
        description,
      })
      if (updated) {
        setTodos(todos.map(t => t.id === editingId ? updated : t))
      }
    } else {
      const newTodo = await createTodo({
        property_id: selectedPropertyId,
        description,
        status: 'todo',
      })
      if (newTodo) {
        setTodos([newTodo, ...todos])
      }
    }
    setIsDialogOpen(false)
  }

  const handleDelete = async (id: string) => {
    if (confirm('Weet je zeker dat je deze taak wilt verwijderen?')) {
      const success = await deleteTodo(id)
      if (success) {
        setTodos(todos.filter(t => t.id !== id))
      }
    }
  }

  const handleToggleStatus = async (todo: Todo) => {
    const newStatus = todo.status === 'done' ? 'todo' : 'done'
    const updated = await updateTodo(todo.id, { status: newStatus })
    if (updated) {
      setTodos(todos.map(t => t.id === todo.id ? updated : t))
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-4 pt-8 pb-24">
        <div className="mb-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <Button variant="outline" size="icon" asChild>
              <Link href="/makelaar">
                <ArrowLeft className="h-4 w-4" />
              </Link>
            </Button>
            <div>
              <h2 className="text-3xl font-bold">To-do lijst</h2>
              <p className="text-muted-foreground">Beheer taken voor al je panden</p>
            </div>
          </div>

          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => handleOpenDialog()} className="bg-primary hover:bg-primary/90">
                <Plus className="mr-2 h-4 w-4" />
                Nieuwe To-do
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{editingId ? 'Taak bewerken' : 'Nieuwe taak toevoegen'}</DialogTitle>
                <DialogDescription>
                  Vul de details in voor deze taak en koppel deze aan een pand.
                </DialogDescription>
              </DialogHeader>
              
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="property">Pand *</Label>
                  <Select value={selectedPropertyId} onValueChange={setSelectedPropertyId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecteer een pand" />
                    </SelectTrigger>
                    <SelectContent>
                      {properties.map(p => (
                        <SelectItem key={p.id} value={p.id}>
                          {p.address}, {p.city}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="grid gap-2">
                  <Label htmlFor="description">Wat moet er gebeuren? *</Label>
                  <Textarea 
                    id="description" 
                    value={description} 
                    onChange={e => setDescription(e.target.value)} 
                    placeholder="Beschrijf de to-do hier..."
                    rows={4}
                  />
                </div>
              </div>
              
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Annuleren</Button>
                <Button onClick={handleSaveTodo} disabled={!description || !selectedPropertyId}>
                  Opslaan
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        {loading ? (
          <div className="flex justify-center p-12">
            <Clock className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : todos.length === 0 ? (
          <Card className="border-dashed border-2 bg-muted/50">
            <CardContent className="flex flex-col items-center justify-center py-12 text-center">
              <CheckCircle2 className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-xl font-semibold mb-2">Je bent helemaal bij!</h3>
              <p className="text-muted-foreground mb-6">Er zijn momenteel geen taken. Voeg een nieuwe toe om te beginnen.</p>
              <Button onClick={() => handleOpenDialog()}>
                <Plus className="mr-2 h-4 w-4" />
                Voeg eerste taak toe
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {todos.map(todo => {
              const property = properties.find(p => p.id === todo.property_id)
              const isDone = todo.status === 'done'

              return (
                <Card key={todo.id} className={`transition-all duration-200 border-l-4 ${isDone ? 'border-l-green-500 opacity-60' : 'border-l-primary hover:shadow-md'}`}>
                  <CardHeader className="pb-3">
                    <div className="flex justify-between items-start">
                      <button 
                        onClick={() => handleToggleStatus(todo)}
                        className="text-left flex-1 flex gap-3 group"
                      >
                        <div className="mt-1">
                          {isDone ? (
                            <CheckCircle2 className="h-5 w-5 text-green-500 transition-transform group-hover:scale-110" />
                          ) : (
                            <Circle className="h-5 w-5 text-muted-foreground transition-transform group-hover:scale-110" />
                          )}
                        </div>
                        <div className="flex-1">
                          <CardTitle className={`text-lg transition-colors ${isDone ? 'line-through text-muted-foreground' : ''}`}>
                            {property ? `${property.address}, ${property.city}` : todo.properties?.address || 'Onbekend pand'}
                          </CardTitle>
                          <div className={`mt-2 text-sm text-foreground ${isDone ? 'line-through opacity-60' : ''} whitespace-pre-wrap`}>
                            {todo.description}
                          </div>
                        </div>
                      </button>
                    </div>
                  </CardHeader>
                  <CardFooter className="flex justify-end gap-2 pt-0">
                    <Button variant="ghost" size="icon" onClick={() => handleOpenDialog(todo)} className="h-8 w-8">
                      <Pencil className="h-4 w-4 text-muted-foreground" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => handleDelete(todo.id)} className="h-8 w-8 hover:text-destructive">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </CardFooter>
                </Card>
              )
            })}
          </div>
        )}
      </main>
    </div>
  )
}
