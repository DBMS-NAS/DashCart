from django.db import models

# Create your models here.
from django.db import models

class User(models.Model):
    user_id = models.CharField(max_length=50, primary_key=True)
    name = models.CharField(max_length=100)
    email = models.EmailField(unique=True)
    role = models.CharField(max_length=50)

    def __str__(self):
        return self.name