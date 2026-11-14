import test from "node:test";
import assert from "node:assert/strict";
import { CreatePengeluaranLainUseCase } from "../src/application/use-cases/pengeluaran-lain/CreatePengeluaranLainUseCase.js";
import { UpdatePengeluaranLainUseCase } from "../src/application/use-cases/pengeluaran-lain/UpdatePengeluaranLainUseCase.js";
import { DeletePengeluaranLainUseCase } from "../src/application/use-cases/pengeluaran-lain/DeletePengeluaranLainUseCase.js";
import { GetPengeluaranLainUseCase } from "../src/application/use-cases/pengeluaran-lain/GetPengeluaranLainUseCase.js";

function createMockRepo() {
  const store = new Map();
  return {
    async findAll() {
      return Array.from(store.values());
    },
    async findById(id) {
      return store.get(id) || null;
    },
    async create(data) {
      const entity = { ...data, id: data.id || `pl-${store.size + 1}` };
      store.set(entity.id, entity);
      return entity;
    },
    async update(data) {
      store.set(data.id, { ...data });
      return store.get(data.id);
    },
    async delete(id) {
      store.delete(id);
      return true;
    },
  };
}

test("PengeluaranLain CRUD: create, read, update, delete", async () => {
  const repo = createMockRepo();
  const createUseCase = new CreatePengeluaranLainUseCase(repo);
  const getUseCase = new GetPengeluaranLainUseCase(repo);
  const updateUseCase = new UpdatePengeluaranLainUseCase(repo);
  const deleteUseCase = new DeletePengeluaranLainUseCase(repo);

  // 1. Create
  const created = await createUseCase.execute(
    {
      tanggal: "2026-11-14",
      kategori: "Operasional",
      nominal: 250000,
      keterangan: "Beli oli mesin & isi air aki",
      catatan: "Nota terlampir di kasir",
    },
    { nama: "Admin Operasional" }
  );

  assert.equal(created.nominal, 250000);
  assert.equal(created.keterangan, "Beli oli mesin & isi air aki");
  assert.equal(created.dibuatOleh, "Admin Operasional");

  // 2. Read
  const all = await getUseCase.execute();
  assert.equal(all.length, 1);

  // 3. Update
  const updated = await updateUseCase.execute(created.id, {
    nominal: 300000,
    keterangan: "Beli oli mesin super & isi air aki",
  });
  assert.equal(updated.nominal, 300000);
  assert.equal(updated.keterangan, "Beli oli mesin super & isi air aki");

  // 4. Delete
  await deleteUseCase.execute(created.id);
  const afterDelete = await getUseCase.execute();
  assert.equal(afterDelete.length, 0);
});

