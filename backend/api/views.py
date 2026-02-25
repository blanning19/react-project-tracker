from rest_framework import permissions, viewsets
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from .models import Employees, Project, ProjectManager
from .serializers import EmployeesSerializer, ProjectManagerSerializer, ProjectSerializer


class ProjectManagerViewset(viewsets.ReadOnlyModelViewSet):
    permission_classes = [permissions.IsAuthenticated]
    queryset = ProjectManager.objects.all().order_by("name")
    serializer_class = ProjectManagerSerializer


class EmployeesViewset(viewsets.ReadOnlyModelViewSet):
    permission_classes = [permissions.IsAuthenticated]
    queryset = Employees.objects.all().order_by("last_name", "first_name")
    serializer_class = EmployeesSerializer


class ProjectViewset(viewsets.ModelViewSet):
    permission_classes = [permissions.IsAuthenticated]
    queryset = Project.objects.all().order_by("-modified")
    serializer_class = ProjectSerializer


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def me(request):
    return Response({"id": request.user.id, "username": request.user.username, "email": request.user.email})
