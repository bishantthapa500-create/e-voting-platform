/**
 * MongoDB Atlas connectivity diagnostics
 * Run with: npx ts-node diagnose.ts
 */
import dns from 'dns';
import net from 'net';
import { promisify } from 'util';

// Force public DNS to bypass broken router/ISP DNS
dns.setServers(['8.8.8.8', '8.8.4.4', '1.1.1.1']);

const resolveSrv = promisify(dns.resolveSrv);
const resolve4 = promisify(dns.resolve4);

const ATLAS_HOST = 'cluster0.jlh7pzi.mongodb.net';
const SRV_RECORD = `_mongodb._tcp.${ATLAS_HOST}`;

async function testSrvResolution(): Promise<string[]> {
  console.log(`\n[1] Testing SRV resolution for ${SRV_RECORD} ...`);
  try {
    const records = await resolveSrv(SRV_RECORD);
    console.log('    ✅ SRV resolved:', records);
    return records.map((r) => r.name);
  } catch (err: unknown) {
    const e = err as NodeJS.ErrnoException;
    console.log(`    ❌ SRV failed: ${e.code} — ${e.message}`);
    return [];
  }
}

async function testIpv4Resolution(host: string): Promise<string[]> {
  console.log(`\n[2] Testing IPv4 resolution for ${host} ...`);
  try {
    const addresses = await resolve4(host);
    console.log('    ✅ IPv4 addresses:', addresses);
    return addresses;
  } catch (err: unknown) {
    const e = err as NodeJS.ErrnoException;
    console.log(`    ❌ IPv4 resolution failed: ${e.code} — ${e.message}`);
    return [];
  }
}

async function testTcpConnection(host: string, port: number): Promise<boolean> {
  return new Promise((resolve) => {
    console.log(`\n[3] Testing TCP connection to ${host}:${port} ...`);
    const socket = new net.Socket();
    const timeout = 5000;

    socket.setTimeout(timeout);

    socket.connect(port, host, () => {
      console.log(`    ✅ TCP connection to ${host}:${port} succeeded`);
      socket.destroy();
      resolve(true);
    });

    socket.on('timeout', () => {
      console.log(`    ❌ TCP connection timed out after ${timeout}ms`);
      socket.destroy();
      resolve(false);
    });

    socket.on('error', (err) => {
      console.log(`    ❌ TCP connection error: ${err.message}`);
      socket.destroy();
      resolve(false);
    });
  });
}

async function run(): Promise<void> {
  console.log('=== MongoDB Atlas Connectivity Diagnostics ===');
  console.log(`Node.js version: ${process.version}`);
  console.log(`Platform: ${process.platform}`);
  console.log(`DNS order: ${(dns as unknown as { getDefaultResultOrder?: () => string }).getDefaultResultOrder?.() ?? 'N/A'}`);

  // Test 1: SRV resolution via Node.js c-ares
  const srvHosts = await testSrvResolution();

  // Test 2: IPv4 resolution of the cluster hostname directly
  await testIpv4Resolution(ATLAS_HOST);

  // Test 3: TCP on port 27017 — try SRV-resolved hosts first, then cluster hostname
  const hostsToTest = srvHosts.length > 0 ? srvHosts : [ATLAS_HOST];
  for (const host of hostsToTest.slice(0, 2)) {
    await testTcpConnection(host, 27017);
  }

  // Test 4: Try port 27016 (Atlas TLS)
  await testTcpConnection(ATLAS_HOST, 27016);

  console.log('\n=== Diagnosis ===');
  if (srvHosts.length === 0) {
    console.log('🔴 SRV resolution failed in Node.js (c-ares DNS).');
    console.log('   → nslookup works because it uses the Windows resolver, not c-ares.');
    console.log('   → Fix: use a direct (non-SRV) connection string (see DIRECT_URI below).');
  } else {
    console.log('🟡 SRV resolution succeeded. Issue may be TCP/firewall on port 27017.');
    console.log('   → Check Atlas Network Access — your IP may not be whitelisted.');
  }

  console.log('\nDIRECT_URI (non-SRV fallback — use this in .env if SRV fails):');
  console.log(`mongodb://bishantthapa500_db_user:<password>@${ATLAS_HOST}:27017/voter-project?authSource=admin&ssl=true`);
  console.log('\nGet the exact non-SRV URI from Atlas: Cluster → Connect → Drivers → select Node.js → toggle "Standard connection string"');
}

run().catch(console.error);
