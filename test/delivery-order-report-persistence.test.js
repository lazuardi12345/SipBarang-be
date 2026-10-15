import test from "node:test";
import assert from "node:assert/strict";
import { DeliveryOrderReportRepository } from "../src/infrastructure/repositories/delivery-order/DeliveryOrderReportRepository.js";
import { MysqlDeliveryOrderRepository } from "../src/infrastructure/repositories/MysqlDeliveryOrderRepository.js";

test("delivery report repository creates a report when none exists", async () => {
  let created;
  const repository = new DeliveryOrderReportRepository({
    deliveryOrderReport: {
      findFirst: async () => null,
      create: async ({ data }) => {
        created = data;
        return data;
      },
    },
  });

  await repository.upsert("do-1", {
    namaPenerimaBarang: "Penerima",
    buktiPengirimanUrl: "data:image/jpeg;base64,photo",
  });

  assert.equal(created.orderId, "do-1");
  assert.equal(created.buktiPengirimanUrl, "data:image/jpeg;base64,photo");
});

test("delivery report repository updates the existing report for an order", async () => {
  let updated;
  const repository = new DeliveryOrderReportRepository({
    deliveryOrderReport: {
      findFirst: async () => ({ id: "report-1" }),
      update: async ({ where, data }) => {
        updated = { where, data };
        return updated;
      },
    },
  });

  await repository.upsert("do-1", {
    namaPenerimaBarang: "Penerima",
    buktiPengirimanUrl: "data:image/jpeg;base64,photo",
  });

  assert.equal(updated.where.id, "report-1");
  assert.equal(updated.data.buktiPengirimanUrl, "data:image/jpeg;base64,photo");
});

test("delivery order update persists delivery proof in the report relation", async () => {
  const persistedReport = {
    namaPenerimaBarang: "Penerima",
    buktiPengirimanUrl: "data:image/jpeg;base64,photo",
  };
  let reportUpserted = false;
  const repository = new MysqlDeliveryOrderRepository({
    deliveryOrder: {
      findUnique: async () => ({
        id: "do-1",
        noDo: "DO-1",
        status: "MENUNGGU_KONFIRMASI",
        reports: [persistedReport],
      }),
      update: async () => ({
        id: "do-1",
        noDo: "DO-1",
        status: "MENUNGGU_KONFIRMASI",
        reports: [],
      }),
    },
  });
  repository.scheduleRepository.toPrismaData = () => null;
  repository.documentRepository.toPrismaData = () => null;
  repository.reportRepository.upsert = async (_orderId, order) => {
    reportUpserted = true;
    persistedReport.namaPenerimaBarang = order.namaPenerimaBarang;
    persistedReport.buktiPengirimanUrl = order.buktiPengirimanUrl;
  };

  const updated = await repository.update({
    id: "do-1",
    noDO: "DO-1",
    status: "MENUNGGU_KONFIRMASI",
    namaPenerimaBarang: "Penerima",
    buktiPengirimanUrl: "data:image/jpeg;base64,photo",
  });

  assert.equal(reportUpserted, true);
  assert.equal(updated.buktiPengirimanUrl, "data:image/jpeg;base64,photo");
});

test("delivery order reads the newest report and retains a photo from an earlier report", async () => {
  const repository = new MysqlDeliveryOrderRepository({
    tarif: {
      findUnique: async () => null,
      findFirst: async () => null,
    },
  });
  const entity = await repository._toEntity({
    id: "do-1",
    noDo: "DO-1",
    status: "TERKIRIM",
    reports: [
      {
        createdAt: "2026-10-15T10:00:00.000Z",
        namaPenerimaBarang: "Penerima terbaru",
        buktiPengirimanUrl: null,
      },
      {
        createdAt: "2026-10-14T10:00:00.000Z",
        namaPenerimaBarang: "Penerima lama",
        buktiPengirimanUrl: "data:image/jpeg;base64,photo",
      },
    ],
  });

  assert.equal(entity.namaPenerimaBarang, "Penerima terbaru");
  assert.equal(entity.buktiPengirimanUrl, "data:image/jpeg;base64,photo");
});
