require('dotenv').config(); // ✅ Always first
const express = require('express');
const mongoose = require('mongoose');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY); // ✅ Correct
const app = express();
const PORT = 7000;

app.use(express.json());

// ✅ Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true
}).then(() => {
    console.log("✅ MongoDB connected");
}).catch((err) => {
    console.error("❌ MongoDB connection error:", err);
});

console.log('Stripe Key:', process.env.STRIPE_SECRET_KEY); // Confirm it loads

// ✅ POST route to create checkout session
exports.createCheckoutSession = async (req, res) => {
    const { products, email } = req.body;
  
    const line_items = products.map((item) => ({
      price_data: {
        currency: "inr",
        product_data: {
          name: item.name,
        },
        unit_amount: item.price * 100, // Stripe amount is in paise
      },
      quantity: item.quantity,
    }));
  
    try {
      const session = await stripe.checkout.sessions.create({
        payment_method_types: ["card"],
        line_items,
        mode: "payment",
        customer_email: email,
        success_url: "http://localhost:3000/success",
        cancel_url: "http://localhost:3000/cancel",
      });
  
      res.status(200).json({ id: session.id });
    } catch (error) {
      console.error("Stripe session error:", error);
      res.status(500).json({ message: "Unable to create checkout session" });
    }
  };