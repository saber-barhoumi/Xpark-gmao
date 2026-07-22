import localFont from 'next/font/local'

export const jost = localFont({
    src: [
        { path: '../fonts/Jost-100.ttf', weight: '100', style: 'normal' },
        { path: '../fonts/Jost-200.ttf', weight: '200', style: 'normal' },
        { path: '../fonts/Jost-300.ttf', weight: '300', style: 'normal' },
        { path: '../fonts/Jost-400.ttf', weight: '400', style: 'normal' },
        { path: '../fonts/Jost-500.ttf', weight: '500', style: 'normal' },
        { path: '../fonts/Jost-600.ttf', weight: '600', style: 'normal' },
        { path: '../fonts/Jost-700.ttf', weight: '700', style: 'normal' },
        { path: '../fonts/Jost-800.ttf', weight: '800', style: 'normal' },
        { path: '../fonts/Jost-900.ttf', weight: '900', style: 'normal' },
    ],
    variable: '--onpoint-font',
    display: 'swap',
})

export const rajdhani = localFont({
    src: [
        { path: '../fonts/Rajdhani-300.ttf', weight: '300', style: 'normal' },
        { path: '../fonts/Rajdhani-400.ttf', weight: '400', style: 'normal' },
        { path: '../fonts/Rajdhani-500.ttf', weight: '500', style: 'normal' },
        { path: '../fonts/Rajdhani-600.ttf', weight: '600', style: 'normal' },
        { path: '../fonts/Rajdhani-700.ttf', weight: '700', style: 'normal' },
    ],
    variable: '--onpoint-font-two',
    display: 'swap',
})
