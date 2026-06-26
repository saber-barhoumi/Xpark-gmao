
import React, { useRef, useState } from "react";
import { Button, Card, Col, Form, ProgressBar, Row } from "react-bootstrap";

import { useForm } from "react-hook-form";
import StepWizard from 'react-step-wizard';

import { Controller } from 'react-hook-form';

import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";


type StepWizardInstance = {
  nextStep: () => void;
  previousStep: () => void;
  goToStep: (step: number) => void;
};

const WizardButtons = ({ onPrev, onNext, activeStep, totalSteps, onFinish, goToFirstStep }: any) => (
  <div className="d-flex wizard justify-content-between flex-wrap gap-2 mt-3">
    <div className="first">
      <Button href="javascript:void(0);" onClick={goToFirstStep} disabled={activeStep === 1} className="btn btn-primary">
        First
      </Button>
    </div>
    <div className="d-flex flex-wrap gap-2">
      <div className="previous">
        <Button href="javascript:void(0);" onClick={onPrev} disabled={activeStep === 1} className="btn btn-primary">
          <i className="bx bx-left-arrow-alt me-2" /> Back To Previous
        </Button>
      </div>
      <div className="next">
        <Button href="javascript:void(0);" onClick={onNext} disabled={activeStep === totalSteps} className="btn btn-primary mt-3 mt-md-0">
          Next Step <i className="bx bx-right-arrow-alt ms-2" />
        </Button>
      </div>
    </div>
    <div className="last">
      <Button href="javascript:void(0);" onClick={onFinish} disabled={activeStep === totalSteps} className="btn btn-primary mt-3 mt-md-0">
        Finish
      </Button>
    </div>
  </div>
);

