in progress...

# DashCart

DashCart is a Django + React database assignment project.

## Local setup

### Backend

1. Create and activate a Python 3.11 virtual environment.
2. Install dependencies:

```bash
pip install -r requirements.txt
```

3. Run database migrations:

```bash
python3 manage.py migrate
```

4. Start the backend:

```bash
python3 manage.py runserver
```

By default, the backend uses SQLite for local development.

### Frontend

```bash
cd frontend
npm install
npm start
```

## Optional MySQL setup

If you specifically need MySQL on one machine, install the extra driver:

```bash
pip install -r requirements-mysql.txt
```

Then export these environment variables before starting Django:

```bash
export DB_ENGINE=mysql
export DB_NAME=dashcart
export DB_USER=root
export DB_PASSWORD=your_password
export DB_HOST=localhost
export DB_PORT=3306
```

After running migrations on MySQL, load the project SQL objects from the
top-level `sql/` folder:

```bash
python3 manage.py apply_mysql_sql
```

That command applies the trigger, function, and procedure definitions stored in:

- `sql/mysql_objects.sql`
- `sql/mysql_existing_table_objects.sql`
