import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import Stripe from "stripe";
import dotenv from "dotenv";
import axios from "axios";
import { v4 as uuidv4 } from 'uuid';
import { createClient } from '@supabase/supabase-js';

dotenv.config();

// Fallback values for Supabase (matching src/lib/supabase.ts)
const envUrl = process.env.VITE_SUPABASE_URL;
const envKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabaseUrl = (envUrl && envUrl !== 'undefined' && envUrl.startsWith('http')) 
  ? envUrl 
  : 'https://uzpjsdhmjpruxmwmcogw.supabase.co';

const supabaseServiceKey = (envKey && envKey !== 'undefined') 
  ? envKey 
  : 'placeholder_key';

// Supabase Admin for server-side operations
const supabaseAdmin = createClient(
  supabaseUrl,
  supabaseServiceKey
);

let stripeClient: Stripe | null = null;

export function getStripe(): Stripe {
  if (!stripeClient) {
    const key = process.env.STRIPE_SECRET_KEY;
    if (!key) {
      throw new Error('STRIPE_SECRET_KEY environment variable is required');
    }
    stripeClient = new Stripe(key, { apiVersion: '2026-02-25.clover' });
  }
  return stripeClient;
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // API routes FIRST
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
  });

  // CinetPay Integration
  app.post("/api/create-cinetpay-session", async (req, res) => {
    try {
      const { courseId, courseTitle, coursePrice, userId, origin, currency = 'CDF' } = req.body;

      if (!courseId || !courseTitle || !coursePrice || !userId) {
        return res.status(400).json({ error: "Missing required parameters" });
      }

      const trans_id = uuidv4();

      const payload = {
        apikey: process.env.CINETPAY_API_KEY,
        site_id: process.env.CINETPAY_SITE_ID,
        transaction_id: trans_id,
        amount: Math.round(coursePrice),
        currency: currency,
        description: `Formation: ${courseTitle}`,
        notify_url: process.env.CINETPAY_NOTIFY_URL || `${origin}/api/cinetpay-notify`,
        return_url: `${origin}/formations/${courseId}?success=true&trans_id=${trans_id}`,
        channels: 'ALL', // ALL includes Mobile Money and Cards
        metadata: JSON.stringify({
          courseId,
          userId
        }),
        customer_name: "Client",
        customer_surname: "onmoov",
        customer_email: "client@onmoov.academy",
        customer_phone_number: "0000000000",
        customer_address: "RDC",
        customer_city: "Kinshasa",
        customer_country: "CD",
        customer_state: "Kinshasa",
        customer_zip_code: "0000"
      };

      const response = await axios.post('https://api-checkout.cinetpay.com/v2/payment', payload);

      if (response.data.code === '201') {
        // Store the transaction in a pending state if needed, or just rely on metadata
        res.json({ url: response.data.data.payment_url });
      } else {
        console.error("CinetPay API Error:", response.data);
        res.status(400).json({ error: response.data.message });
      }
    } catch (error: any) {
      console.error("CinetPay error:", error.response?.data || error.message);
      res.status(500).json({ error: error.message || "Internal server error" });
    }
  });

  // CinetPay Webhook
  app.post("/api/cinetpay-notify", async (req, res) => {
    try {
      const { cpm_trans_id, cpm_site_id, cpm_trans_status } = req.body;

      if (cpm_trans_status === 'ACCEPTED') {
        // Verify transaction with CinetPay
        const verifyPayload = {
          apikey: process.env.CINETPAY_API_KEY,
          site_id: process.env.CINETPAY_SITE_ID,
          transaction_id: cpm_trans_id
        };

        const verifyResponse = await axios.post('https://api-checkout.cinetpay.com/v2/payment/check', verifyPayload);

        if (verifyResponse.data.code === '00' && verifyResponse.data.data.status === 'ACCEPTED') {
          const metadata = JSON.parse(verifyResponse.data.data.metadata);
          const { courseId, userId } = metadata;

          // Update enrollment in Supabase
          const { error } = await supabaseAdmin
            .from('course_enrollments')
            .update({ payment_status: 'paid' })
            .eq('course_id', courseId)
            .eq('user_id', userId);

          if (error) {
            console.error("Error updating enrollment:", error);
            return res.status(500).send("Error updating enrollment");
          }

          console.log(`Payment successful for user ${userId} and course ${courseId}`);
        }
      }

      res.status(200).send("OK");
    } catch (error: any) {
      console.error("CinetPay Notify Error:", error.message);
      res.status(500).send("Internal Server Error");
    }
  });

  app.post("/api/create-checkout-session", async (req, res) => {
    try {
      const stripe = getStripe();
      const { courseId, courseTitle, coursePrice, userId, origin, currency = 'eur' } = req.body;

      if (!courseId || !courseTitle || !coursePrice || !userId) {
        return res.status(400).json({ error: "Missing required parameters" });
      }

      const session = await stripe.checkout.sessions.create({
        payment_method_types: ['card'],
        line_items: [
          {
            price_data: {
              currency: currency.toLowerCase(),
              product_data: {
                name: courseTitle,
              },
              unit_amount: Math.round(coursePrice * 100), // Stripe expects cents
            },
            quantity: 1,
          },
        ],
        mode: 'payment',
        success_url: `${origin}/formations/${courseId}?success=true&session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${origin}/formations/${courseId}?canceled=true`,
        client_reference_id: userId,
        metadata: {
          courseId: courseId,
          userId: userId
        }
      });

      res.json({ url: session.url });
    } catch (error: any) {
      console.error("Stripe error:", error);
      res.status(500).json({ error: error.message || "Internal server error" });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
