export function flattenProductToStoreListings(product) {
  const stores = product.available_stores || [];

  return stores.map((store) => {
    const hasDiscount =
      Boolean(product.discount_name) &&
      store.discounted_price &&
      String(store.discounted_price) !== String(store.price);

    return {
      ...product,
      listing_id: `${product.product_id}:${store.warehouse_id}`,
      warehouse_id: store.warehouse_id,
      store_id: store.store_id,
      store_name: store.store_name,
      store_location: store.store_location,
      warehouse_location: store.warehouse_location,
      stock: store.quantity,
      price: store.price,
      discounted_price: hasDiscount ? store.discounted_price : null,
      available_stores: [store],
      detailPath: `/products/${product.product_id}?warehouse=${store.warehouse_id}`,
    };
  });
}


export function flattenProductsToStoreListings(products) {
  return products.flatMap(flattenProductToStoreListings);
}

export function getStoreScopedProduct(product, warehouseId) {
  const stores = product.available_stores || [];
  const selectedStore =
    stores.find((store) => store.warehouse_id === warehouseId) || stores[0] || null;

  if (!selectedStore) {
    return {
      ...product,
      listing_id: product.product_id,
      detailPath: `/products/${product.product_id}`,
    };
  }

  const hasDiscount =
    Boolean(product.discount_name) &&
    selectedStore.discounted_price &&
    String(selectedStore.discounted_price) !== String(selectedStore.price);

  return {
    ...product,
    listing_id: `${product.product_id}:${selectedStore.warehouse_id}`,
    warehouse_id: selectedStore.warehouse_id,
    store_id: selectedStore.store_id,
    store_name: selectedStore.store_name,
    store_location: selectedStore.store_location,
    warehouse_location: selectedStore.warehouse_location,
    stock: selectedStore.quantity,
    price: selectedStore.price,
    discounted_price: hasDiscount ? selectedStore.discounted_price : null,
    available_stores: stores,
    detailPath: `/products/${product.product_id}?warehouse=${selectedStore.warehouse_id}`,
  };
}
