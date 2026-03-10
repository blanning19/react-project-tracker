from django.db import models


class Manager(models.Model):
    """
    Renamed from ProjectManager to avoid collision with Django's Model Manager
    convention (e.g. MyModel.objects is a Manager instance). Having a *model*
    named ProjectManager confused Django tooling and every developer reading
    the code expecting a custom queryset manager, not a data model.

    SAFETY NOTE — "Manager" vs Django's built-in manager class:
    Django's built-in manager is never imported by name in application code.
    It is always accessed as an attribute (e.g. Project.objects, which is a
    Manager instance). Naming this model "Manager" is therefore safe — there
    is no import-level collision. If a future developer is concerned, the
    alternative names are ProjectLead or ProjectOwner, but renaming would
    require a new migration and API contract change for no practical benefit.
    """
    name = models.CharField(unique=True, max_length=100)
    created = models.DateTimeField(auto_now_add=True)
    modified = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.name


class Employee(models.Model):
    """
    Renamed from Employees to follow Django's singular model name convention.
    Django derives table names, reverse relations, and verbose names from the
    model class name — plural model names produce awkward results like
    'Employeess' in some contexts and confusing reverse relation names.
    """
    first_name = models.CharField(max_length=100)
    last_name = models.CharField(max_length=100)
    email = models.EmailField(unique=True)
    created = models.DateTimeField(auto_now_add=True)
    modified = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.first_name} {self.last_name}"


class Project(models.Model):
    class SecurityLevel(models.TextChoices):
        PUBLIC = "Public", "Public"
        INTERNAL = "Internal", "Internal"
        CONFIDENTIAL = "Confidential", "Confidential"
        RESTRICTED = "Restricted", "Restricted"

    class Status(models.TextChoices):
        """
        Enforced status choices prevent free-text values from breaking
        frontend filters and keeps the data consistent across the app.

        To add a new status: add it here and create a migration.
        Do not store raw strings in the database directly.
        """
        ACTIVE = "Active", "Active"
        ON_HOLD = "On Hold", "On Hold"
        COMPLETED = "Completed", "Completed"
        CANCELLED = "Cancelled", "Cancelled"

    security_level = models.CharField(
        max_length=20,
        choices=SecurityLevel.choices,
        default=SecurityLevel.INTERNAL,
    )
    name = models.CharField(unique=True, max_length=100)
    employees = models.ManyToManyField(
        Employee,
        blank=True,
        related_name="projects",
    )

    # REMARK: Renamed database/ORM field from `projectmanager` to `manager`
    # for a cleaner domain model and API contract.
    manager = models.ForeignKey(
        Manager,
        on_delete=models.SET_NULL,
        blank=True,
        null=True,
    )

    start_date = models.DateField()
    end_date = models.DateField()
    comments = models.CharField(max_length=500, blank=True, null=True)
    status = models.CharField(
        max_length=20,
        choices=Status.choices,
        default=Status.ACTIVE,
    )
    created = models.DateTimeField(auto_now_add=True)
    modified = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.name