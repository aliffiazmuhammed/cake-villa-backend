/**
 * WhatsApp notification utility (placeholder).
 *
 * All functions currently log to the console.
 * Replace the internals with a real WhatsApp Business API / Twilio
 * integration when ready — the function signatures stay the same.
 */

const ADMIN_PHONE = process.env.ADMIN_PHONE || "+919876543210";

/**
 * Notify the customer that their order has been received.
 */
exports.notifyUserOrderPlaced = async (phone, orderId, items) => {
  const itemCount = items.reduce((sum, i) => sum + i.quantity, 0);
  const message =
    `🎂 *Cake Gallery — Order Confirmed!*\n\n` +
    `Hi! Your order *${orderId}* has been received.\n` +
    `Items: ${itemCount} cake(s)\n\n` +
    `We'll confirm your order shortly. Thank you!`;

  console.log(`[WhatsApp → User ${phone}]`, message);
  // TODO: Replace with actual WhatsApp API call
  // await whatsappClient.sendMessage(phone, message);
};

/**
 * Notify the admin about a new incoming order.
 */
exports.notifyAdminNewOrder = async (orderId, customerName, customerPhone, items) => {
  const itemCount = items.reduce((sum, i) => sum + i.quantity, 0);
  const message =
    `📦 *New Order Received!*\n\n` +
    `Order ID: *${orderId}*\n` +
    `Customer: ${customerName} (${customerPhone})\n` +
    `Items: ${itemCount} cake(s)\n\n` +
    `Check admin portal for details.`;

  console.log(`[WhatsApp → Admin ${ADMIN_PHONE}]`, message);
  // TODO: Replace with actual WhatsApp API call
  // await whatsappClient.sendMessage(ADMIN_PHONE, message);
};

/**
 * Notify the customer when their order status changes.
 */
exports.notifyUserOrderStatus = async (phone, orderId, status) => {
  const statusMessages = {
    confirmed: `✅ Your order *${orderId}* has been confirmed! We're getting started.`,
    preparing: `👨‍🍳 Your order *${orderId}* is being prepared with love!`,
    ready: `🎉 Your order *${orderId}* is ready and will be dispatched soon!`,
    delivered: `🚚 Your order *${orderId}* has been delivered! Enjoy your cake 🎂`,
    rejected: `❌ Sorry, your order *${orderId}* could not be fulfilled. Please contact us for details.`,
    cancelled: `🔄 Your order *${orderId}* has been cancelled.`,
  };

  const message =
    `🎂 *Cake Gallery — Order Update*\n\n` +
    (statusMessages[status] || `Your order *${orderId}* status: ${status}`);

  console.log(`[WhatsApp → User ${phone}]`, message);
  // TODO: Replace with actual WhatsApp API call
  // await whatsappClient.sendMessage(phone, message);
};
