import mongoose from 'mongoose';
import dns from 'dns';
import { promisify } from 'util';

// Force Node.js c-ares to use reliable public DNS instead of the broken router/ISP DNS
dns.setServers(['8.8.8.8', '8.8.4.4', '1.1.1.1']);

const resolveSrv = promisify(dns.resolveSrv);

/**
 * Attempts to resolve the SRV record that mongodb+srv:// relies on.
 * Returns true if Node.js c-ares can resolve it, false if it times out or fails.
 */
async function canResolveSrv(host: string): Promise<boolean> {
  try {
    await Promise.race([
      resolveSrv(`_mongodb._tcp.${host}`),
      new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('SRV timeout')), 4000),
      ),
    ]);
    return true;
  } catch {
    return false;
  }
}

/**
 * Converts a mongodb+srv:// URI to a standard mongodb:// URI.
 * Atlas standard (non-SRV) URIs use port 27017 with ssl=true.
 *
 * Example:
 *   mongodb+srv://user:pass@cluster0.abc.mongodb.net/db?appName=X
 *   → mongodb://user:pass@cluster0.abc.mongodb.net:27017/db?authSource=admin&tls=true&appName=X
 */
function toDirectUri(srvUri: string): string {
  return srvUri
    .replace('mongodb+srv://', 'mongodb://')
    .replace(
      /(@[^/]+)(\/)/,
      (_match, host, slash) => `${host}:27017${slash}`,
    )
    .replace(/\?/, '?authSource=admin&tls=true&');
}

export const connectDB = async (): Promise<void> => {
  const uri = process.env.MONGODB_URI;

  if (!uri) {
    console.error('MongoDB connection error: MONGODB_URI is not defined in environment variables');
    process.exit(1);
  }

  // If the URI uses the SRV scheme, test whether Node.js can resolve it.
  // On Windows, c-ares (Node's DNS) sometimes fails SRV lookups that nslookup handles fine.
  let resolvedUri = uri;
  if (uri.startsWith('mongodb+srv://')) {
    // Extract hostname from the URI
    const hostMatch = uri.match(/@([^/?]+)/);
    const host = hostMatch?.[1] ?? '';
    const srvOk = await canResolveSrv(host);

    if (!srvOk) {
      resolvedUri = toDirectUri(uri);
      console.warn(
        '[db] SRV DNS resolution timed out in Node.js (c-ares).\n' +
        '     Falling back to direct connection string (port 27017 + TLS).\n' +
        `     URI: ${resolvedUri.replace(/:([^@]+)@/, ':***@')}`,
      );
    }
  }

  try {
    await mongoose.connect(resolvedUri, {
      serverSelectionTimeoutMS: 10000,
      connectTimeoutMS: 10000,
    });
    console.log('MongoDB connected successfully');
  } catch (error) {
    console.error('MongoDB connection error:', error);
    process.exit(1);
  }
};

export default mongoose;
