from rest_framework import permissions, viewsets
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from .models import Employee, Manager, Project
from .serializers import (
    EmployeeSerializer,
    ManagerSerializer,
    ProjectReadSerializer,
    ProjectWriteSerializer,
)


class ManagerViewset(viewsets.ReadOnlyModelViewSet):
    permission_classes = [permissions.IsAuthenticated]
    queryset = Manager.objects.all().order_by("name")
    serializer_class = ManagerSerializer


class EmployeeViewset(viewsets.ReadOnlyModelViewSet):
    permission_classes = [permissions.IsAuthenticated]
    queryset = Employee.objects.all().order_by("last_name", "first_name")
    serializer_class = EmployeeSerializer


class ProjectViewset(viewsets.ModelViewSet):
    permission_classes = [permissions.IsAuthenticated]
    queryset = (
        Project.objects
        .select_related("projectmanager")
        .prefetch_related("employees")
        .order_by("-modified")
    )

    def get_serializer_class(self):
        """
        Returns the appropriate serializer based on the HTTP action.

        Read actions (list, retrieve) use ProjectReadSerializer which returns
        nested objects for projectmanager and employees so the frontend gets
        human-readable names without additional API calls.

        Write actions (create, update, partial_update, destroy) use
        ProjectWriteSerializer which accepts IDs from the frontend dropdowns.
        """
        if self.action in ("list", "retrieve"):
            return ProjectReadSerializer
        return ProjectWriteSerializer


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def me(request):
    return Response({
        "id": request.user.id,
        "username": request.user.username,
        "email": request.user.email,
    })
