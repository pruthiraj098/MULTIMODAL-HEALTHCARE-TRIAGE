import os
import secrets
import hashlib
import smtplib

from email.message import EmailMessage
from datetime import datetime, timedelta, timezone

import jwt
from dotenv import load_dotenv
from pwdlib import PasswordHash

from database.database import (
    create_user,
    get_user_by_email,
    create_password_reset_token,
    get_password_reset_token,
    mark_password_reset_token_used,
    update_user_password
)


# ==========================================
# LOAD ENVIRONMENT VARIABLES
# ==========================================

load_dotenv()


# ==========================================
# JWT CONFIGURATION
# ==========================================

SECRET_KEY = os.getenv(
    "SECRET_KEY",
    "healthtriage-ai-secret-key-change-this-later"
)

ALGORITHM = os.getenv(
    "ALGORITHM",
    "HS256"
)

ACCESS_TOKEN_EXPIRE_MINUTES = int(
    os.getenv(
        "ACCESS_TOKEN_EXPIRE_MINUTES",
        "60"
    )
)


# ==========================================
# PASSWORD RESET CONFIGURATION
# ==========================================

RESET_TOKEN_EXPIRE_MINUTES = int(
    os.getenv(
        "RESET_TOKEN_EXPIRE_MINUTES",
        "30"
    )
)


# ==========================================
# PASSWORD HASHING
# ==========================================

password_hash = PasswordHash.recommended()


def hash_password(password: str) -> str:
    return password_hash.hash(password)


def verify_password(
    password: str,
    hashed_password: str
) -> bool:
    return password_hash.verify(
        password,
        hashed_password
    )


# ==========================================
# JWT ACCESS TOKEN
# ==========================================

def create_access_token(
    user_id: int,
    role: str
):
    expire = (
        datetime.now(timezone.utc)
        + timedelta(
            minutes=ACCESS_TOKEN_EXPIRE_MINUTES
        )
    )

    payload = {
        "user_id": user_id,
        "role": role,
        "exp": expire
    }

    token = jwt.encode(
        payload,
        SECRET_KEY,
        algorithm=ALGORITHM
    )

    return token


# ==========================================
# USER REGISTRATION
# ==========================================

def register_user(
    full_name: str,
    email: str,
    password: str,
    role: str = "PATIENT"
):
    email = email.strip().lower()
    full_name = full_name.strip()

    # Check password length
    if len(password) < 6:
        return {
            "success": False,
            "message": "Password must contain at least 6 characters."
        }

    # Validate and normalize role
    valid_roles = [
        "PATIENT", "USER", "HEALTH_WORKER", "NURSE", "DOCTOR",
        "MEDICAL_OFFICER", "FACILITY_ADMIN", "SYSTEM_ADMIN", "ADMIN"
    ]
    role_upper = (role or "PATIENT").strip().upper()
    if role_upper not in valid_roles:
        role_upper = "PATIENT"

    # Check whether email already exists
    existing_user = get_user_by_email(email)
    if existing_user is not None:
        return {
            "success": False,
            "message": "An account with this email already exists."
        }

    # Hash password
    hashed_password = hash_password(password)

    # Create user with specified or normalized role
    success = create_user(
        full_name,
        email,
        hashed_password,
        role_upper
    )

    if not success:
        return {
            "success": False,
            "message": "Unable to create account."
        }

    return {
        "success": True,
        "message": "Account created successfully."
    }


# ==========================================
# USER LOGIN
# ==========================================

def login_user(
    email: str,
    password: str
):
    email = email.strip().lower()
    user = get_user_by_email(email)

    if user is None:
        return {
            "success": False,
            "message": "Invalid email or password."
        }

    # Check account status
    if not user["is_active"]:
        return {
            "success": False,
            "message": "Your account has been disabled."
        }

    # Verify password
    if not verify_password(
        password,
        user["password_hash"]
    ):
        return {
            "success": False,
            "message": "Invalid email or password."
        }

    # Create JWT
    token = create_access_token(
        user["id"],
        user["role"]
    )

    return {
        "success": True,
        "message": "Login successful.",
        "access_token": token,
        "token_type": "bearer",
        "user": {
            "id": user["id"],
            "full_name": user["full_name"],
            "email": user["email"],
            "role": user["role"]
        }
    }


# ==========================================
# HASH PASSWORD RESET TOKEN
# ==========================================

def hash_reset_token(token: str) -> str:
    return hashlib.sha256(
        token.encode("utf-8")
    ).hexdigest()