const BasicWizard = () => {
  const wizardRef = useRef<StepWizardInstance | null>(null);
  const { register, handleSubmit, formState: { errors } } = useForm();
  const [activeStep, setActiveStep] = useState(1);

  const nextStep = () => {
    if (wizardRef.current) {
      wizardRef.current.nextStep();
      setActiveStep((prev) => prev + 1);
    }
  };

  const prevStep = () => {
    if (wizardRef.current) {
      wizardRef.current.previousStep();
      setActiveStep((prev) => prev - 1);
    }
  };

  const goToStep = (stepIndex: any) => {
    if (wizardRef.current) {
      wizardRef.current.goToStep(stepIndex);
      setActiveStep(stepIndex);
    }
  };

  const finishStep = () => {
    if (wizardRef.current) {
      wizardRef.current.goToStep(steps.length);
      setActiveStep(steps.length);
    }
  };

  const onSubmit = (data: any) => {
    console.log(data);
  };

  const steps = ['Account', 'Profile', 'Finish'];

  return (
    <Card>
      <Card.Body className="overflow-hidden">
        <h4 className="header-title mb-3">Basic Wizard</h4>

        <ul className="nav nav-pills nav-justified form-wizard-header mb-3">
          {steps.map((step, idx) => (
            <li key={idx} className="nav-item">
              <Button
                className={`nav-link rounded-0 py-2 ${activeStep === idx + 1 ? 'active' : ''}`}
                onClick={() => goToStep(idx + 1)}
              >
                <i className="bi bi-person-circle fs-18 align-middle me-1" />
                <span className="d-none d-sm-inline">{step}</span>
              </Button>
            </li>
          ))}
        </ul>

        <StepWizard
          instance={(wizard: any) => {
            wizardRef.current = wizard;
          }}
          onStepChange={(stats: any) => setActiveStep(stats.activeStep)}
        >
          <div>
            <Form onSubmit={handleSubmit(onSubmit)}>
              <Form.Group as={Row} className="mb-3">
                <Form.Label htmlFor="email" column md={3}>Email</Form.Label>
                <Col md={9}>
                  <Form.Control
                    type="email"
                    id="email"
                    placeholder="Enter email"
                    {...register('email', { required: 'Email is required' })}
                    isInvalid={!!errors.email}
                  />
                  <Form.Control.Feedback type="invalid">
                    <>{errors?.email?.message}</>
                  </Form.Control.Feedback>
                </Col>
              </Form.Group>

              <Form.Group as={Row} className="mb-3">
                <Form.Label htmlFor="password" column md={3}>Password</Form.Label>
                <Col md={9}>
                  <Form.Control
                    type="password"
                    id="password"
                    placeholder="Password"
                    {...register('password', { required: 'Password is required' })}
                    isInvalid={!!errors.password}
                  />
                  <Form.Control.Feedback type="invalid">
                    <>{errors.password?.message}</>
                  </Form.Control.Feedback>
                </Col>
              </Form.Group>

              <Form.Group as={Row} className="mb-3">
                <Form.Label htmlFor="confirmPassword" column md={3}>Re-Password</Form.Label>
                <Col md={9}>
                  <Form.Control
                    type="password"
                    id="confirmPassword"
                    placeholder="Confirm Password"
                    {...register('confirmPassword', { required: 'Confirm password is required' })}
                    isInvalid={!!errors.confirmPassword}
                  />
                  <Form.Control.Feedback type="invalid">
                    <> {errors.confirmPassword?.message}</>
                  </Form.Control.Feedback>
                </Col>
              </Form.Group>

              <WizardButtons
                onPrev={prevStep}
                onNext={nextStep}
                activeStep={activeStep}
                totalSteps={steps.length}
                onFinish={finishStep}
                goToFirstStep={() => goToStep(1)}
              />
            </Form>
          </div>

          <div>
            <Form onSubmit={handleSubmit(onSubmit)}>
              <Form.Group as={Row} className="mb-3">
                <Form.Label htmlFor="fname" column md={3}>First Name</Form.Label>
                <Col md={9}>
                  <Form.Control
                    type="text"
                    id="fname"
                    placeholder="Enter first name"
                    {...register('fname', { required: 'First name is required' })}
                    isInvalid={!!errors.fname}
                  />
                  <Form.Control.Feedback type="invalid">
                    <> {errors.fname?.message}</>
                  </Form.Control.Feedback>
                </Col>
              </Form.Group>

              <Form.Group as={Row} className="mb-3">
                <Form.Label htmlFor="lname" column md={3}>Last Name</Form.Label>
                <Col md={9}>
                  <Form.Control
                    type="text"
                    id="lname"
                    placeholder="Enter last name"
                    {...register('lname', { required: 'Last name is required' })}
                    isInvalid={!!errors.lname}
                  />
                  <Form.Control.Feedback type="invalid">
                    <> {errors.lname?.message}</>
                  </Form.Control.Feedback>
                </Col>
              </Form.Group>

              <Form.Group as={Row} className="mb-3">
                <Form.Label htmlFor="phone" column md={3}>Phone Number</Form.Label>
                <Col md={9}>
                  <Form.Control
                    type="text"
                    id="phone"
                    placeholder="Enter phone number"
                    {...register('phone', { required: 'Phone number is required' })}
                    isInvalid={!!errors.phone}
                  />
                  <Form.Control.Feedback type="invalid">
                    <>  {errors.phone?.message}</>
                  </Form.Control.Feedback>
                </Col>
              </Form.Group>

              <WizardButtons
                onPrev={prevStep}
                onNext={nextStep}
                activeStep={activeStep}
                totalSteps={steps.length}
                onFinish={finishStep}
                goToFirstStep={() => goToStep(1)}
              />
            </Form>
          </div>

          <div>
            <Row>
              <Col sm={12}>
                <div className="text-center">
                  <h2 className="mt-0">
                    <i className="mdi mdi-check-all"></i>
                  </h2>
                  <h3 className="mt-0">Thank you!</h3>

                  <p className="w-75 mb-2 mx-auto">
                    Quisque nec turpis at urna dictum luctus. Suspendisse convallis dignissim eros at volutpat. In egestas mattis dui.
                  </p>

                  <div className="mb-3">
                    <Form.Check type="checkbox" className="d-inline-block">
                      <Form.Check.Input type="checkbox" {...register('terms', { required: 'You must agree to the terms and conditions' })} />
                      <Form.Check.Label>
                        I agree with the Terms and Conditions
                      </Form.Check.Label>
                    </Form.Check>
                    {errors.terms && <div className="text-danger"><> {errors.terms.message}</></div>}
                  </div>
                </div>
              </Col>

              <Col sm={12}>
                <WizardButtons
                  onPrev={prevStep}
                  onNext={nextStep}
                  activeStep={activeStep}
                  totalSteps={steps.length}
                  onFinish={finishStep}
                  goToFirstStep={() => goToStep(1)}
                />
              </Col>
            </Row>
          </div>
        </StepWizard>
      </Card.Body>
    </Card>
  );
};


