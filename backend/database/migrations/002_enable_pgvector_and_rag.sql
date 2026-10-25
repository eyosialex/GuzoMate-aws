-- Enable pgvector extension for vector embeddings & similarity search
CREATE EXTENSION IF NOT EXISTS vector;

-- Table for curated knowledge base, travel guides, and rich place descriptions (FR-05)
CREATE TABLE IF NOT EXISTS rag_documents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    source_type VARCHAR(50) NOT NULL, -- 'travel_guide', 'place_description', 'cultural_tip', 'faq'
    source_id VARCHAR(255),           -- e.g., OSM place ID or external reference ID
    language VARCHAR(10) NOT NULL,    -- 'en', 'am', 'om'
    title VARCHAR(255),
    content TEXT NOT NULL,
    metadata JSONB DEFAULT '{}',      -- category, tags, target coordinates, subcity, etc.
    embedding vector(768),            -- 768 dimensions for Gemini text-embedding-004
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Vector similarity index using cosine distance
CREATE INDEX IF NOT EXISTS idx_rag_documents_embedding 
ON rag_documents USING ivfflat (embedding vector_cosine_ops)
WITH (lists = 100);

-- Language and source lookup indices
CREATE INDEX IF NOT EXISTS idx_rag_documents_lang ON rag_documents(language);
CREATE INDEX IF NOT EXISTS idx_rag_documents_source ON rag_documents(source_type);
