# Noktanyus Go SDK

**TR:** Sıfır bağımlılık — yalnızca `net/http` (Go 1.21+).  
**EN:** Zero deps — `net/http` only (Go 1.21+).

```bash
# from repo
cd sdk/go && go build ./...
# or: go get github.com/Noktanyus/noktanyus-porfoy/sdk/go
```

```go
import "github.com/Noktanyus/noktanyus-porfoy/sdk/go"

client := noktanyus.NewClient("ny_live_xxx")

health, err := client.Health()
if err != nil { /* *noktanyus.APIError */ }
fmt.Println(health.Status)

iban, err := client.ValidateIBAN("TR330006100519786457841326")
if err != nil { /* handle */ }
fmt.Println(iban.Valid, iban.BankName)
```

Auth header: `x-api-key` (same as TypeScript / Python).  
Docs: https://noktanyus.com/docs/sdk

Also see: `sdk/typescript/` · `sdk/python/`
