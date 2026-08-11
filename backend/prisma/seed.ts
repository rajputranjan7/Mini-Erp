import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

// Fixed test password for all seeded accounts. Change in real environments.
const PASSWORD = "Password123!";

async function main() {
  const passwordHash = await bcrypt.hash(PASSWORD, 10);

  const [admin, sales, warehouse, accounts] = await Promise.all([
    prisma.user.upsert({
      where: { email: "admin@minierp.test" },
      update: {},
      create: { name: "Asha Admin", email: "admin@minierp.test", passwordHash, role: "ADMIN" },
    }),
    prisma.user.upsert({
      where: { email: "sales@minierp.test" },
      update: {},
      create: { name: "Rahul Sales", email: "sales@minierp.test", passwordHash, role: "SALES" },
    }),
    prisma.user.upsert({
      where: { email: "warehouse@minierp.test" },
      update: {},
      create: { name: "Vikram Warehouse", email: "warehouse@minierp.test", passwordHash, role: "WAREHOUSE" },
    }),
    prisma.user.upsert({
      where: { email: "accounts@minierp.test" },
      update: {},
      create: { name: "Priya Accounts", email: "accounts@minierp.test", passwordHash, role: "ACCOUNTS" },
    }),
  ]);

  const products = await Promise.all([
    prisma.product.upsert({
      where: { sku: "STL-PIPE-01" },
      update: {},
      create: {
        name: "Steel Pipe 1 inch",
        sku: "STL-PIPE-01",
        category: "Plumbing",
        unitPrice: 250,
        currentStock: 500,
        minStockQty: 50,
        location: "Warehouse A - Rack 3",
      },
    }),
    prisma.product.upsert({
      where: { sku: "CEM-BAG-50" },
      update: {},
      create: {
        name: "Cement Bag 50kg",
        sku: "CEM-BAG-50",
        category: "Construction",
        unitPrice: 420,
        currentStock: 200,
        minStockQty: 30,
        location: "Warehouse A - Yard",
      },
    }),
    prisma.product.upsert({
      where: { sku: "WIRE-CU-2.5" },
      update: {},
      create: {
        name: "Copper Wire 2.5mm (100m coil)",
        sku: "WIRE-CU-2.5",
        category: "Electrical",
        unitPrice: 1850,
        currentStock: 8,
        minStockQty: 10, // intentionally below threshold to demo low-stock alerts
        location: "Warehouse B - Rack 1",
      },
    }),
  ]);

  const customer = await prisma.customer.create({
    data: {
      name: "Suresh Traders",
      mobile: "9876543210",
      email: "suresh.traders@example.com",
      businessName: "Suresh Traders Pvt Ltd",
      gstNumber: "24AATFS1234K1Z1",
      customerType: "WHOLESALE",
      status: "ACTIVE",
      address: "12 Ring Road, Ahmedabad, Gujarat",
      notes: "Prefers monthly consolidated billing.",
      createdById: sales.id,
    },
  });

  console.log("Seed complete.");
  console.log("----------------------------------------");
  console.log("Test login credentials (all use the same password):");
  console.log(`  Password: ${PASSWORD}`);
  [admin, sales, warehouse, accounts].forEach((u) => console.log(`  ${u.role.padEnd(10)} -> ${u.email}`));
  console.log("----------------------------------------");
  console.log(`Seeded ${products.length} products and 1 sample customer (${customer.name}).`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
