"""
Zero-dependency Python client for Noktanyus TR API.
Python 3.10+ · urllib only.
"""

from __future__ import annotations

import json
import urllib.error
import urllib.request
from typing import Any, Mapping, Optional


class NoktanyusApiError(Exception):
    def __init__(
        self,
        message: str,
        *,
        code: str,
        status_code: int,
        field_errors: Optional[dict[str, list[str]]] = None,
        form_errors: Optional[list[str]] = None,
    ) -> None:
        super().__init__(message)
        self.message = message
        self.code = code
        self.status_code = status_code
        self.field_errors = field_errors
        self.form_errors = form_errors


class NoktanyusTrClient:
    def __init__(
        self,
        api_key: str,
        *,
        base_url: str = "https://noktanyus.com",
        timeout_s: float = 10.0,
    ) -> None:
        if not api_key or not api_key.strip():
            raise ValueError("NoktanyusTrClient: api_key zorunludur.")
        self.api_key = api_key.strip()
        self.base_url = base_url.rstrip("/")
        self.timeout_s = timeout_s

    def post(self, endpoint: str, payload: Mapping[str, Any] | list[Any]) -> Any:
        path = endpoint if endpoint.startswith("/") else f"/{endpoint}"
        url = f"{self.base_url}{path}"
        body = json.dumps(payload).encode("utf-8")
        req = urllib.request.Request(
            url,
            data=body,
            method="POST",
            headers={
                "Content-Type": "application/json",
                "Accept": "application/json",
                "x-api-key": self.api_key,
                "User-Agent": "noktanyus-python/0.1.0",
            },
        )
        try:
            with urllib.request.urlopen(req, timeout=self.timeout_s) as resp:
                raw = resp.read().decode("utf-8")
                status = getattr(resp, "status", 200)
        except urllib.error.HTTPError as err:
            raw = err.read().decode("utf-8", errors="replace")
            status = err.code
            data = _safe_json(raw)
            raise _error_from_body(data, status) from err
        except urllib.error.URLError as err:
            raise NoktanyusApiError(
                str(err.reason) or "Ağ hatası",
                code="NETWORK_ERROR",
                status_code=0,
            ) from err

        data = _safe_json(raw)
        if status >= 400 or not data or data.get("success") is False:
            raise _error_from_body(data, status)
        return data.get("data")

    def validate_iban(self, iban: str) -> Any:
        return self.post("/api/v1/validate/iban", {"iban": iban})

    def validate_identity(self, *, type: str, value: str) -> Any:
        return self.post("/api/v1/validate/identity", {"type": type, "value": value})

    def validate_phone(self, phone: str, *, type: str = "any") -> Any:
        return self.post("/api/v1/validate/phone", {"phone": phone, "type": type})

    def calculate_kdv(
        self,
        amount_cents: int,
        *,
        vat_rate: int = 20,
        mode: str = "net",
    ) -> Any:
        return self.post(
            "/api/v1/finance/kdv",
            {"amountCents": amount_cents, "vatRate": vat_rate, "mode": mode},
        )

    def business_days(self, start_date: str, end_date: str) -> Any:
        return self.post(
            "/api/v1/calendar/business-days",
            {"startDate": start_date, "endDate": end_date},
        )


def _safe_json(raw: str) -> Any:
    try:
        return json.loads(raw) if raw else None
    except json.JSONDecodeError:
        return None


def _error_from_body(data: Any, status: int) -> NoktanyusApiError:
    err = (data or {}).get("error") if isinstance(data, dict) else None
    code = "UNKNOWN_ERROR"
    message = "API isteği başarısız oldu."
    field_errors = None
    form_errors = None
    if status == 401:
        code = "UNAUTHORIZED"
    if isinstance(err, str):
        message = err
    elif isinstance(err, dict):
        code = str(err.get("code") or code)
        msg = err.get("message")
        if isinstance(msg, str):
            message = msg
        elif isinstance(msg, dict):
            field_errors = msg.get("fieldErrors")
            form_errors = msg.get("formErrors")
            message = "Doğrulama hatası oluştu."
    return NoktanyusApiError(
        message,
        code=code,
        status_code=status,
        field_errors=field_errors,
        form_errors=form_errors,
    )
