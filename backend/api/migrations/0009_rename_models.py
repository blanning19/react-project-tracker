from django.db import migrations


class Migration(migrations.Migration):
    """
    Renames ProjectManager → Manager and Employees → Employee at the Django
    ORM level only.

    Both renamed models have db_table set in their Meta class to point at
    the original table names (api_projectmanager and api_employees), so
    this migration does NOT alter any database tables, columns, or indexes.
    No data is moved. Rollback is safe.

    Why RenameModel instead of just adding db_table:
    - Django tracks model names in the migrations state and in the
      django_content_type table (used by admin, permissions, etc.)
    - RenameModel updates both the migration state and django_content_type
      rows so the admin and permission system stay consistent
    - Without RenameModel, Django would think Manager and ProjectManager
      are two different models and generate spurious migrations
    """

    dependencies = [
        # Replace this with your actual latest migration number.
        # Run: python manage.py showmigrations api
        # and use the last applied migration as the dependency.
        ("api", "0008_project_security_level"),
    ]

    operations = [
        migrations.RenameModel(
            old_name="ProjectManager",
            new_name="Manager",
        ),
        migrations.RenameModel(
            old_name="Employees",
            new_name="Employee",
        ),
    ]
