
export type PricingType = {
type: string
price: number
description: string
popular?: boolean
features: string[]
}


export const pricingData: PricingType[] = [
  {
    type: "Free Plan",
    price: 0,
    description: 'Tailored for individual professionals and hobbyists.',
    features: [
      "Single user license",
      "Access to some components",
      "Lifetime access",
      "Single project",
      "No support",
      "No updates"
    ],
  },
  {
    type: "Solo Plan",
    price: 229,
    description: 'Tailored for individual professionals and hobbyists.',
    features: [
      "Single user license",
      "Access to all components",
      "Lifetime access",
      "Unlimited projects",
      "Customer support",
      "Free updates"
    ],
  },
  {
    type: "Startup Plan",
    price: 399,
    description: 'Best suited for experienced developers and small teams.',
    popular: true, 
    features: [
      "5 user license",
      "Access to all components",
      "Lifetime access",
      "Unlimited projects",
      "Priority tech support",
      "Customer support",
      "Free updates"
    ],
  },
  {
    type: "Organization Plan",
    price: 799,
    description: 'Ideal for large teams and organization',
    features: [
      "25 user license",
      "Access to all components",
      "Lifetime access",
      "Unlimited projects",
      "Customer support",
      "Free updates"
    ],
  }
]