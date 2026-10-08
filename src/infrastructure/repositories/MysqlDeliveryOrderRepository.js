/**
 * MysqlDeliveryOrderRepository — Implementasi IDeliveryOrderRepository menggunakan Prisma.
 * Struktur data yang rapi: DO utama + relasi schedule/document terpisah.
 */
import { IDeliveryOrderRepository } from "../../domain/repositories/IDeliveryOrderRepository.js";
import { DeliveryOrder } from "../../domain/entities/DeliveryOrder.js";
import { DeliveryOrderScheduleRepository } from "./delivery-order/DeliveryOrderScheduleRepository.js";
import { DeliveryOrderDocumentRepository } from "./delivery-order/DeliveryOrderDocumentRepository.js";
import { DeliveryOrderReportRepository } from "./delivery-order/DeliveryOrderReportRepository.js";

export class MysqlDeliveryOrderRepository extends IDeliveryOrderRepository {
  constructor(prismaClient) {
    super();
    this.prisma = prismaClient;
    this.scheduleRepository = new DeliveryOrderScheduleRepository(prismaClient);
    this.documentRepository = new DeliveryOrderDocumentRepository(prismaClient);
    this.reportRepository = new DeliveryOrderReportRepository(prismaClient);
    this.include = {
      schedule: true,
      document: true,
      reports: true,
      approvals: true,
      confirmations: true,
    };
  }

  _toDateString(value) {
    return value && typeof value.toISOString === "function" ? value.toISOString() : value;
  }

  _firstDefined(...values) {
    return values.find((value) => value !== undefined && value !== null && value !== "");
  }

  _toEntity(row) {
    if (!row) return null;

    const schedule = row.schedule || {};
    const document = row.document || {};
    const report = Array.isArray(row.reports) ? row.reports[0] || {} : {};

    return new DeliveryOrder({
      id: row.id,
      noDO: row.noDo,
      tanggalKirim: this._toDateString(row.tanggalKirim),

      noSchedule: this._firstDefined(row.noSchedule, schedule.noSchedule),
      tglSchedule: this._toDateString(this._firstDefined(row.tglSchedule, schedule.tglSchedule)),
      tipeMobilRit: this._firstDefined(row.tipeMobilRit, schedule.tipeMobilRit),
      gudangAsal: this._firstDefined(row.gudangAsal, schedule.gudangAsal),
      namaSupir: this._firstDefined(row.namaSupir, schedule.namaSupir),
      noHpSupir: this._firstDefined(row.noHpSupir, schedule.noHpSupir),
      noPolisiKendaraan: this._firstDefined(row.noPolisiKendaraan, schedule.noPolisiKendaraan),
      jenisKendaraan: this._firstDefined(row.jenisKendaraan, schedule.jenisKendaraan),

      noDocPerusahaan: this._firstDefined(row.noDocPerusahaan, document.noDocPerusahaan),
      tglDocPerusahaan: this._toDateString(this._firstDefined(row.tglDocPerusahaan, document.tglDocPerusahaan)),
      namaToko: this._firstDefined(row.namaToko, document.namaToko),
      salesman: this._firstDefined(row.salesman, document.salesman),
      agen: this._firstDefined(row.agen, document.agen),
      kota: this._firstDefined(row.kota, document.kota),
      kecamatan: this._firstDefined(row.kecamatan, document.kecamatan),
      alamatLengkapTujuan: this._firstDefined(row.alamatLengkapTujuan, document.alamatLengkapTujuan),
      noHpPenerima: this._firstDefined(row.noHpPenerima, document.noHpPenerima),
      keteranganDoc: this._firstDefined(row.keteranganDoc, document.keteranganDoc),

      tarifId: row.tarifId,
      areaDistribusi: row.areaDistribusi,
      tujuanKirim: row.tujuanKirim,
      biayaEkspedisi: Number(row.biayaEkspedisi || 0),
      pph2Persen: Number(this._firstDefined(row.pph2Persen, row.pph2, 0) || 0),
      totalSetelahPPh: Number(this._firstDefined(row.totalSetelahPPh, row.totalSetelahPph, row.totalSetAfterPPh, row.biayaEkspedisi, 0) || 0),


      status: row.status,
      dibuatOleh: row.dibuatOleh,

      disetujuiOleh: row.disetujuiOleh,
      disetujuiPada: this._toDateString(row.disetujuiPada),
      catatanDirektur: row.catatanDirektur,

      namaPenerimaBarang: this._firstDefined(row.namaPenerimaBarang, report.namaPenerimaBarang),
      catatanPelaporan: this._firstDefined(row.catatanPelaporan, report.catatanPelaporan),
      buktiPengirimanUrl: this._firstDefined(row.buktiPengirimanUrl, report.buktiPengirimanUrl),
      tanggalDiterima: this._toDateString(this._firstDefined(row.tanggalDiterima, report.tanggalDiterima)),

      dikonfirmasiOleh: row.dikonfirmasiOleh,
      dikonfirmasiPada: this._toDateString(row.dikonfirmasiPada),
      catatanKonfirmasiDirektur: row.catatanKonfirmasiDirektur,

      createdAt: this._toDateString(row.createdAt),
      updatedAt: this._toDateString(row.updatedAt),
    });
  }

