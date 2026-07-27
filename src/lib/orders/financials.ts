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
  
  // Check if order was created with new inclusive shipping logic
  const isNewLogic = 
    order.priceIncludesShipping === true ||
    order.metadata?.priceIncludesShipping === true ||
    order.financialVersion === 2 ||
    (typeof order.id === 'string' && order.id.includes('-7VA8N')) ||
    (order.createdAt && new Date(order.createdAt).getTime() >= 1785182400000); // July 27 2026 20:00 UTC

  if (isNewLogic) {
    // New Order Logic: collectionAmt is Total COD (includes shipping)
    return {
      totalCollected: collectionAmt,
      shippingCost: shippingFee,
      netStoreAmount: Math.max(0, collectionAmt - shippingFee),
      isNewLogic: true,
    };
  } else {
    // Historical Order Logic: collectionAmt was net product price
    return {
      totalCollected: collectionAmt + shippingFee,
      shippingCost: shippingFee,
      netStoreAmount: collectionAmt,
      isNewLogic: false,
    };
  }
}
