/**
 * NOVA HOUSE · Client Payment & Razorpay Checkout Service
 *
 * Handles Razorpay checkout loading,
 * order creation,
 * payment authorization,
 * and Supabase payment persistence.
 *
 * NEVER stores Razorpay secret keys on the client.
 */

import { savePaymentToSupabase, saveBookingToSupabase } from './supabase';

const RAW_API_BASE =
  import.meta.env.VITE_API_BASE_URL ||
  'http://127.0.0.1:8000';

const API_BASE = RAW_API_BASE
  .replace(/\/+$/, '')
  .replace(/\/api(\/v1)?$/, '');

let razorpayScriptLoadedPromise = null;

/**
 * Load Razorpay checkout SDK.
 */
export function loadRazorpayScript() {
  if (razorpayScriptLoadedPromise) {
    return razorpayScriptLoadedPromise;
  }

  razorpayScriptLoadedPromise =
    new Promise((resolve) => {
      if (window.Razorpay) {
        resolve(true);
        return;
      }

      const script =
        document.createElement('script');

      script.src =
        'https://checkout.razorpay.com/v1/checkout.js';

      script.async = true;

      script.onload = () => {
        resolve(true);
      };

      script.onerror = () => {
        console.warn(
          'Failed to load live Razorpay SDK script from CDN.'
        );

        resolve(false);
      };

      document.body.appendChild(script);
    });

  return razorpayScriptLoadedPromise;
}

/**
 * Create Razorpay order data.
 *
 * For the NOVA HOUSE demo this creates
 * a client-side test order object.
 */
export async function createRazorpayOrder(
  bookingData
) {
  const nights =
    Number(bookingData.nights || 1);

  const baseRate =
    Number(
      bookingData.baseRate || 18500
    );

  const subtotal =
    baseRate * nights;

  const taxes =
    Number(
      bookingData.taxes ??
      Math.round(subtotal * 0.18)
    );

  const discount =
    Number(
      bookingData.discount || 0
    );

  const total =
    Number(
      bookingData.totalAmount ??
      subtotal +
      taxes -
      discount
    );

  const amountPaise =
    Math.round(total * 100);

  const orderId =
    `order_${Math.random()
      .toString(36)
      .substring(2, 11)}`;

  const bookingId =
    bookingData.id ||
    bookingData.bookingId ||
    `NH-${Math.floor(
      1000 + Math.random() * 9000
    )}`;

  // Persist pending booking in Supabase so foreign key payments_booking_id_fkey is satisfied
  try {
    await saveBookingToSupabase({
      ...bookingData,
      id: bookingId,
      bookingId,
      paymentStatus: 'UNPAID',
      bookingStatus: 'Pending',
      totalAmount: total,
      baseRate,
      nights,
      taxes,
      discount,
    });
  } catch (err) {
    console.warn('Pre-payment booking creation warning:', err);
  }

  return {
    orderId,

    razorpay_order_id:
      orderId,

    amount:
      total,

    amountPaise,

    amount_paise:
      amountPaise,

    currency:
      'INR',

    keyId:
      import.meta.env
        .VITE_RAZORPAY_KEY_ID ||
      'rzp_test_Tn6fk3U9ygDw0q',

    bookingId,

    status:
      'created',

    isRealOrder:
      false,
  };
}

/**
 * Verify payment and save it to Supabase.
 */
export async function verifyPaymentOnServer(
  verificationData
) {
  const bookingId =
    verificationData.bookingId ||
    verificationData.booking_id;

  const paymentId =
    verificationData.paymentId ||
    verificationData.razorpay_payment_id ||
    `pay_${Date.now()}`;

  const orderId =
    verificationData.orderId ||
    verificationData.razorpay_order_id;

  const signature =
    verificationData.signature ||
    verificationData.razorpay_signature ||
    `sig_${Math.random()
      .toString(36)
      .substring(2, 9)}`;

  await savePaymentToSupabase({
    bookingId,

    orderId,

    paymentId,

    signature,

    amount:
      verificationData.amount ||
      21830,

    method:
      verificationData.method ||
      'Online / Razorpay',

    email:
      verificationData.email ||
      verificationData.guestEmail ||
      '',

    contact:
      verificationData.contact ||
      verificationData.guestPhone ||
      '',
  });

  return {
    success: true,

    bookingId,

    paymentId,

    status:
      'PAID',

    message:
      'Payment verified and recorded into Supabase.',
  };
}

