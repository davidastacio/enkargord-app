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

  const collectionAmt = Number(
    order.collectionAmount
      ?? order.collection_amount
      ?? order.financials?.totalCollected
      ?? order.financials?.orderCollectionAmount
      ?? 0,
  );
  const shippingFee = Number(
    order.shippingCost
      ?? order.shipping_cost
      ?? order.financials?.shippingCost
      ?? 0,
  );

  return {
    totalCollected: collectionAmt,
    shippingCost: shippingFee,
    netStoreAmount: Math.max(0, collectionAmt - shippingFee),
    isNewLogic: true,
  };
}
