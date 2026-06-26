import product1 from '@/assets/images/products/logo/logo-1.svg';
import product4 from '@/assets/images/products/logo/logo-4.svg';
import product5 from '@/assets/images/products/logo/logo-5.svg';
import product6 from '@/assets/images/products/logo/logo-6.svg';
import product8 from '@/assets/images/products/logo/logo-8.svg';
import { BrandListType, Employee, FilesType, InvoicesType, SocialUserType, UserType } from "@/types/data";


import avatar1 from '@/assets/images/users/avatar-1.jpg';
import avatar10 from '@/assets/images/users/avatar-10.jpg';
import avatar2 from '@/assets/images/users/avatar-2.jpg';
import avatar3 from '@/assets/images/users/avatar-3.jpg';
import avatar4 from '@/assets/images/users/avatar-4.jpg';
import avatar5 from '@/assets/images/users/avatar-5.jpg';
import avatar6 from '@/assets/images/users/avatar-6.jpg';
import avatar7 from '@/assets/images/users/avatar-7.jpg';
import avatar8 from '@/assets/images/users/avatar-8.jpg';
import avatar9 from '@/assets/images/users/avatar-9.jpg';

import userAvatar2 from '@/assets/images/users/avatar-2.jpg';
import userAvatar5 from '@/assets/images/users/avatar-5.jpg';
import userAvatar8 from '@/assets/images/users/avatar-8.jpg';





import { currency } from "@/context/constants";
import { addOrSubtractDaysFromDate } from "@/utils/date";

export const brandListData: BrandListType[] = [
  {
    id: '101',
    name: 'Zaroan - Brazil',
    category: 'Clothing',
    image: product1,
    since: 2020,
    Stores: '1.5k',
    products: '8,950',
  },
  {
    id: '102',
    name: 'Jocky-Johns - USA',
    category: 'Clothing',
    image: product4,
    since: 1985,
    Stores: '205',
    products: '1,258',
  },
  {
    id: '103',
    name: 'Ginne - India',
    category: 'Lifestyle',
    image: product5,
    since: 2001,
    Stores: '89',
    products: '338',
  },
  {
    id: '104',
    name: 'DDoen - Brazil',
    category: 'Fashion',
    image: product6,
    since: 1995,
    Stores: '650',
    products: '6,842',
  },
  {
    id: '105',
    name: 'Zoddiak - Canada',
    category: 'Clothing',
    image: product8,
    since: 1963,
    Stores: '109',
    products: '952',
  },
]


export const userData: UserType[] = [
  {
    id: '1001',
    name: 'Brandon Smith',
    image: userAvatar2,
    email: 'harriettepenix@rhyta.com',
    message: 'How are you today?',
    unRead: 3,
    date: addOrSubtractDaysFromDate(10),
    activeOffline: 'Active'
  },
  {
    id: '1002',
    name: 'James Zavel',
    image: userAvatar5,
    email: 'harriettepenix@rhyta.com',
    message: "Hey! a reminder for tommorow's meeting...",
    isSend: true,
    date: addOrSubtractDaysFromDate(15),
    activeOffline: 'Typing,,,,'
  },
  {
    id: '1003',
    name: 'Maria Lopez',
    image: userAvatar8,
    email: 'harriettepenix@rhyta.com',
    message: 'How are you today?',
    unRead: 1,
    date: addOrSubtractDaysFromDate(202),
    activeOffline: 'Active'
  },
  {
    id: '1004',
    name: 'Osen Discussion',
    message: "JS Developer's Come in office?",
    email: 'harriettepenix@rhyta.com',
    date: addOrSubtractDaysFromDate(89),
    allMessage: true,
    activeOffline: 'Offline'
  },
  {
    id: '1005',
    name: 'Eunice Bennett',
    image: avatar3,
    email: 'harriettepenix@rhyta.com',
    message: 'Please check these design assets',
    date: addOrSubtractDaysFromDate(15),
    isSend: false,
    activeOffline: 'Active'
  },
  {
    id: '1006',
    name: 'Javascript Team',
    icon: 'tabler:brand-javascript',
    message: 'New Project?',
    isSend: true,
    email: 'harriettepenix@rhyta.com',
    iconColor: 'warning',
    date: addOrSubtractDaysFromDate(202),
    activeOffline: 'Active'
  },
  {
    id: '1006',
    name: 'UI Team',
    icon: 'tabler:brand-figma',
    message: 'Project Completed',
    isSend: true,
    email: 'harriettepenix@rhyta.com',
    iconColor: 'secondary',
    date: addOrSubtractDaysFromDate(305),
    activeOffline: 'Offline'
  },
  {
    id: '1007',
    name: 'Hoyt Bahe',
    image: avatar4,
    message: 'Voice Message',
    isSend: true,
    email: 'harriettepenix@rhyta.com',
    voiceMessage: true,
    date: addOrSubtractDaysFromDate(860),
    activeOffline: 'Active'
  },
  {
    id: '1008',
    name: 'John Otta',
    image: avatar9,
    message: 'What next plan ?',
    isSend: true,
    email: 'harriettepenix@rhyta.com',
    date: addOrSubtractDaysFromDate(175),
    activeOffline: 'Typing,,,,'
  },
  {
    id: '1009',
    name: 'Louis Moller',
    image: avatar6,
    message: 'Are you free for 15 min?',
    unRead: 1,
    email: 'harriettepenix@rhyta.com',
    date: addOrSubtractDaysFromDate(65),
    activeOffline: 'Active'
  },
  {
    id: '1010',
    name: 'David Callan',
    image: avatar9,
    message: 'Are you interested in learning?',
    unRead: 3,
    email: 'harriettepenix@rhyta.com',
    date: addOrSubtractDaysFromDate(16),
    activeOffline: 'Offline'
  },
  {
    id: '1011',
    name: 'Sean Lee',
    image: avatar9,
    message: 'Howdy?',
    isSend: true,
    email: 'harriettepenix@rhyta.com',
    date: addOrSubtractDaysFromDate(84),
    activeOffline: 'Active'
  },
  {
    id: '1012',
    name: 'React Team',
    message: '@jamesZavel Is new React employee',
    isSend: true,
    iconColor: 'primary',
    email: 'harriettepenix@rhyta.com',
    date: addOrSubtractDaysFromDate(46),
    icon: 'tabler:brand-react',
    activeOffline: 'Active'
  },
]


