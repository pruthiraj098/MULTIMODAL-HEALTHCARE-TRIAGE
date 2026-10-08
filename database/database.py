import os
import json
from typing import Any, Optional, Dict, List, Union
import mysql.connector
from mysql.connector import Error
from dotenv import load_dotenv

load_dotenv()

# ==========================================
# DATABASE CONFIGURATION
# ==========================================

DB_HOST = os.getenv("DB_HOST", "localhost")
DB_PORT = int(os.getenv("DB_PORT", "3306"))
DB_USER = os.getenv("DB_USER", "root")
DB_PASSWORD = os.getenv("DB_PASSWORD", "bisal5")
DB_NAME = os.getenv("DB_NAME", "healthtriage")


# ==========================================
# DATABASE CONNECTION
# ==========================================

def get_connection(database=DB_NAME):
    try:
        kwargs = {
            "host": DB_HOST,
            "port": DB_PORT,
            "user": DB_USER,
            "password": DB_PASSWORD,
        }
        if database:
            kwargs["database"] = database

        connection = mysql.connector.connect(**kwargs)
        return connection

    except Error as e:
        print("MySQL connection error:", e)
        return None


# ==========================================
# INITIALIZE DATABASE
# ==========================================

def initialize_database():
    # 1. Ensure the database exists on MySQL server
    try:
        server_conn = get_connection(database=None)
        if server_conn is not None:
            srv_cur = server_conn.cursor()
            srv_cur.execute(
                f"CREATE DATABASE IF NOT EXISTS `{DB_NAME}` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci"
            )
            srv_cur.close()
            server_conn.close()
    except Exception as srv_err:
        print("Notice on database existence check:", srv_err)

    connection = get_connection(database=DB_NAME)

    if connection is None:
        return False

    cursor = connection.cursor()

    try:
        # ------------------------------------------
        # USERS TABLE
        # ------------------------------------------
        cursor.execute(
            """
            CREATE TABLE IF NOT EXISTS users (
                id INT AUTO_INCREMENT PRIMARY KEY,
                full_name VARCHAR(100) NOT NULL,
                email VARCHAR(150) NOT NULL UNIQUE,
                password_hash VARCHAR(255) NOT NULL,
                role ENUM('USER', 'ADMIN') NOT NULL DEFAULT 'USER',
                is_active BOOLEAN NOT NULL DEFAULT TRUE,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
            """
        )

        # ------------------------------------------
        # TRIAGE HISTORY TABLE
        # ------------------------------------------
        cursor.execute(
            """
            CREATE TABLE IF NOT EXISTS triage_history (
                id INT AUTO_INCREMENT PRIMARY KEY,
                patient_name VARCHAR(100),
                age INT,
                gender VARCHAR(20),
                symptoms TEXT,
                triage_result TEXT,
                user_id INT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
            )
            """
        )

        # Check and add user_id column if migrating from older schema
        try:
            cursor.execute(
                """
                SELECT COUNT(*)
                FROM information_schema.columns
                WHERE table_schema = DATABASE()
                AND table_name = 'triage_history'
                AND column_name = 'user_id'
                """
            )
            col_exists = cursor.fetchone()[0]
            if col_exists == 0:
                cursor.execute(
                    """
                    ALTER TABLE triage_history
                    ADD COLUMN user_id INT NULL,
                    ADD CONSTRAINT fk_triage_user
                    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
                    """
                )
        except Exception as col_err:
            print("Notice: triage_history user_id column check:", col_err)

        # Check and expand users.role enum & facility_id column
        try:
            cursor.execute(
                """
                ALTER TABLE users
                MODIFY COLUMN role ENUM(
                    'USER', 'ADMIN', 'PATIENT', 'HEALTH_WORKER',
                    'NURSE', 'DOCTOR', 'MEDICAL_OFFICER',
                    'FACILITY_ADMIN', 'SYSTEM_ADMIN'
                ) NOT NULL DEFAULT 'USER'
                """
            )
        except Exception as role_err:
            print("Notice: users role enum update:", role_err)

        try:
            cursor.execute(
                """
                SELECT COUNT(*)
                FROM information_schema.columns
                WHERE table_schema = DATABASE()
                AND table_name = 'users'
                AND column_name = 'facility_id'
                """
            )
            if cursor.fetchone()[0] == 0:
                cursor.execute("ALTER TABLE users ADD COLUMN facility_id INT NULL")
        except Exception as fac_col_err:
            print("Notice: users facility_id column check:", fac_col_err)

        # ------------------------------------------
        # PASSWORD RESET TOKENS TABLE
        # ------------------------------------------
        cursor.execute(
            """
            CREATE TABLE IF NOT EXISTS password_reset_tokens (
                id INT AUTO_INCREMENT PRIMARY KEY,
                user_id INT NOT NULL,
                token_hash VARCHAR(64) NOT NULL UNIQUE,
                expires_at DATETIME NOT NULL,
                used BOOLEAN NOT NULL DEFAULT FALSE,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
            )
            """
        )

        # ------------------------------------------
        # HEALTH MEASUREMENTS TABLE (PHASE 2)
        # ------------------------------------------
        cursor.execute(
            """
            CREATE TABLE IF NOT EXISTS health_measurements (
                id INT AUTO_INCREMENT PRIMARY KEY,
                user_id INT NOT NULL,
                measurement_type VARCHAR(50) NOT NULL,
                value FLOAT NOT NULL,
                unit VARCHAR(20) NOT NULL,
                recorded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                source VARCHAR(50) DEFAULT 'manual',
                notes TEXT NULL,
                symptoms TEXT NULL,
                wellness_status VARCHAR(50) NULL,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
                INDEX idx_user_type_time (user_id, measurement_type, recorded_at)
            )
            """
        )

        # ------------------------------------------
        # HEALTH RISK ASSESSMENTS TABLE (PHASE 3)
        # ------------------------------------------
        cursor.execute(
            """
            CREATE TABLE IF NOT EXISTS health_risk_assessments (
                id INT AUTO_INCREMENT PRIMARY KEY,
                user_id INT NOT NULL,
                risk_level VARCHAR(20) NOT NULL,
                risk_score INT NOT NULL,
                factors TEXT NOT NULL,
                explanation TEXT NOT NULL,
                recommended_action TEXT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
                INDEX idx_user_risk_time (user_id, created_at)
            )
            """
        )

        # ------------------------------------------
        # MEDICAL REPORTS TABLE (PHASE 4)
        # ------------------------------------------
        cursor.execute(
            """
            CREATE TABLE IF NOT EXISTS medical_reports (
                id INT AUTO_INCREMENT PRIMARY KEY,
                user_id INT NOT NULL,
                file_name VARCHAR(255) NOT NULL,
                file_type VARCHAR(50) NOT NULL,
                report_type VARCHAR(100) NULL,
                report_date VARCHAR(50) NULL,
                extracted_parameters TEXT NULL,
                abnormal_count INT DEFAULT 0,
                summary TEXT NULL,
                plain_language_explanation TEXT NULL,
                doctor_questions TEXT NULL,
                symptom_correlations TEXT NULL,
                overall_urgency VARCHAR(30) DEFAULT 'ROUTINE',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
                INDEX idx_user_report_time (user_id, created_at)
            )
            """
        )

        # ------------------------------------------
        # USER MEDICATIONS TABLE (PHASE 5)
        # ------------------------------------------
        cursor.execute(
            """
            CREATE TABLE IF NOT EXISTS user_medications (
                id INT AUTO_INCREMENT PRIMARY KEY,
                user_id INT NOT NULL,
                name VARCHAR(150) NOT NULL,
                dosage VARCHAR(100) NOT NULL,
                frequency VARCHAR(100) NOT NULL,
                time_of_day VARCHAR(50) NOT NULL DEFAULT 'Morning',
                instructions TEXT NULL,
                food_warnings TEXT NULL,
                is_active BOOLEAN NOT NULL DEFAULT TRUE,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
                INDEX idx_user_med_active (user_id, is_active)
            )
            """
        )

        # ------------------------------------------
        # MEDICATION LOGS TABLE (PHASE 5)
        # ------------------------------------------
        cursor.execute(
            """
            CREATE TABLE IF NOT EXISTS medication_logs (
                id INT AUTO_INCREMENT PRIMARY KEY,
                user_id INT NOT NULL,
                medication_id INT NOT NULL,
                scheduled_date DATE NOT NULL,
                time_of_day VARCHAR(50) NOT NULL,
                status VARCHAR(20) NOT NULL DEFAULT 'pending',
                logged_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
                FOREIGN KEY (medication_id) REFERENCES user_medications(id) ON DELETE CASCADE,
                INDEX idx_user_med_log (user_id, scheduled_date)
            )
            """
        )

        # ------------------------------------------
        # WELLNESS CHECKINS TABLE (PHASE 6)
        # ------------------------------------------
        cursor.execute(
            """
            CREATE TABLE IF NOT EXISTS wellness_checkins (
                id INT AUTO_INCREMENT PRIMARY KEY,
                user_id INT NOT NULL,
                checkin_date DATE NOT NULL,
                water_glasses INT DEFAULT 0,
                sleep_hours FLOAT DEFAULT 0.0,
                mood VARCHAR(50) NULL,
                energy_level VARCHAR(50) NULL,
                notes TEXT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
                UNIQUE KEY uq_user_checkin (user_id, checkin_date)
            )
            """
        )

        # ------------------------------------------
        # HEALTHCARE FACILITIES TABLE (PHASE 7)
        # ------------------------------------------
        cursor.execute(
            """
            CREATE TABLE IF NOT EXISTS healthcare_facilities (
                id INT AUTO_INCREMENT PRIMARY KEY,
                name VARCHAR(200) NOT NULL,
                facility_type VARCHAR(50) NOT NULL,
                address VARCHAR(255) NOT NULL,
                city VARCHAR(100) NOT NULL,
                state VARCHAR(100) NULL,
                pincode VARCHAR(20) NULL,
                phone VARCHAR(50) NOT NULL,
                latitude DECIMAL(10, 7) NOT NULL,
                longitude DECIMAL(10, 7) NOT NULL,
                is_24x7 BOOLEAN NOT NULL DEFAULT TRUE,
                has_emergency BOOLEAN NOT NULL DEFAULT FALSE,
                has_icu BOOLEAN NOT NULL DEFAULT FALSE,
                rating FLOAT DEFAULT 4.5,
                services_offered TEXT NULL,
                google_maps_url VARCHAR(255) NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                INDEX idx_facility_coords (latitude, longitude),
                INDEX idx_facility_type (facility_type, is_24x7),
                INDEX idx_facility_city (city)
            )
            """
        )

        # ------------------------------------------
        # USER SAVED FACILITIES TABLE (PHASE 7)
        # ------------------------------------------
        cursor.execute(
            """
            CREATE TABLE IF NOT EXISTS user_saved_facilities (
                id INT AUTO_INCREMENT PRIMARY KEY,
                user_id INT NOT NULL,
                facility_id INT NOT NULL,
                notes VARCHAR(255) NULL,
                saved_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
                FOREIGN KEY (facility_id) REFERENCES healthcare_facilities(id) ON DELETE CASCADE,
                UNIQUE KEY uq_user_facility (user_id, facility_id)
            )
            """
        )

        # Seed initial healthcare facilities if table is empty
        _seed_healthcare_facilities(cursor)

        # ------------------------------------------
        # FACILITY PROFILES TABLE (FACILITY INTELLIGENCE)
        # ------------------------------------------
        cursor.execute(
            """
            CREATE TABLE IF NOT EXISTS facility_profiles (
                id INT AUTO_INCREMENT PRIMARY KEY,
                name VARCHAR(200) NOT NULL,
                facility_type VARCHAR(50) NOT NULL,
                code VARCHAR(50) UNIQUE NOT NULL,
                district VARCHAR(100) NOT NULL,
                state VARCHAR(100) NOT NULL,
                pincode VARCHAR(20) NULL,
                active_mode VARCHAR(50) DEFAULT 'STANDARD',
                total_beds INT DEFAULT 50,
                icu_beds INT DEFAULT 5,
                emergency_contact VARCHAR(50) DEFAULT '108',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
            """
        )

        # ------------------------------------------
        # TRIAGE SESSIONS TABLE (SMART QUEUE & MULTIMODAL)
        # ------------------------------------------
        cursor.execute(
            """
            CREATE TABLE IF NOT EXISTS triage_sessions (
                id INT AUTO_INCREMENT PRIMARY KEY,
                session_uuid VARCHAR(64) UNIQUE NOT NULL,
                user_id INT NULL,
                patient_name VARCHAR(100) NOT NULL,
                patient_age INT NULL,
                patient_gender VARCHAR(20) NULL,
                facility_type VARCHAR(50) DEFAULT 'GOVERNMENT_HOSPITAL',
                facility_id INT NULL,
                language VARCHAR(10) DEFAULT 'en',
                status VARCHAR(30) DEFAULT 'PENDING_REVIEW',
                triage_level VARCHAR(30) DEFAULT 'ROUTINE',
                is_emergency BOOLEAN DEFAULT FALSE,
                assigned_to INT NULL,
                source_channel VARCHAR(30) DEFAULT 'SANA_WEB',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
                FOREIGN KEY (assigned_to) REFERENCES users(id) ON DELETE SET NULL,
                INDEX idx_session_status_level (status, triage_level),
                INDEX idx_session_time (created_at)
            )
            """
        )

        # ------------------------------------------
        # TRIAGE NOTES TABLE (STRUCTURED CLINICAL NOTE)
        # ------------------------------------------
        cursor.execute(
            """
            CREATE TABLE IF NOT EXISTS triage_notes (
                id INT AUTO_INCREMENT PRIMARY KEY,
                session_id INT NOT NULL,
                chief_complaint TEXT NULL,
                patient_reported_info LONGTEXT NULL,
                ai_extracted_info LONGTEXT NULL,
                ai_generated_summary LONGTEXT NULL,
                safety_flags LONGTEXT NULL,
                vitals_snapshot LONGTEXT NULL,
                report_findings LONGTEXT NULL,
                image_observations LONGTEXT NULL,
                missing_information TEXT NULL,
                suggested_questions TEXT NULL,
                referral_considerations TEXT NULL,
                reviewer_decision VARCHAR(50) NULL,
                reviewer_notes LONGTEXT NULL,
                reviewer_id INT NULL,
                reviewed_at DATETIME NULL,
                source_metadata LONGTEXT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (session_id) REFERENCES triage_sessions(id) ON DELETE CASCADE,
                FOREIGN KEY (reviewer_id) REFERENCES users(id) ON DELETE SET NULL,
                INDEX idx_notes_session (session_id)
            )
            """
        )

        # ------------------------------------------
        # REVIEWER ACTIONS AUDIT TABLE
        # ------------------------------------------
        cursor.execute(
            """
            CREATE TABLE IF NOT EXISTS reviewer_actions (
                id INT AUTO_INCREMENT PRIMARY KEY,
                session_id INT NOT NULL,
                reviewer_id INT NOT NULL,
                action_type VARCHAR(50) NOT NULL,
                previous_status VARCHAR(30) NULL,
                new_status VARCHAR(30) NULL,
                notes TEXT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (session_id) REFERENCES triage_sessions(id) ON DELETE CASCADE,
                FOREIGN KEY (reviewer_id) REFERENCES users(id) ON DELETE CASCADE,
                INDEX idx_actions_session (session_id)
            )
            """
        )

        # ------------------------------------------
        # REFERRALS TABLE (REFERRAL NOTE GENERATOR)
        # ------------------------------------------
        cursor.execute(
            """
            CREATE TABLE IF NOT EXISTS referrals (
                id INT AUTO_INCREMENT PRIMARY KEY,
                session_id INT NOT NULL,
                patient_id INT NULL,
                patient_name VARCHAR(100) NOT NULL,
                referring_facility VARCHAR(200) NOT NULL,
                receiving_facility VARCHAR(200) NOT NULL,
                specialty_required VARCHAR(100) NOT NULL,
                priority VARCHAR(30) DEFAULT 'URGENT',
                reason_for_referral TEXT NOT NULL,
                clinical_summary LONGTEXT NOT NULL,
                vital_signs_summary TEXT NULL,
                abnormal_findings TEXT NULL,
                transport_mode VARCHAR(50) DEFAULT 'STANDARD',
                created_by INT NOT NULL,
                status VARCHAR(30) DEFAULT 'DRAFT',
                pdf_path VARCHAR(255) NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (session_id) REFERENCES triage_sessions(id) ON DELETE CASCADE,
                FOREIGN KEY (patient_id) REFERENCES users(id) ON DELETE SET NULL,
                FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE CASCADE,
                INDEX idx_referrals_patient (patient_id),
                INDEX idx_referrals_priority (priority, status)
            )
            """
        )

        # ------------------------------------------
        # FOLLOWUPS TABLE (CHRONIC & MATERNAL REMINDERS)
        # ------------------------------------------
        cursor.execute(
            """
            CREATE TABLE IF NOT EXISTS followups (
                id INT AUTO_INCREMENT PRIMARY KEY,
                session_id INT NULL,
                patient_id INT NOT NULL,
                followup_type VARCHAR(50) NOT NULL,
                scheduled_date DATE NOT NULL,
                reminder_channel VARCHAR(50) DEFAULT 'APP_NOTIFICATION',
                clinical_objective TEXT NOT NULL,
                status VARCHAR(30) DEFAULT 'SCHEDULED',
                notes TEXT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (session_id) REFERENCES triage_sessions(id) ON DELETE SET NULL,
                FOREIGN KEY (patient_id) REFERENCES users(id) ON DELETE CASCADE,
                INDEX idx_followups_date (scheduled_date, status)
            )
            """
        )

        # ------------------------------------------
        # AUDIT LOGS TABLE (AUDITABILITY & COMPLIANCE)
        # ------------------------------------------
        cursor.execute(
            """
            CREATE TABLE IF NOT EXISTS audit_logs (
                id INT AUTO_INCREMENT PRIMARY KEY,
                user_id INT NULL,
                user_role VARCHAR(50) NULL,
                action VARCHAR(100) NOT NULL,
                resource_type VARCHAR(50) NOT NULL,
                resource_id VARCHAR(100) NULL,
                details TEXT NULL,
                ip_address VARCHAR(45) NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                INDEX idx_audit_time (created_at),
                INDEX idx_audit_user (user_id),
                INDEX idx_audit_action (action)
            )
            """
        )

        # ------------------------------------------
        # CLINICIAN TREATMENT PLANS (SECTION 19)
        # ------------------------------------------
        cursor.execute(
            """
            CREATE TABLE IF NOT EXISTS treatment_plans (
                id INT AUTO_INCREMENT PRIMARY KEY,
                patient_id INT NOT NULL,
                doctor_id INT NOT NULL,
                session_id INT NULL,
                clinical_assessment TEXT NOT NULL,
                diagnosis_notes TEXT NULL,
                follow_up_date DATE NULL,
                tests_recommended TEXT NULL,
                lifestyle_guidance TEXT NULL,
                status VARCHAR(30) DEFAULT 'ACTIVE',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (patient_id) REFERENCES users(id) ON DELETE CASCADE,
                FOREIGN KEY (doctor_id) REFERENCES users(id) ON DELETE CASCADE,
                INDEX idx_plan_patient (patient_id, status)
            )
            """
        )

        # ------------------------------------------
        # TREATMENT PLAN MEDICATIONS (SECTION 19 & 20)
        # ------------------------------------------
        cursor.execute(
            """
            CREATE TABLE IF NOT EXISTS treatment_plan_medications (
                id INT AUTO_INCREMENT PRIMARY KEY,
                plan_id INT NOT NULL,
                medicine_name VARCHAR(150) NOT NULL,
                dosage VARCHAR(100) NOT NULL,
                frequency VARCHAR(100) NOT NULL,
                duration_days INT DEFAULT 7,
                instructions TEXT NULL,
                food_relation VARCHAR(50) DEFAULT 'After food',
                time_of_day VARCHAR(50) DEFAULT 'Morning',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (plan_id) REFERENCES treatment_plans(id) ON DELETE CASCADE
            )
            """
        )

        # ------------------------------------------
        # PATIENT ASSIGNMENTS (SECTION 8, 9, 29)
        # ------------------------------------------
        cursor.execute(
            """
            CREATE TABLE IF NOT EXISTS patient_assignments (
                id INT AUTO_INCREMENT PRIMARY KEY,
                patient_id INT NOT NULL,
                staff_id INT NOT NULL,
                role VARCHAR(50) NOT NULL,
                facility_id INT NULL,
                status VARCHAR(30) DEFAULT 'ACTIVE',
                assigned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (patient_id) REFERENCES users(id) ON DELETE CASCADE,
                FOREIGN KEY (staff_id) REFERENCES users(id) ON DELETE CASCADE,
                INDEX idx_assign_staff (staff_id, status)
            )
            """
        )

        # ------------------------------------------
        # DOCTOR ASSESSMENTS (SECTION 8 & 19)
        # ------------------------------------------
        cursor.execute(
            """
            CREATE TABLE IF NOT EXISTS doctor_assessments (
                id INT AUTO_INCREMENT PRIMARY KEY,
                doctor_id INT NOT NULL,
                patient_id INT NOT NULL,
                session_id INT NULL,
                chief_complaint TEXT NULL,
                clinical_findings TEXT NOT NULL,
                differential_notes TEXT NULL,
                severity_level VARCHAR(30) DEFAULT 'ROUTINE',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (doctor_id) REFERENCES users(id) ON DELETE CASCADE,
                FOREIGN KEY (patient_id) REFERENCES users(id) ON DELETE CASCADE,
                INDEX idx_doc_assessment (doctor_id, patient_id)
            )
            """
        )

        # Seed initial facility profiles if table is empty
        _seed_facility_profiles(cursor)

        connection.commit()
        print("MySQL database initialized successfully.")
        return True

    except Error as e:
        print("Database initialization error:", e)
        return False

    finally:
        cursor.close()
        connection.close()


