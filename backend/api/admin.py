from django.contrib import admin
from .models import Employee, Manager, Project


@admin.register(Project)
class ProjectAdmin(admin.ModelAdmin):
    list_display = ("name", "status", "security_level", "projectmanager", "start_date", "end_date", "modified")
    list_filter = ("status", "security_level")
    search_fields = ("name", "comments")
    ordering = ("-modified",)
    filter_horizontal = ("employees",)


@admin.register(Manager)
class ManagerAdmin(admin.ModelAdmin):
    list_display = ("name", "created", "modified")
    search_fields = ("name",)
    ordering = ("name",)


@admin.register(Employee)
class EmployeeAdmin(admin.ModelAdmin):
    list_display = ("last_name", "first_name", "email", "created")
    search_fields = ("first_name", "last_name", "email")
    ordering = ("last_name", "first_name")
