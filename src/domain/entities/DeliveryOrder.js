/**
 * Domain Entity: DeliveryOrder (DO / Surat Jalan Ekspedisi)
 * Merepresentasikan alur pengiriman dari:
 * Input Schedule & Surat Jalan Perusahaan -> Menunggu ACC Direktur -> ACC/Tolak -> Pengiriman -> Pelaporan Terkirim -> Invoice
 */
export const StatusDO = Object.freeze({
  DRAFT: "DRAFT",
  PLANNING: "PLANNING",
  MENUNGGU_ACC: "MENUNGGU_ACC",
  DISETUJUI: "DISETUJUI",
  DITOLAK: "DITOLAK",
  DALAM_PENGIRIMAN: "DALAM_PENGIRIMAN",
  MENUNGGU_KONFIRMASI: "MENUNGGU_KONFIRMASI",
  TERKIRIM: "TERKIRIM",
});

export class DeliveryOrder {
  constructor(data) {
    this.id = data.id;
    this.noDO = data.noDO;
    this.tanggalKirim = data.tanggalKirim || new Date().toISOString();

    // Data Jadwal & Kendaraan (Schedule Perusahaan)
    this.noSchedule = data.noSchedule || "";
    this.tglSchedule = data.tglSchedule || new Date().toISOString().split("T")[0];
    this.tipeMobilRit = data.tipeMobilRit || "8 TON / Rit : 1";
    this.gudangAsal = data.gudangAsal || "GUDANG PUSAT - KARAWANG";
    this.namaSupir = data.namaSupir || "";
    this.noHpSupir = data.noHpSupir || "";
    this.noPolisiKendaraan = data.noPolisiKendaraan || "";
    this.jenisKendaraan = data.jenisKendaraan || "Mobil CDD 8 Ton";

    // Surat Jalan / Dokumen dari Perusahaan (Pabrik)
    this.noDocPerusahaan = data.noDocPerusahaan || "";
    this.tglDocPerusahaan = data.tglDocPerusahaan || "";
    this.namaToko = data.namaToko || data.namaPenerima || "";
    this.salesman = data.salesman || "";
    this.agen = data.agen || "TBN";
    this.kota = data.kota || "";
    this.kecamatan = data.kecamatan || "";
    this.alamatLengkapTujuan = data.alamatLengkapTujuan || "";
    this.noHpPenerima = data.noHpPenerima || "";
    this.keteranganDoc = data.keteranganDoc || data.catatanBarang || "";

    // Data Tarif & Rute (Berdasarkan Surat Kiriman Dari Karawang PT Almira Yuniar Trek)
    this.tarifId = data.tarifId;
    this.areaDistribusi = data.areaDistribusi || "";
    this.tujuanKirim = data.tujuanKirim || "";
    this.biayaEkspedisi = Number(data.biayaEkspedisi || 0);
    this.pph2Persen = Number(data.pph2Persen || 2);
    this.totalSetelahPPh = Number(data.totalSetelahPPh || 0);

    // Rincian Daftar Produk / Muatan Barang (Bisa multi-item)
    this.itemsBarang = Array.isArray(data.itemsBarang) ? data.itemsBarang : [];
    // Backwards compatibility jika barang diisi single text
    this.namaBarang = data.namaBarang || (this.itemsBarang.map(i => `${i.namaBarang} (${i.jumlah})`).join(", ") || "");
    this.jumlahKoli = Number(data.jumlahKoli || this.itemsBarang.reduce((sum, i) => sum + Number(i.jumlah || 0), 0) || 0);
    this.totalNilaiBarang = Number(
      data.totalNilaiBarang ||
        this.itemsBarang.reduce(
          (sum, i) => sum + (Number(i.jumlah || 0) * Number(i.hargaSatuan || 0)),
          0
        ) ||
        0
    );
    this.beratBarangKg = Number(data.beratBarangKg || 0);
    this.catatanBarang = data.catatanBarang || "";

    // Status & Pembuat
    this.status = data.status || StatusDO.DRAFT;
    this.dibuatOleh = data.dibuatOleh; // { id, nama, role }
    
    // Approval Direktur - Berangkat
    this.disetujuiOleh = data.disetujuiOleh || null;
    this.disetujuiPada = data.disetujuiPada || null;
    this.catatanDirektur = data.catatanDirektur || null;

    // Pelaporan Pengiriman oleh Admin/Supir
    this.namaPenerimaBarang = data.namaPenerimaBarang || null;
    this.catatanPelaporan = data.catatanPelaporan || null;
    this.buktiPengirimanUrl = data.buktiPengirimanUrl || null;
    this.tanggalDiterima = data.tanggalDiterima || null;

    // Konfirmasi ACC Selesai Terkirim oleh Direktur
    this.dikonfirmasiOleh = data.dikonfirmasiOleh || null;
    this.dikonfirmasiPada = data.dikonfirmasiPada || null;
    this.catatanKonfirmasiDirektur = data.catatanKonfirmasiDirektur || null;

    this.createdAt = data.createdAt || new Date().toISOString();
    this.updatedAt = data.updatedAt || new Date().toISOString();
  }
}
