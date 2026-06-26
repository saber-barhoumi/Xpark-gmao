import { Jost, Rajdhani, } from 'next/font/google'

export const jost = Jost({
    weight: [ '100','200','300','400', '500','600', '700','800', '900'],
    subsets: ['latin'],
    variable: "--onpoint-font",
    display: 'swap',
})
export const rajdhani = Rajdhani({
    weight: [ '300','400', '500', '600', '700'],
    subsets: ['latin'],
    variable: "--onpoint-font-two",
    display: 'swap',
})
