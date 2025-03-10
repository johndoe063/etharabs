// payments.js
const API_KEY = '21XEEBB-9DPM32B-JQ9Y445-KM4ER0N'; // Replace with your real NowPayments API key
const CREATE_PAYMENT_URL = 'https://api.nowpayments.io/v1/payment';
const PAYMENT_STATUS_URL = 'https://api.nowpayments.io/v1/payment/';

/**
 * Creates a payment.
 * @param {number} amount - Payment amount in USD.
 * @returns {Promise<Object>} - Payment data (ID, address, amount, etc.)
 */
export async function createPayment(amount) {
  const payload = {
    price_amount: amount,
    price_currency: 'usd',
    pay_currency: 'usdttrc20',
    order_id: 'order_' + Date.now(),
    ipn_callback_url: window.location.origin + '/ipn',  // Adjust as needed
    success_url: window.location.origin + '/success'
  };

  const response = await fetch(CREATE_PAYMENT_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': API_KEY
    },
    body: JSON.stringify(payload)
  });

  if (!response.ok) {
    throw new Error('Error creating payment');
  }

  const data = await response.json();
  console.log('Payment creation response:', data);
  return data;
}

/**
 * Checks the payment status.
 * @param {string} paymentId - The payment ID.
 * @returns {Promise<Object>} - Status data.
 */
export async function checkPaymentStatus(paymentId) {
  const response = await fetch(PAYMENT_STATUS_URL + paymentId, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': API_KEY
    }
  });

  if (!response.ok) {
    const errorData = await response.json();
    console.error('Error response:', errorData);
    throw new Error('Error checking payment status');
  }
  const data = await response.json();
  console.log('Payment status response:', data);
  return data;
}

/**
 * Polls the payment status.
 * @param {string} paymentId - The payment ID.
 * @param {Function} onUpdate - Callback called with status data.
 * @param {number} [intervalMs=10000] - Polling interval (ms).
 * @param {number} [initialDelay=30000] - Delay before polling starts (ms).
 */
export function pollPaymentStatus(paymentId, onUpdate, intervalMs = 10000, initialDelay = 30000) {
  setTimeout(() => {
    const intervalId = setInterval(async () => {
      try {
        const status = await checkPaymentStatus(paymentId);
        console.log('Status update:', status);
        onUpdate(status);
        if (status.payment_status === 'finished' || status.payment_status === 'confirmed') {
          clearInterval(intervalId);
        }
      } catch (error) {
        console.error('Polling error:', error);
      }
    }, intervalMs);
  }, initialDelay);
}
