-- ============================================================================
-- GuzoMate Required PostgreSQL Extensions
-- ============================================================================
-- Note: Installing extensions typically requires PostgreSQL superuser privileges
-- or database owner privileges with pre-installed extensions (e.g. AWS RDS/Supabase).

-- 1. UUID generation extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. PostGIS extension for spatial/geographic types and operations
CREATE EXTENSION IF NOT EXISTS postgis;

-- 3. pgvector extension for AI/RAG semantic vector similarity search
CREATE EXTENSION IF NOT EXISTS vector;
