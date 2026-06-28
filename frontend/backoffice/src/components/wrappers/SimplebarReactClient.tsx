
import type SimpleBarCore from 'simplebar-core'
import SimpleBar, { type Props } from 'simplebar-react'
import React from 'react'
import { ChildrenType } from '../../types/component-props'

type SimplebarReactClientProps = Props & ChildrenType

const SimplebarReactClient = React.forwardRef<SimpleBarCore | null, SimplebarReactClientProps>(
  ({ children, ...options }, ref) => {
    return <SimpleBar ref={ref} {...options}>{children}</SimpleBar>
  }
)

SimplebarReactClient.displayName = 'SimplebarReactClient'

export default SimplebarReactClient
