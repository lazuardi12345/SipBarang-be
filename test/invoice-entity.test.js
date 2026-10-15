import test from "node:test";
import assert from "node:assert/strict";
import { Invoice } from "../src/domain/entities/Invoice.js";
import { GenerateInvoiceUseCase } from "../src/application/use-cases/invoice/GenerateInvoiceUseCase.js";

test("Invoice groups DOs by description, area, and unit price and sums net prices", () => {
  const invoice = new Invoice({
    items: [
      { namaBarang: "Orderan A", areaDistribusi: "Jawa Barat", tujuanKirim: "Karawang", namaToko: "Toko A", biayaEkspedisi: 100000, pph2: 2000, totalSetelahPPh: 98000 },
      { namaBarang: "Orderan A", areaDistribusi: "Jawa Barat", tujuanKirim: "Karawang", namaToko: "Toko B", biayaEkspedisi: 100000, pph2: 2000, totalSetelahPPh: 98000 },
      { namaBarang: "Orderan A", areaDistribusi: "Jawa Barat", tujuanKirim: "Karawang", namaToko: "Toko C", biayaEkspedisi: 120000, pph2: 2400, totalSetelahPPh: 117600 },
    ],
  });

  assert.deepEqual(invoice.groupedItems, [
    {
      description: "Orderan A",
      area: "Karawang",
      unitPrice: 100000,
      quantity: 2,
      totalNetto: 196000,
    },
    {
      description: "Orderan A",
      area: "Karawang",
      unitPrice: 120000,
      quantity: 1,
      totalNetto: 117600,
    },
  ]);
});

test("Invoice uses the admin-entered note as description and destination as area", () => {
  const invoice = new Invoice({
    items: [{
      namaBarang: "Pesanan merchant awal",
      areaDistribusi: "Jawa Barat",
      tujuanKirim: "Bandung",
      biayaEkspedisi: 150000,
      pph2: 3000,
      totalSetelahPPh: 147000,
    }],
  });

  assert.equal(invoice.groupedItems[0].description, "Pesanan merchant awal");
  assert.equal(invoice.groupedItems[0].area, "Bandung");
});

test("Invoice generation copies admin note into item description and route into area", async () => {
  let createdInvoice;
  const useCase = new GenerateInvoiceUseCase(
    {
      list: async () => [],
      create: async (invoice) => {
        createdInvoice = invoice;
        return invoice;
      },
    },
    {
      findById: async () => ({
        id: "do-1",
        noDO: "DO-1",
        status: "TERKIRIM",
        keteranganDoc: "Orderan merchant",
        tujuanKirim: "Bandung - Karawang",
        areaDistribusi: "Jawa Barat",
        biayaEkspedisi: 100000,
        pph2Persen: 2000,
        totalSetelahPPh: 98000,
      }),
    }
  );

  await useCase.execute(
    { namaPelanggan: "Pelanggan", deliveryOrderIds: ["do-1"] },
    { id: "user-1", nama: "Direktur", role: "DIREKTUR" }
  );

  assert.equal(createdInvoice.items[0].namaBarang, "Orderan merchant");
  assert.equal(createdInvoice.groupedItems[0].description, "Orderan merchant");
  assert.equal(createdInvoice.groupedItems[0].area, "Bandung - Karawang");
  assert.match(createdInvoice.verificationToken, /^[a-f0-9]{64}$/);
});

test("Invoice derives item PPh and net price when stored values are absent", () => {
  const invoice = new Invoice({
    items: [{ namaBarang: "Barang", tujuanKirim: "Bogor", biayaEkspedisi: 100001 }],
  });

  assert.deepEqual(invoice.groupedItems, [
    {
      description: "Barang",
      area: "Bogor",
      unitPrice: 100001,
      quantity: 1,
      totalNetto: 98001,
    },
  ]);
});