# ==========================================
# TRIAGE HISTORY
# ==========================================

def save_triage_result(
    patient_name,
    age,
    gender,
    symptoms,
    triage_result,
    user_id=None
):
    connection = get_connection()

    if connection is None:
        return False

    cursor = connection.cursor()

    try:
        clean_age = None
        if age is not None and str(age).strip() != "":
            try:
                clean_age = int(float(str(age).strip()))
            except (ValueError, TypeError):
                import re
                match = re.search(r'\b\d+\b', str(age))
                if match:
                    clean_age = int(match.group())
                else:
                    clean_age = None

        query = """
            INSERT INTO triage_history
            (
                patient_name,
                age,
                gender,
                symptoms,
                triage_result,
                user_id
            )
            VALUES (%s, %s, %s, %s, %s, %s)
        """

        values = (
            str(patient_name) if patient_name is not None else None,
            clean_age,
            str(gender) if gender is not None else None,
            str(symptoms) if symptoms is not None else None,
            str(triage_result) if triage_result is not None else None,
            int(user_id) if user_id is not None else None
        )

        cursor.execute(query, values)
        connection.commit()
        print("Triage result saved successfully.")
        return True

    except Error as e:
        print("Error saving triage result:", e)
        return False

    finally:
        cursor.close()
        connection.close()


# ==========================================
# CREATE USER
# ==========================================

def create_user(
    full_name,
    email,
    password_hash,
    role="USER"
):
    connection = get_connection()

    if connection is None:
        return False

    cursor = connection.cursor()

    try:
        clean_role = str(role).strip().upper() if role else "USER"
        valid_roles = [
            "USER", "ADMIN", "PATIENT", "HEALTH_WORKER",
            "NURSE", "DOCTOR", "MEDICAL_OFFICER",
            "FACILITY_ADMIN", "SYSTEM_ADMIN"
        ]
        if clean_role not in valid_roles:
            clean_role = "USER"

        query = """
            INSERT INTO users
            (
                full_name,
                email,
                password_hash,
                role
            )
            VALUES (%s, %s, %s, %s)
        """

        values = (
            str(full_name).strip(),
            str(email).strip().lower(),
            password_hash,
            clean_role
        )

        cursor.execute(query, values)
        connection.commit()
        return True

    except Error as e:
        print("Error creating user:", e)
        return False

    finally:
        cursor.close()
        connection.close()


# ==========================================
# GET USER BY EMAIL
# ==========================================

def get_user_by_email(email):
    connection = get_connection()

    if connection is None:
        return None

    cursor = connection.cursor(dictionary=True)

    try:
        query = """
            SELECT
                id,
                full_name,
                email,
                password_hash,
                role,
                is_active,
                created_at
            FROM users
            WHERE email = %s
            LIMIT 1
        """

        cursor.execute(query, (email,))
        return cursor.fetchone()

    except Error as e:
        print("Error finding user:", e)
        return None

    finally:
        cursor.close()
        connection.close()


# ==========================================
# GET USER BY ID
# ==========================================

def get_user_by_id(user_id):
    connection = get_connection()

    if connection is None:
        return None

    cursor = connection.cursor(dictionary=True)

    try:
        query = """
            SELECT
                id,
                full_name,
                email,
                role,
                is_active,
                created_at
            FROM users
            WHERE id = %s
            LIMIT 1
        """

        cursor.execute(query, (user_id,))
        return cursor.fetchone()

    except Error as e:
        print("Error finding user:", e)
        return None

    finally:
        cursor.close()
        connection.close()


# ==========================================
# GET ALL TRIAGE HISTORY
# ==========================================

def get_all_triage_history(limit: int = 100):
    connection = get_connection()

    if connection is None:
        raise Exception("Unable to connect to MySQL database.")

    cursor = connection.cursor(dictionary=True)

    try:
        query = """
            SELECT
                id,
                patient_name,
                age,
                gender,
                symptoms,
                triage_result,
                created_at
            FROM triage_history
            ORDER BY created_at DESC
        """

        if limit and int(limit) > 0:
            query = f"{query} LIMIT %s"
            cursor.execute(query, (int(limit),))
        else:
            cursor.execute(query)

        return cursor.fetchall()

    except Error as e:
        raise Exception(f"Database error: {e}")

    finally:
        cursor.close()
        connection.close()


# ==========================================
# GET USER TRIAGE HISTORY
# ==========================================

def get_user_triage_history(user_id, limit: int = 100):
    connection = get_connection()

    if connection is None:
        raise Exception("Unable to connect to MySQL database.")

    cursor = connection.cursor(dictionary=True)

    try:
        query = """
            SELECT
                id,
                patient_name,
                age,
                gender,
                symptoms,
                triage_result,
                created_at
            FROM triage_history
            WHERE user_id = %s
            ORDER BY created_at DESC
        """

        if limit and int(limit) > 0:
            query = f"{query} LIMIT %s"
            cursor.execute(query, (user_id, int(limit)))
        else:
            cursor.execute(query, (user_id,))

        return cursor.fetchall()

    except Error as e:
        raise Exception(f"Database error: {e}")

    finally:
        cursor.close()
        connection.close()


