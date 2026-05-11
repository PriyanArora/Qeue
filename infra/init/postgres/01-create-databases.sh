#!/usr/bin/env sh
set -eu

create_user_and_database() {
  db_name="$1"
  db_user="$2"
  db_password="$3"

  psql --username "$POSTGRES_USER" --dbname "$POSTGRES_DB" <<-EOSQL
DO
\$do\$
BEGIN
   IF NOT EXISTS (
      SELECT FROM pg_catalog.pg_roles
      WHERE rolname = '${db_user}'
   ) THEN
      CREATE ROLE "${db_user}" LOGIN PASSWORD '${db_password}';
   END IF;
END
\$do\$;
EOSQL

  if ! psql --username "$POSTGRES_USER" --dbname "$POSTGRES_DB" -tAc "SELECT 1 FROM pg_database WHERE datname = '${db_name}'" | grep -q 1; then
    psql --username "$POSTGRES_USER" --dbname "$POSTGRES_DB" -c "CREATE DATABASE \"${db_name}\" OWNER \"${db_user}\";"
  fi
}

create_user_and_database "$IDENTITY_DB_NAME" "$IDENTITY_DB_USERNAME" "$IDENTITY_DB_PASSWORD"
create_user_and_database "$EVENT_DB_NAME" "$EVENT_DB_USERNAME" "$EVENT_DB_PASSWORD"
create_user_and_database "$REGISTRATION_DB_NAME" "$REGISTRATION_DB_USERNAME" "$REGISTRATION_DB_PASSWORD"
create_user_and_database "$NOTIFICATION_DB_NAME" "$NOTIFICATION_DB_USERNAME" "$NOTIFICATION_DB_PASSWORD"
