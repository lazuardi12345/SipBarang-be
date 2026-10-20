import test from "node:test";
import assert from "node:assert/strict";
import { CreateDeliveryOrderUseCase } from "../src/application/use-cases/delivery-order/CreateDeliveryOrderUseCase.js";
import { SubmitToDirectorUseCase } from "../src/application/use-cases/delivery-order/SubmitToDirectorUseCase.js";
import { MysqlDeliveryOrderRepository } from "../src/infrastructure/repositories/MysqlDeliveryOrderRepository.js";

test("new delivery order leaves driver expense unset until admin submits it", async () => {
  let createdOrder;
  const useCase = new CreateDeliveryOrderUseCase(
    {
      count: async () => 0,
      create: async (order) => {
        createdOrder = order;
        return order;
      },
    },
    {
      findById: async () => ({
        id: "tarif-bandung",
        areaDistribusi: "BOGOR",
        tujuanKirim: "BANDUNG",
        total: 15_000_000,
        totalSetelahPPh: 1_500_000,
      }),
    }
  );

  await useCase.execute(
    { tarifId: "tarif-bandung", namaToko: "Toko Contoh" },
    { id: "admin-1", nama: "Admin", role: "ADMIN" }
  );

  assert.equal(createdOrder.biayaEkspedisi, 15_000_000);
  assert.equal(createdOrder.uangJalanSupir, null);
  assert.equal(createdOrder.pph2Persen, 300_000);
});

test("delivery order does not infer missing driver expense from tariff", async () => {
  const repository = new MysqlDeliveryOrderRepository({});
  const order = await repository._toEntity({
    id: "do-1",
    noDo: "DO-1",
    tarifId: "tarif-bandung",
    areaDistribusi: "BOGOR",
    tujuanKirim: "BANDUNG",
    biayaEkspedisi: 15_000_000,
    status: "TERKIRIM",
  });

  assert.equal(order.uangJalanSupir, null);
});

test("submitting delivery order saves the admin-entered driver expense", async () => {
  let updatedOrder;
  const useCase = new SubmitToDirectorUseCase({
    findById: async () => ({
      id: "do-1",
      status: "DRAFT",
      noSchedule: "SCH-1",
      tglSchedule: "2026-10-20",
      tipeMobilRit: "CDD",
      namaSupir: "Supir",
      noPolisiKendaraan: "B 1234 XYZ",
    }),
    update: async (order) => {
      updatedOrder = order;
      return order;
    },
  });

  await useCase.execute("do-1", {
    noDocPerusahaan: "DOC-1",
    tglDocPerusahaan: "2026-10-20",
    uangJalanSupir: 725_000,
  });

  assert.equal(updatedOrder.uangJalanSupir, 725_000);
  assert.equal(updatedOrder.status, "MENUNGGU_ACC");
});

test("submitting delivery order allows FE flows that omit driver expense", async () => {
  let updatedOrder;
  const useCase = new SubmitToDirectorUseCase({
    findById: async () => ({
      id: "do-1",
      status: "DRAFT",
      noSchedule: "SCH-1",
      tglSchedule: "2026-10-20",
      tipeMobilRit: "CDD",
      namaSupir: "Supir",
      noPolisiKendaraan: "B 1234 XYZ",
      uangJalanSupir: null,
    }),
    update: async (order) => {
      updatedOrder = order;
      return order;
    },
  });

  await useCase.execute("do-1", {
    noDocPerusahaan: "DOC-1",
    tglDocPerusahaan: "2026-10-20",
  });

  assert.equal(updatedOrder.uangJalanSupir, null);
  assert.equal(updatedOrder.status, "MENUNGGU_ACC");
});

test("submitting delivery order preserves an existing driver expense when omitted", async () => {
  let updatedOrder;
  const useCase = new SubmitToDirectorUseCase({
    findById: async () => ({
      id: "do-1",
      status: "DRAFT",
      noSchedule: "SCH-1",
      tglSchedule: "2026-10-20",
      tipeMobilRit: "CDD",
      namaSupir: "Supir",
      noPolisiKendaraan: "B 1234 XYZ",
      uangJalanSupir: 625_000,
    }),
    update: async (order) => {
      updatedOrder = order;
      return order;
    },
  });

  await useCase.execute("do-1", {
    noDocPerusahaan: "DOC-1",
    tglDocPerusahaan: "2026-10-20",
  });

  assert.equal(updatedOrder.uangJalanSupir, 625_000);
});

test("submitting delivery order rejects invalid driver expense when provided", async () => {
  const useCase = new SubmitToDirectorUseCase({
    findById: async () => ({
      id: "do-1",
      status: "DRAFT",
      noSchedule: "SCH-1",
      tglSchedule: "2026-10-20",
      tipeMobilRit: "CDD",
      namaSupir: "Supir",
      noPolisiKendaraan: "B 1234 XYZ",
    }),
    update: async () => assert.fail("invalid submission must not be saved"),
  });

  for (const uangJalanSupir of ["", " ", false, -1]) {
    await assert.rejects(
      useCase.execute("do-1", {
        noDocPerusahaan: "DOC-1",
        tglDocPerusahaan: "2026-10-20",
        uangJalanSupir,
      }),
      { statusCode: 400, message: "Uang jalan supir harus berupa nominal tidak negatif jika diisi" }
    );
  }
});
