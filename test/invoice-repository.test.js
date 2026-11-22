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

test("Invoice response expands every shipment DOC with its own rit and document date", async () => {
  const prisma = {
    invoice: {
      findMany: async () => [{
        id: "invoice-2",
        noInvoice: "INV-2",
        items: [{
          deliveryOrderId: "do-2",
          noDocPerusahaan: "DOC-1",
          biayaEkspedisi: 100000,
        }],
      }],
    },
    deliveryOrder: {
      findMany: async () => [{
        id: "do-2",
        noDo: "DO-2",
        schedule: { noSchedule: "SO-2", tipeMobilRit: "CDD / Rit 1" },
        shipments: [
          {
            noDocPerusahaan: "DOC-1",
            tipeMobilRit: "CDD / Rit 1",
            tglDocPerusahaan: new Date("2026-11-20T00:00:00.000Z"),
          },
          {
            noDocPerusahaan: "DOC-2",
            tipeMobilRit: "Fuso / Rit 2",
            tglDocPerusahaan: new Date("2026-11-21T00:00:00.000Z"),
          },
        ],
      }],
    },
  };

  const [invoice] = await new MysqlInvoiceRepository(prisma).list();
  const [firstDoc, secondDoc] = invoice.items[0].ritPerDocument;

  assert.equal(invoice.items[0].noDocPerusahaan, "DOC-1, DOC-2");
  assert.equal(firstDoc.rit, "CDD / Rit 1");
  assert.equal(firstDoc.tglDocPerusahaan.toISOString(), "2026-11-20T00:00:00.000Z");
  assert.equal(secondDoc.rit, "Fuso / Rit 2");
  assert.equal(secondDoc.tglDocPerusahaan.toISOString(), "2026-11-21T00:00:00.000Z");
});

test("Unlinked INV-AYT-PL-003 items reuse matching bookkeeping schedules in schedule-date order", async () => {
  const prisma = {
    invoice: {
      findMany: async () => [{
        id: "invoice-003",
        noInvoice: "INV-AYT-PL-003",
        items: [
          {
            id: "1",
            areaDistribusi: "KARAWANG",
            tujuanKirim: "Cirebon",
            biayaEkspedisi: 2649000,
          },
          {
            id: "2",
            areaDistribusi: "KARAWANG",
            tujuanKirim: "Cirebon",
            biayaEkspedisi: 2649000,
          },
          {
            id: "3",
            areaDistribusi: "KARAWANG",
            tujuanKirim: "Ciamis",
            biayaEkspedisi: 3376000,
          },
        ],
      }],
    },
    deliveryOrder: {
      findMany: async ({ where }) => {
        assert.equal(where.noDo.startsWith, "IMPORT-REKAP");
        assert.equal(where.OR.length, 2);
        return [
          {
            id: "46",
            noDo: "IMPORT-REKAP01-LATER",
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
            id: "45",
            noDo: "IMPORT-REKAP01-EARLIER",
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

  assert.equal(invoice.items[0].deliveryOrderId, "45");
  assert.equal(invoice.items[0].noSchedule, "S-EARLIER");
  assert.equal(invoice.items[0].noDO, "IMPORT-REKAP01-EARLIER");
  assert.equal(invoice.items[0].noDocPerusahaan, "DOC-EARLIER");
  assert.equal(invoice.items[1].deliveryOrderId, "46");
  assert.equal(invoice.items[1].noSchedule, "S-LATER");
  assert.equal(invoice.items[2].deliveryOrderId, null);
  assert.equal(invoice.items[2].noSchedule, "-");
});
