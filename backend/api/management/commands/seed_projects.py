"""
Management command to seed the database with 50 sample projects.

Usage:
    python manage.py seed_projects

Options:
    --count N     Number of projects to create (default: 50)
    --clear       Delete all existing projects first

Requires at least one Manager and one Employee to already exist.
If none exist, the command creates placeholder records automatically.
"""

import random
from datetime import date, timedelta

from django.core.management.base import BaseCommand, CommandError

from api.models import Employee, Manager, Project


PROJECT_NAMES = [
    "Cloud Migration Initiative", "Customer Portal Redesign", "Data Warehouse Upgrade",
    "Mobile App Launch", "ERP System Integration", "Security Audit 2025",
    "API Gateway Rollout", "HR Self-Service Platform", "Compliance Dashboard",
    "DevOps Pipeline Modernisation", "Legacy System Decommission", "SSO Implementation",
    "Real-Time Analytics Platform", "Supply Chain Optimisation", "Partner Integration Hub",
    "Internal Wiki Migration", "Disaster Recovery Overhaul", "Payment Gateway Upgrade",
    "Onboarding Automation", "Network Infrastructure Refresh", "AI Document Processing",
    "Customer Success Tooling", "Multi-Region Deployment", "Zero-Trust Security Rollout",
    "Performance Monitoring Stack", "Data Privacy Compliance", "Product Catalogue Service",
    "Reporting Engine Rebuild", "Identity Provider Migration", "Secrets Management Overhaul",
    "Microservices Decomposition", "Load Balancer Upgrade", "Database Sharding Project",
    "Frontend Design System", "Search Infrastructure", "Message Queue Migration",
    "Container Orchestration", "Cost Optimisation Initiative", "SLA Dashboard",
    "Vendor Management Portal", "Internal Hackathon Platform", "Documentation Overhaul",
    "Automated Testing Framework", "Feature Flag Service", "Audit Log Pipeline",
    "Rate Limiting Service", "Notification Service Rebuild", "Billing System Migration",
    "Observability Platform", "Release Automation Tooling",
]

COMMENTS = [
    "Stakeholder review scheduled for next quarter.",
    "Pending approval from the infrastructure team.",
    "Cross-functional team — coordinate with DevOps and Security.",
    "Budget confirmed. Kickoff meeting booked.",
    "Dependencies on the SSO project must be resolved first.",
    "Third-party vendor assessment in progress.",
    "Phase 1 complete. Phase 2 scoping underway.",
    "Blocked pending legal sign-off on data handling.",
    "High priority — executive sponsor assigned.",
    None,  # some projects have no comments
    None,
    None,
]

STATUSES = ["Active", "On Hold", "Completed", "Cancelled"]
STATUS_WEIGHTS = [0.45, 0.25, 0.20, 0.10]  # realistic distribution

SECURITY_LEVELS = ["Public", "Internal", "Confidential", "Restricted"]
SECURITY_WEIGHTS = [0.10, 0.50, 0.30, 0.10]


def random_date(start: date, end: date) -> date:
    delta = (end - start).days
    return start + timedelta(days=random.randint(0, max(delta, 0)))


