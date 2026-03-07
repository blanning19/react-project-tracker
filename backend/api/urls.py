from django.urls import path
from rest_framework.routers import DefaultRouter
from .views import EmployeeViewset, ManagerViewset, ProjectViewset, me

router = DefaultRouter()
router.register("projects", ProjectViewset, basename="project")
router.register("managers", ManagerViewset, basename="manager")
router.register("employees", EmployeeViewset, basename="employee")

urlpatterns = [
    path("me/", me, name="me"),
]

urlpatterns += router.urls
