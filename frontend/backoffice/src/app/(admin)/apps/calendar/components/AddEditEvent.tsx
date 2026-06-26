
import { useEffect } from 'react'
import { yupResolver } from '@hookform/resolvers/yup'
import { Button, Col, Modal, ModalBody, ModalHeader, ModalTitle, Row } from 'react-bootstrap'
import { useForm } from 'react-hook-form'
import * as yup from 'yup'

import type { CalendarFormType } from '@/types/component-props'
import type { SubmitEventType } from '../useCalendar'
import TextFormInput from '@/components/form/TextFormInput'
import SelectFormInput from '@/components/form/SelectFormInput'

const AddEditEvent = ({ eventData, isEditable, onAddEvent, onRemoveEvent, onUpdateEvent, open, toggle }: CalendarFormType) => {
  const eventFormSchema = yup.object({
    title: yup.string().required('Please enter event title'),
    category: yup.string().required('Please select event category'),
    isExternal: yup.boolean().default(false),
  })

  type FormValues = yup.InferType<typeof eventFormSchema>

  const { handleSubmit, control, setValue, reset, watch } = useForm<FormValues>({
    resolver: yupResolver(eventFormSchema),
    defaultValues: {
      title: eventData?.title ?? '',
      category: eventData?.className ? String(eventData.className) : 'bg-danger',
      isExternal: false,
    },
  })

  const isExternalValue = watch('isExternal')

  useEffect(() => {
    if (eventData?.title) {
      setValue('title', String(eventData?.title))
      setValue('category', String(eventData?.className))
    }
  }, [eventData,])

  useEffect(() => {
    if (!open) reset()
  }, [open])

  const onSubmitEvent = (data: FormValues) => {
    isEditable ? onUpdateEvent(data as any) : onAddEvent(data as any)
  }

  return (
    <Modal show={open} onHide={toggle} className="fade" tabIndex={-1}>
      <div className="modal-content">
        <form onSubmit={handleSubmit(onSubmitEvent)} className="needs-validation" name="event-form">
          <ModalHeader className="modal-header p-3 border-bottom-0" closeButton>
            <ModalTitle className="modal-title" as="h5">
              {isEditable ? 'Modifier l\'événement' : 'Nouvel événement'}
            </ModalTitle>
          </ModalHeader>
          <ModalBody className="px-3 pb-3 pt-0">
            <Row>
              <Col xs={12}>
                <TextFormInput control={control} name="title" containerClassName="mb-3" label="Nom de l'événement" placeholder="Insérer le nom" />
              </Col>
              <Col xs={12}>
                <SelectFormInput
                  control={control}
                  name="category"
                  label="Catégorie / Couleur"
                  containerClassName="mb-1"
                  options={[
                    { value: 'bg-primary', label: 'Bleur' },
                    { value: 'bg-secondary', label: 'Gris' },
                    { value: 'bg-success', label: 'Vert (Intervention)' },
                    { value: 'bg-info', label: 'Cyan (OT)' },
                    { value: 'bg-warning', label: 'Jaune (Mission)' },
                    { value: 'bg-danger', label: 'Rouge (Urgent)' },
                    { value: 'bg-dark', label: 'Sombre' },
                  ]}
                />
              </Col>
              {!isEditable && (
                  <Col xs={12}>
                    <div className="form-check mb-3 mt-2">
                        <input 
                            type="checkbox" 
                            className="form-check-input" 
                            id="isExternal" 
                            checked={isExternalValue}
                            onChange={(e) => setValue('isExternal', e.target.checked)}
                        />
                        <label className="form-check-label text-muted" htmlFor="isExternal">
                            Ajouter à la liste des tâches (Sidebar) au lieu du calendrier
                        </label>
                    </div>
                  </Col>
              )}
            </Row>
            <Row className="mt-2">
              <Col xs={6}>
                {isEditable && (
                  <button onClick={onRemoveEvent} type="button" className="btn btn-danger">
                    Supprimer
                  </button>
                )}
              </Col>
              <Col xs={6} className="text-end">
                <Button variant="light" type="button" className="me-1" onClick={toggle}>
                  Annuler
                </Button>
                <Button variant="primary" type="submit">
                  Enregistrer
                </Button>
              </Col>
            </Row>
          </ModalBody>
        </form>
      </div>
    </Modal>
  )
}

export default AddEditEvent
