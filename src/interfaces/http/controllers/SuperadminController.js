import crypto from "crypto";
import { PasswordHasher } from "../../../infrastructure/security/PasswordHasher.js";

const USER_ROLES = new Set(["ADMIN", "DIREKTUR", "SUPERADMIN"]);
const ORDER_STATUSES = new Set([
  "DRAFT",
  "PLANNING",
  "MENUNGGU_ACC",
  "MENUNGGU_APPROVAL",
  "DISETUJUI",
  "APPROVED",
  "DITOLAK",
  "REJECTED",
  "DALAM_PENGIRIMAN",
  "MENUNGGU_KONFIRMASI",
  "TERKIRIM",
  "DIKIRIM",
  "SELESAI",
  "DIBATALKAN",
]);
const INVOICE_STATUSES = new Set(["BELUM_LUNAS", "LUNAS", "DIBATALKAN"]);

function badRequest(message) {
  const error = new Error(message);
  error.statusCode = 400;
  return error;
}

function requiredText(value, label) {
  if (typeof value !== "string" || !value.trim()) {
    throw badRequest(`${label} wajib diisi.`);
  }
  return value.trim();
}

function optionalText(value) {
  if (value === undefined) return undefined;
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function optionalDate(value, label) {
  if (value === undefined) return undefined;
  if (value === null || value === "") return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) throw badRequest(`${label} tidak valid.`);
  return date;
}

function optionalNumber(value, label, fallback) {
  if (value === undefined) return fallback;
  if (value === "") return fallback;
  if (value === null) return null;
  const number = Number(value);
  if (!Number.isFinite(number) || number < 0) {
    throw badRequest(`${label} harus berupa angka nol atau lebih.`);
  }
  return number;
}

function requiredNumber(value, label) {
  if (value === undefined || value === null || value === "") {
    throw badRequest(`${label} wajib diisi.`);
  }
  return optionalNumber(value, label, undefined);
}

function optionalBoolean(value, label, fallback) {
  if (value === undefined) return fallback;
  if (typeof value !== "boolean") throw badRequest(`${label} tidak valid.`);
  return value;
}

function pickTextFields(input, fields) {
  return Object.fromEntries(
    fields
      .filter((field) => input[field] !== undefined)
      .map((field) => [field, optionalText(input[field])])
  );
}

function parseOrderData(input, creating = false) {
  const data = pickTextFields(input, [
    "noDo",
    "status",
    "tarifId",
    "areaDistribusi",
    "tujuanKirim",
    "namaBarang",
    "catatanBarang",
  ]);
  if (creating) data.noDo = requiredText(input.noDo, "Nomor DO");
  if (input.status !== undefined && !ORDER_STATUSES.has(input.status)) {
    throw badRequest("Status DO tidak dikenal.");
  }
  if (input.tanggalKirim !== undefined) {
    data.tanggalKirim = optionalDate(input.tanggalKirim, "Tanggal kirim");
  }
  for (const [field, label, fallback] of [
    ["biayaEkspedisi", "Tarif bruto", 0],
    ["pph2", "PPh 2%", null],
    ["totalSetelahPPh", "Total netto", null],
    ["uangJalanSupir", "Uang jalan supir", null],
    ["jumlahKoli", "Jumlah koli", 0],
    ["totalNilaiBarang", "Total nilai barang", 0],
    ["beratBarangKg", "Berat barang", 0],
  ]) {
    if (input[field] !== undefined) {
      data[field] = optionalNumber(input[field], label, fallback);
    }
  }
  if (input.itemsBarang !== undefined) data.itemsBarang = input.itemsBarang;
  return data;
}

function parseSchedule(input = {}) {
  const data = pickTextFields(input, [
    "noSchedule",
    "tipeMobilRit",
    "gudangAsal",
    "namaSupir",
    "noHpSupir",
    "noPolisiKendaraan",
    "jenisKendaraan",
  ]);
  if (input.tglSchedule !== undefined) {
    data.tglSchedule = optionalDate(input.tglSchedule, "Tanggal schedule");
  }
  return data;
}

function parseDocument(input = {}) {
  const data = pickTextFields(input, [
    "noDocPerusahaan",
    "namaToko",
    "salesman",
    "agen",
    "kota",
    "kecamatan",
    "alamatLengkapTujuan",
    "noHpPenerima",
    "keteranganDoc",
    "mdo",
    "lembar",
  ]);
  if (input.tglDocPerusahaan !== undefined) {
    data.tglDocPerusahaan = optionalDate(input.tglDocPerusahaan, "Tanggal dokumen");
  }
  return data;
}

