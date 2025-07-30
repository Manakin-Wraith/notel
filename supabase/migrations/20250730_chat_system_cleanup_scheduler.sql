-- Automated Message Cleanup Scheduler
-- Created: 2025-07-30
-- Sets up automatic cleanup of expired messages and typing indicators

-- Create a function to be called by pg_cron or external scheduler
CREATE OR REPLACE FUNCTION scheduled_chat_cleanup()
RETURNS TABLE(
    expired_messages_deleted INTEGER,
    typing_indicators_cleaned INTEGER,
    execution_time TIMESTAMP WITH TIME ZONE
) AS $$
DECLARE
    messages_deleted INTEGER;
    typing_cleaned INTEGER;
BEGIN
    -- Clean up expired messages (not saved, not in persistent conversations)
    DELETE FROM messages 
    WHERE expires_at < NOW() 
      AND is_saved = FALSE 
      AND conversation_id NOT IN (
          SELECT id FROM conversations WHERE is_persistent = TRUE
      );
    
    GET DIAGNOSTICS messages_deleted = ROW_COUNT;
    
    -- Clean up expired typing indicators
    DELETE FROM typing_indicators WHERE expires_at < NOW();
    
    GET DIAGNOSTICS typing_cleaned = ROW_COUNT;
    
    -- Log the cleanup operation
    INSERT INTO chat_cleanup_log (
        messages_deleted, 
        typing_indicators_cleaned, 
        executed_at
    ) VALUES (
        messages_deleted, 
        typing_cleaned, 
        NOW()
    );
    
    -- Return results
    RETURN QUERY SELECT 
        messages_deleted, 
        typing_cleaned, 
        NOW();
END;
$$ LANGUAGE plpgsql;

-- Create a log table for cleanup operations
CREATE TABLE chat_cleanup_log (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    messages_deleted INTEGER DEFAULT 0,
    typing_indicators_cleaned INTEGER DEFAULT 0,
    executed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for cleanup log
CREATE INDEX idx_chat_cleanup_log_executed_at ON chat_cleanup_log(executed_at);

-- Function to get cleanup statistics
CREATE OR REPLACE FUNCTION get_cleanup_stats(days_back INTEGER DEFAULT 7)
RETURNS TABLE(
    total_messages_deleted BIGINT,
    total_typing_cleaned BIGINT,
    cleanup_runs INTEGER,
    avg_messages_per_run NUMERIC,
    last_cleanup TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COALESCE(SUM(messages_deleted), 0)::BIGINT as total_messages_deleted,
        COALESCE(SUM(typing_indicators_cleaned), 0)::BIGINT as total_typing_cleaned,
        COUNT(*)::INTEGER as cleanup_runs,
        COALESCE(AVG(messages_deleted), 0) as avg_messages_per_run,
        MAX(executed_at) as last_cleanup
    FROM chat_cleanup_log 
    WHERE executed_at >= NOW() - INTERVAL '1 day' * days_back;
END;
$$ LANGUAGE plpgsql;

-- Function to manually trigger cleanup (for testing)
CREATE OR REPLACE FUNCTION manual_chat_cleanup()
RETURNS TABLE(
    result TEXT,
    messages_deleted INTEGER,
    typing_cleaned INTEGER
) AS $$
DECLARE
    cleanup_result RECORD;
BEGIN
    SELECT * INTO cleanup_result FROM scheduled_chat_cleanup();
    
    RETURN QUERY SELECT 
        'Cleanup completed successfully'::TEXT,
        cleanup_result.expired_messages_deleted,
        cleanup_result.typing_indicators_cleaned;
END;
$$ LANGUAGE plpgsql;

-- Comments
COMMENT ON FUNCTION scheduled_chat_cleanup() IS 'Automated cleanup of expired messages and typing indicators';
COMMENT ON TABLE chat_cleanup_log IS 'Log of automated cleanup operations for monitoring';
COMMENT ON FUNCTION get_cleanup_stats(INTEGER) IS 'Get statistics about cleanup operations over specified days';

-- Note: To enable automatic scheduling, you would need to:
-- 1. Enable pg_cron extension: CREATE EXTENSION pg_cron;
-- 2. Schedule the function: SELECT cron.schedule('chat-cleanup', '0 */6 * * *', 'SELECT scheduled_chat_cleanup();');
-- This would run cleanup every 6 hours
