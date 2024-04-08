import {
  query,
  update,
  text,
  Record,
  StableBTreeMap,
  Variant,
  Vec,
  None,
  Some,
  Ok,
  Err,
  ic,
  Principal,
  Opt,
  nat64,
  Duration,
  Result,
  bool,
  Canister,
  init,
} from "azle";
import {
  Ledger,
  binaryAddressFromAddress,
  binaryAddressFromPrincipal,
  hexAddressFromPrincipal,
} from "azle/canisters/ledger";
//@ts-ignore
import { hashCode } from "hashcode";
import { v4 as uuidv4 } from "uuid";

const Flight = Record({
  id: text,
  name: text,
  imageUrl: text,
  description: text,
  pricePerPerson: nat64,
  departureFrom: text,
  arriveTo: text,
  departureTime: nat64,
  seats: nat64,
  isReserved: bool,
  isAvailable: bool,
  currentReservedTo: Opt(Principal),
  currentReservationEnds: Opt(nat64),
  creator: Principal,
});

const FlightPayload = Record({
  name: text,
  imageUrl: text,
  description: text,
  pricePerPerson: nat64,
  departureFrom: text, 
  arriveTo: text,
  departureTime: nat64,
  seats: nat64,
});

const UpdateFlightPayload = Record({
  id: text,
  name: text,
  imageUrl: text,
  description: text,
  pricePerPerson: nat64,
  departureFrom: text, 
  arriveTo: text,
  departureTime: nat64,
  seats: nat64,
});


const User = Record({
  id: text,
  name: text,
  phoneNo: text,
  email: text,
  bookedFlight: Vec(text),
});

const UserPayload = Record({
  name: text,
  email: text,
  phoneNo: text,
});

const UpdateUserPayload = Record({
  id: text,
  email: text,
  phoneNo: text,
  
});

const InitPayload = Record({
  reservationFee: nat64,
});

const ReservationStatus = Variant({
  PaymentPending: text,
  Completed: text,
});

const Booking = Record({
  flightId: text,
  amount: nat64,
  noOfPersons: nat64,
  status: ReservationStatus,
  payer: Principal,
  paid_at_block: Opt(nat64),
  memo: nat64,
});

const Message = Variant({
  Booked: text,
  NotBooked: text,
  NotFound: text,
  NotOwner: text,
  InvalidPayload: text,
  PaymentFailed: text,
  PaymentCompleted: text,
});

const flightsStorage = StableBTreeMap(0, text, Flight);
const persistedBookings = StableBTreeMap(1, Principal, Booking);
const pendingBookings = StableBTreeMap(2, nat64, Booking);
const userStorage = StableBTreeMap(3, text, User);


// fee to be charged upon flight reservation and refunded after flight is left
let reservationFee: Opt<nat64> = None;

const ORDER_RESERVATION_PERIOD = 120n; // reservation period in seconds

/* 
    initialization of the Ledger canister. The principal text value is hardcoded because 
    we set it in the `dfx.json`
*/
const icpCanister = Ledger(Principal.fromText("ryjl3-tyaaa-aaaaa-aaaba-cai"));

