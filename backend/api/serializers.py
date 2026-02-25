from rest_framework import serializers

from .models import Employees, Project, ProjectManager


class ProjectSerializer(serializers.ModelSerializer):
    employees = serializers.PrimaryKeyRelatedField(many=True, queryset=Employees.objects.all())
    projectmanager = serializers.PrimaryKeyRelatedField(
        queryset=ProjectManager.objects.all(),
        required=False,
        allow_null=True,
    )

    class Meta:
        model = Project
        fields = ("id", "name", "projectmanager", "start_date", "employees", "end_date", "comments", "status")

    def create(self, validated_data):
        employees = validated_data.pop("employees", [])
        project = super().create(validated_data)
        project.employees.set(employees)
        return project

    def update(self, instance, validated_data):
        employees = validated_data.pop("employees", None)
        instance = super().update(instance, validated_data)
        if employees is not None:
            instance.employees.set(employees)
        return instance


class ProjectManagerSerializer(serializers.ModelSerializer):
    class Meta:
        model = ProjectManager
        fields = ("name", "id")


class EmployeesSerializer(serializers.ModelSerializer):
    class Meta:
        model = Employees
        fields = ("first_name", "last_name", "email", "id")
