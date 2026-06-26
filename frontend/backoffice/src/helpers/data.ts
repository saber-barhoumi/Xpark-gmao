import { brandListData, dataTableRecords, filesData, invoicesData, socialUserData, userData } from "@/assets/data/other"
import { productData } from "@/assets/data/Product"
import { BrandListType, Employee, FilesType, InvoicesType, UserType } from "@/types/data"
import { sleep } from "@/utils/promise"



// export const getBrandsList = async (): BrandListType[] => {
//   return brandListData
// }

export const getAllUsers = async (): Promise<UserType[]> => {
  return userData
}

export const getUserById = async (id: UserType['id']): Promise<UserType | void> => {
  const user = userData.find((user) => user.id === id)
  if (user) {
    await sleep()
    return user
  }
}


export const getAllInvoices = async (): Promise<InvoicesType[]> => {
  const data = invoicesData.map((item) => {
    const users = socialUserData.find((product) => product.id === item.userId)
    const products = productData.find((product) => product.id === item.productId)
    return {
      ...item,
      users,
      products,
    }
  })
  await sleep()
  return data
}



export const getAllDataTableRecords = async (): Promise<Employee[]> => {
  await sleep()
  return dataTableRecords
}

export const getAllFiles = async (): Promise<FilesType[]> => {
  const data = filesData.map((item) => {
    const user = socialUserData.find((user) => user.id == item.userId)
    return {
      ...item,
      user,
    }
  })
  await sleep()
  return data
}
