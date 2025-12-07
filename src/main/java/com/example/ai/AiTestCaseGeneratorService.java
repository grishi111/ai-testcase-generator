package com.example.ai;

import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;

@Service
public class AiTestCaseGeneratorService {

    private final PerplexityClient perplexityClient;

    public AiTestCaseGeneratorService() {
        String key = System.getenv("PPLX_API_KEY");
        this.perplexityClient = (key == null || key.isBlank())
                ? null
                : new PerplexityClient(key);
    }

    public String generateTestCases(String userStory, String apiSpec) {
        if (perplexityClient == null) {
            throw new IllegalStateException("PPLX_API_KEY is not configured; cannot call Perplexity.");
        }

        String systemPrompt =
                "You are an expert QA engineer and test automation architect. " +
                        "Your job is to generate clean, well-structured, easy-to-understand test cases. " +
                        "Always follow the requested output format exactly.";

        String userPrompt =
                "Jira User Story:\n" + userStory + "\n\n" +
                        "API Specification:\n" + apiSpec + "\n\n" +
                        "Generate test cases in MARKDOWN TABLE format only.\n" +
                        "Do not include any explanations before or after the table.\n" +
                        "Generate BETWEEN 30 AND 40 test cases. Do not generate more than 40.\n" +
                        "The table MUST have exactly these columns:\n" +
                        "| ID | Category | Title | Preconditions | Steps | Expected Result | API Endpoint | HTTP Method |\n\n" +
                        "Formatting rules:\n" +
                        "- Use consecutive IDs like TC-001, TC-002, TC-003, etc., with zero padding.\n" +
                        "- Do not create any empty rows.\n" +
                        "- Do not repeat an ID with an empty row below it.\n" +
                        "- Category must be one of: Functional, Negative, Boundary, Security, Performance.\n" +
                        "- Write clear numbered steps in the Steps cell (e.g., \"1. ... 2. ...\").\n" +
                        "- Expected Result must be specific and verifiable.\n" +
                        "- API Endpoint and HTTP Method should be filled when applicable, otherwise use \"N/A\".\n" +
                        "- When you finish the last test case, stop the table; DO NOT start another row.\n";

        List<ChatMessage> messages = new ArrayList<>();
        messages.add(new ChatMessage("system", systemPrompt));
        messages.add(new ChatMessage("user", userPrompt));

        String model = "sonar";
        return perplexityClient.completeChat(messages, model, 0.1, 2048);
    }
}