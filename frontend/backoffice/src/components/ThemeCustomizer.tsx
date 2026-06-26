import { Col, Offcanvas, OffcanvasHeader, Row } from 'react-bootstrap'

// import type { LayoutOrientationType, MenuThemeType, OffcanvasControlType, ThemeType, TopBarThemeType } from '@/types/context'
import { Fragment } from 'react'
import IconifyIcon from './wrappers/IconifyIcon'
import SimplebarReactClient from './wrappers/SimplebarReactClient'
import { LayoutOrientationType, MainMenuType, OffcanvasControlType, ThemeType, TopBarType } from '@/types/layout'
import { useLayoutContext } from '@/context/useLayoutContext'
import { toSentenceCase } from '@/utils/change-casing'

type LayoutOrientationTypes = {
    icon: string;
    mode: LayoutOrientationType;
}

type ColorSchemaType = {
    icon: string;
    mode: ThemeType;
}
const ColorScheme = () => {
    const { theme, changeTheme } = useLayoutContext()
    const modes: ColorSchemaType[] = [
        {
            icon: 'solar:sun-bold-duotone',
            mode: 'light',
        },
        {
            icon: 'solar:cloud-sun-2-bold-duotone',
            mode: 'dark',
        },
    ]
    return (
        <Fragment>
            <h5 className="mb-3 fs-16 fw-bold">Color Scheme</h5>
            <Row>
                {modes.map((item, idx) => (
                    <Col xs={4} key={item.mode + idx}>
                        <div className="form-check card-radio">
                            <input
                                className="form-check-input"
                                type="radio"
                                name="data-bs-theme"
                                id={`layout-color-${item.mode}`}
                                onChange={() => changeTheme(item.mode)}
                                checked={theme === item.mode}
                            />
                            <label className="form-check-label p-3 w-100 d-flex justify-content-center align-items-center" htmlFor={`layout-color-${item.mode}`}>
                                <div className="check-icon">
                                    {
                                        theme === item.mode &&
                                        <IconifyIcon icon="tabler:circle-check-filled" className='check-icons' />
                                    }
                                    <IconifyIcon icon={item.icon} className="fs-32 text-muted" />
                                </div>
                            </label>


                        </div>
                        <h5 className="fs-14 text-center text-muted mt-2 ">{toSentenceCase(item.mode)}</h5>
                    </Col>
                ))}




            </Row>
        </Fragment>
    )
}


const OrientationScheme = () => {
    const { orientation, changeLayoutOrientation } = useLayoutContext()
    const modes: LayoutOrientationTypes[] = [
        {
            icon: 'tabler:layout-distribute-vertical-filled',
            mode: 'vertical'
        },
        {
            icon: 'tabler:layout-distribute-horizontal-filled',
            mode: 'horizontal'
        },
    ]
    return (
        <>
            <h5 className="mb-3 fs-16 fw-bold">Layout Type</h5>
            <Row>
                {
                    modes.map((item, idx) => (
                        <Col xs={4} key={item.mode + idx}>
                            <div className="form-check card-radio">
                                <input
                                    className="form-check-input"
                                    type="radio"
                                    name="data-layout"
                                    id={`layout-type-${item.mode}`}
                                    onChange={() => changeLayoutOrientation(item.mode)}
                                    checked={orientation === item.mode}
                                />
                                <label className="form-check-label p-3 w-100 d-flex justify-content-center align-items-center" htmlFor={`layout-type-${item.mode}`}>
                                    <div className='check-icon'>
                                    {
                                        orientation === item.mode &&
                                        <IconifyIcon icon="tabler:circle-check-filled" className='check-icons' />
                                    }
                                    </div>
                                    <IconifyIcon icon={item.icon} className="fs-32 text-muted" />
                                </label>
                            </div>
                            <h5 className="fs-14 text-center text-muted mt-2 ">{toSentenceCase(item.mode)}</h5>
                        </Col>
                    ))
                }
            </Row>
        </>
    )
}

