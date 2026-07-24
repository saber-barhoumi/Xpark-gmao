import { useState, useEffect, useMemo } from 'react'
import { Badge, Button, Card, Col, Dropdown, Form, InputGroup, Modal, Row, Spinner, Table } from 'react-bootstrap'
import PageBreadcrumb from '@/components/PageBreadcrumb'
import IconifyIcon from '@/components/wrappers/IconifyIcon'
import carburantService, { Carburant, CarburantStats, CreateCarburantDto } from '@/services/carburantService'
import sourceService, { Source } from '@/services/sourceService'
import useBulkSelection from '@/hooks/useBulkSelection'
import BulkDeleteButtons from '@/components/table/BulkDeleteButtons'
import { vehiculeService } from '@/services/vehiculeService'
import Swal from 'sweetalert2'
import ReactApexChart from 'react-apexcharts'
import OCRUploadZone from '../../gestion/vehicules/components/OCRUploadZone'
import { ExtractedOCRData } from '@/services/groqOCRService'

// ── Export (convention projet : CSV séparateur « ; » + BOM UTF-8, PDF via
//    impression navigateur — zéro dépendance, comme la page Demandes) ──────────
const COLS_EXPORT = ['Date', 'Véhicule', 'Type', 'Quantité (L)', 'Prix/L', 'Total (TND)', 'Km', 'Conso L/100km', 'Source']

function ligneExport(r: Carburant): (string | number)[] {
    return [
        new Date(r.dateRemplissage).toLocaleDateString('fr-FR'),
        r.vehiculeImmatriculation ?? `#${r.vehiculeId}`,
        r.typeCarburant,
        r.quantite,
        r.prixUnitaire?.toFixed(3),
        r.montantTotal?.toFixed(2),
        r.kilometrage ?? '',
        r.consommationL100km != null ? r.consommationL100km.toFixed(1) : '',
        r.sourceNom ?? r.station ?? 'Station externe',
    ]
}

function exportCsv(rows: Carburant[]) {
    const lignes = rows.map(r => ligneExport(r).map(c => `"${String(c).replace(/"/g, '""')}"`).join(';'))
    const blob = new Blob(['﻿' + [COLS_EXPORT.join(';'), ...lignes].join('\r\n')], { type: 'text/csv;charset=utf-8' })
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = `carburant-${new Date().toISOString().slice(0, 10)}.csv`
    a.click()
    URL.revokeObjectURL(a.href)
}

function exportPdf(rows: Carburant[]) {
    const w = window.open('', '_blank')
    if (!w) { Swal.fire('Bloqué', 'Autorisez les fenêtres pop-up pour exporter en PDF.', 'warning'); return }
    const cell = (c: string | number) => `<td style="padding:6px 8px;border-bottom:1px solid #eee;font-size:12px">${c}</td>`
    const body = rows.map(r => `<tr>${ligneExport(r).map(cell).join('')}</tr>`).join('')
    w.document.write(`<html><head><title>Carburant XPARK</title></head><body style="font-family:system-ui,sans-serif;padding:24px">
        <h2 style="color:#727cf5">XPARK — Historique carburant</h2>
        <p style="color:#6c757d;font-size:12px">${rows.length} enregistrement(s) — édité le ${new Date().toLocaleString('fr-FR')}</p>
        <table style="width:100%;border-collapse:collapse"><thead><tr>${COLS_EXPORT.map(h => `<th style="text-align:left;padding:8px;border-bottom:2px solid #333;font-size:12px">${h}</th>`).join('')}</tr></thead>
        <tbody>${body}</tbody></table></body></html>`)
    w.document.close(); w.focus(); setTimeout(() => w.print(), 300)
}

const PAGE_SIZE = 10

