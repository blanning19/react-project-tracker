from django.db import migrations


class Migration(migrations.Migration):

    dependencies = [
        ("api", "0010_alter_project_employees_alter_project_projectmanager_and_more"),
    ]

    operations = [
        migrations.RenameField(
            model_name="project",
            old_name="projectmanager",
            new_name="manager",
        ),
    ]