function parseInvoiceItems(items) {
  if (!Array.isArray(items)) throw badRequest("Rincian invoice harus berupa daftar.");
  return items.map((item, index) => {
    if (!item || typeof item !== "object") {
      throw badRequest(`Rincian invoice baris ${index + 1} tidak valid.`);
    }
    return {
      deliveryOrderId: optionalText(item.deliveryOrderId),
      noDO: optionalText(item.noDO),
      noDocPerusahaan: optionalText(item.noDocPerusahaan),
      tglDocPerusahaan: optionalDate(item.tglDocPerusahaan, "Tanggal surat jalan"),
      namaToko: optionalText(item.namaToko),
      areaDistribusi: optionalText(item.areaDistribusi),
      tujuanKirim: optionalText(item.tujuanKirim),
      tanggalKirim: optionalDate(item.tanggalKirim, "Tanggal kirim"),
      namaSupir: optionalText(item.namaSupir),
      noPolisiKendaraan: optionalText(item.noPolisiKendaraan),
      namaBarang: optionalText(item.namaBarang),
      jumlahKoli: optionalNumber(item.jumlahKoli, "Jumlah koli", 0) ?? 0,
      biayaEkspedisi: optionalNumber(item.biayaEkspedisi, "Tarif item", 0) ?? 0,
      pph2: optionalNumber(item.pph2, "PPh item", 0) ?? 0,
      totalSetelahPPh: optionalNumber(item.totalSetelahPPh, "Netto item", 0) ?? 0,
    };
  });
}

export class SuperadminController {
  constructor(prisma) {
    this.prisma = prisma;
  }

  overview = async (req, res, next) => {
    try {
      const [users, tarifs, deliveryOrders, invoices] = await Promise.all([
        this.prisma.user.findMany({
          select: { id: true, nama: true, email: true, role: true, active: true, createdAt: true, updatedAt: true },
          orderBy: { createdAt: "desc" },
        }),
        this.prisma.tarif.findMany({ orderBy: [{ areaDistribusi: "asc" }, { tujuanKirim: "asc" }, { total: "asc" }] }),
        this.prisma.deliveryOrder.findMany({
          include: {
            schedule: true,
            document: true,
            reports: { orderBy: { createdAt: "desc" } },
            approvals: { orderBy: { createdAt: "desc" } },
            confirmations: { orderBy: { createdAt: "desc" } },
            histories: { orderBy: { createdAt: "desc" } },
          },
          orderBy: [{ tanggalKirim: "desc" }, { createdAt: "desc" }],
        }),
        this.prisma.invoice.findMany({
          include: { items: true },
          orderBy: [{ tanggalInvoice: "desc" }, { createdAt: "desc" }],
        }),
      ]);
      res.json({
        success: true,
        data: {
          users,
          tarifs,
          deliveryOrders,
          invoices,
          counts: {
            users: users.length,
            activeUsers: users.filter((user) => user.active).length,
            tarifs: tarifs.length,
            activeTarifs: tarifs.filter((tarif) => tarif.active).length,
            deliveryOrders: deliveryOrders.length,
            invoices: invoices.length,
          },
        },
      });
    } catch (error) {
      next(error);
    }
  };

  createUser = async (req, res, next) => {
    try {
      const nama = requiredText(req.body.nama, "Nama");
      const email = requiredText(req.body.email, "Email").toLowerCase();
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw badRequest("Format email tidak valid.");
      const password = requiredText(req.body.password, "Password");
      const role = req.body.role || "ADMIN";
      if (!USER_ROLES.has(role)) throw badRequest("Role pengguna tidak dikenal.");
      if (password.length < 8) throw badRequest("Password minimal 8 karakter.");
      const user = await this.prisma.user.create({
        data: {
          id: `usr-${crypto.randomUUID()}`,
          nama,
          email,
          passwordHash: await PasswordHasher.hash(password),
          role,
          active: optionalBoolean(req.body.active, "Status aktif pengguna", true),
        },
        select: { id: true, nama: true, email: true, role: true, active: true, createdAt: true, updatedAt: true },
      });
      res.status(201).json({ success: true, data: user });
    } catch (error) {
      next(error);
    }
  };

