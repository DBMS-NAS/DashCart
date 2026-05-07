# DashCart

DashCart is a Django + React ecommerce / inventory management project built for a DBMS demonstration. It supports both customer and staff flows, uses MySQL for the database demo, and includes database-level objects such as triggers, procedures, and functions.

## Stack

- Backend: Django, Django REST Framework, JWT auth
- Frontend: React, React Router, Axios
- Database: MySQL or SQLite

## Main Features

### Customer

- Browse products with sorting and filtering
- View product details and related products
- Add products to cart and place orders
- Wishlist / favorites
- Review products with star ratings
- Order history and order success page

### Staff

- Dashboard, product management, and customer order management
- Inventory management across stores and warehouses
- Stock movement and warehouse transfers
- Supplier and supplier request management
- Discount assignment with active date ranges

### Database Demo

- MySQL trigger, procedure, and function scripts in `sql/`
- Existing-table SQL demo file: `sql/mysql_existing_table_objects.sql`
- Helper management command to apply SQL objects: `python manage.py apply_mysql_sql`

## Local Setup

### 1. Backend

From the project root:

```bash
cd /Users/anushri/Projects/DBMS-NAS/DashCart
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
pip install -r requirements-mysql.txt
```

### 2. Choose Database

The project supports both MySQL and SQLite.

#### Option A: MySQL

Set the database environment variables before running Django:

```bash
export DB_ENGINE=mysql
export DB_NAME=dashcart
export DB_USER=root
export DB_PASSWORD='your_mysql_password'
export DB_HOST=127.0.0.1
export DB_PORT=3306
```

Then run:

```bash
python manage.py migrate
python manage.py seed_demo_catalog
python manage.py apply_mysql_sql
python manage.py runserver
```

What these commands do:

- `migrate`: creates/updates the schema
- `seed_demo_catalog`: creates demo products, inventory, and related catalog data
- `apply_mysql_sql`: applies the SQL objects from:
  - `sql/mysql_objects.sql`
  - `sql/mysql_existing_table_objects.sql`

#### Option B: SQLite

If you want to run locally without MySQL:

```bash
export DB_ENGINE=sqlite
python manage.py migrate
python manage.py seed_demo_catalog
python manage.py runserver
```

## Frontend Setup

In a second terminal:

```bash
cd /Users/anushri/Projects/DBMS-NAS/DashCart/frontend
npm install
npm start
```

The React app will run on the usual local dev port and talk to the Django backend through the configured API base URL.

## Important Migrations

After pulling new changes, always run:

```bash
python manage.py migrate
```

Recent changes added migrations for:

- wishlist / product favorites
- product `created_at`
- discount assignment `start_date` and `end_date`

If pages like Products or Discounts fail after a pull, the first thing to check is whether migrations were applied to the same database your app is using.

## MySQL Demo Objects

To verify the demo objects in MySQL:

```sql
SHOW TRIGGERS;
SHOW FUNCTION STATUS WHERE Db = 'dashcart';
SHOW PROCEDURE STATUS WHERE Db = 'dashcart';
```

Useful demo queries:

```sql
CALL sp_low_stock_products(10);
SELECT fn_total_stock('YOUR_PRODUCT_ID');
```

## Passwords And Chrome “Data Breach” Warning

DashCart already stores user passwords as hashes through Django’s authentication system. Passwords are not stored in plain text.

The app also uses Django password validation in registration:

- minimum length
- common password check
- numeric-only password check
- similarity check against user attributes

If Chrome still shows a “change your password” or “data breach” warning, that is usually because:

1. the password you used is weak, common, or previously exposed somewhere else
2. Chrome has that password saved and flags it from its own breach database

How to fix it:

1. Create or use a stronger, unique password for the DashCart account.
2. Log in with the new password.
3. Update or remove the old saved password in Chrome Password Manager.

So this warning is usually not a DashCart hashing issue. It is mostly a password quality / browser-saved-password issue.

## Quick Troubleshooting

### Discounts page says “Could not load discounts”

Run:

```bash
python manage.py migrate
```

This usually means the discount date-range migration was not applied.

### Products page or other customer pages fail after pulling

Run:

```bash
python manage.py migrate
python manage.py seed_demo_catalog
```

### MySQL login fails

Use the same credentials that work with:

```bash
mysql --protocol=TCP -h 127.0.0.1 -P 3306 -u root -p
```

## Team Notes

For demo preparation:

- one person can manage MySQL setup and SQL objects
- one person can manage Django/backend and migrations
- one person can manage frontend and UI testing

If all three are working together, make sure everyone uses the same database configuration and reruns `python manage.py migrate` after pulling new changes.
