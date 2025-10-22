#!/usr/bin/env node
/*
  Normalize and update assets.progress in MongoDB
  Usage examples:
    node scripts/update-assets-progress.js --dry-run true --only-missing true --limit 500
    node scripts/update-assets-progress.js --apply --only-missing true --limit 500
  Flags:
    --dry-run [true|false]   default true (ignored if --apply is set)
    --apply                  perform writes
    --only-missing [true|false] default true (update only docs missing progress/lastEditedBy)
    --limit N                default 500 (1..2000)
*/
const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');

const args = process.argv.slice(2);
function hasFlag(name) { return args.includes(`--${name}`); }
function getArg(name, def) {
  const idx = args.findIndex(a => a === `--${name}`);
  if (idx !== -1) {
    const next = args[idx + 1];
    if (next && !next.startsWith('--')) return next;
    return true;
  }
  return def;
}

// Lightweight .env loader for .env.local to avoid adding dependencies
if (!process.env.MONGODB_URI) {
  try {
    const envPath = path.resolve(__dirname, '..', '.env.local');
    if (fs.existsSync(envPath)) {
      const content = fs.readFileSync(envPath, 'utf8');
      content.split(/\r?\n/).forEach((line) => {
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith('#')) return;
        const eq = trimmed.indexOf('=');
        if (eq === -1) return;
        const key = trimmed.slice(0, eq).trim();
        const valRaw = trimmed.slice(eq + 1).trim();
        const val = valRaw.startsWith('"') && valRaw.endsWith('"') ? valRaw.slice(1, -1) : (valRaw.startsWith("'") && valRaw.endsWith("'")) ? valRaw.slice(1, -1) : valRaw;
        if (!(key in process.env)) process.env[key] = val;
      });
    }
  } catch {}
}

const MONGODB_URI = process.env.MONGODB_URI;
if (!MONGODB_URI) {
  console.error('Missing MONGODB_URI. Set it in environment or .env.local when running via Next.');
  process.exit(1);
}

// Define minimal model in-script to avoid TS/Next imports
const AssetMetadataSchema = new mongoose.Schema({
  wrappableSurfaces: mongoose.Schema.Types.Mixed,
  rims: mongoose.Schema.Types.Mixed,
  windows: mongoose.Schema.Types.Mixed,
  doors: mongoose.Schema.Types.Mixed,
  tyres: mongoose.Schema.Types.Mixed,
  interior: mongoose.Schema.Types.Mixed,
  lights: mongoose.Schema.Types.Mixed,
  other: mongoose.Schema.Types.Mixed,
}, { _id: false });

const CuratorSchema = new mongoose.Schema({
  mode: { type: String, enum: ['self','proxy','automation','import'], default: undefined },
  adminId: { type: mongoose.Schema.Types.ObjectId, ref: 'Admin', default: undefined },
  name: { type: String, trim: true },
  email: { type: String, trim: true },
}, { _id: false });

const EditorSchema = new mongoose.Schema({
  adminId: { type: mongoose.Schema.Types.ObjectId, ref: 'Admin', default: undefined },
  name: { type: String, trim: true },
  email: { type: String, trim: true },
  at: { type: Date, default: undefined },
}, { _id: false });

const ProgressSchema = new mongoose.Schema({
  overall: { type: Number, default: 0 },
  primaryInfo: { type: Number, default: 0 },
  breakdown: {
    wrappableSurfaces: { type: Number, default: 0 },
    rims: { type: Number, default: 0 },
    windows: { type: Number, default: 0 },
    doors: { type: Number, default: 0 },
    tyres: { type: Number, default: 0 },
    interior: { type: Number, default: 0 },
    lights: { type: Number, default: 0 },
    other: { type: Number, default: 0 },
  },
  metadataCompleted: {
    wrappableSurfaces: { type: Boolean, default: false },
    rims: { type: Boolean, default: false },
    windows: { type: Boolean, default: false },
    doors: { type: Boolean, default: false },
    tyres: { type: Boolean, default: false },
    interior: { type: Boolean, default: false },
    lights: { type: Boolean, default: false },
    other: { type: Boolean, default: false },
  },
}, { _id: false });

const ContributionSchema = new mongoose.Schema({
  adminId: { type: mongoose.Schema.Types.ObjectId, ref: 'Admin', default: undefined },
  name: { type: String, trim: true },
  email: { type: String, trim: true },
  at: { type: Date, default: undefined },
  delta: { type: Number, default: 0 },
  categories: { type: [String], default: undefined },
}, { _id: false });

const AssetSchema = new mongoose.Schema({
  name: String,
  description: String,
  modelUrl: String,
  modelPublicId: String,
  thumbnailUrl: String,
  thumbnailPublicId: String,
  format: String,
  sizeBytes: Number,
  scale: Number,
  assetSource: String,
  creatorCredits: { text: { type: String, trim: true } },
  make: String,
  model: String,
  year: Number,
  variant: String,
  tags: [String],
  metadata: { type: AssetMetadataSchema, default: undefined },
  curatedBy: { type: CuratorSchema, default: undefined },
  curatedAt: { type: Date, default: undefined },
  lastEditedBy: { type: EditorSchema, default: undefined },
  contributions: { type: [ContributionSchema], default: undefined },
  progress: { type: ProgressSchema, default: undefined },
}, { timestamps: true, collection: 'assets' });

