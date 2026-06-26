import { useEffect, useState } from 'react'
import { Helmet } from 'react-helmet'

type PageTitleProps = {
	subName?: string
	title: string
	children?: any
}

const PageBreadcrumb = ({ title }: PageTitleProps) => {



	return (
		<>
			<Helmet>
				<title>{title} | XPARK GMAO - Système de Gestion de Flotte et Maintenance</title>
			</Helmet>
		</>
	)
}

export default PageBreadcrumb
