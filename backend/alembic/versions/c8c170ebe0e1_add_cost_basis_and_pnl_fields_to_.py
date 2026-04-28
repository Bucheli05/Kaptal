"""add_cost_basis_and_pnl_fields_to_positions

Revision ID: c8c170ebe0e1
Revises: a1b2c3d4e5f6
Create Date: 2026-04-28 00:10:19.812432

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'c8c170ebe0e1'
down_revision: Union[str, None] = 'a1b2c3d4e5f6'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column('positions', sa.Column('cost_basis_price', sa.Numeric(18, 6), nullable=True))
    op.add_column('positions', sa.Column('fifo_pnl_unrealized', sa.Numeric(18, 6), nullable=True))
    op.add_column('positions', sa.Column('daily_price_change_pct', sa.Numeric(18, 6), nullable=True))


def downgrade() -> None:
    op.drop_column('positions', 'daily_price_change_pct')
    op.drop_column('positions', 'fifo_pnl_unrealized')
    op.drop_column('positions', 'cost_basis_price')