export default Canister({
  // set reservation fee
  initData: init([InitPayload], (payload) => {
    reservationFee = Some(payload.reservationFee);
  }),

  // return flights reservation fee
  getFlights: query([], Vec(Flight), () => {
    return flightsStorage.values();
  }),

  getUsers: query([], Vec(User), () => {
    return userStorage.values();
  }),

  // return bookings
  getBookings: query([], Vec(Booking), () => {
    return persistedBookings.values();
  }),

  // return pending bookings
  getPendings: query([], Vec(Booking), () => {
    return pendingBookings.values();
  }),

  // return a particular flight
  getFlight: query([text], Result(Flight, Message), (id) => {
    const flightOpt = flightsStorage.get(id);
    if ("None" in flightOpt) {
      return Err({ NotFound: `flight with id=${id} not found` });
    }
    return Ok(flightOpt.Some);
  }),



// return flights based on price
getFlightByPrice: query([nat64], Result(Vec(Flight), Message), (maxPrice) => {
  const filteredFlights = flightsStorage.values().filter((flight) => flight.pricePerPerson <= maxPrice);
  return Ok(filteredFlights);
}),

// return flights based on departure and arrival places
getFlightByPlace: query([text, text], Result(Vec(Flight), Message), (departurePlace, arrivalPlace) => {
  const filteredFlights = flightsStorage.values().filter((flight) => 
    flight.departureFrom.toLowerCase() === departurePlace.toLowerCase() &&
    flight.arriveTo.toLowerCase() === arrivalPlace.toLowerCase()
  );
  return Ok(filteredFlights);
}),



  // add new flight
  addFlight: update([FlightPayload], Result(Flight, Message), (payload) => {
    if (typeof payload !== "object" || Object.keys(payload).length === 0) {
      return Err({ NotFound: "invalid payoad" });
    }
    const flight = {
      id: uuidv4(),
      isReserved: false,
      isAvailable: true,
      currentReservedTo: None,
      currentReservationEnds: None,
      creator: ic.caller(),
      ...payload,
    };
    flightsStorage.insert(flight.id, flight);
    return Ok(flight);
  }),


  //update flight
  updateFlight: update([UpdateFlightPayload], Result(Flight, Message), (payload) => {
    const flightOpt = flightsStorage.get(payload.id);
    if ("None" in flightOpt) {
      return Err({ NotFound: `flight with id=${payload.id} not found` });
    }
    const flight = flightOpt.Some;
    const updatedFlight = {
      ...flight,
      ...payload,
    };
    flightsStorage.insert(flight.id, updatedFlight);
    return Ok(updatedFlight);
  }),

  
  // delete flight
  deleteFlight: update([text], Result(text, Message), (id) => {
    // check flight before deleting
    const flightOpt = flightsStorage.get(id);
    if ("None" in flightOpt) {
      return Err({
        NotFound: `cannot delete the flight: flight with id=${id} not found`,
      });
    }

    if (flightOpt.Some.creator.toString() !== ic.caller().toString()) {
      return Err({ NotOwner: "only creator can delete flight" });
    }

    if (flightOpt.Some.isReserved) {
      return Err({
        Booked: `flight with id ${id} is currently booked`,
      });
    }
    const deletedRoomOpt = flightsStorage.remove(id);

    return Ok(deletedRoomOpt.Some.id);
  }),


  //add user
  addUser: update([UserPayload], Result(User, Message), (payload) => {
    if (typeof payload !== "object" || Object.keys(payload).length === 0) {
      return Err({ NotFound: "invalid payoad" });
    }
    const userId = uuidv4();
    const user = {
      id: userId,
      bookedFlight: [],
      ...payload,
    };
    userStorage.insert(userId, user);
    return Ok(user);
  }),

  getUser: query([text], Opt(User), (userId) => {
    return userStorage.get(userId);
  }),

  //update user
  updateUser: update([UpdateUserPayload], Result(User, Message), (payload) => {
    const userOpt = userStorage.get(payload.id);
    if ("None" in userOpt) {
      return Err({ NotFound: `user with id=${payload.id} not found` });
    }
    const user = userOpt.Some;
    const updatedUser = {
      ...user,
      ...payload,
    };
    userStorage.insert(user.id, updatedUser);
    return Ok(updatedUser);
  }),

  //delete user
  deleteUser: update([text], Result(text, Message), (userId) => {
    const user = userStorage.get(userId);
    if ("None" in user) {
      return Err({ NotFound: `User with ID ${userId} not found` });
    }
    userStorage.remove(userId);
    return Ok(`User with ID ${userId} deleted`);
  }),

  
  // create booking for flight reservation
  createReservationOrder: update(
    [text, nat64],
    Result(Booking, Message),
    (id, noOfPersons) => {
      const flightOpt = flightsStorage.get(id);
      if ("None" in flightOpt) {
        return Err({
          NotFound: `cannot create the booking: flight=${id} not found`,
        });
      }

      if ("None" in reservationFee) {
        return Err({
          NotFound: "reservation fee not set",
        });
      }

      const flight = flightOpt.Some;

      if (flight.isReserved) {
        return Err({
          Booked: `flight with id ${id} is currently booked`,
        });
      }

      // calculate total amount to be spent plus reservation fee
      let amountToBePaid =
        noOfPersons * flight.pricePerPerson + reservationFee.Some;

      // generate booking
      const booking = {
        flightId: flight.id,
        amount: amountToBePaid,
        noOfPersons,
        status: { PaymentPending: "PAYMENT_PENDING" },
        payer: ic.caller(),
        paid_at_block: None,
        memo: generateCorrelationId(id),
      };

      pendingBookings.insert(booking.memo, booking);

      discardByTimeout(booking.memo, ORDER_RESERVATION_PERIOD);

      return Ok(booking);
    }
  ),

  // complete flight reservation
  completeReservation: update(
    [text, nat64, nat64, nat64],
    Result(Booking, Message),
    async (id, noOfPersons, block, memo) => {
      // get flight
      const flightOpt = flightsStorage.get(id);
      if ("None" in flightOpt) {
        throw Error(`flight with id=${id} not found`);
      }

      const flight = flightOpt.Some;

      // check reservation fee is set
      if ("None" in reservationFee) {
        return Err({
          NotFound: "reservation fee not set",
        });
      }

      // calculate total amount to be spent plus reservation fee
      let amount = noOfPersons * flight.pricePerPerson + reservationFee.Some;

      // check payments
      const paymentVerified = await verifyPaymentInternal(
        ic.caller(),
        amount,
        block,
        memo
      );

      if (!paymentVerified) {
        return Err({
          NotFound: `cannot complete the purchase: cannot verify the payment, memo=${memo}`,
        });
      }

      const pendingBookingOpt = pendingBookings.remove(memo);
      if ("None" in pendingBookingOpt) {
        return Err({
          NotFound: `cannot complete the purchase: there is no pending booking with id=${id}`,
        });
      }

      const booking = pendingBookingOpt.Some;
      const updatedBooking = {
        ...booking,
        status: { Completed: "COMPLETED" },
        paid_at_block: Some(block),
      };

      // calculate noOfNights in minutes (testing)
      let durationInMins = BigInt(60 * 1000000000);

      // get updated record
      const updatedFlight = {
        ...flight,
        currentReservedTo: Some(ic.caller()),
        isReserved: true,
        currentReservationEnds: Some(ic.time() + durationInMins),
      };

      flightsStorage.insert(flight.id, updatedFlight);
      persistedBookings.insert(ic.caller(), updatedBooking);
      return Ok(updatedBooking);
    }
  ),

  // end reservation and receive your refund
  // complete flight reservation
  endReservation: update([text], Result(Message, Message), async (id) => {
    // get flight
    const flightOpt = flightsStorage.get(id);
    if ("None" in flightOpt) {
      return Err({ NotFound: `flight with id=${id} not found` });
    }

    const flight = flightOpt.Some;

    if (!flight.isReserved) {
      return Err({ NotBooked: "flight is not reserved" });
    }

    if ("None" in flight.currentReservationEnds) {
      return Err({ NotBooked: "reservation time not set" });
    }

    if (flight.currentReservationEnds.Some > ic.time()) {
      return Err({ Booked: "booking time not yet over" });
    }

    if ("None" in flight.currentReservedTo) {
      return Err({ NotBooked: "flight not reserved to anyone" });
    }

    if (flight.currentReservedTo.Some.toString() !== ic.caller().toString()) {
      return Err({ Booked: "only booker of flight can unbook" });
    }

    // check reservation fee is set
    if ("None" in reservationFee) {
      return Err({
        NotFound: "reservation fee not set",
      });
    }

    const result = await makePayment(ic.caller(), reservationFee.Some);

    if ("Err" in result) {
      return result;
    }

    // get updated record
    const updatedFlight = {
      ...flight,
      currentReservedTo: None,
      isReserved: false,
      currentReservationEnds: None,
    };

    flightsStorage.insert(flight.id, updatedFlight);

    return result;
  }),

  // a helper function to get canister address from the principal
  getCanisterAddress: query([], text, () => {
    let canisterPrincipal = ic.id();
    return hexAddressFromPrincipal(canisterPrincipal, 0);
  }),

  // a helper function to get address from the principal
  getAddressFromPrincipal: query([Principal], text, (principal) => {
    return hexAddressFromPrincipal(principal, 0);
  }),

  // returns the reservation fee
  getReservationFee: query([], nat64, () => {
    if ("None" in reservationFee) {
      return BigInt(0);
    }
    return reservationFee.Some;
  }),
});

