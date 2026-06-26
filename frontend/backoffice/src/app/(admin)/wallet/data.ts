
import avatar4 from "@/assets/images/users/avatar-4.jpg"
import avatar5 from "@/assets/images/users/avatar-5.jpg"
import avatar6 from "@/assets/images/users/avatar-6.jpg"
import avatar3 from "@/assets/images/users/avatar-3.jpg"


export type StateType = {
  title: string
  value: string
  colors: string[]
  series: number
}
export type State2Type = {
  title: string
  value: string
  count: string
  color: string
  icon: string
  progress: number
}
export type State3Type = {
  name: string
  role: string
  feedbacks: string
  avatar: string
}

export const stateData: StateType[] = [
  {
    title: "Total Orders",
    value: "687.3k",
    colors: ["#ff5b5b", "#F6F7FB"],
    series: 65
  },
  {
    title: "New Users",
    value: "45.3k",
    colors: ["#f9c851", "#F6F7FB"],
    series: 75
  },
  {
    title: "Total Orders",
    value: "687.3k",
    colors: ["#ff5b5b", "#F6F7FB"],
    series: 75
  },
  {
    title: "New Users",
    value: "45.3k",
    colors: ["#f9c851", "#F6F7FB"],
    series: 75
  }
]

export const state2Data: State2Type[] = [
  {
    title: "Total Revenue",
    value: "$5.42M",
    count: "32%",
    color: "success",
    icon: "tabler:trending-up",
    progress: 25,
  },
  {
    title: "Customer Satisfaction",
    value: "94.3%",
    count: "5.7%",
    color: "info",
    icon: "tabler:trending-down",
    progress: 94.3,
  },
  {
    title: "Total Revenue",
    value: "$5.42M",
    count: "32%",
    color: "success",
    icon: "tabler:trending-up",
    progress: 25,
  },
  {
    title: "Customer Satisfaction",
    value: "94.3%",
    count: "5.7%",
    color: "info",
    icon: "tabler:trending-down",
    progress: 94.3,
  }
]

export const state3Data: State3Type[] = [
  {
    name: "Jane Doe",
    role: "UI/UX Designer",
    feedbacks: "90+ Feedbacks",
    avatar: avatar4,
  },
  {
    name: "Emily Brown",
    role: "Software Engineer",
    feedbacks: "100+ Feedbacks",
    avatar: avatar5,
  },
  {
    name: "Mark Wilson",
    role: "Marketing Specialist",
    feedbacks: "70+ Feedbacks",
    avatar: avatar6,
  },
  {
    name: "Sara Johnson",
    role: "Data Analyst",
    feedbacks: "50+ Feedbacks",
    avatar: avatar3,
  }
] 