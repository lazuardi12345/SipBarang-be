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

test("Unlinked INV-AYT-PL-003 items reuse matching bookkeeping schedules in schedule-date order", async () => {
  const prisma = {
    invoice: {
      findMany: async () => [{
        id: "invoice-003",
        noInvoice: "INV-AYT-PL-003",
        items: [
          {
            id: "imp-pdf-inv-ayt-pl-003-item-001",
            areaDistribusi: "KARAWANG",
            tujuanKirim: "Cirebon",
            biayaEkspedisi: 2649000,
          },
          {
            id: "imp-pdf-inv-ayt-pl-003-item-002",
            areaDistribusi: "KARAWANG",
            tujuanKirim: "Cirebon",
            biayaEkspedisi: 2649000,
          },
          {
            id: "imp-pdf-inv-ayt-pl-003-item-003",
            areaDistribusi: "KARAWANG",
            tujuanKirim: "Ciamis",
            biayaEkspedisi: 3376000,
          },
        ],
      }],
    },
    deliveryOrder: {
      findMany: async ({ where }) => {
        assert.equal(where.id.startsWith, "imp-pdf-rekap");
        assert.equal(where.OR.length, 2);
        return [
          {
            id: "do-later",
            noDo: "DO-LATER",
            tanggalKirim: new Date("2026-10-08T00:00:00.000Z"),
            areaDistribusi: "KARAWANG",
            tujuanKirim: "Cirebon",
            biayaEkspedisi: 2649000,
            schedule: {
              noSchedule: "S-LATER",
              tglSchedule: new Date("2026-10-08T00:00:00.000Z"),
            },
            document: { noDocPerusahaan: "DOC-LATER" },
          },
          {
            id: "do-earlier",
            noDo: "DO-EARLIER",
            tanggalKirim: new Date("2026-10-07T00:00:00.000Z"),
            areaDistribusi: "KARAWANG",
            tujuanKirim: "Cirebon",
            biayaEkspedisi: 2649000,
            schedule: {
              noSchedule: "S-EARLIER",
              tglSchedule: new Date("2026-10-07T00:00:00.000Z"),
            },
            document: { noDocPerusahaan: "DOC-EARLIER" },
          },
        ];
      },
    },
  };

  const [invoice] = await new MysqlInvoiceRepository(prisma).list();

  assert.equal(invoice.items[0].deliveryOrderId, "do-earlier");
  assert.equal(invoice.items[0].noSchedule, "S-EARLIER");
  assert.equal(invoice.items[0].noDO, "DO-EARLIER");
  assert.equal(invoice.items[0].noDocPerusahaan, "DOC-EARLIER");
  assert.equal(invoice.items[1].deliveryOrderId, "do-later");
  assert.equal(invoice.items[1].noSchedule, "S-LATER");
  assert.equal(invoice.items[2].deliveryOrderId, null);
  assert.equal(invoice.items[2].noSchedule, "-");
});
