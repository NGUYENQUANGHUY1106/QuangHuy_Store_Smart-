# DATA MODEL, API & UI DESIGN SPEC

**Dự án:** QuangHuy_Sport  |  **Ngày:** 16/11/2026  |  **Trạng thái:** DRAFT

> Tài liệu đề xuất. Chưa có kết quả triển khai hoặc kiểm thử thực tế.

## Entity Catalog

- User — id,email,password_hash,status
- Address — user_id,receiver,phone,street,area,is_default
- Category — name,slug,parent_id
- Product — name,slug,description,brand,status
- ProductVariant — product_id,sku,size,color,price,stock_qty
- ProductImage — product_id/variant_id,file_url,sort
- CartItem — user_id,variant_id,qty
- Order — user_id,status,subtotal,discount,shipping,total,idempotency_key
- OrderItem — order_id,variant_id,sku_snapshot,price_snapshot,qty
- InventoryMovement — variant_id,delta,reference,reason
- Voucher — code,discount_type,value,usage_limits
- Review — order_item_id,user_id,rating,body
- TryOnJob — user_id,variant_id,input_ref,output_ref,status,consent_at,expires_at

## API Catalog (proposed)

- POST /auth/register; POST /auth/login; POST /auth/logout
- GET /products; GET /products/{slug}; GET /search/suggestions
- GET/POST/PATCH/DELETE /cart/items
- POST /checkout/orders; GET /orders; GET /orders/{id}
- GET/POST/PATCH /admin/products; /admin/variants; /admin/orders
- POST /tryon/jobs; GET /tryon/jobs/{id}; DELETE /tryon/jobs/{id}
- POST /payments/sandbox/create; POST /payments/webhooks/{provider} (P2)

## Screen Inventory — Customer

- Home, Category, Search Results, Product Detail, Auth, Profile, Addresses, Cart, Checkout COD, Order Success, Orders, Order Detail, AI Try-on Upload, AI Result, Privacy/Consent

## Screen Inventory — Admin

- Dashboard, Product List/Edit, Variant/Stock, Orders List/Detail, Categories, Voucher (P2), Users (P2)

## Design QA

- Responsive desktop/tablet/mobile; keyboard; loading/empty/error states
- Design tokens/tables and components in Figma later; chưa có asset hoặc screen thiết kế được duyệt
