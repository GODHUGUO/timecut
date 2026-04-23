export const PLAN_ORDER = ['free', 'starter', 'pro'] as const

export const PLAN_CATALOG = {
  free: {
    key: 'free',
    name: 'Gratuit',
    price: '0€',
    monthlyPriceLabel: '0€ / mois',
    minutes: 60, // TEST MODE
    description: 'Pour découvrir TimeCut',
    features: [
      { label: '60 min / mois', included: true },
      { label: "Export dans la qualité d'origine", included: true },
      { label: 'Sous-titres IA', included: true }, // TEST MODE
      { label: 'Traduction des sous-titres', included: true }, // TEST MODE
    ],
  },
  starter: {
    key: 'starter',
    name: 'Starter',
    price: '3,99€',
    monthlyPriceLabel: '3,99€ / mois',
    minutes: 60,
    description: 'Pour les créateurs réguliers',
    features: [
      { label: '60 min / mois', included: true },
      { label: 'Sous-titres IA inclus', included: true },
      { label: 'Traduction des sous-titres', included: true },
      { label: "Export dans la qualité d'origine", included: true },
      { label: 'Recharge si quota épuisé', included: true },
    ],
  },
  pro: {
    key: 'pro',
    name: 'Pro',
    price: '11,99€',
    monthlyPriceLabel: '11,99€ / mois',
    minutes: 200,
    description: 'Pour les pros du contenu',
    features: [
      { label: '200 min / mois', included: true },
      { label: 'Sous-titres IA inclus', included: true },
      { label: 'Traduction des sous-titres', included: true },
      { label: "Export dans la qualité d'origine", included: true },
      { label: 'Recharge si quota épuisé', included: true },
    ],
  },
} as const
