from decimal import Decimal

from django.core.management.base import BaseCommand
from django.db import transaction

from inventory.models import Inventory
from products.models import Brand, Category, Product, ProductCategory
from stores.models import Store, Warehouse


DEMO_PRODUCTS = [
    {
        "product_id": "PROD-DEMO-001",
        "name": "Wireless Mouse",
        "price": Decimal("79.00"),
        "stock": 24,
        "brand_id": "BR-DEMO-001",
        "brand_name": "LogiCore",
        "category_id": "CAT-DEMO-001",
        "category_name": "Accessories",
    },
    {
        "product_id": "PROD-DEMO-002",
        "name": 'Mechanical Keyboard',
        "price": Decimal("189.00"),
        "stock": 14,
        "brand_id": "BR-DEMO-002",
        "brand_name": "KeyForge",
        "category_id": "CAT-DEMO-001",
        "category_name": "Accessories",
    },
    {
        "product_id": "PROD-DEMO-003",
        "name": "27 Inch Monitor",
        "price": Decimal("649.00"),
        "stock": 8,
        "brand_id": "BR-DEMO-003",
        "brand_name": "ViewEdge",
        "category_id": "CAT-DEMO-002",
        "category_name": "Displays",
    },
    {
        "product_id": "PROD-DEMO-004",
        "name": "Laptop Stand",
        "price": Decimal("119.00"),
        "stock": 31,
        "brand_id": "BR-DEMO-004",
        "brand_name": "DeskLift",
        "category_id": "CAT-DEMO-003",
        "category_name": "Office",
    },
    {
        "product_id": "PROD-DEMO-005",
        "name": "USB-C Hub",
        "price": Decimal("149.00"),
        "stock": 18,
        "brand_id": "BR-DEMO-005",
        "brand_name": "Portify",
        "category_id": "CAT-DEMO-001",
        "category_name": "Accessories",
    },
    {
        "product_id": "PROD-DEMO-006",
        "name": "Noise Cancelling Headphones",
        "price": Decimal("499.00"),
        "stock": 10,
        "brand_id": "BR-DEMO-006",
        "brand_name": "SonicPeak",
        "category_id": "CAT-DEMO-004",
        "category_name": "Audio",
    },
]


class Command(BaseCommand):
    help = "Seed a reusable demo catalog with products and inventory."

    @transaction.atomic
    def handle(self, *args, **options):
        store, _ = Store.objects.update_or_create(
            store_id="STORE-DEMO",
            defaults={
                "name": "Demo Store",
                "location": "Main Mall",
            },
        )
        warehouse, _ = Warehouse.objects.update_or_create(
            warehouse_id="WH-STORE-DEMO",
            defaults={
                "store": store,
                "location": "Demo Store Warehouse",
            },
        )

        for item in DEMO_PRODUCTS:
            brand, _ = Brand.objects.update_or_create(
                brand_id=item["brand_id"],
                defaults={"name": item["brand_name"]},
            )
            category, _ = Category.objects.update_or_create(
                category_id=item["category_id"],
                defaults={"name": item["category_name"]},
            )
            product, _ = Product.objects.update_or_create(
                product_id=item["product_id"],
                defaults={
                    "name": item["name"],
                    "price": item["price"],
                    "brand": brand,
                },
            )
            ProductCategory.objects.update_or_create(
                product=product,
                category=category,
            )
            Inventory.objects.update_or_create(
                product=product,
                warehouse=warehouse,
                defaults={"quantity": item["stock"]},
            )

        self.stdout.write(self.style.SUCCESS("Demo catalog seeded successfully."))
        self.stdout.write(f"Store: {store.name}")
        self.stdout.write(f"Warehouse: {warehouse.location}")
        self.stdout.write(f"Products: {Product.objects.count()}")
        self.stdout.write(f"Inventory rows: {Inventory.objects.count()}")
