# Noktanyus Python SDK

Stdlib-only istemci (`urllib`). Bağımlılık yok.

```bash
# repodan
export PYTHONPATH=sdk/python
python -c "from noktanyus import NoktanyusTrClient; print('ok')"
```

```python
from noktanyus import NoktanyusTrClient, NoktanyusApiError

client = NoktanyusTrClient("ny_live_xxx")

try:
    iban = client.validate_iban("TR330006100519786457841326")
    print(iban["valid"], iban.get("bankName"))
except NoktanyusApiError as e:
    print(e.code, e.status_code, e.message)
```

Docs: https://noktanyus.com/docs/sdk
