import crypto from "crypto";
import { DeliveryOrder, StatusDO } from "../../../domain/entities/DeliveryOrder.js";

export class CreateDeliveryOrderUseCase {
  constructor(deliveryOrderRepository, tarifRepository) {
    this.deliveryOrderRepository = deliveryOrderRepository;
    this.tarifRepository = tarifRepository;
  }

  async execute(input, user) {
    const namaToko = input.namaToko?.trim() || input.namaPenerima?.trim() || "";
    if (!input.tarifId || !namaToko) {
      const err = new Error("Tujuan kirim dan nama toko/depo wajib diisi");
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
      noSchedule: input.noSchedule || "",
      tglSchedule: input.tglSchedule || "",
      tipeMobilRit: input.tipeMobilRit || "",
      gudangAsal: input.gudangAsal || "GUDANG PUSAT - KARAWANG",
      namaSupir: input.namaSupir || "",
      noHpSupir: input.noHpSupir || "",
      noPolisiKendaraan: input.noPolisiKendaraan || "",
      jenisKendaraan: input.jenisKendaraan || "Mobil CDD 8 Ton",

      // Dokumen Surat Jalan Perusahaan (Pabrik)
      noDocPerusahaan: "",
      tglDocPerusahaan: "",
      namaToko,
      salesman: input.salesman || "",
      agen: input.agen || "TBN",
      kota: input.kota || "",
      kecamatan: input.kecamatan || "",
      alamatLengkapTujuan: input.alamatLengkapTujuan || "",
      noHpPenerima: input.noHpPenerima || "",
      keteranganDoc: input.keteranganDoc || "",

      // Tarif & Lokasi
      tarifId: tarif.id,
      areaDistribusi: tarif.areaDistribusi,
      tujuanKirim: tarif.tujuanKirim,
      biayaEkspedisi: Number(tarif.total || 0),
      pph2Persen: 0,
      totalSetelahPPh: Number(tarif.total || 0),

      itemsBarang: [],
      namaBarang: "",
      jumlahKoli: 0,
      totalNilaiBarang: 0,
      beratBarangKg: 0,
      catatanBarang: "",

      status: StatusDO.DRAFT,
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
