import { HttpAgent, Actor } from "@dfinity/agent";
import { idlFactory as flightIDL } from "../../../declarations/dfinity_js_backend/dfinity_js_backend.did.js";
import { idlFactory as ledgerIDL } from "../../../declarations/ledger_canister/ledger_canister.did.js";

const FLIGHT_CANISTER_ID = "br5f7-7uaaa-aaaaa-qaaca-cai";
const LEDGER_CANISTER_ID = "ryjl3-tyaaa-aaaaa-aaaba-cai";
const HOST = "http://localhost:8080";

export async function getFlightCanister() {
  return await getCanister(FLIGHT_CANISTER_ID, flightIDL);
}

export async function getLedgerCanister() {
  return getCanister(LEDGER_CANISTER_ID, ledgerIDL);
}

async function getCanister(canisterId, idl) {
  const authClient = window.auth.client;
  const agent = new HttpAgent({
    host: HOST,
    identity: authClient.getIdentity(),
  });
  await agent.fetchRootKey(); // this line is needed for the local env only
  return Actor.createActor(idl, {
    agent,
    canisterId,
  });
}
