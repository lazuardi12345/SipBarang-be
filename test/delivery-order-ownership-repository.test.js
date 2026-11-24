import test from "node:test";
import assert from "node:assert/strict";
import { MysqlDeliveryOrderRepository } from "../src/infrastructure/repositories/MysqlDeliveryOrderRepository.js";

test("ownership update applies to every shipment and the SO schedule atomically", async () => {
  const updates = [];
  const prisma = {
    $transaction: async (callback) => callback({
      deliveryOrderShipment: {
        updateMany: async (args) => {
          updates.push({ model: "shipment", ...args });
          return { count: 2 };
        },
      },
      deliveryOrderSchedule: {
        updateMany: async (args) => {
          updates.push({ model: "schedule", ...args });
          return { count: 1 };
        },
      },
      deliveryOrder: {
        findUnique: async () => ({
          id: "do-1",
          status: "TERKIRIM",
          schedule: { jenisKendaraan: "PRIBADI" },
          shipments: [
            { id: "shipment-1", jenisKendaraan: "PRIBADI" },
            { id: "shipment-2", jenisKendaraan: "PRIBADI" },
          ],
        }),
      },
    }),
  };
  const repository = new MysqlDeliveryOrderRepository(prisma);

  const result = await repository.updateVehicleOwnership("do-1", "PRIBADI");

  assert.deepEqual(updates, [
    {
      model: "shipment",
      where: { orderId: "do-1" },
      data: { jenisKendaraan: "PRIBADI" },
    },
    {
      model: "schedule",
      where: { orderId: "do-1" },
      data: { jenisKendaraan: "PRIBADI" },
    },
  ]);
  assert.equal(result.shipments.length, 2);
  assert.equal(result.jenisKendaraan, "PRIBADI");
});
