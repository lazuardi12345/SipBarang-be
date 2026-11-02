export async function nextSequentialIds(prisma, scope, count = 1) {
  if (!Number.isSafeInteger(count) || count < 1) {
    throw new Error("Jumlah ID berurutan harus berupa bilangan bulat positif");
  }

  return prisma.$transaction(async (transaction) => {
    await transaction.$executeRaw`
      INSERT INTO \`id_counters\` (\`scope\`, \`last_value\`)
      VALUES (${scope}, ${count})
      ON DUPLICATE KEY UPDATE \`last_value\` = \`last_value\` + ${count}
    `;
    const [counter] = await transaction.$queryRaw`
      SELECT \`last_value\` AS \`lastValue\`
      FROM \`id_counters\`
      WHERE \`scope\` = ${scope}
    `;

    if (!counter) {
      throw new Error(`Gagal membuat ID berurutan untuk ${scope}`);
    }

    const firstValue = Number(counter.lastValue) - count + 1;
    return Array.from({ length: count }, (_, index) => String(firstValue + index));
  });
}

export async function nextSequentialId(prisma, scope) {
  const [id] = await nextSequentialIds(prisma, scope);
  return id;
}
