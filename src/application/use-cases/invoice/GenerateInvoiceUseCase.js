import crypto from "crypto";
import { Invoice, StatusInvoice } from "../../../domain/entities/Invoice.js";
import { StatusDO } from "../../../domain/entities/DeliveryOrder.js";

export class GenerateInvoiceUseCase {
  constructor(invoiceRepository, deliveryOrderRepository) {
    this.invoiceRepository = invoiceRepository;
    this.deliveryOrderRepository = deliveryOrderRepository;
  }

  async execute(input, user) {
    if (!input.namaPelanggan) {
      const err = new Error("Nama pelanggan wajib diisi");
      err.statusCode = 400;
      throw err;
    }

    let deliveryOrderIds = input.deliveryOrderIds;
    if ((!deliveryOrderIds || !Array.isArray(deliveryOrderIds) || deliveryOrderIds.length === 0) && input.items && Array.isArray(input.items)) {
      deliveryOrderIds = input.items.map((it) => it.deliveryOrderId).filter(Boolean);
    }

    if (!deliveryOrderIds || !Array.isArray(deliveryOrderIds) || deliveryOrderIds.length === 0) {
      const err = new Error("Pilih minimal satu Surat Jalan (DO) yang berstatus Terkirim");
      err.statusCode = 400;
      throw err;
    }

    const items = [];
    for (const doId of deliveryOrderIds) {
      const order = await this.deliveryOrderRepository.findById(doId);
      if (!order) continue;

      if (order.status !== StatusDO.TERKIRIM) {
        const err = new Error(`Surat Jalan ${order.noDO} belum berstatus Terkirim, tidak dapat dibuatkan invoice`);
        err.statusCode = 400;
        throw err;
      }

      const biayaEkspedisi = Number(order.biayaEkspedisi || 0);
      const pph2 = biayaEkspedisi * 0.02;
      const totalSetelahPPh = biayaEkspedisi - pph2;

      items.push({
        deliveryOrderId: order.id,
        noDO: order.noDO,
        noDocPerusahaan: order.noDocPerusahaan || "-",
        tglDocPerusahaan: order.tglDocPerusahaan || "",
        namaToko: order.namaToko || order.namaPenerima || "-",
        areaDistribusi: order.areaDistribusi || "-",
        tujuanKirim: order.tujuanKirim || "-",
        tanggalKirim: order.tanggalKirim,
        namaSupir: order.namaSupir || "-",
        noPolisiKendaraan: order.noPolisiKendaraan || "-",
        namaBarang: "-",
        jumlahKoli: 0,
        biayaEkspedisi,
        pph2,
        totalSetelahPPh,
      });
    }

    if (items.length === 0) {
      const err = new Error("Tidak ada Surat Jalan valid yang dapat dimasukkan ke dalam invoice");
      err.statusCode = 400;
      throw err;
    }

    const subtotal = items.reduce((sum, item) => sum + Number(item.biayaEkspedisi || 0), 0);
    const totalPPh2 = subtotal * 0.02;
    const totalTagihan = subtotal - totalPPh2;

    const requestedNoInvoice = typeof input.noInvoice === "string" ? input.noInvoice.trim() : "";
    const existingInvoices = await this.invoiceRepository.list();
    const noInvoice = requestedNoInvoice || this.generateNoInvoice(existingInvoices.length + 1);

    if (requestedNoInvoice && existingInvoices.some((invoice) => invoice.noInvoice === noInvoice)) {
      const err = new Error("Nomor invoice sudah digunakan. Silakan masukkan nomor lain.");
      err.statusCode = 409;
      throw err;
    }

    const now = new Date().toISOString();
    const id = `inv-${Date.now()}-${crypto.randomBytes(3).toString("hex")}`;

    const invoice = new Invoice({
      id,
      noInvoice,
      tanggalInvoice: now,
      namaPelanggan: input.namaPelanggan,
      alamatPelanggan: input.alamatPelanggan || "",
      items,
      subtotal,
      totalPPh2,
      totalTagihan,
      status: StatusInvoice.BELUM_LUNAS,
      dibuatOleh: {
        id: user.id,
        nama: user.nama,
        role: user.role,
      },
      createdAt: now,
      updatedAt: now,
    });

    return this.invoiceRepository.create(invoice);
  }

  generateNoInvoice(sequence) {
    const now = new Date();
    const yyyy = now.getFullYear();
    const mm = String(now.getMonth() + 1).padStart(2, "0");
    const padded = String(sequence).padStart(4, "0");
    return `INV/AYT/${yyyy}/${mm}/${padded}`;
  }
}
