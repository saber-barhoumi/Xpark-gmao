import { useLayoutContext } from '@/context/useLayoutContext'
import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'

const FullView = () => {
  const navigation = useNavigate()
  const { changeMainMenuSize } = useLayoutContext()
  useEffect(() => {
    changeMainMenuSize('full')
    navigation('/dashboard')
  }, [navigation])
  return <></>
}

export default FullView