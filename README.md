# WattWiser

**NILM (Non-Intrusive Load Monitoring).** Một cảm biến Shelly EM Gen3 với kẹp CT
đo điện năng của cả ngôi nhà; hệ thống suy ngược để nhận diện từng thiết bị, để
một hộ gia đình thấy được tiền điện của mình đi đâu.

*One Shelly EM Gen3 with a CT clamp measures whole-house electricity; the system
works backwards to identify individual appliances, so a household can see where
the bill goes.*

---

## Tiếng Việt

### Vấn đề

Bạn nhận một hoá đơn tiền điện với một con số tổng, và không biết tiền đi đâu.
Gắn đồng hồ đo riêng cho từng thiết bị thì cần thợ điện, cần một ổ cắm thông minh
cho mỗi ổ cắm, và tốn một khoản gần như không ai chịu bỏ ra.

WattWiser giải quyết chuyện đó bằng **đúng một cảm biến** đặt ở đồng hồ tổng.

### Cách hoạt động

Cảm biến chỉ báo về **một** con số — công suất cả nhà, mỗi giây một lần. Để suy
ngược ra từng thiết bị, hệ thống cần hai thứ mà cảm biến không tự biết:

1. **Nhà bạn có gì** — khai báo một lần qua hồ sơ hộ gia đình và danh sách thiết bị
2. **Mỗi thiết bị "trông như thế nào" trong dữ liệu** — học qua quá trình hiệu chuẩn có hướng dẫn

Vì thế **giao diện nhập liệu mới là mục tiêu chính của dự án**, không phải
dashboard. Dashboard là thứ mà giao diện nhập liệu làm cho khả thi.

### Chạy tại máy

Cần sẵn: Docker Desktop, Supabase CLI, [mise](https://mise.jdx.dev), [just](https://just.systems).

```bash
mise install                  # Node 22.23.1 + pnpm 10.26.2
just install                  # cài thư viện (CHỈ pnpm, không bao giờ npm)
cp .env.example .env.local    # trỏ tới database local
just up                       # khởi động Supabase trong Docker
just migrate                  # tạo các bảng
just seed                     # nạp 30 ngày dữ liệu demo
just run                      # http://localhost:3000
```

Gõ `just` để xem toàn bộ lệnh có sẵn.

### Các màn hình

| Đường dẫn | Dùng để |
|---|---|
| `/dashboard` | Công suất tức thời, điện năng hôm nay, biểu đồ 60 giây |
| `/setup` | Hồ sơ hộ gia đình và biểu giá điện |
| `/appliances` | Danh sách thiết bị (thêm, sửa, xoá) |
| `/calibration/<id>` | Trình hướng dẫn hiệu chuẩn 5 bước — **trái tim của dự án** |
| `/breakdown` | kWh và chi phí theo từng thiết bị, kèm độ tin cậy |
| `/confirm` | Hàng đợi "đây có phải máy rửa bát của bạn không?" |
| `/dev` | Bảng điều khiển demo — không phải màn hình khách hàng |

### Tài liệu

- **[`CLAUDE.md`](./CLAUDE.md)** — bản tóm tắt dự án, các quyết định đã chốt, quy tắc làm việc
- **[`docs/README.md`](./docs/README.md)** — chỉ mục toàn bộ tài liệu kỹ thuật

> Bộ tài liệu tiếng Việt chi tiết (tổng quan, kiến trúc, hướng dẫn sử dụng, tám
> use case kèm kịch bản quay video) nằm ở `docs/vi/` trên máy local — thư mục này
> không được commit lên git.

---

## English

### The problem

A household gets one electricity bill and no idea what drove it. Metering every
appliance individually means an electrician, a smart plug per socket, and a cost
nobody will pay.

WattWiser solves it with **one sensor** at the meter.

### How it works

The sensor reports a single number — whole-house power, roughly once a second.
Working backwards from that needs two things the sensor cannot supply:

1. **What the household owns** — declared once, in the setup form and the appliance inventory
2. **What each appliance looks like in the data** — learned through guided calibration

That is why **the input UI is the primary goal**, not the dashboard. The
dashboard is what the input UI makes possible.

### Architecture

Two sides that never call each other. They meet only at a shared PostgreSQL
database (Supabase).

| Side | Stack | Owns |
|---|---|---|
| **Web** | Next.js on Vercel | every screen, every API route, the database schema |
| **Data** | separate Python service | MQTT subscriber, edge detection, event pairing, signature building |

The data side's output (`readings`, `events`, `appliance_signatures`) is **mocked
by the web side**, so every screen works end to end before the pipeline exists.

### Running locally

Prerequisites: Docker Desktop, Supabase CLI, [mise](https://mise.jdx.dev), [just](https://just.systems).

```bash
mise install                  # Node 22.23.1 + pnpm 10.26.2
just install                  # install packages (pnpm ONLY — never npm)
cp .env.example .env.local    # points at the local database
just up                       # start Supabase in Docker
just migrate                  # create the tables
just seed                     # load 30 days of demo data
just run                      # http://localhost:3000
```

Run `just` to list every command.

### Two databases, one rule

Local code only ever talks to the local database. The hosted connection string
lives **only** in Vercel's environment variables, never in a file on your
machine — `lib/db/target.ts` enforces this. Migrations reach the hosted database
only through the Vercel build (`vercel-build`).

### Shipping a change

```bash
just check    # production build + lint + cost-maths checks — what Vercel runs
git commit -m "<emoji> <type>: <message>"
git push
```

Then confirm the Vercel build is green and **open the live URL**. A green build
means the code compiled, not that the page works.

**Never stack new work on a red build.**

### Documentation

| I need to… | Read |
|---|---|
| Understand the project and its locked decisions | [`CLAUDE.md`](./CLAUDE.md) |
| Find the spec for a task | [`docs/README.md`](./docs/README.md) |
| Build or change a page | [`docs/specs/screens.md`](./docs/specs/screens.md) |
| Add or alter a table | [`docs/specs/data-contract.md`](./docs/specs/data-contract.md) |
| Add or change an API route | [`docs/specs/api-routes.md`](./docs/specs/api-routes.md) |

### Stack

Next.js 16 · React 19 · Tailwind CSS v4 · shadcn/ui · Drizzle ORM · PostgreSQL
(Supabase) · Vercel · pnpm
