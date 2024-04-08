import React, { useCallback, useState } from "react";
import PropTypes from "prop-types";
import { Button, FloatingLabel, Form, Modal } from "react-bootstrap";
import { LoadingButton } from "@mui/lab";

// import { stringToMicroAlgos } from "../../utils/conversions";

const addFlight = ({ createNewFlight, loading }) => {
  const [name, setName] = useState("");
  const [imageUrl, setImage] = useState("");
  const [description, setDescription] = useState("");
  const [pricePerPerson, setPrice] = useState(0);
  const [departureFrom, setDepartureFrom] = useState("");
  const [arriveTo, setArriveTo] = useState("");
  const [departureTime, setDepartureTime] = useState(0);
  const [seats, setSeats] = useState(0);

  const isFormFilled = useCallback(() => {
    return (
      name &&
      imageUrl && 
      description && 
      departureFrom &&
      arriveTo &&
      departureTime &&
      seats &&
      pricePerPerson > 0
    );
  }, [
    name, 
    imageUrl, 
    description, 
    pricePerPerson,
    departureFrom,
    arriveTo,
    departureTime,
    seats
  ]);

  const [show, setShow] = useState(false);

  const handleClose = () => setShow(false);
  const handleShow = () => setShow(true);

  return (
    <>
      <Button
        onClick={handleShow}
        variant="dark"
        className="rounded-pill px-0"
        style={{ width: "38px" }}
      >
        <i className="bi bi-plus"></i>
      </Button>
      <Modal show={show} onHide={handleClose} centered>
        <Modal.Header closeButton>
          <Modal.Title>New Flight</Modal.Title>
        </Modal.Header>
        <Form>
          <Modal.Body>
            <FloatingLabel
              controlId="inputName"
              label="Flight name"
              className="mb-3"
            >
              <Form.Control
                type="text"
                onChange={(e) => {
                  setName(e.target.value);
                }}
                placeholder="Enter flight name"
              />
            </FloatingLabel>
            <FloatingLabel
              controlId="inputUrl"
              label="Image URL"
              className="mb-3"
            >
              <Form.Control
                type="text"
                placeholder="Image URL"
                value={imageUrl}
                onChange={(e) => {
                  setImage(e.target.value);
                }}
              />
            </FloatingLabel>
            <FloatingLabel
              controlId="inputDescription"
              label="Description"
              className="mb-3"
            >
              <Form.Control
                as="textarea"
                placeholder="description"
                style={{ height: "80px" }}
                max={115}
                onChange={(e) => {
                  setDescription(e.target.value);
                }}
              />
            </FloatingLabel>
            <FloatingLabel
              controlId="inputDepartureFrom"
              label="DepartureFrom"
              className="mb-3"
            >
              <Form.Control
                as="textarea"
                placeholder="departureFrom"
                style={{ height: "80px" }}
                max={115}
                onChange={(e) => {
                  setDepartureFrom(e.target.value);
                }}
              />
            </FloatingLabel>
            <FloatingLabel
              controlId="inputArriveTo"
              label="ArriveTo"
              className="mb-3"
            >
              <Form.Control
                as="textarea"
                placeholder="arriveTo"
                style={{ height: "80px" }}
                max={115}
                onChange={(e) => {
                  setArriveTo(e.target.value);
                }}
              />
            </FloatingLabel>
            <FloatingLabel
              controlId="inputDepartureTime"
              label="DepartureTime"
              className="mb-3"
            >
              <Form.Control
                type="number"
                placeholder="departureTime"
                style={{ height: "80px" }}
                max={115}
                onChange={(e) => {
                  setDepartureTime(e.target.value);
                }}
              />
            </FloatingLabel>
            <FloatingLabel
              controlId="inputSeats"
              label="Seats"
              className="mb-3"
            >
              <Form.Control
                type="number"
                placeholder="Seats"
                onChange={(e) => {
                  setSeats(e.target.value);
                }}
              />
            </FloatingLabel>
            <FloatingLabel
              controlId="inputPrice"
              label="Price Per Person in ICP"
              className="mb-3"
            >
              <Form.Control
                type="text"
                placeholder="Price"
                onChange={(e) => {
                  setPrice(e.target.value);
                }}
              />
            </FloatingLabel>
          </Modal.Body>
        </Form>
        <Modal.Footer>
          <Button variant="outline-secondary" onClick={handleClose}>
            Close
          </Button>
          <Button
            variant="dark"
            disabled={!isFormFilled()}
            onClick={() => {
              createNewFlight({
                name,
                imageUrl,
                description,
                pricePerPerson,
                departureFrom,
                arriveTo,
                departureTime,
                seats,
              });
              handleClose();
            }}
          >
            Save new Flight
          </Button>
        </Modal.Footer>
      </Modal>
    </>
  );
};

addFlight.propTypes = {
  createNewFlight: PropTypes.func.isRequired,
};

export default addFlight;
