import { useLayoutContext } from '@/context/useLayoutContext'
import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'

const Horizontal = () => {
  const navigation = useNavigate()
  const { changeLayoutOrientation } = useLayoutContext()
  useEffect(() => {
    changeLayoutOrientation('horizontal')
    navigation('/dashboard')
  }, [navigation])
  return <></>
}

export default Horizontal