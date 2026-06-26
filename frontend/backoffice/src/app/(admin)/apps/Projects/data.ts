import avatar1 from "@/assets/images/users/avatar-1.jpg"
import avatar10 from "@/assets/images/users/avatar-10.jpg"
import avatar2 from "@/assets/images/users/avatar-2.jpg"
import avatar3 from "@/assets/images/users/avatar-3.jpg"
import avatar4 from "@/assets/images/users/avatar-4.jpg"
import avatar5 from "@/assets/images/users/avatar-5.jpg"
import avatar6 from "@/assets/images/users/avatar-6.jpg"
import avatar7 from "@/assets/images/users/avatar-7.jpg"
import avatar8 from "@/assets/images/users/avatar-8.jpg"
import avatar9 from "@/assets/images/users/avatar-9.jpg"




type ProjectsType = {
  title: string
  category: string
  description: string
  status: string
  progress: number
  variant: string
  questions: number
  comments: number
  team: string[]
}

export const projectData: ProjectsType[] = [
  {
    title: "New Admin Design",
    category: "Web Design",
    description: 'Create a user-friendly e-commerce platform with a sleek design, intuitive navigation, and responsive layouts to enhance.. ',
    status: "Completed",
    variant: 'success',
    progress: 80,
    questions: 56,
    comments: 452,
    team: [avatar1, avatar2, avatar3, avatar4]
  },
  {
    title: "Corporate Website Redesign",
    category: "Web Design",
    description: 'Enhance the corporate branding with a modern and professional redesign that aligns with business goals..',
    status: "In Progress",
    variant: 'primary',
    progress: 60,
    questions: 34,
    comments: 210,
    team: [avatar5, avatar6]
  },
  {
    title: "Portfolio Website",
    category: "Web Design",
    status: "In Review",
    description: 'Design an elegant and responsive portfolio to showcase creative projects with stunning visuals..',
    progress: 90,
    variant: 'info',
    questions: 12,
    comments: 75,
    team: [avatar7, avatar2, avatar9]
  },
  {
    title: "E-Learning Platform",
    category: "Web Design",
    description: 'Develop a user-friendly platform to deliver online courses, with a focus on accessibility and engagement..',
    status: "Pending",
    variant: 'warning',
    progress: 45,
    questions: 28,
    comments: 150,
    team: [avatar8, avatar9, avatar6]
  },
  {
    title: "Travel Agency Portal",
    category: "Web Development",
    status: "Delayed",
    description: 'Design an intuitive portal for a travel agency to manage bookings and provide seamless customer experiences..',
    variant: 'danger',
    progress: 30,
    questions: 12,
    comments: 98,
    team: [avatar10, avatar8, avatar6, avatar1, avatar7]
  },
  {
    title: "Healthcare Portal",
    category: "Web Design",
    description: 'Create a healthcare portal offering appointment scheduling, patient records, and responsive communication tools..',
    status: "On Hold",
    variant: 'secondary',
    progress: 25,
    questions: 18,
    comments: 102,
    team: [avatar3]
  }
]