import { useLayoutContext } from '@/context/useLayoutContext'
import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'

const HoverMenu = () => {
  const navigation = useNavigate()
  const { changeMainMenuSize } = useLayoutContext()
  useEffect(() => {
    changeMainMenuSize('sm-hover')
    navigation('/dashboard')
  }, [navigation])
  return <></>
}

export default HoverMenu