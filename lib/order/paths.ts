/**
 * The Personalized Books order journey — one screen per step:
 *
 *   /begin/personalized-book        intent: new order vs. existing payment
 *   /begin/personalized-book/price  book type: 1 farzand / bir nechta farzand
 *   /begin/personalized-book/form   the order form (child count pre-seeded)
 *   /pay                            payment code for an EXISTING saved order
 */
export const ENTRY_PATH = "/begin/personalized-book";
export const PRICE_PATH = "/begin/personalized-book/price";
export const FORM_PATH = "/begin/personalized-book/form";
export const PAY_PATH = "/pay";
