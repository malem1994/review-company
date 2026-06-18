# Định nghĩa logic — Website đánh giá công ty tại Việt Nam

Tài liệu này là nguồn logic chính cho FE. Mọi component, store, service mock và validation phải tuân theo các quy tắc bên dưới.

## 1. Mục tiêu sản phẩm

Website cho phép người dùng xem danh sách công ty tại Việt Nam dưới dạng card và đánh giá từng công ty theo 3 chỉ số:

1. Phúc lợi công ty.
2. Môi trường công ty.
3. Ban lãnh đạo công ty.

Mỗi chỉ số có thang điểm từ `1` đến `5`. Điểm tổng của công ty là trung bình cộng của 3 chỉ số, làm tròn đúng 1 chữ số thập phân và luôn hiển thị bằng dấu `.`.

## 2. Thuật ngữ

- **Company**: công ty được listing.
- **Rating record**: một lượt đánh giá gồm 3 điểm chỉ số + bình luận.
- **Active rating**: đánh giá hiện tại của một tác giả trên một công ty. MVP chỉ giữ một active rating cho mỗi tác giả trên mỗi công ty.
- **Authorized user**: người dùng đã đăng nhập/được xác thực.
- **Anonymous user**: người dùng chưa đăng nhập, phải nhập nickname để đánh giá.
- **Nickname**: tên hiển thị công khai cho anonymous user.

## 3. Data model

### `Company`

```ts
export interface Company {
  id: string;
  name: string;
  logo?: string;
  slug: string;
  description?: string;
  industry?: string;
  location?: string;
  averageRating: number;
  reviewCount: number;
  createdAt: Date;
  updatedAt: Date;
}
```

Quy tắc:

- `averageRating` là số đã tính từ các rating record.
- `averageRating` luôn nằm trong khoảng `0.0` đến `5.0`.
- `averageRating` phải được hiển thị với đúng 1 chữ số thập phân.
- `reviewCount` bằng số active rating records của công ty.

### `CompanyRating`

```ts
export interface CompanyRating {
  id: string;
  companyId: string;
  userId?: string;
  nickname?: string;
  benefits: number;
  environment: number;
  leadership: number;
  comment: string;
  createdAt: Date;
  updatedAt: Date;
}
```

Quy tắc:

- Nếu `userId` tồn tại, record thuộc về authorized user.
- Nếu `userId` không tồn tại, `nickname` bắt buộc và record thuộc về anonymous user.
- `benefits`, `environment`, `leadership` phải là số nguyên từ `1` đến `5`.
- `comment` sau khi `trim()` phải có độ dài tối thiểu theo `MIN_COMMENT_LENGTH`.

### `RatingFormData`

```ts
export interface RatingFormData {
  benefits: number;
  environment: number;
  leadership: number;
  comment: string;
  nickname?: string;
}
```

### `RatingAuthor`

```ts
export type RatingAuthor =
  | { type: 'user'; userId: string }
  | { type: 'anonymous'; nickname: string };
```

## 4. Công thức tính điểm công ty

Với một công ty có `N` active rating records:

```ts
sum = tổng(benefits + environment + leadership) của mọi active rating record
average = sum / (N * 3)
averageRating = roundToOneDecimal(average)
```

Quy tắc làm tròn:

- Chỉ dùng dấu `.` cho phần thập phân.
- Luôn hiển thị đúng 1 chữ số thập phân.
- Ví dụ:
  - `4` → `4.0`
  - `4.3333` → `4.3`
  - `4.3666` → `4.4`
  - `0` → `0.0`

```ts
export function roundToOneDecimal(value: number): number {
  return Math.round(value * 10) / 10;
}

export function formatRatingDisplay(value: number): string {
  return roundToOneDecimal(value).toFixed(1);
}
```

## 5. Validation form

### 5.1. Điểm rating

Mỗi chỉ số:

- Bắt buộc.
- Phải là số nguyên.
- Phải nằm trong đoạn `[1, 5]`.

Các chỉ số hợp lệ:

- `benefits`
- `environment`
- `leadership`

Các chỉ số không hợp lệ:

- `0`
- `-1`
- `6`
- số thập phân như `3.5`
- chuỗi rỗng
- `NaN`

### 5.2. Bình luận

- Bắt buộc.
- Sau khi `trim()` phải có độ dài tối thiểu `MIN_COMMENT_LENGTH = 20`.
- Không yêu cầu tối đa trong MVP, nhưng UI nên hiển thị số ký tự đã nhập để tránh nhầm lẫn.

