import test from "node:test";
import assert from "node:assert/strict";
import { CreateDeliveryOrderUseCase } from "../src/application/use-cases/delivery-order/CreateDeliveryOrderUseCase.js";
import { SubmitToDirectorUseCase } from "../src/application/use-cases/delivery-order/SubmitToDirectorUseCase.js";
import { ApproveDeliveryOrderUseCase } from "../src/application/use-cases/delivery-order/ApproveDeliveryOrderUseCase.js";
import { AttachDocPerusahaanUseCase } from "../src/application/use-cases/delivery-order/AttachDocPerusahaanUseCase.js";
import { ReportDeliveryUseCase } from "../src/application/use-cases/delivery-order/ReportDeliveryUseCase.js";
import { StatusDO } from "../src/domain/entities/DeliveryOrder.js";

function createMockRepo() {
  const store = new Map();
  let shipmentSequence = 0;
  return {
    async findById(id) {
      return store.get(id) || null;
    },
    async create(order) {
      const created = { ...order, id: order.id || `do-test-${store.size + 1}` };
      store.set(created.id, created);
      return created;
    },
    async save(order) {
      store.set(order.id, { ...order });
      return store.get(order.id);
    },
    async update(order) {
      store.set(order.id, { ...order });
      return store.get(order.id);
    },
    async addShipment(orderId, data) {
      const order = store.get(orderId);
      const shipment = {
        ...data,
        id: `shipment-${++shipmentSequence}`,
        orderId,
        status: StatusDO.DALAM_PENGIRIMAN,
      };
      order.shipments = [...(order.shipments || []), shipment];
      if (order.status === StatusDO.DISETUJUI || order.status === "APPROVED") {
        order.status = StatusDO.DALAM_PENGIRIMAN;
      }
      store.set(orderId, order);
      return order;
    },
    async reportShipment(orderId, shipmentId, data) {
      const order = store.get(orderId);
      order.shipments = order.shipments.map((shipment) => shipment.id === shipmentId
        ? { ...shipment, ...data, status: StatusDO.MENUNGGU_KONFIRMASI }
        : shipment);
      if (order.shipments.every((shipment) => shipment.status !== StatusDO.DALAM_PENGIRIMAN)) {
        order.status = StatusDO.MENUNGGU_KONFIRMASI;
      }
      store.set(orderId, order);
      return order;
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

test("one approved SO accepts multiple DOCs and tracks each vehicle independently", async () => {
  const repo = createMockRepo();
  const tarifRepo = createMockTarifRepo();

  // 1. Create the SO with destination and allowance only.
  const createUseCase = new CreateDeliveryOrderUseCase(repo, tarifRepo);
  const createdOrder = await createUseCase.execute({
    tarifId: "tarif-1",
    noSchedule: "SCH-202611-001",
    tglSchedule: "2026-11-15",
    uangJalanSupir: 450000,
    namaToko: "Toko Sinar Rezeki",
    noHpPenerima: "081234567890",
    alamatLengkapTujuan: "Jl. Otista No. 12 Subang",
    status: StatusDO.MENUNGGU_ACC,
  }, { id: "user-1", nama: "Admin Logistik", role: "ADMIN" });

  assert.equal(createdOrder.status, StatusDO.MENUNGGU_ACC);
  assert.equal(createdOrder.uangJalanSupir, 450000);
  assert.equal(createdOrder.noPolisiKendaraan, "");
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

  // 3. Admin adds multiple DOCs and assigns a vehicle/driver to each.
  const attachUseCase = new AttachDocPerusahaanUseCase(repo);
  const inDelivery = await attachUseCase.execute(createdOrder.id, {
    noDocPerusahaan: "SJ-PABRIK-88192",
    tglDocPerusahaan: "2026-11-15",
    namaSupir: "Pak Bambang",
    jenisKendaraan: "SEWA",
    noPolisiKendaraan: "B 9482 KDA",
    tipeMobilRit: "CDD Box / Rit 1",
  });

  assert.equal(inDelivery.status, StatusDO.DALAM_PENGIRIMAN);
  const secondShipment = await attachUseCase.execute(createdOrder.id, {
    noDocPerusahaan: "SJ-PABRIK-88193",
    tglDocPerusahaan: "2026-11-15",
    namaSupir: "Pak Joko",
    jenisKendaraan: "PRIBADI",
    noPolisiKendaraan: "B 1122 ABC",
    tipeMobilRit: "Fuso / Rit 2",
  });
  assert.equal(secondShipment.shipments.length, 2);
  assert.equal(secondShipment.shipments[0].noDocPerusahaan, "SJ-PABRIK-88192");
  assert.equal(secondShipment.shipments[1].noDocPerusahaan, "SJ-PABRIK-88193");
  assert.equal(inDelivery.uangJalanSupir, 450000);

  const reportUseCase = new ReportDeliveryUseCase(repo);
  const firstReported = await reportUseCase.execute({
    orderId: createdOrder.id,
    shipmentId: secondShipment.shipments[0].id,
    namaPenerimaBarang: "Penerima Toko",
  });
  assert.equal(firstReported.status, StatusDO.DALAM_PENGIRIMAN);
  assert.equal(firstReported.shipments[0].status, StatusDO.MENUNGGU_KONFIRMASI);
  assert.equal(firstReported.shipments[1].status, StatusDO.DALAM_PENGIRIMAN);

  const reported = await reportUseCase.execute({
    orderId: createdOrder.id,
    shipmentId: secondShipment.shipments[1].id,
    namaPenerimaBarang: "Penerima Toko",
  });
  assert.equal(reported.status, StatusDO.MENUNGGU_KONFIRMASI);
});

test("vehicle details cannot be added before director approval", async () => {
  const repo = createMockRepo();
  const order = {
    id: "do-pending",
    status: StatusDO.MENUNGGU_ACC,
  };
  await repo.create(order);

  const attachUseCase = new AttachDocPerusahaanUseCase(repo);
  await assert.rejects(
    attachUseCase.execute(order.id, {
      noDocPerusahaan: "SJ-1",
      tglDocPerusahaan: "2026-11-15",
      namaSupir: "Pak Bambang",
      jenisKendaraan: "PRIBADI",
      noPolisiKendaraan: "B 9482 KDA",
      tipeMobilRit: "CDD Box / Rit 1",
    }),
    /hanya dapat diisi setelah SO disetujui Direktur/
  );
});

test("delivery cannot be reported until post-approval vehicle details are saved", async () => {
  const useCase = new ReportDeliveryUseCase({
    findById: async () => ({ id: "do-approved", status: StatusDO.DISETUJUI }),
  });

  await assert.rejects(
    useCase.execute({ orderId: "do-approved", namaPenerimaBarang: "Penerima" }),
    /setelah dokumen dan detail armada dilengkapi/
  );
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
