import test from "node:test";
import assert from "node:assert/strict";
import { nextSequentialId, nextSequentialIds } from "../src/infrastructure/database/sequentialId.js";

test("sequential IDs continue independently for each table scope", async () => {
  const counters = new Map();
  const prisma = {
    $transaction: async (callback) => callback({
      $executeRaw: async (_query, scope, count) => {
        counters.set(scope, (counters.get(scope) || 0) + count);
      },
      $queryRaw: async (_query, scope) => [
        { lastValue: counters.get(scope) },
      ],
    }),
  };

  assert.deepEqual(await nextSequentialIds(prisma, "delivery_orders", 3), ["1", "2", "3"]);
  assert.equal(await nextSequentialId(prisma, "delivery_orders"), "4");
  assert.equal(await nextSequentialId(prisma, "invoices"), "1");
});
