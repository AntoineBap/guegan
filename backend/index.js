require('dotenv').config();
const express = require('express');
const Stripe = require('stripe');
const cors = require('cors');

const app = express();
// Remplacez par votre CLÉ PRIVÉE Stripe (commence par sk_test_...)
const stripe = Stripe(process.env.STRIPE_SECRET_KEY);

app.use(cors());
app.use(express.json());

// --- CONFIGURATION DES PRIX (A ajuster selon vos coûts réels) ---
const PRICING = {
  base: 200, // Prix fixe de base (main d'oeuvre, emballage)
  materialPerCm2: 0.15, // Prix du Corian au cm² (Longueur x Largeur)
  depthMultiplier: 2, // Coût par cm de profondeur
  options: {
    splashback: 80, // Forfait pour la goutte d'eau
    sideRims: 60,   // Forfait pour les rebords
    tapHole: 0      // Gratuit ou payant
  }
};

// Fonction pour calculer le prix total
const calculatePrice = (config) => {
  let price = PRICING.base;

  // Coût surface (L x l)
  price += (config.length * config.width) * PRICING.materialPerCm2;

  // Coût profondeur (supplémentaire)
  price += config.depth * PRICING.depthMultiplier;

  // Options
  if (config.splashback) price += PRICING.options.splashback;
  if (config.sideRims) price += PRICING.options.sideRims;

  // On arrondit à l'entier supérieur
  return Math.ceil(price);
};

// --- ROUTE DE PAIEMENT ---
app.post('/create-checkout-session', async (req, res) => {
  try {
    const { config } = req.body;

    // 1. Sécurité : On recalcule le prix ici, on ne fait pas confiance au frontend
    const amount = calculatePrice(config);

    // 2. Création de la description technique pour le récapitulatif Stripe
    const description = `
      Dim: ${config.length}x${config.width}x${config.depth}cm | 
      Pos: ${config.position} | 
      Couleur: ${config.color} | 
      Perçage: ${config.tapHole}
    `.replace(/\s+/g, ' ').trim();

    // 3. Création de la session Stripe
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'eur',
            product_data: {
              name: 'Vasque Corian Sur Mesure',
              description: description,
              // On peut ajouter une image générique ici
              // images: ['https://votre-site.com/images/corian-render.jpg'],
              metadata: {
                // Ces infos seront visibles dans votre dashboard Stripe
                // C'est votre "Bande de commande" pour l'atelier
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
            unit_amount: amount * 100, // Stripe attend des centimes (ex: 50000 pour 500€)
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      // Redirection après paiement
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