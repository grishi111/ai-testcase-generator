package com.example.ai;

import java.util.List;

public class ChatCompletionRequest {
    public String model;
    public boolean stream = false;
    public Double temperature;
    public Integer max_tokens;
    public java.util.List<ChatMessage> messages;

    public ChatCompletionRequest() {
    }
}
