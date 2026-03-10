from django.db import migrations


def comments_null_to_empty(apps, schema_editor):
    """
    Convert all NULL comments to empty string before the NOT NULL
    constraint is applied in 0012.

    Uses get_model() so the migration is not coupled to the current
    model class — safe to run even if Project is later modified.
    """
    Project = apps.get_model("api", "Project")
    updated = Project.objects.filter(comments__isnull=True).update(comments="")
    if updated:
        print(f"  Converted {updated} NULL comment(s) to empty string.")


def comments_empty_to_null(apps, schema_editor):
    """
    Reverse: restore empty strings to NULL so 0011 schema is valid again.
    Only reverts rows that were originally NULL (i.e. empty string after
    forward migration). Rows that were intentionally "" before this
    migration are indistinguishable — accepted trade-off for reversal.
    """
    Project = apps.get_model("api", "Project")
    Project.objects.filter(comments="").update(comments=None)


class Migration(migrations.Migration):
    """
    Data migration: convert NULL comments to empty string.
    Must run before 0012 which drops the NULL constraint.
    """

    dependencies = [
        ("api", "0011_rename_project_projectmanager_to_manager"),  # replace with your actual 0011 migration name
    ]

    operations = [
        migrations.RunPython(
            comments_null_to_empty,
            reverse_code=comments_empty_to_null,
        ),
    ]