  _toPrismaData(order) {
    const data = {
      id: order.id,
      noDo: order.noDO,
      tanggalKirim: order.tanggalKirim || null,
      tarifId: order.tarifId || null,
      areaDistribusi: order.areaDistribusi || null,
      tujuanKirim: order.tujuanKirim || null,
      biayaEkspedisi: Number(order.biayaEkspedisi || 0),
      status: order.status || "DRAFT",
      dibuatOleh: order.dibuatOleh || null,
    };

    return Object.fromEntries(
      Object.entries(data).filter(([, value]) => value !== undefined)
    );
  }

  _scheduleData(order) {
    return this.scheduleRepository.toPrismaData(order);
  }

  _documentData(order) {
    return this.documentRepository.toPrismaData(order);
  }

  async create(order) {
    const schedule = this._scheduleData(order);
    const document = this._documentData(order);

    const row = await this.prisma.deliveryOrder.create({
      data: {
        ...this._toPrismaData(order),
        ...(schedule ? { schedule: { create: schedule } } : {}),
        ...(document ? { document: { create: document } } : {}),
      },
      include: this.include,
    });

    return this._toEntity(row);
  }

  async update(order) {
    const existing = await this.prisma.deliveryOrder.findUnique({
      where: { id: order.id },
    });

    if (!existing) {
      throw new Error("Data Surat Jalan (DO) tidak ditemukan");
    }

    const schedule = this._scheduleData(order);
    const document = this._documentData(order);

    const row = await this.prisma.deliveryOrder.update({
      where: { id: order.id },
      data: {
        ...this._toPrismaData(order),
        ...(schedule ? { schedule: { upsert: { create: schedule, update: schedule } } } : {}),
        ...(document ? { document: { upsert: { create: document, update: document } } } : {}),
      },
      include: this.include,
    });

    return this._toEntity(row);
  }

  async findById(id) {
    const row = await this.prisma.deliveryOrder.findUnique({
      where: { id },
      include: this.include,
    });
    return this._toEntity(row);
  }

  async list() {
    const rows = await this.prisma.deliveryOrder.findMany({
      orderBy: { createdAt: "desc" },
      include: this.include,
    });
    return rows.map((row) => this._toEntity(row));
  }

  async delete(id) {
    const row = await this.prisma.deliveryOrder.delete({
      where: { id },
      include: this.include,
    });
    return this._toEntity(row);
  }

  async listByStatus(status) {
    const rows = await this.prisma.deliveryOrder.findMany({
      where: { status },
      orderBy: { createdAt: "desc" },
      include: this.include,
    });
    return rows.map((row) => this._toEntity(row));
  }

  async count() {
    return this.prisma.deliveryOrder.count();
  }
}