# ==========================================
# CREATE PASSWORD RESET TOKEN
# ==========================================

def create_password_reset_token(
    user_id,
    token_hash,
    expires_at
):
    connection = get_connection()

    if connection is None:
        return False

    cursor = connection.cursor()

    try:
        # Invalidate all previous unused reset tokens belonging to this user
        cursor.execute(
            """
            UPDATE password_reset_tokens
            SET used = TRUE
            WHERE user_id = %s
            AND used = FALSE
            """,
            (user_id,)
        )

        # Create the new reset token
        cursor.execute(
            """
            INSERT INTO password_reset_tokens
            (
                user_id,
                token_hash,
                expires_at
            )
            VALUES (%s, %s, %s)
            """,
            (
                user_id,
                token_hash,
                expires_at
            )
        )

        connection.commit()
        return True

    except Error as e:
        connection.rollback()
        print("Error creating password reset token:", e)
        return False

    finally:
        cursor.close()
        connection.close()


# ==========================================
# GET PASSWORD RESET TOKEN
# ==========================================

def get_password_reset_token(token_hash):
    connection = get_connection()

    if connection is None:
        return None

    cursor = connection.cursor(dictionary=True)

    try:
        query = """
            SELECT
                id,
                user_id,
                token_hash,
                expires_at,
                used
            FROM password_reset_tokens
            WHERE token_hash = %s
            LIMIT 1
        """

        cursor.execute(query, (token_hash,))
        return cursor.fetchone()

    except Error as e:
        print("Error finding password reset token:", e)
        return None

    finally:
        cursor.close()
        connection.close()


# ==========================================
# MARK RESET TOKEN AS USED
# ==========================================

def mark_password_reset_token_used(token_identifier):
    connection = get_connection()

    if connection is None:
        return False

    cursor = connection.cursor()

    try:
        # Support either integer id or string token_hash
        if isinstance(token_identifier, int) or (isinstance(token_identifier, str) and token_identifier.isdigit()):
            query = """
                UPDATE password_reset_tokens
                SET used = TRUE
                WHERE id = %s
            """
            cursor.execute(query, (int(token_identifier),))
        else:
            query = """
                UPDATE password_reset_tokens
                SET used = TRUE
                WHERE token_hash = %s
            """
            cursor.execute(query, (str(token_identifier),))

        connection.commit()
        return True

    except Error as e:
        connection.rollback()
        print("Error updating password reset token:", e)
        return False

    finally:
        cursor.close()
        connection.close()


# ==========================================
# UPDATE USER PASSWORD
# ==========================================

def update_user_password(user_id, password_hash):
    connection = get_connection()

    if connection is None:
        return False

    cursor = connection.cursor()

    try:
        cursor.execute(
            """
            UPDATE users
            SET password_hash = %s
            WHERE id = %s
            """,
            (password_hash, user_id)
        )

        connection.commit()
        return cursor.rowcount > 0

    except Error as e:
        connection.rollback()
        print("Error updating user password:", e)
        return False

    finally:
        cursor.close()
        connection.close()


# ==========================================
# HEALTH MEASUREMENTS (PHASE 2)
# ==========================================

def save_health_measurement(
    user_id: int,
    measurement_type: str,
    value: float,
    unit: str,
    source: str = "manual",
    recorded_at=None,
    notes: str = None,
    symptoms: str = None,
    wellness_status: str = None
) -> bool:
    """Save a single physiological health measurement for an authenticated user."""
    # Robust argument handling
    if isinstance(source, str) and ("-" in source or ":" in source) and len(source) >= 10:
        recorded_at, source = source, "manual"
    elif recorded_at in ["manual", "wearable", "device", "voice", "app"]:
        source = recorded_at
        recorded_at = None

    connection = get_connection()
    if connection is None:
        return False

    cursor = connection.cursor()
    try:
        if recorded_at and isinstance(recorded_at, str) and not ("-" in recorded_at or ":" in recorded_at):
            recorded_at = None

        if recorded_at:
            query = """
                INSERT INTO health_measurements
                (user_id, measurement_type, value, unit, recorded_at, source, notes, symptoms, wellness_status)
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)
            """
            values = (user_id, measurement_type, value, unit, recorded_at, source, notes, symptoms, wellness_status)
        else:
            query = """
                INSERT INTO health_measurements
                (user_id, measurement_type, value, unit, source, notes, symptoms, wellness_status)
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
            """
            values = (user_id, measurement_type, value, unit, source, notes, symptoms, wellness_status)

        cursor.execute(query, values)
        connection.commit()
        return True
    except Error as e:
        print("Error saving health measurement:", e)
        return False
    finally:
        cursor.close()
        connection.close()


def save_bulk_measurements(user_id: int, items: list) -> int:
    """Save multiple health measurements atomically."""
    if not items:
        return 0

    connection = get_connection()
    if connection is None:
        return 0

    cursor = connection.cursor()
    count = 0
    try:
        query = """
            INSERT INTO health_measurements
            (user_id, measurement_type, value, unit, source, notes, symptoms, wellness_status)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
        """
        for item in items:
            cursor.execute(
                query,
                (
                    user_id,
                    item.get("measurement_type"),
                    float(item.get("value")),
                    item.get("unit", ""),
                    item.get("source", "manual"),
                    item.get("notes"),
                    item.get("symptoms"),
                    item.get("wellness_status")
                )
            )
            count += 1
        connection.commit()
        return count
    except Error as e:
        connection.rollback()
        print("Error in bulk saving measurements:", e)
        return 0
    finally:
        cursor.close()
        connection.close()


def get_user_health_measurements(
    user_id: int,
    measurement_type: str = None,
    days: int = None,
    limit: int = 200
) -> list:
    """Retrieve measurements for a specific authenticated user with optional filter."""
    connection = get_connection()
    if connection is None:
        return []

    cursor = connection.cursor(dictionary=True)
    try:
        params = [user_id]
        where_clauses = ["user_id = %s"]

        if measurement_type:
            where_clauses.append("measurement_type = %s")
            params.append(measurement_type)

        if days is not None and days > 0:
            where_clauses.append("recorded_at >= DATE_SUB(NOW(), INTERVAL %s DAY)")
            params.append(days)

        where_sql = " AND ".join(where_clauses)
        query = f"""
            SELECT id, user_id, measurement_type, value, unit, recorded_at, source, notes, symptoms, wellness_status
            FROM health_measurements
            WHERE {where_sql}
            ORDER BY recorded_at DESC
            LIMIT %s
        """
        params.append(limit)

        cursor.execute(query, tuple(params))
        rows = cursor.fetchall()

        for r in rows:
            if r.get("recorded_at"):
                r["recorded_at"] = r["recorded_at"].strftime("%Y-%m-%d %H:%M:%S")

        return rows
    except Error as e:
        print("Error querying health measurements:", e)
        return []
    finally:
        cursor.close()
        connection.close()


def get_user_latest_vitals(user_id: int) -> dict:
    """
    Returns the most recent reading for each standard physiological measurement type.
    """
    connection = get_connection()
    if connection is None:
        return {}

    cursor = connection.cursor(dictionary=True)
    try:
        query = """
            SELECT m1.id, m1.measurement_type, m1.value, m1.unit, m1.recorded_at, m1.source, m1.notes, m1.symptoms, m1.wellness_status
            FROM health_measurements m1
            INNER JOIN (
                SELECT measurement_type, MAX(id) as max_id
                FROM health_measurements
                WHERE user_id = %s
                GROUP BY measurement_type
            ) m2 ON m1.id = m2.max_id
            WHERE m1.user_id = %s
        """
        cursor.execute(query, (user_id, user_id))
        rows = cursor.fetchall()
        result = {}
        for r in rows:
            if r.get("recorded_at"):
                r["recorded_at"] = r["recorded_at"].strftime("%Y-%m-%d %H:%M:%S")
            result[r["measurement_type"]] = r
        return result
    except Error as e:
        print("Error getting latest vitals:", e)
        return {}
    finally:
        cursor.close()
        connection.close()


def delete_health_measurement(user_id: int, measurement_id: int) -> bool:
    """Delete a measurement ensuring strict user ownership."""
    connection = get_connection()
    if connection is None:
        return False

    cursor = connection.cursor()
    try:
        query = """
            DELETE FROM health_measurements
            WHERE id = %s AND user_id = %s
        """
        cursor.execute(query, (measurement_id, user_id))
        connection.commit()
        return cursor.rowcount > 0
    except Error as e:
        connection.rollback()
        print("Error deleting health measurement:", e)
        return False
    finally:
        cursor.close()
        connection.close()


# ==========================================
# HEALTH RISK ASSESSMENTS (PHASE 3)
# ==========================================

def save_health_risk_assessment(
    user_id: int,
    risk_level: str,
    risk_score: int,
    factors: Any,
    explanation: str,
    recommended_action: str = None
) -> bool:
    """Save an AI Triage Risk Indicator record for an authenticated user."""
    connection = get_connection()
    if connection is None:
        return False

    cursor = connection.cursor()
    try:
        factors_str = json.dumps(factors) if not isinstance(factors, str) else factors
        query = """
            INSERT INTO health_risk_assessments
            (user_id, risk_level, risk_score, factors, explanation, recommended_action)
            VALUES (%s, %s, %s, %s, %s, %s)
        """
        cursor.execute(
            query,
            (user_id, risk_level, int(risk_score), factors_str, explanation, recommended_action)
        )
        connection.commit()
        return True
    except Error as e:
        print("Error saving health risk assessment:", e)
        return False
    finally:
        cursor.close()
        connection.close()


def get_latest_health_risk_assessment(user_id: int) -> dict:
    """Retrieve the most recent AI Triage Risk assessment for the user."""
    connection = get_connection()
    if connection is None:
        return None

    cursor = connection.cursor(dictionary=True)
    try:
        query = """
            SELECT id, user_id, risk_level, risk_score, factors, explanation, recommended_action, created_at
            FROM health_risk_assessments
            WHERE user_id = %s
            ORDER BY created_at DESC
            LIMIT 1
        """
        cursor.execute(query, (user_id,))
        row = cursor.fetchone()
        if row:
            if row.get("created_at"):
                row["created_at"] = row["created_at"].strftime("%Y-%m-%d %H:%M:%S")
            try:
                row["factors"] = json.loads(row["factors"])
            except Exception:
                pass
        return row
    except Error as e:
        print("Error getting latest risk assessment:", e)
        return None
    finally:
        cursor.close()
        connection.close()


def get_user_health_risk_history(user_id: int, limit: int = 15) -> list:
    """Retrieve historical AI Triage Risk assessments for the user."""
    connection = get_connection()
    if connection is None:
        return []

    cursor = connection.cursor(dictionary=True)
    try:
        query = """
            SELECT id, user_id, risk_level, risk_score, factors, explanation, recommended_action, created_at
            FROM health_risk_assessments
            WHERE user_id = %s
            ORDER BY created_at DESC
            LIMIT %s
        """
        cursor.execute(query, (user_id, limit))
        rows = cursor.fetchall()
        for r in rows:
            if r.get("created_at"):
                r["created_at"] = r["created_at"].strftime("%Y-%m-%d %H:%M:%S")
            try:
                r["factors"] = json.loads(r["factors"])
            except Exception:
                pass
        return rows
    except Error as e:
        print("Error querying risk assessment history:", e)
        return []
    finally:
        cursor.close()
        connection.close()


# ==========================================
# MEDICAL REPORTS (PHASE 4)
# ==========================================

def save_medical_report(
    user_id: int,
    file_name: str,
    file_type: str,
    report_type: str = "General Lab Report",
    report_date: str = None,
    extracted_parameters: Any = None,
    abnormal_count: int = 0,
    summary: str = "",
    plain_language_explanation: str = "",
    doctor_questions: Any = None,
    symptom_correlations: str = "",
    overall_urgency: str = "ROUTINE"
) -> int:
    """Save an analyzed medical report for an authenticated user."""
    connection = get_connection()
    if connection is None:
        return 0

    cursor = connection.cursor()
    try:
        params_str = json.dumps(extracted_parameters) if not isinstance(extracted_parameters, str) else extracted_parameters
        questions_str = json.dumps(doctor_questions) if not isinstance(doctor_questions, str) else doctor_questions

        query = """
            INSERT INTO medical_reports
            (user_id, file_name, file_type, report_type, report_date, extracted_parameters,
             abnormal_count, summary, plain_language_explanation, doctor_questions, symptom_correlations, overall_urgency)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
        """
        cursor.execute(
            query,
            (user_id, file_name, file_type, report_type, report_date, params_str,
             int(abnormal_count), summary, plain_language_explanation, questions_str, symptom_correlations, overall_urgency)
        )
        connection.commit()
        return cursor.lastrowid
    except Error as e:
        print("Error saving medical report:", e)
        return 0
    finally:
        cursor.close()
        connection.close()