const WizardWithProgressbar = () => {

  const wizardRef = useRef<StepWizardInstance | null>(null);
  const { register, handleSubmit, formState: { errors } } = useForm();
  const [activeStep, setActiveStep] = useState(1);

  const nextStep = () => {
    if (wizardRef.current) {
      wizardRef.current.nextStep();
      setActiveStep((prev) => prev + 1);
    }
  };

  const prevStep = () => {
    if (wizardRef.current) {
      wizardRef.current.previousStep();
      setActiveStep((prev) => prev - 1);
    }
  };

  const goToStep = (stepIndex: any) => {
    if (wizardRef.current) {
      wizardRef.current.goToStep(stepIndex);
      setActiveStep(stepIndex);
    }
  };

  const finishStep = () => {
    if (wizardRef.current) {
      wizardRef.current.goToStep(steps.length);
      setActiveStep(steps.length);
    }
  };

  const onSubmit = (data : any) => {
    console.log(data);
  };

  const steps = ['Account', 'Profile', 'Finish'];


  return (
    <Card>
      <Card.Body className="overflow-hidden">
        <h4 className="header-title mb-3">Basic Wizard</h4>

        <ul className="nav nav-pills nav-justified form-wizard-header mb-3">
          {steps.map((step, idx) => (
            <li key={idx} className="nav-item">
              <Button
                className={`nav-link rounded-0 py-2 ${activeStep === idx + 1 ? 'active' : ''}`}
                onClick={() => goToStep(idx + 1)}
              >
                <i className="bi bi-person-circle fs-18 align-middle me-1" />
                <span className="d-none d-sm-inline">{step}</span>
              </Button>
            </li>
          ))}
        </ul>

        <ProgressBar
          animated
          striped
          variant="success"
          style={{ height: '7px' }}
          now={(activeStep / 3) * 100}
          className="mb-3 progress-sm"
        />



        <StepWizard
          instance={(wizard: any) => {
            wizardRef.current = wizard;
          }}
          onStepChange={(stats: any) => setActiveStep(stats.activeStep)}
        >
          <div>
            <Form onSubmit={handleSubmit(onSubmit)}>
              <Form.Group as={Row} className="mb-3">
                <Form.Label htmlFor="email" column md={3}>Email</Form.Label>
                <Col md={9}>
                  <Form.Control
                    type="email"
                    id="email"
                    placeholder="Enter email"
                    {...register('email', { required: 'Email is required' })}
                    isInvalid={!!errors.email}
                  />
                  <Form.Control.Feedback type="invalid">
                   <> {errors.email?.message}</>
                  </Form.Control.Feedback>
                </Col>
              </Form.Group>

              <Form.Group as={Row} className="mb-3">
                <Form.Label htmlFor="password" column md={3}>Password</Form.Label>
                <Col md={9}>
                  <Form.Control
                    type="password"
                    id="password"
                    placeholder="Password"
                    {...register('password', { required: 'Password is required' })}
                    isInvalid={!!errors.password}
                  />
                  <Form.Control.Feedback type="invalid">
                   <> {errors.password?.message}</>
                  </Form.Control.Feedback>
                </Col>
              </Form.Group>

              <Form.Group as={Row} className="mb-3">
                <Form.Label htmlFor="confirmPassword" column md={3}>Re-Password</Form.Label>
                <Col md={9}>
                  <Form.Control
                    type="password"
                    id="confirmPassword"
                    placeholder="Confirm Password"
                    {...register('confirmPassword', { required: 'Confirm password is required' })}
                    isInvalid={!!errors.confirmPassword}
                  />
                  <Form.Control.Feedback type="invalid">
                   <> {errors.confirmPassword?.message} </>
                  </Form.Control.Feedback>
                </Col>
              </Form.Group>

              <WizardButtons
                onPrev={prevStep}
                onNext={nextStep}
                activeStep={activeStep}
                totalSteps={steps.length}
                onFinish={finishStep}
                goToFirstStep={() => goToStep(1)}
              />
            </Form>
          </div>

          <div>
            <Form onSubmit={handleSubmit(onSubmit)}>
              <Form.Group as={Row} className="mb-3">
                <Form.Label htmlFor="fname" column md={3}>First Name</Form.Label>
                <Col md={9}>
                  <Form.Control
                    type="text"
                    id="fname"
                    placeholder="Enter first name"
                    {...register('fname', { required: 'First name is required' })}
                    isInvalid={!!errors.fname}
                  />
                  <Form.Control.Feedback type="invalid">
                   <> {errors.fname?.message}</>
                  </Form.Control.Feedback>
                </Col>
              </Form.Group>

              <Form.Group as={Row} className="mb-3">
                <Form.Label htmlFor="lname" column md={3}>Last Name</Form.Label>
                <Col md={9}>
                  <Form.Control
                    type="text"
                    id="lname"
                    placeholder="Enter last name"
                    {...register('lname', { required: 'Last name is required' })}
                    isInvalid={!!errors.lname}
                  />
                  <Form.Control.Feedback type="invalid">
                   <> {errors.lname?.message}</>
                  </Form.Control.Feedback>
                </Col>
              </Form.Group>

              <Form.Group as={Row} className="mb-3">
                <Form.Label htmlFor="phone" column md={3}>Phone Number</Form.Label>
                <Col md={9}>
                  <Form.Control
                    type="text"
                    id="phone"
                    placeholder="Enter phone number"
                    {...register('phone', { required: 'Phone number is required' })}
                    isInvalid={!!errors.phone}
                  />
                  <Form.Control.Feedback type="invalid">
                   <> {errors.phone?.message}</>
                  </Form.Control.Feedback>
                </Col>
              </Form.Group>

              <WizardButtons
                onPrev={prevStep}
                onNext={nextStep}
                activeStep={activeStep}
                totalSteps={steps.length}
                onFinish={finishStep}
                goToFirstStep={() => goToStep(1)}
              />
            </Form>
          </div>

          <div>
            <Row>
              <Col sm={12}>
                <div className="text-center">
                  <h2 className="mt-0">
                    <i className="mdi mdi-check-all"></i>
                  </h2>
                  <h3 className="mt-0">Thank you!</h3>

                  <p className="w-75 mb-2 mx-auto">
                    Quisque nec turpis at urna dictum luctus. Suspendisse convallis dignissim eros at volutpat. In egestas mattis dui.
                  </p>

                  <div className="mb-3">
                    <Form.Check type="checkbox" className="d-inline-block">
                      <Form.Check.Input type="checkbox" {...register('terms', { required: 'You must agree to the terms and conditions' })} />
                      <Form.Check.Label>
                        I agree with the Terms and Conditions
                      </Form.Check.Label>
                    </Form.Check>
                    {errors.terms && <div className="text-danger"><> {errors.terms.message} </></div>}
                  </div>
                </div>
              </Col>

              <Col sm={12}>
                <WizardButtons
                  onPrev={prevStep}
                  onNext={nextStep}
                  activeStep={activeStep}
                  totalSteps={steps.length}
                  onFinish={finishStep}
                  goToFirstStep={() => goToStep(1)}
                />
              </Col>
            </Row>
          </div>
        </StepWizard>
      </Card.Body>
    </Card>
  );
};


