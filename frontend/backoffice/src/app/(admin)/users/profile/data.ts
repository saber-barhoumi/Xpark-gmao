
import avatar2 from "@/assets/images/users/avatar-2.jpg"
import avatar3 from "@/assets/images/users/avatar-3.jpg"
import avatar4 from "@/assets/images/users/avatar-4.jpg"
import avatar5 from "@/assets/images/users/avatar-5.jpg"
import avatar6 from "@/assets/images/users/avatar-6.jpg"
import avatar7 from "@/assets/images/users/avatar-7.jpg"


type userType = {
  image: string
  name: string
  role: string
}
type RemindersType = {
  title: string
  date: string
  time: string
  status: string
}

export const userData: userType[] = [
  {
    image: avatar2,
    name: 'Michael Zenaty',
    role: 'CEO'
  },
  {
    image: avatar3,
    name: 'Sarah Johnson',
    role: 'Marketing Manager'
  },
  {
    image: avatar4,
    name: 'David Lee',
    role: 'Software Developer'
  },
  {
    image: avatar5,
    name: 'Emily White',
    role: 'Graphic Designer'
  },
  {
    image: avatar6,
    name: 'Chris Brown',
    role: 'UI/UX Specialist'
  },
  {
    image: avatar7,
    name: 'Sophia Martinez',
    role: 'Content Strategist'
  },
] 

export const remindersData: RemindersType[] = [
    {
      title: "Meet Manager",
      date: "February 24, 2025",
      time: "10:30am to 12:45pm",
      status: "primary",
    },
    {
      title: "Team Stand-Up",
      date: "February 25, 2025",
      time: "9:00am to 9:30am",
      status: "success",
    },
    {
      title: "Client Presentation",
      date: "February 26, 2025",
      time: "2:00pm to 4:00pm",
      status: "danger",
    },
    {
      title: "Project Kickoff",
      date: "February 27, 2025",
      time: "11:00am to 1:00pm",
      status: "warning",
    },
    {
      title: "Monthly Review",
      date: "February 28, 2025",
      time: "3:00pm to 5:00pm",
      status: "info",
    }
]