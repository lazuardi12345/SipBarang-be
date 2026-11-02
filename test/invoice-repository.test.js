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
          noDocPerusahaan: "DOC-1, DOC-2, DOC-DUP",
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
    deliveryOrderDocumentRit: {
      findMany: async ({ where }) => {
        assert.deepEqual(where.noDocPerusahaan.in, ["DOC-1", "DOC-2", "DOC-DUP"]);
        return [
          { noSchedule: "SCH-1", noDocPerusahaan: "DOC-1", rit: "1" },
          { noSchedule: "SCH-1", noDocPerusahaan: "DOC-2", rit: "2" },
          { noSchedule: "SCH-1", noDocPerusahaan: "DOC-DUP", rit: "3" },
          { noSchedule: "SCH-2", noDocPerusahaan: "DOC-DUP", rit: "4" },
        ];
      },
    },
  };

  const [invoice] = await new MysqlInvoiceRepository(prisma).list();

  assert.equal(invoice.items[0].noSchedule, "SCH-1");
  assert.equal(invoice.items[0].tipeMobilRit, "Rit 2");
  assert.deepEqual(invoice.items[0].ritPerDocument, [
    { noDocPerusahaan: "DOC-1", rit: "1" },
    { noDocPerusahaan: "DOC-2", rit: "2" },
    { noDocPerusahaan: "DOC-DUP", rit: "3" },
  ]);
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
    deliveryOrderDocumentRit: {
      findMany: async ({ where }) => {
        assert.deepEqual(where.noDocPerusahaan.in, ["DOC-LATER", "DOC-EARLIER"]);
        return [
          { noSchedule: "S-LATER", noDocPerusahaan: "DOC-LATER", rit: "2" },
          { noSchedule: "S-EARLIER", noDocPerusahaan: "DOC-EARLIER", rit: "3" },
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
  assert.deepEqual(invoice.items[0].ritPerDocument, [
    { noDocPerusahaan: "DOC-EARLIER", rit: "3" },
  ]);
  assert.equal(invoice.items[2].deliveryOrderId, null);
  assert.equal(invoice.items[2].noSchedule, "-");
});

test("invoice rit mapping matches a unique document even when its manual schedule differs", async () => {
  const prisma = {
    invoice: {
      findMany: async () => [{
        id: "invoice-1",
        noInvoice: "INV-1",
        items: [{
          deliveryOrderId: "do-1",
          noDocPerusahaan: "DOC-WRONG-SCHEDULE,DOC-MATCH",
        }],
      }],
    },
    deliveryOrder: {
      findMany: async () => [{
        id: "do-1",
        schedule: { noSchedule: "S0801265", tipeMobilRit: "6" },
        document: { noDocPerusahaan: "DOC-WRONG-SCHEDULE,DOC-MATCH" },
      }],
    },
    deliveryOrderDocumentRit: {
      findMany: async () => [
        { noSchedule: "S0801317", noDocPerusahaan: "DOC-WRONG-SCHEDULE", rit: "2" },
        { noSchedule: "S0801265", noDocPerusahaan: "DOC-MATCH", rit: "2" },
      ],
    },
  };

  const [invoice] = await new MysqlInvoiceRepository(prisma).list();

  assert.deepEqual(invoice.items[0].ritPerDocument, [
    { noDocPerusahaan: "DOC-WRONG-SCHEDULE", rit: "2" },
    { noDocPerusahaan: "DOC-MATCH", rit: "2" },
  ]);
});

test("invoice rit mapping does not guess when a document number exists in multiple schedules", async () => {
  const prisma = {
    invoice: {
      findMany: async () => [{
        id: "invoice-1",
        noInvoice: "INV-1",
        items: [{ deliveryOrderId: "do-1", noDocPerusahaan: "DOC-DUP" }],
      }],
    },
    deliveryOrder: {
      findMany: async () => [{
        id: "do-1",
        schedule: { noSchedule: "S-UNKNOWN", tipeMobilRit: "6" },
        document: { noDocPerusahaan: "DOC-DUP" },
      }],
    },
    deliveryOrderDocumentRit: {
      findMany: async () => [
        { noSchedule: "S-1", noDocPerusahaan: "DOC-DUP", rit: "2" },
        { noSchedule: "S-2", noDocPerusahaan: "DOC-DUP", rit: "4" },
      ],
    },
  };

  const [invoice] = await new MysqlInvoiceRepository(prisma).list();

  assert.deepEqual(invoice.items[0].ritPerDocument, [
    { noDocPerusahaan: "DOC-DUP", rit: null },
  ]);
});
