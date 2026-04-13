from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from users.services import get_or_create_database_user, is_staff_account
from .models import Review
from .serializers import ReviewSerializer


class ReviewListCreateAPI(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        reviews = Review.objects.select_related("product", "customer")

        if not is_staff_account(request.user):
            customer = get_or_create_database_user(request.user)
            reviews = reviews.filter(customer=customer)

        return Response(ReviewSerializer(reviews, many=True).data)

    def post(self, request):
        if is_staff_account(request.user):
            return Response(
                {"detail": "Staff can view reviews but cannot submit them."},
                status=status.HTTP_403_FORBIDDEN,
            )

        serializer = ReviewSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        review = serializer.save(
            review_id=Review.generate_review_id(),
            customer=get_or_create_database_user(request.user),
        )
        return Response(ReviewSerializer(review).data, status=status.HTTP_201_CREATED)
