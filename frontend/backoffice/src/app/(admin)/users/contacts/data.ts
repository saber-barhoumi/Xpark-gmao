
import avatar6 from "@/assets/images/users/avatar-6.jpg"
import avatar5 from "@/assets/images/users/avatar-5.jpg"
import avatar7 from "@/assets/images/users/avatar-7.jpg"
import avatar8 from "@/assets/images/users/avatar-8.jpg"
import avatar9 from "@/assets/images/users/avatar-9.jpg"
import avatar10 from "@/assets/images/users/avatar-10.jpg"
import avatar1 from "@/assets/images/users/avatar-1.jpg"
import avatar3 from "@/assets/images/users/avatar-3.jpg"
import avatar4 from "@/assets/images/users/avatar-4.jpg"


export type ContactsType = {
  id: number,
  name: string,
  role: string,
  website: string,
  avatar: string,
}


export const contactsData: ContactsType[] = [
  {
    id: 1,
    name: "Paul Halpern",
    role: "Manager",
    website: "coolweb.com",
    avatar: avatar6,
  },
  {
    id: 2,
    name: "John Adam",
    role: "Marketer",
    website: "coolmedia.com",
    avatar: avatar5,
  },
  {
    id: 3,
    name: "Alex Morgan",
    role: "Developer",
    website: "devstream.com",
    avatar: avatar7,
  },
  {
    id: 4,
    name: "Sophia Turner",
    role: "UI Designer",
    website: "creativeminds.com",
    avatar: avatar8,
  },
  {
    id: 5,
    name: "Emma Watson",
    role: "Marketer",
    website: "marketingpro.com",
    avatar: avatar9,
  },
  {
    id: 6,
    name: "Noah Jackson",
    role: "Project Manager",
    website: "pmlaunch.com",
    avatar: avatar10,
  },

  {
    id: 7,
    name: "Liam Baker",
    role: "@Consultant",
    website: "bizadvisor.com",
    avatar: avatar1,
  },
  {
    id: 8,
    name: "Olivia Carter",
    role: "@HR Specialist",
    website: "hrconnect.com",
    avatar: avatar3,
  },
  {
    id: 9,
    name: "Ava Johnson",
    role: "@Designer",
    website: "designhub.com",
    avatar: avatar4,
  },
  {
    id: 10,
    name: "Mason Williams",
    role: "@Developer",
    website: "devforge.com",
    avatar: avatar5,
  },
  {
    id: 11,
    name: "Sophia Martinez",
    role: "@Content Creator",
    website: "contentwave.com",
    avatar: avatar6,
  },
  {
    id: 12,
    name: "Ethan Davis",
    role: "@Analyst",
    website: "analytica.com",
    avatar: avatar7,
  }
]