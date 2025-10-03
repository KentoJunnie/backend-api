const axios = require('axios');

const PAYMONGO_SECRET_KEY = process.env.PAYMONGO_SECRET_KEY; // For production, use process.env.PAYMONGO_SECRET_KEY

/**
 * Creates a PayMongo GCash source and returns the checkout URL.
 * @param {number} amount - Amount in PHP (e.g., 500 for ₱500)
 * @param {string} redirectUrl - Where PayMongo will redirect after payment
 * @param {string} orderId - Your order ID for tracking
 * @returns {Promise<string>} - The GCash checkout URL
 */
async function createGCashSource({ amount, redirectUrl, orderId }) {
  const payload = {
    data: {
      attributes: {
        amount: amount * 100, // PayMongo expects centavos
        redirect: {
          success: `${redirectUrl}?orderId=${orderId}&status=success`,
          failed: `${redirectUrl}?orderId=${orderId}&status=failed`
        },
        type: 'gcash',
        currency: 'PHP'
      }
    }
  };

  const response = await axios.post(
    'https://api.paymongo.com/v1/sources',
    payload,
    {
      auth: {
        username: PAYMONGO_SECRET_KEY,
        password: ''
      },
      headers: {
        'Content-Type': 'application/json'
      }
    }
  );

  // Return the GCash checkout URL
  return response.data.data.attributes.redirect.checkout_url;
}

module.exports = { createGCashSource }; 