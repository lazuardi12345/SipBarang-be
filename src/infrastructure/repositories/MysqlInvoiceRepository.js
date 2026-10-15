/**
 * MysqlInvoiceRepository — Implementasi IInvoiceRepository menggunakan Prisma.
 */
import { IInvoiceRepository } from "../../domain/repositories/IInvoiceRepository.js";
import { Invoice } from "../../domain/entities/Invoice.js";
import { InvoiceItemRepository } from "./invoice/InvoiceItemRepository.js";

export class MysqlInvoiceRepository extends IInvoiceRepository {
  constructor(prismaClient) {
    super();
    this.prisma = prismaClient;
    this.itemRepository = new InvoiceItemRepository(prismaClient);
  }

  async _toEntity(row) {
    if (!row) return null;

    const storedItems = Array.isArray(row.items)
      ? row.items
      : Array.isArray(row.invoiceItems)
        ? row.invoiceItems
        : [];
    const deliveryOrderIds = [...new Set(
      storedItems.map((item) => item.deliveryOrderId).filter(Boolean)
    )];
    const deliveryOrders = deliveryOrderIds.length > 0
      ? await this.prisma.deliveryOrder.findMany({
          where: { id: { in: deliveryOrderIds } },
          include: { schedule: true, document: true },
        })
      : [];
    const orderById = new Map(
      deliveryOrders.map((order) => [order.id, order])
    );
    const items = storedItems.map((item) => {
      const order = orderById.get(item.deliveryOrderId) || {};
      const schedule = order.schedule || {};
      const document = order.document || {};
      return {
        ...item,
        namaBarang:
          (item.namaBarang && item.namaBarang !== "-" ? item.namaBarang : "") ||
          document.keteranganDoc ||
          item.namaBarang,
        tujuanKirim: item.tujuanKirim || order.tujuanKirim,
        areaDistribusi: item.areaDistribusi || order.areaDistribusi,
        noSchedule: schedule.noSchedule || "-",
        tipeMobilRit: schedule.tipeMobilRit || "1",
      };
    });

    return new Invoice({
      id: row.id,
      noInvoice: row.noInvoice,
      tanggalInvoice: row.tanggalInvoice?.toISOString?.() || row.tanggalInvoice,
      namaPelanggan: row.namaPelanggan,
      alamatPelanggan: row.alamatPelanggan,
      noPoCustomer: row.noPoCustomer,
      items,
      subtotal: Number(row.subtotal || 0),
      totalPPh2: Number(row.totalPph2 || 0),
      totalTagihan: Number(row.totalTagihan || 0),
      status: row.status,
      dibuatOleh: row.dibuatOleh,
      verificationToken: row.verificationToken,
      createdAt: row.createdAt?.toISOString?.() || row.createdAt,
      updatedAt: row.updatedAt?.toISOString?.() || row.updatedAt,
    });
  }

  _toPrismaData(invoice) {
    const data = {
      noInvoice: invoice.noInvoice,
      tanggalInvoice: invoice.tanggalInvoice || new Date(),
      namaPelanggan: invoice.namaPelanggan,
      alamatPelanggan: invoice.alamatPelanggan || "",
      noPoCustomer: invoice.noPoCustomer || null,
      subtotal: Number(invoice.subtotal || 0),
      totalPph2: Number(invoice.totalPPh2 || invoice.totalPPh || 0),
      totalTagihan: Number(invoice.totalTagihan || invoice.totalBersih || 0),
      status: invoice.status || "BELUM_LUNAS",
      dibuatOleh: invoice.dibuatOleh || null,
      verificationToken: invoice.verificationToken || null,
    };

    Object.keys(data).forEach((key) => {
      if (data[key] === undefined) delete data[key];
    });

    return data;
  }

  _invoiceItemsData(invoice) {
    return this.itemRepository.toPrismaData(invoice.items);
  }

  async create(invoice) {
    const row = await this.prisma.invoice.create({
      data: {
        id: invoice.id,
        ...this._toPrismaData(invoice),
        items: {
          create: this._invoiceItemsData(invoice),
        },
      },
      include: {
        items: true,
      },
    });
    return this._toEntity(row);
  }

  async update(invoice) {
    const existing = await this.prisma.invoice.findUnique({
      where: { id: invoice.id },
    });

    if (!existing) {
      throw new Error("Invoice tidak ditemukan");
    }

    const row = await this.prisma.invoice.update({
      where: { id: invoice.id },
      data: {
        ...this._toPrismaData(invoice),
        items: {
          deleteMany: {},
          create: this._invoiceItemsData(invoice),
        },
      },
      include: {
        items: true,
      },
    });
    return this._toEntity(row);
  }

  async findById(id) {
    const row = await this.prisma.invoice.findUnique({
      where: { id },
      include: {
        items: true,
      },
    });
    return this._toEntity(row);
  }

  async findByVerificationToken(verificationToken) {
    const row = await this.prisma.invoice.findUnique({
      where: { verificationToken },
      include: { items: true },
    });
    return this._toEntity(row);
  }

  async list() {
    const rows = await this.prisma.invoice.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        items: true,
      },
    });
    return Promise.all(rows.map((row) => this._toEntity(row)));
  }

  async count() {
    return this.prisma.invoice.count();
  }
}
