from django.db import migrations, models


class Migration(migrations.Migration):
    """
    Schema migration: remove NULL from Project.comments.

    comments was CharField(null=True, blank=True) which allowed two
    distinct representations of "no comment" — NULL and "". This migration
    removes that ambiguity by:

      1. (0013) Data migration: convert all existing NULL rows to ""
      2. (this)  Schema change: drop null=True, add default=""

    Run 0013 BEFORE this migration so no NULL values remain when the
    NOT NULL constraint is applied. Django's migration framework enforces
    ordering via the dependencies list below.
    """

    dependencies = [
        ("api", "0011_rename_project_projectmanager_to_manager"),  # replace with your actual 0011 migration name
        ("api", "0013_project_comments_null_to_empty"),
    ]

    operations = [
        migrations.AlterField(
            model_name="project",
            name="comments",
            field=models.CharField(blank=True, default="", max_length=500),
        ),
    ]
