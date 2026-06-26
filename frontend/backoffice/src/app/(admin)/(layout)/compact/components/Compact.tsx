import { useLayoutContext } from '@/context/useLayoutContext'
import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'

const Compact = () => {
  const navigation = useNavigate()
  const { changeMainMenuSize } = useLayoutContext()
  useEffect(() => {
    changeMainMenuSize('compact')
    navigation('/dashboard')
  }, [navigation])
  return <></>
}

export default Compact