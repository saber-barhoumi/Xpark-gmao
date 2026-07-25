
import { ReactNode } from "react"

import userAvatar10 from '@/assets/images/users/avatar-10.jpg'
import userAvatar2 from '@/assets/images/users/avatar-2.jpg'
import userAvatar4 from '@/assets/images/users/avatar-4.jpg'
import userAvatar7 from '@/assets/images/users/avatar-7.jpg'
import { currency } from "@/context/constants"
import { addOrSubtractDaysFromDate } from "@/utils/date"



export type NotificationType = {
  id: number
  title: ReactNode
  image?: {
    image: string,
    icon: string,
    variant: string
  },
  icon?: {
    icon: string
    variant: string
  }
  time: Date
}



export const notificationData: NotificationType[] = [
  {
    id: 1,
    title: <><span className="fw-medium text-body">Glady Haid</span> commented on <span className="fw-medium text-body">paces admin status</span></>,
    image: {
      image: userAvatar2,
      icon: 'tabler:message-circle',
      variant: 'danger'
    },
    time: addOrSubtractDaysFromDate(12),
  },
  {
    id: 2,
    title: <>
      <span className="fw-medium text-body">Tommy Berry</span> donated <span className="text-success">{currency}100.00</span> for <span className="fw-medium text-body">Carbon removal program</span>
    </>,
    image: {
      image: userAvatar4,
      icon: 'tabler:currency-dollar',
      variant: 'info'
    },
    time: addOrSubtractDaysFromDate(1),
  },
  {
    id: 3,
    title: <>
      You withdraw a <span className="fw-medium text-body">{currency}500</span> by <span className="fw-medium text-body">New York ATM</span>
    </>,
    icon: {
      icon: 'solar:wallet-money-bold-duotone',
      variant: 'success'
    },
    time: addOrSubtractDaysFromDate(250),
  },
  {
    id: 4,
    title: <>
      <span className="fw-medium text-body">Richard Allen</span> followed you in <span className="fw-medium text-body">Facebook</span>
    </>,
    image: {
      image: userAvatar7,
      icon: 'tabler:plus',
      variant: 'secondary'
    },
    time: addOrSubtractDaysFromDate(15),
  },
  {
    id: 5,
    title: <>
      <span className="fw-medium text-body">Victor Collier</span> liked you recent photo in <span className="fw-medium text-body">Instagram</span>
    </>,
    image: {
      image: userAvatar10,
      icon: 'tabler:heart-filled',
      variant: 'danger'
    },
    time: addOrSubtractDaysFromDate(2),
  },
]