class Command(BaseCommand):
    help = "Seed the database with sample projects for development and testing."

    def add_arguments(self, parser):
        parser.add_argument(
            "--count",
            type=int,
            default=50,
            help="Number of projects to create (default: 50)",
        )
        parser.add_argument(
            "--clear",
            action="store_true",
            help="Delete all existing projects before seeding (managers and employees are kept)",
        )
        parser.add_argument(
            "--clear-all",
            action="store_true",
            help="Delete all existing projects, managers, and employees before seeding",
        )
    def handle(self, *args, **options):
        count = options["count"]

        if options["clear_all"]:
            p, _ = Project.objects.all().delete()
            m, _ = Manager.objects.all().delete()
            e, _ = Employee.objects.all().delete()
            self.stdout.write(self.style.WARNING(
                f"Deleted {p} projects, {m} managers, {e} employees."
            ))
        elif options["clear"]:
            deleted, _ = Project.objects.all().delete()
            self.stdout.write(self.style.WARNING(f"Deleted {deleted} existing projects."))

        # Ensure we have at least one manager and one employee to assign
        managers = list(Manager.objects.all())
        if not managers:
            self.stdout.write("No managers found — creating seed managers.")
            seed_managers = [
                "Alice Johnson", "Bob Martinez", "Carol Stevens",
                "David Okafor", "Elena Rossi", "Frank Nguyen",
            ]
            managers = [Manager.objects.create(name=name) for name in seed_managers]
            self.stdout.write(f"  Created {len(managers)} managers.")

        employees = list(Employee.objects.all())
        if not employees:
            self.stdout.write("No employees found — creating seed employees.")
            seed_employees = [
                ("Dan",     "Hughes",   "dan.hughes@example.com"),
                ("Eva",     "Clark",    "eva.clark@example.com"),
                ("Frank",   "Nguyen",   "frank.nguyen@example.com"),
                ("Grace",   "Lee",      "grace.lee@example.com"),
                ("Henry",   "Patel",    "henry.patel@example.com"),
                ("Isabel",  "Torres",   "isabel.torres@example.com"),
                ("James",   "Wu",       "james.wu@example.com"),
                ("Karen",   "Osei",     "karen.osei@example.com"),
                ("Liam",    "Brennan",  "liam.brennan@example.com"),
                ("Maya",    "Singh",    "maya.singh@example.com"),
                ("Nathan",  "Brooks",   "nathan.brooks@example.com"),
                ("Olivia",  "Ferreira", "olivia.ferreira@example.com"),
                ("Paul",    "Yamamoto", "paul.yamamoto@example.com"),
                ("Quinn",   "Adeyemi",  "quinn.adeyemi@example.com"),
                ("Rachel",  "Kim",      "rachel.kim@example.com"),
            ]
            employees = [
                Employee.objects.create(first_name=f, last_name=l, email=e)
                for f, l, e in seed_employees
            ]
            self.stdout.write(f"  Created {len(employees)} employees.")

        # Shuffle names so repeated runs produce different orderings
        available_names = PROJECT_NAMES.copy()
        random.shuffle(available_names)

        # If count > 50, append numbered extras
        while len(available_names) < count:
            available_names.append(f"Project Initiative {len(available_names) + 1}")

        created = 0
        skipped = 0

        for i in range(count):
            name = available_names[i]

            # Skip if a project with this name already exists
            if Project.objects.filter(name=name).exists():
                skipped += 1
                continue

            status = random.choices(STATUSES, weights=STATUS_WEIGHTS)[0]
            security_level = random.choices(SECURITY_LEVELS, weights=SECURITY_WEIGHTS)[0]

            # Generate plausible start/end date pairs
            today = date.today()
            if status == "Completed":
                start = random_date(today - timedelta(days=730), today - timedelta(days=90))
                end = random_date(start + timedelta(days=30), start + timedelta(days=365))
            elif status == "Cancelled":
                start = random_date(today - timedelta(days=365), today)
                end = random_date(start + timedelta(days=30), start + timedelta(days=180))
            elif status == "Active":
                start = random_date(today - timedelta(days=180), today)
                end = random_date(today + timedelta(days=30), today + timedelta(days=365))
            else:  # On Hold
                start = random_date(today - timedelta(days=365), today)
                end = random_date(today + timedelta(days=30), today + timedelta(days=540))

            project = Project.objects.create(
                name=name,
                status=status,
                security_level=security_level,
                start_date=start,
                end_date=end,
                comments=random.choice(COMMENTS),
                projectmanager=random.choice(managers),
            )
            # Assign 1–4 random employees
            project.employees.set(random.sample(employees, k=min(random.randint(1, 4), len(employees))))

            created += 1

        self.stdout.write(
            self.style.SUCCESS(
                f"Done. Created {created} projects" +
                (f", skipped {skipped} (name already exists)." if skipped else ".")
            )
        )