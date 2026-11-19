/**
 * Osaka offline artwork publisher. Never expose API credentials in GitHub Pages.
 * plan = local validation + exact prompt; generate = paid image edits staged only;
 * apply = only approved illustrations, assets and trip.json change together locally.
 */
import { readFile, writeFile, mkdir, copyFile, stat } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(fileURLToPath(new URL('..', import.meta.url)));
const configPath = path.join(root, 'artwork', 'osaka-pilot.json');
const tripPath = path.join(root, 'trip.json');
const packPath = path.join(root, 'style-packs/vintage-watercolor/manifest.json');
const staging = path.join(root, 'artwork', 'staging');
const outputDir = path.join(root, 'assets/places/vintage-watercolor');

export const readJson = async file => JSON.parse(await readFile(file, 'utf8'));
export const outputPath = slug => './assets/places/vintage-watercolor/' + slug + '.webp';
const requireValue = (ok, message) => { if (!ok) throw new Error(message); };

function isApprovedSource(url) {
  try {
    const u = new URL(url);
    return u.protocol === 'https:' && u.hostname === 'commons.wikimedia.org' &&
      u.pathname.startsWith('/wiki/Special:FilePath/') && !u.username && !u.password;
  } catch { return false; }
}

export function validateJobs(jobs, trip, pack) {
  requireValue(pack.id === 'vintage-watercolor', 'Expected the installed watercolor Style Pack');
  requireValue(jobs.style === pack.id, 'Style Pack mismatch');
  const byId = new Map(trip.days.flatMap(day => day.items || []).map(item => [item.id, item]));
  const slugs = new Set(), seenIds = new Set();
  for (const job of jobs.scenes) {
    requireValue(/^[a-z0-9-]+$/.test(job.slug) && !slugs.has(job.slug), 'Unsafe/duplicate slug: ' + job.slug);
    slugs.add(job.slug);
    requireValue(isApprovedSource(job.photo.url), 'Source must be an explicit Wikimedia Commons photo: ' + job.slug);
    requireValue(/^https:\/\/commons\.wikimedia\.org\/wiki\/File:/.test(job.photo.page), 'Commons file page required: ' + job.slug);
    requireValue(['CC0 1.0', 'Public domain', 'CC BY-SA 4.0'].includes(job.photo.license), 'Manual license review needed: ' + job.slug);
    requireValue(job.photo.credit?.trim() && job.photo.alt?.trim(), 'Missing photo credit/alt: ' + job.slug);
    requireValue(Array.isArray(job.itemIds) && job.itemIds.length > 0, 'Missing itemIds: ' + job.slug);
    requireValue(Array.isArray(job.preserve) && job.preserve.length >= 2, 'Scene fidelity anchors required: ' + job.slug);
    requireValue(['pending','approved','rejected'].includes(job.reviewStatus), 'Invalid reviewStatus: ' + job.slug);
    if (job.reviewStatus === 'approved') {
      requireValue(job.reviewedBy?.trim() && job.artworkLicense?.trim(), 'Approval and artwork license required: ' + job.slug);
      if (job.photo.license === 'CC BY-SA 4.0') {
        requireValue(job.artworkLicense === 'CC BY-SA 4.0', 'Share-alike license required: ' + job.slug);
      }
    }
    for (const id of job.itemIds) {
      requireValue(!seenIds.has(id), 'Place occurs in multiple jobs: ' + id);
      seenIds.add(id);
      const item = byId.get(id);
      requireValue(item?.type === 'place' && item.infoCard, 'Not a curated place: ' + id);
      requireValue([job.photo.url, outputPath(job.slug)].includes(item.infoCard.image), 'Photo does not match trip.json for ' + id);
      requireValue(item.infoCard.imageSource === job.photo.page, 'Photo source mismatch for ' + id);
      if (item.infoCard.image === job.photo.url) {
        requireValue(item.infoCard.imageCredit === job.photo.credit &&
          item.infoCard.imageLicense === job.photo.license, 'Original attribution changed for ' + id);
      }
    }
  }
  return byId;
}

export function imagePrompt(job, pack) {
  const palette = Object.entries(pack.palette || {}).map(([k,v]) => k + ': ' + v).join(', ');
  return [
    'Image-to-image adaptation of the PROVIDED reference photo. This is a real location, not a generic Japan scene.',
    'Scene: ' + job.title + '. Keep the real viewpoint and source-photo layout.',
    'Non-negotiable source-identity anchors (only what is actually visible):',
    ...job.preserve.map(x => '- ' + x),
    'Art direction: Vintage Watercolor, an archival illustrated Japanese travel guide.',
    'Existing website Style Pack palette: ' + palette + '.',
    'Existing website material grammar: ' + (pack.materialRules || []).join('; ') + '.',
    'Hand-painted translucent watercolor pigment, organic washes, warm paper, subtle pigment granulation, restrained contrast.',
    'Faithfully preserve real architectural proportions, landscape shapes, relative object sizes and camera perspective.',
    'Deliverable: a single borderless 3:2 landscape illustration for a Places photo card, 1536x1024; retain the subject in the center safe crop.',
    'Artwork only. Website handles the card, typography, borders and facts. No logos, fonts, frames, captions or watermarks.',
    'Do not invent buildings, waterfalls, rocks, torii, people, objects, signs, readable letters, maps or other travel facts.',
    'If source writing is illegible, do not invent its characters. This must look painted, not a basic photo filter.'
  ].join('\n');
}