def get_user_medical_reports(user_id: int, limit: int = 20) -> list:
    """Retrieve all analyzed medical reports for a user."""
    connection = get_connection()
    if connection is None:
        return []

    cursor = connection.cursor(dictionary=True)
    try:
        query = """
            SELECT id, user_id, file_name, file_type, report_type, report_date,
                   extracted_parameters, abnormal_count, summary, plain_language_explanation,
                   doctor_questions, symptom_correlations, overall_urgency, created_at
            FROM medical_reports
            WHERE user_id = %s
            ORDER BY created_at DESC
            LIMIT %s
        """
        cursor.execute(query, (user_id, limit))
        rows = cursor.fetchall()
        for r in rows:
            if r.get("created_at"):
                r["created_at"] = r["created_at"].strftime("%Y-%m-%d %H:%M:%S")
            try:
                r["extracted_parameters"] = json.loads(r["extracted_parameters"])
            except Exception:
                pass
            try:
                r["doctor_questions"] = json.loads(r["doctor_questions"])
            except Exception:
                pass
        return rows
    except Error as e:
        print("Error retrieving user medical reports:", e)
        return []
    finally:
        cursor.close()
        connection.close()


def get_medical_report_by_id(user_id: int, report_id: int) -> dict:
    """Retrieve a single medical report by ID with strict user isolation."""
    connection = get_connection()
    if connection is None:
        return None

    cursor = connection.cursor(dictionary=True)
    try:
        query = """
            SELECT id, user_id, file_name, file_type, report_type, report_date,
                   extracted_parameters, abnormal_count, summary, plain_language_explanation,
                   doctor_questions, symptom_correlations, overall_urgency, created_at
            FROM medical_reports
            WHERE id = %s AND user_id = %s
            LIMIT 1
        """
        cursor.execute(query, (report_id, user_id))
        row = cursor.fetchone()
        if row:
            if row.get("created_at"):
                row["created_at"] = row["created_at"].strftime("%Y-%m-%d %H:%M:%S")
            try:
                row["extracted_parameters"] = json.loads(row["extracted_parameters"])
            except Exception:
                pass
            try:
                row["doctor_questions"] = json.loads(row["doctor_questions"])
            except Exception:
                pass
        return row
    except Error as e:
        print("Error retrieving medical report by ID:", e)
        return None
    finally:
        cursor.close()
        connection.close()


def delete_medical_report(user_id: int, report_id: int) -> bool:
    """Delete a medical report ensuring strict user ownership."""
    connection = get_connection()
    if connection is None:
        return False

    cursor = connection.cursor()
    try:
        query = "DELETE FROM medical_reports WHERE id = %s AND user_id = %s"
        cursor.execute(query, (report_id, user_id))
        connection.commit()
        return cursor.rowcount > 0
    except Error as e:
        connection.rollback()
        print("Error deleting medical report:", e)
        return False
    finally:
        cursor.close()
        connection.close()


# ==========================================
# USER MEDICATIONS (PHASE 5)
# ==========================================

def add_user_medication(
    user_id: int,
    name: str,
    dosage: str,
    frequency: str,
    time_of_day: str = "Morning",
    instructions: str = None,
    food_warnings: str = None,
    purpose: str = None
) -> int:
    """Add a medication to the patient's active regimen."""
    if purpose and not instructions:
        instructions = purpose
    connection = get_connection()
    if connection is None:
        return 0

    cursor = connection.cursor()
    try:
        query = """
            INSERT INTO user_medications
            (user_id, name, dosage, frequency, time_of_day, instructions, food_warnings, is_active)
            VALUES (%s, %s, %s, %s, %s, %s, %s, TRUE)
        """
        cursor.execute(
            query,
            (user_id, name.strip(), dosage.strip(), frequency.strip(), time_of_day.strip(), instructions, food_warnings)
        )
        connection.commit()
        return cursor.lastrowid
    except Error as e:
        print("Error adding user medication:", e)
        return 0
    finally:
        cursor.close()
        connection.close()


def get_user_medications(user_id: int, active_only: bool = True) -> list:
    """Retrieve all medications for an authenticated user."""
    connection = get_connection()
    if connection is None:
        return []

    cursor = connection.cursor(dictionary=True)
    try:
        if active_only:
            query = """
                SELECT id, user_id, name, dosage, frequency, time_of_day, instructions, food_warnings, is_active, created_at
                FROM user_medications
                WHERE user_id = %s AND is_active = TRUE
                ORDER BY FIELD(time_of_day, 'Morning', 'Afternoon', 'Evening', 'Night'), name ASC
            """
            cursor.execute(query, (user_id,))
        else:
            query = """
                SELECT id, user_id, name, dosage, frequency, time_of_day, instructions, food_warnings, is_active, created_at
                FROM user_medications
                WHERE user_id = %s
                ORDER BY created_at DESC
            """
            cursor.execute(query, (user_id,))

        rows = cursor.fetchall()
        for r in rows:
            if r.get("created_at"):
                r["created_at"] = r["created_at"].strftime("%Y-%m-%d %H:%M:%S")
        return rows
    except Error as e:
        print("Error getting user medications:", e)
        return []
    finally:
        cursor.close()
        connection.close()


def update_user_medication(
    user_id: int,
    medication_id: int,
    name: str = None,
    dosage: str = None,
    frequency: str = None,
    time_of_day: str = None,
    instructions: str = None,
    food_warnings: str = None,
    is_active: bool = None
) -> bool:
    """Update a patient's medication record."""
    connection = get_connection()
    if connection is None:
        return False

    cursor = connection.cursor()
    try:
        updates = []
        params = []
        if name is not None:
            updates.append("name = %s")
            params.append(name.strip())
        if dosage is not None:
            updates.append("dosage = %s")
            params.append(dosage.strip())
        if frequency is not None:
            updates.append("frequency = %s")
            params.append(frequency.strip())
        if time_of_day is not None:
            updates.append("time_of_day = %s")
            params.append(time_of_day.strip())
        if instructions is not None:
            updates.append("instructions = %s")
            params.append(instructions)
        if food_warnings is not None:
            updates.append("food_warnings = %s")
            params.append(food_warnings)
        if is_active is not None:
            updates.append("is_active = %s")
            params.append(is_active)

        if not updates:
            return True

        params.extend([medication_id, user_id])
        query = f"UPDATE user_medications SET {', '.join(updates)} WHERE id = %s AND user_id = %s"
        cursor.execute(query, tuple(params))
        connection.commit()
        return cursor.rowcount > 0
    except Error as e:
        connection.rollback()
        print("Error updating medication:", e)
        return False
    finally:
        cursor.close()
        connection.close()


def delete_user_medication(user_id: int, medication_id: int) -> bool:
    """Deactivate or remove medication ensuring strict user ownership."""
    connection = get_connection()
    if connection is None:
        return False

    cursor = connection.cursor()
    try:
        query = "DELETE FROM user_medications WHERE id = %s AND user_id = %s"
        cursor.execute(query, (medication_id, user_id))
        connection.commit()
        return cursor.rowcount > 0
    except Error as e:
        connection.rollback()
        print("Error deleting medication:", e)
        return False
    finally:
        cursor.close()
        connection.close()


def log_medication_dose(
    user_id: int,
    medication_id: int,
    scheduled_date: str,
    time_of_day: str,
    status: str = "taken"
) -> bool:
    """Record status (taken, missed, pending) for a scheduled dose."""
    connection = get_connection()
    if connection is None:
        return False

    cursor = connection.cursor()
    try:
        # Check if log already exists for this slot
        check_query = """
            SELECT id FROM medication_logs
            WHERE user_id = %s AND medication_id = %s AND scheduled_date = %s AND time_of_day = %s
            LIMIT 1
        """
        cursor.execute(check_query, (user_id, medication_id, scheduled_date, time_of_day))
        existing = cursor.fetchone()

        if existing:
            update_query = """
                UPDATE medication_logs
                SET status = %s, logged_at = CURRENT_TIMESTAMP
                WHERE id = %s
            """
            cursor.execute(update_query, (status, existing[0]))
        else:
            insert_query = """
                INSERT INTO medication_logs
                (user_id, medication_id, scheduled_date, time_of_day, status)
                VALUES (%s, %s, %s, %s, %s)
            """
            cursor.execute(insert_query, (user_id, medication_id, scheduled_date, time_of_day, status))

        connection.commit()
        return True
    except Error as e:
        connection.rollback()
        print("Error logging medication dose:", e)
        return False
    finally:
        cursor.close()
        connection.close()


def get_medication_logs_for_date(user_id: int, scheduled_date: str) -> list:
    """Retrieve logged medication statuses for a user on a given date."""
    connection = get_connection()
    if connection is None:
        return []

    cursor = connection.cursor(dictionary=True)
    try:
        query = """
            SELECT id, user_id, medication_id, scheduled_date, time_of_day, status, logged_at
            FROM medication_logs
            WHERE user_id = %s AND scheduled_date = %s
        """
        cursor.execute(query, (user_id, scheduled_date))
        rows = cursor.fetchall()
        for r in rows:
            if r.get("scheduled_date"):
                r["scheduled_date"] = str(r["scheduled_date"])
            if r.get("logged_at"):
                r["logged_at"] = r["logged_at"].strftime("%Y-%m-%d %H:%M:%S")
        return rows
    except Error as e:
        print("Error getting medication logs:", e)
        return []
    finally:
        cursor.close()
        connection.close()


# ==========================================
# WELLNESS CHECKINS (PHASE 6)
# ==========================================

def save_wellness_checkin(
    user_id: int,
    checkin_date: str,
    water_glasses: int = 0,
    sleep_hours: float = 0.0,
    mood: str = "Neutral",
    energy_level: str = "Medium",
    notes: str = None
) -> bool:
    """Record or update daily wellness checkin."""
    connection = get_connection()
    if connection is None:
        return False

    cursor = connection.cursor()
    try:
        query = """
            INSERT INTO wellness_checkins
            (user_id, checkin_date, water_glasses, sleep_hours, mood, energy_level, notes)
            VALUES (%s, %s, %s, %s, %s, %s, %s)
            ON DUPLICATE KEY UPDATE
            water_glasses = VALUES(water_glasses),
            sleep_hours = VALUES(sleep_hours),
            mood = VALUES(mood),
            energy_level = VALUES(energy_level),
            notes = VALUES(notes)
        """
        cursor.execute(query, (user_id, checkin_date, int(water_glasses), float(sleep_hours), mood, energy_level, notes))
        connection.commit()
        return True
    except Error as e:
        connection.rollback()
        print("Error saving wellness checkin:", e)
        return False
    finally:
        cursor.close()
        connection.close()


def get_user_wellness_checkins(user_id: int, days: int = 14) -> list:
    """Retrieve historical daily wellness checkins for the authenticated user."""
    connection = get_connection()
    if connection is None:
        return []

    cursor = connection.cursor(dictionary=True)
    try:
        query = """
            SELECT id, user_id, checkin_date, water_glasses, sleep_hours, mood, energy_level, notes, created_at
            FROM wellness_checkins
            WHERE user_id = %s
            ORDER BY checkin_date DESC
            LIMIT %s
        """
        cursor.execute(query, (user_id, days))
        rows = cursor.fetchall()
        for r in rows:
            if r.get("checkin_date"):
                r["checkin_date"] = str(r["checkin_date"])
            if r.get("created_at"):
                r["created_at"] = r["created_at"].strftime("%Y-%m-%d %H:%M:%S")
        return rows
    except Error as e:
        print("Error querying wellness checkins:", e)
        return []
    finally:
        cursor.close()
        connection.close()


# ==========================================
# HEALTHCARE FACILITIES SEED (PHASE 7)
# ==========================================

