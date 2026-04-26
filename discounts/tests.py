from decimal import Decimal

from django.test import TestCase

from products.models import Brand, Product
from .models import Discount, ProductDiscount
from .utils import get_best_discount, get_effective_price


class DiscountUtilsTests(TestCase):
    def setUp(self):
        self.brand = Brand.objects.create(
            brand_id="BR-TEST-001",
            name="Test Brand",
        )
        self.product = Product.objects.create(
            product_id="PROD-TEST-001",
            name="Test Product",
            price=Decimal("100.00"),
            brand=self.brand,
        )

    def test_returns_base_price_when_product_has_no_discount(self):
        self.assertEqual(get_effective_price(self.product), Decimal("100.00"))
        self.assertIsNone(get_best_discount(self.product))

    def test_uses_highest_assigned_discount(self):
        low_discount = Discount.objects.create(
            discount_id="DISC-TEST-001",
            name="Ten Off",
            discount_percent=Decimal("10.00"),
        )
        high_discount = Discount.objects.create(
            discount_id="DISC-TEST-002",
            name="Twenty Five Off",
            discount_percent=Decimal("25.00"),
        )
        ProductDiscount.objects.create(product=self.product, discount=low_discount)
        ProductDiscount.objects.create(product=self.product, discount=high_discount)

        self.assertEqual(get_best_discount(self.product), high_discount)
        self.assertEqual(get_effective_price(self.product), Decimal("75.00"))
