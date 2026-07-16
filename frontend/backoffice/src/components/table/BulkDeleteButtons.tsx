import { Button } from 'react-bootstrap'
import IconifyIcon from '@/components/wrappers/IconifyIcon'
import Swal from 'sweetalert2'

/**
 * BulkDeleteButtons — boutons « Supprimer la sélection (n) » et « Tout supprimer »
 * partagés par toutes les listes du back office (même patron que /alertes).
 * Les confirmations SweetAlert sont intégrées ; le parent ne fournit que les
 * callbacks de suppression effective (généralement Promise.all sur le endpoint
 * DELETE unitaire existant du service concerné).
 */
interface BulkDeleteButtonsProps {
    /** Nombre d'éléments sélectionnés (0 = bouton sélection masqué) */
    selectedCount: number
    /** Nombre total d'éléments affichés (0 = bouton tout masqué) */
    totalCount: number
    /** Libellé métier au pluriel, ex. "véhicule(s)", "intervention(s)" */
    label: string
    deleting: boolean
    onDeleteSelected: () => Promise<void>
    onDeleteAll: () => Promise<void>
    /** Avertissement additionnel affiché dans la confirmation (optionnel) */
    warning?: string
}

export default function BulkDeleteButtons({
    selectedCount, totalCount, label, deleting, onDeleteSelected, onDeleteAll, warning,
}: BulkDeleteButtonsProps) {
    const confirmSelected = async () => {
        const res = await Swal.fire({
            title: `Supprimer ${selectedCount} ${label} ?`,
            text: warning || 'Cette action est irréversible.',
            icon: 'warning', showCancelButton: true,
            confirmButtonText: 'Supprimer la sélection', cancelButtonText: 'Annuler',
            confirmButtonColor: '#dc3545',
        })
        if (res.isConfirmed) await onDeleteSelected()
    }

    const confirmAll = async () => {
        const res = await Swal.fire({
            title: 'Tout supprimer ?',
            text: `${totalCount} ${label} affiché(s) seront définitivement supprimé(s). ${warning || ''}`.trim(),
            icon: 'warning', showCancelButton: true,
            confirmButtonText: 'Tout supprimer', cancelButtonText: 'Annuler',
            confirmButtonColor: '#dc3545',
        })
        if (res.isConfirmed) await onDeleteAll()
    }

    return (
        <>
            {selectedCount > 0 && (
                <Button variant="danger" size="sm" onClick={confirmSelected} disabled={deleting}
                    className="d-flex align-items-center gap-1">
                    <IconifyIcon icon="ri:delete-bin-line" />
                    Supprimer la sélection ({selectedCount})
                </Button>
            )}
            {totalCount > 0 && (
                <Button variant="outline-danger" size="sm" onClick={confirmAll} disabled={deleting}
                    className="d-flex align-items-center gap-1">
                    <IconifyIcon icon="ri:delete-bin-6-line" />
                    Tout supprimer
                </Button>
            )}
        </>
    )
}
