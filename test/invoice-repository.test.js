import test from "node:test";
import assert from "node:assert/strict";
import { MysqlInvoiceRepository } from "../src/infrastructure/repositories/MysqlInvoiceRepository.js";

test("Invoice responses include schedule details without changing invoice item schema", async () => {
  const prisma = {
    invoice: {
      findMany: async () => [{
        id: "invoice-1",
        noInvoice: "INV-1",
        items: [{
          deliveryOrderId: "do-1",
          tujuanKirim: "KARAWANG",
          areaDistribusi: "BOGOR",
          biayaEkspedisi: 100000,
          pph2: 2000,
          totalSetelahPPh: 98000,
        }],
      }],
    },
    deliveryOrder: {
      findMany: async ({ where }) => {
        assert.deepEqual(where.id.in, ["do-1"]);
        return [{
          id: "do-1",
          schedule: { noSchedule: "SCH-1", tipeMobilRit: "Rit 2" },
          document: { keteranganDoc: "Orderan merchant" },
          tujuanKirim: "Karawang",
        }];
      },
    },
  };

  const [invoice] = await new MysqlInvoiceRepository(prisma).list();

  assert.equal(invoice.items[0].noSchedule, "SCH-1");
  assert.equal(invoice.items[0].tipeMobilRit, "Rit 2");
  assert.equal(invoice.items[0].namaBarang, "Orderan merchant");
  assert.equal(invoice.groupedItems[0].description, "Orderan merchant");
  assert.equal(invoice.groupedItems[0].area, "KARAWANG");
});
