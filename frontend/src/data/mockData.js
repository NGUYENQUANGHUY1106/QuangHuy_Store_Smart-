export const categories = [
  { id: 'football-shoes', name: 'Giày bóng đá', slug: 'giay-bong-da' },
  {
    id: 'football-clothing',
    name: 'Quần áo thể thao',
    slug: 'quan-ao-the-thao',
  },
  { id: 'accessories', name: 'Phụ kiện', slug: 'phu-kien' },
  { id: 'football', name: 'Bóng & dụng cụ', slug: 'bong-dung-cu' },
]

export const brands = [
  { id: 'nike', name: 'Nike', slug: 'nike' },
  { id: 'adidas', name: 'Adidas', slug: 'adidas' },
  { id: 'mizuno', name: 'Mizuno', slug: 'mizuno' },
  { id: 'puma', name: 'Puma', slug: 'puma' },
]

export const colors = [
  { name: 'Cam', value: '#FF4F00' },
  { name: 'Đen', value: '#141413' },
  { name: 'Trắng', value: '#FFFFFF' },
  { name: 'Xanh', value: '#1B54F8' },
]

export const products = [
  {
    id: 'nike-mercurial-vapor',
    name: 'Nike Mercurial Vapor 16 Elite',
    slug: 'nike-mercurial-vapor-16-elite',
    brand: 'Nike',
    category: 'Giày bóng đá',
    description:
      'Giày sân cỏ nhân tạo với thiết kế nhẹ, ôm chân và khả năng bám sân.',
    originalPrice: 4590000,
    salePrice: 3890000,
    rating: 4.8,
    reviewCount: 124,
    image: '/images/product-placeholder.svg',
    badge: 'Sale',
    variants: [
      { sku: 'NV16-390-BK', size: '39', color: 'Đen', stock: 4 },
      { sku: 'NV16-400-BK', size: '40', color: 'Đen', stock: 6 },
      { sku: 'NV16-410-BK', size: '41', color: 'Đen', stock: 8 },
      { sku: 'NV16-420-OR', size: '42', color: 'Cam', stock: 3 },
      { sku: 'NV16-430-OR', size: '43', color: 'Cam', stock: 5 },
      { sku: 'NV16-440-OR', size: '44', color: 'Cam', stock: 2 },
      { sku: 'NV16-390-OR', size: '39', color: 'Cam', stock: 0 },
    ],
  },
  {
    id: 'adidas-predator',
    name: 'Adidas Predator 24 League',
    slug: 'adidas-predator-24-league',
    brand: 'Adidas',
    category: 'Giày bóng đá',
    description: 'Mẫu giày kiểm soát bóng dành cho sân cỏ nhân tạo.',
    originalPrice: 2490000,
    salePrice: 2190000,
    rating: 4.7,
    reviewCount: 89,
    image: '/images/product-placeholder.svg',
    badge: 'Mới',
    variants: [
      { sku: 'AP24-390-BK', size: '39', color: 'Đen', stock: 5 },
      { sku: 'AP24-400-BK', size: '40', color: 'Đen', stock: 7 },
      { sku: 'AP24-410-WH', size: '41', color: 'Trắng', stock: 3 },
      { sku: 'AP24-420-WH', size: '42', color: 'Trắng', stock: 4 },
      { sku: 'AP24-430-BL', size: '43', color: 'Xanh', stock: 2 },
      { sku: 'AP24-440-BL', size: '44', color: 'Xanh', stock: 1 },
    ],
  },
  {
    id: 'mizuno-morelia',
    name: 'Mizuno Morelia Neo IV',
    slug: 'mizuno-morelia-neo-iv',
    brand: 'Mizuno',
    category: 'Giày bóng đá',
    description:
      'Cảm giác chạm bóng tự nhiên với lớp da mềm và khung đế ổn định.',
    originalPrice: 5290000,
    salePrice: 5290000,
    rating: 4.9,
    reviewCount: 67,
    image: '/images/product-placeholder.svg',
    badge: 'Best seller',
    variants: [
      { sku: 'MN4-390-WH', size: '39', color: 'Trắng', stock: 2 },
      { sku: 'MN4-400-WH', size: '40', color: 'Trắng', stock: 3 },
      { sku: 'MN4-410-BK', size: '41', color: 'Đen', stock: 5 },
      { sku: 'MN4-420-BK', size: '42', color: 'Đen', stock: 6 },
      { sku: 'MN4-430-BK', size: '43', color: 'Đen', stock: 2 },
      { sku: 'MN4-440-BK', size: '44', color: 'Đen', stock: 1 },
    ],
  },
  {
    id: 'puma-future',
    name: 'Puma Future 7 Match',
    slug: 'puma-future-7-match',
    brand: 'Puma',
    category: 'Giày bóng đá',
    description: 'Khả năng linh hoạt và độ bám bóng cho cầu thủ tốc độ.',
    originalPrice: 3290000,
    salePrice: 2790000,
    rating: 4.6,
    reviewCount: 52,
    image: '/images/product-placeholder.svg',
    badge: 'Sale',
    variants: [
      { sku: 'PF7-390-OR', size: '39', color: 'Cam', stock: 3 },
      { sku: 'PF7-400-OR', size: '40', color: 'Cam', stock: 5 },
      { sku: 'PF7-410-BL', size: '41', color: 'Xanh', stock: 4 },
      { sku: 'PF7-420-BL', size: '42', color: 'Xanh', stock: 6 },
      { sku: 'PF7-430-BL', size: '43', color: 'Xanh', stock: 2 },
      { sku: 'PF7-440-BL', size: '44', color: 'Xanh', stock: 1 },
    ],
  },
  {
    id: 'training-jersey',
    name: 'Áo training không logo',
    slug: 'ao-training-khong-logo',
    brand: 'QuangHuy Sport',
    category: 'Quần áo thể thao',
    description: 'Áo thun thể thao thoáng khí, co giãn nhẹ và thấm hút tốt.',
    originalPrice: 590000,
    salePrice: 490000,
    rating: 4.5,
    reviewCount: 41,
    image: '/images/product-placeholder.svg',
    badge: 'New',
    variants: [
      { sku: 'QH-TS-S-BK', size: 'S', color: 'Đen', stock: 8 },
      { sku: 'QH-TS-M-BK', size: 'M', color: 'Đen', stock: 12 },
      { sku: 'QH-TS-L-BK', size: 'L', color: 'Đen', stock: 9 },
      { sku: 'QH-TS-XL-BK', size: 'XL', color: 'Đen', stock: 5 },
      { sku: 'QH-TS-M-WH', size: 'M', color: 'Trắng', stock: 7 },
    ],
  },
  {
    id: 'training-shorts',
    name: 'Quần short training',
    slug: 'quan-short-training',
    brand: 'QuangHuy Sport',
    category: 'Quần áo thể thao',
    description: 'Quần short tập luyện có túi khóa kéo và độ linh hoạt cao.',
    originalPrice: 490000,
    salePrice: 490000,
    rating: 4.4,
    reviewCount: 28,
    image: '/images/product-placeholder.svg',
    badge: '',
    variants: [
      { sku: 'QH-SH-S-BK', size: 'S', color: 'Đen', stock: 6 },
      { sku: 'QH-SH-M-BK', size: 'M', color: 'Đen', stock: 10 },
      { sku: 'QH-SH-L-BK', size: 'L', color: 'Đen', stock: 8 },
      { sku: 'QH-SH-XL-BK', size: 'XL', color: 'Đen', stock: 4 },
    ],
  },
]

