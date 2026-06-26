import { useLayoutContext } from '@/context/useLayoutContext'
import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'

const DarkMode = () => {
  const navigation = useNavigate()
  const { changeTheme } = useLayoutContext()
  useEffect(() => {
    changeTheme('dark')
    navigation('/dashboard')
  }, [navigation])
  return <></>
}

export default DarkMode
