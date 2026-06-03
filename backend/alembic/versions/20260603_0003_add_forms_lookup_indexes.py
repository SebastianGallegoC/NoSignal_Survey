"""add forms lookup indexes

Revision ID: 20260603_0003
Revises: 20260529_0002
Create Date: 2026-06-03 08:55:00
"""

from __future__ import annotations

from alembic import op

# revision identifiers, used by Alembic.
revision = "20260603_0003"
down_revision = "20260529_0002"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.execute("CREATE INDEX IF NOT EXISTS ix_forms_fecha_hora_desc ON forms (fecha_hora DESC)")
    # `ix_forms_id_perfil_encuestador` exists in recent schemas; this keeps old DBs aligned.
    op.execute(
        "CREATE INDEX IF NOT EXISTS ix_forms_id_perfil_encuestador ON forms (id_perfil_encuestador)"
    )


def downgrade() -> None:
    op.execute("DROP INDEX IF EXISTS ix_forms_fecha_hora_desc")
