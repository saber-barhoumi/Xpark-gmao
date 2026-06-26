import { addOrSubtractDaysFromDate } from "@/utils/date";


import product1 from '@/assets/images/products/p-1.png';
// import product13 from '@/assets/images/products/p-13.png';
// import product14 from '@/assets/images/products/p-14.png';
// import product15 from '@/assets/images/products/p-15.png';
import product2 from '@/assets/images/products/p-2.png';
import product3 from '@/assets/images/products/p-3.png';
import product4 from '@/assets/images/products/p-4.png';
import product5 from '@/assets/images/products/p-5.png';
// import product6 from '@/assets/images/products/p-6.png';
// import product7 from '@/assets/images/products/p-7.png';
import product8 from '@/assets/images/products/p-8.png';
import { ProductType } from "@/types/data";


export const productData: ProductType[] = [
  {
    id: '1',
    name: 'Men White Slim Fit T-shirt',
    description: '100% cotton t-shirt in white',
    // image: product1,
    date: addOrSubtractDaysFromDate(50),
    price: 70.90,
    quantity: 890,
    category: 'Fashion',
    status: 'Active',
    brand: ['Nike', 'H&M', 'ZARA', 'Puma'],
    averagePriceMin: 200,
    averagePriceMax: 2000,
    discountsAvailable: 'Seasonal Sales',
    sellingItems: ['T-shirt', 'Cargo Pent', 'Dress'],
    productName: 'Zara Fashion',
    discountPrice: 70.90,
    rating: {
      star: 4.5,
      review: 123
    },
    size: 'Size : XS , S , M',
    isDeal: true
  },
  {
    id: '2',
    name: '55 L Laptop Backpack fits upto 16 In..',
    description: 'Durable hiking backpack',
    // image: product2,
    date: addOrSubtractDaysFromDate(150),
    price: 100.90,
    quantity: 923,
    category: 'Bags',
    status: 'Active',
    brand: ['Nike', 'Puma', 'Safari', 'Truster'],
    averagePriceMin: 20,
    averagePriceMax: 300,
    sellingItems: ['Collage Bags', 'Trolly Bags'],
    discountsAvailable: 'Clearance Sales',
    productName: 'Wrogn Bags',
    discountPrice: 100.90,
    rating: {
      star: 4.5,
      review: 43
    },
    size: 'Size : 30L , 40L , 55L'
  },
  {
    id: '3',
    name: 'Minetta Rattan Swivel Premium Chair',
    description: 'Ergonomic Villa chair',
    // image: product3,
    date: addOrSubtractDaysFromDate(180),
    price: 300.00,
    quantity: 231,
    category: 'Furniture',
    status: 'Active',
    brand: ['IKEA', 'Hamilton Beach', 'Premium'],
    averagePriceMin: 300,
    averagePriceMax: 1500,
    discountsAvailable: 'Bundled Discounts',
    sellingItems: ['Sofas', 'Blenders', 'Chairs'],
    productName: 'Premium Furniture',
    discountPrice: 300,
    rating: {
      star: 5,
      review: 23
    },
    size: 'Size : 56L X 63D X 102H CM',
    isDeal: true
  },
  {
    id: '4',
    name: 'HYPERX Cloud Gaming Headphone',
    description: 'Noise-canceling wireless headphones',
    // image: product4,
    date: addOrSubtractDaysFromDate(250),
    price: 230.90,
    quantity: 413,
    category: 'Headphone',
    status: 'Inactive',
    brand: ['Boat', 'Sony', 'Jbl', 'Bose'],
    averagePriceMin: 150,
    averagePriceMax: 1000,
    discountsAvailable: 'Holiday Discounts',
    sellingItems: ['Gaming Headphone', 'Buds', 'Nakebands'],
    productName: 'Bose Headphones',
    discountPrice: 70.90,
    rating: {
      star: 4,
      review: 311
    },
    size: 'Size : S , M'
  },
  {
    id: '5',
    name: 'Men Winter Knitted Sweater',
    description: 'Waterproof windbreaker jacket',
    // image: product5,
    date: addOrSubtractDaysFromDate(485),
    price: 90.00,
    quantity: 120,
    category: 'Winter Fashion',
    status: 'Active',
    brand: ['Nike', 'H&M', 'ZARA', 'Puma'],
    averagePriceMin: 200,
    averagePriceMax: 2000,
    discountsAvailable: 'Bulk Purchase Deals',
    sellingItems: ['Hoodie'],
    productName: 'Winter Fashion',
    discountPrice: 90.00,
    rating: {
      star: 4,
      review: 12
    },
    size: 'Size : S , M , XL ,XXL',
    isSeal: true
  },
  {
    id: '6',
    name: "Jordan Jumpman MVP Men's Shoes Size",
    description: 'Comfortable running shoes',
    // image: product1,
    date: addOrSubtractDaysFromDate(562),
    price: 400.00,
    quantity: 264,
    category: 'Foot Ware',
    status: 'Inactive',
    brand: ['Nike', 'Bata', 'Woodland', 'Puma'],
    averagePriceMin: 200,
    averagePriceMax: 2000,
    discountsAvailable: 'Coupon Codes',
    sellingItems: ['Sandal', 'Loafer', 'Slippers'],
    productName: 'Nike Foot Ware',
    discountPrice: 400,
    rating: {
      star: 5,
      review: 200
    },
    size: 'Size US : 7 , 8 , 8.5 , 9 , 10',
    isSeal: true
  },
  {
    id: '7',
    name: "Sleepify Luno 4 Seater Fabric Sofa",
    description: 'Modern three-piece sofa set',
    // image: product7,
    date: addOrSubtractDaysFromDate(45),
    price: 340.00,
    quantity: 372,
    category: 'Furniture',
    status: 'Inactive',
    brand: ['IKEA', 'Hamilton Beach ', 'Premium'],
    averagePriceMin: 200,
    averagePriceMax: 2000,
    discountsAvailable: 'Subscription Discounts',
    sellingItems: ['Sofas'],
    productName: 'CRAFT Furniture',
    discountPrice: 340,
    rating: {
      star: 5,
      review: 120
    },
    size: 'Size : XS , S , M'
  },
  {
    id: '8',
    name: "Navy Blue Over Size T-shirt For Men",
    description: '100% cotton t-shirt in blue',
    // image: product8,
    date: addOrSubtractDaysFromDate(84),
    price: 80.00,
    quantity: 470,
    category: 'Fashion',
    status: 'Active',
    brand: ['Rolex', 'Tag', 'Fossil', 'Timex'],
    averagePriceMin: 400,
    averagePriceMax: 3000,
    discountsAvailable: 'Coupon Codes',
    sellingItems: ['Analog Watch', 'Hand Watch'],
    productName: 'H&M Fashion',
    discountPrice: 70.90,
    rating: {
      star: 4,
      review: 80
    },
    size: 'Size : M , XL , XXL , XXXL',
    isSeal: true
  },
  {
    id: '9',
    name: "Man's Round Dial Wrist Watch",
    description: 'Fitness tracking smartwatch',
    // image: product1,
    date: addOrSubtractDaysFromDate(156),
    price: 140.00,
    quantity: 1092,
    category: 'Watches',
    status: 'Active',
    brand: ['Sony', 'Electronic Arts', 'IGT logo'],
    averagePriceMin: 230,
    averagePriceMax: 2100,
    discountsAvailable: 'Seasonal Sales',
    sellingItems: ['PS5', 'Logo'],
    productName: 'Zara Fashion',
    discountPrice: 70.90,
    rating: {
      star: 4.5,
      review: 123
    },
    size: 'Size : XS , S , M'
  },
  {
    id: '10',
    name: "PS 5 Control",
    description: 'Ergonomic gaming ps and multi control',
    // image: product5,
    date: addOrSubtractDaysFromDate(78),
    price: 230.00,
    quantity: 523,
    category: 'Games',
    status: 'Inactive',
    brand: ['Lego', 'Hot Wheels', 'Fisher-Price'],
    averagePriceMin: 100,
    averagePriceMax: 800,
    discountsAvailable: 'Buy One Get One',
    sellingItems: ['Toy Car', 'Lego'],
    productName: 'Zara Fashion',
    discountPrice: 70.90,
    rating: {
      star: 4.5,
      review: 123
    },
    size: 'Size : XS , S , M'
  },
  {
    id: '11',
    name: "Plastic Duckie barry b benson",
    description: 'Bath Duck Toy Mead With Plastic',
    // image: product2,
    date: addOrSubtractDaysFromDate(45),
    price: 70.00,
    quantity: 2102,
    category: 'Toy',
    status: 'Inactive',
    brand: ['Nike', 'H&M', 'ZARA', 'Puma'],
    averagePriceMin: 200,
    averagePriceMax: 2000,
    discountsAvailable: 'Seasonal Sales',
    sellingItems: ['T-shirt', 'Cargo Pent', 'Dress'],
    productName: 'Zara Fashion',
    discountPrice: 70.90,
    rating: {
      star: 4.5,
      review: 123
    },
    size: 'Size : XS , S , M'
  },
]