const Asset = mongoose.models.Asset || mongoose.model('Asset', AssetSchema);
const Admin = mongoose.models.Admin || mongoose.model('Admin', new mongoose.Schema({ fullname: String, email: String }, { collection: 'admins' }));

function hasPrimaryInfo(a) { return Boolean(a.make || a.model || a.year); }
function nonEmpty(obj) { return !!(obj && typeof obj === 'object' && Object.keys(obj).length > 0); }

// Equal weights across all metadata categories for the remaining 50%
const META_CATEGORIES = [
  'wrappableSurfaces',
  'rims',
  'windows',
  'doors',
  'tyres',
  'interior',
  'lights',
  'other',
];
const PER_CATEGORY = 50 / META_CATEGORIES.length; // e.g., 6.25 for 8 categories

function computeBreakdown(md) {
  const breakdown = {};
  if (!md) return { breakdown, sum: 0 };
  let sum = 0;
  META_CATEGORIES.forEach((k) => {
    if (nonEmpty(md[k])) { breakdown[k] = (breakdown[k] || 0) + PER_CATEGORY; sum += PER_CATEGORY; }
  });
  // Clamp floating noise
  Object.keys(breakdown).forEach((k) => { breakdown[k] = Math.round(breakdown[k] * 100) / 100; });
  sum = Math.round(sum * 100) / 100;
  return { breakdown, sum };
}

async function main() {
  const limit = Math.max(1, Math.min(2000, parseInt(getArg('limit', '500'), 10) || 500));
  const apply = hasFlag('apply') || String(getArg('apply', 'false')) === 'true';
  const dryRun = apply ? false : String(getArg('dry-run', 'true')) !== 'false';
  const onlyMissing = String(getArg('only-missing', 'true')) !== 'false';

  await mongoose.connect(MONGODB_URI, { bufferCommands: false });

  const query = onlyMissing ? { $or: [ { progress: { $exists: false } }, { lastEditedBy: { $exists: false } } ] } : {};
  const assets = await Asset.find(query).sort({ createdAt: 1 }).limit(limit).lean();

  let updated = 0; const examined = assets.length;
  const preview = [];

  for (const a of assets) {
    const primaryInfo = hasPrimaryInfo(a) ? 50 : 0;
    const { breakdown, sum } = computeBreakdown(a.metadata);
    const overall = Math.min(100, primaryInfo + sum);

    // derive metadataCompleted
    const metadataCompleted = {}; Object.keys(breakdown).forEach((k) => { if ((breakdown[k] || 0) > 0) metadataCompleted[k] = true; });

    // hydrate lastEditedBy from curatedBy when missing
    let lastEditedBy = a.lastEditedBy;
    if (!lastEditedBy && a.curatedBy && a.curatedBy.adminId) {
      let name = a.curatedBy.name; let email = a.curatedBy.email;
      if (!name || !email) {
        try { const adminDoc = await Admin.findById(a.curatedBy.adminId).lean(); if (adminDoc) { name = name || adminDoc.fullname; email = email || adminDoc.email; } } catch {}
      }
      lastEditedBy = { adminId: a.curatedBy.adminId, name, email, at: a.updatedAt || a.createdAt || new Date() };
    }

    preview.push({ id: String(a._id), name: a.name, primaryInfo, breakdownSum: sum, overall });

    if (!dryRun) {
      const contributions = (() => {
        const list = [];
        if (primaryInfo === 50 && a.curatedBy && a.curatedBy.adminId) {
          list.push({ adminId: a.curatedBy.adminId, name: a.curatedBy.name, email: a.curatedBy.email, at: a.curatedAt || a.createdAt || new Date(), delta: 50, categories: [] });
        }
        if (sum > 0 && a.curatedBy && a.curatedBy.adminId) {
          list.push({ adminId: a.curatedBy.adminId, name: a.curatedBy.name, email: a.curatedBy.email, at: a.updatedAt || new Date(), delta: sum, categories: Object.keys(breakdown).filter(k => (breakdown[k] || 0) > 0) });
        }
        return list.length ? list : undefined;
      })();

      await Asset.updateOne({ _id: a._id }, {
        $set: { progress: { overall, primaryInfo, breakdown, metadataCompleted }, ...(lastEditedBy ? { lastEditedBy } : {}) },
        ...(contributions ? { $push: { contributions: { $each: contributions } } } : {}),
      });
      updated += 1;
    }
  }

  console.log(JSON.stringify({ examined, wouldUpdate: dryRun ? examined : undefined, updated: dryRun ? undefined : updated, preview: preview.slice(0, 20) }, null, 2));

  await mongoose.disconnect();
}

main().catch(async (e) => { console.error(e); try { await mongoose.disconnect(); } catch {} process.exit(1); });
