package com.example.ai;

public class ChatMessage {
    public String role;
    public String content;

    public ChatMessage() {
    }

    public ChatMessage(String role, String content) {
        this.role = role;
        this.content = content;
    }
}