export const cart = {
  items: [
    { productId: 'nike-mercurial-vapor', sku: 'NV16-410-BK', quantity: 1 },
    { productId: 'training-jersey', sku: 'QH-TS-M-BK', quantity: 2 },
  ],
}

export const vouchers = [
  {
    code: 'QHSNEW',
    name: 'Ưu đãi thành viên mới',
    type: 'percent',
    value: 10,
    minSubtotal: 500000,
  },
  {
    code: 'FREESHIP',
    name: 'Hỗ trợ phí vận chuyển',
    type: 'fixed',
    value: 30000,
    minSubtotal: 1000000,
  },
]

export const currentUser = {
  id: 'user-01',
  name: 'Nguyễn Quang Huy',
  email: 'huy@example.com',
  phone: '0900000000',
  addresses: [
    {
      id: 'address-01',
      receiver: 'Nguyễn Quang Huy',
      phone: '0900000000',
      address: 'TP. Hồ Chí Minh',
      isDefault: true,
    },
  ],
}

export const orders = [
  {
    id: 'QHS-260001',
    status: 'delivered',
    statusLabel: 'Hoàn thành',
    createdAt: '2026-11-18',
    total: 4380000,
    items: [
      { productId: 'nike-mercurial-vapor', sku: 'NV16-410-BK', quantity: 1 },
    ],
  },
  {
    id: 'QHS-260002',
    status: 'pending',
    statusLabel: 'Chờ xác nhận',
    createdAt: '2026-11-20',
    total: 980000,
    items: [{ productId: 'training-jersey', sku: 'QH-TS-M-BK', quantity: 2 }],
  },
  {
    id: 'QHS-260003',
    status: 'shipping',
    statusLabel: 'Đang giao',
    createdAt: '2026-11-19',
    total: 2190000,
    items: [{ productId: 'adidas-predator', sku: 'AP24-410-WH', quantity: 1 }],
  },
  {
    id: 'QHS-260004',
    status: 'cancelled',
    statusLabel: 'Đã hủy',
    createdAt: '2026-11-15',
    total: 2790000,
    items: [{ productId: 'puma-future', sku: 'PF7-420-BL', quantity: 1 }],
  },
]
