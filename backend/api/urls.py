from django.urls import path
from rest_framework.routers import DefaultRouter
from .views import EmployeeViewset, ManagerViewset, ProjectViewset, me

router = DefaultRouter()
router.register("projects", ProjectViewset, basename="project")
router.register("projectmanager", ManagerViewset, basename="projectmanager")
router.register("employees", EmployeeViewset, basename="employees")

urlpatterns = [
    path("me/", me, name="me"),
]

urlpatterns += router.urls
