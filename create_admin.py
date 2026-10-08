from getpass import getpass

from auth.auth_service import hash_password
from database.database import (
    initialize_database,
    create_user,
    get_user_by_email
)


def main():
    print("=" * 50)
    print("       HealthTriage AI - Create Admin")
    print("=" * 50)

    initialize_database()

    full_name = input("Enter admin full name: ").strip()
    email = input("Enter admin email: ").strip().lower()
    password = getpass("Enter admin password: ")
    confirm_password = getpass("Confirm admin password: ")

    if not full_name:
        print("Error: Full name is required.")
        return

    if not email:
        print("Error: Email is required.")
        return

    if len(password) < 6:
        print("Error: Password must contain at least 6 characters.")
        return

    if password != confirm_password:
        print("Error: Passwords do not match.")
        return

    existing_user = get_user_by_email(email)

    if existing_user is not None:
        print("Error: An account with this email already exists.")
        return

    password_hash = hash_password(password)

    success = create_user(
        full_name=full_name,
        email=email,
        password_hash=password_hash,
        role="ADMIN"
    )

    if success:
        print()
        print("Admin account created successfully!")
        print(f"Name : {full_name}")
        print(f"Email: {email}")
        print("Role : ADMIN")
    else:
        print("Error: Unable to create admin account.")


if __name__ == "__main__":
    main()