  updateUser = async (req, res, next) => {
    try {
      const current = await this.prisma.user.findUnique({ where: { id: req.params.id } });
      if (!current) throw Object.assign(new Error("Pengguna tidak ditemukan."), { statusCode: 404 });
      const data = {};
      if (req.body.nama !== undefined) data.nama = requiredText(req.body.nama, "Nama");
      if (req.body.email !== undefined) data.email = requiredText(req.body.email, "Email").toLowerCase();
      if (data.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) throw badRequest("Format email tidak valid.");
      if (req.body.role !== undefined) {
        if (!USER_ROLES.has(req.body.role)) throw badRequest("Role pengguna tidak dikenal.");
        data.role = req.body.role;
      }
      if (req.body.active !== undefined) {
        if (typeof req.body.active !== "boolean") throw badRequest("Status aktif pengguna tidak valid.");
        data.active = req.body.active;
      }
      if (req.body.password !== undefined && req.body.password !== "") {
        if (req.body.password.length < 8) throw badRequest("Password minimal 8 karakter.");
        data.passwordHash = await PasswordHasher.hash(req.body.password);
      }
      if (req.params.id === req.user.id && (data.active === false || data.role && data.role !== "SUPERADMIN")) {
        throw badRequest("Akun Superadmin yang sedang digunakan tidak dapat dinonaktifkan atau diturunkan rolenya.");
      }
      if ((data.active === false || data.role && data.role !== "SUPERADMIN") && current.role === "SUPERADMIN" && current.active) {
        const remaining = await this.prisma.user.count({
          where: { role: "SUPERADMIN", active: true, id: { not: current.id } },
        });
        if (remaining === 0) throw badRequest("Minimal harus ada satu akun Superadmin aktif.");
      }
      const user = await this.prisma.user.update({
        where: { id: req.params.id },
        data,
        select: { id: true, nama: true, email: true, role: true, active: true, createdAt: true, updatedAt: true },
      });
      res.json({ success: true, data: user });
    } catch (error) {
      next(error);
    }
  };

  createTarif = async (req, res, next) => {
    try {
      const tarif = await this.prisma.tarif.create({
        data: {
          id: `tarif-${crypto.randomUUID()}`,
          areaDistribusi: requiredText(req.body.areaDistribusi, "Area distribusi"),
          tujuanKirim: requiredText(req.body.tujuanKirim, "Tujuan kirim"),
          total: requiredNumber(req.body.total, "Tarif bruto"),
          active: optionalBoolean(req.body.active, "Status aktif tarif", true),
        },
      });
      res.status(201).json({ success: true, data: tarif });
    } catch (error) {
      next(error);
    }
  };

  updateTarif = async (req, res, next) => {
    try {
      const data = {};
      if (req.body.areaDistribusi !== undefined) data.areaDistribusi = requiredText(req.body.areaDistribusi, "Area distribusi");
      if (req.body.tujuanKirim !== undefined) data.tujuanKirim = requiredText(req.body.tujuanKirim, "Tujuan kirim");
      if (req.body.total !== undefined) data.total = optionalNumber(req.body.total, "Tarif bruto", 0);
      if (req.body.active !== undefined) {
        if (typeof req.body.active !== "boolean") throw badRequest("Status aktif tarif tidak valid.");
        data.active = req.body.active;
      }
      const tarif = await this.prisma.tarif.update({ where: { id: req.params.id }, data });
      res.json({ success: true, data: tarif });
    } catch (error) {
      next(error);
    }
  };

  createDeliveryOrder = async (req, res, next) => {
    try {
      const data = parseOrderData(req.body, true);
      data.tarifId = requiredText(data.tarifId, "Tarif tujuan");
      const tarif = await this.prisma.tarif.findUnique({ where: { id: data.tarifId } });
      if (!tarif || tarif.active === false) {
        throw Object.assign(new Error("Tarif tujuan tidak ditemukan atau sudah dinonaktifkan."), { statusCode: 404 });
      }
      const schedule = parseSchedule(req.body.schedule || {});
      const document = parseDocument(req.body.document || {});
      const order = await this.prisma.deliveryOrder.create({
        data: {
          ...data,
          dibuatOleh: { id: req.user.id, nama: req.user.nama, role: req.user.role },
          schedule: { create: schedule },
          document: { create: document },
        },
        include: { schedule: true, document: true, reports: true, approvals: true, confirmations: true, histories: true },
      });
      res.status(201).json({ success: true, data: order });
    } catch (error) {
      next(error);
    }
  };

  updateDeliveryOrder = async (req, res, next) => {
    try {
      const data = parseOrderData(req.body);
      if (data.tarifId) {
        const [current, tarif] = await Promise.all([
          this.prisma.deliveryOrder.findUnique({ where: { id: req.params.id }, select: { tarifId: true } }),
          this.prisma.tarif.findUnique({ where: { id: data.tarifId } }),
        ]);
        if (!tarif || (tarif.active === false && current?.tarifId !== data.tarifId)) {
          throw Object.assign(new Error("Tarif tujuan tidak ditemukan atau sudah dinonaktifkan."), { statusCode: 404 });
        }
      }
      if (req.body.schedule) {
        data.schedule = {
          upsert: {
            create: parseSchedule(req.body.schedule),
            update: parseSchedule(req.body.schedule),
          },
        };
      }
      if (req.body.document) {
        data.document = {
          upsert: {
            create: parseDocument(req.body.document),
            update: parseDocument(req.body.document),
          },
        };
      }
      const order = await this.prisma.deliveryOrder.update({
        where: { id: req.params.id },
        data,
        include: { schedule: true, document: true, reports: true, approvals: true, confirmations: true, histories: true },
      });
      res.json({ success: true, data: order });
    } catch (error) {
      next(error);
    }
  };

