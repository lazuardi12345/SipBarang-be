/**
 * Domain Entity: DeliveryOrder (DO / Surat Jalan Ekspedisi)
 * Merepresentasikan alur pengiriman dari:
 * Rencana tujuan/barang -> Schedule & surat jalan perusahaan -> Menunggu ACC Direktur -> Pengiriman -> Invoice
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
    this.tglSchedule = data.tglSchedule || "";
    this.tipeMobilRit = data.tipeMobilRit || "";
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
    this.keteranganDoc = data.keteranganDoc || "";

    // Data Tarif & Rute (Berdasarkan Surat Kiriman Dari Karawang PT Almira Yuniar Trek)
    this.tarifId = data.tarifId;
    this.areaDistribusi = data.areaDistribusi || "";
    this.tujuanKirim = data.tujuanKirim || "";
    this.biayaEkspedisi = Number(data.biayaEkspedisi || 0);
    this.pph2Persen = Number(data.pph2Persen || 0);
    this.totalSetelahPPh = Number(data.totalSetelahPPh ?? data.biayaEkspedisi ?? 0);

    // this.itemsBarang = [];
    // this.namaBarang = "";
    // this.jumlahKoli = 0;
    // this.totalNilaiBarang = 0;
    // this.beratBarangKg = Number(data.beratBarangKg || 0);
    // this.catatanBarang = "";

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