DEFAULT_FACILITIES = [
    # Bhubaneswar & Odisha
    {
        "name": "AIIMS Bhubaneswar Hospital & Trauma Center",
        "facility_type": "hospital",
        "address": "Sijua, Patrapada, Bhubaneswar",
        "city": "Bhubaneswar",
        "state": "Odisha",
        "pincode": "751019",
        "phone": "0674-2476789",
        "latitude": 20.2312,
        "longitude": 85.7766,
        "is_24x7": True,
        "has_emergency": True,
        "has_icu": True,
        "rating": 4.8,
        "services_offered": "Level-1 Trauma, 24x7 Emergency, ICU, Cardiac Care, Stroke Unit, Blood Bank",
        "google_maps_url": "https://maps.google.com/?q=AIIMS+Bhubaneswar"
    },
    {
        "name": "Apollo Hospitals Bhubaneswar",
        "facility_type": "hospital",
        "address": "Plot No. 251, Sainik School Road, Unit 15",
        "city": "Bhubaneswar",
        "state": "Odisha",
        "pincode": "751005",
        "phone": "0674-6661016",
        "latitude": 20.3150,
        "longitude": 85.8249,
        "is_24x7": True,
        "has_emergency": True,
        "has_icu": True,
        "rating": 4.7,
        "services_offered": "24x7 Emergency, Trauma, Critical Care, Cardiology, Neurology, Pharmacy",
        "google_maps_url": "https://maps.google.com/?q=Apollo+Hospitals+Bhubaneswar"
    },
    {
        "name": "KIMS Hospital (Kalinga Institute of Medical Sciences)",
        "facility_type": "hospital",
        "address": "KIIT University Campus 5, Patia",
        "city": "Bhubaneswar",
        "state": "Odisha",
        "pincode": "751024",
        "phone": "0674-2725472",
        "latitude": 20.3541,
        "longitude": 85.8193,
        "is_24x7": True,
        "has_emergency": True,
        "has_icu": True,
        "rating": 4.6,
        "services_offered": "Multispeciality 24x7 Emergency, Pediatric ICU, Trauma, Dialysis, Blood Bank",
        "google_maps_url": "https://maps.google.com/?q=KIMS+Hospital+Bhubaneswar"
    },
    {
        "name": "AMRI Hospital Bhubaneswar",
        "facility_type": "hospital",
        "address": "Plot No. 1, Khandagiri - Chandaka Road, Khandagiri",
        "city": "Bhubaneswar",
        "state": "Odisha",
        "pincode": "751030",
        "phone": "0674-6666600",
        "latitude": 20.2608,
        "longitude": 85.7892,
        "is_24x7": True,
        "has_emergency": True,
        "has_icu": True,
        "rating": 4.5,
        "services_offered": "Emergency & Trauma, Cardiac Sciences, Neuro Sciences, Orthopaedics",
        "google_maps_url": "https://maps.google.com/?q=AMRI+Hospital+Bhubaneswar"
    },
    {
        "name": "Apollo 24/7 Pharmacy Saheed Nagar",
        "facility_type": "pharmacy",
        "address": "Shop No. 12, Janpath Road, Saheed Nagar",
        "city": "Bhubaneswar",
        "state": "Odisha",
        "pincode": "751007",
        "phone": "0674-2540112",
        "latitude": 20.2921,
        "longitude": 85.8456,
        "is_24x7": True,
        "has_emergency": False,
        "has_icu": False,
        "rating": 4.6,
        "services_offered": "24x7 Prescription Medicines, OTC Health, First Aid, Medical Supplies",
        "google_maps_url": "https://maps.google.com/?q=Apollo+Pharmacy+Saheed+Nagar+Bhubaneswar"
    },
    {
        "name": "MedPlus 24x7 Pharmacy Patia",
        "facility_type": "pharmacy",
        "address": "Opposite Big Bazaar, Patia Main Road",
        "city": "Bhubaneswar",
        "state": "Odisha",
        "pincode": "751024",
        "phone": "0674-2741999",
        "latitude": 20.3520,
        "longitude": 85.8180,
        "is_24x7": True,
        "has_emergency": False,
        "has_icu": False,
        "rating": 4.5,
        "services_offered": "24 Hours Medicine Dispensing, Home Delivery, Surgical Supplies",
        "google_maps_url": "https://maps.google.com/?q=MedPlus+Patia+Bhubaneswar"
    },
    {
        "name": "Dr. Lal PathLabs & Diagnostics",
        "facility_type": "diagnostic_lab",
        "address": "Janpath, Near Ram Mandir, Master Canteen",
        "city": "Bhubaneswar",
        "state": "Odisha",
        "pincode": "751001",
        "phone": "0674-2531020",
        "latitude": 20.2965,
        "longitude": 85.8432,
        "is_24x7": False,
        "has_emergency": False,
        "has_icu": False,
        "rating": 4.6,
        "services_offered": "Blood Pathology, Hormone Tests, Biochemistry, Digital X-Ray, ECG",
        "google_maps_url": "https://maps.google.com/?q=Dr+Lal+Pathlabs+Bhubaneswar"
    },
    {
        "name": "SCB Medical College & Hospital",
        "facility_type": "hospital",
        "address": "Manglabag, Cuttack",
        "city": "Cuttack",
        "state": "Odisha",
        "pincode": "753007",
        "phone": "0671-2414080",
        "latitude": 20.4682,
        "longitude": 85.8792,
        "is_24x7": True,
        "has_emergency": True,
        "has_icu": True,
        "rating": 4.5,
        "services_offered": "Premier Tertiary Care, 24x7 Emergency Trauma, ICU, Burn Unit, Blood Bank",
        "google_maps_url": "https://maps.google.com/?q=SCB+Medical+College+Cuttack"
    },
    # Delhi / NCR
    {
        "name": "AIIMS New Delhi Apex Trauma Center",
        "facility_type": "hospital",
        "address": "Sri Aurobindo Marg, Ansari Nagar",
        "city": "New Delhi",
        "state": "Delhi",
        "pincode": "110029",
        "phone": "011-26588500",
        "latitude": 28.5672,
        "longitude": 77.2100,
        "is_24x7": True,
        "has_emergency": True,
        "has_icu": True,
        "rating": 4.9,
        "services_offered": "Apex Trauma Center, 24x7 Resuscitation, Multi-organ ICU, Burn Care",
        "google_maps_url": "https://maps.google.com/?q=AIIMS+New+Delhi"
    },
    {
        "name": "Max Super Speciality Hospital Saket",
        "facility_type": "hospital",
        "address": "1, 2, Press Enclave Marg, Saket",
        "city": "New Delhi",
        "state": "Delhi",
        "pincode": "110017",
        "phone": "011-26515050",
        "latitude": 28.5273,
        "longitude": 77.2114,
        "is_24x7": True,
        "has_emergency": True,
        "has_icu": True,
        "rating": 4.7,
        "services_offered": "24x7 Cardiac Emergency, Stroke Team, Neuro ICU, Emergency Ambulance",
        "google_maps_url": "https://maps.google.com/?q=Max+Hospital+Saket"
    },
    # Mumbai
    {
        "name": "KEM Hospital & Emergency Trauma Center",
        "facility_type": "hospital",
        "address": "Acharya Donde Marg, Parel",
        "city": "Mumbai",
        "state": "Maharashtra",
        "pincode": "400012",
        "phone": "022-24107000",
        "latitude": 18.9986,
        "longitude": 72.8428,
        "is_24x7": True,
        "has_emergency": True,
        "has_icu": True,
        "rating": 4.6,
        "services_offered": "24x7 Emergency Casualty, Critical Care, Trauma Unit, Ambulance",
        "google_maps_url": "https://maps.google.com/?q=KEM+Hospital+Mumbai"
    },
    # Bengaluru
    {
        "name": "Manipal Hospital Old Airport Road",
        "facility_type": "hospital",
        "address": "98, HAL Old Airport Rd, Kodihalli",
        "city": "Bengaluru",
        "state": "Karnataka",
        "pincode": "560017",
        "phone": "080-25024444",
        "latitude": 12.9592,
        "longitude": 77.6499,
        "is_24x7": True,
        "has_emergency": True,
        "has_icu": True,
        "rating": 4.8,
        "services_offered": "24x7 Emergency Medicine, Level 1 Trauma, Cardiac Arrest Team, Stroke Center",
        "google_maps_url": "https://maps.google.com/?q=Manipal+Hospital+Old+Airport+Road"
    },
    # Primary Health Centres (PHC)
    {
        "name": "Capital Primary Health Centre (PHC) Unit 4",
        "facility_type": "phc",
        "address": "Bhauma Nagar, Unit 4, Near Daily Market",
        "city": "Bhubaneswar",
        "state": "Odisha",
        "pincode": "751001",
        "phone": "0674-2391200",
        "latitude": 20.2785,
        "longitude": 85.8360,
        "is_24x7": True,
        "has_emergency": True,
        "has_icu": False,
        "rating": 4.3,
        "services_offered": "Outpatient Consultation, Essential Maternal Care, Routine Immunization, Primary Vitals Triage, Jan Aushadhi Generic Pharmacy",
        "google_maps_url": "https://maps.google.com/?q=PHC+Unit+4+Bhubaneswar"
    },
    # Clinics
    {
        "name": "Apollo Clinic & Family Health Center",
        "facility_type": "clinic",
        "address": "HIG-18, Phase 2, Chandrasekharpur",
        "city": "Bhubaneswar",
        "state": "Odisha",
        "pincode": "751016",
        "phone": "0674-2748800",
        "latitude": 20.3275,
        "longitude": 85.8120,
        "is_24x7": False,
        "has_emergency": False,
        "has_icu": False,
        "rating": 4.6,
        "services_offered": "Family Physician, Pediatrician, Chronic Care Review, Routine Blood Work, Telehealth Consultations",
        "google_maps_url": "https://maps.google.com/?q=Apollo+Clinic+Chandrasekharpur"
    },
    # Emergency Care
    {
        "name": "State Emergency & Trauma Resuscitation Center",
        "facility_type": "emergency",
        "address": "Capital Hospital Complex, Unit 6",
        "city": "Bhubaneswar",
        "state": "Odisha",
        "pincode": "751006",
        "phone": "0674-2391983",
        "latitude": 20.2640,
        "longitude": 85.8230,
        "is_24x7": True,
        "has_emergency": True,
        "has_icu": True,
        "rating": 4.7,
        "services_offered": "Dedicated 24x7 Resuscitation Bay, Cardiac Defibrillation, Level-2 Trauma, 108 Emergency Ambulance Station",
        "google_maps_url": "https://maps.google.com/?q=Capital+Hospital+Bhubaneswar"
    },
    # Health Camp
    {
        "name": "Community Health Outreach Camp - Khordha Mobile Unit",
        "facility_type": "health_camp",
        "address": "Baramunda Community Ground",
        "city": "Bhubaneswar",
        "state": "Odisha",
        "pincode": "751003",
        "phone": "0674-2354110",
        "latitude": 20.2740,
        "longitude": 85.7870,
        "is_24x7": False,
        "has_emergency": False,
        "has_icu": False,
        "rating": 4.4,
        "services_offered": "Free Multi-speciality Screening, Blood Pressure & Blood Glucose Checks, Eye Examination, Free Nutritional Kits",
        "google_maps_url": "https://maps.google.com/?q=Baramunda+Bhubaneswar"
    },
    # Campus Health Centre
    {
        "name": "KIIT University Health & Wellness Centre",
        "facility_type": "campus_health",
        "address": "Campus 3, KIIT Road, Patia",
        "city": "Bhubaneswar",
        "state": "Odisha",
        "pincode": "751024",
        "phone": "0674-2725113",
        "latitude": 20.3550,
        "longitude": 85.8160,
        "is_24x7": True,
        "has_emergency": True,
        "has_icu": False,
        "rating": 4.7,
        "services_offered": "Student & Faculty Acute Triage, 24x7 Campus Ambulance, Mental Health Counseling, Minor Surgery Dressing, Quarantine Ward",
        "google_maps_url": "https://maps.google.com/?q=KIIT+Campus+3"
    },
    # Occupational Health Unit
    {
        "name": "Infocity Occupational Health & Industrial Safety Unit",
        "facility_type": "occupational_health",
        "address": "Software Technology Parks of India (STPI) Complex, Chandaka Industrial Estate",
        "city": "Bhubaneswar",
        "state": "Odisha",
        "pincode": "751024",
        "phone": "0674-2300400",
        "latitude": 20.3620,
        "longitude": 85.8050,
        "is_24x7": True,
        "has_emergency": True,
        "has_icu": False,
        "rating": 4.5,
        "services_offered": "Workplace Injury Triage, Ergonomic Assessment, Pre-employment Medical Fitness, Chemical Hazard Emergency Protocol",
        "google_maps_url": "https://maps.google.com/?q=Infocity+Bhubaneswar"
    }
]


def _seed_healthcare_facilities(cursor):
    """Seed initial verified healthcare facilities if table is empty or missing types."""
    try:
        check_query = "SELECT id FROM healthcare_facilities WHERE name = %s LIMIT 1"
        insert_query = """
            INSERT INTO healthcare_facilities
            (name, facility_type, address, city, state, pincode, phone, latitude, longitude,
             is_24x7, has_emergency, has_icu, rating, services_offered, google_maps_url)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
        """
        seeded_count = 0
        for f in DEFAULT_FACILITIES:
            cursor.execute(check_query, (f["name"],))
            if not cursor.fetchone():
                cursor.execute(
                    insert_query,
                    (
                        f["name"], f["facility_type"], f["address"], f["city"], f["state"],
                        f["pincode"], f["phone"], f["latitude"], f["longitude"], f["is_24x7"],
                        f["has_emergency"], f["has_icu"], f["rating"], f["services_offered"], f["google_maps_url"]
                    )
                )
                seeded_count += 1
        if seeded_count > 0:
            print(f"Seeded {seeded_count} new verified healthcare facilities.")
    except Exception as e:
        print("Notice on facility seeding:", e)


# ==========================================
# HEALTHCARE FACILITIES CRUD (PHASE 7)
# ==========================================

def get_all_facilities(
    facility_type: str = None,
    city: str = None,
    emergency_only: bool = False,
    is_24x7: bool = False,
    limit: int = 100
) -> list:
    """Retrieve verified healthcare facilities with optional filtering."""
    connection = get_connection()
    if connection is None:
        return []

    cursor = connection.cursor(dictionary=True)
    try:
        where_clauses = []
        params = []

        if facility_type:
            where_clauses.append("facility_type = %s")
            params.append(facility_type.lower())

        if city:
            where_clauses.append("LOWER(city) = %s")
            params.append(city.lower().strip())

        if emergency_only:
            where_clauses.append("has_emergency = TRUE")

        if is_24x7:
            where_clauses.append("is_24x7 = TRUE")

        where_sql = f"WHERE {' AND '.join(where_clauses)}" if where_clauses else ""
        query = f"""
            SELECT id, name, facility_type, address, city, state, pincode, phone,
                   latitude, longitude, is_24x7, has_emergency, has_icu, rating,
                   services_offered, google_maps_url, created_at
            FROM healthcare_facilities
            {where_sql}
            ORDER BY has_emergency DESC, rating DESC
            LIMIT %s
        """
        params.append(int(limit))
        cursor.execute(query, tuple(params))
        rows = cursor.fetchall()

        # Convert decimals/floats for JSON serialization
        for r in rows:
            if "latitude" in r and r["latitude"] is not None:
                r["latitude"] = float(r["latitude"])
            if "longitude" in r and r["longitude"] is not None:
                r["longitude"] = float(r["longitude"])
            if r.get("created_at"):
                r["created_at"] = r["created_at"].strftime("%Y-%m-%d %H:%M:%S")

        return rows
    except Error as e:
        print("Error getting facilities:", e)
        return []
    finally:
        cursor.close()
        connection.close()


