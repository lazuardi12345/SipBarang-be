import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const schemaText = readFileSync(join(process.cwd(), 'prisma/schema.prisma'), 'utf8');
const expectedStatuses = [
  'DRAFT',
  'PLANNING',
  'MENUNGGU_ACC',
  'DISETUJUI',
  'DITOLAK',
  'DALAM_PENGIRIMAN',
  'MENUNGGU_KONFIRMASI',
  'TERKIRIM',
  'DIBATALKAN',
];

test('DeliveryOrder enum matches the app status lifecycle', () => {
  for (const value of expectedStatuses) {
    assert.match(schemaText, new RegExp(`\\b${value}\\b`), `Missing enum value: ${value}`);
  }
});
