from rest_framework import serializers
from .models import Employee, Manager, Project


class ManagerSerializer(serializers.ModelSerializer):
    class Meta:
        model = Manager
        fields = ("id", "name")


class EmployeeSerializer(serializers.ModelSerializer):
    class Meta:
        model = Employee
        fields = ("id", "first_name", "last_name", "email")


# ---------------------------------------------------------------------------
# Split read / write serializers for Project
# ---------------------------------------------------------------------------
#
# Why split:
# - Read (GET): the frontend needs human-readable names for display in the
#   Home table and Edit form pre-population. Returning raw IDs forces the
#   frontend to do a second lookup or maintain its own ID→name map.
# - Write (POST/PUT/PATCH): the frontend submits IDs from select dropdowns,
#   so PrimaryKeyRelatedField is still the correct write representation.
#
# The viewset uses get_serializer_class() to select the right one per action.
# ---------------------------------------------------------------------------

class ProjectReadSerializer(serializers.ModelSerializer):
    """
    Used for GET (list + detail).
    Returns nested objects for manager and employees so the frontend
    gets names directly without additional lookups.
    """
    employees = EmployeeSerializer(many=True, read_only=True)

    # REMARK: Renamed serializer field from `projectmanager` to `manager`.
    manager = ManagerSerializer(read_only=True)

    class Meta:
        model = Project
        fields = (
            "id",
            "name",
            "manager",
            "start_date",
            "employees",
            "end_date",
            "comments",
            "status",
            "security_level",
        )


class ProjectWriteSerializer(serializers.ModelSerializer):
    """
    Used for POST, PUT, PATCH.
    Accepts IDs for manager and employees, matching what the frontend
    dropdowns submit.
    """
    employees = serializers.PrimaryKeyRelatedField(
        many=True,
        queryset=Employee.objects.all(),
    )

    # REMARK: Renamed write field from `projectmanager` to `manager`.
    manager = serializers.PrimaryKeyRelatedField(
        queryset=Manager.objects.all(),
        required=False,
        allow_null=True,
    )

    # Declared explicitly so that omitting `comments` from the payload never
    # produces NULL at the DB level — the field default ensures an empty string
    # is used when the key is absent entirely.
    comments = serializers.CharField(required=False, default="", allow_blank=True)

    class Meta:
        model = Project
        fields = (
            "id",
            "name",
            "manager",
            "start_date",
            "employees",
            "end_date",
            "comments",
            "status",
            "security_level",
        )

    def validate_name(self, value):
        """
        Normalize the project name so the API does not accept whitespace-only
        values or store accidental leading/trailing spaces.
        """
        normalized = value.strip()

        if not normalized:
            raise serializers.ValidationError("Project name cannot be blank.")

        return normalized

    def validate_comments(self, value):
        """
        Normalize comments so whitespace-only input does not get stored as
        meaningful text. Returns empty string instead of None now that the
        field no longer allows NULL at the database level.
        """
        if value is None:
            return ""

        return value.strip()

    def validate(self, attrs):
        """
        Enforce cross-field business rules for both create and update flows,
        including PATCH requests where some values may come from the instance.
        """
        start_date = attrs.get("start_date", getattr(self.instance, "start_date", None))
        end_date = attrs.get("end_date", getattr(self.instance, "end_date", None))

        if start_date and end_date and end_date < start_date:
            raise serializers.ValidationError({
                "end_date": "End date cannot be before start date."
            })

        return attrs

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