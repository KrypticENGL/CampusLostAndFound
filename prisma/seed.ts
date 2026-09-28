import { PrismaClient, type Prisma } from "@prisma/client";
import { hashPassword } from "../lib/password";

const db = new PrismaClient();

function daysAgo(n: number): Date {
  const d = new Date();
  d.setUTCHours(12, 0, 0, 0);
  d.setUTCDate(d.getUTCDate() - n);
  return d;
}

/**
 * Test/dummy accounts for local development and demos. Do NOT use in production.
 * Change these passwords (or delete the accounts) before deploying publicly.
 */
export const TEST_USERS = [
  { name: "Test Admin", email: "admin@campus.test", password: "Admin@12345", role: "ADMIN" as const },
  { name: "Test Student", email: "student@campus.test", password: "Student@12345", role: "STUDENT" as const },
];

const items: Prisma.ItemCreateInput[] = [
  // ---- LOST ----
  { itemType: "LOST", name: "Black Wallet", category: "ACCESSORIES", location: "Canteen", date: daysAgo(2),
    description: "Black leather bifold wallet with my college ID, a metro card and some cash. Lost around lunch time near the billing counter.",
    contactName: "Aarav Mehta", contactType: "EMAIL", contactValue: "aarav.mehta@campus.edu" },
  { itemType: "LOST", name: "Blue Water Bottle", category: "OTHER", location: "Sports Ground", date: daysAgo(4),
    description: "1L blue steel water bottle with a Decathlon sticker and a small dent on the bottom. Left it on the bench after football practice.",
    contactName: "Priya Nair", contactType: "PHONE", contactValue: "+919876543210" },
  { itemType: "LOST", name: "Student ID Card", category: "DOCUMENTS", location: "Library", date: daysAgo(1),
    description: "College ID card in a red lanyard. Name: Rohan Das, Computer Science 3rd year. Probably dropped near the issue desk.",
    contactName: "Rohan Das", contactType: "EMAIL", contactValue: "rohan.das@campus.edu" },
  { itemType: "LOST", name: "Wireless Earbuds", category: "ELECTRONICS", location: "Block A", date: daysAgo(3),
    description: "White wireless earbuds in a charging case, slight scratch on the lid. Lost in room A-204 after the morning lecture.",
    contactName: "Sneha Kapoor", contactType: "PHONE", contactValue: "+919812345678" },
  { itemType: "LOST", name: "Mathematics Book", category: "BOOKS", location: "Block B", date: daysAgo(6),
    description: "Engineering Mathematics textbook by B.S. Grewal with my name written inside the cover and lots of sticky notes.",
    contactName: "Karan Singh", contactType: "EMAIL", contactValue: "karan.singh@campus.edu" },
  { itemType: "LOST", name: "Grey Laptop Backpack", category: "BAGS", location: "Auditorium", date: daysAgo(5),
    description: "Grey Wildcraft backpack with a laptop sleeve, charger and a blue notebook inside. Left under a seat during the tech fest.",
    contactName: "Meera Iyer", contactType: "PHONE", contactValue: "+919900112233" },
  { itemType: "LOST", name: "Scientific Calculator", category: "ELECTRONICS", location: "Lab Complex", date: daysAgo(9),
    description: "Casio fx-991ES calculator, black, initials VK scratched on the back.",
    contactName: "Vikram Kumar", contactType: "EMAIL", contactValue: "vikram.k@campus.edu" },
  { itemType: "LOST", name: "Silver Bike Keys", category: "ACCESSORIES", location: "Parking", date: daysAgo(0),
    description: "Two keys on a silver keyring with a small Batman keychain. Honda Activa key.",
    contactName: "Ananya Rao", contactType: "PHONE", contactValue: "+919845012345" },

  // ---- FOUND ----
  { itemType: "FOUND", name: "Black Leather Wallet", category: "ACCESSORIES", location: "Canteen", date: daysAgo(2),
    description: "Found a black leather wallet on a table near the billing counter. Has a metro card inside. Contact me to identify it.",
    contactName: "Canteen Security Desk", contactType: "PHONE", contactValue: "+919000011111" },
  { itemType: "FOUND", name: "Blue Steel Bottle", category: "OTHER", location: "Sports Ground", date: daysAgo(3),
    description: "Blue steel water bottle with a sticker, found on the bench next to the football field.",
    contactName: "Sports Office", contactType: "EMAIL", contactValue: "sports.office@campus.edu" },
  { itemType: "FOUND", name: "College ID Card", category: "DOCUMENTS", location: "Library", date: daysAgo(1),
    description: "ID card with a red lanyard found near the library issue desk. Kept with the librarian.",
    contactName: "Library Front Desk", contactType: "EMAIL", contactValue: "library@campus.edu" },
  { itemType: "FOUND", name: "White Earbuds Case", category: "ELECTRONICS", location: "Block A", date: daysAgo(2),
    description: "White earbuds charging case with earbuds inside, found in classroom A-204. Scratch on the lid.",
    contactName: "Dev Patel", contactType: "PHONE", contactValue: "+919876500000" },
  { itemType: "FOUND", name: "Data Structures Book", category: "BOOKS", location: "Library", date: daysAgo(4),
    description: "Data Structures and Algorithms textbook found on a reading table on the 2nd floor. No name inside.",
    contactName: "Ishita Verma", contactType: "EMAIL", contactValue: "ishita.v@campus.edu" },
  { itemType: "FOUND", name: "Umbrella", category: "OTHER", location: "Hostel", date: daysAgo(7),
    description: "Large black umbrella with a wooden handle left at the hostel reception.",
    contactName: "Hostel Warden", contactType: "PHONE", contactValue: "+919000022222" },
  { itemType: "FOUND", name: "Grey Backpack", category: "BAGS", location: "Auditorium", date: daysAgo(4),
    description: "Grey backpack with a laptop charger and notebook inside, found under a seat in row F after the tech fest.",
    contactName: "Auditorium Staff", contactType: "EMAIL", contactValue: "events@campus.edu" },
  { itemType: "FOUND", name: "Prescription Glasses", category: "ACCESSORIES", location: "Block B", date: daysAgo(8),
    description: "Black framed spectacles in a brown case, found in the Block B washroom corridor.",
    contactName: "Nikhil Joshi", contactType: "PHONE", contactValue: "+919811122233" },
];

async function main() {
  await db.item.deleteMany();
  await db.user.deleteMany(); // sessions cascade

  const users: Record<string, string> = {};
  for (const u of TEST_USERS) {
    const { password, ...rest } = u;
    const created = await db.user.create({ data: { ...rest, passwordHash: hashPassword(password) } });
    users[u.email] = created.id;
  }

  // The test student owns the first listing (Black Wallet) so owner-only actions can be demoed.
  for (const [i, data] of items.entries()) {
    const owner = i === 0 ? { connect: { id: users["student@campus.test"] } } : undefined;
    await db.item.create({ data: { ...data, user: owner } });
  }
  console.log(`Seeded ${TEST_USERS.length} test users and ${items.length} items`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
