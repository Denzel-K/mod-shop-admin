#!/usr/bin/env node
/*
  Audit assets completeness in MongoDB.
  Usage: node scripts/audit-assets.js --limit 200
  Requires env: MONGODB_URI (auto-loads from .env.local if present)
*/
const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');

const args = process.argv.slice(2);
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
  contributions: { type: Array, default: undefined },
  progress: { type: ProgressSchema, default: undefined },
}, { timestamps: true, collection: 'assets' });

const Asset = mongoose.models.Asset || mongoose.model('Asset', AssetSchema);

function hasPrimaryInfo(a) {
  return Boolean(a.make || a.model || a.year);
}
function nonEmpty(obj) {
  return !!(obj && typeof obj === 'object' && Object.keys(obj).length > 0);
}

async function main() {
  const limit = Math.max(1, Math.min(2000, parseInt(getArg('limit', '500'), 10) || 500));
  await mongoose.connect(MONGODB_URI, { bufferCommands: false });

  const assets = await Asset.find({}).sort({ createdAt: -1 }).limit(limit).lean();
  let missingProgress = 0;
  let missingLastEditedBy = 0;
  let withPrimary = 0;
  let withAnyMetadata = 0;

  const rows = assets.map(a => {
    const anyMd = !!a.metadata && Object.values(a.metadata || {}).some(nonEmpty);
    if (!a.progress) missingProgress++;
    if (!a.lastEditedBy) missingLastEditedBy++;
    if (hasPrimaryInfo(a)) withPrimary++;
    if (anyMd) withAnyMetadata++;
    return {
      id: String(a._id),
      name: a.name,
      hasProgress: !!a.progress,
      hasLastEditedBy: !!a.lastEditedBy,
      hasPrimaryInfo: hasPrimaryInfo(a),
      anyMetadata: anyMd,
      existingOverall: a.progress?.overall ?? null,
    };
  });

  console.log(JSON.stringify({
    total: assets.length,
    missingProgress,
    missingLastEditedBy,
    withPrimary,
    withAnyMetadata,
    sample: rows.slice(0, 30),
  }, null, 2));

  await mongoose.disconnect();
}

main().catch(async (e) => {
  console.error(e);
  try { await mongoose.disconnect(); } catch {}
  process.exit(1);
});
