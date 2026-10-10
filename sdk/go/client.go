// Package noktanyus is a zero-dependency Go client for the Noktanyus TR API.
// Auth: x-api-key (same as TypeScript / Python SDKs).
package noktanyus

import (
	"bytes"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"strings"
	"time"
)

const defaultBaseURL = "https://noktanyus.com"

// Client talks to Noktanyus over net/http.
type Client struct {
	apiKey     string
	baseURL    string
	httpClient *http.Client
}

// NewClient creates a client with the given API key (X-API-Key / x-api-key).
func NewClient(apiKey string) *Client {
	key := strings.TrimSpace(apiKey)
	return &Client{
		apiKey:  key,
		baseURL: defaultBaseURL,
		httpClient: &http.Client{
			Timeout: 10 * time.Second,
		},
	}
}

// WithBaseURL overrides the API host (tests / self-host).
func (c *Client) WithBaseURL(baseURL string) *Client {
	c.baseURL = strings.TrimRight(baseURL, "/")
	return c
}

// HealthResponse is the body of GET /api/health.
type HealthResponse struct {
	Status string `json:"status"`
}

// IbanResult is data from POST /api/v1/validate/iban.
type IbanResult struct {
	Valid    bool   `json:"valid"`
	IBAN     string `json:"iban,omitempty"`
	BankName string `json:"bankName,omitempty"`
}

// APIError is a non-2xx or unsuccessful envelope response.
type APIError struct {
	Message    string
	Code       string
	StatusCode int
}

func (e *APIError) Error() string {
	return fmt.Sprintf("%s (%s, %d)", e.Message, e.Code, e.StatusCode)
}

// Health calls GET /api/health.
func (c *Client) Health() (*HealthResponse, error) {
	var out HealthResponse
	if err := c.do(http.MethodGet, "/api/health", nil, false, &out); err != nil {
		return nil, err
	}
	return &out, nil
}

// ValidateIBAN calls POST /api/v1/validate/iban.
func (c *Client) ValidateIBAN(iban string) (*IbanResult, error) {
	var out IbanResult
	if err := c.do(http.MethodPost, "/api/v1/validate/iban", map[string]string{"iban": iban}, true, &out); err != nil {
		return nil, err
	}
	return &out, nil
}

func (c *Client) do(method, path string, payload any, expectEnvelope bool, dest any) error {
	if c.apiKey == "" {
		return &APIError{Message: "apiKey required / apiKey zorunludur", Code: "INVALID_CLIENT", StatusCode: 0}
	}

	var body io.Reader
	if payload != nil {
		b, err := json.Marshal(payload)
		if err != nil {
			return err
		}
		body = bytes.NewReader(b)
	}

	url := c.baseURL + path
	req, err := http.NewRequest(method, url, body)
	if err != nil {
		return err
	}
	req.Header.Set("Accept", "application/json")
	req.Header.Set("x-api-key", c.apiKey)
	req.Header.Set("User-Agent", "noktanyus-go/0.1.0")
	if payload != nil {
		req.Header.Set("Content-Type", "application/json")
	}

	resp, err := c.httpClient.Do(req)
	if err != nil {
		return &APIError{Message: err.Error(), Code: "NETWORK_ERROR", StatusCode: 0}
	}
	defer resp.Body.Close()

	raw, err := io.ReadAll(resp.Body)
	if err != nil {
		return err
	}

	if !expectEnvelope {
		if resp.StatusCode >= 400 {
			return errorFromBody(raw, resp.StatusCode)
		}
		if len(raw) == 0 {
			return nil
		}
		return json.Unmarshal(raw, dest)
	}

	var env struct {
		Success bool            `json:"success"`
		Data    json.RawMessage `json:"data"`
		Error   json.RawMessage `json:"error"`
	}
	if err := json.Unmarshal(raw, &env); err != nil || resp.StatusCode >= 400 || !env.Success {
		return errorFromBody(raw, resp.StatusCode)
	}
	if len(env.Data) == 0 || string(env.Data) == "null" {
		return nil
	}
	return json.Unmarshal(env.Data, dest)
}

func errorFromBody(raw []byte, status int) error {
	code := "UNKNOWN_ERROR"
	if status == 401 {
		code = "UNAUTHORIZED"
	}
	msg := "API request failed / API isteği başarısız oldu."

	var envelope struct {
		Error any `json:"error"`
	}
	if json.Unmarshal(raw, &envelope) == nil && envelope.Error != nil {
		switch e := envelope.Error.(type) {
		case string:
			msg = e
		case map[string]any:
			if c, ok := e["code"].(string); ok && c != "" {
				code = c
			}
			if m, ok := e["message"].(string); ok && m != "" {
				msg = m
			}
		}
	}
	return &APIError{Message: msg, Code: code, StatusCode: status}
}
