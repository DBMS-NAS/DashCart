from django.contrib.auth import get_user_model
from rest_framework import status
from rest_framework.test import APITestCase

from inventory.models import Inventory
from orders.models import OrderItemAllocation
from products.models import Brand, Product
from stores.models import Store, Warehouse


class CartWarehouseSelectionTests(APITestCase):
    def setUp(self):
        self.customer = get_user_model().objects.create_user(
            username="cartcustomer",
            password="password123",
        )
        self.client.force_authenticate(user=self.customer)

        self.store_a = Store.objects.create(
            store_id="STORE-A",
            name="Store A",
            location="Location A",
        )
        self.store_b = Store.objects.create(
            store_id="STORE-B",
            name="Store B",
            location="Location B",
        )
        self.warehouse_a = Warehouse.objects.create(
            warehouse_id="WH-A",
            store=self.store_a,
            location="Warehouse A",
        )
        self.warehouse_b = Warehouse.objects.create(
            warehouse_id="WH-B",
            store=self.store_b,
            location="Warehouse B",
        )
        self.brand = Brand.objects.create(brand_id="BR-1", name="Brand 1")
        self.product = Product.objects.create(
            product_id="PROD-1",
            name="Mango Juice",
            price="5.00",
            brand=self.brand,
        )
        Inventory.objects.create(product=self.product, warehouse=self.warehouse_a, quantity=10)
        Inventory.objects.create(product=self.product, warehouse=self.warehouse_b, quantity=6)

    def test_add_to_cart_requires_warehouse_and_checkout_uses_selected_store(self):
        add_response = self.client.post(
            "/api/cart/add/",
            {
                "product_id": self.product.product_id,
                "warehouse_id": self.warehouse_b.warehouse_id,
                "quantity": 3,
            },
            format="json",
        )

        self.assertEqual(add_response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(add_response.data["items"][0]["store_name"], "Store B")

        checkout_response = self.client.post("/api/cart/checkout/", {}, format="json")

        self.assertEqual(checkout_response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(
            Inventory.objects.get(product=self.product, warehouse=self.warehouse_a).quantity,
            10,
        )
        self.assertEqual(
            Inventory.objects.get(product=self.product, warehouse=self.warehouse_b).quantity,
            3,
        )
        self.assertEqual(
            OrderItemAllocation.objects.filter(
                warehouse=self.warehouse_b,
                quantity=3,
            ).count(),
            1,
        )
