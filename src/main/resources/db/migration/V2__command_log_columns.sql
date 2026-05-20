ALTER TABLE chat_messages
    ADD COLUMN message_type VARCHAR(16) NOT NULL DEFAULT 'CHAT',
    ADD COLUMN command_data TEXT;