def get_facility_by_id(facility_id: int) -> dict:
    """Retrieve full details for a single healthcare facility."""
    connection = get_connection()
    if connection is None:
        return None

    cursor = connection.cursor(dictionary=True)
    try:
        query = """
            SELECT id, name, facility_type, address, city, state, pincode, phone,
                   latitude, longitude, is_24x7, has_emergency, has_icu, rating,
                   services_offered, google_maps_url, created_at
            FROM healthcare_facilities
            WHERE id = %s
            LIMIT 1
        """
        cursor.execute(query, (facility_id,))
        row = cursor.fetchone()
        if row:
            if "latitude" in row and row["latitude"] is not None:
                row["latitude"] = float(row["latitude"])
            if "longitude" in row and row["longitude"] is not None:
                row["longitude"] = float(row["longitude"])
            if row.get("created_at"):
                row["created_at"] = row["created_at"].strftime("%Y-%m-%d %H:%M:%S")
        return row
    except Error as e:
        print("Error retrieving facility by id:", e)
        return None
    finally:
        cursor.close()
        connection.close()


def save_user_facility(user_id: int, facility_id: int, notes: str = None) -> bool:
    """Save facility to patient's personal emergency / favorites directory."""
    connection = get_connection()
    if connection is None:
        return False

    cursor = connection.cursor()
    try:
        query = """
            INSERT INTO user_saved_facilities (user_id, facility_id, notes)
            VALUES (%s, %s, %s)
            ON DUPLICATE KEY UPDATE notes = VALUES(notes)
        """
        cursor.execute(query, (user_id, facility_id, notes))
        connection.commit()
        return True
    except Error as e:
        connection.rollback()
        print("Error saving user facility:", e)
        return False
    finally:
        cursor.close()
        connection.close()


def get_user_saved_facilities(user_id: int) -> list:
    """Retrieve all facilities saved by the authenticated patient."""
    connection = get_connection()
    if connection is None:
        return []

    cursor = connection.cursor(dictionary=True)
    try:
        query = """
            SELECT f.id, f.name, f.facility_type, f.address, f.city, f.state, f.pincode, f.phone,
                   f.latitude, f.longitude, f.is_24x7, f.has_emergency, f.has_icu, f.rating,
                   f.services_offered, f.google_maps_url, s.notes as user_notes, s.saved_at
            FROM user_saved_facilities s
            JOIN healthcare_facilities f ON s.facility_id = f.id
            WHERE s.user_id = %s
            ORDER BY s.saved_at DESC
        """
        cursor.execute(query, (user_id,))
        rows = cursor.fetchall()
        for r in rows:
            if "latitude" in r and r["latitude"] is not None:
                r["latitude"] = float(r["latitude"])
            if "longitude" in r and r["longitude"] is not None:
                r["longitude"] = float(r["longitude"])
            if r.get("saved_at"):
                r["saved_at"] = r["saved_at"].strftime("%Y-%m-%d %H:%M:%S")
        return rows
    except Error as e:
        print("Error getting saved facilities:", e)
        return []
    finally:
        cursor.close()
        connection.close()


def delete_user_saved_facility(user_id: int, facility_id: int) -> bool:
    """Remove facility from patient's saved favorites."""
    connection = get_connection()
    if connection is None:
        return False

    cursor = connection.cursor()
    try:
        query = "DELETE FROM user_saved_facilities WHERE user_id = %s AND facility_id = %s"
        cursor.execute(query, (user_id, facility_id))
        connection.commit()
        return cursor.rowcount > 0
    except Error as e:
        connection.rollback()
        print("Error deleting saved facility:", e)
        return False
    finally:
        cursor.close()
        connection.close()


# ============================================================
# FACILITY PROFILES SEEDING & INTELLIGENCE
# ============================================================

DEFAULT_FACILITY_PROFILES = [
    {
        "name": "Capital District Hospital (ED & Trauma)",
        "facility_type": "GOVERNMENT_HOSPITAL",
        "code": "DH-CAP-001",
        "district": "Khordha",
        "state": "Odisha",
        "pincode": "751001",
        "active_mode": "STANDARD",
        "total_beds": 350,
        "icu_beds": 40,
        "emergency_contact": "108"
    },
    {
        "name": "Primary Health Centre Jatni",
        "facility_type": "PHC",
        "code": "PHC-JAT-002",
        "district": "Khordha",
        "state": "Odisha",
        "pincode": "752050",
        "active_mode": "STANDARD",
        "total_beds": 12,
        "icu_beds": 0,
        "emergency_contact": "108"
    },
    {
        "name": "Community Health Centre Khordha",
        "facility_type": "CHC",
        "code": "CHC-KHO-003",
        "district": "Khordha",
        "state": "Odisha",
        "pincode": "752055",
        "active_mode": "STANDARD",
        "total_beds": 50,
        "icu_beds": 4,
        "emergency_contact": "108"
    },
    {
        "name": "Utkal University Campus Health Centre",
        "facility_type": "CAMPUS_HEALTH",
        "code": "CAMP-UTK-004",
        "district": "Khordha",
        "state": "Odisha",
        "pincode": "751004",
        "active_mode": "CAMPUS",
        "total_beds": 15,
        "icu_beds": 1,
        "emergency_contact": "0674-2567389"
    },
    {
        "name": "Chandaka Industrial Area Occupational Health Unit",
        "facility_type": "OCCUPATIONAL_HEALTH",
        "code": "OCC-CHN-005",
        "district": "Khordha",
        "state": "Odisha",
        "pincode": "751024",
        "active_mode": "OCCUPATIONAL",
        "total_beds": 20,
        "icu_beds": 2,
        "emergency_contact": "108"
    },
    {
        "name": "Bhubaneswar Rural Public Health Outreach Camp",
        "facility_type": "PUBLIC_HEALTH_CAMP",
        "code": "CAMP-RUR-006",
        "district": "Khordha",
        "state": "Odisha",
        "pincode": "751028",
        "active_mode": "RAPID_INTAKE",
        "total_beds": 10,
        "icu_beds": 0,
        "emergency_contact": "108"
    }
]


def _seed_facility_profiles(cursor):
    """Seed initial facility profiles if table is empty."""
    try:
        cursor.execute("SELECT COUNT(*) FROM facility_profiles")
        count = cursor.fetchone()[0]
        if count == 0:
            query = """
                INSERT INTO facility_profiles
                (name, facility_type, code, district, state, pincode, active_mode, total_beds, icu_beds, emergency_contact)
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
            """
            for f in DEFAULT_FACILITY_PROFILES:
                cursor.execute(
                    query,
                    (
                        f["name"], f["facility_type"], f["code"], f["district"],
                        f["state"], f["pincode"], f["active_mode"], f["total_beds"],
                        f["icu_beds"], f["emergency_contact"]
                    )
                )
            print(f"Seeded {len(DEFAULT_FACILITY_PROFILES)} facility profiles.")
    except Exception as e:
        print("Notice seeding facility profiles:", e)


# ============================================================
# SMART HEALTHCARE QUEUE & TRIAGE SESSION PERSISTENCE
# ============================================================

def create_triage_session_and_note(
    session_uuid: str,
    user_id: Optional[int],
    patient_name: str,
    patient_age: Optional[int] = None,
    patient_gender: Optional[str] = None,
    facility_type: str = "GOVERNMENT_HOSPITAL",
    facility_id: Optional[int] = None,
    language: str = "en",
    status: str = "PENDING_REVIEW",
    triage_level: str = "ROUTINE",
    is_emergency: bool = False,
    source_channel: str = "SANA_WEB",
    chief_complaint: str = "",
    patient_reported: Optional[Dict[str, Any]] = None,
    ai_extracted: Optional[Dict[str, Any]] = None,
    ai_summary: Optional[Dict[str, Any]] = None,
    safety_flags: Optional[Dict[str, Any]] = None,
    vitals_snapshot: Optional[List[Dict[str, Any]]] = None,
    report_findings: Optional[List[Dict[str, Any]]] = None,
    image_obs: Optional[List[Dict[str, Any]]] = None,
    missing_info: Optional[str] = None,
    suggested_questions: Optional[str] = None,
    referral_considerations: Optional[str] = None,
    source_metadata: Optional[Dict[str, Any]] = None
) -> Optional[int]:
    """Saves complete triage session and structured clinical note atomically."""
    connection = get_connection()
    if connection is None:
        return None

    cursor = connection.cursor()
    try:
        session_query = """
            INSERT INTO triage_sessions
            (session_uuid, user_id, patient_name, patient_age, patient_gender,
             facility_type, facility_id, language, status, triage_level,
             is_emergency, source_channel)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
        """
        cursor.execute(
            session_query,
            (
                session_uuid, user_id, patient_name, patient_age, patient_gender,
                facility_type, facility_id, language, status, triage_level,
                is_emergency, source_channel
            )
        )
        session_id = cursor.lastrowid

        note_query = """
            INSERT INTO triage_notes
            (session_id, chief_complaint, patient_reported_info, ai_extracted_info,
             ai_generated_summary, safety_flags, vitals_snapshot, report_findings,
             image_observations, missing_information, suggested_questions,
             referral_considerations, source_metadata)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
        """
        cursor.execute(
            note_query,
            (
                session_id,
                chief_complaint,
                json.dumps(patient_reported or {}),
                json.dumps(ai_extracted or {}),
                json.dumps(ai_summary or {}),
                json.dumps(safety_flags or {}),
                json.dumps(vitals_snapshot or []),
                json.dumps(report_findings or []),
                json.dumps(image_obs or []),
                missing_info,
                suggested_questions,
                referral_considerations,
                json.dumps(source_metadata or {})
            )
        )

        connection.commit()
        return session_id
    except Error as e:
        connection.rollback()
        print("Error saving triage session and note:", e)
        return None
    finally:
        cursor.close()
        connection.close()


def get_triage_queue(
    filter_type: str = "all",
    facility_id: Optional[int] = None,
    search: Optional[str] = None,
    limit: int = 50,
    offset: int = 0
) -> List[Dict[str, Any]]:
    """
    Retrieves clinical cases for Smart Healthcare Queue with filtering:
    - 'all': All cases
    - 'emergency': Emergency 🔴 cases
    - 'urgent': Urgent 🟠 cases
    - 'routine': Routine 🟢 cases
    - 'review_needed': Pending clinical staff review
    """
    connection = get_connection()
    if connection is None:
        return []

    cursor = connection.cursor(dictionary=True)
    try:
        where_clauses = ["1=1"]
        params = []

        if filter_type == "emergency":
            where_clauses.append("(s.triage_level = 'EMERGENCY' OR s.is_emergency = TRUE)")
        elif filter_type == "urgent":
            where_clauses.append("s.triage_level = 'URGENT'")
        elif filter_type == "routine":
            where_clauses.append("s.triage_level = 'ROUTINE'")
        elif filter_type == "review_needed":
            where_clauses.append("s.status = 'PENDING_REVIEW'")

        if facility_id:
            where_clauses.append("s.facility_id = %s")
            params.append(facility_id)

        if search:
            where_clauses.append("(s.patient_name LIKE %s OR n.chief_complaint LIKE %s)")
            params.extend([f"%{search}%", f"%{search}%"])

        query = f"""
            SELECT s.id, s.session_uuid, s.user_id, s.patient_name, s.patient_age,
                   s.patient_gender, s.facility_type, s.language, s.status, s.triage_level,
                   s.is_emergency, s.assigned_to, s.created_at, s.updated_at,
                   u.full_name as reviewer_name,
                   n.chief_complaint, n.reviewer_decision, n.reviewed_at
            FROM triage_sessions s
            LEFT JOIN triage_notes n ON s.id = n.session_id
            LEFT JOIN users u ON s.assigned_to = u.id
            WHERE {" AND ".join(where_clauses)}
            ORDER BY
                CASE WHEN s.triage_level = 'EMERGENCY' OR s.is_emergency = TRUE THEN 1
                     WHEN s.triage_level = 'URGENT' THEN 2
                     ELSE 3 END ASC,
                s.created_at DESC
            LIMIT %s OFFSET %s
        """
        params.extend([limit, offset])
        cursor.execute(query, tuple(params))
        rows = cursor.fetchall()
        for r in rows:
            if r.get("created_at"):
                r["created_at"] = r["created_at"].strftime("%Y-%m-%d %H:%M:%S")
            if r.get("updated_at"):
                r["updated_at"] = r["updated_at"].strftime("%Y-%m-%d %H:%M:%S")
            if r.get("reviewed_at"):
                r["reviewed_at"] = r["reviewed_at"].strftime("%Y-%m-%d %H:%M:%S")
        return rows
    except Error as e:
        print("Error getting triage queue:", e)
        return []
    finally:
        cursor.close()
        connection.close()