const LayoutMode = () => {
    const { mode, changeLayoutMode } = useLayoutContext()
    return (
        <>
            <h5 className="mb-3 fs-16 fw-bold">Layout Mode</h5>
            <Row>
                <Col xs={4}>
                    <div className="form-check card-radio">
                        <input
                            className="form-check-input"
                            type="radio"
                            name="data-layout-mode"
                            id="layout-mode-fluid"
                            onChange={() => changeLayoutMode('fluid')}
                            checked={mode === 'fluid'}
                        />
                        <label className="form-check-label p-0 avatar-xl w-100" htmlFor={`layout-mode-fluid`}>
                            {/* <div className='check-icon'> */}
                            {
                                mode === 'fluid' &&
                                <IconifyIcon icon="tabler:circle-check-filled" />
                            }
                            {/* </div> */}
                            <div>
                                <span className="d-flex h-100">
                                    <span className="flex-shrink-0">
                                        <span className="bg-light d-flex h-100 border-end flex-column p-1 px-2">
                                            <span className="d-block p-1 bg-dark-subtle rounded mb-1" />
                                            <span className="d-block border border-3 border-secondary border-opacity-25 rounded w-100 mb-1" />
                                            <span className="d-block border border-3 border-secondary border-opacity-25 rounded w-100 mb-1" />
                                            <span className="d-block border border-3 border-secondary border-opacity-25 rounded w-100 mb-1" />
                                            <span className="d-block border border-3 border-secondary border-opacity-25 rounded w-100 mb-1" />
                                        </span>
                                    </span>
                                    <span className="flex-grow-1">
                                        <span className="d-flex h-100 flex-column rounded-2">
                                            <span className="bg-light d-block p-1" />
                                        </span>
                                    </span>
                                </span>
                            </div>
                            <div>
                                <span className="d-flex h-100 flex-column">
                                    <span className="bg-light d-flex p-1 align-items-center border-bottom border-secondary border-opacity-25">
                                        <span className="d-block p-1 bg-dark-subtle rounded me-1" />
                                        <span className="d-block border border-3 border-secondary border-opacity-25 rounded ms-auto" />
                                        <span className="d-block border border-3 border-secondary border-opacity-25 rounded ms-1" />
                                        <span className="d-block border border-3 border-secondary border-opacity-25 rounded ms-1" />
                                        <span className="d-block border border-3 border-secondary border-opacity-25 rounded ms-1" />
                                    </span>
                                    <span className="bg-light d-block p-1" />
                                </span>
                            </div>
                        </label>
                    </div>
                    <h5 className="fs-14 text-center text-muted mt-2">Fluid</h5>
                </Col >
                <Col xs={4}>
                    <div className="form-check sidebar-setting card-radio">
                        <input
                            className="form-check-input"
                            type="radio"
                            name="data-layout-mode"
                            id="data-layout-detached"
                            onChange={() => changeLayoutMode('detached')}
                            checked={mode === 'detached'}
                        />
                        <label className="form-check-label p-0 avatar-xl w-100" htmlFor="data-layout-detached">
                            {/* <div className='check-icon'> */}
                            {
                                mode === 'detached' &&
                                <IconifyIcon icon="tabler:circle-check-filled" />
                            }
                            {/* </div> */}
                            <span className="d-flex h-100 flex-column">
                                <span className="bg-light d-flex p-1 align-items-center border-bottom ">
                                    <span className="d-block p-1 bg-dark-subtle rounded me-1" />
                                    <span className="d-block border border-3 border-secondary border-opacity-25 rounded ms-auto" />
                                    <span className="d-block border border-3 border-secondary border-opacity-25 rounded ms-1" />
                                    <span className="d-block border border-3 border-secondary border-opacity-25 rounded ms-1" />
                                    <span className="d-block border border-3 border-secondary border-opacity-25 rounded ms-1" />
                                </span>
                                <span className="d-flex h-100 p-1 px-2">
                                    <span className="flex-shrink-0">
                                        <span className="bg-light d-flex h-100 flex-column p-1 px-2">
                                            <span className="d-block border border-3 border-secondary border-opacity-25 rounded w-100 mb-1" />
                                            <span className="d-block border border-3 border-secondary border-opacity-25 rounded w-100 mb-1" />
                                            <span className="d-block border border-3 border-secondary border-opacity-25 rounded w-100" />
                                        </span>
                                    </span>
                                </span>
                                <span className="bg-light d-block p-1 mt-auto px-2" />
                            </span>
                        </label>
                    </div>
                    <h5 className="fs-14 text-center text-muted mt-2">Detached</h5>
                </Col>
            </Row >
        </>
    )
}

