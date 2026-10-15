import test from "node:test";
import assert from "node:assert/strict";
import { RegisterUseCase } from "../src/application/use-cases/auth/RegisterUseCase.js";

test("public registration always creates an admin even if director role is requested", async () => {
  let createdUser;
  const useCase = new RegisterUseCase({
    findByEmail: async () => null,
    create: async (user) => {
      createdUser = user;
      return user;
    },
  });

  await useCase.execute({
    nama: "Test",
    email: "test@example.com",
    password: "test-password",
    role: "DIREKTUR",
  });

  assert.equal(createdUser.role, "ADMIN");
});
