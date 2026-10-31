import test from "node:test";
import assert from "node:assert/strict";
import { SuperadminController } from "../src/interfaces/http/controllers/SuperadminController.js";

function createResponse() {
  return {
    statusCode: 200,
    body: null,
    status(statusCode) {
      this.statusCode = statusCode;
      return this;
    },
    json(body) {
      this.body = body;
      return this;
    },
  };
}

async function invoke(controller, method, request) {
  const response = createResponse();
  let forwardedError;
  await controller[method](request, response, (error) => {
    forwardedError = error;
  });
  return { response, forwardedError };
}

test("superadmin overview returns management data without selecting password hashes", async () => {
  let userQuery;
  const controller = new SuperadminController({
    user: {
      findMany: async (query) => {
        userQuery = query;
        return [{ id: "user-1", nama: "Admin", email: "admin@example.com", role: "ADMIN", active: true }];
      },
    },
    tarif: { findMany: async () => [{ id: "tarif-1", active: true }] },
    deliveryOrder: { findMany: async () => [{ id: "do-1" }] },
    invoice: { findMany: async () => [{ id: "invoice-1" }] },
  });

  const { response, forwardedError } = await invoke(controller, "overview", {});

  assert.equal(forwardedError, undefined);
  assert.equal(userQuery.select.passwordHash, undefined);
  assert.deepEqual(response.body.data.counts, {
    users: 1,
    activeUsers: 1,
    tarifs: 1,
    activeTarifs: 1,
    deliveryOrders: 1,
    invoices: 1,
  });
});

test("superadmin creates a delivery order with schedule and document details", async () => {
  let createInput;
  const controller = new SuperadminController({
    tarif: { findUnique: async () => ({ id: "tarif-1", active: true }) },
    deliveryOrder: {
      create: async ({ data }) => {
        createInput = data;
        return { id: "do-1", ...data };
      },
    },
  });

  const { response, forwardedError } = await invoke(controller, "createDeliveryOrder", {
    body: {
      noDo: "DO-001",
      tarifId: "tarif-1",
      biayaEkspedisi: "",
      schedule: { noSchedule: "SCH-001", tglSchedule: "2026-10-06" },
      document: { noDocPerusahaan: "SJ-001", namaToko: "Toko Contoh" },
    },
    user: { id: "admin-1", nama: "Admin", role: "SUPERADMIN" },
  });

  assert.equal(forwardedError, undefined);
  assert.equal(response.statusCode, 201);
  assert.equal(createInput.biayaEkspedisi, 0);
  assert.deepEqual(createInput.schedule.create, {
    noSchedule: "SCH-001",
    tglSchedule: new Date("2026-10-06"),
  });
  assert.equal(createInput.document.create.noDocPerusahaan, "SJ-001");
});

test("superadmin cannot create a delivery order using a deactivated tariff", async () => {
  let created = false;
  const controller = new SuperadminController({
    tarif: { findUnique: async () => ({ id: "tarif-1", active: false }) },
    deliveryOrder: { create: async () => { created = true; } },
  });

  const { forwardedError } = await invoke(controller, "createDeliveryOrder", {
    body: { noDo: "DO-001", tarifId: "tarif-1" },
    user: { id: "admin-1", nama: "Admin", role: "SUPERADMIN" },
  });

  assert.equal(forwardedError.statusCode, 404);
  assert.equal(created, false);
});

test("superadmin can save a driver expense for an imported delivery order", async () => {
  let updateInput;
  const controller = new SuperadminController({
    deliveryOrder: {
      update: async ({ data }) => {
        updateInput = data;
        return { id: "do-imported", ...data };
      },
    },
  });

  const { response, forwardedError } = await invoke(controller, "updateDeliveryOrder", {
    params: { id: "do-imported" },
    body: { uangJalanSupir: "725000" },
  });

  assert.equal(forwardedError, undefined);
  assert.equal(response.body.data.uangJalanSupir, 725000);
  assert.equal(updateInput.uangJalanSupir, 725000);
});

test("superadmin cannot deactivate the currently used superadmin account", async () => {
  let updated = false;
  const controller = new SuperadminController({
    user: {
      findUnique: async () => ({ id: "admin-1", role: "SUPERADMIN", active: true }),
      update: async () => { updated = true; },
    },
  });

  const { forwardedError } = await invoke(controller, "updateUser", {
    params: { id: "admin-1" },
    body: { active: false },
    user: { id: "admin-1" },
  });

  assert.equal(forwardedError.statusCode, 400);
  assert.equal(updated, false);
});
