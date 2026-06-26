import React from 'react'
import File from './File'
import OffcanvasCard from './OffcanvasCard'

const FIleManager = () => {
  return (
    <div className="d-flex gap-2">
      <div className='d-sm-none d-xl-block'>
        <OffcanvasCard />
      </div>
      <File />
    </div>
  )
}

export default FIleManager