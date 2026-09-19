import "dotenv/config";
import { createApp } from "./app.js";

const PORT = process.env.PORT || 5000;

async function start() {
  try {
    const { app } = await createApp();

    const server = app.listen(PORT, () => {
      console.log(`=========================================`);
      console.log(`🚀 Delivery Order Backend (Express.js)`);
      console.log(`📡 URL     : http://localhost:${PORT}`);
      console.log(`🎯 API Base: http://localhost:${PORT}/api`);
      console.log(`🛡️  Arch   : Clean Architecture + MySQL`);
      console.log(`=========================================`);
    });

    // Graceful shutdown
    process.on("SIGINT", () => {
      console.log("\nMematikan server...");
      server.close(() => {
        console.log("Server dihentikan secara aman.");
        process.exit(0);
      });
    });
  } catch (err) {
    console.error("❌ Gagal memulai server:", err.message);
    console.error("   Pastikan MySQL berjalan di port", process.env.DB_PORT || 3307);
    process.exit(1);
  }
}

start();
