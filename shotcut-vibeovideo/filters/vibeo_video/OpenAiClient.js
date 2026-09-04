.pragma library

// OpenAiClient.js - vibeoVideo Shotcut OpenAI API Integration Client
// Communicates with OpenAI REST endpoints using Qt Quick XMLHttpRequest

function parseErrorMessage(xhr) {
    try {
        var response = JSON.parse(xhr.responseText);
        if (response && response.error && response.error.message) {
            return response.error.message;
        }
    } catch (e) {
        // Not JSON
    }
    if (xhr.status === 401) {
        return "Invalid or unauthorized API key. Check your OpenAI API key in the Settings tab.";
    } else if (xhr.status === 429) {
        return "Rate limit reached or insufficient quota. Check your OpenAI account billing/credits.";
    } else if (xhr.status === 0) {
        return "Network connection error or timeout. Check your internet connection.";
    }
    return "HTTP " + xhr.status + ": " + (xhr.statusText || "Request failed");
}

function testApiKey(apiKey, callback) {
    if (!apiKey || apiKey.trim() === "") {
        callback(new Error("API key cannot be empty."), false, "API key is required.");
        return;
    }

    var xhr = new XMLHttpRequest();
    xhr.open("GET", "https://api.openai.com/v1/models");
    xhr.setRequestHeader("Authorization", "Bearer " + apiKey.trim());
    xhr.setRequestHeader("Content-Type", "application/json");
    xhr.timeout = 15000;

    xhr.onreadystatechange = function() {
        if (xhr.readyState === XMLHttpRequest.DONE) {
            if (xhr.status >= 200 && xhr.status < 300) {
                callback(null, true, "Connection successful! API key is verified.");
            } else {
                var msg = parseErrorMessage(xhr);
                callback(new Error(msg), false, msg);
            }
        }
    };

    xhr.ontimeout = function() {
        callback(new Error("Connection timed out."), false, "Request timed out after 15 seconds.");
    };

    xhr.onerror = function() {
        callback(new Error("Network error."), false, "Could not reach OpenAI API.");
    };

    try {
        xhr.send();
    } catch (err) {
        callback(err, false, "Failed to send request: " + err.message);
    }
}

function chatCompletion(apiKey, model, systemPrompt, userPrompt, temperature, maxTokens, callback) {
    if (!apiKey || apiKey.trim() === "") {
        callback(new Error("OpenAI API key is missing. Enter your key in the 'Settings' tab."));
        return;
    }

    if (!userPrompt || userPrompt.trim() === "") {
        callback(new Error("Prompt cannot be empty."));
        return;
    }

    var payload = {
        model: model || "gpt-4o-mini",
        messages: [
            {
                role: "system",
                content: systemPrompt || "You are vibeoVideo, an expert video editor AI. Generate concise, punchy text for video graphics without quotes or markdown formatting."
            },
            {
                role: "user",
                content: userPrompt
            }
        ],
        temperature: (typeof temperature === "number") ? temperature : 0.7,
        max_tokens: maxTokens || 350
    };

    var xhr = new XMLHttpRequest();
    xhr.open("POST", "https://api.openai.com/v1/chat/completions");
    xhr.setRequestHeader("Authorization", "Bearer " + apiKey.trim());
    xhr.setRequestHeader("Content-Type", "application/json");
    xhr.timeout = 30000;

    xhr.onreadystatechange = function() {
        if (xhr.readyState === XMLHttpRequest.DONE) {
            if (xhr.status >= 200 && xhr.status < 300) {
                try {
                    var response = JSON.parse(xhr.responseText);
                    if (response.choices && response.choices.length > 0 && response.choices[0].message) {
                        var text = response.choices[0].message.content.trim();
                        // Clean up markdown formatting if present
                        text = text.replace(/^```[a-z]*\n?/i, "").replace(/\n?```$/i, "").trim();
                        if (text.startsWith('"') && text.endsWith('"')) {
                            text = text.slice(1, -1);
                        }
                        callback(null, text, response.usage);
                    } else {
                        callback(new Error("No completion choices returned by OpenAI."));
                    }
                } catch (e) {
                    callback(new Error("Failed to parse OpenAI response: " + e.message));
                }
            } else {
                callback(new Error(parseErrorMessage(xhr)));
            }
        }
    };

    xhr.ontimeout = function() {
        callback(new Error("Request timed out after 30 seconds."));
    };

    xhr.onerror = function() {
        callback(new Error("Network error connecting to OpenAI API."));
    };

    try {
        xhr.send(JSON.stringify(payload));
    } catch (err) {
        callback(err);
    }
}

function generateImage(apiKey, prompt, size, quality, style, callback) {
    if (!apiKey || apiKey.trim() === "") {
        callback(new Error("OpenAI API key is missing. Enter your key in the 'Settings' tab."));
        return;
    }

    if (!prompt || prompt.trim() === "") {
        callback(new Error("Image prompt cannot be empty."));
        return;
    }

    var payload = {
        model: "dall-e-3",
        prompt: prompt,
        n: 1,
        size: size || "1792x1024", // 16:9 cinematic landscape for video
        quality: quality || "standard",
        style: style || "vivid",
        response_format: "url"
    };

    var xhr = new XMLHttpRequest();
    xhr.open("POST", "https://api.openai.com/v1/images/generations");
    xhr.setRequestHeader("Authorization", "Bearer " + apiKey.trim());
    xhr.setRequestHeader("Content-Type", "application/json");
    xhr.timeout = 75000;

    xhr.onreadystatechange = function() {
        if (xhr.readyState === XMLHttpRequest.DONE) {
            if (xhr.status >= 200 && xhr.status < 300) {
                try {
                    var response = JSON.parse(xhr.responseText);
                    if (response.data && response.data.length > 0) {
                        var imgUrl = response.data[0].url;
                        var revised = response.data[0].revised_prompt || prompt;
                        callback(null, imgUrl, revised);
                    } else {
                        callback(new Error("No image data returned by DALL-E."));
                    }
                } catch (e) {
                    callback(new Error("Failed to parse image response: " + e.message));
                }
            } else {
                callback(new Error(parseErrorMessage(xhr)));
            }
        }
    };

    xhr.ontimeout = function() {
        callback(new Error("DALL-E generation timed out after 75 seconds."));
    };

    xhr.onerror = function() {
        callback(new Error("Network error connecting to DALL-E API."));
    };

    try {
        xhr.send(JSON.stringify(payload));
    } catch (err) {
        callback(err);
    }
}
