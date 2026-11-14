import test from "node:test";
import assert from "node:assert/strict";
import { CreateDeliveryOrderUseCase } from "../src/application/use-cases/delivery-order/CreateDeliveryOrderUseCase.js";
import { SubmitToDirectorUseCase } from "../src/application/use-cases/delivery-order/SubmitToDirectorUseCase.js";
import { ApproveDeliveryOrderUseCase } from "../src/application/use-cases/delivery-order/ApproveDeliveryOrderUseCase.js";
import { AttachDocPerusahaanUseCase } from "../src/application/use-cases/delivery-order/AttachDocPerusahaanUseCase.js";
import { StatusDO } from "../src/domain/entities/DeliveryOrder.js";

function createMockRepo() {
  const store = new Map();
  return {
    async findById(id) {
      return store.get(id) || null;
    },
    async create(order) {
      store.set(order.id, { ...order });
      return store.get(order.id);
    },
    async save(order) {
      store.set(order.id, { ...order });
      return store.get(order.id);
    },
    async update(order) {
      store.set(order.id, { ...order });
      return store.get(order.id);
    },
    async nextNoDo() {
      return "DO-TEST-001";
    },
    async count() {
      return store.size;
    },
  };
}

function createMockTarifRepo() {
  return {
    async findById(id) {
      return {
        id,
        areaDistribusi: "Karawang - Subang",
        tujuanKirim: "Subang Kota",
        total: 1500000,
        active: true,
      };
    },
  };
}

test("New SO Workflow: Create SO directly as MENUNGGU_ACC -> ACC Direktur -> Attach Doc & Driver -> DALAM_PENGIRIMAN", async () => {
  const repo = createMockRepo();
  const tarifRepo = createMockTarifRepo();

  // 1. Create SO directly with MENUNGGU_ACC (from Admin Input SO form)
  const createUseCase = new CreateDeliveryOrderUseCase(repo, tarifRepo);
  const createdOrder = await createUseCase.execute({
    tarifId: "tarif-1",
    noSchedule: "SCH-202611-001",
    tglSchedule: "2026-11-15",
    noPolisiKendaraan: "B 9482 KDA",
    tipeMobilRit: "CDD Box (8 Ton) / Rit 1",
    uangJalanSupir: 450000,
    namaToko: "Toko Sinar Rezeki",
    alamatLengkapTujuan: "Jl. Otista No. 12 Subang",
    status: StatusDO.MENUNGGU_ACC,
  }, { id: "user-1", nama: "Admin Logistik", role: "ADMIN" });

  assert.equal(createdOrder.status, StatusDO.MENUNGGU_ACC);
  assert.equal(createdOrder.uangJalanSupir, 450000);
  assert.equal(createdOrder.noPolisiKendaraan, "B 9482 KDA");
  assert.equal(createdOrder.namaSupir, "");

  // 2. Direktur approves SO (Gate 1)
  const approveUseCase = new ApproveDeliveryOrderUseCase(repo);
  const approved = await approveUseCase.execute(
    createdOrder.id,
    { id: "dir-1", nama: "Direktur Utama" },
    "SO dan uang jalan disetujui, silakan tugaskan supir"
  );
  assert.equal(approved.status, StatusDO.DISETUJUI);
  assert.equal(approved.disetujuiOleh, "Direktur Utama");

  // 3. Admin attaches Surat Jalan Pabrik (No. DOC) + Assigns Driver
  const attachUseCase = new AttachDocPerusahaanUseCase(repo);
  const inDelivery = await attachUseCase.execute(createdOrder.id, {
    noDocPerusahaan: "SJ-PABRIK-88192",
    tglDocPerusahaan: "2026-11-15",
    namaSupir: "Pak Bambang",
    noHpSupir: "081234567890",
    keteranganDoc: "Surat jalan fisik dari Karawang telah diterima",
  });

  assert.equal(inDelivery.status, StatusDO.DALAM_PENGIRIMAN);
  assert.equal(inDelivery.noDocPerusahaan, "SJ-PABRIK-88192");
  assert.equal(inDelivery.namaSupir, "Pak Bambang");
  assert.equal(inDelivery.noHpSupir, "081234567890");
  assert.equal(inDelivery.uangJalanSupir, 450000);
});

test("New SO Workflow: Draft order submitted to Director without driver/doc requirement", async () => {
  const repo = createMockRepo();
  const tarifRepo = createMockTarifRepo();

  // 1. Create order as DRAFT
  const createUseCase = new CreateDeliveryOrderUseCase(repo, tarifRepo);
  const draftOrder = await createUseCase.execute({
    tarifId: "tarif-1",
    noSchedule: "SCH-202611-002",
    tglSchedule: "2026-11-16",
    noPolisiKendaraan: "D 8888 ABC",
    tipeMobilRit: "Fuso (15 Ton) / Rit 1",
    uangJalanSupir: 750000,
    status: StatusDO.DRAFT,
  }, { id: "user-1", nama: "Admin Logistik", role: "ADMIN" });

  assert.equal(draftOrder.status, StatusDO.DRAFT);

  // 2. Submit to Director should succeed even without driver and factory doc
  const submitUseCase = new SubmitToDirectorUseCase(repo);
  const submitted = await submitUseCase.execute(draftOrder.id, {
    uangJalanSupir: 750000,
  });

  assert.equal(submitted.status, StatusDO.MENUNGGU_ACC);
  assert.equal(submitted.uangJalanSupir, 750000);
});
