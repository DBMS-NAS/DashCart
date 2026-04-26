from unittest import TestCase
from unittest.mock import Mock

from django.contrib.auth import get_user_model
from rest_framework.test import APITestCase

from inventory.models import Inventory
from orders.models import Order, OrderItem
from products.models import Brand, Product
from orders.mysql_sql import DEFAULT_SQL_FILES, apply_sql_files, load_sql_statements
from stores.models import Store, Warehouse
from users.models import User


class MysqlSqlLoaderTests(TestCase):
    def test_sql_assets_parse_into_statements(self):
        for filename in DEFAULT_SQL_FILES:
            with self.subTest(filename=filename):
                statements = load_sql_statements(filename)
                self.assertGreater(len(statements), 0)
                self.assertTrue(
                    all("DELIMITER" not in statement.upper() for statement in statements)
                )

    def test_apply_sql_files_executes_each_statement(self):
        cursor = Mock()

        executed = apply_sql_files(cursor, ["mysql_objects.sql"])

        self.assertEqual(cursor.execute.call_count, len(executed))
        self.assertGreater(len(executed), 0)


class StoreScopedOrderTests(APITestCase):
    def setUp(self):
        self.auth_user = get_user_model().objects.create_user(
            username="staffscope",
            password="password123",
            is_staff=True,
        )
        self.client.force_authenticate(user=self.auth_user)

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
        self.auth_user.account_profile.store = self.store_a
        self.auth_user.account_profile.save()

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
        self.product_a = Product.objects.create(
            product_id="PROD-A",
            name="Product A",
            price="10.00",
            brand=self.brand,
        )
        self.product_b = Product.objects.create(
            product_id="PROD-B",
            name="Product B",
            price="12.00",
            brand=self.brand,
        )
        Inventory.objects.create(
            product=self.product_a,
            warehouse=self.warehouse_a,
            quantity=5,
        )
        Inventory.objects.create(
            product=self.product_b,
            warehouse=self.warehouse_b,
            quantity=5,
        )
        customer = User.objects.create(
            user_id="AUTH-999",
            name="Customer",
            email="customer@example.com",
            role="customer",
        )
        self.order_a = Order.objects.create(order_id="ORD-A", user=customer, status="pending")
        self.order_b = Order.objects.create(order_id="ORD-B", user=customer, status="pending")
        self.item_a = OrderItem.objects.create(
            order=self.order_a,
            product=self.product_a,
            quantity=2,
            price="10.00",
        )
        self.item_b = OrderItem.objects.create(
            order=self.order_b,
            product=self.product_b,
            quantity=1,
            price="12.00",
        )

    def test_store_staff_only_sees_orders_for_allocated_store(self):
        response = self.client.get("/api/orders/")

        self.assertEqual(response.status_code, 200)
        self.assertEqual([order["order_id"] for order in response.data], ["ORD-A"])