export async function loadPilot() {
  const [jobs, trip, pack] = await Promise.all([readJson(configPath), readJson(tripPath), readJson(packPath)]);
  validateJobs(jobs, trip, pack);
  return { jobs, trip, pack };
}

async function generate(job, pack) {
  requireValue(process.env.OPENAI_API_KEY, 'OPENAI_API_KEY required for generate; plan needs no credentials');
  const source = await fetch(job.photo.url, {
    headers: { 'User-Agent': 'TravelLiteArtworkPilot/1.0 (static travel-guide publisher)' },
    signal: AbortSignal.timeout(30000)
  });
  requireValue(source.ok, 'Cannot download source ' + job.slug + ': HTTP ' + source.status);
  const mime = (source.headers.get('content-type') || '').split(';')[0];
  requireValue(['image/jpeg','image/png','image/webp'].includes(mime), 'Unexpected image type: ' + job.slug);
  requireValue(['commons.wikimedia.org','upload.wikimedia.org','thumb.wikimedia.org'].includes(new URL(source.url).hostname),
    'Unexpected redirect host: ' + job.slug);
  const original = Buffer.from(await source.arrayBuffer());
  requireValue(original.length > 0 && original.length < 10000000, 'Source image too big/empty: ' + job.slug);
  const model = process.env.OPENAI_IMAGE_MODEL || 'gpt-image-2.5-flare';
  requireValue(/^gpt-image-2\.[56]-(flare|sunburst)$/.test(model), 'Use an approved GPT Image 2.5/2.6 model');
  const rsp = await fetch('https://api.openai.com/v1/images/edits', {
    method:'POST',
    headers:{ 'Authorization':'Bearer ' + process.env.OPENAI_API_KEY, 'Content-Type':'application/json' },
    body:JSON.stringify({
      model,
      images:[{image_url:'data:' + mime + ';base64,' + original.toString('base64')}],
      prompt:imagePrompt(job, pack), size:'1536x1024', quality:'high',
      output_format:'webp', output_compression:82
    }),
    signal:AbortSignal.timeout(180000)
  });
  const result = await rsp.json();
  requireValue(rsp.ok, 'Image API error for ' + job.slug + ': ' + JSON.stringify(result.error || result).slice(0,350));
  const base64 = result.data?.[0]?.b64_json;
  requireValue(typeof base64 === 'string' && base64.length > 200, 'No image returned: ' + job.slug);
  const bytes = Buffer.from(base64, 'base64');
  requireValue(bytes.toString('ascii',0,4)==='RIFF' && bytes.toString('ascii',8,12)==='WEBP', 'Not a WebP output: ' + job.slug);
  await mkdir(staging,{recursive:true});
  const dest = path.join(staging,job.slug+'.webp');
  await writeFile(dest,bytes,{flag:'wx'}); // Never silently replace editorial output.
  console.log('Generated for review ONLY: ' + path.relative(root,dest) + ', ' + bytes.length + ' bytes');
}

async function applyApproved(jobs, trip) {
  const selected = jobs.scenes.filter(x => x.reviewStatus === 'approved');
  requireValue(selected.length>0, 'Nothing approved; trip.json unchanged');
  const byId = new Map(trip.days.flatMap(day => day.items || []).map(item=>[item.id,item]));
  const prepared = [];
  // Validate every approved file BEFORE mutating any published data/assets.
  for (const job of selected) {
    const src=path.join(staging,job.slug+'.webp');
    const bytes=await readFile(src);
    requireValue(bytes.toString('ascii',0,4)==='RIFF' && bytes.toString('ascii',8,12)==='WEBP', 'Invalid WebP: '+job.slug);
    requireValue((await stat(src)).size<=5000000, 'Oversized artwork: '+job.slug);
    prepared.push({job,src});
  }
  await mkdir(outputDir,{recursive:true});
  for (const {job,src} of prepared) {
    await copyFile(src,path.join(outputDir,job.slug+'.webp'));
    for (const id of job.itemIds) {
      const info=byId.get(id).infoCard;
      info.image=outputPath(job.slug);
      info.imageSource=job.photo.page;
      info.imageCredit=job.photo.credit + ' · AI 水彩改繪（已修改）';
      info.imageLicense=job.artworkLicense;
      info.imageAlt='水彩插畫：' + job.photo.alt;
    }
  }
  await writeFile(tripPath,JSON.stringify(trip,null,2)+'\n');
  console.log('Applied '+prepared.length+' approved scene(s); run full Places and UIUX QA before release.');
}

async function main() {
  const cmd=process.argv[2] || 'plan';
  requireValue(['plan','generate','apply'].includes(cmd), 'Usage: illustrate-places.mjs plan|generate|apply');
  const {jobs,trip,pack}=await loadPilot();
  if (cmd==='plan') {
    for (const job of jobs.scenes) console.log(
      '\n### '+job.title+' | '+job.itemIds.join(', ')+'\nSource: '+job.photo.page+
      ' ('+job.photo.license+')\nReview: '+job.reviewStatus+'\nOutput: '+outputPath(job.slug)+
      '\n'+imagePrompt(job,pack)+'\n'
    );
    return;
  }
  if (cmd==='generate') {
    for (const job of jobs.scenes) if (job.reviewStatus!=='rejected') await generate(job,pack);
    return;
  }
  await applyApproved(jobs,trip);
}

if (process.argv[1] && path.resolve(process.argv[1])===fileURLToPath(import.meta.url)) {
  main().catch(e=>{console.error(e.message);process.exitCode=1;});
}
