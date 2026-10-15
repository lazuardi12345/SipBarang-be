import test from "node:test";
import assert from "node:assert/strict";
import { GenerateInvoiceUseCase } from "../src/application/use-cases/invoice/GenerateInvoiceUseCase.js";
import { VerifyInvoiceUseCase } from "../src/application/use-cases/invoice/GetInvoicesUseCase.js";

test("invoice creation is rejected unless the caller is a director", async () => {
  let repositoryUsed = false;
  const useCase = new GenerateInvoiceUseCase(
    { list: async () => { repositoryUsed = true; return []; } },
    {}
  );

  await assert.rejects(
    useCase.execute({}, { id: "admin-1", role: "ADMIN" }),
    { statusCode: 403, message: "Pembuatan invoice hanya dapat dilakukan oleh Direktur" }
  );
  assert.equal(repositoryUsed, false);
});

test("invoice verification looks up an opaque token and returns only verification details", async () => {
  const verificationToken = "a".repeat(64);
  let requestedToken;
  const useCase = new VerifyInvoiceUseCase({
    findByVerificationToken: async (token) => {
      requestedToken = token;
      return {
        noInvoice: "INV/AYT/2026/10/0001",
        namaPelanggan: "PT Contoh",
        tanggalInvoice: "2026-10-15T00:00:00.000Z",
        status: "BELUM_LUNAS",
        dibuatOleh: { nama: "Direktur", role: "DIREKTUR" },
        totalTagihan: 999999,
      };
    },
  });

  const result = await useCase.execute(verificationToken);

  assert.equal(requestedToken, verificationToken);
  assert.deepEqual(result, {
    verified: true,
    noInvoice: "INV/AYT/2026/10/0001",
    namaPelanggan: "PT Contoh",
    tanggalInvoice: "2026-10-15T00:00:00.000Z",
    totalTagihan: 999999,
    status: "BELUM_LUNAS",
    namaPengesah: "Direktur",
    rolePengesah: "DIREKTUR",
  });
  assert.equal(result.totalTagihan, 999999);
});

test("invoice verification rejects malformed tokens and missing invoices", async () => {
  const useCase = new VerifyInvoiceUseCase({
    findByVerificationToken: async () => null,
  });

  await assert.rejects(useCase.execute("not-a-token"), { statusCode: 404 });
  await assert.rejects(useCase.execute("b".repeat(64)), { statusCode: 404 });
});
