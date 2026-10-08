/**
 * InvoiceItemRepository
 * Mapping khusus untuk table invoice_items.
 */
export class InvoiceItemRepository {
  constructor(prismaClient) {
    this.prisma = prismaClient;
  }

  toPrismaData(invoiceItem = []) {
    if (!Array.isArray(invoiceItem) || invoiceItem.length === 0) return [];

    return invoiceItem.map((item) => ({
      deliveryOrderId: item.deliveryOrderId || null,
      noDO: item.noDO || null,
      noDocPerusahaan: item.noDocPerusahaan || null,
      tglDocPerusahaan: item.tglDocPerusahaan || null,
      namaToko: item.namaToko || null,
      areaDistribusi: item.areaDistribusi || null,
      tujuanKirim: item.tujuanKirim || null,
      tanggalKirim: item.tanggalKirim || null,
      namaSupir: item.namaSupir || null,
      noPolisiKendaraan: item.noPolisiKendaraan || null,
      namaBarang: item.namaBarang || null,
      jumlahKoli: Number(item.jumlahKoli || 0),
      biayaEkspedisi: Number(item.biayaEkspedisi || 0),
      pph2: Number(item.pph2 || 0),
      totalSetelahPPh: Number(item.totalSetelahPPh ?? item.totalSetelahPph ?? 0),
    }));
  }

  toEntity(row = {}) {
    return {
      id: row.id,
      deliveryOrderId: row.deliveryOrderId,
      noDO: row.noDO,
      noDocPerusahaan: row.noDocPerusahaan,
      tglDocPerusahaan: row.tglDocPerusahaan,
      namaToko: row.namaToko,
      areaDistribusi: row.areaDistribusi,
      tujuanKirim: row.tujuanKirim,
      tanggalKirim: row.tanggalKirim,
      namaSupir: row.namaSupir,
      noPolisiKendaraan: row.noPolisiKendaraan,
      namaBarang: row.namaBarang,
      jumlahKoli: Number(row.jumlahKoli || 0),
      biayaEkspedisi: Number(row.biayaEkspedisi || 0),
      pph2: Number(row.pph2 || 0),
      totalSetelahPPh: Number(row.totalSetelahPPh ?? row.totalSetelahPph ?? 0),
    };
  }

  async replace(invoiceId, items) {
    const data = this.toPrismaData(items);

    await this.prisma.invoiceItem.deleteMany({
      where: { invoiceId },
    });

    if (data.length === 0) return [];

    const created = await this.prisma.invoiceItem.createMany({
      data: data.map((item) => ({
        ...item,
        invoiceId,
      })),
    });

    return created;
  }
}