const schema = yup.object({
  email: yup.string().email('Please enter a valid email').required('Please enter email'),
  password: yup.string().required('Please enter password'),
  fName: yup.string().required('Please enter first name'),
  lName: yup.string().required('Please enter last name'),
});


const WizardWithFormValidation = () => {
  const { handleSubmit, control, trigger } = useForm({
    resolver: yupResolver(schema),
  });

  const wizardRef = useRef<StepWizardInstance | null>(null);
  const [activeStep, setActiveStep] = useState(1);



  const nextStep = async () => {
    // For step 1 validation
    if (activeStep === 1) {
      const isValidStep1 = await trigger(['email', 'password']);
      if (isValidStep1 && wizardRef.current) {
        wizardRef.current.nextStep();
        setActiveStep((prev) => prev + 1);
      } else {
        console.log('Step 1 validation failed');
      }
    }

    // For step 2 validation
    if (activeStep === 2) {
      const isValidStep2 = await trigger(['fName', 'lName']);
      if (isValidStep2 && wizardRef.current) {
        wizardRef.current.nextStep();
        setActiveStep((prev) => prev + 1);
      } else {
        console.log('Step 2 validation failed');
      }
    }
  };

  const prevStep = () => {
    if (wizardRef.current) {
      wizardRef.current.previousStep();
      setActiveStep((prev) => prev - 1);
    }
  };


  const goToStep = (stepIndex: any) => {
    if (wizardRef.current) {
      wizardRef.current.goToStep(stepIndex);
      setActiveStep(stepIndex);
    }
  };


  const finishStep = () => {
    if (wizardRef.current) {
      wizardRef.current.goToStep(steps.length);
      setActiveStep(steps.length);
    }
  };


  const steps = ['Account', 'Profile', 'Finish'];

  return (
    <>

      <Card>
        <Card.Body className="overflow-hidden">
          <h4 className="header-title mb-3">Basic Wizard</h4>


          <ul className="nav nav-pills nav-justified form-wizard-header mb-3">
            {steps.map((step, idx) => (
              <li key={idx} className="nav-item">
                <Button
                  className={`nav-link rounded-0 py-2 ${activeStep === idx + 1 ? 'active' : ''}`}
                  onClick={() => goToStep(idx + 1)}
                >
                  <i className="bi bi-person-circle fs-18 align-middle me-1" />
                  <span className="d-none d-sm-inline">{step}</span>
                </Button>
              </li>
            ))}
          </ul>

          <StepWizard
            instance={(wizard: any) => {
              wizardRef.current = wizard;
            }}
            onStepChange={(stats: any) => setActiveStep(stats.activeStep)}
          >
            <div>
              <Controller
                control={control}
                name="email"
                render={({ field, fieldState }) => (
                  <Form.Group className="mb-3">
                    <Form.Label>Email</Form.Label>
                    <Form.Control {...field} type="email" isInvalid={!!fieldState.error} />
                    <Form.Control.Feedback type="invalid">
                      {fieldState.error?.message}
                    </Form.Control.Feedback>
                  </Form.Group>
                )}
              />
              <Controller
                control={control}
                name="password"
                render={({ field, fieldState }) => (
                  <Form.Group className="mb-3">
                    <Form.Label>Password</Form.Label>
                    <Form.Control {...field} type="password" isInvalid={!!fieldState.error} />
                    <Form.Control.Feedback type="invalid">
                      {fieldState.error?.message}
                    </Form.Control.Feedback>
                  </Form.Group>
                )}
              />
              <WizardButtons
                onPrev={prevStep}
                onNext={nextStep}
                activeStep={activeStep}
                totalSteps={steps.length}
                onFinish={finishStep}
                goToFirstStep={() => goToStep(1)}
              />
            </div>

            <div>
              <Controller
                control={control}
                name="fName"
                render={({ field, fieldState }) => (
                  <Form.Group className="mb-3">
                    <Form.Label>First Name</Form.Label>
                    <Form.Control {...field} type="text" isInvalid={!!fieldState.error} />
                    <Form.Control.Feedback type="invalid">
                      {fieldState.error?.message}
                    </Form.Control.Feedback>
                  </Form.Group>
                )}
              />
              <Controller
                control={control}
                name="lName"
                render={({ field, fieldState }) => (
                  <Form.Group className="mb-3">
                    <Form.Label>Last Name</Form.Label>
                    <Form.Control {...field} type="text" isInvalid={!!fieldState.error} />
                    <Form.Control.Feedback type="invalid">
                      {fieldState.error?.message}
                    </Form.Control.Feedback>
                  </Form.Group>
                )}
              />
              <WizardButtons
                onPrev={prevStep}
                onNext={nextStep}
                activeStep={activeStep}
                totalSteps={steps.length}
                onFinish={finishStep}
                goToFirstStep={() => goToStep(1)}
              />
            </div>

            {/* Step 3 */}
            <div>
              <Row>
                <Col sm={12}>
                  <div className="text-center">
                    <h2>
                      <i className="mdi mdi-check-all"></i>
                    </h2>
                    <h3>Thank you!</h3>
                    <p>
                      Quisque nec turpis at urna dictum luctus. Suspendisse convallis dignissim eros at volutpat.
                    </p>
                  </div>
                </Col>
                <Col sm={12}>
                  <WizardButtons
                    onPrev={prevStep}
                    onNext={nextStep}
                    activeStep={activeStep}
                    totalSteps={steps.length}
                    onFinish={finishStep}
                    goToFirstStep={() => goToStep(1)}
                  />
                </Col>
              </Row>
            </div>


          </StepWizard>
        </Card.Body>
      </Card>

    </>
  );
};


const FormWizard = () => {
  return (
    <React.Fragment>


      <Row>
        <Col xl={6}>
          <BasicWizard />
        </Col>

        <Col xl={6}>
          <WizardWithProgressbar />
        </Col>
      </Row>

      <Row>
        <Col lg={6}>
          <WizardWithFormValidation />
        </Col>
      </Row>
    </React.Fragment>
  );
};

export default FormWizard;
