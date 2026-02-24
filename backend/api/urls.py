from django.urls import path
from rest_framework.routers import DefaultRouter
from .views import ProjectViewset, ProjectManagerViewset, EmployeesViewset, me

router = DefaultRouter()
router.register("project", ProjectViewset, basename="project")
router.register("projectmanager", ProjectManagerViewset, basename="projectmanager")
router.register("employees", EmployeesViewset, basename="employees")

urlpatterns = [
    path("me/", me, name="me"),
]

urlpatterns += router.urls