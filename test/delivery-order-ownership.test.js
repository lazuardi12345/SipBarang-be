import test from "node:test";
import assert from "node:assert/strict";
import { SetDeliveryOrderOwnershipUseCase } from "../src/application/use-cases/delivery-order/SetDeliveryOrderOwnershipUseCase.js";
import { StatusDO } from "../src/domain/entities/DeliveryOrder.js";

test("director can complete missing ownership for every shipment in a delivered SO", async () => {
  const order = {
    id: "do-missing-owner",
    status: StatusDO.TERKIRIM,
    shipments: [
      { id: "shipment-1", jenisKendaraan: "BELUM_DIISI" },
      { id: "shipment-2", jenisKendaraan: "BELUM_DIISI" },
    ],
  };
  let update;
  const useCase = new SetDeliveryOrderOwnershipUseCase({
    findById: async () => order,
    updateVehicleOwnership: async (orderId, ownership) => {
      update = { orderId, ownership };
      return { ...order, shipments: order.shipments.map((shipment) => ({
        ...shipment,
        jenisKendaraan: ownership,
      })) };
    },
  });

  const result = await useCase.execute(order.id, { jenisKendaraan: "PRIBADI" });

  assert.deepEqual(update, { orderId: order.id, ownership: "PRIBADI" });
  assert.deepEqual(result.shipments.map((shipment) => shipment.jenisKendaraan), [
    "PRIBADI",
    "PRIBADI",
  ]);
});

test("director can repair mixed ownership but cannot overwrite a completed ownership", async () => {
  const mixedOrder = {
    id: "do-mixed-owner",
    status: StatusDO.TERKIRIM,
    shipments: [
      { jenisKendaraan: "PRIBADI" },
      { jenisKendaraan: "VENDOR" },
    ],
  };
  let updated = false;
  const useCase = new SetDeliveryOrderOwnershipUseCase({
    findById: async (id) => id === mixedOrder.id
      ? mixedOrder
      : { ...mixedOrder, shipments: [{ jenisKendaraan: "VENDOR" }] },
    updateVehicleOwnership: async () => {
      updated = true;
      return mixedOrder;
    },
  });

  await useCase.execute(mixedOrder.id, { jenisKendaraan: "VENDOR" });
  assert.equal(updated, true);

  await assert.rejects(
    useCase.execute("do-complete-owner", { jenisKendaraan: "PRIBADI" }),
    { statusCode: 409 }
  );
});

test("ownership can only be completed for delivered orders and valid types", async () => {
  const useCase = new SetDeliveryOrderOwnershipUseCase({
    findById: async () => ({
      id: "do-not-delivered",
      status: StatusDO.DALAM_PENGIRIMAN,
      shipments: [{ jenisKendaraan: null }],
    }),
    updateVehicleOwnership: async () => {
      throw new Error("Should not update");
    },
  });

  await assert.rejects(
    useCase.execute("do-not-delivered", { jenisKendaraan: "VENDOR" }),
    { statusCode: 400 }
  );

  const deliveredUseCase = new SetDeliveryOrderOwnershipUseCase({
    findById: async () => ({
      id: "do-missing-type",
      status: StatusDO.TERKIRIM,
      shipments: [{ jenisKendaraan: null }],
    }),
    updateVehicleOwnership: async () => {
      throw new Error("Should not update");
    },
  });
  await assert.rejects(
    deliveredUseCase.execute("do-missing-type", { jenisKendaraan: "SEWAAN" }),
    { statusCode: 400 }
  );
});
