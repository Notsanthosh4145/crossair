# CrossAir Backend

Django + Django REST Framework backend for the CrossAir frontend.
Comes with a ready-made SQLite database (`db.sqlite3`) and a superuser
already created for you.

## Quick start

```
python -m venv venv
venv\Scripts\activate        (Windows)
source venv/bin/activate     (Mac/Linux)

pip install -r requirements.txt
python manage.py runserver
```

The database already exists, so you do **not** need to run `migrate` again
unless you delete `db.sqlite3`.

- Admin login: `http://127.0.0.1:8000/admin/` — username `admin`, password `admin123`
- API base: `http://127.0.0.1:8000/api/`

## Sending real confirmation emails (optional)

By default, registration emails are just printed to your terminal instead
of actually being sent — that's fine for testing. To have CrossAir send a
real email on registration, you need a Gmail **App Password** (not your
normal Gmail password — Gmail blocks plain passwords for this).

1. Go to your Google Account → Security → 2-Step Verification, and turn it on if it isn't already (App Passwords require it).
2. Go to https://myaccount.google.com/apppasswords, create a new app password (name it anything, e.g. "CrossAir"), and copy the 16-character code it gives you.
3. Before running the server, set two environment variables in your terminal:

   **Windows (PowerShell):**
   ```
   $env:EMAIL_HOST_USER = "youraddress@gmail.com"
   $env:EMAIL_HOST_PASSWORD = "the16digitapppassword"
   ```

   **Mac/Linux:**
   ```
   export EMAIL_HOST_USER="youraddress@gmail.com"
   export EMAIL_HOST_PASSWORD="the16digitapppassword"
   ```

4. Then run `python manage.py runserver` **in that same terminal**. Registering a new account will now send a real email from that Gmail address.

Note: these environment variables only last for that terminal session — you'll need to set them again each time you open a new terminal, unless you add them to your system's permanent environment variables.