export const invoicesData: InvoicesType[] = [
  {
    id: '451',
    userId: '151',
    productId: '1',
    amount: '42,430',
    date: addOrSubtractDaysFromDate(15),
    invoicesStatus: 'Paid'
  },
  {
    id: '452',
    userId: '152',
    productId: '2',
    amount: '416',
    date: addOrSubtractDaysFromDate(25),
    invoicesStatus: 'Pending'
  },
  {
    id: '453',
    userId: '153',
    productId: '3',
    amount: '187',
    date: addOrSubtractDaysFromDate(320),
    invoicesStatus: 'Paid'
  },
  {
    id: '454',
    userId: '154',
    productId: '4',
    amount: '165',
    date: addOrSubtractDaysFromDate(48),
    invoicesStatus: 'Paid'
  },
  {
    id: '455',
    userId: '155',
    productId: '5',
    amount: '165',
    date: addOrSubtractDaysFromDate(198),
    invoicesStatus: 'Cancelled'
  },
  {
    id: '456',
    userId: '156',
    productId: '6',
    amount: '192',
    date: addOrSubtractDaysFromDate(56),
    invoicesStatus: 'Pending'
  },
  {
    id: '457',
    userId: '157',
    productId: '7',
    amount: '159',
    date: addOrSubtractDaysFromDate(654),
    invoicesStatus: 'Paid'
  },
  {
    id: '458',
    userId: '158',
    productId: '8',
    amount: '259',
    date: addOrSubtractDaysFromDate(45),
    invoicesStatus: 'Cancelled'
  },
  {
    id: '459',
    userId: '159',
    productId: '9',
    amount: '259',
    date: addOrSubtractDaysFromDate(74),
    invoicesStatus: 'Paid'
  },
  {
    id: '460',
    userId: '160',
    productId: '10',
    amount: '256',
    date: addOrSubtractDaysFromDate(654),
    invoicesStatus: 'Pending'
  },
]

