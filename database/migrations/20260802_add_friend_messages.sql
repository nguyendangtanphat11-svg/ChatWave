CREATE TABLE IF NOT EXISTS friend_messages (
    id BIGINT NOT NULL AUTO_INCREMENT,
    conversation_id VARCHAR(64) NOT NULL,
    sender_id INT NOT NULL,
    receiver_id INT NOT NULL,
    message TEXT NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    INDEX idx_friend_messages_conversation (conversation_id, created_at),
    CONSTRAINT fk_friend_messages_sender FOREIGN KEY (sender_id) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT fk_friend_messages_receiver FOREIGN KEY (receiver_id) REFERENCES users(id) ON DELETE CASCADE
);