const TopbarTheme = () => {
    const { topBar, changeTopColor } = useLayoutContext()
    const modes: TopBarType['color'][] = ['light', 'dark', 'brand']
    return (
        <>
            <h5 className="mb-3 fs-16 fw-bold">Topbar Color</h5>
            <Row>
                {
                    modes.map((mode, idx) => (
                        <Col xs={3} key={idx}>
                            <div className="form-check card-radio">
                                <input
                                    className="form-check-input"
                                    type="radio"
                                    name="data-topbar-color"
                                    id={`topbar-color-${mode}`}
                                    onChange={() => changeTopColor(mode)}
                                    checked={topBar.color === mode}
                                />
                                <label className="form-check-label p-0 avatar-lg w-100 bg-light" htmlFor={`topbar-color-${mode}`}>
                                    <div className='check-icon'>
                                        {
                                            topBar.color === mode &&
                                            <IconifyIcon icon="tabler:circle-check-filled" />
                                        }
                                    </div>
                                    <span className="d-flex align-items-center justify-content-center h-100">
                                        <span className={`p-2 d-inline-flex shadow rounded-circle bg-${mode == 'brand' ? 'primary' : mode == 'light' ? 'white' : 'dark'}`} />
                                    </span>
                                </label>
                            </div>
                            <h5 className="fs-14 text-center text-muted mt-2">{toSentenceCase(mode)}</h5>
                        </Col>
                    ))
                }

            </Row>
        </>
    )
}

const MenuTheme = () => {
    const { mainMenu, changeMainMenuColor } = useLayoutContext()
    const modes: MainMenuType['color'][] = ['light', 'dark', 'brand']
    return (
        <>
            <h5 className="mb-3 fs-16 fw-bold">Menu Color</h5>
            <Row>
                {
                    modes.map((mode, idx) => (
                        <Col xs={3} key={idx}>
                            <div className="form-check sidebar-setting card-radio">
                                <input
                                    className="form-check-input"
                                    type="radio" name="data-menu-color"
                                    id={`sidenav-color-${mode}`}
                                    onChange={() => changeMainMenuColor(mode)}
                                    checked={mainMenu.color === mode}
                                />
                                <label className="form-check-label p-0 avatar-lg w-100 bg-light" htmlFor={`sidenav-color-${mode}`}>
                                    <div className='check-icon'>
                                        {
                                            mainMenu.color === mode &&
                                            < IconifyIcon icon="tabler:circle-check-filled" />
                                        }
                                    </div>
                                    <span className="d-flex align-items-center justify-content-center h-100">
                                        <span className={`p-2 d-inline-flex shadow rounded-circle bg-${mode == 'brand' ? 'primary' : mode == 'light' ? 'white' : 'dark'}`} />
                                    </span>
                                </label>
                            </div>
                            <h5 className="fs-14 text-center text-muted mt-2">{toSentenceCase(mode)}</h5>
                        </Col>
                    ))
                }
            </Row>
        </>
    )
}

