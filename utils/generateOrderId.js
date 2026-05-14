/**
 * Generates a human-friendly order ID.
 * Format: CG-YYYYMMDD-XXXX (e.g. CG-20250513-A3F2)
 */
const generateOrderId = () => {
  const now = new Date();
  const datePart =
    now.getFullYear().toString() +
    String(now.getMonth() + 1).padStart(2, "0") +
    String(now.getDate()).padStart(2, "0");

  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let randomPart = "";
  for (let i = 0; i < 4; i++) {
    randomPart += chars.charAt(Math.floor(Math.random() * chars.length));
  }

  return `CG-${datePart}-${randomPart}`;
};

module.exports = generateOrderId;