export const socialUserData: SocialUserType[] = [
  {
    id: '151',
    name: 'Harriett E. Penix',
    email: 'harriettepenix@rhyta.com',
    image: avatar1,
    role: 'CAO',
    BirthDate: '1 January 1980',
    phone: '(567) 890-1234'
  },
  {
    id: '152',
    name: 'Carol L. Simon',
    email: 'carollcimon@jourrapide.com',
    image: avatar2,
    role: 'Marketing Manager',
    BirthDate: '2 February 1975',
    phone: '(456) 789-0123'
  },
  {
    id: '153',
    name: 'Rosa L. Winters',
    email: 'rosalwinters@teleworm.us',
    image: avatar3,
    role: 'Software Developer',
    phone: '(345) 678-9012',
    BirthDate: '1 May 1989',
  },
  {
    id: '154',
    name: 'Jeremy C. Willi',
    email: 'jeremycwilliams@dayrep.com',
    image: avatar4,
    role: 'UI/UX Specialist',
    BirthDate: '4 April 1985',
    phone: '(234) 567-8901'
  },
  {
    id: '155',
    name: 'James R. Alvares',
    email: 'jamesralvares@jourrapide.com',
    image: avatar5,
    role: 'Content Strategist',
    BirthDate: '5 May 1982',
    phone: '(123) 456-7890'
  },
  {
    id: '156',
    name: 'Kathleen R. Stewart',
    email: 'kathleenr@jourrapide.com',
    image: avatar6,
    BirthDate: '6 June 1978',
    phone: '1-567-890-1234'
  },
  {
    id: '157',
    name: 'Debra R. Morgan',
    email: 'Debra@jourrapide.com',
    image: avatar7,
    BirthDate: '7 July 1987',
    phone: '(456) 789 0123'
  },
  {
    id: '158',
    name: 'Mark J. Scott',
    email: 'DebraMark@jourrapide.com',
    image: avatar8,
    BirthDate: '8 August 1981',
    phone: '345 678 9012'
  },
  {
    id: '159',
    name: 'Connie R. Kilmer',
    email: 'DebraMark@jourrapide.com',
    image: avatar9,
    BirthDate: '9 September 1979',
    phone: '234.567.8901'
  },
  {
    id: '160',
    name: 'Paul K. Coyle',
    email: 'PaulaMark@jourrapide.com',
    image: avatar10,
    BirthDate: '10 October 1983',
    phone: '123-456-7890'
  },
]

export const dataTableRecords: Employee[] = [
  {
    id: '11',
    name: 'Jonathan',
    email: 'jonathan@example.com',
    position: 'Senior Implementation Architect',
    company: 'Hauck Inc',
    country: 'Holy See',
    office: 'Tokyo',
    age: 33,
    startDate: '2008/11/28',
    salary: `${currency}162,700`,
  },
  {
    id: '12',
    name: 'Harold',
    email: 'harold@example.com',
    position: 'Forward Creative Coordinator',
    company: 'Metz Inc',
    country: 'Iran',
    office: 'London',
    age: 47,
    startDate: '2009/10/09',
    salary: `${currency}1,200,000`,
  },
  {
    id: '13',
    name: 'Shannon',
    email: 'shannon@example.com',
    position: 'Legacy Functionality Associate',
    company: 'Zemlak Group',
    country: 'South Georgia',
    office: 'San Francisco',
    age: 66,
    startDate: '2009/01/12',
    salary: `${currency}86,000`,
  },
  {
    id: '14',
    name: 'Robert',
    email: 'robert@example.com',
    position: 'Product Accounts Technician',
    company: 'Hoeger',
    country: 'San Marino',
    office: 'London',
    age: 41,
    startDate: '2012/10/13',
    salary: `${currency}y132,000`,
  },
  {
    id: '15',
    name: 'Noel',
    email: 'noel@example.com',
    position: 'Customer Data Director',
    company: 'Howell - Rippin',
    country: 'Germany',
    office: 'San Francisco',
    age: 28,
    startDate: '2011/06/07',
    salary: `${currency}206,850`,
  },
  {
    id: '16',
    name: 'Traci',
    email: 'traci@example.com',
    position: 'Corporate Identity Director',
    company: 'Koelpin - Goldner',
    country: 'Vanuatu',
    office: 'New York',
    age: 61,
    startDate: '2012/12/02',
    salary: `${currency}372,000`,
  },
  {
    id: '17',
    name: 'Kerry',
    email: 'kerry@example.com',
    position: 'Lead Applications Associate',
    company: 'Feeney, Langworth and Tremblay',
    country: 'Niger',
    office: 'London',
    age: 38,
    startDate: '2011/05/03',
    salary: `${currency}163,500`,
  },
  {
    id: '18',
    name: 'Patsy',
    email: 'patsy@example.com',
    position: 'Dynamic Assurance Director',
    company: 'Streich Group',
    country: 'Niue',
    office: 'New York',
    age: 21,
    startDate: '2011/12/12',
    salary: `${currency}106,450`,
  },
  {
    id: '19',
    name: 'Cathy',
    email: 'cathy@example.com',
    position: 'Customer Data Director',
    company: 'Ebert, Schamberger and Johnston',
    country: 'Mexico',
    office: 'New York',
    age: 46,
    startDate: '2011/12/06',
    salary: `${currency}145,600`,
  },
  {
    id: '20',
    name: 'Tyrone',
    email: 'tyrone@example.com',
    position: 'Senior Response Liaison',
    company: 'Raynor, Rolfson and Daugherty',
    country: 'Qatar',
    office: 'Edinburgh',
    age: 22,
    startDate: '2012/03/29',
    salary: `${currency}433,060`,
  },
]

