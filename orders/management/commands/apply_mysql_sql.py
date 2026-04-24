from django.core.management.base import BaseCommand, CommandError
from django.db import connections

from orders.mysql_sql import DEFAULT_SQL_FILES, apply_sql_files


class Command(BaseCommand):
    help = "Apply MySQL SQL objects from the project's sql/ directory."

    def add_arguments(self, parser):
        parser.add_argument(
            "--database",
            default="default",
            help="Database connection name to use.",
        )

    def handle(self, *args, **options):
        database = options["database"]
        connection = connections[database]

        if connection.vendor != "mysql":
            raise CommandError(
                f"The '{database}' database uses '{connection.vendor}', not MySQL."
            )

        with connection.cursor() as cursor:
            executed = apply_sql_files(cursor, DEFAULT_SQL_FILES)

        self.stdout.write(
            self.style.SUCCESS(
                f"Applied {len(executed)} SQL statements from {len(DEFAULT_SQL_FILES)} files."
            )
        )
