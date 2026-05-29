"""drop id_usuario from forms

Revision ID: 20260520_0001
Revises: 20260519_0001
Create Date: 2026-05-20 00:00:00
"""

from __future__ import annotations

from alembic import op
import sqlalchemy as sa

revision = "20260520_0001"
down_revision = "20260519_0001"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.drop_column("forms", "id_usuario")


def downgrade() -> None:
    op.add_column("forms", sa.Column("id_usuario", sa.String(), nullable=False, server_default="sin_usuario"))
    op.alter_column("forms", "id_usuario", server_default=None)