export const filesData: FilesType[] = [
  {
    id: '2001',
    title: 'Dashboard-requirements.docx',
    icon: 'ri:file-line',
    file: '12 Docx',
    fileVariant: 'info',
    userId: '151',
    date: addOrSubtractDaysFromDate(21),
    size: 128,
    members: [
      {
        text: 'D',
        variant: 'success'
      },
      {
        text: 'K',
        variant: 'primary'
      },
      {
        text: 'H',
        variant: 'secondary'
      },
      {
        text: 'L',
        variant: 'warning'
      },
      {
        text: 'G',
        variant: 'info'
      },
    ]
  },
  {
    id: '2002',
    title: 'ocen-dashboard.pdf',
    icon: 'ri:file-pdf-line',
    file: '18 Pdf',
    fileVariant: 'danger',
    userId: '152',
    date: addOrSubtractDaysFromDate(210),
    size: 521,
    members: [
      {
        text: 'Y',
        variant: 'danger'
      },
      {
        text: 'L',
        variant: 'success'
      },
      {
        text: 'O',
        variant: 'dark'
      },
      {
        text: 'J',
        variant: 'warning'
      },
      {
        text: 'G',
        variant: 'primary'
      },
    ]
  },
  {
    id: '2003',
    title: 'Dashboard tech requirements',
    icon: 'ri:file-copy-line',
    file: '12 File',
    fileVariant: 'warning',
    userId: '153',
    date: addOrSubtractDaysFromDate(100),
    size: 7.2,
    members: [
      {
        text: 'A',
        variant: 'primary'
      },
      {
        text: 'B',
        variant: 'warning'
      },
      {
        text: 'R',
        variant: 'danger'
      },
      {
        text: 'C',
        variant: 'secondary'
      },
      {
        text: 'U',
        variant: 'dark'
      },
    ]
  },
  {
    id: '2004',
    title: 'dashboard.jpg',
    icon: 'ri:file-image-line',
    file: '172 Jpg Photo',
    fileVariant: 'primary',
    userId: '154',
    date: addOrSubtractDaysFromDate(354),
    size: 54.2,
    members: [
      {
        text: 'L',
        variant: 'warning'
      },
      {
        text: 'Y',
        variant: 'secondary'
      },
      {
        text: 'A',
        variant: 'dark'
      },
      {
        text: 'R',
        variant: 'primary'
      },
      {
        text: 'V',
        variant: 'info'
      },
    ]
  },
  {
    id: '2005',
    title: 'admin-hospital.zip',
    icon: 'ri:file-zip-line',
    file: 'admin-hospital.zip',
    fileVariant: 'success',
    userId: '155',
    date: addOrSubtractDaysFromDate(45),
    size: 8.3,
    members: [
      {
        text: 'G',
        variant: 'dark'
      },
      {
        text: 'O',
        variant: 'danger'
      },
      {
        text: 'W',
        variant: 'secondary'
      },
      {
        text: 'A',
        variant: 'primary'
      },
      {
        text: 'K',
        variant: 'warning'
      },
    ]
  },
  {
    id: '2006',
    title: 'Dashboard tech requirements',
    icon: 'ri:file-pdf-line',
    file: '15 File',
    fileVariant: 'warning',
    userId: '156',
    date: addOrSubtractDaysFromDate(100),
    size: 7.2,
    members: [
      {
        text: 'A',
        variant: 'primary'
      },
      {
        text: 'R',
        variant: 'danger'
      },
      {
        text: 'C',
        variant: 'secondary'
      },
      {
        text: 'U',
        variant: 'dark'
      },
    ]
  },
  {
    id: '2007',
    title: 'adminTo-dashboard.pdf',
    icon: 'ri:file-excel-line',
    file: '18 Pdf',
    fileVariant: 'danger',
    userId: '157',
    date: addOrSubtractDaysFromDate(210),
    size: 120,
    members: [
      {
        text: 'Y',
        variant: 'danger'
      },

      {
        text: 'G',
        variant: 'primary'
      },
    ]
  },
  {
    id: '2008',
    title: 'dashboard.jpg',
    icon: 'ri:file-text-line',
    file: '172 Jpg Photo',
    fileVariant: 'success',
    userId: '158',
    date: addOrSubtractDaysFromDate(354),
    size: 54.2,
    members: [
      {
        text: 'L',
        variant: 'warning'
      },
      {
        text: 'A',
        variant: 'dark'
      },
      {
        text: 'R',
        variant: 'primary'
      },
      {
        text: 'V',
        variant: 'info'
      },
    ]
  },
  {
    id: '2009',
    title: 'dashboard.jpg',
    icon: 'ri:file-image-line',
    file: '172 Jpg Photo',
    fileVariant: 'primary',
    userId: '159',
    date: addOrSubtractDaysFromDate(354),
    size: 54.2,
    members: [
      {
        text: 'L',
        variant: 'warning'
      },
      {
        text: 'A',
        variant: 'dark'
      },
      {
        text: 'R',
        variant: 'primary'
      },

    ]
  },
]