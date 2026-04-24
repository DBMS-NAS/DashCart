from pathlib import Path


SQL_DIR = Path(__file__).resolve().parent.parent / "sql"
DEFAULT_SQL_FILES = (
    "mysql_objects.sql",
    "mysql_existing_table_objects.sql",
)


def get_sql_file_path(filename):
    return SQL_DIR / filename


def parse_sql_script(script_text):
    delimiter = ";"
    buffer = []
    statements = []

    for raw_line in script_text.splitlines():
        stripped = raw_line.strip()

        if not stripped or stripped.startswith("--"):
            continue

        if stripped.upper().startswith("DELIMITER "):
            delimiter = stripped.split(None, 1)[1]
            continue

        buffer.append(raw_line)

        if stripped.endswith(delimiter):
            statement = "\n".join(buffer).rstrip()
            statement = statement[: -len(delimiter)].rstrip()

            if statement:
                statements.append(statement)

            buffer = []

    if buffer:
        statement = "\n".join(buffer).strip()
        if statement:
            statements.append(statement)

    return statements


def load_sql_statements(filename):
    return parse_sql_script(get_sql_file_path(filename).read_text())


def apply_sql_files(cursor, filenames=None):
    filenames = filenames or DEFAULT_SQL_FILES
    executed = []

    for filename in filenames:
        for statement in load_sql_statements(filename):
            cursor.execute(statement)
            executed.append((filename, statement))

    return executed
