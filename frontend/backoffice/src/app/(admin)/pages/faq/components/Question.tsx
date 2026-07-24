import TextAreaFormInput from '@/components/form/TextAreaFormInput'
import TextFormInput from '@/components/form/TextFormInput'
import { yupResolver } from '@hookform/resolvers/yup'
import { Button } from 'react-bootstrap'
import { useForm } from 'react-hook-form'
import * as yup from 'yup'
import Swal from 'sweetalert2'

/** Formulaire de contact de la FAQ (validation FR, prêt à brancher un endpoint). */
const Question = () => {
  const questionSchema = yup.object({
    name:     yup.string().required('Veuillez saisir votre nom'),
    email:    yup.string().email('E-mail invalide').required('Veuillez saisir votre e-mail'),
    number:   yup.string().required('Veuillez saisir votre numéro'),
    question: yup.string().required('Veuillez saisir votre question'),
  })

  const { handleSubmit, control, reset } = useForm({ resolver: yupResolver(questionSchema) })

  const onSubmit = () => {
    // À brancher : POST vers le module Support / une boîte de contact.
    Swal.fire({ icon: 'success', title: 'Question envoyée', text: 'Notre équipe vous répondra rapidement.', timer: 2000, showConfirmButton: false })
    reset()
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <div className="mb-2">
        <TextFormInput control={control} name="name" placeholder="Nom complet" label="Votre nom" />
      </div>
      <div className="mb-2">
        <TextFormInput control={control} name="email" placeholder="Email" label="E-mail" />
      </div>
      <div className="mb-2">
        <TextFormInput control={control} name="number" placeholder="Numéro" label="Téléphone" />
      </div>
      <div>
        <TextAreaFormInput control={control} name="question" type="text" label="Votre question"
          className="form-control" id="faq-question-textarea" rows={3} placeholder="Votre message" />
      </div>
      <div className="mt-2">
        <Button variant="primary" type="submit" className="w-100">Envoyer</Button>
      </div>
    </form>
  )
}

export default Question