Thông báo lỗi khuyến nghị:

```txt
Bình luận phải có ít nhất 20 ký tự
```

### 5.3. Nickname cho anonymous

Anonymous user phải nhập nickname khi đánh giá.

Quy tắc nickname:

- Bắt buộc.
- Sau khi `trim()` không được rỗng.
- Tối đa 50 ký tự.
- Chỉ dùng để hiển thị công khai, không dùng làm định danh bảo mật.

Thông báo lỗi khuyến nghị:

```txt
Nickname là bắt buộc cho người dùng ẩn danh
```

## 6. Quy tắc anonymous và authorized user

### 6.1. Anonymous user

Anonymous user chưa đăng nhập nên cần nhập nickname.

MVP áp dụng quy tắc chặt:

- Một anonymous user chỉ có tối đa **một active rating** cho **một công ty**.
- Active rating đó được xác định bởi `companyId`.
- Khi anonymous đã có active rating cho công ty, UI phải chuyển sang chế độ chỉnh sửa thay vì tạo thêm record mới.
- Không cho phép anonymous tạo nhiều active rating cho cùng một công ty bằng nhiều nickname khác nhau.
- Nickname của anonymous có thể được dùng cho công ty khác, vì quy tắc giới hạn được định nghĩa theo từng công ty.

Khóa định danh anonymous trong FE:

```ts
getRatingKey(companyId, undefined, nickname)
// kết quả: `${companyId}:anonymous:${normalizedNickname}`
```

Khi kiểm tra duplicate anonymous cho cùng công ty:

- Nếu đã có rating với `userId` undefined cho `companyId`, chặn tạo mới.
- Nếu đang chỉnh sửa chính record đó, cho phép update.

### 6.2. Authorized user

Authorized user đã đăng nhập và có `userId`.

MVP áp dụng quy tắc:

- Authorized user có thể đánh giá nhiều công ty.
- Mỗi authorized user chỉ có tối đa **một active rating** cho **một công ty**.
- Khi đã có active rating cho công ty, UI phải chuyển sang chế độ chỉnh sửa.
- Không cho phép tạo thêm active rating mới cho cùng cặp `userId + companyId`.

Khóa định danh authorized user trong FE:

```ts
getRatingKey(companyId, userId, undefined)
// kết quả: `${companyId}:user:${userId}`
```

## 7. Hành vi UI

### 7.1. Listing page

Trang chính hiển thị danh sách công ty dạng grid/card.

Mỗi card phải có:

- Logo công ty.
- Tên công ty.
- Ngành nghề hoặc địa điểm nếu có.
- Điểm trung bình công ty dạng `X.X`.
- Số lượng đánh giá.
- Nút hoặc vùng bấm để mở chi tiết.

Khi bấm vào card:

- Mở drawer chi tiết công ty.
- Không điều hướng sang route khác trong MVP.

### 7.2. Company drawer

Drawer chi tiết phải hiển thị:

- Header gồm tên công ty và nút đóng.
- Logo công ty.
- Ngành nghề, địa điểm, mô tả nếu có.
- Điểm trung bình công ty dạng `X.X`.
- Số lượng đánh giá.
- 3 chỉ số trung bình chi tiết:
  - Phúc lợi công ty.
  - Môi trường công ty.
  - Ban lãnh đạo công ty.
- Form đánh giá.
- Danh sách đánh giá đã submit.

### 7.3. Form đánh giá

Form gồm:

- 3 bộ sao rating cho 3 chỉ số.
- Preview điểm trung bình tạm tính khi người dùng chọn điểm.
- Nickname nếu chưa đăng nhập.
- Bình luận với counter ký tự.
- Nút submit:
  - `Gửi đánh giá` nếu chưa có active rating.
  - `Cập nhật đánh giá` nếu đang chỉnh sửa active rating.

Khi submit thành công:

1. Service tạo hoặc cập nhật active rating.
2. Recalculate `averageRating` của công ty.
3. Cập nhật danh sách rating trong drawer.
4. Cập nhật card/listing nếu đang hiển thị công ty đó.
5. Reset trạng thái submit.

Khi submit thất bại:

- Hiển thị lỗi rõ ràng.
- Không reset form.
- Không tạo duplicate rating.

## 8. Service contract

### `companyService`

