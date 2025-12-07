package com.example.ai;

import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/ai-tests")
public class AiTestCaseController {

    private final AiTestCaseGeneratorService generatorService;

    public AiTestCaseController(AiTestCaseGeneratorService generatorService) {
        this.generatorService = generatorService;
    }

    public static class TestGenRequest {
        public String userStoryText;
        public String apiSpecText;

        public TestGenRequest() {
        }
    }

    public static class TestGenResponse {
        public String generatedTestCases;

        public TestGenResponse(String generatedTestCases) {
            this.generatedTestCases = generatedTestCases;
        }
    }
    // <<< PLACE IT HERE >>>
    @GetMapping("/debug-key")
    public String debugKey() {
        String key = System.getenv("PPLX_API_KEY");
        return (key == null || key.isBlank())
                ? "PPLX_API_KEY is NULL/empty"
                : "PPLX_API_KEY is set";
    }
    @PostMapping(
            value = "/generate",
            consumes = MediaType.APPLICATION_JSON_VALUE,
            produces = MediaType.APPLICATION_JSON_VALUE
    )
    public TestGenResponse generate(@RequestBody TestGenRequest request) {
        String result = generatorService.generateTestCases(
                request.userStoryText,
                request.apiSpecText != null ? request.apiSpecText : ""
        );
        return new TestGenResponse(result);
    }
}