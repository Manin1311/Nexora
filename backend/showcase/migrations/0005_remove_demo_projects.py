from django.db import migrations


def delete_demo_projects(apps, schema_editor):
    """Remove all seeded/demo showcase projects except StudyVerse."""
    Project = apps.get_model('showcase', 'Project')
    deleted, _ = Project.objects.exclude(title='StudyVerse').delete()
    print(f"[Migration] Removed {deleted} demo showcase projects (kept StudyVerse)")


def reverse_delete(apps, schema_editor):
    # Irreversible — we don't restore deleted projects
    pass


class Migration(migrations.Migration):

    dependencies = [
        ('showcase', '0004_alter_project_description'),
    ]

    operations = [
        migrations.RunPython(delete_demo_projects, reverse_delete),
    ]
