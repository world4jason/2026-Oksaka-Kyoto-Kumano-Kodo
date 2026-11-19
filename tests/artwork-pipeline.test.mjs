import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { validateJobs, imagePrompt, outputPath } from '../scripts/illustrate-places.mjs';

const root = path.resolve(fileURLToPath(new URL('..', import.meta.url)));
const jobs = JSON.parse(await readFile(path.join(root, 'artwork/osaka-pilot.json'), 'utf8'));
const pack = JSON.parse(await readFile(path.join(root, 'style-packs/vintage-watercolor/manifest.json'), 'utf8'));
const trip = JSON.parse(await readFile(path.join(root, 'trip.json'), 'utf8'));

test('Three original scenes map to four curated Places IDs, sharing Nachi artwork', () => {
  const byId = validateJobs(jobs, trip, pack);
  assert.equal(jobs.scenes.length, 3);
  assert.equal(jobs.scenes.flatMap(job => job.itemIds).length, 4);
  for (const job of jobs.scenes) for (const id of job.itemIds) assert.equal(byId.get(id).type, 'place');
  assert.equal(jobs.scenes.find(x => x.slug === 'nachi-pagoda-falls').itemIds.length, 2);
});

test('Prompts use real scene anchors, installed palette, and no baked-in text', () => {
  for (const job of jobs.scenes) {
    const prompt = imagePrompt(job, pack);
    assert.match(prompt, /Image-to-image adaptation/);
    assert.match(prompt, /source-identity anchors/i);
    assert.match(prompt, /Vintage Watercolor/);
    assert.match(prompt, /No logos/);
    assert.ok(prompt.includes(pack.palette.paper));
    assert.match(outputPath(job.slug), /^\.\/assets\/places\/vintage-watercolor\//);
  }
});

test('Publication requires explicit approval and preserves share-alike', () => {
  assert.ok(jobs.scenes.every(scene => scene.reviewStatus === 'pending'));
  const bad = structuredClone(jobs);
  bad.scenes[2].reviewStatus = 'approved';
  bad.scenes[2].reviewedBy = 'reviewer';
  bad.scenes[2].artworkLicense = 'CC BY 4.0';
  assert.throws(() => validateJobs(bad, trip, pack), /Share-alike/);
  bad.scenes[2].artworkLicense = 'CC BY-SA 4.0';
  assert.doesNotThrow(() => validateJobs(bad, trip, pack));
});

test('Reject changed photos without updated provenance and review', () => {
  const bad = structuredClone(jobs);
  bad.scenes[0].photo.url += '&unverified=1';
  assert.throws(() => validateJobs(bad, trip, pack), /Photo does not match/);
});
