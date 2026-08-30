ALTER TABLE friend_messages ADD COLUMN recalled_at TIMESTAMP NULL DEFAULT NULL;

CREATE TABLE friend_message_deletions (
    message_id BIGINT NOT NULL,
    user_id INT NOT NULL,
    deleted_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (message_id, user_id),
    CONSTRAINT fk_friend_message_deletions_message FOREIGN KEY (message_id) REFERENCES friend_messages(id) ON DELETE CASCADE,
    CONSTRAINT fk_friend_message_deletions_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
