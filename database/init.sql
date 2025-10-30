-- AI Feed RSS Database Initialization Script

-- Create extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- Create database if not exists (this might not work in init script, but keeping for reference)
-- CREATE DATABASE IF NOT EXISTS ai_feed_rss;

-- Users table
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    is_active BOOLEAN DEFAULT true,
    is_admin BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- RSS Sources table
CREATE TABLE IF NOT EXISTS rss_sources (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    url TEXT NOT NULL,
    description TEXT,
    source_type VARCHAR(50) DEFAULT 'web', -- email, social_media, youtube, web, news
    category VARCHAR(100),
    subcategory VARCHAR(100),
    is_active BOOLEAN DEFAULT true,
    fetch_interval INTEGER DEFAULT 3600, -- seconds
    last_fetched TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, url)
);

-- RSS Items table
CREATE TABLE IF NOT EXISTS rss_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    source_id UUID REFERENCES rss_sources(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    content TEXT,
    url TEXT NOT NULL,
    guid VARCHAR(255),
    author VARCHAR(255),
    published_at TIMESTAMP WITH TIME ZONE,
    ai_summary TEXT,
    ai_category VARCHAR(100),
    ai_subcategory VARCHAR(100),
    ai_score DECIMAL(3,2), -- relevance score from 0.00 to 1.00
    is_read BOOLEAN DEFAULT false,
    is_bookmarked BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(source_id, guid)
);

-- Categories table (AI-generated and user-defined)
CREATE TABLE IF NOT EXISTS categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    parent_id UUID REFERENCES categories(id) ON DELETE CASCADE,
    description TEXT,
    color VARCHAR(7), -- hex color code
    is_ai_generated BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, name, parent_id)
);

-- User preferences table
CREATE TABLE IF NOT EXISTS user_preferences (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE UNIQUE,
    ai_model VARCHAR(50) DEFAULT 'gpt-3.5-turbo',
    auto_categorize BOOLEAN DEFAULT true,
    auto_summary BOOLEAN DEFAULT true,
    preferred_categories TEXT[], -- array of category names
    reading_frequency VARCHAR(20) DEFAULT 'daily', -- hourly, daily, weekly
    notification_enabled BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Reading history table
CREATE TABLE IF NOT EXISTS reading_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    item_id UUID REFERENCES rss_items(id) ON DELETE CASCADE,
    read_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    reading_time INTEGER, -- seconds spent reading
    UNIQUE(user_id, item_id)
);

-- AI processing queue table
CREATE TABLE IF NOT EXISTS ai_processing_queue (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    item_id UUID REFERENCES rss_items(id) ON DELETE CASCADE,
    processing_type VARCHAR(50) NOT NULL, -- 'categorization', 'summary', 'scoring'
    status VARCHAR(20) DEFAULT 'pending', -- pending, processing, completed, failed
    attempts INTEGER DEFAULT 0,
    error_message TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    processed_at TIMESTAMP WITH TIME ZONE
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);

CREATE INDEX IF NOT EXISTS idx_rss_sources_user_id ON rss_sources(user_id);
CREATE INDEX IF NOT EXISTS idx_rss_sources_is_active ON rss_sources(is_active);
CREATE INDEX IF NOT EXISTS idx_rss_sources_last_fetched ON rss_sources(last_fetched);

CREATE INDEX IF NOT EXISTS idx_rss_items_source_id ON rss_items(source_id);
CREATE INDEX IF NOT EXISTS idx_rss_items_published_at ON rss_items(published_at);
CREATE INDEX IF NOT EXISTS idx_rss_items_is_read ON rss_items(is_read);
CREATE INDEX IF NOT EXISTS idx_rss_items_is_bookmarked ON rss_items(is_bookmarked);
CREATE INDEX IF NOT EXISTS idx_rss_items_ai_category ON rss_items(ai_category);
CREATE INDEX IF NOT EXISTS idx_rss_items_ai_score ON rss_items(ai_score);

CREATE INDEX IF NOT EXISTS idx_categories_user_id ON categories(user_id);
CREATE INDEX IF NOT EXISTS idx_categories_parent_id ON categories(parent_id);

CREATE INDEX IF NOT EXISTS idx_reading_history_user_id ON reading_history(user_id);
CREATE INDEX IF NOT EXISTS idx_reading_history_read_at ON reading_history(read_at);

CREATE INDEX IF NOT EXISTS idx_ai_queue_status ON ai_processing_queue(status);
CREATE INDEX IF NOT EXISTS idx_ai_queue_created_at ON ai_processing_queue(created_at);

-- Full-text search indexes
CREATE INDEX IF NOT EXISTS idx_rss_items_title_fts ON rss_items USING gin(to_tsvector('english', title));
CREATE INDEX IF NOT EXISTS idx_rss_items_description_fts ON rss_items USING gin(to_tsvector('english', description));

-- Create trigger function for updating updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_rss_sources_updated_at BEFORE UPDATE ON rss_sources FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_rss_items_updated_at BEFORE UPDATE ON rss_items FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_user_preferences_updated_at BEFORE UPDATE ON user_preferences FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert default admin user (password: admin123 - change this!)
INSERT INTO users (username, email, password_hash, is_admin) 
VALUES ('admin', 'admin@aifeeedrss.local', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj/VK9op5Ppa', true)
ON CONFLICT (email) DO NOTHING;

-- Insert some default categories
INSERT INTO categories (user_id, name, description, is_ai_generated) VALUES
((SELECT id FROM users WHERE username = 'admin'), 'Technology', 'Technology news and updates', false),
((SELECT id FROM users WHERE username = 'admin'), 'Business', 'Business and finance news', false),
((SELECT id FROM users WHERE username = 'admin'), 'Science', 'Scientific discoveries and research', false),
((SELECT id FROM users WHERE username = 'admin'), 'Entertainment', 'Entertainment and media news', false),
((SELECT id FROM users WHERE username = 'admin'), 'Sports', 'Sports news and updates', false)
ON CONFLICT (user_id, name, parent_id) DO NOTHING;