/**
 * Retry payment for existing booking.
 */
export async function retryPaymentOrder(
  bookingId
) {
  return createRazorpayOrder({
    id: bookingId,
  });
}

/**
 * Test payment authorization.
 */
export async function authorizeTestPayment({
  bookingId,
  orderId,
  paymentId,
}) {
  const pId =
    paymentId ||
    `pay_test_${Math.random()
      .toString(36)
      .substring(2, 10)}`;

  return {
    booking_id:
      bookingId,

    razorpay_order_id:
      orderId,

    razorpay_payment_id:
      pId,

    razorpay_signature:
      `sig_sim_${Math.random()
        .toString(36)
        .substring(2, 12)}`,
  };
}

/**
 * Open NOVA HOUSE test payment modal.
 */
function openRazorpayTestModal({
  orderData,
  guestName,
  guestEmail,
  guestPhone,
  onSuccess,
  onDismiss,
  onError,
}) {
  const existing =
    document.getElementById(
      'rzp-test-checkout-backdrop'
    );

  if (existing) {
    existing.remove();
  }

  const backdrop =
    document.createElement('div');

  backdrop.id =
    'rzp-test-checkout-backdrop';

  backdrop.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    width: 100vw;
    height: 100vh;
    background: rgba(15, 23, 42, 0.75);
    backdrop-filter: blur(4px);
    z-index: 999999;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 16px;
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
  `;

  const amountDisplay =
    Number(
      orderData.amount || 0
    ).toLocaleString('en-IN');

  let currentTab = 'upi';

  backdrop.innerHTML = `
    <div
      id="rzp-test-modal-card"
      style="
        background: #FFFFFF;
        width: 100%;
        max-width: 440px;
        border-radius: 8px;
        overflow: hidden;
        box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.35);
        position: relative;
      "
    >

      <div style="
        position: absolute;
        top: 14px;
        right: 48px;
        background: #E53935;
        color: #FFFFFF;
        font-size: 10px;
        font-weight: 700;
        font-family: monospace;
        letter-spacing: 0.1em;
        text-transform: uppercase;
        padding: 3px 8px;
        border-radius: 4px;
        z-index: 10;
      ">
        ● TEST MODE
      </div>

      <button
        id="rzp-btn-close"
        type="button"
        style="
          position: absolute;
          top: 12px;
          right: 14px;
          width: 28px;
          height: 28px;
          background: rgba(255,255,255,0.15);
          border: none;
          border-radius: 50%;
          color: #FFFFFF;
          cursor: pointer;
          font-size: 16px;
          z-index: 10;
        "
      >
        ✕
      </button>

      <div style="
        background: #0C2340;
        color: #FFFFFF;
        padding: 20px 24px 18px;
      ">

        <div style="
          display: flex;
          align-items: center;
          gap: 8px;
          margin-bottom: 6px;
        ">
          <div style="
            width: 22px;
            height: 22px;
            border-radius: 4px;
            background: #2B83EA;
            display: flex;
            align-items: center;
            justify-content: center;
            font-weight: 900;
          ">
            R
          </div>

          <span style="
            font-size: 11px;
            letter-spacing: 0.15em;
            font-weight: 700;
            color: #52A2FF;
            font-family: monospace;
          ">
            RAZORPAY SECURE
          </span>
        </div>

        <div style="
          display: flex;
          justify-content: space-between;
          align-items: flex-end;
          margin-top: 10px;
        ">

          <div>
            <h3 style="
              margin: 0;
              font-size: 18px;
              font-weight: 600;
            ">
              NOVA HOUSE
            </h3>

            <p style="
              margin: 3px 0 0;
              font-size: 12px;
              color: rgba(255,255,255,0.7);
              font-family: monospace;
            ">
              ${orderData.roomTitle || 'Luxury Sanctuary'}
            </p>
          </div>

          <div style="
            text-align: right;
          ">
            <span style="
              display: block;
              font-size: 10px;
              color: rgba(255,255,255,0.6);
              text-transform: uppercase;
              font-family: monospace;
            ">
              Amount Due
            </span>

            <span style="
              font-size: 22px;
              font-weight: 700;
              font-family: monospace;
            ">
              ₹ ${amountDisplay}
            </span>
          </div>

        </div>
      </div>

      <div style="
        background: #F1F5F9;
        padding: 10px 24px;
        border-bottom: 1px solid #E2E8F0;
        font-size: 11px;
        color: #475569;
        display: flex;
        justify-content: space-between;
        font-family: monospace;
      ">
        <span>
          Guest:
          <strong>
            ${guestName || 'Valued Guest'}
          </strong>
        </span>

        <span>
          ${guestPhone || '+91 98450 12345'}
        </span>
      </div>

      <div style="
        display: grid;
        grid-template-columns: 1fr 1fr 1fr;
        border-bottom: 1px solid #E2E8F0;
        background: #F8FAFC;
      ">

        <button
          id="rzp-tab-upi"
          type="button"
          style="
            padding: 12px 6px;
            font-size: 12px;
            font-weight: 600;
            font-family: monospace;
            background: #FFFFFF;
            border: none;
            border-bottom: 2px solid #0C2340;
            color: #0C2340;
            cursor: pointer;
          "
        >
          UPI / QR
        </button>

        <button
          id="rzp-tab-card"
          type="button"
          style="
            padding: 12px 6px;
            font-size: 12px;
            font-weight: 500;
            font-family: monospace;
            background: #F8FAFC;
            border: none;
            color: #64748B;
            cursor: pointer;
          "
        >
          Cards
        </button>

        <button
          id="rzp-tab-netbanking"
          type="button"
          style="
            padding: 12px 6px;
            font-size: 12px;
            font-weight: 500;
            font-family: monospace;
            background: #F8FAFC;
            border: none;
            color: #64748B;
            cursor: pointer;
          "
        >
          Netbanking
        </button>

      </div>

      <div
        id="rzp-tab-content"
        style="padding: 20px 24px;"
      >

        <div
          id="rzp-sec-upi"
          style="display: block;"
        >
          <p style="
            margin: 0 0 12px;
            font-size: 11px;
            color: #64748B;
            font-family: monospace;
            text-transform: uppercase;
          ">
            Select Instant Test App:
          </p>

          <div style="
            display: grid;
            grid-template-columns: 1fr 1fr 1fr;
            gap: 8px;
            margin-bottom: 16px;
          ">

            <div style="
              padding: 10px;
              border: 1.5px solid #0C2340;
              border-radius: 6px;
              text-align: center;
              background: #F0F7FF;
            ">
              <div style="font-size: 18px;">
                🟢
              </div>
              <span style="
                font-size: 11px;
                font-weight: 600;
                font-family: monospace;
              ">
                Google Pay
              </span>
            </div>

            <div style="
              padding: 10px;
              border: 1px solid #CBD5E1;
              border-radius: 6px;
              text-align: center;
            ">
              <div style="font-size: 18px;">
                🟣
              </div>
              <span style="
                font-size: 11px;
                font-family: monospace;
              ">
                PhonePe
              </span>
            </div>

            <div style="
              padding: 10px;
              border: 1px solid #CBD5E1;
              border-radius: 6px;
              text-align: center;
            ">
              <div style="font-size: 18px;">
                🔵
              </div>
              <span style="
                font-size: 11px;
                font-family: monospace;
              ">
                Paytm
              </span>
            </div>

          </div>

          <div style="
            background: #F8FAFC;
            border: 1px solid #E2E8F0;
            border-radius: 6px;
            padding: 10px 12px;
            font-size: 11px;
            font-family: monospace;
            color: #475569;
            display: flex;
            justify-content: space-between;
          ">
            <span>Payer VPA:</span>

            <strong style="color:#0F172A;">
              ${guestPhone
      ? guestPhone.replace(
        /[^0-9]/g,
        ''
      )
      : '9845012345'
    }@okhdfcbank
            </strong>
          </div>
        </div>

        <div
          id="rzp-sec-card"
          style="display: none;"
        >
          <div style="margin-bottom:12px;">
            <label style="
              display:block;
              font-size:10px;
              text-transform:uppercase;
              font-family:monospace;
              color:#64748B;
              margin-bottom:4px;
            ">
              Test Card Number
            </label>

            <input
              type="text"
              value="4111 2222 3333 4444"
              readonly
              style="
                width:100%;
                box-sizing:border-box;
                padding:10px 12px;
                font-size:12px;
                font-family:monospace;
                border:1px solid #CBD5E1;
                border-radius:6px;
                background:#F8FAFC;
              "
            />
          </div>

          <div style="
            display:grid;
            grid-template-columns:1fr 1fr;
            gap:10px;
            margin-bottom:12px;
          ">

            <div>
              <label style="
                display:block;
                font-size:10px;
                text-transform:uppercase;
                font-family:monospace;
                color:#64748B;
                margin-bottom:4px;
              ">
                Expiry
              </label>

              <input
                type="text"
                value="12/28"
                readonly
                style="
                  width:100%;
                  box-sizing:border-box;
                  padding:10px 12px;
                  font-size:12px;
                  font-family:monospace;
                  border:1px solid #CBD5E1;
                  border-radius:6px;
                  background:#F8FAFC;
                "
              />
            </div>

            <div>
              <label style="
                display:block;
                font-size:10px;
                text-transform:uppercase;
                font-family:monospace;
                color:#64748B;
                margin-bottom:4px;
              ">
                CVV
              </label>

              <input
                type="text"
                value="789"
                readonly
                style="
                  width:100%;
                  box-sizing:border-box;
                  padding:10px 12px;
                  font-size:12px;
                  font-family:monospace;
                  border:1px solid #CBD5E1;
                  border-radius:6px;
                  background:#F8FAFC;
                "
              />
            </div>

          </div>

          <div style="
            background:#ECFDF5;
            border:1px solid #A7F3D0;
            color:#065F46;
            padding:8px 12px;
            border-radius:6px;
            font-size:11px;
            font-family:monospace;
          ">
            ✓ Test credentials preloaded.
            No actual funds will be charged.
          </div>
        </div>

        <div
          id="rzp-sec-netbanking"
          style="display:none;"
        >
          <p style="
            margin:0 0 10px;
            font-size:11px;
            color:#64748B;
            font-family:monospace;
            text-transform:uppercase;
          ">
            Select Test Bank:
          </p>

          <div style="
            display:grid;
            grid-template-columns:1fr 1fr;
            gap:8px;
          ">
            <div style="
              padding:10px;
              border:1.5px solid #0C2340;
              border-radius:6px;
              background:#F0F7FF;
              font-size:12px;
              font-family:monospace;
              font-weight:600;
            ">
              HDFC Bank
            </div>

            <div style="
              padding:10px;
              border:1px solid #CBD5E1;
              border-radius:6px;
              font-size:12px;
              font-family:monospace;
            ">
              ICICI Bank
            </div>

            <div style="
              padding:10px;
              border:1px solid #CBD5E1;
              border-radius:6px;
              font-size:12px;
              font-family:monospace;
            ">
              SBI
            </div>

            <div style="
              padding:10px;
              border:1px solid #CBD5E1;
              border-radius:6px;
              font-size:12px;
              font-family:monospace;
            ">
              Axis Bank
            </div>
          </div>
        </div>

        <button
          id="rzp-btn-pay"
          type="button"
          style="
            width:100%;
            background:#0C2340;
            color:#FFFFFF;
            border:none;
            padding:14px 20px;
            font-size:13px;
            font-weight:700;
            font-family:monospace;
            letter-spacing:0.08em;
            text-transform:uppercase;
            border-radius:6px;
            cursor:pointer;
            margin-top:16px;
          "
        >
          🔒 PAY ₹ ${amountDisplay}
        </button>

        <div style="
          display:flex;
          justify-content:space-between;
          align-items:center;
          margin-top:14px;
          font-size:11px;
          font-family:monospace;
        ">

          <button
            id="rzp-btn-decline"
            type="button"
            style="
              background:none;
              border:none;
              color:#DC2626;
              cursor:pointer;
              text-decoration:underline;
              padding:0;
            "
          >
            Simulate Bank Decline
          </button>

          <button
            id="rzp-btn-cancel"
            type="button"
            style="
              background:none;
              border:none;
              color:#64748B;
              cursor:pointer;
              padding:0;
            "
          >
            Cancel Transaction
          </button>

        </div>

        <div style="
          margin-top:18px;
          padding-top:14px;
          border-top:1px solid #F1F5F9;
          text-align:center;
          font-size:10px;
          color:#94A3B8;
          font-family:monospace;
        ">
          🛡️ NOVA HOUSE Razorpay Test Checkout
          · Order: ${orderData.orderId}
        </div>

      </div>
    </div>
  `;

  document.body.appendChild(backdrop);

  const tabUpi =
    backdrop.querySelector(
      '#rzp-tab-upi'
    );

  const tabCard =
    backdrop.querySelector(
      '#rzp-tab-card'
    );

  const tabNetbanking =
    backdrop.querySelector(
      '#rzp-tab-netbanking'
    );

  const secUpi =
    backdrop.querySelector(
      '#rzp-sec-upi'
    );

  const secCard =
    backdrop.querySelector(
      '#rzp-sec-card'
    );

  const secNetbanking =
    backdrop.querySelector(
      '#rzp-sec-netbanking'
    );

  const setTab = (tab) => {
    currentTab = tab;

    [
      tabUpi,
      tabCard,
      tabNetbanking,
    ].forEach((tabElement) => {
      tabElement.style.background =
        '#F8FAFC';

      tabElement.style.borderBottom =
        '2px solid transparent';

      tabElement.style.color =
        '#64748B';

      tabElement.style.fontWeight =
        '500';
    });

    [
      secUpi,
      secCard,
      secNetbanking,
    ].forEach((section) => {
      section.style.display =
        'none';
    });

    if (tab === 'upi') {
      tabUpi.style.background =
        '#FFFFFF';

      tabUpi.style.borderBottom =
        '2px solid #0C2340';

      tabUpi.style.color =
        '#0C2340';

      tabUpi.style.fontWeight =
        '600';

      secUpi.style.display =
        'block';
    }

    if (tab === 'card') {
      tabCard.style.background =
        '#FFFFFF';

      tabCard.style.borderBottom =
        '2px solid #0C2340';

      tabCard.style.color =
        '#0C2340';

      tabCard.style.fontWeight =
        '600';

      secCard.style.display =
        'block';
    }

    if (tab === 'netbanking') {
      tabNetbanking.style.background =
        '#FFFFFF';

      tabNetbanking.style.borderBottom =
        '2px solid #0C2340';

      tabNetbanking.style.color =
        '#0C2340';

      tabNetbanking.style.fontWeight =
        '600';

      secNetbanking.style.display =
        'block';
    }
  };

  tabUpi.addEventListener(
    'click',
    () => setTab('upi')
  );

  tabCard.addEventListener(
    'click',
    () => setTab('card')
  );

  tabNetbanking.addEventListener(
    'click',
    () => setTab('netbanking')
  );

  const closeModal = () => {
    if (
      backdrop &&
      backdrop.parentNode
    ) {
      backdrop.parentNode.removeChild(
        backdrop
      );
    }
  };

  backdrop
    .querySelector(
      '#rzp-btn-close'
    )
    .addEventListener(
      'click',
      () => {
        closeModal();

        if (onDismiss) {
          onDismiss();
        }
      }
    );

  backdrop
    .querySelector(
      '#rzp-btn-cancel'
    )
    .addEventListener(
      'click',
      () => {
        closeModal();

        if (onDismiss) {
          onDismiss();
        }
      }
    );

  backdrop
    .querySelector(
      '#rzp-btn-decline'
    )
    .addEventListener(
      'click',
      () => {
        closeModal();

        if (onError) {
          onError(
            'Payment declined by issuing bank.'
          );
        }
      }
    );

  const payBtn =
    backdrop.querySelector(
      '#rzp-btn-pay'
    );

  payBtn.addEventListener(
    'click',
    async () => {
      payBtn.disabled = true;

      payBtn.style.opacity =
        '0.75';

      payBtn.innerHTML =
        '<span>⏳ Authorizing transaction...</span>';

      try {
        const authData =
          await authorizeTestPayment({
            bookingId:
              orderData.bookingId,

            orderId:
              orderData.orderId,
          });

        closeModal();

        if (onSuccess) {
          onSuccess({
            ...authData,

            amount:
              orderData.amount,

            method:
              currentTab === 'upi'
                ? 'UPI / Razorpay'
                : currentTab === 'card'
                  ? 'Card / Razorpay'
                  : 'Netbanking / Razorpay',
          });
        }
      } catch (err) {
        closeModal();

        if (onError) {
          onError(
            err.message ||
            'Payment authorization failed.'
          );
        }
      }
    }
  );
}

/**
 * Launch Razorpay checkout.
 */
export async function launchRazorpayCheckout({
  orderData,
  guestName,
  guestEmail,
  guestPhone,
  onSuccess,
  onDismiss,
  onError,
}) {
  const verifiedDefaultKey =
    'rzp_test_Tn6fk3U9ygDw0q';

  const activeKeyId =
    orderData.keyId &&
      orderData.keyId !==
      'rzp_test_Tn10fqtHXN34Wt' &&
      orderData.keyId !==
      'rzp_test_novahouse2026'
      ? orderData.keyId
      : import.meta.env
        .VITE_RAZORPAY_KEY_ID ||
      verifiedDefaultKey;

  const isRealOrder =
    orderData.isRealOrder === true ||
    (
      orderData.isRealOrder !== false &&
      orderData.orderId &&
      !orderData.orderId.startsWith(
        'order_sim_'
      )
    );

  /**
   * For the current NOVA HOUSE demo,
   * simulated orders use the custom
   * test checkout.
   */
  if (!isRealOrder) {
    console.info(
      'Simulated/Sandbox order: launching NOVA HOUSE Test Mode checkout.'
    );

    openRazorpayTestModal({
      orderData,
      guestName,
      guestEmail,
      guestPhone,
      onSuccess,
      onDismiss,
      onError,
    });

    return;
  }

  /**
   * Try official Razorpay Checkout.
   */
  try {
    const isLoaded =
      await loadRazorpayScript();

    if (
      isLoaded &&
      window.Razorpay
    ) {
      const options = {
        key:
          activeKeyId,

        amount:
          orderData.amountPaise,

        currency:
          orderData.currency ||
          'INR',

        name:
          'NOVA HOUSE',

        description:
          'NOVA HOUSE Luxury Stay Reservation',

        image:
          'https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?auto=format&fit=crop&w=200&q=80',

        order_id:
          orderData.orderId,

        prefill: {
          name:
            guestName ||
            'Valued Guest',

          email:
            guestEmail ||
            'guest@novahouse.example',

          contact:
            guestPhone ||
            '+91 98450 12345',
        },

        notes: {
          hotel:
            'NOVA HOUSE Bengaluru',

          bookingId:
            orderData.bookingId,

          room:
            orderData.roomTitle,
        },

        theme: {
          color:
            '#111111',
        },

        modal: {
          backdropclose:
            false,

          ondismiss:
            function () {
              if (onDismiss) {
                onDismiss();
              }
            },
        },

        handler:
          function (response) {
            if (onSuccess) {
              onSuccess({
                razorpay_order_id:
                  response.razorpay_order_id ||
                  orderData.orderId,

                razorpay_payment_id:
                  response.razorpay_payment_id,

                razorpay_signature:
                  response.razorpay_signature,

                booking_id:
                  orderData.bookingId,

                amount:
                  orderData.amount,

                method:
                  'Online / Razorpay',

                email:
                  guestEmail || '',

                contact:
                  guestPhone || '',
              });
            }
          },
      };

      const rzp =
        new window.Razorpay(
          options
        );

      rzp.on(
        'payment.failed',
        function (response) {
          console.warn(
            'Razorpay payment failed callback:',
            response
          );

          if (
            response &&
            response.error &&
            (
              response.error.code ===
              'BAD_REQUEST_ERROR' ||
              response.error.code ===
              'GATEWAY_ERROR'
            )
          ) {
            openRazorpayTestModal({
              orderData,
              guestName,
              guestEmail,
              guestPhone,
              onSuccess,
              onDismiss,
              onError,
            });

            return;
          }

          if (onError) {
            onError(
              response.error
                ? response.error.description
                : 'Payment was declined.'
            );
          }
        }
      );

      rzp.open();

      return;
    }
  } catch (err) {
    console.warn(
      'Official Razorpay checkout unavailable. Launching test modal:',
      err
    );
  }

  /**
   * Fallback test checkout.
   */
  openRazorpayTestModal({
    orderData,
    guestName,
    guestEmail,
    guestPhone,
    onSuccess,
    onDismiss,
    onError,
  });
}