  createReport = async (req, res, next) => {
    try {
      const report = await this.prisma.deliveryOrderReport.create({
        data: {
          orderId: req.params.orderId,
          namaPenerimaBarang: optionalText(req.body.namaPenerimaBarang),
          catatanPelaporan: optionalText(req.body.catatanPelaporan),
          buktiPengirimanUrl: optionalText(req.body.buktiPengirimanUrl),
          tanggalDiterima: optionalDate(req.body.tanggalDiterima, "Tanggal diterima"),
        },
      });
      res.status(201).json({ success: true, data: report });
    } catch (error) {
      next(error);
    }
  };

  updateReport = async (req, res, next) => {
    try {
      const data = pickTextFields(req.body, ["namaPenerimaBarang", "catatanPelaporan", "buktiPengirimanUrl"]);
      if (req.body.tanggalDiterima !== undefined) {
        data.tanggalDiterima = optionalDate(req.body.tanggalDiterima, "Tanggal diterima");
      }
      if (req.body.active !== undefined) {
        if (typeof req.body.active !== "boolean") throw badRequest("Status aktif laporan tidak valid.");
        data.active = req.body.active;
      }
      const report = await this.prisma.deliveryOrderReport.update({
        where: { id: req.params.reportId, orderId: req.params.orderId },
        data,
      });
      res.json({ success: true, data: report });
    } catch (error) {
      next(error);
    }
  };

  createInvoice = async (req, res, next) => {
    try {
      const items = parseInvoiceItems(req.body.items || []);
      const status = req.body.status || "BELUM_LUNAS";
      if (!INVOICE_STATUSES.has(status)) throw badRequest("Status invoice tidak dikenal.");
      const invoice = await this.prisma.invoice.create({
        data: {
          id: `inv-${crypto.randomUUID()}`,
          noInvoice: requiredText(req.body.noInvoice, "Nomor invoice"),
          tanggalInvoice: optionalDate(req.body.tanggalInvoice, "Tanggal invoice") || new Date(),
          namaPelanggan: requiredText(req.body.namaPelanggan, "Nama pelanggan"),
          alamatPelanggan: optionalText(req.body.alamatPelanggan),
          noPoCustomer: optionalText(req.body.noPoCustomer),
          subtotal: optionalNumber(req.body.subtotal, "Subtotal", 0),
          totalPph2: optionalNumber(req.body.totalPph2, "Total PPh 2%", 0),
          totalTagihan: optionalNumber(req.body.totalTagihan, "Total tagihan", 0),
          status,
          items: { create: items },
        },
        include: { items: true },
      });
      res.status(201).json({ success: true, data: invoice });
    } catch (error) {
      next(error);
    }
  };

  updateInvoice = async (req, res, next) => {
    try {
      const data = {};
      if (req.body.noInvoice !== undefined) data.noInvoice = requiredText(req.body.noInvoice, "Nomor invoice");
      if (req.body.tanggalInvoice !== undefined) data.tanggalInvoice = optionalDate(req.body.tanggalInvoice, "Tanggal invoice");
      if (req.body.namaPelanggan !== undefined) data.namaPelanggan = requiredText(req.body.namaPelanggan, "Nama pelanggan");
      for (const field of ["alamatPelanggan", "noPoCustomer"]) {
        if (req.body[field] !== undefined) data[field] = optionalText(req.body[field]);
      }
      for (const [field, label] of [
        ["subtotal", "Subtotal"],
        ["totalPph2", "Total PPh 2%"],
        ["totalTagihan", "Total tagihan"],
      ]) {
        if (req.body[field] !== undefined) data[field] = optionalNumber(req.body[field], label, 0);
      }
      if (req.body.status !== undefined) {
        if (!INVOICE_STATUSES.has(req.body.status)) throw badRequest("Status invoice tidak dikenal.");
        data.status = req.body.status;
      }
      if (req.body.items !== undefined) {
        data.items = { deleteMany: {}, create: parseInvoiceItems(req.body.items) };
      }
      const invoice = await this.prisma.invoice.update({
        where: { id: req.params.id },
        data,
        include: { items: true },
      });
      res.json({ success: true, data: invoice });
    } catch (error) {
      next(error);
    }
  };
}
