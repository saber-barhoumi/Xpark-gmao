import FallbackLoading from '@/components/FallbackLoading'
import { ChildrenType } from '@/types/component-props'
import { Suspense } from 'react'

const OtherLayout = ({ children }: ChildrenType) => {
  return <Suspense fallback={<FallbackLoading />}>{children}</Suspense>
}

export default OtherLayout
