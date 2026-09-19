import crypto from "crypto";
import { DeliveryOrder, StatusDO } from "../../../domain/entities/DeliveryOrder.js";

export class CreateDeliveryOrderUseCase {
  constructor(deliveryOrderRepository, tarifRepository) {
    this.deliveryOrderRepository = deliveryOrderRepository;
    this.tarifRepository = tarifRepository;
  }

  async execute(input, user) {
    if (!input.namaSupir || !input.noPolisiKendaraan || !input.tarifId) {
      const err = new Error("Nama supir, nomor polisi kendaraan, dan tujuan kirim wajib diisi");
      err.statusCode = 400;
      throw err;
    }

    const tarif = await this.tarifRepository.findById(input.tarifId);
    if (!tarif) {
      const err = new Error("Data tarif tujuan tidak ditemukan");
      err.statusCode = 404;
      throw err;
    }

    const totalOrders = await this.deliveryOrderRepository.count();
    const noDO = this.generateNoDO(totalOrders + 1);
    const now = new Date().toISOString();
    const id = `do-${Date.now()}-${crypto.randomBytes(3).toString("hex")}`;

    const order = new DeliveryOrder({
      id,
      noDO,
      tanggalKirim: input.tanggalKirim || now,

      // Schedule & Armada
      noSchedule: input.noSchedule || `SCH/${Date.now().toString().slice(-6)}`,
      tglSchedule: input.tglSchedule || now.split("T")[0],
      tipeMobilRit: input.tipeMobilRit || "8 TON / Rit : 1",
      gudangAsal: input.gudangAsal || "GUDANG PUSAT - KARAWANG",
      namaSupir: input.namaSupir,
      noHpSupir: input.noHpSupir || "",
      noPolisiKendaraan: input.noPolisiKendaraan,
      jenisKendaraan: input.jenisKendaraan || "Mobil CDD 8 Ton",

      // Dokumen Surat Jalan Perusahaan (Pabrik)
      noDocPerusahaan: input.noDocPerusahaan || "",
      tglDocPerusahaan: input.tglDocPerusahaan || "",
      namaToko: input.namaToko || input.namaPenerima || "",
      salesman: input.salesman || "",
      agen: input.agen || "TBN",
      kota: input.kota || "",
      kecamatan: input.kecamatan || "",
      alamatLengkapTujuan: input.alamatLengkapTujuan || "",
      noHpPenerima: input.noHpPenerima || "",
      keteranganDoc: input.keteranganDoc || input.catatanBarang || "",

      // Tarif & Lokasi
      tarifId: tarif.id,
      areaDistribusi: tarif.areaDistribusi,
      tujuanKirim: tarif.tujuanKirim,
      biayaEkspedisi: tarif.total,
      pph2Persen: 2,
      totalSetelahPPh: tarif.totalSetelahPPh,

      // Produk / Muatan
      itemsBarang: Array.isArray(input.itemsBarang) ? input.itemsBarang : [],
      namaBarang: input.namaBarang || "",
      jumlahKoli: Number(input.jumlahKoli || 0),
      totalNilaiBarang: Number(input.totalNilaiBarang || 0),
      beratBarangKg: Number(input.beratBarangKg || 0),
      catatanBarang: input.catatanBarang || "",

      status: input.status || StatusDO.DRAFT,
      dibuatOleh: {
        id: user.id,
        nama: user.nama,
        role: user.role,
      },
      createdAt: now,
      updatedAt: now,
    });

    return this.deliveryOrderRepository.create(order);
  }

  generateNoDO(sequence) {
    const now = new Date();
    const yyyy = now.getFullYear();
    const mm = String(now.getMonth() + 1).padStart(2, "0");
    const padded = String(sequence).padStart(4, "0");
    return `DO/${yyyy}/${mm}/${padded}`;
  }
}
