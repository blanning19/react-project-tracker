from django_filters.rest_framework import DjangoFilterBackend
from rest_framework import filters, permissions, viewsets
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from .models import Employee, Manager, Project
from .pagination import NoPagination, ProjectPagination
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
    pagination_class = NoPagination
    # Explicitly opt out of global filter backends — these are simple lookup
    # endpoints that return all records and do not support filtering or search.
    filter_backends = []


class EmployeeViewset(viewsets.ReadOnlyModelViewSet):
    permission_classes = [permissions.IsAuthenticated]
    queryset = (
        Employee.objects
        .all()
        .order_by("last_name", "first_name")
    )
    serializer_class = EmployeeSerializer
    pagination_class = NoPagination
    # Explicitly opt out of global filter backends — same reasoning as
    # ManagerViewset above.
    filter_backends = []


class ProjectViewset(viewsets.ModelViewSet):
    """
    Full CRUD viewset for projects.

    List behavior:
    - Pagination:  DRF PageNumberPagination via settings (PAGE_SIZE=50).
                   Use ?page=N and ?page_size=N query params.
    - Filtering:   ?status=Active  ?security_level=Confidential
    - Search:      ?search=keyword  (searches name and comments)
    - Ordering:    ?ordering=name  ?ordering=-start_date
                   Allowed fields: name, status, start_date, end_date,
                   security_level, modified

    Serializers:
    - GET  (list, retrieve): ProjectReadSerializer — nested objects for
      manager and employees so the frontend gets names directly.
    - POST/PUT/PATCH/DELETE: ProjectWriteSerializer — accepts IDs from
      the frontend dropdowns.
    """
    permission_classes = [permissions.IsAuthenticated]
    pagination_class = ProjectPagination
    queryset = (
        Project.objects
        .select_related("manager")
        .prefetch_related("employees")
        .order_by("-modified")
    )

    filter_backends = [
        DjangoFilterBackend,
        filters.SearchFilter,
        filters.OrderingFilter,
    ]
    filterset_fields = ["status", "security_level"]
    search_fields = ["name", "comments"]
    ordering_fields = ["name", "status", "start_date", "end_date", "security_level", "modified"]
    ordering = ["-modified"]

    def get_serializer_class(self):
        """
        Returns the appropriate serializer based on the HTTP action.

        Read actions (list, retrieve) → ProjectReadSerializer
        Write actions (create, update, partial_update, destroy) → ProjectWriteSerializer
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