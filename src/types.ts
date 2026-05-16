export interface Drink {
  id: string;
  name: string;
  category: string;
  temperature: string;
  description: string;
  tags: string[];
  confidence_score?: number;
}

export interface HeroContent {
  headline: string;
  subheading: string;
  primary_cta: string;
  secondary_cta: string;
  alt_headlines?: string[];
}

export interface Offer {
  id: string;
  title: string;
  description: string;
  bonus: string | number;
  expiry: string;
}

export interface UserContext {
  loyaltyTier: string;
  topDrinks: string[];
  stars: number;
}
