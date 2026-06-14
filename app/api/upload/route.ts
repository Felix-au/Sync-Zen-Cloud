import { NextRequest, NextResponse } from 'next/server'
import { uploadToCloudinary } from '@/lib/cloudinary'
import { auth } from '@/lib/auth'
import { canCheckIn } from '@/lib/roles'

/**
 * POST /api/upload
 *
 * Receives a base64 data URI from the client, uploads it to Cloudinary,
 * and returns the public_id (fileId) and CDN URL.
 *
 * Body:
 * {
 *   data: string,     // base64 data URI, e.g. "data:image/jpeg;base64,..."
 *   filename: string, // used for reference only (Cloudinary generates its own name)
 *   folder: string,   // Cloudinary folder path, e.g. "checkin/1234567890"
 * }
 *
 * Response:
 * { fileId: string, url: string }
 */
export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (!canCheckIn(session.user.role as any)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  try {
    const { data, folder } = await req.json()

    if (!data) {
      return NextResponse.json({ error: 'data is required' }, { status: 400 })
    }

    // Validate it's a data URI
    if (!data.startsWith('data:')) {
      return NextResponse.json({ error: 'data must be a base64 data URI' }, { status: 400 })
    }

    // Scope uploads under hotel ID so they're easy to find and clean up
    const cloudFolder = `synczen/${session.user.hotelId ?? 'unassigned'}/${folder ?? 'misc'}`

    const result = await uploadToCloudinary(data, cloudFolder)

    return NextResponse.json(result, { status: 201 })
  } catch (err: any) {
    console.error('[upload] Cloudinary error:', err?.message ?? err)
    return NextResponse.json(
      { error: 'Upload failed', detail: err.message },
      { status: 500 }
    )
  }
}
