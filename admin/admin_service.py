import mysql.connector

from database.database import get_connection


def get_dashboard_statistics():
    connection = get_connection()

    if connection is None:
        raise Exception(
            "Unable to connect to MySQL database."
        )

    cursor = connection.cursor()

    try:
        cursor.execute(
            """
            SELECT COUNT(*)
            FROM users
            WHERE role = 'USER'
            """
        )
        total_users = cursor.fetchone()[0]

        cursor.execute(
            """
            SELECT COUNT(*)
            FROM users
            WHERE role = 'ADMIN'
            """
        )
        total_admins = cursor.fetchone()[0]

        cursor.execute(
            """
            SELECT COUNT(*)
            FROM users
            WHERE is_active = 1
            """
        )
        active_users = cursor.fetchone()[0]

        cursor.execute(
            """
            SELECT COUNT(*)
            FROM triage_history
            """
        )
        total_triage_cases = cursor.fetchone()[0]

        return {
            "total_users": total_users,
            "total_admins": total_admins,
            "active_users": active_users,
            "total_triage_cases": total_triage_cases,
            "system_status": "healthy"
        }

    except mysql.connector.Error as error:
        raise Exception(
            f"Database error: {error}"
        )

    finally:
        cursor.close()
        connection.close()


def get_all_users():
    connection = get_connection()

    if connection is None:
        raise Exception(
            "Unable to connect to MySQL database."
        )

    cursor = connection.cursor(dictionary=True)

    try:
        cursor.execute(
            """
            SELECT
                id,
                full_name,
                email,
                role,
                is_active,
                created_at
            FROM users
            ORDER BY id DESC
            """
        )

        users = cursor.fetchall()

        return users

    except mysql.connector.Error as error:
        raise Exception(
            f"Database error: {error}"
        )

    finally:
        cursor.close()
        connection.close()


def update_user_status(user_id: int, is_active: bool):
    connection = get_connection()

    if connection is None:
        raise Exception(
            "Unable to connect to MySQL database."
        )

    cursor = connection.cursor(dictionary=True)

    try:
        # First check whether the user exists
        cursor.execute(
            """
            SELECT
                id,
                full_name,
                email,
                role,
                is_active
            FROM users
            WHERE id = %s
            """,
            (user_id,)
        )

        user = cursor.fetchone()

        if user is None:
            return {
                "success": False,
                "message": "User not found."
            }

        # Only normal USER accounts can be activated/deactivated
        if user["role"] != "USER":
            return {
                "success": False,
                "message":
                    "Admin accounts cannot be activated or deactivated."
            }

        cursor.execute(
            """
            UPDATE users
            SET is_active = %s
            WHERE id = %s
            """,
            (
                1 if is_active else 0,
                user_id
            )
        )

        connection.commit()

        return {
            "success": True,
            "message":
                "User status updated successfully.",
            "user": {
                "id": user["id"],
                "full_name": user["full_name"],
                "email": user["email"],
                "role": user["role"],
                "is_active": bool(is_active)
            }
        }

    except mysql.connector.Error as error:
        connection.rollback()

        raise Exception(
            f"Database error: {error}"
        )

    finally:
        cursor.close()
        connection.close()