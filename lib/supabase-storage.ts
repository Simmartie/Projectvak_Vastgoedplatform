import { createClient } from '@/utils/supabase/client'

/**
 * Uploads a property image to Supabase Storage and returns the public URL.
 * @param file The file object from a file input
 * @returns Promise<string> The public URL of the uploaded image
 */
export async function uploadPropertyImage(file: File): Promise<string> {
    const supabase = createClient()
    
    // Generate a unique filename to avoid collisions
    const fileExt = file.name.split('.').pop()
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(2, 10)}.${fileExt}`
    const filePath = `${fileName}` // We'll store all images at the root of the 'properties' bucket for now

    // Upload the file to the 'properties' bucket
    const { data, error } = await supabase.storage
        .from('properties')
        .upload(filePath, file, {
            cacheControl: '3600',
            upsert: false
        })

    if (error) {
        console.error('Error uploading image to Supabase Storage:', error)
        throw new Error(`Upload failed: ${error.message}`)
    }

    // Get the public URL for the newly uploaded file
    const { data: { publicUrl } } = supabase.storage
        .from('properties')
        .getPublicUrl(filePath)

    return publicUrl
}
