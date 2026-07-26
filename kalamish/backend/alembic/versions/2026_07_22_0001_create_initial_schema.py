"""Create initial schema with all 13 database entities and pgvector support

Revision ID: 0001_initial_schema
Revises:
Create Date: 2026-07-22

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql
from pgvector.sqlalchemy import Vector

# revision identifiers, used by Alembic.
revision: str = '0001_initial_schema'
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # 0. Enable pgvector extension
    op.execute("CREATE EXTENSION IF NOT EXISTS vector;")

    # 1. users
    op.create_table(
        'users',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column('email', sa.String(length=255), nullable=False),
        sa.Column('hashed_password', sa.String(length=255), nullable=False),
        sa.Column('full_name', sa.String(length=255), nullable=True),
        sa.Column('is_active', sa.Boolean(), nullable=False, server_default='true'),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
    )
    op.create_index(op.f('ix_users_email'), 'users', ['email'], unique=True)

    # 2. novels
    op.create_table(
        'novels',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column('user_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('users.id', ondelete='CASCADE'), nullable=False),
        sa.Column('title', sa.String(length=255), nullable=False),
        sa.Column('genre', sa.String(length=100), nullable=True),
        sa.Column('language', sa.String(length=50), nullable=False, server_default='English'),
        sa.Column('tone', sa.String(length=100), nullable=True),
        sa.Column('style', sa.String(length=100), nullable=True),
        sa.Column('pov', sa.String(length=50), nullable=True),
        sa.Column('estimated_chapters', sa.Integer(), nullable=False, server_default='10'),
        sa.Column('status', sa.String(length=50), nullable=False, server_default='draft'),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
    )
    op.create_index(op.f('ix_novels_user_id'), 'novels', ['user_id'], unique=False)

    # 3. chapters
    op.create_table(
        'chapters',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column('novel_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('novels.id', ondelete='CASCADE'), nullable=False),
        sa.Column('chapter_number', sa.Integer(), nullable=False),
        sa.Column('title', sa.String(length=255), nullable=False),
        sa.Column('content', sa.Text(), nullable=False, server_default=''),
        sa.Column('summary', sa.Text(), nullable=True),
        sa.Column('word_count', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('status', sa.String(length=50), nullable=False, server_default='draft'),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
    )
    op.create_index(op.f('ix_chapters_novel_id'), 'chapters', ['novel_id'], unique=False)
    op.create_index(op.f('ix_chapters_chapter_number'), 'chapters', ['chapter_number'], unique=False)

    # 4. characters
    op.create_table(
        'characters',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column('novel_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('novels.id', ondelete='CASCADE'), nullable=False),
        sa.Column('name', sa.String(length=255), nullable=False),
        sa.Column('role', sa.String(length=100), nullable=False, server_default='supporting'),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('personality_traits', sa.JSON(), nullable=False),
        sa.Column('backstory', sa.Text(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
    )
    op.create_index(op.f('ix_characters_novel_id'), 'characters', ['novel_id'], unique=False)

    # 5. character_relationships
    op.create_table(
        'character_relationships',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column('novel_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('novels.id', ondelete='CASCADE'), nullable=False),
        sa.Column('character_a_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('characters.id', ondelete='CASCADE'), nullable=False),
        sa.Column('character_b_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('characters.id', ondelete='CASCADE'), nullable=False),
        sa.Column('relationship_type', sa.String(length=100), nullable=False),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
    )
    op.create_index(op.f('ix_character_relationships_novel_id'), 'character_relationships', ['novel_id'], unique=False)
    op.create_index(op.f('ix_character_relationships_character_a_id'), 'character_relationships', ['character_a_id'], unique=False)
    op.create_index(op.f('ix_character_relationships_character_b_id'), 'character_relationships', ['character_b_id'], unique=False)

    # 6. locations
    op.create_table(
        'locations',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column('novel_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('novels.id', ondelete='CASCADE'), nullable=False),
        sa.Column('name', sa.String(length=255), nullable=False),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('significance', sa.Text(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
    )
    op.create_index(op.f('ix_locations_novel_id'), 'locations', ['novel_id'], unique=False)

    # 7. timeline_events
    op.create_table(
        'timeline_events',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column('novel_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('novels.id', ondelete='CASCADE'), nullable=False),
        sa.Column('chapter_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('chapters.id', ondelete='SET NULL'), nullable=True),
        sa.Column('event_order', sa.Integer(), nullable=False),
        sa.Column('title', sa.String(length=255), nullable=False),
        sa.Column('description', sa.Text(), nullable=False),
        sa.Column('impact', sa.Text(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
    )
    op.create_index(op.f('ix_timeline_events_novel_id'), 'timeline_events', ['novel_id'], unique=False)
    op.create_index(op.f('ix_timeline_events_chapter_id'), 'timeline_events', ['chapter_id'], unique=False)
    op.create_index(op.f('ix_timeline_events_event_order'), 'timeline_events', ['event_order'], unique=False)

    # 8. world_rules
    op.create_table(
        'world_rules',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column('novel_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('novels.id', ondelete='CASCADE'), nullable=False),
        sa.Column('rule_name', sa.String(length=255), nullable=False),
        sa.Column('category', sa.String(length=100), nullable=False, server_default='general'),
        sa.Column('description', sa.Text(), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
    )
    op.create_index(op.f('ix_world_rules_novel_id'), 'world_rules', ['novel_id'], unique=False)

    # 9. outlines
    op.create_table(
        'outlines',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column('novel_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('novels.id', ondelete='CASCADE'), nullable=False),
        sa.Column('chapter_number', sa.Integer(), nullable=False),
        sa.Column('title', sa.String(length=255), nullable=False),
        sa.Column('synopsis', sa.Text(), nullable=False),
        sa.Column('key_events', sa.JSON(), nullable=False),
        sa.Column('target_word_count', sa.Integer(), nullable=False, server_default='2000'),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
    )
    op.create_index(op.f('ix_outlines_novel_id'), 'outlines', ['novel_id'], unique=False)
    op.create_index(op.f('ix_outlines_chapter_number'), 'outlines', ['chapter_number'], unique=False)

    # 10. plot_threads
    op.create_table(
        'plot_threads',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column('novel_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('novels.id', ondelete='CASCADE'), nullable=False),
        sa.Column('name', sa.String(length=255), nullable=False),
        sa.Column('status', sa.String(length=50), nullable=False, server_default='open'),
        sa.Column('description', sa.Text(), nullable=False),
        sa.Column('resolution', sa.Text(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
    )
    op.create_index(op.f('ix_plot_threads_novel_id'), 'plot_threads', ['novel_id'], unique=False)

    # 11. revision_history
    op.create_table(
        'revision_history',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column('chapter_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('chapters.id', ondelete='CASCADE'), nullable=False),
        sa.Column('version_number', sa.Integer(), nullable=False),
        sa.Column('previous_content', sa.Text(), nullable=False),
        sa.Column('changes_description', sa.Text(), nullable=False),
        sa.Column('revised_by_agent', sa.String(length=100), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
    )
    op.create_index(op.f('ix_revision_history_chapter_id'), 'revision_history', ['chapter_id'], unique=False)
    op.create_index(op.f('ix_revision_history_version_number'), 'revision_history', ['version_number'], unique=False)

    # 12. agent_memories
    op.create_table(
        'agent_memories',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column('novel_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('novels.id', ondelete='CASCADE'), nullable=False),
        sa.Column('agent_name', sa.String(length=100), nullable=False),
        sa.Column('memory_key', sa.String(length=255), nullable=False),
        sa.Column('memory_value', sa.JSON(), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
    )
    op.create_index(op.f('ix_agent_memories_novel_id'), 'agent_memories', ['novel_id'], unique=False)
    op.create_index(op.f('ix_agent_memories_agent_name'), 'agent_memories', ['agent_name'], unique=False)
    op.create_index(op.f('ix_agent_memories_memory_key'), 'agent_memories', ['memory_key'], unique=False)

    # 13. embeddings
    op.create_table(
        'embeddings',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column('novel_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('novels.id', ondelete='CASCADE'), nullable=False),
        sa.Column('entity_type', sa.String(length=50), nullable=False),
        sa.Column('entity_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('content', sa.Text(), nullable=False),
        sa.Column('vector', Vector(768), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
    )
    op.create_index(op.f('ix_embeddings_novel_id'), 'embeddings', ['novel_id'], unique=False)
    op.create_index(op.f('ix_embeddings_entity_type'), 'embeddings', ['entity_type'], unique=False)
    op.create_index(op.f('ix_embeddings_entity_id'), 'embeddings', ['entity_id'], unique=False)


def downgrade() -> None:
    op.drop_table('embeddings')
    op.drop_table('agent_memories')
    op.drop_table('revision_history')
    op.drop_table('plot_threads')
    op.drop_table('outlines')
    op.drop_table('world_rules')
    op.drop_table('timeline_events')
    op.drop_table('locations')
    op.drop_table('character_relationships')
    op.drop_table('characters')
    op.drop_table('chapters')
    op.drop_table('novels')
    op.drop_table('users')
