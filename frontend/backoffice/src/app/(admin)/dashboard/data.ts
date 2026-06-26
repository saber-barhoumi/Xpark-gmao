
import avatar7 from "@/assets/images/users/avatar-7.jpg"
import avatar4 from "@/assets/images/users/avatar-4.jpg"
import avatar5 from "@/assets/images/users/avatar-5.jpg"
import avatar6 from "@/assets/images/users/avatar-6.jpg"
import avatar3 from "@/assets/images/users/avatar-3.jpg"
import { addOrSubtractDaysFromDate } from "@/utils/date"


import product1 from '@/assets/images/products/p-1.png';
import product2 from '@/assets/images/products/p-2.png';
import product4 from '@/assets/images/products/p-4.png';
import product3 from '@/assets/images/products/p-3.png';
import product5 from '@/assets/images/products/p-5.png';


type UserCardType = {
  name: string
  position: string
  feedback_count: number
  image: string
}


export type SalesProductType = {
  id: string
  name: string
  image: string
  date: Date
  price: number
  quantity: number
  amount: string
}

export const userCardData: UserCardType[] = [
  {
    name: "John Smith",
    position: "Project Manager",
    feedback_count: 80,
    image: avatar7,
  },
  {
    name: "Jane Doe",
    position: "UI/UX Designer",
    feedback_count: 90,
    image: avatar4,
  },
  {
    name: "Emily Brown",
    position: "Software Engineer",
    feedback_count: 100,
    image: avatar5,
  },
  {
    name: "Mark Wilson",
    position: "Marketing Specialist",
    feedback_count: 70,
    image: avatar6,
  },
  {
    name: "Sara Johnson",
    position: "Data Analyst",
    feedback_count: 50,
    image: avatar3,
  }
]   
export const salesProductData: SalesProductType[] = [
  {
    id: '1',
    name: '	ASOS High Waist Tshirt',
    image: product1,
    date: addOrSubtractDaysFromDate(50),
    price: 79.49,
    quantity: 82,
    amount: '6,518.18'
  },
  {
    id: '2',
    name: '	Marco Single Sofa',
    image: product2,
    date: addOrSubtractDaysFromDate(150),
    price: 128.50,
    quantity: 37,
    amount: '4,754.50'
  },
  {
    id: '3',
    name: 'Smart Headphone',
    image: product3,
    date: addOrSubtractDaysFromDate(180),
    price: 39.99,
    quantity: 64,
    amount: '2,559.36'
  },
  {
    id: '4',
    name: 'Lightweight Jacket',
    image: product4,
    date: addOrSubtractDaysFromDate(250),
    price: 20.00,
    quantity: 184,
    amount: '3,680.00'
  },
  {
    id: '5',
    name: 'Marco Shoes',
    image: product5,
    date: addOrSubtractDaysFromDate(350),
    price: 28.49,
    quantity: 69,
    amount: '1,965.81'
  },
]