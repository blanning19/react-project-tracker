from rest_framework import viewsets, permissions
from rest_framework.response import Response
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated

from .models import Project, ProjectManager, Employees
from .serializers import ProjectSerializer, ProjectManagerSerializer, EmployeesSerializer


class ProjectManagerViewset(viewsets.ViewSet):
    permission_classes = [permissions.IsAuthenticated]
    queryset = ProjectManager.objects.all()
    serializer_class = ProjectManagerSerializer

    def list(self, request):
        queryset = ProjectManager.objects.all()
        serializer = self.serializer_class(queryset, many=True)
        return Response(serializer.data)


class EmployeesViewset(viewsets.ViewSet):
    permission_classes = [permissions.IsAuthenticated]
    queryset = Employees.objects.all()
    serializer_class = EmployeesSerializer

    def list(self, request):
        queryset = Employees.objects.all()
        serializer = self.serializer_class(queryset, many=True)
        return Response(serializer.data)


class ProjectViewset(viewsets.ModelViewSet):
    permission_classes = [permissions.IsAuthenticated]
    queryset = Project.objects.all()
    serializer_class = ProjectSerializer

    def create(self, request, *args, **kwargs):
        print("POST DATA:", request.data)

        serializer = self.get_serializer(data=request.data)
        if not serializer.is_valid():
            print("VALIDATION ERRORS:", serializer.errors)
            return Response(serializer.errors, status=400)

        self.perform_create(serializer)
        return Response(serializer.data, status=201)


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def me(request):
    return Response(
        {"id": request.user.id, "username": request.user.username, "email": request.user.email}
    )