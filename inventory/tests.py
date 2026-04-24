from django.contrib.auth import get_user_model
from rest_framework import status
from rest_framework.test import APITestCase

from inventory.models import Inventory, StockMovement
from products.models import Brand, Product
from stores.models import Store, Warehouse


class StockTransferAPITests(APITestCase):
    def setUp(self):
        self.user = get_user_model().objects.create_user(
            username="staffuser",
            password="password123",
            is_staff=True,
        )
        self.client.force_authenticate(user=self.user)

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
            name="Product 1",
            price="10.00",
            brand=self.brand,
        )
        Inventory.objects.create(
            product=self.product,
            warehouse=self.warehouse_a,
            quantity=10,
        )

    def test_transfer_moves_stock_between_warehouses(self):
        response = self.client.post(
            "/api/inventory/transfers/",
            {
                "product": self.product.product_id,
                "source_warehouse": self.warehouse_a.warehouse_id,
                "destination_warehouse": self.warehouse_b.warehouse_id,
                "quantity": 4,
            },
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(
            Inventory.objects.get(product=self.product, warehouse=self.warehouse_a).quantity,
            6,
        )
        self.assertEqual(
            Inventory.objects.get(product=self.product, warehouse=self.warehouse_b).quantity,
            4,
        )
        self.assertEqual(StockMovement.objects.count(), 2)
        self.assertEqual(
            StockMovement.objects.filter(
                product=self.product,
                warehouse=self.warehouse_a,
                movement_type=StockMovement.MOVEMENT_OUT,
                quantity=4,
            ).count(),
            1,
        )
        self.assertEqual(
            StockMovement.objects.filter(
                product=self.product,
                warehouse=self.warehouse_b,
                movement_type=StockMovement.MOVEMENT_IN,
                quantity=4,
            ).count(),
            1,
        )

    def test_transfer_rejects_when_source_stock_is_too_low(self):
        response = self.client.post(
            "/api/inventory/transfers/",
            {
                "product": self.product.product_id,
                "source_warehouse": self.warehouse_a.warehouse_id,
                "destination_warehouse": self.warehouse_b.warehouse_id,
                "quantity": 99,
            },
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(
            Inventory.objects.get(product=self.product, warehouse=self.warehouse_a).quantity,
            10,
        )
        self.assertFalse(
            Inventory.objects.filter(product=self.product, warehouse=self.warehouse_b).exists()
        )
        self.assertEqual(StockMovement.objects.count(), 0)
