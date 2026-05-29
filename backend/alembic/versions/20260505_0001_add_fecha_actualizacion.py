"""add fecha_actualizacion to forms

Revision ID: 20260505_0001
Revises: 20260504_0001
Create Date: 2026-05-05 00:00:00
"""

from __future__ import annotations

from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = "20260505_0001"
down_revision = "20260504_0001"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column(
        "forms",
        sa.Column("fecha_actualizacion", sa.DateTime(timezone=True), nullable=True),
    )
    op.execute("UPDATE forms SET fecha_actualizacion = fecha_hora WHERE fecha_actualizacion IS NULL")
    op.alter_column("forms", "fecha_actualizacion", nullable=False)


def downgrade() -> None:
    op.drop_column("forms", "fecha_actualizacion")
