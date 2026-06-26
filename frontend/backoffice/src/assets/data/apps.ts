import { KanbanSectionType, KanbanTaskType } from "@/types/data"

import avatar1 from '@/assets/images/users/avatar-1.jpg'
import avatar10 from '@/assets/images/users/avatar-10.jpg'
// import avatar12 from '@/assets/images/users/avatar-11.jpg'
import avatar2 from '@/assets/images/users/avatar-2.jpg'
import avatar3 from '@/assets/images/users/avatar-3.jpg'
import avatar4 from '@/assets/images/users/avatar-4.jpg'
import avatar6 from '@/assets/images/users/avatar-6.jpg'
import avatar7 from '@/assets/images/users/avatar-7.jpg'
import avatar8 from '@/assets/images/users/avatar-8.jpg'

// import animationImg from '@/assets/images/animation-bg.jpg'
import small1 from '@/assets/images/small/small-1.jpg'
import small2 from '@/assets/images/small/small-2.jpg'



export const kanbanSectionsData: KanbanSectionType[] = [
  {
    id: '501',
    title: 'Upcoming',
  },
  {
    id: '502',
    title: 'In Progress',
  },
  {
    id: '503',
    title: 'In Review',
  },
  {
    id: '504',
    title: 'Completed',
  },
]

export const kanbanTasksData: KanbanTaskType[] = [
  {
    id: '1001',
    sectionId: '501',
    title: 'iOS App home page',
    description: 'To collaborate with users in a repository that belongs to your personal account',
    image: small1,
    variant: 'warning',
    views: 5,
    priority: 'High',
    share: 18,
    commentsCount: 12,
    members: [avatar1, avatar3, avatar4],
  },
  {
    id: '1002',
    sectionId: '501',
    title: 'Topnav layout design',
    description: 'Navigation bars design best practices involve focusing on functionality.',
    variant: 'pink',
    views: 2,
    share: 24,
    priority: 'Low',
    commentsCount: 24,
    progress: 50,
    members: [ avatar1, avatar10],
  },
  {
    id: '1003',
    sectionId: '501',
    title: 'Invite user to a project',
    description: 'To collaborate with users in a repository that belongs to your personal account',
    variant: 'purple',
    views: 1,
    priority: 'High',
    share: 8,
    commentsCount: 13,
    progress: 25,
    members: [avatar2, avatar4],
  },
  {
    id: '1004',
    sectionId: '502',
    title: 'Kanban board design',
    description: 'A basic Kanban board is divided into three columns',
    variant: 'danger',
    views: 3,
    share: 21,
    priority: 'Medium',
    commentsCount: 22,
    progress: 80,
    members: [avatar7, avatar3, avatar4],
  },
  {
    id: '1005',
    sectionId: '502',
    title: 'Code the script',
    description: 'Scripting is code used to automate processes.',
    variant: 'pink',
    views: 6,
    priority: 'Low',
    share: 12,
    commentsCount: 14,
    progress: 60,
    members: [avatar6, avatar8, avatar10],
  },
  {
    id: '1006',
    sectionId: '502',
    title: 'Brand Logo Design',
    description: 'Making your Content logo is easy with BrandCrowd Logo Maker.',
    variant: 'info',
    views: 1,
    share: 21,
    priority: 'High',
    commentsCount: 22,
    progress: 30,
    members: [avatar7],
  },
  {
    id: '1007',
    sectionId: '502',
    title: 'Improve Animation Loader',
    description: 'A basic Kanban board is divided into three columns',
    variant: 'warning',
    priority: 'Medium',
    views: 1,
    share: 8,
    commentsCount: 13,
    members: [avatar6, avatar8],
  },
  {
    id: '1008',
    sectionId: '503',
    title: 'Usability Testing',
    description: 'Evaluating a product or service by testing it with representative users',
    variant: 'success',
    progress: 45,
    views: 4,
    share: 10,
    priority: 'High',
    commentsCount: 20,
    members: [avatar2, avatar4],
  },
  {
    id: '1009',
    sectionId: '503',
    title: 'Research',
    description: 'The process of identifying topics to make content about.',
    variant: 'danger',
    progress: 84,
    views: 2,
    share: 7,
    priority: 'Low',
    commentsCount: 12,
    members: [avatar6, avatar8],
  },
  {
    id: '1010',
    sectionId: '504',
    title: 'Wireframes',
    description: 'Evaluating a product or service by testing it with representative users',
    image: small2,
    variant: 'warning',
    views: 25,
    priority: 'High',
    share: 6,
    commentsCount: 12,
    members: [avatar6, avatar8, avatar10],
  },
]