/*
    a hash function that is used to generate correlation ids for bookings.
    also, we use that in the verifyPayment function where we check if the used has actually paid the booking
*/
function hash(input: any): nat64 {
  return BigInt(Math.abs(hashCode().value(input)));
}

// a workaround to make uuid package work with Azle
globalThis.crypto = {
  // @ts-ignore
  getRandomValues: () => {
    let array = new Uint8Array(32);

    for (let i = 0; i < array.length; i++) {
      array[i] = Math.floor(Math.random() * 256);
    }

    return array;
  },
};

// to process refund of reservation fee to flights.
async function makePayment(address: Principal, amount: nat64) {
  const toAddress = hexAddressFromPrincipal(address, 0);
  const transferFeeResponse = await ic.call(icpCanister.transfer_fee, {
    args: [{}],
  });
  const transferResult = ic.call(icpCanister.transfer, {
    args: [
      {
        memo: 0n,
        amount: {
          e8s: amount - transferFeeResponse.transfer_fee.e8s,
        },
        fee: {
          e8s: transferFeeResponse.transfer_fee.e8s,
        },
        from_subaccount: None,
        to: binaryAddressFromAddress(toAddress),
        created_at_time: None,
      },
    ],
  });
  if ("Err" in transferResult) {
    return Err({ PaymentFailed: `refund failed, err=${transferResult.Err}` });
  }
  return Ok({ PaymentCompleted: "refund completed" });
}

