package com.example.ai;

import java.util.List;

public class ChatCompletionResponse {
    public String id;
    public String object;
    public long created;
    public String model;
    public java.util.List<ChatCompletionChoice> choices;
    public ChatCompletionUsage usage;
}
