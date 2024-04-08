import React, { useState } from "react";
import { Button, Modal, Form, FloatingLabel, Stack } from "react-bootstrap";

const updateFlight = ({ flight, save }) => {
 
  const initialDepartureFrom = flight ? flight.departureFrom  : "";
  const initialArriveTo = flight ? flight.arriveTo : "";
  const initialPricePerPerson = flight ? flight.pricePerPerson : "";
  const initialSeats = flight ? flight.seats : "";

  const [departureFrom, setDepartureFrom] = useState(initialDepartureFrom);
  const [arriveTo, setArriveTo] = useState(initialArriveTo);
  const [pricePerPerson, setPricePerPerson] = useState(initialPricePerPerson);
  const [seats, setSeats] = useState(initialSeats);
  
  const isFormFilled = () => departureFrom && arriveTo && pricePerPerson && seats;

  const handleClose = () => setShow(false);
  const handleShow = () => setShow(true);

  const [show, setShow] = useState(false);

  return (
    <>
      <Button
        onClick={handleShow}
        variant=""
        className="rounded-pill px-0"
        style={{ width: "38px" }}
      >
        <i className="bi bi-pencil"></i>
      </Button>
      <Modal show={show} onHide={handleClose} centered>
        <Modal.Header closeButton>
          <Modal.Title>Update Flight</Modal.Title>
        </Modal.Header>
        <Form>
          <Modal.Body>
            <Stack gap={3}>
              <FloatingLabel
                controlId="inputDepartureFrom"
                label="DepartureFrom"
                className="mb-3"
              >
                <Form.Control
                  type="text"
                  placeholder="DepartureFrom"
                  value={departureFrom}
                  onChange={(e) => {
                    setDepartureFrom(e.target.value);
                  }}
                />
              </FloatingLabel>
              <FloatingLabel controlId="inputArriveTo" label="ArriveTo" className="mb-3">
                <Form.Control
                  type="text"
                  placeholder="ArriveTo"
                  value={arriveTo}
                  onChange={(e) => {
                    setArriveTo(e.target.value);
                  }}
                />
              </FloatingLabel>
              <FloatingLabel controlId="inputPricePerPerson" label="PricePerPerson" className="mb-3">
                <Form.Control
                  type="text"
                  placeholder="PricePerPerson"
                  value={pricePerPerson}
                  onChange={(e) => {
                    setPricePerPerson(e.target.value);
                  }}
                />
              </FloatingLabel>
              <FloatingLabel controlId="inputSeats" label="Seats" className="mb-3">
                <Form.Control
                  type="text"
                  placeholder="Seats"
                  value={seats}
                  onChange={(e) => {
                    setSeats(e.target.value);
                  }}
                />
              </FloatingLabel>
            </Stack>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={handleClose}>
              Close
            </Button>
            <Button
              variant="primary"
              onClick={() => {
                save({ id: flight.id, departureFrom, arriveTo, pricePerPerson, seats });
                handleClose();
              }}
              disabled={!isFormFilled()}
            >
              Update
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>
    </>
  );
};

export default updateFlight;