const SidebarSize = () => {
    const { mainMenu, changeMainMenuSize } = useLayoutContext()


    return (
        <>
            <h5 className="mb-3 fs-16 fw-bold">Sidebar Size</h5>
            <Row>
                <Col xs={4}>
                    <div className="form-check sidebar-setting card-radio">
                        <input
                            className="form-check-input"
                            type="radio" name="data-sidenav-size"
                            id={`sidenav-size-${'default'}`}
                            onChange={() => changeMainMenuSize('default')}
                            checked={mainMenu.size === 'default'}
                        />
                        <label className="form-check-label p-0 avatar-xl w-100" htmlFor="sidenav-size-default">
                            <span className="d-flex h-100">
                                <span className="flex-shrink-0">
                                    <span className="bg-light d-flex h-100 border-end  flex-column p-1 px-2">
                                        <span className="d-block p-1 bg-dark-subtle rounded mb-1" />
                                        <span className="d-block border border-3 border-secondary border-opacity-25 rounded w-100 mb-1" />
                                        <span className="d-block border border-3 border-secondary border-opacity-25 rounded w-100 mb-1" />
                                        <span className="d-block border border-3 border-secondary border-opacity-25 rounded w-100 mb-1" />
                                        <span className="d-block border border-3 border-secondary border-opacity-25 rounded w-100 mb-1" />
                                    </span>
                                </span>
                                <span className="flex-grow-1">
                                    <div className='check-icon'>
                                        {
                                            mainMenu.size === 'default' &&
                                            <IconifyIcon icon="tabler:circle-check-filled" />
                                        }
                                    </div>
                                    <span className="d-flex h-100 flex-column">
                                        <span className="bg-light d-block p-1" />
                                    </span>
                                </span>
                            </span>
                        </label>
                    </div>
                    <h5 className="fs-14 text-center text-muted mt-2">Default</h5>
                </Col>
                <Col xs={4}>
                    <div className="form-check sidebar-setting card-radio">
                        <input
                            className="form-check-input"
                            type="radio" name="data-sidenav-size"
                            id="sidenav-size-compact"
                            onChange={() => changeMainMenuSize('compact')}
                            checked={mainMenu.size === 'compact'}
                        />
                        <label className="form-check-label p-0 avatar-xl w-100" htmlFor="sidenav-size-compact">
                            <span className="d-flex h-100">
                                <span className="flex-shrink-0">
                                    <span className="bg-light d-flex h-100 border-end  flex-column p-1">
                                        <span className="d-block p-1 bg-dark-subtle rounded mb-1" />
                                        <span className="d-block border border-3 border-secondary border-opacity-25 rounded w-100 mb-1" />
                                        <span className="d-block border border-3 border-secondary border-opacity-25 rounded w-100 mb-1" />
                                        <span className="d-block border border-3 border-secondary border-opacity-25 rounded w-100 mb-1" />
                                        <span className="d-block border border-3 border-secondary border-opacity-25 rounded w-100 mb-1" />
                                    </span>
                                </span>
                                <span className="flex-grow-1">
                                    <div className='check-icon'>
                                        {
                                            mainMenu.size === 'compact' &&
                                            <IconifyIcon icon="tabler:circle-check-filled" />
                                        }
                                    </div>
                                    <span className="d-flex h-100 flex-column">
                                        <span className="bg-light d-block p-1" />
                                    </span>
                                </span>
                            </span>
                        </label>
                    </div>
                    <h5 className="fs-14 text-center text-muted mt-2">Compact</h5>
                </Col>
                <Col xs={4}>
                    <div className="form-check sidebar-setting card-radio">
                        <input
                            className="form-check-input"
                            type="radio" name="data-sidenav-size"
                            id="sidenav-size-small"
                            onChange={() => changeMainMenuSize('condensed')}
                            checked={mainMenu.size === 'condensed'}
                        />
                        <label className="form-check-label p-0 avatar-xl w-100" htmlFor="sidenav-size-small">
                            <span className="d-flex h-100">
                                <span className="flex-shrink-0">
                                    <span className="bg-light d-flex h-100 border-end flex-column" style={{ padding: 2 }}>
                                        <span className="d-block p-1 bg-dark-subtle rounded mb-1" />
                                        <span className="d-block border border-3 border-secondary border-opacity-25 rounded w-100 mb-1" />
                                        <span className="d-block border border-3 border-secondary border-opacity-25 rounded w-100 mb-1" />
                                        <span className="d-block border border-3 border-secondary border-opacity-25 rounded w-100 mb-1" />
                                        <span className="d-block border border-3 border-secondary border-opacity-25 rounded w-100 mb-1" />
                                    </span>
                                </span>
                                <span className="flex-grow-1">
                                    <div className='check-icon'>
                                        {
                                            mainMenu.size === 'condensed' &&
                                            <IconifyIcon icon="tabler:circle-check-filled" />
                                        }
                                    </div>
                                    <span className="d-flex h-100 flex-column">
                                        <span className="bg-light d-block p-1" />
                                    </span>
                                </span>
                            </span>
                        </label>
                    </div>
                    <h5 className="fs-14 text-center text-muted mt-2">Condensed</h5>
                </Col>
                <Col xs={4}>
                    <div className="form-check sidebar-setting card-radio">
                        <input
                            className="form-check-input"
                            type="radio"
                            name="data-sidenav-size"
                            id="sidenav-size-small-hover"
                            onChange={() => changeMainMenuSize('sm-hover')}
                            checked={mainMenu.size === 'sm-hover'}
                        />
                        <label className="form-check-label p-0 avatar-xl w-100" htmlFor="sidenav-size-small-hover">
                            <span className="d-flex h-100">
                                <span className="flex-shrink-0">
                                    <span className="bg-light d-flex h-100 border-end flex-column" style={{ padding: 2 }}>
                                        <span className="d-block p-1 bg-dark-subtle rounded mb-1" />
                                        <span className="d-block border border-3 border-secondary border-opacity-25 rounded w-100 mb-1" />
                                        <span className="d-block border border-3 border-secondary border-opacity-25 rounded w-100 mb-1" />
                                        <span className="d-block border border-3 border-secondary border-opacity-25 rounded w-100 mb-1" />
                                        <span className="d-block border border-3 border-secondary border-opacity-25 rounded w-100 mb-1" />
                                    </span>
                                </span>
                                <span className="flex-grow-1">
                                    <div className='check-icon'>
                                        {
                                            mainMenu.size === 'sm-hover' &&
                                            <IconifyIcon icon="tabler:circle-check-filled" />
                                        }
                                    </div>
                                    <span className="d-flex h-100 flex-column">
                                        <span className="bg-light d-block p-1" />
                                    </span>
                                </span>
                            </span>
                        </label>
                    </div>
                    <h5 className="fs-14 text-center text-muted mt-2">Hover View</h5>
                </Col>
                <Col xs={4}>
                    <div className="form-check sidebar-setting card-radio">
                        <input
                            className="form-check-input"
                            type="radio"
                            name="data-sidenav-size"
                            id="sidenav-size-full"
                            onChange={() => changeMainMenuSize('full')}
                            checked={mainMenu.size === 'full'}
                        />
                        <label className="form-check-label p-0 avatar-xl w-100" htmlFor="sidenav-size-full">
                            <div className='check-icon'>
                                {
                                    mainMenu.size === 'full' &&
                                    <IconifyIcon icon="tabler:circle-check-filled" />
                                }
                            </div>
                            <span className="d-flex h-100">
                                <span className="flex-shrink-0">
                                    <span className="d-flex h-100 flex-column">
                                        <span className="d-block p-1 bg-dark-subtle mb-1" />
                                    </span>
                                </span>
                                <span className="flex-grow-1">
                                    <span className="d-flex h-100 flex-column">
                                        <span className="bg-light d-block p-1" />
                                    </span>
                                </span>
                            </span>
                        </label>
                    </div>
                    <h5 className="fs-14 text-center text-muted mt-2">Full Layout</h5>
                </Col>
                <Col xs={4}>
                    <div className="form-check sidebar-setting card-radio">
                        <input
                            className="form-check-input"
                            type="radio"
                            name="data-sidenav-size"
                            id="sidenav-size-fullscreen"
                            defaultValue="fullscreen"
                            onChange={() => changeMainMenuSize('fullscreen')}
                            checked={mainMenu.size === 'fullscreen'}
                        />
                        <label className="form-check-label p-0 avatar-xl w-100" htmlFor="sidenav-size-fullscreen">
                            <div className='check-icon'>
                                {
                                    mainMenu.size === 'fullscreen' &&
                                    <IconifyIcon icon="tabler:circle-check-filled" />
                                }
                            </div>
                            <span className="d-flex h-100">
                                <span className="flex-grow-1">
                                    <span className="d-flex h-100 flex-column">
                                        <span className="bg-light d-block p-1" />
                                    </span>
                                </span>
                            </span>
                        </label>
                    </div>
                    <h5 className="fs-14 text-center text-muted mt-2">Hidden</h5>
                </Col>
            </Row>
        </>
    )
}

