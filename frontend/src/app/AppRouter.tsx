import { AdminManagePage } from '../pages/AdminManagePage'
import {
  BrowserRouter,
  Navigate,
  Route,
  Routes,
  useParams,
} from 'react-router-dom'
import { AdminLayout } from '../layouts/AdminLayout'
import { CustomerLayout } from '../layouts/CustomerLayout'
import { HomePage } from '../pages/HomePage'
import { CatalogPage } from '../pages/CatalogPage'
import { ProductDetailPage } from '../pages/ProductDetailPage'
import { CartPage } from '../pages/CartPage'
import { CheckoutPage } from '../pages/CheckoutPage'
import { OrderSuccessPage } from '../pages/OrderSuccessPage'
import { AdminCatalogPage } from '../pages/AdminCatalogPage'
import { AdminInventoryPage } from '../pages/AdminInventoryPage'
import {
  LoginPage,
  RegisterPage,
  ForgotPasswordPage,
  ResetPasswordPage,
} from '../pages/AuthPages'
import {
  AccountLayoutPage,
  ProfilePage,
  AddressesPage,
  SecurityPage,
} from '../pages/AccountPages'
import { OrdersPage, OrderDetailPage } from '../pages/OrdersPages'
import {
  BrandsPage,
  SupportPage,
  FaqPage,
  SizeGuidePage,
  WishlistPage,
  VouchersPage,
  NotificationsPage,
  NotFoundPage,
  SystemStatePage,
} from '../pages/InformationPages'
import { NewReviewPage, ReviewHistoryPage } from '../pages/ReviewsPages'
import { AdminReviewsPage } from '../pages/AdminReviewsPage'
import { AdminMessagesPage } from '../pages/AdminMessagesPage'
import { CustomerProductChat } from '../components/CustomerProductChat'
import {
  VerifyEmailPage,
  TrackOrderPage,
  ArticlesPage,
  ArticleDetailPage,
} from '../pages/AuxiliaryPages'
import {
  PaymentSandboxPage,
  AiTryOnIntroPage,
  AiTryOnUploadPage,
  AiTryOnStatusPage,
  AiTryOnResultPage,
  AiPrivacyPage,
} from '../pages/AiPaymentPages'
import {
  AdminDashboardPage,
  AdminProductsPage,
  AdminProductFormPage,
  AdminOrdersPage,
  AdminOrderDetailPage,
  AdminGenericPage,
  AdminLoginPage,
} from '../pages/AdminPages'
import { adminRoutes, customerRoutes, systemRoutes } from '../routes/appRoutes'

function CategoryRoute() {
  const { slug } = useParams()
  return <CatalogPage categorySlug={slug} />
}

function GalleryRoute() {
  const { slug } = useParams()
  return <ProductDetailPage key={slug} />
}

function QuickViewRoute() {
  return <Navigate to="/products/nike-mercurial-vapor-16-elite" replace />
}

