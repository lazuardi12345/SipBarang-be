import test from "node:test";
import assert from "node:assert/strict";
import { CreateDeliveryOrderUseCase } from "../src/application/use-cases/delivery-order/CreateDeliveryOrderUseCase.js";
import { MysqlDeliveryOrderRepository } from "../src/infrastructure/repositories/MysqlDeliveryOrderRepository.js";

test("delivery order snapshots driver expense from the selected destination tariff", async () => {
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
  assert.equal(createdOrder.uangJalanSupir, 1_500_000);
  assert.equal(createdOrder.pph2Persen, 300_000);
});

test("delivery order reads driver expense from tariff when the snapshot is missing", async () => {
  const repository = new MysqlDeliveryOrderRepository({
    tarif: {
      findUnique: async ({ where }) => {
        assert.equal(where.id, "tarif-bandung");
        return { totalSetelahPPh: 1_500_000 };
      },
    },
  });

  const order = await repository._toEntity({
    id: "do-1",
    noDo: "DO-1",
    tarifId: "tarif-bandung",
    biayaEkspedisi: 15_000_000,
    status: "TERKIRIM",
  });

  assert.equal(order.uangJalanSupir, 1_500_000);
});

test("delivery order finds legacy tariff by area and destination when tariff id is absent", async () => {
  const repository = new MysqlDeliveryOrderRepository({
    tarif: {
      findFirst: async ({ where }) => {
        assert.equal(where.areaDistribusi, "BOGOR");
        assert.equal(where.tujuanKirim, "BANDUNG");
        return { totalSetelahPPh: 1_500_000 };
      },
    },
  });

  const order = await repository._toEntity({
    id: "do-legacy",
    noDo: "DO-LEGACY",
    areaDistribusi: "BOGOR",
    tujuanKirim: "BANDUNG",
    biayaEkspedisi: 15_000_000,
    status: "TERKIRIM",
  });

  assert.equal(order.uangJalanSupir, 1_500_000);
});
