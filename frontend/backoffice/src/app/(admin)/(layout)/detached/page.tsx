import { useLayoutContext } from '@/context/useLayoutContext'
import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'

const Detached = () => {
  const navigation = useNavigate()
  const { changeLayoutMode } = useLayoutContext()
  useEffect(() => {
    changeLayoutMode('detached')
    navigation('/dashboard')
  }, [navigation])
  return <></>
}

export default Detached