export const PLAN_ORDER = ['free', 'starter', 'pro'] as const

export const PLAN_CATALOG = {
  free: {
    key: 'free',
    name: 'Gratuit',
    price: '0€',
    monthlyPriceLabel: '0€ / mois',
    minutes: 10,
    description: 'Pour découvrir TimeCut',
    features: [
      { label: '10 min / mois', included: true },
      { label: "Export dans la qualité d'origine", included: true },
      { label: 'Sous-titres IA', included: false },
      { label: 'Traduction des sous-titres', included: false },
    ],
  },
  starter: {
    key: 'starter',
    name: 'Starter',
    price: '4,99€',
    monthlyPriceLabel: '4,99€ / mois',
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
    price: '12,99€',
    monthlyPriceLabel: '12,99€ / mois',
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