```ts
getAllCompanies(): Promise<Company[]>
getCompanyById(id: string): Promise<Company | null>
getCompanyBySlug(slug: string): Promise<Company | null>
recalcCompanyAverage(companyId: string): Promise<Company | null>
```

`recalcCompanyAverage` phải:

- Lọc active ratings theo `companyId`.
- Nếu không có rating, đặt `averageRating = 0.0`, `reviewCount = 0`.
- Nếu có rating, tính trung bình 3 chỉ số trên tất cả active ratings.
- Làm tròn 1 chữ số thập phân bằng `.`.
- Cập nhật `reviewCount`.

### `ratingService`

```ts
getRatingsByCompany(companyId: string): Promise<CompanyRating[]>
getUserRatingForCompany(companyId: string, userId?: string, nickname?: string): Promise<CompanyRating | null>
createRating(input: CreateRatingInput): Promise<CompanyRating>
updateRating(ratingId: string, input: UpdateRatingInput): Promise<CompanyRating>
deleteRating(ratingId: string): Promise<void>
```

### `CreateRatingInput`

```ts
export interface CreateRatingInput {
  companyId: string;
  userId?: string;
  nickname?: string;
  benefits: number;
  environment: number;
  leadership: number;
  comment: string;
}
```

### `UpdateRatingInput`

```ts
export interface UpdateRatingInput {
  benefits?: number;
  environment?: number;
  leadership?: number;
  comment?: string;
}
```

## 9. Quy tắc service enforce

Service mock phải kiểm tra lại logic, không chỉ UI.

### 9.1. Validate rating input

Trước khi tạo hoặc cập nhật:

- Company phải tồn tại.
- 3 chỉ số phải hợp lệ.
- Comment sau `trim()` phải đủ `MIN_COMMENT_LENGTH`.
- Authorized user phải có `userId`.
- Anonymous user phải có `nickname` sau `trim()`.

### 9.2. Duplicate active rating

Trước khi tạo mới:

- Nếu `userId` tồn tại và đã có active rating của `userId` cho `companyId`, ném lỗi.
- Nếu `userId` không tồn tại và đã có anonymous active rating cho `companyId`, ném lỗi.

Thông báo lỗi khuyến nghị:

```txt
Bạn đã đánh giá công ty này. Vui lòng chỉnh sửa đánh giá hiện tại.
```

### 9.3. Update

Update chỉ được phép trên rating record đang tồn tại.

- Không được đổi `companyId`.
- Không được đổi `userId`.
- Không được đổi anonymous nickname sang nickname khác trong MVP.
- Có thể cập nhật 3 chỉ số và comment.

### 9.4. Delete

Delete chỉ dùng cho mock/test hoặc chức năng xóa nếu có sau này.

Khi xóa:

- Xóa rating record.
- Recalculate company average.
- Không xóa user account.

## 10. Thứ tự ưu tiên logic

Khi có xung đột giữa UI, store và service:

1. Service là lớp enforce cuối cùng.
2. Store phải phản ánh service và không cho phép duplicate local state.
3. UI dùng validation để chặn sớm và hiển thị lỗi thân thiện.

## 11. shadcn/ui requirement

FE sử dụng Next.js + TypeScript + shadcn/ui.

Các component shadcn khuyến nghị cho MVP:

- `Button`
- `Input`
- `Textarea`
- `Sheet` cho company drawer.
- `Card` cho company card.
- `Badge` cho rating badge.
- Optional `Form` nếu tích hợp với React Hook Form.

Component đặc thù nghiệp vụ như `RatingStars` có thể giữ riêng, nhưng style nên đồng bộ với shadcn/Tailwind.

## 12. Checklist kiểm thử logic

- Card hiển thị logo, tên công ty, rating dạng `X.X`, số đánh giá.
- Bấm card mở drawer.
- Drawer hiển thị chi tiết công ty và 3 chỉ số rating.
- Form yêu cầu đủ 3 chỉ số từ 1 đến 5.
- Form yêu cầu bình luận tối thiểu 20 ký tự sau `trim()`.
- Anonymous bắt buộc nhập nickname.
- Anonymous đã đánh giá công ty thì không tạo thêm rating mới cho công ty đó.
- Authorized user có thể đánh giá nhiều công ty.
- Authorized user đã đánh giá công ty thì chỉ chỉnh sửa active rating của công ty đó.
- Sau submit, điểm công ty được tính lại đúng 1 chữ số thập phân bằng dấu `.`.
- Service mock chặn duplicate rating ngay cả khi UI bị bypass.