export function AppRouter() {
  return (
    <BrowserRouter>
      <CustomerProductChat>
        <Routes>
          <Route element={<CustomerLayout />}>
            {customerRoutes
              .filter(
                (route) =>
                  ![
                    'C19',
                    'C29',
                    'C30',
                    'C31',
                    'C32',
                    'C33',
                    'C34',
                    'C35',
                    'C36',
                    'C39',
                  ].includes(route.code),
              )
              .map((route) =>
                route.code === 'C01' ? (
                  <Route
                    key={route.code}
                    path={route.path}
                    element={<HomePage />}
                  />
                ) : route.code === 'C02' ? (
                  <Route
                    key={route.code}
                    path="/categories"
                    element={<CatalogPage />}
                  />
                ) : route.code === 'C03' ? (
                  <Route
                    key={route.code}
                    path="/category/:slug"
                    element={<CategoryRoute />}
                  />
                ) : route.code === 'C05' ? (
                  <Route
                    key={route.code}
                    path="/search"
                    element={<CatalogPage />}
                  />
                ) : route.code === 'C04' ? (
                  <Route
                    key={route.code}
                    path="/search/suggestions"
                    element={<CatalogPage />}
                  />
                ) : route.code === 'C07' ? (
                  <Route
                    key={route.code}
                    path="/products/:slug/gallery"
                    element={<GalleryRoute />}
                  />
                ) : route.code === 'C09' ? (
                  <Route
                    key={route.code}
                    path="/quick-view"
                    element={<QuickViewRoute />}
                  />
                ) : route.code === 'C06' ? (
                  <Route
                    key={route.code}
                    path={route.path}
                    element={<ProductDetailPage />}
                  />
                ) : route.code === 'C18' ? (
                  <Route key={route.code} path="/cart" element={<CartPage />} />
                ) : route.code === 'C20' ? (
                  <Route
                    key={route.code}
                    path="/checkout"
                    element={<CheckoutPage />}
                  />
                ) : route.code === 'C21' ? (
                  <Route
                    key={route.code}
                    path="/checkout/review"
                    element={<CheckoutPage />}
                  />
                ) : route.code === 'C22' ? (
                  <Route
                    key={route.code}
                    path="/order-success"
                    element={<OrderSuccessPage />}
                  />
                ) : route.code === 'C13' ? (
                  <Route
                    key={route.code}
                    path="/login"
                    element={<LoginPage />}
                  />
                ) : route.code === 'C14' ? (
                  <Route
                    key={route.code}
                    path="/register"
                    element={<RegisterPage />}
                  />
                ) : route.code === 'C15' ? (
                  <Route
                    key={route.code}
                    path="/forgot-password"
                    element={<ForgotPasswordPage />}
                  />
                ) : route.code === 'C16' ? (
                  <Route
                    key={route.code}
                    path="/verify-email"
                    element={<VerifyEmailPage />}
                  />
                ) : route.code === 'C17' ? (
                  <Route
                    key={route.code}
                    path="/reset-password"
                    element={<ResetPasswordPage />}
                  />
                ) : route.code === 'C23' ? (
                  <Route
                    key={route.code}
                    path="/payment/sandbox"
                    element={<PaymentSandboxPage />}
                  />
                ) : route.code === 'C24' ? (
                  <Route
                    key={route.code}
                    path="/ai-try-on"
                    element={<AiTryOnIntroPage />}
                  />
                ) : route.code === 'C25' ? (
                  <Route
                    key={route.code}
                    path="/ai-try-on/upload"
                    element={<AiTryOnUploadPage />}
                  />
                ) : route.code === 'C26' ? (
                  <Route
                    key={route.code}
                    path="/ai-try-on/process"
                    element={<AiTryOnStatusPage />}
                  />
                ) : route.code === 'C27' ? (
                  <Route
                    key={route.code}
                    path="/ai-try-on/result"
                    element={<AiTryOnResultPage />}
                  />
                ) : route.code === 'C28' ? (
                  <Route
                    key={route.code}
                    path="/ai-try-on/privacy"
                    element={<AiPrivacyPage />}
                  />
                ) : route.code === 'C10' ? (
                  <Route
                    key={route.code}
                    path="/brands"
                    element={<BrandsPage />}
                  />
                ) : route.code === 'C11' ? (
                  <Route
                    key={route.code}
                    path="/support"
                    element={<SupportPage />}
                  />
                ) : route.code === 'C12' ? (
                  <Route key={route.code} path="/faq" element={<FaqPage />} />
                ) : route.code === 'C08' ? (
                  <Route
                    key={route.code}
                    path="/size-guide"
                    element={<SizeGuidePage />}
                  />
                ) : route.code === 'C40' ? (
                  <Route
                    key={route.code}
                    path="/wishlist"
                    element={<WishlistPage />}
                  />
                ) : route.code === 'C41' ? (
                  <Route
                    key={route.code}
                    path="/account/vouchers"
                    element={<VouchersPage />}
                  />
                ) : route.code === 'C42' ? (
                  <Route
                    key={route.code}
                    path="/account/notifications"
                    element={<NotificationsPage />}
                  />
                ) : route.code === 'C37' ? (
                  <Route
                    key={route.code}
                    path="/account/reviews/new"
                    element={<NewReviewPage />}
                  />
                ) : route.code === 'C38' ? (
                  <Route
                    key={route.code}
                    path="/account/reviews"
                    element={<ReviewHistoryPage />}
                  />
                ) : (
                  <Route
                    key={route.code}
                    path={route.path}
                    element={<NotFoundPage />}
                  />
                ),
              )}
          </Route>

          <Route element={<CustomerLayout />}>
            <Route path="/account" element={<AccountLayoutPage />}>
              <Route index element={<ProfilePage />} />
              <Route path="profile" element={<ProfilePage />} />
              <Route path="addresses" element={<AddressesPage />} />
              <Route path="addresses/edit" element={<AddressesPage />} />
              <Route
                path="addresses/remove-confirm"
                element={<AddressesPage />}
              />
              <Route path="security" element={<SecurityPage />} />
              <Route path="orders" element={<OrdersPage />} />
              <Route path="orders/:id" element={<OrderDetailPage />} />
              <Route path="orders/:id/cancel" element={<OrderDetailPage />} />
              <Route path="reviews/new" element={<NewReviewPage />} />
              <Route path="reviews" element={<ReviewHistoryPage />} />
              <Route path="vouchers" element={<VouchersPage />} />
              <Route path="notifications" element={<NotificationsPage />} />
            </Route>
            <Route path="/track-order" element={<TrackOrderPage />} />
            <Route path="/articles" element={<ArticlesPage />} />
            <Route path="/articles/:slug" element={<ArticleDetailPage />} />
            <Route path="/cart/remove-confirm" element={<CartPage />} />
            <Route path="/quick-view" element={<ProductDetailPage />} />
          </Route>

          <Route path="/admin/login" element={<AdminLoginPage />} />
          <Route element={<AdminLayout />}>
            <Route path="/admin/messages" element={<AdminMessagesPage />} />
            {adminRoutes
              .filter((route) => route.code !== 'A01')
              .map((route) => {
                let element
                if (route.code === 'A02') element = <AdminDashboardPage />
                else if (route.code === 'A22') element = <AdminReviewsPage />
                else if (route.code === 'A03') element = <AdminProductsPage />
                else if (route.code === 'A04' || route.code === 'A05')
                  element = <AdminProductFormPage />
                else if (
                  route.code === 'A06' ||
                  route.code === 'A07' ||
                  ['A13', 'A14', 'A15'].includes(route.code)
                )
                  element = (
                    <AdminCatalogPage
                      key={route.code}
                      resource={
                        route.code === 'A06'
                          ? 'variants'
                          : route.code === 'A07'
                            ? 'media'
                            : route.code === 'A15'
                              ? 'brands'
                              : 'categories'
                      }
                    />
                  )
                else if (route.code === 'A08' || route.code === 'A09')
                  element = (
                    <AdminInventoryPage
                      key={route.code}
                      history={route.code === 'A09'}
                    />
                  )
                else if (['A16', 'A17', 'A20', 'A21'].includes(route.code))
                  element = (
                    <AdminManagePage
                      key={route.code}
                      resource={
                        ['A16', 'A17'].includes(route.code)
                          ? 'users'
                          : 'vouchers'
                      }
                    />
                  )
                else if (route.code === 'A10') element = <AdminOrdersPage />
                else if (route.code === 'A11' || route.code === 'A12')
                  element = <AdminOrderDetailPage />
                else
                  element = (
                    <AdminGenericPage code={route.code} title={route.title} />
                  )
                return (
                  <Route key={route.code} path={route.path} element={element} />
                )
              })}
          </Route>

          {systemRoutes.map((route) => (
            <Route
              key={route.code}
              path={route.path}
              element={
                <CustomerLayout>
                  {route.code === 'S01' ? (
                    <NotFoundPage />
                  ) : (
                    <SystemStatePage code={route.code} />
                  )}
                </CustomerLayout>
              }
            />
          ))}
          <Route
            path="*"
            element={
              <CustomerLayout>
                <NotFoundPage />
              </CustomerLayout>
            }
          />
        </Routes>
      </CustomerProductChat>
    </BrowserRouter>
  )
}
