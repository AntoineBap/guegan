require('dotenv').config();
const express = require('express');
const Stripe = require('stripe');
const cors = require('cors');

const app = express();
const stripe = Stripe(process.env.STRIPE_SECRET_KEY);

app.use(cors());
app.use(express.json());

// configuration des prix fictives pour l'instant
const PRICING = {
  base: 200, 
  materialPerCm2: 0.15, // prix materiau au cm2
  depthMultiplier: 2, // prix par cm de profondeur
  options: {
    splashback: 80, // prix goutte d'eau
    sideRims: 60,   // prix rebords 
  }
};


const calculatePrice = (config) => {
  let price = PRICING.base;
  price += (config.length * config.width) * PRICING.materialPerCm2;
  price += config.depth * PRICING.depthMultiplier;
  if (config.splashback) price += PRICING.options.splashback;
  if (config.sideRims) price += PRICING.options.sideRims;
  return Math.ceil(price);
};

app.post('/create-checkout-session', async (req, res) => {
  try {
    const { config } = req.body;
    const amount = calculatePrice(config);
    const description = `
      Dim: ${config.length}x${config.width}x${config.depth}cm | 
      Pos: ${config.position} | 
      Couleur: ${config.color} | 
      Perçage: ${config.tapHole}
    `.replace(/\s+/g, ' ').trim();

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'eur',
            product_data: {
              name: 'Vasque Corian Sur Mesure',
              description: description,
              metadata: {
                length: config.length,
                width: config.width,
                depth: config.depth,
                color: config.color,
                tapHole: config.tapHole,
                splashback: config.splashback ? 'OUI' : 'NON',
                splashbackHeight: config.splashbackHeight,
                sideRims: config.sideRims ? 'OUI' : 'NON',
                comments: config.comments
              }
            },
            unit_amount: amount * 100, // stripe attend un montant en centime donc x100
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: `${process.env.CLIENT_URL}/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.CLIENT_URL}/`,
    });

    res.json({ url: session.url });
  } catch (error) {
    console.error("Erreur Stripe:", error);
    res.status(500).json({ error: error.message });
  }
});

const PORT = 4242;
app.listen(PORT, () => console.log(`Serveur prêt sur le port ${PORT}`));