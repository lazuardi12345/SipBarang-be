import test from "node:test";
import assert from "node:assert/strict";
import {
  addRealtimeClient,
  getRealtimeClientCount,
  publishDataChanged,
} from "../src/infrastructure/http/realtimeEvents.js";

test("realtime data changes are broadcast to connected clients", () => {
  const writes = [];
  const response = {
    destroyed: false,
    writableEnded: false,
    write: (message) => writes.push(message),
  };
  const removeClient = addRealtimeClient(response);

  publishDataChanged({ resource: "delivery-orders", method: "PATCH" });

  assert.equal(writes.length, 1);
  assert.match(writes[0], /^event: data-changed\n/);
  assert.match(writes[0], /"resource":"delivery-orders"/);
  removeClient();
  assert.equal(getRealtimeClientCount(), 0);
});

test("realtime publisher removes closed response streams", () => {
  const response = {
    destroyed: true,
    writableEnded: false,
    write() {
      assert.fail("closed clients must not receive data");
    },
  };
  addRealtimeClient(response);

  publishDataChanged({ resource: "tarif" });

  assert.equal(getRealtimeClientCount(), 0);
});