# ==========================================
# SEND PASSWORD RESET EMAIL
# ==========================================

def send_password_reset_email(
    email: str,
    reset_token: str
):
    smtp_host = os.getenv(
        "SMTP_HOST",
        "smtp.gmail.com"
    )

    smtp_port = int(
        os.getenv(
            "SMTP_PORT",
            "587"
        )
    )

    smtp_username = os.getenv(
        "SMTP_USERNAME"
    )

    smtp_password = os.getenv(
        "SMTP_PASSWORD"
    )

    frontend_url = os.getenv(
        "FRONTEND_URL",
        "http://localhost:5173"
    )

    # Check SMTP configuration
    if not smtp_username or not smtp_password:
        raise Exception(
            "SMTP email configuration is missing. "
            "Please configure SMTP_USERNAME and "
            "SMTP_PASSWORD in the .env file."
        )

    # Create password reset URL
    reset_url = (
        f"{frontend_url}/reset-password"
        f"?token={reset_token}"
    )

    # Create email
    message = EmailMessage()
    message["Subject"] = "HealthTriage AI - Password Reset"
    message["From"] = smtp_username
    message["To"] = email

    message.set_content(
        f"""
Hello,

We received a request to reset your
HealthTriage AI account password.

Use the link below to create a new password:

{reset_url}

This password reset link will expire in
{RESET_TOKEN_EXPIRE_MINUTES} minutes.

The link can only be used once.

If you did not request a password reset,
you can safely ignore this email.

Regards,

HealthTriage AI Team
"""
    )

    # Connect to SMTP server
    with smtplib.SMTP(
        smtp_host,
        smtp_port
    ) as server:
        server.starttls()
        server.login(
            smtp_username,
            smtp_password
        )
        server.send_message(message)


# ==========================================
# REQUEST PASSWORD RESET
# ==========================================

def request_password_reset(email: str):
    email = email.strip().lower()

    # Find user
    user = get_user_by_email(email)

    # Always return the same public response whether the email exists or not
    generic_response = {
        "success": True,
        "message": (
            "If an account exists for this email, "
            "a password reset link has been sent."
        )
    }

    if user is None:
        return generic_response

    # Generate secure random token
    reset_token = secrets.token_urlsafe(32)

    # Store only the hash of the token
    token_hash = hash_reset_token(reset_token)

    # Token expiration time
    expires_at = (
        datetime.now(timezone.utc)
        + timedelta(
            minutes=RESET_TOKEN_EXPIRE_MINUTES
        )
    )

    # Save token in database
    success = create_password_reset_token(
        user["id"],
        token_hash,
        expires_at
    )

    if not success:
        return {
            "success": False,
            "message": "Unable to create password reset request."
        }

    # Send email
    try:
        send_password_reset_email(
            email,
            reset_token
        )
    except Exception as e:
        print("Password reset email error:", e)
        return {
            "success": False,
            "message": (
                "Unable to send password reset email. "
                "Please check the email configuration."
            )
        }

    return generic_response


# ==========================================
# RESET PASSWORD
# ==========================================

def reset_password(
    reset_token: str,
    new_password: str
):
    # Validate new password
    if len(new_password) < 6:
        return {
            "success": False,
            "message": "Password must contain at least 6 characters."
        }

    # Hash received token
    token_hash = hash_reset_token(reset_token)

    # Find token
    token_data = get_password_reset_token(token_hash)

    if token_data is None:
        return {
            "success": False,
            "message": "Invalid or expired password reset link."
        }

    # Check whether token was already used
    if token_data["used"]:
        return {
            "success": False,
            "message": "This password reset link has already been used."
        }

    # Get expiration time
    expires_at = token_data["expires_at"]

    current_time = datetime.now(
        timezone.utc
    ).replace(
        tzinfo=None
    )

    if current_time > expires_at:
        return {
            "success": False,
            "message": "This password reset link has expired."
        }

    # Hash new password
    hashed_password = hash_password(new_password)

    # Update password
    password_updated = update_user_password(
        token_data["user_id"],
        hashed_password
    )

    if not password_updated:
        return {
            "success": False,
            "message": "Unable to update your password."
        }

    # Mark token as used
    token_marked = mark_password_reset_token_used(token_data["id"])

    if not token_marked:
        return {
            "success": False,
            "message": (
                "Password was updated, but the reset token could not be marked as used."
            )
        }

    return {
        "success": True,
        "message": (
            "Password reset successfully. You can now login with your new password."
        )
    }