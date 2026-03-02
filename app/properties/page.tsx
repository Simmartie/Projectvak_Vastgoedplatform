import { createClient } from '@/utils/supabase/server'

export default async function PropertiesPage() {
    // Initialize the Supabase server client
    const supabase = await createClient()

    // Fetch data from the 'properties' table
    const { data: properties, error } = await supabase
        .from('properties')
        .select('*')

    if (error) {
        return <div>Error loading properties: {error.message}</div>
    }

    return (
        <main className="p-8">
            <h1 className="text-2xl font-bold mb-4">Properties</h1>
            <ul className="space-y-2">
                {properties?.map((property) => (
                    <li key={property.id} className="p-4 border rounded-md shadow-sm">
                        {property.name} - ${property.price}
                    </li>
                ))}
            </ul>
        </main>
    )
}
