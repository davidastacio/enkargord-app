/**
 * Order Financials Helper
 * Standardized Order Logic:
 * collectionAmount represents the Total COD amount collected from the customer at destination.
 * netStoreAmount = collectionAmount - shippingCost (the net amount handed to the store).
 */
export interface OrderFinancials {
  totalCollected: number;
  shippingCost: number;
  netStoreAmount: number;
  isNewLogic: boolean;
}

export function getOrderFinancials(order: any): OrderFinancials {
  if (!order) {
    return { totalCollected: 0, shippingCost: 0, netStoreAmount: 0, isNewLogic: true };
  }

  const collectionAmt = Number(order.collectionAmount || order.financials?.totalCollected || 0);
  const shippingFee = Number(order.shippingCost || order.financials?.shippingCost || 0);
  
  // Legacy flag check (if any old historical order requires explicit sum)
  const isLegacy = order.legacySumLogic === true || order.financialVersion === 1;

  if (isLegacy) {
    // Old Legacy Order Logic: collectionAmt was net product price
    return {
      totalCollected: collectionAmt + shippingFee,
      shippingCost: shippingFee,
      netStoreAmount: collectionAmt,
      isNewLogic: false,
    };
  } else {
    // Standard Inclusive Shipping Logic (DEFAULT): collectionAmt is Total COD
    return {
      totalCollected: collectionAmt,
      shippingCost: shippingFee,
      netStoreAmount: Math.max(0, collectionAmt - shippingFee),
      isNewLogic: true,
    };
  }
}
