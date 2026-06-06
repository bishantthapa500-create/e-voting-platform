/**
 * Seeder — run with:  npx ts-node src/seed.ts
 *
 * Creates:
 *  • 1 admin user (email/password from env or defaults below)
 *  • 3 sample elections (1 active, 1 upcoming, 1 closed)
 *  • 2-3 candidates per election
 *
 * Safe to run multiple times — skips records that already exist.
 */

import dotenv from 'dotenv';
dotenv.config();

import dns from 'dns';
dns.setServers(['8.8.8.8', '8.8.4.4', '1.1.1.1']);

import bcrypt from 'bcrypt';
import mongoose from 'mongoose';
import { connectDB } from './config/db';
import { User } from './models/User';
import { Election } from './models/Election';

// ── Seed config (override via env vars) ──────────────────────────────────────
const ADMIN_NAME     = process.env.SEED_ADMIN_NAME     || 'Admin User';
const ADMIN_EMAIL    = process.env.SEED_ADMIN_EMAIL    || 'admin@evoting.app';
const ADMIN_PASSWORD = process.env.SEED_ADMIN_PASSWORD || 'Admin@12345';

// ─────────────────────────────────────────────────────────────────────────────

async function seedAdmin(): Promise<mongoose.Types.ObjectId> {
  const existing = await User.findOne({ email: ADMIN_EMAIL.toLowerCase() });

  if (existing) {
    console.log(`  ✓ Admin already exists: ${ADMIN_EMAIL}`);
    if (existing.role !== 'ADMIN') {
      existing.role = 'ADMIN';
      await existing.save();
      console.log('  ✓ Role corrected to ADMIN');
    }
    return existing._id;
  }

  const passwordHash = await bcrypt.hash(ADMIN_PASSWORD, 12);
  const admin = await User.create({
    name: ADMIN_NAME,
    email: ADMIN_EMAIL.toLowerCase(),
    passwordHash,
    role: 'ADMIN',
    isVerified: true,       // seeded admin is pre-verified — no OTP needed
    isActive: true,
  });

  console.log(`  ✓ Admin created: ${ADMIN_EMAIL}  /  password: ${ADMIN_PASSWORD}`);
  return admin._id;
}

async function seedElections(adminId: mongoose.Types.ObjectId): Promise<void> {
  const now = new Date();

  const elections = [
    {
      title: 'Student Council President 2026',
      description: 'Annual election for the student council president position.',
      startTime: new Date(now.getTime() - 1000 * 60 * 60 * 2),   // started 2h ago
      endTime:   new Date(now.getTime() + 1000 * 60 * 60 * 22),  // ends in 22h
      status: 'active' as const,
      candidates: [
        { name: 'Alice Johnson',   party: 'Progress Party',  bio: 'Focused on campus sustainability and student welfare.' },
        { name: 'Bob Martinez',    party: 'Unity Alliance',  bio: 'Committed to improving campus facilities and safety.' },
        { name: 'Carol Lee',       party: 'Independent',     bio: 'Advocates for transparent governance and equal opportunities.' },
      ],
    },
    {
      title: 'Campus Infrastructure Committee',
      description: 'Vote for representatives who will oversee campus development projects.',
      startTime: new Date(now.getTime() + 1000 * 60 * 60 * 24 * 2),   // starts in 2 days
      endTime:   new Date(now.getTime() + 1000 * 60 * 60 * 24 * 5),   // ends in 5 days
      status: 'draft' as const,
      candidates: [
        { name: 'David Kim',   party: 'Green Campus',   bio: 'Pushing for eco-friendly building upgrades.' },
        { name: 'Eva Torres',  party: 'Tech Forward',   bio: 'Believes in smart campus infrastructure.' },
      ],
    },
    {
      title: 'Community Grants Panel 2025',
      description: 'Closed election — results are published.',
      startTime: new Date(now.getTime() - 1000 * 60 * 60 * 24 * 7),   // 7 days ago
      endTime:   new Date(now.getTime() - 1000 * 60 * 60 * 24 * 1),   // 1 day ago
      status: 'closed' as const,
      candidates: [
        { name: 'Frank Nguyen', party: 'Community First', bio: 'Long-term advocate for local grant programs.', voteCount: 142 },
        { name: 'Grace Obi',    party: 'Future Fund',     bio: 'Focused on youth and education grants.',      voteCount: 98  },
        { name: 'Henry Patel',  party: 'Equal Access',    bio: 'Supports underrepresented communities.',      voteCount: 61  },
      ],
    },
  ];

  for (const seed of elections) {
    const exists = await Election.findOne({ title: seed.title });
    if (exists) {
      console.log(`  ✓ Election already exists: "${seed.title}"`);
      continue;
    }

    await Election.create({
      title:       seed.title,
      description: seed.description,
      startTime:   seed.startTime,
      endTime:     seed.endTime,
      status:      seed.status,
      createdBy:   adminId,
      candidates:  seed.candidates.map((c) => ({
        name:      c.name,
        party:     c.party,
        bio:       c.bio,
        voteCount: ('voteCount' in c ? c.voteCount : 0),
      })),
      isDeleted: false,
    });

    console.log(`  ✓ Election created: "${seed.title}" [${seed.status}]`);
  }
}

async function main() {
  console.log('\n🌱  Starting seed...\n');

  await connectDB();

  console.log('👤  Admin user:');
  const adminId = await seedAdmin();

  console.log('\n🗳️   Elections:');
  await seedElections(adminId);

  console.log('\n✅  Seed complete.\n');
  console.log('──────────────────────────────────────');
  console.log(`  Admin email   : ${ADMIN_EMAIL}`);
  console.log(`  Admin password: ${ADMIN_PASSWORD}`);
  console.log('──────────────────────────────────────\n');

  await mongoose.disconnect();
  process.exit(0);
}

main().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