function generateCorrelationId(productId: text): nat64 {
  const correlationId = `${productId}_${ic.caller().toText()}_${ic.time()}`;
  return hash(correlationId);
}

/*
    after the booking is created, we give the `delay` amount of minutes to pay for the booking.
    if it's not paid during this timeframe, the booking is automatically removed from the pending bookings.
*/
function discardByTimeout(memo: nat64, delay: Duration) {
  ic.setTimer(delay, () => {
    const booking = pendingBookings.remove(memo);
    console.log(`Order discarded ${booking}`);
  });
}

async function verifyPaymentInternal(
  sender: Principal,
  amount: nat64,
  block: nat64,
  memo: nat64
): Promise<bool> {
  const blockData = await ic.call(icpCanister.query_blocks, {
    args: [{ start: block, length: 1n }],
  });
  const tx = blockData.blocks.find((block) => {
    if ("None" in block.transaction.operation) {
      return false;
    }
    const operation = block.transaction.operation.Some;
    const senderAddress = binaryAddressFromPrincipal(sender, 0);
    const receiverAddress = binaryAddressFromPrincipal(ic.id(), 0);
    return (
      block.transaction.memo === memo &&
      hash(senderAddress) === hash(operation.Transfer?.from) &&
      hash(receiverAddress) === hash(operation.Transfer?.to) &&
      amount === operation.Transfer?.amount.e8s
    );
  });
  return tx ? true : false;
}
