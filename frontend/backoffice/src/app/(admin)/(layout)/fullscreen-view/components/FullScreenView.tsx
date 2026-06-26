import { useLayoutContext } from '@/context/useLayoutContext'
import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'

const FullScreenView = () => {
  const navigation = useNavigate()
  const { changeMainMenuSize } = useLayoutContext()
  useEffect(() => {
    changeMainMenuSize('fullscreen')
    navigation('/dashboard')
  }, [navigation])
  return <></>
}

export default FullScreenView