export default function CarburantPage() {
    const [records, setRecords] = useState<Carburant[]>([])
    const [stats, setStats] = useState<CarburantStats | null>(null)
    const [sources, setSources] = useState<Source[]>([])
    const [vehicules, setVehicules] = useState<any[]>([])
    
    const [loading, setLoading] = useState(true)
    const [showModal, setShowModal] = useState(false)
    const [saving, setSaving] = useState(false)

    // Sélection multiple (suppression en masse)
    const [deleting, setDeleting] = useState(false)
    const sel = useBulkSelection(records ?? [], r => r.idCarburant)
    
    const [form, setForm] = useState<CreateCarburantDto>({
        dateRemplissage: new Date().toISOString().split('T')[0],
        quantite: 0,
        prixUnitaire: 0,
        montantTotal: 0,
        kilometrage: 0,
        typeCarburant: 'Diesel',
        vehiculeId: 0,
    })

    const [latestInfo, setLatestInfo] = useState<{ lastMileage: number, typeCarburant: string } | null>(null)
    const [fetchingInfo, setFetchingInfo] = useState(false)

    // ── Filtres / recherche / tri / pagination (côté client sur les records) ──
    const [fltVehicule, setFltVehicule] = useState<number | ''>('')
    const [fltType,     setFltType]     = useState<string>('')
    const [fltStart,    setFltStart]    = useState<string>('')
    const [fltEnd,      setFltEnd]      = useState<string>('')
    const [search,      setSearch]      = useState('')
    const [sortKey,     setSortKey]     = useState<'date' | 'montant' | 'quantite' | 'km' | 'conso'>('date')
    const [sortDir,     setSortDir]     = useState<'asc' | 'desc'>('desc')
    const [page,        setPage]        = useState(1)

    const handleVehiculeChange = async (vid: number) => {
        setForm(prev => ({ ...prev, vehiculeId: vid }))
        if (!vid) {
            setLatestInfo(null)
            return
        }
        setFetchingInfo(true)
        try {
            const info = await vehiculeService.getLatestInfo(vid)
            setLatestInfo(info)
            setForm(prev => ({ 
                ...prev, 
                typeCarburant: info.typeCarburant,
                kilometrage: info.lastMileage > 0 ? info.lastMileage : prev.kilometrage
            }))
        } catch (err) {
            console.error(err)
        } finally {
            setFetchingInfo(false)
        }
    }

    const handleCalculateTotal = (qty: number, price: number) => {
        const total = qty * price
        setForm(prev => ({ ...prev, quantite: qty, prixUnitaire: price, montantTotal: total }))
    }

    const handleCalculateQty = (total: number, price: number) => {
        const qty = price > 0 ? total / price : 0
        setForm(prev => ({ ...prev, quantite: qty, prixUnitaire: price, montantTotal: total }))
    }

    const loadData = async () => {
        setLoading(true)
        try {
            // Le véhicule et la plage de dates sont poussés au backend (agrégation
            // des stats côté serveur) ; le type et la recherche restent client.
            const params = {
                vehiculeId: fltVehicule || undefined,
                start:      fltStart || undefined,
                end:        fltEnd || undefined,
            }
            const [r, s, src, v] = await Promise.all([
                carburantService.getAll(fltVehicule || undefined),
                carburantService.getStats(params),
                sourceService.getActives(),
                vehiculeService.getAll()
            ])
            setRecords(r || [])
            setStats(s)
            setSources(src || [])
            setVehicules(v || [])
        } catch (err) {
            console.error(err)
        } finally {
            setLoading(false)
        }
    }

    // Recharge quand un filtre « serveur » change (véhicule / plage de dates).
    useEffect(() => { loadData() }, [fltVehicule, fltStart, fltEnd])

    // ── Données dérivées : filtre type + recherche, tri, pagination ──────────
    const recordsFiltres = useMemo(() => {
        let list = [...records]
        if (fltType) list = list.filter(r => r.typeCarburant === fltType)
        if (fltStart) list = list.filter(r => r.dateRemplissage >= fltStart)
        if (fltEnd)   list = list.filter(r => r.dateRemplissage <= fltEnd + 'T23:59:59')
        if (search.trim()) {
            const q = search.trim().toLowerCase()
            list = list.filter(r =>
                (r.vehiculeImmatriculation ?? '').toLowerCase().includes(q) ||
                (r.sourceNom ?? r.station ?? '').toLowerCase().includes(q) ||
                (r.typeCarburant ?? '').toLowerCase().includes(q))
        }
        const val = (r: Carburant) => sortKey === 'date' ? new Date(r.dateRemplissage).getTime()
            : sortKey === 'montant' ? r.montantTotal
            : sortKey === 'quantite' ? r.quantite
            : sortKey === 'km' ? (r.kilometrage ?? 0)
            : (r.consommationL100km ?? 0)
        list.sort((a, b) => sortDir === 'asc' ? val(a) - val(b) : val(b) - val(a))
        return list
    }, [records, fltType, fltStart, fltEnd, search, sortKey, sortDir])

    const totalPages   = Math.max(1, Math.ceil(recordsFiltres.length / PAGE_SIZE))
    const pageCourante = Math.min(page, totalPages)
    const recordsPage  = recordsFiltres.slice((pageCourante - 1) * PAGE_SIZE, pageCourante * PAGE_SIZE)

    useEffect(() => { setPage(1) }, [fltType, fltStart, fltEnd, search, fltVehicule])

    const toggleSort = (key: typeof sortKey) => {
        if (sortKey === key) setSortDir(d => d === 'asc' ? 'desc' : 'asc')
        else { setSortKey(key); setSortDir('desc') }
    }

    // Véhicule le plus consommateur (par coût) — issu des stats backend.
    const topVehicule = stats?.topVehiculesParCout?.[0]
    // Prix moyen au litre observé sur la sélection.
    const prixMoyenL = stats && stats.litresTotaux > 0 ? stats.coutTotal / stats.litresTotaux : 0

    const resetFiltres = () => { setFltVehicule(''); setFltType(''); setFltStart(''); setFltEnd(''); setSearch('') }
    const filtresActifs = !!(fltVehicule || fltType || fltStart || fltEnd || search)
    const exportRows = recordsFiltres

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!form.vehiculeId) return Swal.fire('Erreur', 'Veuillez sélectionner un véhicule', 'error')
        
        if (latestInfo && form.kilometrage < latestInfo.lastMileage) {
            return Swal.fire('Correction requise', `Le kilométrage doit être supérieur ou égal au dernier relevé (${latestInfo.lastMileage} km)`, 'warning')
        }

        setSaving(true)
        try {
            await carburantService.create(form)
            setShowModal(false)
            setLatestInfo(null)
            loadData()
            Swal.fire({ icon: 'success', title: 'Plein enregistré', timer: 1500, showConfirmButton: false })
        } catch (err: any) {
            Swal.fire('Erreur', err.response?.data?.message || 'Erreur lors de l\'enregistrement', 'error')
        } finally {
            setSaving(false)
        }
    }

    const handleDelete = async (id: number) => {
        const res = await Swal.fire({
            title: 'Supprimer cet enregistrement ?',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonText: 'Supprimer',
            confirmButtonColor: '#d33'
        })
        if (res.isConfirmed) {
            await carburantService.delete(id)
            loadData()
        }
    }

    // Suppression en masse : réutilise carburantService.delete unitaire
    const deleteMany = async (ids: number[]) => {
        setDeleting(true)
        try {
            await Promise.all(ids.map(id => carburantService.delete(id)))
            sel.clear()
            await loadData()
            Swal.fire('Supprimés', `${ids.length} plein(s) supprimé(s).`, 'success')
        } catch (err: any) {
            Swal.fire('Erreur', err.response?.data?.message || 'Suppression partielle ou impossible.', 'error')
            await loadData()
        } finally { setDeleting(false) }
    }

    // ApexChart config (Premium Donut Style)
    const chartOptions: any = {
        labels: stats?.repartitionParSource?.map(s => s.nomSource) || [],
        colors: ["#727cf5", "#0acf97", "#fa5c7c", "#ffbc00", "#39afd1", "#313a46"],
        legend: {
            show: true,
            position: 'bottom',
            fontSize: '12px',
            horizontalAlign: 'center',
            offsetY: 8,
            markers: { radius: 12 }
        },
        plotOptions: {
            pie: {
                donut: {
                    size: '72%',
                    labels: {
                        show: true,
                        total: {
                            show: true,
                            label: 'Dépense Totale',
                            formatter: () => stats?.coutTotal?.toLocaleString() + ' TND',
                            fontSize: '13px',
                            fontWeight: 500,
                            color: '#6c757d'
                        },
                        value: {
                            show: true,
                            fontSize: '18px',
                            fontWeight: 700,
                            color: '#313a46',
                            offsetY: 4,
                            formatter: (val: any) => val.toLocaleString() + ' TND'
                        }
                    }
                }
            }
        },
        dataLabels: { enabled: false },
        stroke: { show: true, width: 3, colors: ['#fff'] },
        tooltip: { theme: 'light', y: { formatter: (val: any) => val.toLocaleString() + ' TND' } }
    }
    const chartSeries = stats?.repartitionParSource?.map(s => s.coutTotal) || []

    // ─── RadialBar Options (Gauge) ───────────────────────────
    const getConsumptionColor = (val: number) => {
        if (val > 12) return '#fa5c7c' // Red for high consumption
        if (val > 8) return '#ffbc00'  // Orange for moderate
        return '#0acf97'              // Green for efficient
    }

    const radialBarOptions: any = {
        chart: { type: 'radialBar', height: 200, sparkline: { enabled: true } },
        plotOptions: {
            radialBar: {
                startAngle: -90,
                endAngle: 90,
                track: { background: "rgba(170,184,197, 0.2)", strokeWidth: '97%', margin: 5 },
                dataLabels: {
                    name: { show: false },
                    value: { 
                        offsetY: -2, 
                        fontSize: '20px', 
                        fontWeight: '700', 
                        color: getConsumptionColor(stats?.consommationMoyenne || 0),
                        formatter: () => stats?.consommationMoyenne?.toFixed(2) + ' L'
                    }
                }
            }
        },
        grid: { padding: { top: -10 } },
        colors: [getConsumptionColor(stats?.consommationMoyenne || 0)],
        labels: ['Consommation'],
    }
    const radialBarSeries = [Math.min(((stats?.consommationMoyenne || 0) / 15) * 100, 100)]

    // ─── Area Chart (Monthly Trends) ─────────────────────────
    const areaOptions: any = {
        chart: { type: 'area', height: 300, toolbar: { show: false } },
        dataLabels: { enabled: false },
        stroke: { curve: 'smooth', width: 2 },
        colors: ["#727cf5", "#0acf97"],
        fill: {
            type: 'gradient',
            gradient: {
                shadeIntensity: 1,
                opacityFrom: 0.45,
                opacityTo: 0.05,
                stops: [20, 100]
            }
        },
        xaxis: {
            categories: stats?.evolutionMensuelle?.map(m => m.mois) || [],
            axisBorder: { show: false },
            axisTicks: { show: false }
        },
        yaxis: { labels: { formatter: (val: any) => val.toFixed(0) + ' TND' } },
        grid: { borderColor: '#f1f3fa', padding: { bottom: 10 } },
        tooltip: { theme: 'light' }
    }
    const areaSeries = [
        { name: 'Coût (TND)', data: stats?.evolutionMensuelle?.map(m => m.coutTotal) || [] },
        { name: 'Volume (L)', data: stats?.evolutionMensuelle?.map(m => m.litresTotaux) || [] }
    ]

    // ─── Column Chart (Top 5 Vehicles) ───────────────────────
    const columnOptions: any = {
        chart: { type: 'bar', height: 300, toolbar: { show: false } },
        plotOptions: {
            bar: {
                horizontal: false,
                columnWidth: '45%',
                borderRadius: 4,
                distributed: true
            }
        },
        dataLabels: { enabled: false },
        colors: ['#727cf5', '#0acf97', '#fa5c7c', '#ffbc00', '#39afd1'],
        xaxis: {
            categories: stats?.topVehiculesParCout?.map(v => v.vehiculeImmatriculation) || [],
            axisBorder: { show: false },
            axisTicks: { show: false }
        },
        legend: { show: false },
        grid: { borderColor: '#f1f3fa' },
        tooltip: { theme: 'light', y: { formatter: (val: any) => val.toLocaleString() + ' TND' } }
    }
    const columnSeries = [{
        name: 'Coût Total',
        data: stats?.topVehiculesParCout?.map(v => v.coutTotal) || []
    }]

    // ─── Répartition par TYPE de carburant (dérivée des records filtrés) ──────
    const repartitionType = useMemo(() => {
        const m = new Map<string, number>()
        recordsFiltres.forEach(r => m.set(r.typeCarburant, (m.get(r.typeCarburant) ?? 0) + r.montantTotal))
        return [...m.entries()].sort((a, b) => b[1] - a[1])
    }, [recordsFiltres])

    const typeChartOptions: any = {
        chart: { type: 'donut' },
        labels: repartitionType.map(([t]) => t),
        colors: ["#727cf5", "#0acf97", "#fa5c7c", "#ffbc00", "#39afd1", "#313a46"],
        legend: { position: 'bottom', fontSize: '12px', markers: { radius: 12 } },
        plotOptions: { pie: { donut: { size: '68%' } } },
        dataLabels: { enabled: true, formatter: (val: number) => val.toFixed(0) + '%' },
        stroke: { width: 2, colors: ['#fff'] },
        tooltip: { theme: 'light', y: { formatter: (val: any) => val.toLocaleString() + ' TND' } },
    }
    const typeChartSeries = repartitionType.map(([, v]) => v)

    return (
        <>
            <PageBreadcrumb title="Consommation Carburant" subName="Opérations" />

            {/* ── Barre de filtres / actions ──────────────────────────── */}
            <Card className="border-0 shadow-sm mb-3">
                <Card.Body className="py-3">
                    <div className="d-flex justify-content-between align-items-start flex-wrap gap-2 mb-3">
                        <div>
                            <h4 className="mb-0 fw-bold text-dark d-flex align-items-center gap-2">
                                <IconifyIcon icon="ri:gas-station-fill" className="text-primary" />
                                Analytique Carburant de la Flotte
                            </h4>
                            <p className="text-muted fs-13 mb-0">
                                Suivi des consommations, coûts et performance énergétique du parc
                            </p>
                        </div>
                        <div className="d-flex gap-2 flex-wrap">
                            <Dropdown>
                                <Dropdown.Toggle variant="outline-secondary" size="sm" disabled={exportRows.length === 0}>
                                    <IconifyIcon icon="ri:download-2-line" className="me-1" /> Exporter
                                </Dropdown.Toggle>
                                <Dropdown.Menu align="end">
                                    <Dropdown.Item onClick={() => exportCsv(exportRows)}>
                                        <IconifyIcon icon="ri:file-excel-2-line" className="me-2 text-success" /> CSV (Excel)
                                    </Dropdown.Item>
                                    <Dropdown.Item onClick={() => exportPdf(exportRows)}>
                                        <IconifyIcon icon="ri:file-pdf-2-line" className="me-2 text-danger" /> PDF (impression)
                                    </Dropdown.Item>
                                </Dropdown.Menu>
                            </Dropdown>
                            <Button variant="primary" size="sm" onClick={() => setShowModal(true)}>
                                <IconifyIcon icon="ri:add-line" className="me-1" /> Nouveau plein
                            </Button>
                        </div>
                    </div>

                    <Row className="g-2 align-items-end">
                        <Col md={3} sm={6}>
                            <Form.Label className="fs-12 text-muted mb-1">Véhicule</Form.Label>
                            <Form.Select size="sm" value={fltVehicule} onChange={e => setFltVehicule(e.target.value ? Number(e.target.value) : '')}>
                                <option value="">Tous les véhicules</option>
                                {vehicules?.map(v => <option key={v.idVehicule} value={v.idVehicule}>{v.immatriculation} — {v.marque} {v.modele}</option>)}
                            </Form.Select>
                        </Col>
                        <Col md={2} sm={6}>
                            <Form.Label className="fs-12 text-muted mb-1">Type</Form.Label>
                            <Form.Select size="sm" value={fltType} onChange={e => setFltType(e.target.value)}>
                                <option value="">Tous</option>
                                <option value="Diesel">Diesel</option>
                                <option value="Essence">Essence</option>
                                <option value="Sans Plomb">Sans Plomb</option>
                                <option value="GPL">GPL</option>
                                <option value="Electrique">Électrique</option>
                            </Form.Select>
                        </Col>
                        <Col md={2} sm={6}>
                            <Form.Label className="fs-12 text-muted mb-1">Du</Form.Label>
                            <Form.Control size="sm" type="date" value={fltStart} onChange={e => setFltStart(e.target.value)} />
                        </Col>
                        <Col md={2} sm={6}>
                            <Form.Label className="fs-12 text-muted mb-1">Au</Form.Label>
                            <Form.Control size="sm" type="date" value={fltEnd} onChange={e => setFltEnd(e.target.value)} />
                        </Col>
                        <Col md={3} sm={12}>
                            <Form.Label className="fs-12 text-muted mb-1">Recherche</Form.Label>
                            <InputGroup size="sm">
                                <InputGroup.Text className="bg-white"><IconifyIcon icon="ri:search-line" /></InputGroup.Text>
                                <Form.Control placeholder="Immat., source, type…" value={search} onChange={e => setSearch(e.target.value)} />
                                {filtresActifs && (
                                    <Button variant="outline-secondary" onClick={resetFiltres} title="Réinitialiser">
                                        <IconifyIcon icon="ri:close-line" />
                                    </Button>
                                )}
                            </InputGroup>
                        </Col>
                    </Row>
                </Card.Body>
            </Card>

            {/* ── KPI Row ─────────────────────────────────────────── */}
            <Row className="g-3 mb-4">
                {/* Carte jauge : consommation moyenne */}
                <Col xl={3} md={6}>
                    <Card className="h-100 border-0 shadow-sm overflow-hidden">
                        <Card.Body className="pb-0">
                            <p className="text-muted mb-1 fs-13">Consommation moyenne</p>
                            <h4 className="mb-0 fw-bold text-primary">
                                {stats?.consommationMoyenne?.toFixed(2) || '0.00'} <small className="fs-12 text-muted">L/100km</small>
                            </h4>
                        </Card.Body>
                        <div style={{ marginTop: '-40px' }}>
                            <ReactApexChart options={radialBarOptions} series={radialBarSeries} type="radialBar" height={180} />
                        </div>
                    </Card>
                </Col>

                {/* Cartes KPI compactes */}
                <Col xl={9}>
                    <Row className="g-3 h-100">
                        {[
                            { label: 'Coût total',       value: (stats?.coutTotal ?? 0).toLocaleString(),      unit: 'TND',    icon: 'ri:money-dollar-circle-line', color: 'danger'  },
                            { label: 'Volume total',     value: (stats?.litresTotaux ?? 0).toLocaleString(),   unit: 'Litres', icon: 'ri:drop-line',                color: 'success' },
                            { label: 'Distance totale',  value: (stats?.kilometrageTotal ?? 0).toLocaleString(), unit: 'km',   icon: 'ri:road-map-line',            color: 'info'    },
                            { label: 'Nombre de pleins', value: (stats?.nombrePleins ?? 0).toLocaleString(),   unit: 'pleins', icon: 'ri:gas-station-line',         color: 'primary' },
                            { label: 'Prix moyen / L',   value: prixMoyenL.toFixed(3),                          unit: 'TND/L',  icon: 'ri:price-tag-3-line',         color: 'warning' },
                            { label: 'Top consommateur', value: topVehicule?.vehiculeImmatriculation ?? '—',    unit: topVehicule ? `${topVehicule.coutTotal.toLocaleString()} TND` : '', icon: 'ri:car-fill', color: 'secondary' },
                        ].map((k, i) => (
                            <Col md={4} sm={6} key={i}>
                                <Card className="h-100 border-0 shadow-sm">
                                    <Card.Body>
                                        <div className="d-flex justify-content-between align-items-start">
                                            <div className="overflow-hidden">
                                                <p className="text-muted mb-1 fs-13 text-truncate">{k.label}</p>
                                                <h5 className={`mb-0 fw-bold text-${k.color} text-truncate`}>
                                                    {k.value} {k.unit && <small className="fs-12 text-muted fw-normal">{k.unit}</small>}
                                                </h5>
                                            </div>
                                            <div className={`avatar-sm bg-soft-${k.color} rounded-circle d-flex align-items-center justify-content-center flex-shrink-0`}>
                                                <IconifyIcon icon={k.icon} className={`fs-22 text-${k.color}`} />
                                            </div>
                                        </div>
                                    </Card.Body>
                                </Card>
                            </Col>
                        ))}
                    </Row>
                </Col>
            </Row>

            {/* ── Visual Analytics Row ─────────────────────────────────── */}
            <Row className="g-4 mb-4">
                <Col lg={7}>
                    <Card className="shadow-sm border-0 h-100">
                        <Card.Header className="bg-transparent border-0 py-3">
                            <h5 className="mb-0 fw-bold text-dark">Tendance de Consommation</h5>
                            <p className="text-muted fs-12 mb-0">Évolution mensuelle des coûts et volumes</p>
                        </Card.Header>
                        <Card.Body>
                            <ReactApexChart options={areaOptions} series={areaSeries} type="area" height={300} />
                        </Card.Body>
                    </Card>
                </Col>
                <Col lg={5}>
                    <Card className="shadow-sm border-0 h-100">
                        <Card.Header className="bg-transparent border-0 py-3">
                            <h5 className="mb-0 fw-bold text-dark">Top 5 Véhicules par Coût</h5>
                            <p className="text-muted fs-12 mb-0">Dépenses totales par immatriculation</p>
                        </Card.Header>
                        <Card.Body>
                            <ReactApexChart options={columnOptions} series={columnSeries} type="bar" height={300} />
                        </Card.Body>
                    </Card>
                </Col>
            </Row>

            <Row className="g-4">
                {/* ── Records Table ───────────────────────────────────── */}
                <Col lg={8}>
                    <Card className="shadow-sm border-0">
                        <Card.Header className="bg-white py-3 d-flex justify-content-between align-items-center border-bottom-0">
                            <h5 className="mb-0 fw-bold text-dark">Historique des pleins</h5>
                            <div className="d-flex gap-2 flex-wrap">
                                <BulkDeleteButtons
                                    selectedCount={sel.count} totalCount={records?.length ?? 0}
                                    label="plein(s)" deleting={deleting}
                                    onDeleteSelected={() => deleteMany(sel.selectedIds)}
                                    onDeleteAll={() => deleteMany((records ?? []).map(r => r.idCarburant))}
                                />
                                <Button variant="primary" size="sm" className="rounded-pill px-3 shadow-sm" onClick={() => setShowModal(true)}>
                                    <IconifyIcon icon="ri:add-line" className="me-1" /> Nouveau plein
                                </Button>
                            </div>
                        </Card.Header>
                        <Card.Body className="p-0">
                            {loading ? <div className="p-5 text-center"><Spinner animation="border" variant="primary" /></div> : (
                                <Table hover responsive className="mb-0 align-middle">
                                    <thead className="bg-light text-muted small text-uppercase">
                                        <tr>
                                            <th style={{ width: 34 }}>
                                                <input type="checkbox" className="form-check-input"
                                                    checked={sel.allSelected} onChange={sel.toggleAll}
                                                    title="Tout sélectionner" />
                                            </th>
                                            <th className="ps-3">Date</th>
                                            <th>Véhicule</th>
                                            <th>Quantité</th>
                                            <th>Total</th>
                                            <th>km</th>
                                            <th>Source</th>
                                            <th className="text-end pe-3">Action</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {records?.map(r => (
                                            <tr key={r.idCarburant}>
                                                <td>
                                                    <input type="checkbox" className="form-check-input"
                                                        checked={sel.isSelected(r.idCarburant)}
                                                        onChange={() => sel.toggle(r.idCarburant)} />
                                                </td>
                                                <td className="ps-3">{new Date(r.dateRemplissage).toLocaleDateString()}</td>
                                                <td>
                                                    <div className="d-flex align-items-center">
                                                        <div className="avatar-xs bg-soft-primary rounded-circle d-flex align-items-center justify-content-center me-2">
                                                            <IconifyIcon icon="ri:car-fill" className="text-primary" />
                                                        </div>
                                                        <strong>{r.vehiculeImmatriculation}</strong>
                                                    </div>
                                                </td>
                                                <td>{r.quantite} <small className="text-muted">L</small></td>
                                                <td className="fw-bold text-dark">{r.montantTotal.toFixed(2)} <small className="fw-normal text-muted">TND</small></td>
                                                <td>{r.kilometrage?.toLocaleString()}</td>
                                                <td>
                                                    {r.sourceNom ? (
                                                        <Badge bg="soft-primary" text="primary" className="fw-normal border border-primary-subtle">
                                                            {r.sourceNom}
                                                        </Badge>
                                                    ) : <span className="text-muted small italic">Station externe</span>}
                                                </td>
                                                <td className="text-end pe-3">
                                                    <Button variant="link" size="sm" className="text-danger p-0" title="Supprimer" onClick={() => handleDelete(r.idCarburant)}>
                                                        <IconifyIcon icon="ri:delete-bin-7-line" className="fs-18" />
                                                    </Button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </Table>
                            )}
                        </Card.Body>
                    </Card>
                </Col>

                {/* ── Sidebar Stats ───────────────────────────────────── */}
                <Col lg={4}>
                    <Card className="shadow-sm border-0 mb-4">
                        <Card.Header className="bg-white py-3 border-bottom-0">
                            <h5 className="mb-0 fw-bold text-dark">Répartition par Source</h5>
                        </Card.Header>
                        <Card.Body>
                            {stats?.repartitionParSource?.length ? (
                                <ReactApexChart options={chartOptions} series={chartSeries} type="donut" height={320} />
                            ) : <div className="text-center text-muted py-5"><IconifyIcon icon="ri:donut-chart-line" className="fs-48 mb-2 opacity-25" /><p>Pas de données sources</p></div>}
                        </Card.Body>
                    </Card>

                    <Card className="shadow-sm">
                        <Card.Header className="bg-white py-3">
                            <h5 className="mb-0 fw-semibold">Détails sources</h5>
                        </Card.Header>
                        <Card.Body className="p-0 text-center">
                            <Table size="sm" className="mb-0">
                                <thead className="table-light">
                                    <tr>
                                        <th>Source</th>
                                        <th>Coût</th>
                                        <th>Pleins</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {stats?.repartitionParSource?.map(s => (
                                        <tr key={s.nomSource}>
                                            <td className="text-start ps-3">{s.nomSource}</td>
                                            <td className="fw-semibold">{s.coutTotal.toFixed(0)} <small>TND</small></td>
                                            <td>{s.nombrePleins}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </Table>
                        </Card.Body>
                    </Card>
                </Col>
            </Row>


            {/* ── Modal Add Record ───────────────────────────────────── */}
            <Modal show={showModal} onHide={() => setShowModal(false)} centered>
                <Modal.Header closeButton>
                    <Modal.Title>Enregistrer un plein</Modal.Title>
                </Modal.Header>
                <Form onSubmit={handleSubmit}>
                    <Modal.Body className="bg-light-subtle">
                        <Row className="g-3">
                            <Col md={12}>
                                <Form.Label className="fs-13">Source d'approvisionnement</Form.Label>
                                <Form.Select value={form.sourceId || ''} onChange={e => setForm({...form, sourceId: e.target.value ? parseInt(e.target.value) : undefined})}>
                                    <option value="">Hors source / Station externe</option>
                                    {sources?.map(s => <option key={s.idSource} value={s.idSource}>{s.nomSource} ({s.ville})</option>)}
                                </Form.Select>
                            </Col>

                            {/* OCR Upload Zone (Conditional) */}
                            {((!form.sourceId) || sources.find(s => s.idSource === form.sourceId)?.typeSource === 'STATION_EXTERNE' || sources.find(s => s.idSource === form.sourceId)?.typeSource === 'CARTE_CARBURANT') && (
                                <Col md={12} className="mt-4 mb-2">
                                    <OCRUploadZone 
                                        onLoading={setSaving} 
                                        onExtracted={(data: ExtractedOCRData) => {
                                            const updates: any = {};
                                            
                                            if (data.quantite) updates.quantite = parseFloat(String(data.quantite).replace(',', '.'));
                                            if (data.prixUnitaire) updates.prixUnitaire = parseFloat(String(data.prixUnitaire).replace(',', '.'));
                                            if (data.montantTotal) updates.montantTotal = parseFloat(String(data.montantTotal).replace(',', '.'));
                                            if (data.dateRemplissage) updates.dateRemplissage = data.dateRemplissage;
                                            
                                            if (data.immatriculation && vehicules.length > 0) {
                                                const cleanPlate = (p: string) => p.replace(/\s+/g, '').toLowerCase();
                                                const found = vehicules.find(v => cleanPlate(v.immatriculation) === cleanPlate(data.immatriculation!));
                                                if (found) {
                                                    updates.vehiculeId = found.idVehicule;
                                                    // Load vehicle latest info
                                                    handleVehiculeChange(found.idVehicule);
                                                }
                                            }

                                            setForm(prev => ({ ...prev, ...updates }));
                                        }} 
                                        title="Scan automatique du ticket de carburant"
                                        subtitle="Uploadez le ticket ou reçu pour remplir automatiquement le montant et la quantité"
                                        defaultType="TICKET_CARBURANT"
                                    />
                                </Col>
                            )}

                            <Col md={12}>
                                <div className={`p-3 rounded-3 border ${fetchingInfo ? 'bg-light' : 'bg-white'}`}>
                                    <Form.Label className="fw-semibold">Véhicule *</Form.Label>
                                    <div className="position-relative">
                                        <Form.Select 
                                            required 
                                            value={form.vehiculeId} 
                                            onChange={e => handleVehiculeChange(parseInt(e.target.value))}>
                                            <option value="">Sélectionner un véhicule...</option>
                                            {vehicules?.map(v => <option key={v.idVehicule} value={v.idVehicule}>{v.immatriculation} - {v.marque} {v.modele}</option>)}
                                        </Form.Select>
                                        {fetchingInfo && <Spinner animation="border" size="sm" className="position-absolute end-0 top-50 translate-middle-y me-4" />}
                                    </div>
                                    {latestInfo && (
                                        <div className="mt-2 d-flex align-items-center gap-2">
                                            <Badge bg="soft-info" text="info" className="fw-normal">
                                                <IconifyIcon icon="ri:steering-2-line" className="me-1" />
                                                Dernier relevé : {latestInfo.lastMileage.toLocaleString()} km
                                            </Badge>
                                            <Badge bg="soft-primary" text="primary" className="fw-normal">
                                                <IconifyIcon icon="ri:gas-station-line" className="me-1" />
                                                {latestInfo.typeCarburant}
                                            </Badge>
                                        </div>
                                    )}
                                </div>
                            </Col>
                            
                            <Col md={6}>
                                <Form.Label className="fs-13">Date *</Form.Label>
                                <Form.Control type="date" required value={form.dateRemplissage} onChange={e => setForm({...form, dateRemplissage: e.target.value})} />
                            </Col>
                            
                            <Col md={6}>
                                <Form.Label className="fs-13">Type Carburant</Form.Label>
                                <Form.Select 
                                    value={form.typeCarburant} 
                                    disabled={!!latestInfo}
                                    className={latestInfo ? 'bg-light' : ''}
                                    onChange={e => setForm({...form, typeCarburant: e.target.value})}>
                                    <option value="Diesel">Diesel</option>
                                    <option value="Essence">Essence</option>
                                    <option value="Sans Plomb">Sans Plomb</option>
                                    <option value="GPL">GPL</option>
                                    <option value="Electrique">Electrique</option>
                                </Form.Select>
                            </Col>

                            <Col md={4}>
                                <Form.Label className="fs-13 text-primary fw-medium">Quantité (L) *</Form.Label>
                                <Form.Control 
                                    type="number" step="0.01" required 
                                    value={form.quantite || ''} 
                                    onChange={e => handleCalculateTotal(parseFloat(e.target.value) || 0, form.prixUnitaire)} 
                                />
                            </Col>
                            <Col md={4}>
                                <Form.Label className="fs-13">Prix Unitaire *</Form.Label>
                                <Form.Control 
                                    type="number" step="0.001" required 
                                    value={form.prixUnitaire || ''} 
                                    onChange={e => handleCalculateTotal(form.quantite, parseFloat(e.target.value) || 0)} 
                                />
                            </Col>
                            <Col md={4}>
                                <Form.Label className="fs-13 text-success fw-medium">Total (TND) *</Form.Label>
                                <Form.Control 
                                    type="number" step="0.01" required 
                                    value={form.montantTotal || ''} 
                                    onChange={e => handleCalculateQty(parseFloat(e.target.value) || 0, form.prixUnitaire)} 
                                />
                            </Col>

                            <Col md={12}>
                                <Form.Label className="fs-13">Kilométrage actuel *</Form.Label>
                                <Form.Control 
                                    type="number" required 
                                    value={form.kilometrage || ''} 
                                    isInvalid={latestInfo && form.kilometrage > 0 && form.kilometrage < latestInfo.lastMileage}
                                    onChange={e => setForm({...form, kilometrage: parseFloat(e.target.value) || 0})} 
                                />
                                {latestInfo && (
                                    <Form.Text className={form.kilometrage > 0 && form.kilometrage < latestInfo.lastMileage ? 'text-danger' : 'text-muted'}>
                                        Doit être supérieur à {latestInfo.lastMileage.toLocaleString()} km
                                    </Form.Text>
                                )}
                            </Col>

                            {(!form.sourceId) && (
                                <Col md={12}>
                                    <Form.Label className="fs-13">Nom de la station</Form.Label>
                                    <Form.Control 
                                        placeholder="Ex: Shell, Total, OilLibya..."
                                        value={form.station ?? ''} 
                                        onChange={e => setForm({...form, station: e.target.value})} 
                                    />
                                </Col>
                            )}

                            {(!((!form.sourceId) || sources.find(s => s.idSource === form.sourceId)?.typeSource === 'STATION_EXTERNE' || sources.find(s => s.idSource === form.sourceId)?.typeSource === 'CARTE_CARBURANT')) && (
                                <Col md={12}>
                                    <Form.Label className="fs-13">Justificatif (Ticket/Reçu)</Form.Label>
                                    <div className="d-flex align-items-center gap-2 border rounded-3 p-2 bg-white">
                                        <IconifyIcon icon="ri:image-add-line" className="fs-20 text-muted ms-1" />
                                        <Form.Control 
                                            type="file" 
                                            className="border-0 bg-transparent shadow-none"
                                            onChange={() => setForm({...form, justificatifUrl: 'uploads/receipt_simulated.jpg'})} 
                                        />
                                    </div>
                                </Col>
                            )}
                        </Row>
                    </Modal.Body>
                    <Modal.Footer className="bg-light-subtle">
                        <Button variant="link" className="text-muted text-decoration-none" onClick={() => setShowModal(false)}>Annuler</Button>
                        <Button 
                            variant="primary" 
                            type="submit" 
                            disabled={saving || (latestInfo && form.kilometrage < latestInfo.lastMileage)}
                            className="px-4 shadow-sm"
                        >
                            {saving ? (
                                <><Spinner animation="border" size="sm" className="me-2" /> Traitement...</>
                            ) : (
                                <><IconifyIcon icon="ri:save-line" className="me-1" /> Enregistrer le plein</>
                            )}
                        </Button>
                    </Modal.Footer>
                </Form>
            </Modal>
        </>
    )
}
