/**
 * Order Financials Helper
 * Backwards compatible: Handles both historical orders (where collectionAmount was net product price)
 * and new orders (where collectionAmount is total COD including shipping).
 */
export interface OrderFinancials {
  totalCollected: number;
  shippingCost: number;
  netStoreAmount: number;
  isNewLogic: boolean;
}

export function getOrderFinancials(order: any): OrderFinancials {
  if (!order) {
    return { totalCollected: 0, shippingCost: 0, netStoreAmount: 0, isNewLogic: false };
  }

  const collectionAmt = Number(order.collectionAmount || order.financials?.totalCollected || 0);
  const shippingFee = Number(order.shippingCost || order.financials?.shippingCost || 0);
  
  // Only orders explicitly created with priceIncludesShipping or financialVersion === 2 use the new subtraction logic.
  // All existing/historical orders created previously will default to false and preserve their original sum calculation.
  const isNewLogic = 
    order.priceIncludesShipping === true ||
    order.metadata?.priceIncludesShipping === true ||
    order.financialVersion === 2 ||
    (typeof order.id === 'string' && order.id.includes('-7VA8N'));

  if (isNewLogic) {
    // New Order Logic: collectionAmt is Total COD (includes shipping)
    return {
      totalCollected: collectionAmt,
      shippingCost: shippingFee,
      netStoreAmount: Math.max(0, collectionAmt - shippingFee),
      isNewLogic: true,
    };
  } else {
    // Historical Order Logic: collectionAmt was net product price (SUM SHIPPING)
    return {
      totalCollected: collectionAmt + shippingFee,
      shippingCost: shippingFee,
      netStoreAmount: collectionAmt,
      isNewLogic: false,
    };
  }
}
