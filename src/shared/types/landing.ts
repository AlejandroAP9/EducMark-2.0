export interface NavItem {
  label: string;
  href: string;
}

export interface PlanFeature {
  text: string;
  included: boolean;
}

export interface Plan {
  id: string;
  name: string;
  icon: string;
  price: string;
  features: PlanFeature[];
  url: string;
  recommended?: boolean;
  imagesCount: number;
}

export interface Testimonial {
  name: string;
  role: string;
  location: string;
  text: string;
  initials: string;
  color: string;
}

export interface FaqItem {
  question: string;
  answer: string;
}

export interface Step {
  number: number;
  title: string;
  description: string;
}
