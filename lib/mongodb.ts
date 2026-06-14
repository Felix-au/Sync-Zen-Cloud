import mongoose from 'mongoose'
import dns from 'dns/promises'

/**
 * MongoDB connection singleton.
 * Reuses the existing connection across hot-reloads in development
 * and across requests in production (each serverless function reuses the cached promise).
 *
 * DNS fix: Some home/office routers silently drop DNS SRV queries that MongoDB Atlas
 * +srv:// URIs rely on. We pre-resolve the SRV record using Google's 8.8.8.8 resolver
 * and build a direct connection string, falling back to the original URI if resolution fails.
 */

const MONGODB_URI = process.env.MONGODB_URI!

if (!MONGODB_URI) {
  throw new Error('MONGODB_URI is not defined in environment variables')
}

interface MongooseCache {
  conn: typeof mongoose | null
  promise: Promise<typeof mongoose> | null
}

// In development, Next.js hot-reloads can create multiple connections.
// We cache the connection on the global object to prevent that.
declare global {
  // eslint-disable-next-line no-var
  var _mongooseCache: MongooseCache
}

const cached: MongooseCache = global._mongooseCache ?? { conn: null, promise: null }
global._mongooseCache = cached

/**
 * Resolves a mongodb+srv URI into a direct replica-set URI using Google DNS.
 * Falls back to the original URI if resolution fails or URI is not +srv format.
 */
async function resolveMongoUri(uri: string): Promise<string> {
  if (!uri.startsWith('mongodb+srv://')) return uri

  try {
    // Parse the +srv URI
    const url     = new URL(uri.replace('mongodb+srv://', 'http://'))
    const host    = url.hostname
    const rest    = uri.substring(uri.indexOf(host) + host.length) // everything after hostname

    // Use Google's DNS to resolve the SRV records
    const resolver = new dns.Resolver()
    resolver.setServers(['8.8.8.8', '8.8.4.4'])
    const srvRecords = await resolver.resolveSrv(`_mongodb._tcp.${host}`)

    if (!srvRecords.length) throw new Error('No SRV records found')

    // Build the direct replica set URI
    const hosts    = srvRecords.map(r => `${r.name}:${r.port}`).join(',')
    const userInfo = url.username ? `${url.username}:${decodeURIComponent(url.password)}@` : ''
    const dbName   = url.pathname || '/syncstay'

    // Carry over any existing query params, add ssl+authSource
    const params = new URLSearchParams(url.search)
    params.set('ssl', 'true')
    params.set('authSource', 'admin')

    const directUri = `mongodb://${userInfo}${hosts}${dbName}?${params.toString()}`
    console.log('[mongodb] Resolved SRV → direct connection string')
    return directUri
  } catch (err) {
    // SRV resolution failed — log and fall back to original URI
    console.warn('[mongodb] SRV pre-resolve failed, using original URI:', (err as Error).message)
    return uri
  }
}

export async function connectDB(): Promise<typeof mongoose> {
  if (cached.conn) return cached.conn

  if (!cached.promise) {
    // Resolve the URI first, then store the connection promise atomically.
    // Without this, two concurrent requests both see cached.promise===null,
    // both call resolveMongoUri() which may return different resolved strings,
    // and both attempt mongoose.connect() → "Can't call openUri() on active connection".
    const uri = await resolveMongoUri(MONGODB_URI)

    // Check again after await — another request may have set cached.promise
    if (!cached.promise) {
      cached.promise = mongoose.connect(uri, {
        bufferCommands: false,
      })
    }
  }

  cached.conn = await cached.promise
  return cached.conn
}
