// Shapes for the poe2scout economy pull. Only the fields we consume are typed;
// the API returns more. See https://poe2scout.com/api/openapi.json.

/** One dated price observation as returned in an item's PriceLogs array. */
export interface PriceLog {
  Price: number;
  Time: string;
  Quantity: number;
}

/** Raw league entry from GET /{realm}/Leagues. */
export interface RawLeague {
  Value: string;
  IsCurrent: boolean;
  DivinePrice: number | null;
  BaseCurrencyText: string | null;
}

/** Raw currency/unique item from the ByCategory endpoints. */
export interface RawItem {
  ApiId: string | null;
  Text: string | null;
  Name: string | null;
  Type: string | null;
  CategoryApiId: string | null;
  CurrentPrice?: number | null;
  CurrentQuantity?: number | null;
  PriceLogs?: PriceLog[] | null;
}

/** Paginated ByCategory envelope. */
export interface ByCategoryPage {
  CurrentPage: number;
  Pages: number;
  Total: number;
  Items: RawItem[];
}

/** A normalized, price-bearing item ready for digesting or storage. */
export interface NormalizedItem {
  key: string;
  name: string;
  type: string | null;
  category: string;
  priceExalted: number | null;
  quantity: number | null;
  time: string | null;
}

/** The full snapshot the pull writes to disk. */
export interface EconomySnapshot {
  realm: string;
  league: string;
  pulledAt: string;
  divinePriceExalted: number | null;
  currencies: NormalizedItem[];
  uniques: NormalizedItem[];
}