def get_triage_session_detail(session_id: int) -> Optional[Dict[str, Any]]:
    """Retrieves full multimodal evidence bundle, structured triage note, and review history."""
    connection = get_connection()
    if connection is None:
        return None

    cursor = connection.cursor(dictionary=True)
    try:
        query = """
            SELECT s.*, u.full_name as reviewer_name, u.role as reviewer_role,
                   n.chief_complaint, n.patient_reported_info, n.ai_extracted_info,
                   n.ai_generated_summary, n.safety_flags, n.vitals_snapshot,
                   n.report_findings, n.image_observations, n.missing_information,
                   n.suggested_questions, n.referral_considerations, n.reviewer_decision,
                   n.reviewer_notes, n.reviewed_at, n.source_metadata
            FROM triage_sessions s
            LEFT JOIN triage_notes n ON s.id = n.session_id
            LEFT JOIN users u ON s.assigned_to = u.id
            WHERE s.id = %s
        """
        cursor.execute(query, (session_id,))
        row = cursor.fetchone()
        if not row:
            return None

        # Parse JSON fields
        json_fields = [
            "patient_reported_info", "ai_extracted_info", "ai_generated_summary",
            "safety_flags", "vitals_snapshot", "report_findings",
            "image_observations", "source_metadata"
        ]
        for field in json_fields:
            if row.get(field):
                try:
                    row[field] = json.loads(row[field])
                except Exception:
                    pass

        # Retrieve reviewer audit actions
        actions_query = """
            SELECT a.*, u.full_name as reviewer_name, u.role as reviewer_role
            FROM reviewer_actions a
            JOIN users u ON a.reviewer_id = u.id
            WHERE a.session_id = %s
            ORDER BY a.created_at ASC
        """
        cursor.execute(actions_query, (session_id,))
        actions = cursor.fetchall()
        for act in actions:
            if act.get("created_at"):
                act["created_at"] = act["created_at"].strftime("%Y-%m-%d %H:%M:%S")
        row["reviewer_actions"] = actions

        if row.get("created_at"):
            row["created_at"] = row["created_at"].strftime("%Y-%m-%d %H:%M:%S")
        if row.get("updated_at"):
            row["updated_at"] = row["updated_at"].strftime("%Y-%m-%d %H:%M:%S")
        if row.get("reviewed_at"):
            row["reviewed_at"] = row["reviewed_at"].strftime("%Y-%m-%d %H:%M:%S")

        return row
    except Error as e:
        print("Error getting triage session detail:", e)
        return None
    finally:
        cursor.close()
        connection.close()


def assign_triage_session(session_id: int, reviewer_id: int) -> bool:
    """Assigns case to a qualified nurse or medical officer."""
    connection = get_connection()
    if connection is None:
        return False

    cursor = connection.cursor()
    try:
        # Update session assignment
        cursor.execute(
            """
            UPDATE triage_sessions
            SET assigned_to = %s, status = 'UNDER_REVIEW'
            WHERE id = %s
            """,
            (reviewer_id, session_id)
        )

        # Log action
        cursor.execute(
            """
            INSERT INTO reviewer_actions
            (session_id, reviewer_id, action_type, previous_status, new_status, notes)
            VALUES (%s, %s, 'ASSIGNED', 'PENDING_REVIEW', 'UNDER_REVIEW', 'Case assigned to reviewer')
            """,
            (session_id, reviewer_id)
        )

        connection.commit()
        return True
    except Error as e:
        connection.rollback()
        print("Error assigning triage session:", e)
        return False
    finally:
        cursor.close()
        connection.close()


def save_triage_review_decision(
    session_id: int,
    reviewer_id: int,
    decision: str,
    reviewer_notes: str,
    new_status: str = "APPROVED",
    new_triage_level: Optional[str] = None
) -> bool:
    """
    Saves a human clinical review decision:
    Decisions: 'APPROVED', 'MODIFIED', 'REQUEST_INFO', 'ESCALATED', 'REFERRED'
    """
    connection = get_connection()
    if connection is None:
        return False

    cursor = connection.cursor(dictionary=True)
    try:
        # Get current status
        cursor.execute("SELECT status, triage_level FROM triage_sessions WHERE id = %s", (session_id,))
        cur_session = cursor.fetchone()
        prev_status = cur_session["status"] if cur_session else "PENDING_REVIEW"
        final_level = new_triage_level or (cur_session["triage_level"] if cur_session else "ROUTINE")

        # Update session
        cursor.execute(
            """
            UPDATE triage_sessions
            SET status = %s, triage_level = %s, assigned_to = %s
            WHERE id = %s
            """,
            (new_status, final_level, reviewer_id, session_id)
        )

        # Update triage notes
        cursor.execute(
            """
            UPDATE triage_notes
            SET reviewer_decision = %s, reviewer_notes = %s, reviewer_id = %s, reviewed_at = NOW()
            WHERE session_id = %s
            """,
            (decision, reviewer_notes, reviewer_id, session_id)
        )

        # Record reviewer action
        cursor.execute(
            """
            INSERT INTO reviewer_actions
            (session_id, reviewer_id, action_type, previous_status, new_status, notes)
            VALUES (%s, %s, %s, %s, %s, %s)
            """,
            (session_id, reviewer_id, decision, prev_status, new_status, reviewer_notes)
        )

        connection.commit()
        return True
    except Error as e:
        connection.rollback()
        print("Error saving triage review decision:", e)
        return False
    finally:
        cursor.close()
        connection.close()


# ============================================================
# REFERRAL NOTE PERSISTENCE & MANAGEMENT
# ============================================================

def create_referral_record(
    session_id: int,
    patient_id: Optional[int],
    patient_name: str,
    referring_facility: str,
    receiving_facility: str,
    specialty_required: str,
    priority: str,
    reason_for_referral: str,
    clinical_summary: str,
    vital_signs_summary: Optional[str] = None,
    abnormal_findings: Optional[str] = None,
    transport_mode: str = "STANDARD",
    created_by: int = 1,
    status: str = "DRAFT"
) -> Optional[int]:
    """Saves a structured clinical referral draft or approved transfer note."""
    connection = get_connection()
    if connection is None:
        return None

    cursor = connection.cursor()
    try:
        query = """
            INSERT INTO referrals
            (session_id, patient_id, patient_name, referring_facility, receiving_facility,
             specialty_required, priority, reason_for_referral, clinical_summary,
             vital_signs_summary, abnormal_findings, transport_mode, created_by, status)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
        """
        cursor.execute(
            query,
            (
                session_id, patient_id, patient_name, referring_facility, receiving_facility,
                specialty_required, priority, reason_for_referral, clinical_summary,
                vital_signs_summary, abnormal_findings, transport_mode, created_by, status
            )
        )
        referral_id = cursor.lastrowid

        # Update session status to REFERRED if approved
        if status == "APPROVED":
            cursor.execute("UPDATE triage_sessions SET status = 'REFERRED' WHERE id = %s", (session_id,))

        connection.commit()
        return referral_id
    except Error as e:
        connection.rollback()
        print("Error creating referral record:", e)
        return None
    finally:
        cursor.close()
        connection.close()


def get_referral_record(referral_id: int) -> Optional[Dict[str, Any]]:
    """Retrieves referral note by ID with author information."""
    connection = get_connection()
    if connection is None:
        return None

    cursor = connection.cursor(dictionary=True)
    try:
        query = """
            SELECT r.*, u.full_name as author_name, u.role as author_role
            FROM referrals r
            JOIN users u ON r.created_by = u.id
            WHERE r.id = %s
        """
        cursor.execute(query, (referral_id,))
        row = cursor.fetchone()
        if row and row.get("created_at"):
            row["created_at"] = row["created_at"].strftime("%Y-%m-%d %H:%M:%S")
        return row
    except Error as e:
        print("Error getting referral record:", e)
        return None
    finally:
        cursor.close()
        connection.close()


def get_all_referrals(patient_id: Optional[int] = None, limit: int = 50) -> List[Dict[str, Any]]:
    """Retrieves referrals list for staff or a specific patient."""
    connection = get_connection()
    if connection is None:
        return []

    cursor = connection.cursor(dictionary=True)
    try:
        where_sql = "WHERE 1=1"
        params = []
        if patient_id:
            where_sql += " AND r.patient_id = %s"
            params.append(patient_id)

        query = f"""
            SELECT r.*, u.full_name as author_name
            FROM referrals r
            JOIN users u ON r.created_by = u.id
            {where_sql}
            ORDER BY r.created_at DESC
            LIMIT %s
        """
        params.append(limit)
        cursor.execute(query, tuple(params))
        rows = cursor.fetchall()
        for r in rows:
            if r.get("created_at"):
                r["created_at"] = r["created_at"].strftime("%Y-%m-%d %H:%M:%S")
        return rows
    except Error as e:
        print("Error getting all referrals:", e)
        return []
    finally:
        cursor.close()
        connection.close()


# ============================================================
# FOLLOW-UP & MATERNAL REMINDER PERSISTENCE
# ============================================================

def create_followup_record(
    session_id: Optional[int],
    patient_id: int,
    followup_type: str,
    scheduled_date: str,
    reminder_channel: str,
    clinical_objective: str,
    notes: Optional[str] = None
) -> Optional[int]:
    """Saves a scheduled health follow-up, maternal reminder, or chronic check-in."""
    connection = get_connection()
    if connection is None:
        return None

    cursor = connection.cursor()
    try:
        query = """
            INSERT INTO followups
            (session_id, patient_id, followup_type, scheduled_date, reminder_channel, clinical_objective, notes)
            VALUES (%s, %s, %s, %s, %s, %s, %s)
        """
        cursor.execute(
            query,
            (session_id, patient_id, followup_type, scheduled_date, reminder_channel, clinical_objective, notes)
        )
        followup_id = cursor.lastrowid
        connection.commit()
        return followup_id
    except Error as e:
        connection.rollback()
        print("Error creating followup record:", e)
        return None
    finally:
        cursor.close()
        connection.close()


def get_user_followups(patient_id: int) -> List[Dict[str, Any]]:
    """Retrieves all follow-up reminders scheduled for a patient."""
    connection = get_connection()
    if connection is None:
        return []

    cursor = connection.cursor(dictionary=True)
    try:
        query = """
            SELECT f.*, s.session_uuid
            FROM followups f
            LEFT JOIN triage_sessions s ON f.session_id = s.id
            WHERE f.patient_id = %s
            ORDER BY f.scheduled_date ASC
        """
        cursor.execute(query, (patient_id,))
        rows = cursor.fetchall()
        for r in rows:
            if r.get("scheduled_date"):
                r["scheduled_date"] = str(r["scheduled_date"])
            if r.get("created_at"):
                r["created_at"] = r["created_at"].strftime("%Y-%m-%d %H:%M:%S")
        return rows
    except Error as e:
        print("Error getting user followups:", e)
        return []
    finally:
        cursor.close()
        connection.close()


# ============================================================
# AUDIT LOGGING SERVICE
# ============================================================

def insert_audit_log(
    user_id: Optional[int],
    user_role: Optional[str],
    action: str,
    resource_type: str,
    resource_id: Optional[str] = None,
    details: Optional[str] = None,
    ip_address: Optional[str] = None
) -> bool:
    """Inserts a security or clinical compliance audit log entry."""
    connection = get_connection()
    if connection is None:
        return False

    cursor = connection.cursor()
    try:
        query = """
            INSERT INTO audit_logs
            (user_id, user_role, action, resource_type, resource_id, details, ip_address)
            VALUES (%s, %s, %s, %s, %s, %s, %s)
        """
        cursor.execute(query, (user_id, user_role, action, resource_type, resource_id, details, ip_address))
        connection.commit()
        return True
    except Error as e:
        print("Notice saving audit log:", e)
        return False
    finally:
        cursor.close()
        connection.close()


def fetch_audit_logs(limit: int = 100, action: Optional[str] = None) -> List[Dict[str, Any]]:
    """Retrieves audit trail entries for facility and compliance inspection."""
    connection = get_connection()
    if connection is None:
        return []

    cursor = connection.cursor(dictionary=True)
    try:
        where_sql = "WHERE 1=1"
        params = []
        if action:
            where_sql += " AND a.action = %s"
            params.append(action)

        query = f"""
            SELECT a.*, u.full_name as user_name, u.email as user_email
            FROM audit_logs a
            LEFT JOIN users u ON a.user_id = u.id
            {where_sql}
            ORDER BY a.created_at DESC
            LIMIT %s
        """
        params.append(limit)
        cursor.execute(query, tuple(params))
        rows = cursor.fetchall()
        for r in rows:
            if r.get("created_at"):
                r["created_at"] = r["created_at"].strftime("%Y-%m-%d %H:%M:%S")
        return rows
    except Error as e:
        print("Error fetching audit logs:", e)
        return []
    finally:
        cursor.close()
        connection.close()


# ============================================================
# FACILITY INTELLIGENCE & PUBLIC HEALTH SURVEILLANCE QUERIES
# ============================================================

