import React, { useEffect } from 'react'
import { Modal, ModalHeader, ModalBody, ModalTitle, Button, Form, Row, Col } from 'react-bootstrap'
import { useForm } from 'react-hook-form'
import { yupResolver } from '@hookform/resolvers/yup'
import * as yup from 'yup'
import { useKanbanContext } from '@/context/useKanbanContext'
import TextFormInput from '@/components/form/TextFormInput'
import SelectFormInput from '@/components/form/SelectFormInput'
import TextAreaFormInput from '@/components/form/TextAreaFormInput'
import IconifyIcon from '@/components/wrappers/IconifyIcon'

const KanbanModal = () => {
  const { 
    showModal, closeModal, selectedCard, saveCard, 
    technicianList, vehiculeList 
  } = useKanbanContext()

  const schema = yup.object({
    titre:        yup.string().required('Titre requis'),
    description:  yup.string().optional(),
    priorite:     yup.string().required('Priorité requise'),
    technicienId: yup.string().nullable(),
    vehiculeId:   yup.string().required('Véhicule requis'),
    dateEcheance: yup.string().nullable(),
  })

  type FormData = yup.InferType<typeof schema>

  const { handleSubmit, control, reset, setValue } = useForm<FormData>({
    // @ts-ignore
    resolver: yupResolver(schema),
    defaultValues: {
      titre:        '',
      description:  '',
      priorite:     'NORMALE',
      technicienId: null,
      vehiculeId:   '',
      dateEcheance: '',
    }
  })

  useEffect(() => {
    if (showModal) {
      if (selectedCard) {
        setValue('titre',        selectedCard.titre)
        setValue('description',  selectedCard.description || '')
        setValue('priorite',     selectedCard.priorite)
        setValue('dateEcheance', selectedCard.dateEcheance ? selectedCard.dateEcheance.split('T')[0] : '')
        // Selection des IDs (le backend renvoie des strings ou numbers, on normalise)
        // Note: selectedCard.technicien dans le DTO est le nom, on a besoin de l'ID pour l'edit parfait
        // Pour l'instant on reset ou on garde si on a l'info
      } else {
        reset({
          titre:        '',
          description:  '',
          priorite:     'NORMALE',
          technicienId: null,
          vehiculeId:   '',
          dateEcheance: '',
        })
      }
    }
  }, [selectedCard, reset, setValue, showModal])

  const onSubmit = async (data: FormData) => {
    await saveCard(data as any)
  }

  const techOptions = technicianList.map(t => ({ value: t.idUtilisateur.toString(), label: t.nomComplet }))
  const vehiculeOptions = vehiculeList.map(v => ({ value: v.idVehicule.toString(), label: v.affichage }))

  return (
    <Modal show={showModal} onHide={closeModal} centered size="lg" className="bg-glass">
      <ModalHeader closeButton className="border-0 pb-0">
        <ModalTitle className="fw-bold">
          <IconifyIcon icon={selectedCard ? "tabler:edit" : "tabler:plus"} className="me-2 text-primary" />
          {selectedCard ? `Modifier ${selectedCard.reference}` : 'Créer un Ordre de Travail'}
        </ModalTitle>
      </ModalHeader>
      <ModalBody>
        <Form onSubmit={handleSubmit(onSubmit)} className="p-2">
          <Row>
            <Col md={12}>
              <TextFormInput
                name="titre"
                label="Titre de la tâche"
                control={control}
                containerClassName="mb-3"
                placeholder="Ex: Vidange Compresseur C1"
              />
            </Col>
            <Col md={12}>
              <TextAreaFormInput
                name="description"
                label="Description détaillée"
                control={control}
                containerClassName="mb-3"
                rows={3}
                placeholder="Détails de l'intervention à effectuer..."
              />
            </Col>
            <Col md={6}>
              <SelectFormInput
                name="vehiculeId"
                label="Véhicule / Équipement"
                control={control}
                containerClassName="mb-3"
                options={vehiculeOptions}
                placeholder="Sélectionner un véhicule"
              />
            </Col>
            <Col md={6}>
              <SelectFormInput
                name="technicienId"
                label="Assigner à (Technicien)"
                control={control}
                containerClassName="mb-3"
                options={techOptions}
                placeholder="Choisir un technicien"
                isClearable
              />
            </Col>
            <Col md={6}>
              <SelectFormInput
                name="priorite"
                label="Niveau de Priorité"
                control={control}
                containerClassName="mb-3"
                options={[
                  { value: 'BASSE',    label: '🟢 Basse' },
                  { value: 'NORMALE',  label: '🔵 Normale' },
                  { value: 'HAUTE',    label: '🟠 Haute' },
                  { value: 'CRITIQUE', label: '🔴 Critique' },
                ]}
              />
            </Col>
            <Col md={6}>
              <TextFormInput
                name="dateEcheance"
                label="Date d'échéance"
                type="date"
                control={control}
                containerClassName="mb-3"
              />
            </Col>
          </Row>

          <div className="d-flex justify-content-end gap-2 mt-4 pt-3 border-top">
            <Button variant="light" onClick={closeModal} className="px-4">
              Annuler
            </Button>
            <Button variant="primary" type="submit" className="px-4 shadow-sm">
              <IconifyIcon icon="tabler:device-floppy" className="me-1" />
              {selectedCard ? 'Mettre à jour' : 'Lancer l\'OT'}
            </Button>
          </div>
        </Form>
      </ModalBody>
    </Modal>
  )
}

export default KanbanModal
