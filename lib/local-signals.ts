import { rnd } from "./rand";
import type { Day, Demo, Store } from "./data";
import { slice, type Range } from "./select";

export const REVIEW_THEMES = ["Food quality", "Speed", "Order accuracy", "Value"] as const;
export type ReviewTheme = (typeof REVIEW_THEMES)[number];
export type DemoReview = { id: string; date: string; storeIdx: number; stars: number; theme: ReviewTheme; text: string };
export type LocalDay = {
  date: string; profileViews: number; calls: number; directions: number; websiteClicks: number;
  socialMentions: number; favorableMentions: number; reviews: DemoReview[];
};
export type LocalPeriod = {
  profileViews: number; calls: number; directions: number; websiteClicks: number;
  socialMentions: number; favorableMentions: number; reviewCount: number;
  positive: number; neutral: number; negative: number; starSum: number;
  themes: Record<ReviewTheme, number>; negativeThemes: Record<ReviewTheme, number>;
  recent: DemoReview[];
  days: { date: string; profileViews: number; socialMentions: number }[];
};

const COPY: Record<ReviewTheme, [string, string, string]> = {
  "Food quality": ["Hot pizza and a crisp crust.", "The pizza was okay, but not memorable.", "The pizza arrived cooler than expected."],
  Speed: ["Pickup was ready right on time.", "The wait was about what I expected.", "The order took longer than the estimate."],
  "Order accuracy": ["Everything in the bag was correct.", "A topping needed a quick correction.", "One item was missing from the order."],
  Value: ["The family meal felt like good value.", "The price felt about average.", "The total felt high for this order."],
};

/** Deterministic presentation data; never sourced from Google, social platforms, or real guests. */
export function localDay(row: Day, store: Store): LocalDay {
  const empty: LocalDay = { date: row.date, profileViews: 0, calls: 0, directions: 0, websiteClicks: 0, socialMentions: 0, favorableMentions: 0, reviews: [] };
  if (!row.orders) return empty;
  const s = store.idx, d = row.d;
  const profileViews = Math.round(row.orders * (1.9 + rnd(s, d, 810) * 0.75));
  const calls = Math.round(profileViews * (0.027 + rnd(s, d, 811) * 0.013));
  const directions = Math.round(profileViews * (0.035 + rnd(s, d, 812) * 0.014));
  const websiteClicks = Math.round(profileViews * (0.062 + rnd(s, d, 813) * 0.024));
  const socialMentions = Math.round(row.orders * (0.045 + rnd(s, d, 814) * 0.03));
  const favorableMentions = Math.round(socialMentions * (0.58 + rnd(s, d, 815) * 0.27));
  const count = Math.floor(row.orders / 110 + rnd(s, d, 816) * 1.4);
  const favorableCutoff = 0.64 + rnd(s, 817) * 0.19;
  const reviews = Array.from({ length: count }, (_, i): DemoReview => {
    const u = rnd(s, d, 820 + i);
    const stars = u < favorableCutoff ? (rnd(s, d, 840 + i) < 0.62 ? 5 : 4) : u < favorableCutoff + 0.13 ? 3 : rnd(s, d, 860 + i) < 0.55 ? 2 : 1;
    const theme = REVIEW_THEMES[Math.floor(rnd(s, d, 880 + i) * REVIEW_THEMES.length)];
    return { id: `${store.id}-${row.date}-${i}`, date: row.date, storeIdx: s, stars, theme, text: COPY[theme][stars >= 4 ? 0 : stars === 3 ? 1 : 2] };
  });
  return { date: row.date, profileViews, calls, directions, websiteClicks, socialMentions, favorableMentions, reviews };
}

export function localPeriod(demo: Demo, range: Range, storeIdx: number | null): LocalPeriod {
  const themes = Object.fromEntries(REVIEW_THEMES.map(t => [t, 0])) as Record<ReviewTheme, number>;
  const negativeThemes = { ...themes };
  const total: LocalPeriod = { profileViews: 0, calls: 0, directions: 0, websiteClicks: 0, socialMentions: 0, favorableMentions: 0, reviewCount: 0, positive: 0, neutral: 0, negative: 0, starSum: 0, themes, negativeThemes, recent: [], days: [] };
  const daily = new Map<string, LocalPeriod["days"][number]>();
  for (const row of slice(demo, range, storeIdx)) {
    const signal = localDay(row, demo.stores[row.s]);
    total.profileViews += signal.profileViews;
    total.calls += signal.calls;
    total.directions += signal.directions;
    total.websiteClicks += signal.websiteClicks;
    total.socialMentions += signal.socialMentions;
    total.favorableMentions += signal.favorableMentions;
    for (const review of signal.reviews) {
      total.reviewCount++;
      total.starSum += review.stars;
      total[review.stars >= 4 ? "positive" : review.stars === 3 ? "neutral" : "negative"]++;
      total.themes[review.theme]++;
      if (review.stars <= 2) total.negativeThemes[review.theme]++;
      total.recent.push(review);
    }
    const point = daily.get(row.date) ?? { date: row.date, profileViews: 0, socialMentions: 0 };
    point.profileViews += signal.profileViews;
    point.socialMentions += signal.socialMentions;
    daily.set(row.date, point);
  }
  total.days = [...daily.values()];
  total.recent = total.recent.slice(-6).reverse();
  return total;
}

export function localStanding(demo: Demo, store: Store, endIdx: number) {
  let count = 0, stars = 0;
  for (let d = Math.max(0, store.openedOffset); d <= endIdx; d++) {
    for (const review of localDay(demo.rows[d * demo.stores.length + store.idx], store).reviews) {
      count++;
      stars += review.stars;
    }
  }
  const rating = count ? stars / count : 0;
  const names = ["Marrowstone Pies", "Elm Ember Pizza", "Copperfield Crust", "Juniper Oven", "Hearthline Pizza", "Blue Lantern Pies"];
  const nearby = Array.from({ length: 4 }, (_, i) => ({
    name: names[(store.idx + i) % names.length],
    rating: 3.55 + rnd(store.idx, i, 901) * 1.13,
    reviews: Math.round(180 + rnd(store.idx, i, 902) * 730),
    distance: Math.round((0.4 + rnd(store.idx, i, 903) * 2.1) * 10) / 10,
  }));
  const sortedReviews = nearby.map(c => c.reviews).sort((a, b) => a - b);
  const medianReviews = (sortedReviews[1] + sortedReviews[2]) / 2;
  const rank = 1 + nearby.filter(c => c.rating > rating || (Math.abs(c.rating - rating) < 0.005 && c.reviews > count)).length;
  return { rating, reviewCount: count, nearby, medianReviews, rank };
}
