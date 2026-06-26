import { useLayoutContext } from '@/context/useLayoutContext'
import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'

const IconView = () => {
  const navigation = useNavigate()
  const { changeMainMenuSize } = useLayoutContext()
  useEffect(() => {
    changeMainMenuSize('condensed')
    navigation('/dashboard')
  }, [navigation])
  return <></>
}

export default IconView