const ThemeCustomizer = ({ open, toggle }: OffcanvasControlType) => {
    const { resetSettings } = useLayoutContext()

    return (
        <>
            <Offcanvas show={open} onHide={toggle} placement='end' className="offcanvas-end" tabIndex={-1} id="theme-settings-offcanvas">
                <OffcanvasHeader className="d-flex align-items-center gap-2 px-3 py-3 border-bottom border-dashed">
                    <h5 className="flex-grow-1 mb-0">Theme Settings</h5>
                    <button type="button" onClick={toggle} className="btn-close" data-bs-dismiss="offcanvas" aria-label="Close" />
                </OffcanvasHeader>

                <SimplebarReactClient className="offcanvas-body p-0 h-100">
                    <div className="p-3 border-bottom border-dashed">
                        <OrientationScheme />
                    </div>
                    <div className="p-3 border-bottom border-dashed">
                        <ColorScheme />
                    </div>
                    <div className="p-3 border-bottom border-dashed sidebarMode">
                        <LayoutMode />
                    </div>
                    <div className="p-3 border-bottom border-dashed">
                        <TopbarTheme />
                    </div>
                    <div className="p-3 border-bottom border-dashed">
                        <MenuTheme />
                    </div>

                    <div className="p-3 .border-bottom .border-dashed sidebarMode">
                        <SidebarSize />
                    </div>

                </SimplebarReactClient>

                <div className="d-flex align-items-center gap-2 px-3 py-2 offcanvas-header border-top border-dashed">
                    <button type="button" className="btn w-50 btn-soft-danger" onClick={resetSettings} id="reset-layout">Reset</button>
                    <button type="button" className="btn w-50 btn-soft-info" onClick={toggle}>Buy Now</button>
                </div>

            </Offcanvas>
        </>
    )
}

export default ThemeCustomizer
