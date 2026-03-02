import { getPropertyById } from '@/lib/properties'

export async function GET(req: Request) {
  try {
    const prop = await getPropertyById('prop-1')
    return Response.json({ prop })
  } catch (err: any) {
    return Response.json({ error: err.message })
  }
}
