package com.example.ai;

import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.client.RestTemplate;

import java.util.List;

public class PerplexityClient {

    private static final String API_URL = "https://api.perplexity.ai/chat/completions";
    private final RestTemplate restTemplate = new RestTemplate();
    private final String apiKey;

    public PerplexityClient(String apiKey) {
        this.apiKey = apiKey;
    }

    public String completeChat(List<ChatMessage> messages,
                               String model,
                               double temperature,
                               int maxTokens) {

        ChatCompletionRequest req = new ChatCompletionRequest();
        req.model = model;
        req.temperature = temperature;
        req.max_tokens = maxTokens;
        req.stream = false;
        req.messages = messages;

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        headers.setBearerAuth(apiKey);

        HttpEntity<ChatCompletionRequest> entity = new HttpEntity<>(req, headers);

        ResponseEntity<ChatCompletionResponse> response =
                restTemplate.exchange(API_URL, HttpMethod.POST, entity, ChatCompletionResponse.class);

        ChatCompletionResponse body = response.getBody();
        if (body == null || body.choices == null || body.choices.isEmpty()) {
            throw new IllegalStateException("Empty response from Perplexity");
        }
        if (body.choices.get(0).message == null) {
            throw new IllegalStateException("No message in Perplexity response");
        }
        return body.choices.get(0).message.content;
    }
}