def get_facility_dashboard_metrics(facility_id: Optional[int] = None, days: int = 30) -> Dict[str, Any]:
    """Aggregates operational metrics, triage distributions, and queue statistics."""
    connection = get_connection()
    if connection is None:
        return {}

    cursor = connection.cursor(dictionary=True)
    try:
        # Total cases in window
        cursor.execute(
            """
            SELECT COUNT(*) as total_cases,
                   SUM(CASE WHEN triage_level = 'EMERGENCY' OR is_emergency = TRUE THEN 1 ELSE 0 END) as emergency_count,
                   SUM(CASE WHEN triage_level = 'URGENT' THEN 1 ELSE 0 END) as urgent_count,
                   SUM(CASE WHEN triage_level = 'ROUTINE' THEN 1 ELSE 0 END) as routine_count,
                   SUM(CASE WHEN status = 'PENDING_REVIEW' THEN 1 ELSE 0 END) as pending_review_count,
                   SUM(CASE WHEN status = 'APPROVED' THEN 1 ELSE 0 END) as approved_count,
                   SUM(CASE WHEN status = 'REFERRED' THEN 1 ELSE 0 END) as referred_count
            FROM triage_sessions
            WHERE created_at >= NOW() - INTERVAL %s DAY
            """,
            (days,)
        )
        totals = cursor.fetchone() or {}

        # Referrals in window
        cursor.execute(
            "SELECT COUNT(*) as total_referrals FROM referrals WHERE created_at >= NOW() - INTERVAL %s DAY",
            (days,)
        )
        ref_row = cursor.fetchone() or {}

        # Active staff
        cursor.execute(
            "SELECT COUNT(*) as total_staff FROM users WHERE role IN ('HEALTH_WORKER', 'NURSE', 'DOCTOR', 'MEDICAL_OFFICER', 'FACILITY_ADMIN')"
        )
        staff_row = cursor.fetchone() or {}

        return {
            "window_days": days,
            "total_cases": totals.get("total_cases") or 0,
            "emergency_cases": totals.get("emergency_count") or 0,
            "urgent_cases": totals.get("urgent_count") or 0,
            "routine_cases": totals.get("routine_count") or 0,
            "pending_review": totals.get("pending_review_count") or 0,
            "approved_cases": totals.get("approved_count") or 0,
            "referred_cases": totals.get("referred_count") or 0,
            "total_referrals": ref_row.get("total_referrals") or 0,
            "active_clinical_staff": staff_row.get("total_staff") or 0
        }
    except Error as e:
        print("Error getting facility metrics:", e)
        return {}
    finally:
        cursor.close()
        connection.close()


def get_public_health_surveillance_data(days: int = 30, district: Optional[str] = None) -> Dict[str, Any]:
    """
    100% De-identified, aggregated public health symptom surveillance.
    NEVER exposes individual patient identities or private transcripts.
    """
    connection = get_connection()
    if connection is None:
        return {}

    cursor = connection.cursor(dictionary=True)
    try:
        # Aggregated symptom clusters from chief complaints
        cursor.execute(
            """
            SELECT
                SUM(CASE WHEN LOWER(chief_complaint) REGEXP 'cough|breath|fever|cold|throat|pneumonia|flu' THEN 1 ELSE 0 END) as respiratory_cases,
                SUM(CASE WHEN LOWER(chief_complaint) REGEXP 'vomit|diarrhea|stomach|abdom|nausea' THEN 1 ELSE 0 END) as gastrointestinal_cases,
                SUM(CASE WHEN LOWER(chief_complaint) REGEXP 'fever|chill|shiver|malaria|dengue' THEN 1 ELSE 0 END) as febrile_cases,
                SUM(CASE WHEN LOWER(chief_complaint) REGEXP 'heat|stroke|exhaustion|cramp|dehydrat' THEN 1 ELSE 0 END) as heat_illness_cases,
                SUM(CASE WHEN LOWER(chief_complaint) REGEXP 'rash|skin|itch|allergy|wound' THEN 1 ELSE 0 END) as dermatological_cases,
                COUNT(*) as total_aggregated_intakes
            FROM triage_notes
            WHERE created_at >= NOW() - INTERVAL %s DAY
            """,
            (days,)
        )
        clusters = cursor.fetchone() or {}

        # Daily volume trend (anonymized counts only)
        cursor.execute(
            """
            SELECT DATE(created_at) as date,
                   COUNT(*) as intake_count,
                   SUM(CASE WHEN triage_level = 'EMERGENCY' THEN 1 ELSE 0 END) as emergency_count
            FROM triage_sessions
            WHERE created_at >= NOW() - INTERVAL %s DAY
            GROUP BY DATE(created_at)
            ORDER BY DATE(created_at) ASC
            """,
            (days,)
        )
        daily_trends = cursor.fetchall()
        for d in daily_trends:
            if d.get("date"):
                d["date"] = str(d["date"])

        return {
            "surveillance_window_days": days,
            "district": district or "Khordha Regional Surveillance Area",
            "clusters": {
                "respiratory": clusters.get("respiratory_cases") or 0,
                "gastrointestinal": clusters.get("gastrointestinal_cases") or 0,
                "febrile_systemic": clusters.get("febrile_cases") or 0,
                "heat_occupational": clusters.get("heat_illness_cases") or 0,
                "dermatological": clusters.get("dermatological_cases") or 0,
                "total_deidentified_intakes": clusters.get("total_aggregated_intakes") or 0
            },
            "daily_trends": daily_trends
        }
    except Error as e:
        print("Error in public health surveillance query:", e)
        return {}
    finally:
        cursor.close()
        connection.close()


def get_all_facility_profiles() -> List[Dict[str, Any]]:
    """Retrieves all registered health facilities."""
    connection = get_connection()
    if connection is None:
        return []

    cursor = connection.cursor(dictionary=True)
    try:
        cursor.execute("SELECT * FROM facility_profiles ORDER BY name ASC")
        return cursor.fetchall()
    except Error as e:
        print("Error getting facility profiles:", e)
        return []
    finally:
        cursor.close()
        connection.close()


def get_facility_profile(facility_id: int) -> Optional[Dict[str, Any]]:
    """Retrieves a single facility profile."""
    connection = get_connection()
    if connection is None:
        return None

    cursor = connection.cursor(dictionary=True)
    try:
        cursor.execute("SELECT * FROM facility_profiles WHERE id = %s", (facility_id,))
        return cursor.fetchone()
    except Error as e:
        print("Error getting facility profile:", e)
        return None
    finally:
        cursor.close()
        connection.close()


def update_facility_active_mode(facility_id: int, mode: str) -> bool:
    """Updates operational workflow mode of a facility."""
    connection = get_connection()
    if connection is None:
        return False

    cursor = connection.cursor()
    try:
        cursor.execute("UPDATE facility_profiles SET active_mode = %s WHERE id = %s", (mode, facility_id))
        connection.commit()
        return True
    except Error as e:
        connection.rollback()
        print("Error updating facility mode:", e)
        return False
    finally:
        cursor.close()
        connection.close()


# ==========================================
# TREATMENT PLANS & DOCTOR ASSESSMENTS (SECTION 19)
# ==========================================

def create_treatment_plan(
    patient_id: int,
    doctor_id: int,
    clinical_assessment: str,
    diagnosis_notes: Optional[str] = None,
    follow_up_date: Optional[str] = None,
    tests_recommended: Optional[str] = None,
    lifestyle_guidance: Optional[str] = None,
    session_id: Optional[int] = None,
    medications: Optional[List[Dict[str, Any]]] = None
) -> Optional[int]:
    """
    Creates a clinician-approved treatment plan and associated medications.
    AI does NOT prescribe — this records the doctor's verified decisions.
    """
    connection = get_connection()
    if connection is None:
        return None

    cursor = connection.cursor()
    try:
        query = """
            INSERT INTO treatment_plans
            (patient_id, doctor_id, session_id, clinical_assessment, diagnosis_notes,
             follow_up_date, tests_recommended, lifestyle_guidance, status)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, 'ACTIVE')
        """
        cursor.execute(query, (
            patient_id,
            doctor_id,
            session_id,
            clinical_assessment,
            diagnosis_notes,
            follow_up_date,
            tests_recommended,
            lifestyle_guidance
        ))
        plan_id = cursor.lastrowid

        # Insert medications if any
        if medications and plan_id:
            med_query = """
                INSERT INTO treatment_plan_medications
                (plan_id, medicine_name, dosage, frequency, duration_days, instructions, food_relation, time_of_day)
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
            """
            for m in medications:
                cursor.execute(med_query, (
                    plan_id,
                    m.get("medicine_name") or m.get("name", "Medication"),
                    m.get("dosage", "As directed"),
                    m.get("frequency", "Once daily"),
                    m.get("duration_days", 7),
                    m.get("instructions", ""),
                    m.get("food_relation", "After food"),
                    m.get("time_of_day", "Morning")
                ))

        connection.commit()
        return plan_id
    except Error as e:
        connection.rollback()
        print("Error creating treatment plan:", e)
        return None
    finally:
        cursor.close()
        connection.close()


def get_treatment_plans_for_patient(patient_id: int) -> List[Dict[str, Any]]:
    """Retrieves all treatment plans for a patient with doctor details and medications."""
    connection = get_connection()
    if connection is None:
        return []

    cursor = connection.cursor(dictionary=True)
    try:
        query = """
            SELECT tp.*, u.full_name as doctor_name, u.email as doctor_email
            FROM treatment_plans tp
            LEFT JOIN users u ON tp.doctor_id = u.id
            WHERE tp.patient_id = %s
            ORDER BY tp.created_at DESC
        """
        cursor.execute(query, (patient_id,))
        plans = cursor.fetchall()

        # Fetch medications for each plan
        for plan in plans:
            med_cursor = connection.cursor(dictionary=True)
            med_cursor.execute(
                "SELECT * FROM treatment_plan_medications WHERE plan_id = %s",
                (plan["id"],)
            )
            plan["medications"] = med_cursor.fetchall()
            med_cursor.close()

        return plans
    except Error as e:
        print("Error getting treatment plans:", e)
        return []
    finally:
        cursor.close()
        connection.close()


def get_active_treatment_plan_for_patient(patient_id: int) -> Optional[Dict[str, Any]]:
    """Retrieves the latest active treatment plan for a patient."""
    plans = get_treatment_plans_for_patient(patient_id)
    for p in plans:
        if p.get("status") == "ACTIVE":
            return p
    return plans[0] if plans else None


def update_treatment_plan_status(plan_id: int, status: str) -> bool:
    """Updates the status of a treatment plan."""
    connection = get_connection()
    if connection is None:
        return False

    cursor = connection.cursor()
    try:
        cursor.execute("UPDATE treatment_plans SET status = %s WHERE id = %s", (status, plan_id))
        connection.commit()
        return True
    except Error as e:
        connection.rollback()
        print("Error updating treatment plan status:", e)
        return False
    finally:
        cursor.close()
        connection.close()


def create_doctor_assessment(
    doctor_id: int,
    patient_id: int,
    clinical_findings: str,
    chief_complaint: Optional[str] = None,
    differential_notes: Optional[str] = None,
    severity_level: str = "ROUTINE",
    session_id: Optional[int] = None
) -> Optional[int]:
    """Records a formal doctor assessment for a patient session."""
    connection = get_connection()
    if connection is None:
        return None

    cursor = connection.cursor()
    try:
        query = """
            INSERT INTO doctor_assessments
            (doctor_id, patient_id, session_id, chief_complaint, clinical_findings,
             differential_notes, severity_level)
            VALUES (%s, %s, %s, %s, %s, %s, %s)
        """
        cursor.execute(query, (
            doctor_id,
            patient_id,
            session_id,
            chief_complaint,
            clinical_findings,
            differential_notes,
            severity_level
        ))
        connection.commit()
        return cursor.lastrowid
    except Error as e:
        connection.rollback()
        print("Error creating doctor assessment:", e)
        return None
    finally:
        cursor.close()
        connection.close()


def get_doctor_assessments_for_patient(patient_id: int) -> List[Dict[str, Any]]:
    """Retrieves all clinical doctor assessments recorded for a patient."""
    connection = get_connection()
    if connection is None:
        return []

    cursor = connection.cursor(dictionary=True)
    try:
        query = """
            SELECT da.*, u.full_name as doctor_name
            FROM doctor_assessments da
            LEFT JOIN users u ON da.doctor_id = u.id
            WHERE da.patient_id = %s
            ORDER BY da.created_at DESC
        """
        cursor.execute(query, (patient_id,))
        return cursor.fetchall()
    except Error as e:
        print("Error getting doctor assessments:", e)
        return []
    finally:
        cursor.close()
        connection.close()


def assign_patient_to_staff(
    patient_id: int,
    staff_id: int,
    role: str,
    facility_id: Optional[int] = None
) -> bool:
    """Assigns patient to a doctor, nurse, or health worker."""
    connection = get_connection()
    if connection is None:
        return False

    cursor = connection.cursor()
    try:
        query = """
            INSERT INTO patient_assignments (patient_id, staff_id, role, facility_id, status)
            VALUES (%s, %s, %s, %s, 'ACTIVE')
            ON DUPLICATE KEY UPDATE status = 'ACTIVE'
        """
        cursor.execute(query, (patient_id, staff_id, role, facility_id))
        connection.commit()
        return True
    except Error as e:
        connection.rollback()
        print("Error assigning patient:", e)
        return False
    finally:
        cursor.close()
        connection.close()


def get_assigned_patients(staff_id: int) -> List[Dict[str, Any]]:
    """Retrieves all active patients assigned to a staff member."""
    connection = get_connection()
    if connection is None:
        return []

    cursor = connection.cursor(dictionary=True)
    try:
        query = """
            SELECT u.id, u.full_name, u.email, u.role, pa.assigned_at, pa.status as assignment_status
            FROM patient_assignments pa
            JOIN users u ON pa.patient_id = u.id
            WHERE pa.staff_id = %s AND pa.status = 'ACTIVE'
            ORDER BY pa.assigned_at DESC
        """
        cursor.execute(query, (staff_id,))
        return cursor.fetchall()
    except Error as e:
        print("Error getting assigned patients:", e)
        return []
    finally:
        cursor.close()
        connection.close()